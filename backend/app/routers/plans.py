from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import StudyPlan, StudyPlanItem, Task
from app.schemas.schemas import GeneratePlanRequest, StudyPlanResponse, StudyPlanItemResponse, StudyPlanItemUpdate
from app.services.study_planner import generate_deterministic_schedule

router = APIRouter(prefix="/plans", tags=["Study Plans"])

@router.get("/current", response_model=Optional[StudyPlanResponse])
async def get_current_plan(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudyPlan)
        .options(selectinload(StudyPlan.items))
        .where(StudyPlan.is_active == True)
        .order_by(StudyPlan.created_at.desc())
    )
    plan = result.scalars().first()
    if not plan:
        return None

    # Calculate total planned minutes
    total_mins = sum(item.duration_minutes for item in plan.items)
    res = StudyPlanResponse.model_validate(plan)
    res.total_planned_minutes = total_mins
    return res

@router.post("/generate", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
async def generate_plan(payload: GeneratePlanRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch active tasks (status != "completed")
    tasks_res = await db.execute(select(Task).where(Task.status != "completed"))
    active_tasks = tasks_res.scalars().all()

    # 2. Deactivate existing plans
    existing_plans = await db.execute(select(StudyPlan).where(StudyPlan.is_active == True))
    for p in existing_plans.scalars().all():
        p.is_active = False

    # 3. Schedule
    items_data, total_planned_minutes, overload_warning = generate_deterministic_schedule(
        active_tasks=active_tasks,
        config=payload
    )

    # 4. Save new Plan
    new_plan = StudyPlan(
        week_start_date=payload.week_start_date,
        available_daily_minutes=payload.available_daily_minutes,
        session_duration_minutes=payload.session_duration_minutes,
        available_days=",".join(payload.available_days),
        is_active=True
    )
    db.add(new_plan)
    await db.flush()

    # Add items
    for item_data in items_data:
        plan_item = StudyPlanItem(
            plan_id=new_plan.id,
            task_id=item_data.get("task_id"),
            day_of_week=item_data["day_of_week"],
            scheduled_date=item_data["scheduled_date"],
            title=item_data["title"],
            subject=item_data.get("subject"),
            duration_minutes=item_data["duration_minutes"],
            is_completed=False,
            order_index=item_data.get("order_index", 0)
        )
        db.add(plan_item)

    await db.commit()

    # Reload
    reloaded_res = await db.execute(
        select(StudyPlan)
        .options(selectinload(StudyPlan.items))
        .where(StudyPlan.id == new_plan.id)
    )
    reloaded_plan = reloaded_res.scalar_one()

    plan_response = StudyPlanResponse.model_validate(reloaded_plan)
    plan_response.total_planned_minutes = total_planned_minutes
    plan_response.overload_warning = overload_warning
    return plan_response

@router.patch("/items/{item_id}", response_model=StudyPlanItemResponse)
async def update_plan_item(
    item_id: int,
    payload: StudyPlanItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(StudyPlanItem).where(StudyPlanItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Study plan item not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(item, field, val)

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudyPlanItem).where(StudyPlanItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Study plan item not found.")

    await db.delete(item)
    await db.commit()
    return None
