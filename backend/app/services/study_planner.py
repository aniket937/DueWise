from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Tuple, Optional
from app.models.models import Task
from app.schemas.schemas import GeneratePlanRequest

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

def generate_deterministic_schedule(
    active_tasks: List[Task],
    config: GeneratePlanRequest
) -> Tuple[List[Dict[str, Any]], int, Optional[str]]:
    """
    Deterministic study plan generator.
    Respects daily study capacity, session lengths, deadline constraints, and avoids duplicates.
    """
    try:
        start_dt = datetime.strptime(config.week_start_date, "%Y-%m-%d").date()
    except ValueError:
        start_dt = date.today()

    available_days_set = set(config.available_days)
    daily_cap = config.available_daily_minutes
    session_dur = max(config.session_duration_minutes, 15)

    # Build 7-day calendar for the week
    week_days = []
    daily_allocated = {}
    for i in range(7):
        current_date = start_dt + timedelta(days=i)
        day_name = DAY_NAMES[current_date.weekday()]
        is_allowed = day_name in available_days_set
        week_days.append({
            "date": current_date,
            "date_str": current_date.strftime("%Y-%m-%d"),
            "day_name": day_name,
            "allowed": is_allowed,
            "max_minutes": daily_cap if is_allowed else 0
        })
        daily_allocated[current_date.strftime("%Y-%m-%d")] = 0

    total_capacity = sum(d["max_minutes"] for d in week_days)

    # Sort tasks: deadline first (null deadlines at the end), then priority (high > medium > low)
    def task_sort_key(t: Task):
        prio_weight = {"high": 1, "medium": 2, "low": 3}.get((t.priority or "medium").lower(), 2)
        if t.due_date:
            due_d = t.due_date.date() if isinstance(t.due_date, datetime) else t.due_date
            return (0, due_d, prio_weight)
        return (1, date.max, prio_weight)

    sorted_tasks = sorted(active_tasks, key=task_sort_key)

    plan_items: List[Dict[str, Any]] = []
    total_planned_minutes = 0
    unscheduled_tasks = []

    for task in sorted_tasks:
        remaining_task_minutes = task.estimated_effort_minutes or 45
        task_due_date = None
        if task.due_date:
            task_due_date = task.due_date.date() if isinstance(task.due_date, datetime) else task.due_date

        task_scheduled_any = False

        # Attempt to schedule chunks across available days
        for day in week_days:
            if not day["allowed"]:
                continue

            # Constraint: Do not schedule work after its deadline
            if task_due_date and day["date"] > task_due_date:
                continue

            current_alloc = daily_allocated[day["date_str"]]
            remaining_cap = day["max_minutes"] - current_alloc
            if remaining_cap < 15:
                continue

            chunk = min(remaining_task_minutes, session_dur, remaining_cap)
            if chunk >= 15:
                chunk_title = task.title
                if remaining_task_minutes > session_dur:
                    chunk_title = f"{task.title} (Part)"

                plan_items.append({
                    "task_id": task.id,
                    "day_of_week": day["day_name"],
                    "scheduled_date": day["date_str"],
                    "title": chunk_title,
                    "subject": task.subject or "Academics",
                    "duration_minutes": chunk,
                    "is_completed": False,
                    "order_index": len(plan_items)
                })

                daily_allocated[day["date_str"]] += chunk
                remaining_task_minutes -= chunk
                total_planned_minutes += chunk
                task_scheduled_any = True

            if remaining_task_minutes <= 0:
                break

        if remaining_task_minutes > 0 and not task_scheduled_any:
            unscheduled_tasks.append(task.title)

    # Check for overload
    overload_warning = None
    total_requested_work = sum(t.estimated_effort_minutes or 45 for t in sorted_tasks)
    if total_requested_work > total_capacity:
        overload_warning = (
            f"Workload notice: Your active tasks require ~{total_requested_work // 60}h {total_requested_work % 60}m, "
            f"which exceeds this week's capacity of {total_capacity // 60}h. "
            f"{len(unscheduled_tasks)} task(s) could not be fully fitted into this week."
        )

    return plan_items, total_planned_minutes, overload_warning
