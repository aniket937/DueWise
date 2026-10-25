---
title: "DueWise — Upload Once. Know What To Do Next."
published: false
description: "An autonomous academic planner powered by open-weight AI and deterministic scheduling that eliminates student planning fatigue."
tags: "devchallenge, hf26challenge, openweight, ai, productivity"
---

# DueWise — Upload Once. Know What To Do Next.

## 🦉 The Problem Statement: Academic Decision Fatigue

Every semester, students drown in a sea of PDFs, syllabuses, exam schedules, and learning management notices. 

The manual friction of reading through dense academic documents, hunting down submission deadlines, breaking down milestones, estimating study hours, and deciding what to work on right now leads directly to procrastination and burnout. Students spend hours organizing their calendars instead of actually studying.

**DueWise** is built to solve this friction. DueWise automates repetitive planning so students can focus on one single high-impact action at a time.

---

## 🚀 What Was Built

DueWise is a runnable, full-stack academic productivity platform designed around a clear signature philosophy: **"What should I do now?"**

Key capabilities:
1. **Document Ingestion & Text Extraction**: Drag-and-drop support for **PDF, DOCX, and TXT** documents (up to 15 MB) with safe filename sanitization and bounded extraction.
2. **Open-Weight AI Syllabus Analysis**: Analyzes course documents to extract concise summaries, grading criteria, deliverables, deadlines, and candidate actionable tasks.
3. **Safety & Verification Review Screen**: Follows strict safety principles—candidate tasks are **never saved automatically**. Students review, edit dates/priorities, and explicitly approve which tasks enter their database.
4. **Persistent Task Management**: Full asynchronous CRUD with priority classification, overdue indicators, subtask breakdown, search, multi-factor filtering, and sorting.
5. **Deterministic "What Should I Do Now?" Engine**: Recommends the single best next action based on deadline proximity, priority weighting, remaining effort, and current progress.
6. **Weekly Study Planner**: Balances student workloads across selectable days without scheduling work past its deadline or exceeding daily study capacity limits. Includes proactive overload warnings.
7. **Revision Checklist & Flashcards**: Synthesizes high-yield test questions and recall answers grounded strictly in the uploaded materials.
8. **Fully Usable Demo Mode & Zero-Leak Security**: Operates completely out of the box without requiring an API key. Once configured in `backend/.env`, it seamlessly switches to live inference. The API key is backend-only and never exposed to the frontend.

---

## 🧠 Why Open Innovation & Open-Weight Models Matter

Proprietary frontier models often lock developers into opaque hosting terms, changing pricing, and unpredictable deprecation schedules. In student productivity and educational software, reproducibility and autonomy are paramount.

DueWise embraces **open-weight models** (such as Meta's LLaMA 3.3 70B Instruct or Qwen 2.5 72B Instruct) via OpenRouter. 

### Why this approach works:
- **Architecture Freedom**: Open-weight weights can be inspected, fine-tuned, or deployed on any cloud provider or private cluster.
- **Structured Output Reliability**: Open-weight models routed through constrained decoding engines deliver reliable JSON schemas.
- **Provider Redundancy via OpenRouter**: OpenRouter connects to open-weight model hosters, providing failover, response healing, and affordable pay-per-token pricing without requiring massive on-device GPUs.
- **Clear Disclosures**: Extracted document text is only sent to the configured OpenRouter provider when the user explicitly requests AI analysis. We never claim offline execution for cloud-routed inference.

---

## 🛠️ Technology Stack & Recorded Versions

### Frontend
- **Framework**: Next.js 16.3.8 (App Router, Turbopack)
- **UI & State**: React 19.2.0, React DOM 19.2.0
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS v4.0.0 (`@tailwindcss/postcss`) with high-contrast, neobrutalist-inspired design
- **Icons**: Lucide React
- **API Client**: Centralized, typed native fetch client

### Backend
- **Framework**: Python 3.13.3 + FastAPI 0.162.0
- **ASGI Server**: Uvicorn 0.54.0
- **Database**: SQLite with SQLAlchemy 2.1.6 (AsyncIO) & aiosqlite 0.22.1
- **Validation**: Pydantic 2.14.1 (V2 ConfigDict)
- **Document Processing**: PyMuPDF 2.0 (native PDF text extraction), python-docx 1.2.0, Pillow 13.0.0, pytesseract 0.3.13 (graceful fallback)
- **HTTP Client**: HTTPX 0.28.1 (asynchronous OpenRouter client with timeouts and normalized errors)
- **Testing & Quality**: pytest 9.1.1, pytest-asyncio 1.4.0, Ruff 0.17.2

---

## 💻 Windows Setup & Local Execution

DueWise is built to run smoothly on Windows:

### One-Command Setup
```powershell
npm run setup
```
The setup script:
- Verifies Node.js, npm, and Python 3.13+.
- Creates the Python virtual environment in `backend/.venv`.
- Installs backend Python wheels and frontend npm packages.
- Creates `backend/data` and `backend/storage` directories.
- Creates `backend/.env` with safe default Demo Mode settings (never overwriting existing files).

### Start Development Servers
```powershell
npm run dev
```
Launches:
- **FastAPI Backend**: `http://localhost:8000` (API docs at `http://localhost:8000/docs`)
- **Next.js Frontend**: `http://localhost:3000`

---

## 🧪 Testing Results & Verification Evidence

All verification suites were executed directly in the project workspace:

- **Backend Pytest Suite**: 7/7 test suites PASSED (100% pass rate)
  - `test_health_endpoint`: Passed
  - `test_ai_status_demo_mode`: Passed
  - `test_document_parser_txt`: Passed
  - `test_document_upload_and_analysis`: Passed
  - `test_task_crud_and_lifecycle`: Passed
  - `test_study_planner_and_revision`: Passed
  - `test_demo_load_and_reset`: Passed
- **Backend Ruff Linter**: 0 errors, all rules passed (`npm run lint:backend`)
- **Frontend TypeScript Typecheck**: 0 errors (`npm run typecheck` / `tsc --noEmit`)
- **Production Build**: Prerendered all 6 routes statically with Next.js Turbopack (`npm run build`)

---

## 🔒 Honest Limitations & Disclosures

1. **Inference Hosting**: When configured with an OpenRouter API key, document text is sent over HTTPS to the OpenRouter completion endpoint. Processing is not offline or local.
2. **Scanned PDF OCR**: PyMuPDF extracts text directly from digitally generated PDFs. Scanned image-only PDFs require the optional Tesseract OCR binary in the system PATH; if absent, DueWise explains the limitation gracefully without crashing.
3. **No Authentication for Local MVP**: In this initial release, the application runs locally for a single student user on SQLite. Multi-tenant auth is slated for a future iteration.
4. **Token Limits**: Document text sent to OpenRouter is bounded to ~4,000 words per request to keep inference fast and affordable.
