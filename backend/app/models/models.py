from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    text_preview: Mapped[str] = mapped_column(String(1000), nullable=False, default="")
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    processing_status: Mapped[str] = mapped_column(String(50), default="completed")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="source_document", cascade="all, delete-orphan")
    revision_items: Mapped[List["RevisionItem"]] = relationship("RevisionItem", back_populates="source_document", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high
    estimated_effort_minutes: Mapped[int] = mapped_column(Integer, default=30)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, in_progress, completed
    source_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    evidence_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    source_document: Mapped[Optional["Document"]] = relationship("Document", back_populates="tasks")
    subtasks: Mapped[List["Subtask"]] = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    plan_items: Mapped[List["StudyPlanItem"]] = relationship("StudyPlanItem", back_populates="task")

class Subtask(Base):
    __tablename__ = "subtasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=15)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="subtasks")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    week_start_date: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD
    available_daily_minutes: Mapped[int] = mapped_column(Integer, default=120)
    session_duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    available_days: Mapped[str] = mapped_column(String(255), default="Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    items: Mapped[List["StudyPlanItem"]] = relationship("StudyPlanItem", back_populates="plan", cascade="all, delete-orphan")

class StudyPlanItem(Base):
    __tablename__ = "study_plan_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    day_of_week: Mapped[str] = mapped_column(String(20), nullable=False)
    scheduled_date: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    plan: Mapped["StudyPlan"] = relationship("StudyPlan", back_populates="items")
    task: Mapped[Optional["Task"]] = relationship("Task", back_populates="plan_items")

class RevisionItem(Base):
    __tablename__ = "revision_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source_document: Mapped[Optional["Document"]] = relationship("Document", back_populates="revision_items")
