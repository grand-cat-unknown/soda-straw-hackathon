import math
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


tool_name = "calculator"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class ComputeRequest(BaseModel):
    expression: str
    variables: dict[str, float] = {}


class ComputeResponse(BaseModel):
    value: float
    expression: str


class ScoreRequest(BaseModel):
    options: list[dict[str, Any]]  # each option must include the criteria keys plus a "name"
    criteria: list[str]
    weights: dict[str, float]


class ScoredOption(BaseModel):
    option: dict[str, Any]
    score: float
    breakdown: dict[str, float]


class ScoreResponse(BaseModel):
    ranked: list[ScoredOption]


capabilities = [
    {
        "id": "calculator.compute",
        "tool": "calculator",
        "name": "Compute Expression",
        "description": "Evaluate an arithmetic expression with named variables.",
        "method": "POST",
        "endpoint": "/calculator/compute",
        "input_model": "ComputeRequest",
        "output_model": "ComputeResponse",
        "tags": ["math"],
    },
    {
        "id": "calculator.score_options",
        "tool": "calculator",
        "name": "Score Options",
        "description": "Score and rank a list of options against weighted criteria.",
        "method": "POST",
        "endpoint": "/calculator/score",
        "input_model": "ScoreRequest",
        "output_model": "ScoreResponse",
        "tags": ["math", "ranking"],
    },
]


_SAFE_FUNCS = {
    "abs": abs,
    "min": min,
    "max": max,
    "round": round,
    "sum": sum,
    "sqrt": math.sqrt,
    "log": math.log,
    "exp": math.exp,
    "floor": math.floor,
    "ceil": math.ceil,
}


@router.post("/compute", response_model=ComputeResponse)
def compute(payload: ComputeRequest):
    if any(token in payload.expression for token in ("__", "import", "lambda", ";", "\n")):
        raise HTTPException(status_code=400, detail="Disallowed token in expression.")
    try:
        value = eval(  # noqa: S307 — restricted environment
            payload.expression,
            {"__builtins__": {}},
            {**_SAFE_FUNCS, **payload.variables},
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not evaluate: {exc}") from exc

    if not isinstance(value, (int, float)):
        raise HTTPException(status_code=400, detail="Expression must evaluate to a number.")

    return ComputeResponse(value=float(value), expression=payload.expression)


@router.post("/score", response_model=ScoreResponse)
def score_options(payload: ScoreRequest):
    scored: list[ScoredOption] = []
    for option in payload.options:
        breakdown: dict[str, float] = {}
        total = 0.0
        for criterion in payload.criteria:
            raw = option.get(criterion, 0)
            try:
                numeric = float(raw)
            except (TypeError, ValueError):
                numeric = 0.0
            weight = float(payload.weights.get(criterion, 0.0))
            contribution = numeric * weight
            breakdown[criterion] = round(contribution, 4)
            total += contribution
        scored.append(ScoredOption(option=option, score=round(total, 4), breakdown=breakdown))

    scored.sort(key=lambda item: item.score, reverse=True)
    return ScoreResponse(ranked=scored)
