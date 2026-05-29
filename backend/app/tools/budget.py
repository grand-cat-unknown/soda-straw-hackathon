from fastapi import APIRouter
from pydantic import BaseModel, Field

tool_name = "budget"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class BudgetEstimateRequest(BaseModel):
    guest_count: int = Field(default=8, ge=1)
    per_guest: float = Field(default=14, ge=0)
    categories: list[str] = Field(default_factory=lambda: ["drinks", "snacks", "supplies"])
    currency: str = "EUR"


class BudgetLineItem(BaseModel):
    category: str
    estimate: float


class BudgetEstimateResponse(BaseModel):
    guest_count: int
    per_guest: float
    currency: str
    line_items: list[BudgetLineItem]
    total: float


capabilities = [
    {
        "id": "budget.estimate",
        "tool": "budget",
        "name": "Estimate Budget",
        "description": "Estimate cost from guest count, per-guest spend, and categories.",
        "method": "POST",
        "endpoint": "/budget/estimate",
        "input_model": "BudgetEstimateRequest",
        "output_model": "BudgetEstimateResponse",
        "tags": ["budget", "planning"],
    }
]


@router.post("/estimate", response_model=BudgetEstimateResponse)
def estimate_budget(payload: BudgetEstimateRequest):
    line_items = []

    for category in payload.categories:
        multiplier = 0.25 if category == "decor" else 1
        estimate = round(payload.guest_count * payload.per_guest * multiplier, 2)
        line_items.append(BudgetLineItem(category=category, estimate=estimate))

    total = round(sum(item.estimate for item in line_items), 2)

    return BudgetEstimateResponse(
        guest_count=payload.guest_count,
        per_guest=payload.per_guest,
        currency=payload.currency,
        line_items=line_items,
        total=total,
    )
