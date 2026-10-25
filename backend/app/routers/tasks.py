from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Task, Subtask
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskResponse, SubtaskCreate, SubtaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    subject_filter: Optional[str] = Query(None, alias="subject"),
    search: Optional[str] = Query(None),
    sort_by: str = Query("due_date", pattern="^(due_date|priority|effort|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).options(selectinload(Task.subtasks))

    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority_filter:
        query = query.where(Task.priority == priority_filter)
    if subject_filter:
        query = query.where(Task.subject == subject_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.where((Task.title.ilike(search_pattern)) | (Task.description.ilike(search_pattern)))

    # Sorting
    if sort_by == "priority":
        # Order by high, medium, low
        order_col = Task.priority
    elif sort_by == "effort":
        order_col = Task.estimated_effort_minutes
    elif sort_by == "created_at":
        order_col = Task.created_at
    else:
        order_col = Task.due_date

    if sort_order == "desc":
        query = query.order_by(order_col.desc().nullslast())
    else:
        query = query.order_by(order_col.asc().nullslast())

    result = await db.execute(query)
    tasks = result.scalars().all()

    now = datetime.utcnow()
    response_list = []
    for t in tasks:
        is_overdue = bool(t.due_date and t.due_date < now and t.status != "completed")
        t_dict = TaskResponse.model_validate(t)
        t_dict.is_overdue = is_overdue
        response_list.append(t_dict)

    return response_list

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(
        title=payload.title,
        description=payload.description,
        subject=payload.subject,
        due_date=payload.due_date,
        priority=payload.priority,
        estimated_effort_minutes=payload.estimated_effort_minutes,
        status=payload.status,
        source_document_id=payload.source_document_id,
        evidence_text=payload.evidence_text,
        is_sample=False
    )
    db.add(task)
    await db.flush()

    if payload.subtasks:
        for st in payload.subtasks:
            sub = Subtask(
                task_id=task.id,
                title=st.title,
                estimated_minutes=st.estimated_minutes,
                is_completed=False
            )
            db.add(sub)

    await db.commit()
    # Reload with subtasks
    result = await db.execute(select(Task).options(selectinload(Task.subtasks)).where(Task.id == task.id))
    reloaded = result.scalar_one()
    return reloaded

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).options(selectinload(Task.subtasks)).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    now = datetime.utcnow()
    is_overdue = bool(task.due_date and task.due_date < now and task.status != "completed")
    t_res = TaskResponse.model_validate(task)
    t_res.is_overdue = is_overdue
    return t_res

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).options(selectinload(Task.subtasks)).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "status" and val == "completed" and task.status != "completed":
            task.completed_at = datetime.utcnow()
        elif field == "status" and val != "completed":
            task.completed_at = None
        setattr(task, field, val)

    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    now = datetime.utcnow()
    is_overdue = bool(task.due_date and task.due_date < now and task.status != "completed")
    t_res = TaskResponse.model_validate(task)
    t_res.is_overdue = is_overdue
    return t_res

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    await db.delete(task)
    await db.commit()
    return None

@router.post("/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
async def add_subtask(task_id: int, payload: SubtaskCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    subtask = Subtask(
        task_id=task.id,
        title=payload.title,
        estimated_minutes=payload.estimated_minutes,
        is_completed=False
    )
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask

@router.patch("/{task_id}/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(task_id: int, subtask_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subtask).where(Subtask.id == subtask_id, Subtask.task_id == task_id))
    subtask = result.scalar_one_or_none()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found.")

    subtask.is_completed = not subtask.is_completed
    await db.commit()
    await db.refresh(subtask)
    return subtask
