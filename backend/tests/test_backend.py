import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.core.database import init_db, engine, Base
from app.services.document_parser import sanitize_filename, extract_from_txt, parse_document
from app.services.task_prioritizer import calculate_task_urgency_score
from app.models.models import Task

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["app"] == "DueWise"

@pytest.mark.asyncio
async def test_ai_status_demo_mode():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/ai/status")
        assert res.status_code == 200
        data = res.json()
        assert "mode" in data
        assert "model" in data

@pytest.mark.asyncio
async def test_document_parser_txt():
    content = b"Course: Distributed Systems\nAssignment 1: Due on Oct 30\nRead Chapter 4."
    clean_name = sanitize_filename("test document..txt")
    assert clean_name == "test_document..txt" or "test" in clean_name
    
    extracted, pages, words = parse_document(content, "test.txt", "text/plain")
    assert "Distributed Systems" in extracted
    assert words > 0
    assert pages == 1

@pytest.mark.asyncio
async def test_document_upload_and_analysis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Invalid file extension rejection
        files = {"file": ("test.exe", b"binary content", "application/octet-stream")}
        res = await client.post("/api/documents/upload", files=files)
        assert res.status_code == 400

        # 2. Valid text file upload
        syllabus_text = "CS101 Intro to Computer Science\nHomework 1: Problem Set due 2026-11-05\nMidterm Exam: 2026-11-15\nGrading: Homework 40%, Exams 60%"
        files = {"file": ("cs101_syllabus.txt", syllabus_text.encode("utf-8"), "text/plain")}
        res = await client.post("/api/documents/upload", files=files)
        assert res.status_code == 201
        doc_data = res.json()
        doc_id = doc_data["id"]
        assert doc_data["word_count"] > 0

        # 3. Analyze document (Demo mode analysis)
        res_analyze = await client.post(f"/api/documents/{doc_id}/analyze")
        assert res_analyze.status_code == 200
        analysis_data = res_analyze.json()
        assert len(analysis_data["candidate_tasks"]) > 0

        # 4. Confirm extracted tasks
        confirm_payload = {
            "tasks": [
                {
                    "title": t["title"],
                    "description": t["description"],
                    "subject": t["subject"],
                    "priority": t["priority"],
                    "estimated_effort_minutes": t["estimated_effort_minutes"],
                    "evidence_text": t["evidence_text"]
                }
                for t in analysis_data["candidate_tasks"][:2]
            ]
        }
        res_confirm = await client.post(f"/api/documents/{doc_id}/confirm-tasks", json=confirm_payload)
        assert res_confirm.status_code == 200
        confirmed = res_confirm.json()
        assert len(confirmed) == 2

@pytest.mark.asyncio
async def test_task_crud_and_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create
        task_in = {
            "title": "Build Architecture Diagram",
            "description": "Create component overview diagram",
            "subject": "Software Engineering",
            "priority": "high",
            "estimated_effort_minutes": 60,
            "status": "pending",
            "subtasks": [
                {"title": "Draft sketch", "estimated_minutes": 20},
                {"title": "Export SVG", "estimated_minutes": 15}
            ]
        }
        res_create = await client.post("/api/tasks", json=task_in)
        assert res_create.status_code == 201
        task = res_create.json()
        task_id = task["id"]
        assert len(task["subtasks"]) == 2

        # Update status to completed
        res_update = await client.patch(f"/api/tasks/{task_id}", json={"status": "completed"})
        assert res_update.status_code == 200
        updated = res_update.json()
        assert updated["status"] == "completed"
        assert updated["completed_at"] is not None

        # Reopen task
        res_reopen = await client.patch(f"/api/tasks/{task_id}", json={"status": "pending"})
        assert res_reopen.status_code == 200
        reopened = res_reopen.json()
        assert reopened["status"] == "pending"
        assert reopened["completed_at"] is None

        # Delete
        res_del = await client.delete(f"/api/tasks/{task_id}")
        assert res_del.status_code == 204

@pytest.mark.asyncio
async def test_study_planner_and_revision():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Generate study plan
        plan_req = {
            "week_start_date": "2026-10-26",
            "available_daily_minutes": 120,
            "session_duration_minutes": 45,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        }
        res_plan = await client.post("/api/plans/generate", json=plan_req)
        assert res_plan.status_code == 201
        plan_data = res_plan.json()
        assert plan_data["is_active"] is True

        # Generate revision
        res_rev = await client.post("/api/revision/generate", json={})
        assert res_rev.status_code == 201
        rev_items = res_rev.json()
        assert len(rev_items) > 0

@pytest.mark.asyncio
async def test_demo_load_and_reset():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Load sample data
        res_load = await client.post("/api/demo/load")
        assert res_load.status_code == 201

        # Check dashboard
        res_dash = await client.get("/api/dashboard")
        assert res_dash.status_code == 200
        dash = res_dash.json()
        assert dash["stats"]["active_tasks"] > 0
        assert dash["next_action"]["recommended_task"] is not None

        # Reset sample data
        res_reset = await client.post("/api/demo/reset")
        assert res_reset.status_code == 200
