# 🦉 DueWise

> **Upload once. Know what to do next.**  
> Autonomous Academic Planning, Syllabus Parsing, and Study Optimization using Open-Weight AI.

[![Backend Tests](https://img.shields.io/badge/pytest-7%20passed-brightgreen.svg)](#testing-and-verification)
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162-teal.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg)](https://tailwindcss.com)

---

## 📖 Overview

Students regularly receive syllabuses, course announcements, assignment briefs, and exam notifications. Manually reviewing these documents, recording deadlines, creating schedules, and deciding what to study next requires significant cognitive effort—often leading to procrastination and missed milestones.

**DueWise** eliminates this friction. DueWise automates repetitive planning so students can focus on **one single, high-impact action at a time**.

Upload a syllabus or academic document once. DueWise parses its contents, proposes verified tasks, generates weekly study plans, compiles revision flashcards, and answers the signature question:

> **"What should I do now?"**

---

## 🌟 Key Features

### 1. 🎯 "What Should I Do Now?" (Signature Feature)
- Recommends the single best next task using **deterministic scoring**:
  - Overdue status & deadline proximity
  - Priority level (high / medium / low)
  - Estimated effort in minutes (favors manageable momentum wins)
  - Current task progress
- Works completely **without AI** using transparent business logic.
- When an OpenRouter API key is configured, an open-weight model provides a 1-sentence contextual encouragement.

### 2. 📄 Document Ingestion & Local Extraction
- Supports **PDF, DOCX, and TXT** documents (up to 15 MB).
- Fast local text extraction via **PyMuPDF** (`pymupdf`) and `python-docx`.
- Safe filename sanitization prevents directory traversal attacks.
- Graceful fallback for scanned PDFs if Tesseract OCR is unavailable.
- Extracted text preview and document metadata stored persistently in SQLite.

### 3. 🤖 Open-Weight AI Document Analysis & Safety Review
- Extracts executive summaries, academic requirements, deliverables, deadlines, and candidate tasks.
- **Safety Guarantee**: Extracted tasks are **never saved automatically**. Users review suggestions in an editable modal, adjust titles/deadlines, and explicitly approve which items enter their schedule.
- Uses strict JSON output validation.

### 4. 📋 Task Management (CRUD)
- Full persistent CRUD for tasks and subtasks.
- Search tasks by title and description.
- Multi-factor filters: status (pending, in progress, completed), priority, and subject.
- Sort by due date, priority, effort, or creation date.
- Overdue indicators with real-time recalculation.

### 5. 📅 Weekly Study Planner
- Balances academic workloads across custom study days.
- Configurable daily study capacity limits and session durations.
- **Strict Scheduling Constraints**:
  - Prioritizes approaching deadlines.
  - Excludes completed tasks.
  - Never schedules work after its deadline date.
  - Proactive warning banner if requested tasks exceed weekly capacity.

### 6. 🧠 Revision Checklist & Recall Flashcards
- Synthesizes concise Q&A flashcards directly grounded in the uploaded material.
- Flip/reveal answer testing for active recall.
- Track mastery progress across subjects.

### 7. 🛡️ Demo Mode & Security
- Fully runnable out of the box with zero configuration or API keys.
- **Backend-Only API Key**: The OpenRouter key is never exposed to the frontend, logs, or Git commits.
- Load realistic sample data (CS301 Distributed Systems syllabus) with one click.
- Safe reset action clears only sample data, preserving personal records.

---

## 🏗️ Architecture

```
                       +-----------------------+
                       |   Next.js 16 (React)  |
                       |  Tailwind v4 Frontend |
                       | (http://localhost:3000)|
                       +-----------+-----------+
                                   |
                             Native Fetch
                             (JSON / REST)
                                   |
                                   v
                       +-----------------------+
                       |   FastAPI Application |
                       |  (http://localhost:8000)|
                       +-----------+-----------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+-----------------+       +-----------------+       +-----------------+
| PyMuPDF / docx  |       | SQLite Storage  |       | OpenRouter API  |
| Local Text      |       | (SQLAlchemy 2.1 |       | Open-Weight LLM |
| Extraction      |       |  + aiosqlite)   |       | (Backend-Only)  |
+-----------------+       +-----------------+       +-----------------+
```

---

## 🛠️ Technology Stack & Versions

| Layer | Component | Version | Description |
|---|---|---|---|
| **Frontend** | Next.js | 16.3.8 | React App Router framework with Turbopack |
| **Frontend** | React & React DOM | 19.2.0 | React 19 component library |
| **Frontend** | TypeScript | 5.7+ | Strict type validation |
| **Frontend** | Tailwind CSS | 4.0.0 | PostCSS neobrutalist styling |
| **Frontend** | Lucide React | 1.16.0 | Minimal icon set |
| **Backend** | Python | 3.13.3 | Core runtime |
| **Backend** | FastAPI | 0.162.0 | Asynchronous REST API framework |
| **Backend** | Uvicorn | 0.54.0 | High-performance ASGI server |
| **Backend** | SQLAlchemy | 2.1.6 | Asynchronous ORM with `greenlet` |
| **Backend** | aiosqlite | 0.22.1 | Asynchronous SQLite driver |
| **Backend** | Pydantic | 2.14.1 | V2 data schemas with `ConfigDict` |
| **Backend** | PyMuPDF | 2.0.0 | PDF document parser |
| **Backend** | python-docx | 1.2.0 | DOCX document parser |
| **Backend** | HTTPX | 0.28.1 | Asynchronous OpenRouter client |
| **Backend** | pytest & ruff | 9.1.1 / 0.17.2 | Automated testing & linting |

---

## 🚀 Getting Started on Windows

### Prerequisites
- **Node.js** v20+ (tested on Node.js v24.4.0)
- **Python** 3.13+ (tested on Python 3.13.3)
- **Git**

### 1. Clone & Setup
Run the automated setup command:
```powershell
npm run setup
```
This script automatically:
1. Verifies Node.js, npm, and Python prerequisites.
2. Creates the Python virtual environment in `backend/.venv`.
3. Installs backend dependencies via `pip`.
4. Installs frontend dependencies via `npm`.
5. Prepares `backend/data` and `backend/storage` directories.
6. Generates `backend/.env` with safe Demo Mode defaults.

Alternatively, use the native PowerShell script:
```powershell
.\setup.ps1
```

### 2. Start the Development Servers
```powershell
npm run dev
```
Or via PowerShell:
```powershell
.\run-dev.ps1
```

Both services will start concurrently:
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs))
- **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 OpenRouter Configuration (Optional)

DueWise works fully in **Demo Mode** without an API key using deterministic pattern extraction and mathematical scheduling.

To enable **Live AI Mode** using an open-weight model:
1. Open `backend/.env`.
2. Add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
   ```
3. (Optional) Configure an open-weight model (defaults to LLaMA 3.3 70B):
   ```env
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
   ```
4. Restart the backend service. DueWise will detect the key and switch to live inference.

> [!IMPORTANT]
> The API key is backend-only. It is never exposed in frontend bundles, browser network tabs, or repository commits.

---

## 🧪 Testing and Verification

Run the full automated test suite directly:

```powershell
# Run backend pytest suite + frontend typecheck
npm run test

# Run backend linter (Ruff)
npm run lint:backend

# Run frontend production build (Turbopack)
npm run build
```

### Verified Test Results
- **Backend Tests**: 7 passed out of 7 (`pytest backend -v`)
- **Backend Linting**: 0 errors (`ruff check backend/app`)\n- **TypeScript Check**: 0 errors (`tsc --noEmit`)
- **Production Build**: 6 static routes compiled and prerendered (`next build`)

---

## 🔒 Security & Privacy Practices

- **Untrusted Document Content**: All uploaded text is treated strictly as untrusted data, never as system instructions.
- **Zero Hallucinated Deadlines**: When a date is unspecified in a syllabus, it is preserved as `null`. DueWise never silently invents dates.
- **Strict File Upload Validation**: Enforces a 15 MB limit and restricts file extensions to `.pdf`, `.docx`, and `.txt`.
- **Safe Filename Sanitization**: Eliminates path traversal sequences (`../`) before file creation.
- **No Secret Leakage**: No environment variables or API keys are exposed via API endpoints.

---

## ⚠️ Known Limitations

1. **OCR Prerequisite**: Text extraction from digitally generated PDFs is supported natively. Scanned image PDFs require the optional `tesseract` binary in the Windows PATH.
2. **Single-Tenant Local MVP**: Designed for personal local use with SQLite persistence. Multi-user authentication is planned for future versions.
3. **Hosted Inference**: Live AI mode calls OpenRouter over HTTPS; it does not run local on-device neural network weights.

---

## 📄 License

MIT License. Built for the DEV Community Hacktoberfest Challenge.
