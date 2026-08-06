from pathlib import Path

from google.genai import types as genai_types
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from knowledge_data import COURSES, FAQS

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768
COLLECTION_NAME = "fit_knowledge"
QDRANT_PATH = str(Path(__file__).parent / "qdrant_data")

_qdrant = QdrantClient(path=QDRANT_PATH)


def _course_to_text(course: dict) -> str:
    outcomes = "; ".join(course["outcomes"])
    return (
        f"{course['title']} ({course['category']}). For: {course['audience']}. "
        f"Duration: {course['duration_weeks']} weeks. Schedule: {course['schedule']}. "
        f"Indicative fee: AED {course['fee_aed_from']}-{course['fee_aed_to']} "
        f"(provisional, confirm with admissions). Learning outcomes: {outcomes}."
    )


def _build_documents():
    docs = [
        {"id": i, "text": _course_to_text(course), "title": course["title"]}
        for i, course in enumerate(COURSES)
    ]
    offset = len(COURSES)
    docs += [
        {"id": offset + i, "text": f"{faq['title']}: {faq['content']}", "title": faq["title"]}
        for i, faq in enumerate(FAQS)
    ]
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


def retrieve(genai_client, query: str, top_k: int = 4) -> list[str]:
    [query_vector] = _embed(genai_client, [query], task_type="RETRIEVAL_QUERY")
    hits = _qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=top_k,
    ).points
    return [hit.payload["text"] for hit in hits]
