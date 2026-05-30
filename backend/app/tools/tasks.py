from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

tool_name = "tasks"
router = APIRouter(prefix=f"/{tool_name}", tags=[tool_name])


class TaskCreate(BaseModel):
    title: str
    due: str | None = None
    owner: str | None = None
    status: str = "open"
    dependencies: list[str] = Field(default_factory=list)
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: str | None = None
    due: str | None = None
    status: str | None = None
    owner: str | None = None
    dependencies: list[str] | None = None
    linked_intent_id: str | None = None
    linked_entities: list[str] | None = None


class Task(BaseModel):
    id: str
    title: str
    status: str
    due: str | None = None
    owner: str | None = None
    dependencies: list[str] = Field(default_factory=list)
    linked_intent_id: str | None = None
    linked_entities: list[str] = Field(default_factory=list)


class TasksResponse(BaseModel):
    tasks: list[Task]


tasks: list[Task] = [
    Task(id="t_001", title="Buy drinks", status="open", due="2026-05-30"),
    Task(id="t_002", title="Prepare playlist", status="open", due="2026-05-30"),
    Task(id="t_003", title="Send invites", status="done", due="2026-05-29"),
]

capabilities = [
    {
        "id": "tasks.list",
        "tool": "tasks",
        "name": "List Tasks",
        "description": "Read open and completed tasks.",
        "method": "GET",
        "endpoint": "/tasks",
        "output_model": "TasksResponse",
        "tags": ["planning", "todo"],
    },
    {
        "id": "tasks.create",
        "tool": "tasks",
        "name": "Create Task",
        "description": "Create a task with optional owner, due date, dependencies, and links.",
        "method": "POST",
        "endpoint": "/tasks",
        "input_model": "TaskCreate",
        "output_model": "Task",
        "tags": ["planning", "action"],
    },
    {
        "id": "tasks.get",
        "tool": "tasks",
        "name": "Get Task",
        "description": "Fetch one task by ID.",
        "method": "GET",
        "endpoint": "/tasks/{task_id}",
        "output_model": "Task",
        "tags": ["planning"],
    },
    {
        "id": "tasks.update",
        "tool": "tasks",
        "name": "Update Task",
        "description": "Update fields on a task (title, due, status, owner, dependencies, links).",
        "method": "PATCH",
        "endpoint": "/tasks/{task_id}",
        "input_model": "TaskUpdate",
        "output_model": "Task",
        "tags": ["planning", "action"],
    },
    {
        "id": "tasks.delete",
        "tool": "tasks",
        "name": "Delete Task",
        "description": "Delete a task by ID.",
        "method": "DELETE",
        "endpoint": "/tasks/{task_id}",
        "tags": ["planning", "action"],
    },
]


@router.get("", response_model=TasksResponse)
def list_tasks(status: str | None = None, linked_intent_id: str | None = None):
    items = tasks
    if status:
        items = [task for task in items if task.status == status]
    if linked_intent_id:
        items = [task for task in items if task.linked_intent_id == linked_intent_id]
    return TasksResponse(tasks=items)


@router.post("", response_model=Task, status_code=201)
def create_task(payload: TaskCreate):
    task = Task(id=f"t_{len(tasks) + 1:03d}", **payload.model_dump())
    tasks.append(task)
    return task


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str):
    for task in tasks:
        if task.id == task_id:
            return task
    raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")


@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: str, payload: TaskUpdate):
    for index, task in enumerate(tasks):
        if task.id != task_id:
            continue

        updated = task.model_copy(update=payload.model_dump(exclude_unset=True))
        tasks[index] = updated
        return updated

    raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str):
    for index, task in enumerate(tasks):
        if task.id == task_id:
            del tasks[index]
            return
    raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
