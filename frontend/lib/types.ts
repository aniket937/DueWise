export interface AIStatus {
  is_configured: boolean;
  mode: "live" | "demo";
  model: string;
  base_url: string;
  message: string;
  tesseract_available: boolean;
}

export interface DocumentItem {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  extracted_text?: string;
  text_preview: string;
  word_count: number;
  page_count?: number | null;
  processing_status: string;
  ai_summary?: string | null;
  error_message?: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTaskCandidate {
  title: string;
  description?: string | null;
  subject?: string | null;
  due_date?: string | null;
  priority: "low" | "medium" | "high";
  estimated_effort_minutes: number;
  evidence_text?: string | null;
  confidence: number;
}

export interface DocumentAnalysisResult {
  document_id: number;
  summary: string;
  academic_requirements: string[];
  assignments_and_deliverables: string[];
  deadlines: string[];
  important_topics: string[];
  candidate_tasks: ExtractedTaskCandidate[];
  revision_topics: string[];
  uncertainties: string[];
  is_demo: boolean;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  estimated_minutes: number;
  is_completed: boolean;
  created_at: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string | null;
  subject?: string | null;
  due_date?: string | null;
  priority: "low" | "medium" | "high";
  estimated_effort_minutes: number;
  status: "pending" | "in_progress" | "completed";
  evidence_text?: string | null;
  source_document_id?: number | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  subtasks: Subtask[];
  is_overdue: boolean;
}

export interface NextAction {
  recommended_task?: TaskItem | null;
  reason: string;
  urgency_level: "critical" | "high" | "medium" | "low" | "chill";
  suggested_focus: string;
  ai_explanation?: string | null;
  total_active_tasks: number;
  estimated_minutes: number;
}

export interface StudyPlanItem {
  id: number;
  plan_id: number;
  task_id?: number | null;
  day_of_week: string;
  scheduled_date: string;
  title: string;
  subject?: string | null;
  duration_minutes: number;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

export interface StudyPlan {
  id: number;
  week_start_date: string;
  available_daily_minutes: number;
  session_duration_minutes: number;
  available_days: string;
  is_active: boolean;
  created_at: string;
  items: StudyPlanItem[];
  total_planned_minutes: number;
  overload_warning?: string | null;
}

export interface RevisionItem {
  id: number;
  source_document_id?: number | null;
  subject?: string | null;
  topic: string;
  question: string;
  answer: string;
  is_completed: boolean;
  is_sample: boolean;
  created_at: string;
}

export interface DashboardStats {
  active_tasks: number;
  completed_tasks: number;
  due_soon_tasks: number;
  overdue_tasks: number;
  total_study_minutes_planned: number;
  completion_rate_percentage: number;
  total_documents: number;
}

export interface DashboardData {
  stats: DashboardStats;
  next_action: NextAction;
  upcoming_deadlines: TaskItem[];
  recent_documents: DocumentItem[];
  weekly_plan_summary?: StudyPlan | null;
}
