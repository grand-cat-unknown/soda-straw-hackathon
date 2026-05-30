from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

tool_name = "tables"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class ColumnSpec(BaseModel):
    name: str
    type: str  # text | number | money | date | status | person | place


class TableCreate(BaseModel):
    name: str
    columns: list[ColumnSpec]
    linked_intent_id: str | None = None


class Row(BaseModel):
    id: str
    values: dict[str, Any]


class Table(BaseModel):
    id: str
    name: str
    columns: list[ColumnSpec]
    rows: list[Row] = Field(default_factory=list)
    linked_intent_id: str | None = None


class RowAdd(BaseModel):
    values: dict[str, Any]


class TablesResponse(BaseModel):
    tables: list[Table]


class RowsResponse(BaseModel):
    table_id: str
    rows: list[Row]
    grouped: dict[str, list[Row]] | None = None


tables: list[Table] = [
    Table(
        id="tbl_001",
        name="RSVP Tracker",
        columns=[
            ColumnSpec(name="guest", type="person"),
            ColumnSpec(name="status", type="status"),
            ColumnSpec(name="plus_ones", type="number"),
        ],
        rows=[
            Row(id="row_001", values={"guest": "Maya Rao", "status": "yes", "plus_ones": 1}),
            Row(id="row_002", values={"guest": "Leo Martins", "status": "maybe", "plus_ones": 0}),
        ],
    )
]


capabilities = [
    {
        "id": "tables.list",
        "tool": "tables",
        "name": "List Tables",
        "description": "List all tables (structured lists and trackers).",
        "method": "GET",
        "endpoint": "/tables",
        "output_model": "TablesResponse",
        "tags": ["structured", "data"],
    },
    {
        "id": "tables.create",
        "tool": "tables",
        "name": "Create Table",
        "description": "Create a new table with typed columns.",
        "method": "POST",
        "endpoint": "/tables",
        "input_model": "TableCreate",
        "output_model": "Table",
        "tags": ["structured", "data", "action"],
    },
    {
        "id": "tables.get",
        "tool": "tables",
        "name": "Get Table",
        "description": "Read a single table including rows.",
        "method": "GET",
        "endpoint": "/tables/{table_id}",
        "output_model": "Table",
        "tags": ["structured", "data"],
    },
    {
        "id": "tables.add_row",
        "tool": "tables",
        "name": "Add Row",
        "description": "Append a row to a table.",
        "method": "POST",
        "endpoint": "/tables/{table_id}/rows",
        "input_model": "RowAdd",
        "output_model": "Row",
        "tags": ["structured", "data", "action"],
    },
    {
        "id": "tables.query",
        "tool": "tables",
        "name": "Query Rows",
        "description": "Filter, sort, and group rows in a table.",
        "method": "GET",
        "endpoint": "/tables/{table_id}/rows",
        "output_model": "RowsResponse",
        "tags": ["structured", "data"],
    },
]


def _find_table(table_id: str) -> Table:
    for table in tables:
        if table.id == table_id:
            return table
    raise HTTPException(status_code=404, detail=f"Table {table_id} not found.")


@router.get("", response_model=TablesResponse)
def list_tables():
    return TablesResponse(tables=tables)


@router.post("", response_model=Table, status_code=201)
def create_table(payload: TableCreate):
    table = Table(
        id=f"tbl_{len(tables) + 1:03d}",
        name=payload.name,
        columns=payload.columns,
        rows=[],
        linked_intent_id=payload.linked_intent_id,
    )
    tables.append(table)
    return table


@router.get("/{table_id}", response_model=Table)
def get_table(table_id: str):
    return _find_table(table_id)


@router.post("/{table_id}/rows", response_model=Row, status_code=201)
def add_row(table_id: str, payload: RowAdd):
    table = _find_table(table_id)
    row = Row(id=f"row_{len(table.rows) + 1:03d}", values=payload.values)
    table.rows.append(row)
    return row


@router.get("/{table_id}/rows", response_model=RowsResponse)
def query_rows(
    table_id: str,
    filter: str | None = Query(default=None, description="Format: column:value"),
    sort: str | None = Query(default=None, description="Column name to sort ascending."),
    group_by: str | None = Query(default=None, description="Column name to group rows by."),
):
    table = _find_table(table_id)
    rows = list(table.rows)

    if filter:
        if ":" not in filter:
            raise HTTPException(status_code=400, detail="filter must be 'column:value'.")
        col, _, val = filter.partition(":")
        rows = [row for row in rows if str(row.values.get(col)) == val]

    if sort:
        rows.sort(key=lambda row: (row.values.get(sort) is None, row.values.get(sort)))

    grouped: dict[str, list[Row]] | None = None
    if group_by:
        grouped = {}
        for row in rows:
            key = str(row.values.get(group_by))
            grouped.setdefault(key, []).append(row)

    return RowsResponse(table_id=table_id, rows=rows, grouped=grouped)
