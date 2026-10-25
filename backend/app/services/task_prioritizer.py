from datetime import datetime
from typing import List, Optional, Tuple
from app.models.models import Task
from app.schemas.schemas import TaskResponse, NextActionResponse
from app.services.openrouter_service import is_openrouter_configured, call_openrouter

def calculate_task_urgency_score(task: Task, now: datetime) -> Tuple[float, str]:
    """
    Calculate deterministic urgency score for a task.
    Higher score means more urgent.
    """
    score: float = 0.0
    reason_parts = []

    # 1. Deadline proximity
    if task.due_date:
        task_due = task.due_date
        # Ensure timezone-naive comparison
        if task_due.tzinfo is not None:
            task_due = task_due.replace(tzinfo=None)

        diff = task_due - now
        hours_remaining = diff.total_seconds() / 3600.0

        if hours_remaining < 0:
            overdue_days = abs(hours_remaining) / 24.0
            score += 1000.0 + min(overdue_days * 50.0, 500.0)
            reason_parts.append(f"Overdue by {overdue_days:.1f} day(s)")
        elif hours_remaining <= 24:
            score += 500.0 + (24.0 - hours_remaining) * 10.0
            reason_parts.append(f"Due today (in {int(hours_remaining)} hours)")
        elif hours_remaining <= 72:
            score += 250.0 + (72.0 - hours_remaining) * 2.0
            reason_parts.append(f"Due in {int(hours_remaining // 24)} days")
        elif hours_remaining <= 168:
            score += 100.0 + (168.0 - hours_remaining) * 0.5
            reason_parts.append("Due this week")
        else:
            score += 30.0
            reason_parts.append("Upcoming deadline")
    else:
        score += 20.0
        reason_parts.append("Flexible deadline")

    # 2. Priority boost
    prio = (task.priority or "medium").lower()
    if prio == "high":
        score += 60.0
        reason_parts.append("High priority")
    elif prio == "medium":
        score += 30.0
    elif prio == "low":
        score += 10.0

    # 3. Status boost (finish what was started)
    if task.status == "in_progress":
        score += 40.0
        reason_parts.append("Already in progress")

    # 4. Sloth momentum bonus: small/manageable tasks get a boost to overcome procrastination
    effort = task.estimated_effort_minutes or 30
    if effort <= 30:
        score += 25.0
        reason_parts.append("Quick win (≤30m)")
    elif effort <= 60:
        score += 15.0

    reason_str = " • ".join(reason_parts)
    return score, reason_str

async def get_next_recommended_action(active_tasks: List[Task]) -> NextActionResponse:
    """
    Find the single best next action using deterministic scoring,
    with an optional AI contextual Sloth tip if OpenRouter is active.
    """
    if not active_tasks:
        return NextActionResponse(
            recommended_task=None,
            reason="You have no active tasks pending. Relax like a true sloth or upload a new syllabus!",
            urgency_level="chill",
            suggested_focus="Relaxation & Planning",
            ai_explanation="All clear! Take a restful break knowing your schedule is up to date.",
            total_active_tasks=0,
            estimated_minutes=0
        )

    now = datetime.utcnow()
    scored_tasks = []
    total_minutes = 0

    for task in active_tasks:
        effort = task.estimated_effort_minutes or 30
        total_minutes += effort
        score, reason = calculate_task_urgency_score(task, now)
        scored_tasks.append((score, task, reason))

    # Sort descending by score
    scored_tasks.sort(key=lambda x: x[0], reverse=True)
    best_score, top_task, primary_reason = scored_tasks[0]

    # Urgency level classification
    if best_score >= 1000:
        urgency_level = "critical"
        suggested_focus = "Immediate Rescue: Overdue Assignment"
    elif best_score >= 500:
        urgency_level = "high"
        suggested_focus = "Critical Deadline: Tackle Today"
    elif best_score >= 250:
        urgency_level = "medium"
        suggested_focus = "High Impact: Prepare in Advance"
    else:
        urgency_level = "low"
        suggested_focus = "Steady Progress: Gentle Momentum"

    # Format top task as TaskResponse
    task_res = TaskResponse(
        id=top_task.id,
        title=top_task.title,
        description=top_task.description,
        subject=top_task.subject,
        due_date=top_task.due_date,
        priority=top_task.priority,
        estimated_effort_minutes=top_task.estimated_effort_minutes,
        status=top_task.status,
        evidence_text=top_task.evidence_text,
        source_document_id=top_task.source_document_id,
        is_sample=top_task.is_sample,
        created_at=top_task.created_at,
        updated_at=top_task.updated_at,
        completed_at=top_task.completed_at,
        subtasks=[],
        is_overdue=bool(top_task.due_date and top_task.due_date < now)
    )

    ai_explanation: Optional[str] = None
    if is_openrouter_configured():
        try:
            prompt = f"The student needs to do: '{top_task.title}' ({top_task.subject or 'General'}, {top_task.estimated_effort_minutes} mins). Reason: {primary_reason}. Give 1 sentence of encouraging, concise academic advice in the spirit of 'steady sloth wins the race'."
            ai_explanation = await call_openrouter(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=60,
                temperature=0.3,
                timeout=5.0
            )
        except Exception:
            ai_explanation = None

    if not ai_explanation:
        ai_explanation = f"Focus solely on '{top_task.title}' for {top_task.estimated_effort_minutes or 30} minutes. Doing just this one task will immediately relieve pressure."

    return NextActionResponse(
        recommended_task=task_res,
        reason=primary_reason,
        urgency_level=urgency_level,
        suggested_focus=suggested_focus,
        ai_explanation=ai_explanation,
        total_active_tasks=len(active_tasks),
        estimated_minutes=top_task.estimated_effort_minutes or 30
    )
