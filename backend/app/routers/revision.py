from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import RevisionItem, Document
from app.schemas.schemas import RevisionItemResponse, RevisionItemUpdate, GenerateRevisionRequest
from app.services.revision_generator import generate_revision_items

router = APIRouter(prefix="/revision", tags=["Revision"])

@router.get("", response_model=List[RevisionItemResponse])
async def list_revision_items(
    subject: Optional[str] = Query(None),
    document_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(RevisionItem).order_by(RevisionItem.created_at.desc())
    if subject:
        query = query.where(RevisionItem.subject == subject)
    if document_id:
        query = query.where(RevisionItem.source_document_id == document_id)

    result = await db.execute(query)
    return result.scalars().all()

@router.post("/generate", response_model=List[RevisionItemResponse], status_code=status.HTTP_201_CREATED)
async def generate_revision(payload: GenerateRevisionRequest, db: AsyncSession = Depends(get_db)):
    doc_text = ""
    doc_title = "Document"
    subject = payload.subject

    if payload.document_id:
        doc_res = await db.execute(select(Document).where(Document.id == payload.document_id))
        doc = doc_res.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        doc_text = doc.extracted_text
        doc_title = doc.original_name
        if not subject:
            subject = doc.original_name.split(".")[0]
    else:
        # Fetch the most recent document
        doc_res = await db.execute(select(Document).order_by(Document.created_at.desc()))
        latest_doc = doc_res.scalars().first()
        if latest_doc:
            doc_text = latest_doc.extracted_text
            doc_title = latest_doc.original_name
            if not subject:
                subject = latest_doc.original_name.split(".")[0]
        else:
            doc_text = "Academic study overview and core fundamental principles."

    generated_cards = await generate_revision_items(
        text=doc_text,
        subject=subject,
        document_title=doc_title
    )

    created_items = []
    for card in generated_cards:
        rev = RevisionItem(
            source_document_id=payload.document_id,
            subject=subject,
            topic=card.get("topic", "Key Concept"),
            question=card.get("question", "What is the key takeaway?"),
            answer=card.get("answer", "Review the course materials."),
            is_completed=False,
            is_sample=False
        )
        db.add(rev)
        created_items.append(rev)

    await db.commit()
    for item in created_items:
        await db.refresh(item)

    return created_items

@router.patch("/{item_id}", response_model=RevisionItemResponse)
async def update_revision_item(
    item_id: int,
    payload: RevisionItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(RevisionItem).where(RevisionItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Revision item not found.")

    if payload.is_completed is not None:
        item.is_completed = payload.is_completed

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_revision_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RevisionItem).where(RevisionItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Revision item not found.")

    await db.delete(item)
    await db.commit()
    return None
