import ast
import math
import operator
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


tool_name = "calculator"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class ComputeRequest(BaseModel):
    expression: str
    variables: dict[str, float] = Field(default_factory=dict)


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
    "sqrt": math.sqrt,
    "log": math.log,
    "exp": math.exp,
    "floor": math.floor,
    "ceil": math.ceil,
}

_BINARY_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_UNARY_OPERATORS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}

_MAX_EXPRESSION_LENGTH = 500
_MAX_ABS_VALUE = 1_000_000_000_000


def _safe_number(value: object) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError("Expression must use numbers only.")
    number = float(value)
    if not math.isfinite(number) or abs(number) > _MAX_ABS_VALUE:
        raise ValueError("Expression produced an unsupported number.")
    return number


def _compute_node(node: ast.AST, variables: dict[str, float]) -> float:
    if isinstance(node, ast.Expression):
        return _compute_node(node.body, variables)

    if isinstance(node, ast.Expr):
        return _compute_node(node.value, variables)

    if isinstance(node, ast.Constant):
        return _safe_number(node.value)

    if isinstance(node, ast.Name):
        if node.id not in variables:
            raise ValueError(f"Unknown variable: {node.id}")
        return _safe_number(variables[node.id])

    if isinstance(node, ast.UnaryOp):
        op = _UNARY_OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError("Unsupported unary operator.")
        return _safe_number(op(_compute_node(node.operand, variables)))

    if isinstance(node, ast.BinOp):
        op = _BINARY_OPERATORS.get(type(node.op))
        if op is None:
            raise ValueError("Unsupported binary operator.")
        left = _compute_node(node.left, variables)
        right = _compute_node(node.right, variables)
        if isinstance(node.op, ast.Pow) and abs(right) > 10:
            raise ValueError("Exponent is too large.")
        return _safe_number(op(left, right))

    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name) or node.func.id not in _SAFE_FUNCS:
            raise ValueError("Unsupported function.")
        if node.keywords:
            raise ValueError("Keyword arguments are not supported.")
        if len(node.args) > 8:
            raise ValueError("Too many function arguments.")
        args = [_compute_node(arg, variables) for arg in node.args]
        return _safe_number(_SAFE_FUNCS[node.func.id](*args))

    raise ValueError("Unsupported expression element.")


def compute_expression(expression: str, variables: dict[str, float]) -> float:
    if len(expression) > _MAX_EXPRESSION_LENGTH:
        raise ValueError("Expression is too long.")
    if any(not name.isidentifier() or name.startswith("_") for name in variables):
        raise ValueError("Variable names must be public identifiers.")

    tree = ast.parse(expression, mode="exec")
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.Expr):
        raise ValueError("Expression must contain a single calculation.")
    return _compute_node(tree.body[0], variables)


@router.post("/compute", response_model=ComputeResponse)
def compute(payload: ComputeRequest):
    try:
        value = compute_expression(payload.expression, payload.variables)
    except (SyntaxError, ValueError, ArithmeticError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not compute: {exc}") from exc

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
