from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.core.database import get_db
from app.models.models import Document, Task, Subtask, StudyPlan, StudyPlanItem, RevisionItem

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

SAMPLE_SYLLABUS_TEXT = """COURSE SYLLABUS: CS301 - Distributed Systems & Cloud Computing
Instructor: Dr. Eleanor Vance
Term: Fall 2026 | Credits: 4.0

Course Description:
Comprehensive introduction to distributed systems concepts including consensus algorithms (Raft, Paxos),
vector clocks, distributed transactions, CAP theorem, and fault tolerance in large-scale cloud clusters.

Grading Breakdown:
- Programming Labs (4 assignments): 40%
- Midterm Examination: 25%
- Final Project & Oral Defense: 25%
- Reading Quizzes & Homework: 10%

Key Deadlines & Schedule:
1. Lab 1: RPC & Key-Value Store Implementation - Due in 2 days at 11:59 PM.
2. Reading Assignment: 'Time, Clocks, and the Ordering of Events' by Leslie Lamport - Due in 4 days.
3. Midterm Examination: Written exam covering consensus and clock synchronization - Due in 7 days at 2:00 PM.
4. Lab 2: Raft Consensus Leader Election - Due in 14 days at 11:59 PM.
5. Final Distributed Database Project Proposal - Due in 21 days.

Academic Integrity & Late Policy:
All lab implementations must be submitted through GitHub Classroom. Late submissions lose 10% per day.
Work steadily: cramming distributed algorithms leads to catastrophic bugs."""

@router.post("/load", status_code=status.HTTP_201_CREATED)
async def load_sample_data(db: AsyncSession = Depends(get_db)):
    """
    Populate database with rich sample academic data clearly marked with is_sample=True.
    """
    now = datetime.utcnow()

    # 1. Sample Document
    doc = Document(
        filename="CS301_Distributed_Systems_Syllabus.txt",
        original_name="CS301_Distributed_Systems_Syllabus.txt",
        mime_type="text/plain",
        file_size=len(SAMPLE_SYLLABUS_TEXT.encode("utf-8")),
        extracted_text=SAMPLE_SYLLABUS_TEXT,
        text_preview=SAMPLE_SYLLABUS_TEXT[:350] + "...",
        page_count=1,
        word_count=len(SAMPLE_SYLLABUS_TEXT.split()),
        processing_status="completed",
        ai_summary="Syllabus for CS301 Distributed Systems covering consensus algorithms, key-value stores, and exam milestones.",
        is_sample=True
    )
    db.add(doc)
    await db.flush()

    # 2. Sample Tasks
    t1 = Task(
        title="Lab 1: RPC Key-Value Store",
        description="Implement reliable RPC interface and key-value store cache invalidation logic.",
        subject="CS301 Distributed Systems",
        due_date=now + timedelta(days=2),
        priority="high",
        estimated_effort_minutes=90,
        status="in_progress",
        source_document_id=doc.id,
        evidence_text="Lab 1: RPC & Key-Value Store Implementation - Due in 2 days at 11:59 PM.",
        is_sample=True
    )
    t2 = Task(
        title="Read Lamport Logical Clocks Paper",
        description="Read 'Time, Clocks, and the Ordering of Events' and prepare 3 discussion questions.",
        subject="CS301 Distributed Systems",
        due_date=now + timedelta(days=4),
        priority="medium",
        estimated_effort_minutes=45,
        status="pending",
        source_document_id=doc.id,
        evidence_text="Reading Assignment: 'Time, Clocks, and the Ordering of Events' by Leslie Lamport - Due in 4 days.",
        is_sample=True
    )
    t3 = Task(
        title="Midterm Exam Prep: Raft & Paxos",
        description="Review consensus safety invariant proofs and term election edge cases.",
        subject="CS301 Distributed Systems",
        due_date=now + timedelta(days=7),
        priority="high",
        estimated_effort_minutes=120,
        status="pending",
        source_document_id=doc.id,
        evidence_text="Midterm Examination: Written exam covering consensus and clock synchronization - Due in 7 days.",
        is_sample=True
    )
    t4 = Task(
        title="Lab 2: Raft Leader Election",
        description="Handle heartbeat timers, split-vote mitigation, and term increments.",
        subject="CS301 Distributed Systems",
        due_date=now + timedelta(days=14),
        priority="medium",
        estimated_effort_minutes=60,
        status="pending",
        source_document_id=doc.id,
        evidence_text="Lab 2: Raft Consensus Leader Election - Due in 14 days at 11:59 PM.",
        is_sample=True
    )
    t5 = Task(
        title="Submit Course Welcome Survey",
        description="Confirm lab partner preferences and compute cluster credentials.",
        subject="CS301 Distributed Systems",
        due_date=now - timedelta(days=1),
        priority="low",
        estimated_effort_minutes=15,
        status="completed",
        completed_at=now - timedelta(hours=12),
        source_document_id=doc.id,
        evidence_text="Orientation requirement for cluster access.",
        is_sample=True
    )

    db.add_all([t1, t2, t3, t4, t5])
    await db.flush()

    # Subtasks
    st1 = Subtask(task_id=t1.id, title="Implement protobuf client stubs", estimated_minutes=30, is_completed=True)
    st2 = Subtask(task_id=t1.id, title="Write unit tests for network partition drops", estimated_minutes=30, is_completed=False)
    st3 = Subtask(task_id=t1.id, title="Benchmark concurrent put/get throughput", estimated_minutes=30, is_completed=False)
    db.add_all([st1, st2, st3])

    # 3. Sample Study Plan
    today_str = now.strftime("%Y-%m-%d")
    plan = StudyPlan(
        week_start_date=today_str,
        available_daily_minutes=120,
        session_duration_minutes=45,
        available_days="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        is_active=True
    )
    db.add(plan)
    await db.flush()

    # Plan Items
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    p_item1 = StudyPlanItem(
        plan_id=plan.id,
        task_id=t1.id,
        day_of_week=days[0],
        scheduled_date=(now).strftime("%Y-%m-%d"),
        title="Lab 1: RPC Key-Value Store (Part 1)",
        subject="CS301 Distributed Systems",
        duration_minutes=45,
        is_completed=True,
        order_index=0
    )
    p_item2 = StudyPlanItem(
        plan_id=plan.id,
        task_id=t1.id,
        day_of_week=days[0],
        scheduled_date=(now).strftime("%Y-%m-%d"),
        title="Lab 1: RPC Key-Value Store (Part 2)",
        subject="CS301 Distributed Systems",
        duration_minutes=45,
        is_completed=False,
        order_index=1
    )
    p_item3 = StudyPlanItem(
        plan_id=plan.id,
        task_id=t2.id,
        day_of_week=days[1],
        scheduled_date=(now + timedelta(days=1)).strftime("%Y-%m-%d"),
        title="Read Lamport Logical Clocks Paper",
        subject="CS301 Distributed Systems",
        duration_minutes=45,
        is_completed=False,
        order_index=0
    )
    p_item4 = StudyPlanItem(
        plan_id=plan.id,
        task_id=t3.id,
        day_of_week=days[2],
        scheduled_date=(now + timedelta(days=2)).strftime("%Y-%m-%d"),
        title="Midterm Prep: Raft Leader Election",
        subject="CS301 Distributed Systems",
        duration_minutes=45,
        is_completed=False,
        order_index=0
    )
    db.add_all([p_item1, p_item2, p_item3, p_item4])

    # 4. Sample Revision Flashcards
    r1 = RevisionItem(
        source_document_id=doc.id,
        subject="CS301 Distributed Systems",
        topic="CAP Theorem",
        question="What does the CAP theorem state regarding distributed data stores?",
        answer="A distributed system can guarantee at most two out of Consistency, Availability, and Partition Tolerance simultaneously.",
        is_completed=True,
        is_sample=True
    )
    r2 = RevisionItem(
        source_document_id=doc.id,
        subject="CS301 Distributed Systems",
        topic="Lamport Logical Clocks",
        question="What partial ordering relationship do Lamport timestamps establish between events?",
        answer="If event A happens-before event B (A -> B), then L(A) < L(B). However, L(A) < L(B) does not imply causality.",
        is_completed=False,
        is_sample=True
    )
    r3 = RevisionItem(
        source_document_id=doc.id,
        subject="CS301 Distributed Systems",
        topic="Raft Leader Election",
        question="How does Raft mitigate split votes during simultaneous candidate elections?",
        answer="Raft uses randomized election timeouts (typically 150-300ms) so one node times out and requests votes before peers.",
        is_completed=False,
        is_sample=True
    )
    db.add_all([r1, r2, r3])

    await db.commit()
    return {"status": "success", "message": "Demo sample data loaded successfully with explicit sample tags."}

@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_sample_data(db: AsyncSession = Depends(get_db)):
    """
    Safely delete ONLY sample records (is_sample=True), preserving real user records.
    """
    # Delete sample revision items
    await db.execute(delete(RevisionItem).where(RevisionItem.is_sample == True))

    # Delete sample tasks (cascades to subtasks and unlinks plan items)
    await db.execute(delete(Task).where(Task.is_sample == True))

    # Delete sample documents
    await db.execute(delete(Document).where(Document.is_sample == True))

    await db.commit()
    return {"status": "success", "message": "All sample records have been safely cleared. Real user records remain intact."}
