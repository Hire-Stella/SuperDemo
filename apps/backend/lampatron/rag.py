from collections import defaultdict
from pathlib import Path

from google.genai import types as genai_types
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from knowledge_data import CATALOG_CATEGORIES, PRODUCTS, FAQS

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768
COLLECTION_NAME = "lampatron_knowledge"
# Lives under apps/backend/lampatron/, separate from the FIT knowledge base
# under apps/backend/fit/, so both can run as independent processes at the
# same time without fighting over the same embedded Qdrant file lock.
QDRANT_PATH = str(Path(__file__).parent / "qdrant_data")

_qdrant = QdrantClient(path=QDRANT_PATH)


def _product_to_text(product: dict) -> str:
    return (
        f"{product['title']} -- {product['category'].replace('_', ' ').title()}. "
        f"Price: AED {product['price_aed']}."
    )


def _category_summary_documents() -> list[dict]:
    """
    One product-level chunk per item isn't enough for broad "what types of
    chandeliers do you have" questions -- top_k retrieval over 22 individual
    product chunks doesn't reliably surface enough of one category together.
    Add one dense summary chunk per category so those questions have a single
    chunk that lists every matching product at once.
    """
    grouped = defaultdict(list)
    for product in PRODUCTS:
        grouped[product["category"]].append(product)

    docs = []
    for category, items in grouped.items():
        label = category.replace("_", " ").title()
        listing = ", ".join(f"{p['title']} (AED {p['price_aed']})" for p in items)
        docs.append({
            "text": f"{label} products available at Lampatron: {listing}.",
            "title": f"{label} category overview",
        })
    return docs


def _build_documents():
    docs = [
        {"text": _product_to_text(product), "title": product["title"]}
        for product in PRODUCTS
    ]
    docs += _category_summary_documents()
    docs.append({
        "text": "Lampatron's full catalog is organized into these categories: "
                + "; ".join(CATALOG_CATEGORIES) + ".",
        "title": "Catalog categories overview",
    })
    docs += [
        {"text": f"{faq['title']}: {faq['content']}", "title": faq["title"]}
        for faq in FAQS
    ]
    for i, doc in enumerate(docs):
        doc["id"] = i
    return docs


def _embed(genai_client, texts: list[str], task_type: str) -> list[list[float]]:
    response = genai_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config=genai_types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=EMBEDDING_DIM,
        ),
    )
    return [embedding.values for embedding in response.embeddings]


def ensure_ingested(genai_client) -> None:
    if _qdrant.collection_exists(COLLECTION_NAME):
        if _qdrant.get_collection(COLLECTION_NAME).points_count:
            return
    else:
        _qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )

    docs = _build_documents()
    vectors = _embed(genai_client, [doc["text"] for doc in docs], task_type="RETRIEVAL_DOCUMENT")
    points = [
        PointStruct(id=doc["id"], vector=vector, payload={"text": doc["text"], "title": doc["title"]})
        for doc, vector in zip(docs, vectors)
    ]
    _qdrant.upsert(collection_name=COLLECTION_NAME, points=points, wait=True)


def retrieve(genai_client, query: str, top_k: int = 4, score_threshold: float = 0.45) -> list[str]:
    """
    score_threshold drops weak matches instead of always returning top_k
    regardless of relevance -- without it, something like "hi" or "thanks"
    still forces back 4 unrelated product/FAQ chunks, which pushes the chat
    model to awkwardly work irrelevant context into a casual reply.
    """
    [query_vector] = _embed(genai_client, [query], task_type="RETRIEVAL_QUERY")
    hits = _qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=top_k,
        score_threshold=score_threshold,
    ).points
    return [hit.payload["text"] for hit in hits]
