from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Task, Document, StudyPlan
from app.schemas.schemas import DashboardResponse, DashboardStats, TaskResponse, DocumentResponse, StudyPlanResponse
from app.services.task_prioritizer import get_next_recommended_action

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    three_days_later = now + timedelta(days=3)

    # 1. Tasks query
    tasks_res = await db.execute(select(Task).options(selectinload(Task.subtasks)))
    all_tasks = tasks_res.scalars().all()

    active_tasks = [t for t in all_tasks if t.status != "completed"]
    completed_tasks = [t for t in all_tasks if t.status == "completed"]

    overdue_tasks = [
        t for t in active_tasks
        if t.due_date and t.due_date < now
    ]
    due_soon_tasks = [
        t for t in active_tasks
        if t.due_date and now <= t.due_date <= three_days_later
    ]

    total_tasks_count = len(all_tasks)
    completion_rate = (len(completed_tasks) / total_tasks_count * 100.0) if total_tasks_count > 0 else 0.0

    # 2. Documents query
    docs_res = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(4))
    recent_docs = docs_res.scalars().all()

    total_docs_count_res = await db.execute(select(func.count(Document.id)))
    total_docs_count = total_docs_count_res.scalar_one() or 0

    # 3. Active Study Plan
    plan_res = await db.execute(
        select(StudyPlan)
        .options(selectinload(StudyPlan.items))
        .where(StudyPlan.is_active == True)
        .order_by(StudyPlan.created_at.desc())
    )
    active_plan = plan_res.scalars().first()
    planned_minutes = sum(item.duration_minutes for item in active_plan.items) if active_plan else 0

    # 4. Next Action Recommendation
    next_action = await get_next_recommended_action(active_tasks)

    # 5. Upcoming Deadlines (up to 5 active tasks sorted by due_date)
    upcoming_tasks_sorted = sorted(
        [t for t in active_tasks if t.due_date],
        key=lambda x: x.due_date
    )[:5]

    upcoming_responses = []
    for t in upcoming_tasks_sorted:
        t_res = TaskResponse.model_validate(t)
        t_res.is_overdue = bool(t.due_date and t.due_date < now)
        upcoming_responses.append(t_res)

    stats = DashboardStats(
        active_tasks=len(active_tasks),
        completed_tasks=len(completed_tasks),
        due_soon_tasks=len(due_soon_tasks),
        overdue_tasks=len(overdue_tasks),
        total_study_minutes_planned=planned_minutes,
        completion_rate_percentage=round(completion_rate, 1),
        total_documents=total_docs_count
    )

    plan_summary = None
    if active_plan:
        plan_summary = StudyPlanResponse.model_validate(active_plan)
        plan_summary.total_planned_minutes = planned_minutes

    return DashboardResponse(
        stats=stats,
        next_action=next_action,
        upcoming_deadlines=upcoming_responses,
        recent_documents=[DocumentResponse.model_validate(d) for d in recent_docs],
        weekly_plan_summary=plan_summary
    )
