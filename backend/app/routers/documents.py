import os
from pathlib import Path
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Document, Task
from app.schemas.schemas import DocumentResponse, DocumentAnalysisResult, ConfirmTasksRequest, TaskResponse
from app.services.document_parser import sanitize_filename, parse_document
from app.services.task_extractor import analyze_document_text

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    return result.scalars().all()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate filename and extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty.")

    clean_name = sanitize_filename(file.filename)
    ext = Path(clean_name).suffix.lower()
    allowed_exts = [".pdf", ".docx", ".doc", ".txt", ".text", ".md"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Only PDF, DOCX, and TXT files are accepted."
        )

    # 2. Read bytes and enforce size limit
    content_bytes = await file.read()
    file_size = len(content_bytes)
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB} MB."
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 3. Parse document
    try:
        extracted_text, page_count, word_count = parse_document(
            file_bytes=content_bytes,
            filename=clean_name,
            mime_type=file.content_type or "application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text from document: {str(e)}")

    preview = (extracted_text[:400] + "...") if len(extracted_text) > 400 else extracted_text

    # 4. Save to local storage safely
    saved_filename = f"{int(datetime.utcnow().timestamp())}_{clean_name}"
    storage_path = settings.STORAGE_DIR / saved_filename
    with open(storage_path, "wb") as f:
        f.write(content_bytes)

    # 5. Persist document metadata in SQLite
    doc = Document(
        filename=saved_filename,
        original_name=clean_name,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        extracted_text=extracted_text,
        text_preview=preview,
        page_count=page_count,
        word_count=word_count,
        processing_status="completed",
        is_sample=False
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove file from disk if present
    file_path = settings.STORAGE_DIR / doc.filename
    if file_path.exists():
        try:
            os.remove(file_path)
        except OSError:
            pass

    await db.delete(doc)
    await db.commit()
    return None

@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResult)
async def analyze_document(document_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if not doc.extracted_text.strip():
        raise HTTPException(status_code=400, detail="Document contains no extracted text to analyze.")

    analysis = await analyze_document_text(
        text=doc.extracted_text,
        document_id=doc.id,
        filename=doc.original_name
    )

    # Cache AI summary on document
    doc.ai_summary = analysis.summary
    await db.commit()

    return analysis

@router.post("/{document_id}/confirm-tasks", response_model=List[TaskResponse])
async def confirm_document_tasks(
    document_id: int,
    payload: ConfirmTasksRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    created_ids = []
    for item in payload.tasks:
        task = Task(
            title=item.title,
            description=item.description,
            subject=item.subject,
            due_date=item.due_date,
            priority=item.priority,
            estimated_effort_minutes=item.estimated_effort_minutes,
            status="pending",
            source_document_id=doc.id,
            evidence_text=item.evidence_text,
            is_sample=False
        )
        db.add(task)
        await db.flush()
        created_ids.append(task.id)

    await db.commit()

    # Reload with subtasks eagerly loaded to avoid greenlet errors
    reloaded_res = await db.execute(
        select(Task).options(selectinload(Task.subtasks)).where(Task.id.in_(created_ids))
    )
    return reloaded_res.scalars().all()
