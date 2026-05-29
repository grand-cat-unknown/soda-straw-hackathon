from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    due: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    due: str | None = None
    status: str | None = None


class Task(BaseModel):
    id: str
    title: str
    status: str
    due: str | None = None


class TasksResponse(BaseModel):
    tasks: list[Task]


tasks = [
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
        "description": "Create a mocked task.",
        "method": "POST",
        "endpoint": "/tasks",
        "input_model": "TaskCreate",
        "output_model": "Task",
        "tags": ["planning", "action"],
    },
    {
        "id": "tasks.update",
        "tool": "tasks",
        "name": "Update Task",
        "description": "Update title, due date, or status for a mocked task.",
        "method": "PATCH",
        "endpoint": "/tasks/{task_id}",
        "input_model": "TaskUpdate",
        "output_model": "Task",
        "tags": ["planning", "action"],
    },
]


@router.get("", response_model=TasksResponse)
def list_tasks(status: str | None = None):
    if status:
        return TasksResponse(tasks=[task for task in tasks if task.status == status])

    return TasksResponse(tasks=tasks)


@router.post("", response_model=Task, status_code=201)
def create_task(payload: TaskCreate):
    task = Task(id=f"t_{len(tasks) + 1:03d}", title=payload.title, status="open", due=payload.due)
    tasks.append(task)
    return task


@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: str, payload: TaskUpdate):
    for index, task in enumerate(tasks):
        if task.id != task_id:
            continue

        updated = task.model_copy(update=payload.model_dump(exclude_unset=True))
        tasks[index] = updated
        return updated

    raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")
