# Company info, product names/categories/prices, and policy details below are
# real, scraped from https://www.lampatron.ae/ (homepage, contact, shipping
# policy, refund policy, and new-products listing pages). Prices reflect what
# was displayed on the site at scrape time -- as with any e-commerce catalog,
# treat them as indicative and confirm current pricing before quoting a firm
# figure to a customer.

COMPANY = {
    "name": "Lampatron",
    "business_type": "Premium designer lighting store specializing in novelty chandeliers and lamps",
    "website": "https://www.lampatron.ae",
    "email": "info@lampatron.ae",
    "phone": "+357 96629291",
    "whatsapp": "+357 96629291",
    "instagram": "https://www.instagram.com/lampatron_ae/",
    "business_hours": "Monday-Saturday 9 AM - 8 PM UAE time; Sunday 9 AM - online orders only, UAE time",
    "operating_since": 2021,
    "market": "UAE (ships worldwide)",
}

PRICING_NOTE = (
    "Prices below were scraped from the live Lampatron.ae catalog and are in AED. "
    "They are real listed prices, not placeholders, but an e-commerce catalog changes "
    "over time -- confirm the current price on the product page or with the team "
    "before treating a quoted figure as final, especially for older enquiries."
)

PRODUCTS = [
    # ── Pendants ───────────────────────────────────────────────────────────
    {"title": "UVE", "category": "PENDANT", "price_aed": 3688},
    {"title": "YGGE", "category": "PENDANT", "price_aed": 3031},
    {"title": "RID", "category": "PENDANT", "price_aed": 2202},
    {"title": "TOFT DOME", "category": "PENDANT", "price_aed": 2147},
    {"title": "PIO", "category": "PENDANT", "price_aed": 2904},
    {"title": "PROBUS", "category": "PENDANT", "price_aed": 3853},
    {"title": "RIVER", "category": "PENDANT", "price_aed": 15447},
    {"title": "LIND", "category": "PENDANT", "price_aed": 2352},
    {"title": "LEIF", "category": "PENDANT", "price_aed": 1176},
    {"title": "PIET WOOD", "category": "PENDANT", "price_aed": 1645},
    # ── Chandeliers ────────────────────────────────────────────────────────
    {"title": "RADIANT", "category": "CHANDELIER", "price_aed": 6327},
    {"title": "LELLE", "category": "CHANDELIER", "price_aed": 4129},
    {"title": "Cafe", "category": "CHANDELIER", "price_aed": 5896},
    {"title": "Celebrity", "category": "CHANDELIER", "price_aed": 6547},
    {"title": "Catarina", "category": "CHANDELIER", "price_aed": 8220},
    {"title": "Federica", "category": "RING_CHANDELIER", "price_aed": 48949},
    # ── Ring chandeliers and lamps ─────────────────────────────────────────
    {"title": "ELIS", "category": "RING_CHANDELIER", "price_aed": 5277},
    {"title": "IVES", "category": "RING_CHANDELIER", "price_aed": 10468},
    {"title": "LASSE", "category": "RING_CHANDELIER", "price_aed": 6558},
    # ── Wall lamps and sconces ─────────────────────────────────────────────
    {"title": "LONA STONE", "category": "WALL_LAMP", "price_aed": 1480},
    {"title": "ARD", "category": "WALL_LAMP", "price_aed": 1180},
    {"title": "LUKE", "category": "WALL_LAMP", "price_aed": 547},
]

# Categories the store organizes its full catalog into (beyond the specific
# products listed above, which are just a sample of what's currently listed).
CATALOG_CATEGORIES = [
    "Pendant lights",
    "Chandeliers",
    "Wall lamps / sconces",
    "Ring chandeliers and lamps",
    "Line lamps and long chandeliers",
    "Cascade lamps and staircase lighting",
    "Ceiling lights",
    "Spot lights",
    "Table lamps",
    "Floor lamps",
    "SKYLINE tension track system",
]

FAQS = [
    {
        "title": "Contacting Lampatron",
        "content": (
            f"You can reach Lampatron by phone or WhatsApp at {COMPANY['whatsapp']}, or by email at "
            f"{COMPANY['email']}. Business hours are {COMPANY['business_hours']}. Lampatron has been "
            "operating since 2021, serving the UAE market with worldwide shipping."
        ),
    },
    {
        "title": "How orders are made and manufactured",
        "content": (
            "Lampatron is a strictly made-to-order store: manufacturing only begins after an order is "
            "placed, to ensure the highest quality of production. Production typically takes nine "
            "working days, plus up to seven days of quality control before the item is dispatched from "
            "the warehouse. Products may ship from warehouses in China, Hong Kong, or Russia depending "
            "on the item."
        ),
    },
    {
        "title": "Shipping costs and delivery times",
        "content": (
            "Standard shipping is free on all packages. Most orders arrive within 3 to 6 weeks from "
            "order to delivery. If faster delivery is needed, customers can contact customer service in "
            "advance or purchase an expedited shipping upgrade (via DHL or FedEx), which can arrive "
            "within 7 to 12 days with an advance quote. Lampatron guarantees delivery within 90 days; if "
            "that isn't met, the customer is notified, the order is cancelled, and a refund is issued. "
            "Customers are responsible for providing a correct shipping address -- Lampatron is not "
            "responsible for lost or misdelivered packages caused by an incorrect address."
        ),
    },
    {
        "title": "Cancelling an order",
        "content": (
            "Orders can be cancelled within 6 hours of placing them, before manufacturing begins. Once "
            "production has started, the order can no longer be cancelled for a full refund since it is "
            "custom made to order."
        ),
    },
    {
        "title": "Returns and refunds",
        "content": (
            "Standard returns are accepted within 7 days of receiving the item; EU customers have a "
            "14-day cooling-off period during which they can return an item for any reason. Returned "
            "items must be unused, unmarked, not installed, with tags attached, and in original "
            "packaging (a 30% deduction applies if the original packaging is missing), along with proof "
            "of purchase. Customers must inspect items within 12 hours of receipt -- failure to do so "
            "voids return eligibility -- and report any faults immediately to info@lampatron.ae with a "
            "video showing the defect. Returns must be authorised by Lampatron first; unauthorised "
            "returns are rejected and no return shipping label is provided. Approved refunds are issued "
            "as store credit with no expiry date, processed after inspection, which can take 15 or more "
            "business days. Custom or made-to-order products, sale items, gift cards, and pre-ordered "
            "items cannot be refunded for a change of mind."
        ),
    },
    {
        "title": "Product colour and finish variation",
        "content": (
            "Because manufacturing technology and materials keep developing, slight colour or texture "
            "variations can occur between production batches of the same product. This is normal and "
            "not considered a defect."
        ),
    },
    {
        "title": "Warranty",
        "content": "Lampatron products come with a 2-year warranty.",
    },
    {
        "title": "Business and trade enquiries",
        "content": (
            "Lampatron offers special conditions for businesses, including interior designers, "
            "wholesale retailers, and lighting project specialists, through a dedicated designer's offer "
            "enquiry. Interested trade customers should contact Lampatron directly to discuss terms."
        ),
    },
    {
        "title": "Company track record",
        "content": "Lampatron states it has served over 15,000 satisfied customers.",
    },
]
