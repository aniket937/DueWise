from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

# ----------------- AI Status -----------------
class AIStatusResponse(BaseModel):
    is_configured: bool
    mode: str  # "live" or "demo"
    model: str
    base_url: str
    message: str
    tesseract_available: bool

# ----------------- Documents -----------------
class DocumentBase(BaseModel):
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    text_preview: str
    word_count: int
    page_count: Optional[int] = None
    processing_status: str
    is_sample: bool = False

class DocumentResponse(DocumentBase):
    id: int
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExtractedTaskCandidate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None  # ISO format string or YYYY-MM-DD
    priority: str = "medium"  # low, medium, high
    estimated_effort_minutes: int = 30
    evidence_text: Optional[str] = None
    confidence: float = 0.85

class DocumentAnalysisResult(BaseModel):
    document_id: int
    summary: str
    academic_requirements: List[str] = []
    assignments_and_deliverables: List[str] = []
    deadlines: List[str] = []
    important_topics: List[str] = []
    candidate_tasks: List[ExtractedTaskCandidate] = []
    revision_topics: List[str] = []
    uncertainties: List[str] = []
    is_demo: bool = False

class ConfirmTaskItem(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"
    estimated_effort_minutes: int = 30
    evidence_text: Optional[str] = None

class ConfirmTasksRequest(BaseModel):
    tasks: List[ConfirmTaskItem]

# ----------------- Tasks -----------------
class SubtaskBase(BaseModel):
    title: str
    estimated_minutes: int = 15
    is_completed: bool = False

class SubtaskCreate(BaseModel):
    title: str
    estimated_minutes: int = 15

class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: str = "medium"
    estimated_effort_minutes: int = 30
    status: str = "pending"
    evidence_text: Optional[str] = None

class TaskCreate(TaskBase):
    source_document_id: Optional[int] = None
    subtasks: Optional[List[SubtaskCreate]] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    estimated_effort_minutes: Optional[int] = None
    status: Optional[str] = None
    evidence_text: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    source_document_id: Optional[int] = None
    is_sample: bool = False
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    subtasks: List[SubtaskResponse] = []
    is_overdue: bool = False

    model_config = ConfigDict(from_attributes=True)

# ----------------- What Should I Do Now -----------------
class NextActionResponse(BaseModel):
    recommended_task: Optional[TaskResponse] = None
    reason: str
    urgency_level: str  # critical, high, medium, low, chill
    suggested_focus: str
    ai_explanation: Optional[str] = None
    total_active_tasks: int = 0
    estimated_minutes: int = 0

# ----------------- Study Planner -----------------
class GeneratePlanRequest(BaseModel):
    week_start_date: str  # YYYY-MM-DD
    available_daily_minutes: int = 120
    session_duration_minutes: int = 45
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class StudyPlanItemBase(BaseModel):
    day_of_week: str
    scheduled_date: str
    title: str
    subject: Optional[str] = None
    duration_minutes: int = 45
    is_completed: bool = False
    order_index: int = 0
    task_id: Optional[int] = None

class StudyPlanItemUpdate(BaseModel):
    is_completed: Optional[bool] = None
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    scheduled_date: Optional[str] = None
    day_of_week: Optional[str] = None

class StudyPlanItemResponse(StudyPlanItemBase):
    id: int
    plan_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudyPlanResponse(BaseModel):
    id: int
    week_start_date: str
    available_daily_minutes: int
    session_duration_minutes: int
    available_days: str
    is_active: bool
    created_at: datetime
    items: List[StudyPlanItemResponse] = []
    total_planned_minutes: int = 0
    overload_warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Revision Checklist -----------------
class RevisionItemBase(BaseModel):
    subject: Optional[str] = None
    topic: str
    question: str
    answer: str
    is_completed: bool = False

class RevisionItemUpdate(BaseModel):
    is_completed: Optional[bool] = None

class RevisionItemResponse(RevisionItemBase):
    id: int
    source_document_id: Optional[int] = None
    is_sample: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GenerateRevisionRequest(BaseModel):
    document_id: Optional[int] = None
    subject: Optional[str] = None

# ----------------- Dashboard -----------------
class DashboardStats(BaseModel):
    active_tasks: int
    completed_tasks: int
    due_soon_tasks: int
    overdue_tasks: int
    total_study_minutes_planned: int
    completion_rate_percentage: float
    total_documents: int

class DashboardResponse(BaseModel):
    stats: DashboardStats
    next_action: NextActionResponse
    upcoming_deadlines: List[TaskResponse]
    recent_documents: List[DocumentResponse]
    weekly_plan_summary: Optional[StudyPlanResponse] = None
