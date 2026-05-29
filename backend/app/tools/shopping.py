from fastapi import APIRouter, Query
from pydantic import BaseModel

tool_name = "shopping"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class ShoppingItem(BaseModel):
    id: str
    name: str
    category: str
    price: float
    serves: int


class ShoppingSearchResponse(BaseModel):
    items: list[ShoppingItem]


catalog = [
    ShoppingItem(id="sku_001", name="Sparkling water pack", category="drinks", price=8.5, serves=8),
    ShoppingItem(id="sku_002", name="Tortilla chips", category="snacks", price=3.2, serves=4),
    ShoppingItem(id="sku_003", name="Salsa trio", category="snacks", price=5.4, serves=6),
    ShoppingItem(id="sku_004", name="Paper plates", category="supplies", price=4.8, serves=20),
    ShoppingItem(id="sku_005", name="String lights", category="decor", price=14.0, serves=1),
    ShoppingItem(id="sku_006", name="Lemonade bottles", category="drinks", price=6.7, serves=10),
]

capabilities = [
    {
        "id": "shopping.search",
        "tool": "shopping",
        "name": "Search Shopping Catalog",
        "description": "Find mocked products by name or category.",
        "method": "GET",
        "endpoint": "/shopping/search",
        "output_model": "ShoppingSearchResponse",
        "tags": ["shopping", "party"],
    }
]


@router.get("/search", response_model=ShoppingSearchResponse)
def search_shopping(q: str | None = Query(default=None, description="Product or category search text.")):
    if not q:
        return ShoppingSearchResponse(items=catalog)

    query = q.lower()
    return ShoppingSearchResponse(
        items=[item for item in catalog if query in f"{item.name} {item.category}".lower()]
    )
