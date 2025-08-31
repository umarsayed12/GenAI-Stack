# GenAI Stack — A No-Code Visual AI Workflow Builder

A full-stack, no-code web application that lets you **visually design, build, and chat with custom AI workflows** (“Stacks”). Connect components like user inputs, knowledge bases, and LLM engines to create sophisticated flows, then interact with them in real time.

<p align="center">
  <a href="https://genaistack.netlify.app" target="_blank"><b>Live Demo</b></a> ·
  <a href="#-getting-started"><b>Getting Started</b></a> ·
  <a href="#-tech-stack--architecture"><b>Tech Stack</b></a> ·
  <a href="#-troubleshooting--faq"><b>Troubleshooting</b></a>
</p>

---

## ✨ Features

- **Visual Workflow Editor** — Drag-and-drop UI (React Flow) to build complex AI logic without code.
- **Modular Components** — Four core nodes: **User Query**, **Knowledge Base**, **LLM Engine**, **Output**.
- **RAG Support** — Upload PDFs to a Knowledge Base; the LLM uses this context to answer precisely.
- **Dynamic Configuration** — Choose Gemini models, tweak temperature, and set parameters per node.
- **Realtime Chat** — Talk to your stack via a clean chat interface.
- **Persistent Workflows** — Save/reload Stacks in **PostgreSQL (Neon)**.

---

## 🧱 Tech Stack & Architecture

**Frontend**

- Framework: React (Vite) + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Canvas: React Flow
- Deployment: Netlify

**Backend**

- API: FastAPI (Python)
- DB: PostgreSQL (Neon)
- Vector Store: ChromaDB
- LLM: Google **Gemini** API
- Deployment: Render (or Azure / any container host)

High-level flow:

```

React (Vite)  →  FastAPI  →  Services (RAG, LLM, Execution)
↘
ChromaDB / Neon

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **Neon** account (PostgreSQL)
- **Google Gemini API key** (Google AI Studio)

---

### 1) Backend Setup

```bash
# 1. Clone
git clone https://github.com/umarsayed12/GenAI-Stack.git
cd genai-stack/backend

# 2. Virtual env
python -m venv venv
source venv/bin/activate   # Windows: .\venv\Scripts\activate

# 3. Install deps
pip install -r requirements.txt

# 4. Environment (create .env in /backend)
# Required:
# DATABASE_URL="postgresql+psycopg://<user>:<pass>@<host>/<db>"
# GEMINI_API_KEY="<your_gemini_api_key>"
# FRONTEND_URL="http://localhost:5173"          # for CORS during local dev

# 5. DB migrations (ensure alembic.ini points to DATABASE_URL)
alembic upgrade head

# 6. Run dev server
uvicorn main:app --reload
# Backend runs at http://127.0.0.1:8000
```

---

### 2) Frontend Setup

```bash
cd ../frontend

# 1. Install
npm install

# 2. Environment (create .env.local in /frontend)
# Use VITE_BACKEND_URL to match fetches in code
# Example:
# VITE_BACKEND_URL="http://127.0.0.1:8000"

# 3. Run dev
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🗂️ Project Structure

```
genai-stack/
├─ backend/
│  ├─ api/
│  │  └─ v1/
│  │     ├─ api.py                 # API router
│  │     └─ endpoints/
│  │        ├─ chat.py
│  │        ├─ knowledge.py        # /v1/knowledge (PDF upload, RAG)
│  │        └─ stacks.py           # CRUD for stacks
│  ├─ services/
│  │  ├─ knowledge_service.py      # PDF parsing & ChromaDB ops
│  │  ├─ gemini_service.py         # Gemini wrapper
│  │  └─ execution_service.py      # Runs saved workflows
│  ├─ models/                      # SQLAlchemy models
│  ├─ alembic/                     # DB migrations
│  ├─ main.py                      # FastAPI app + CORS
│  └─ requirements.txt
└─ frontend/
   ├─ src/
   │  ├─ pages/                    # e.g., Homepage.tsx, StackEditor.tsx
   │  ├─ components/               # UI components
   │  │  ├─ customNodes.tsx        # React Flow nodes (Query/KB/LLM/Output)
   │  │  └─ ChatModal.tsx          # Chat UI
   │  ├─ hooks/                    # useStacks.ts, useStack.ts
   │  └─ lib/                      # types, utils, constants
   ├─ index.html
   └─ vite.config.ts
```

---

## 🔧 Configuration Notes

### CORS (FastAPI)

In `main.py`, allow your frontend origin(s):

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",            # dev
    "https://genaistack.netlify.app",   # prod
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # be explicit in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If you ever run into preflight/OPTIONS issues for file uploads, you can add:

```python
from fastapi.responses import JSONResponse

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse({"ok": True})
```

### Netlify Routing (Frontend)

Use `_redirects` (in `frontend/public/`) **or** `netlify.toml` to proxy API calls:

```
# _redirects
/*      /index.html   200
/api/*  https://genai-stack-ds1r.onrender.com/api/:splat   200
```

Frontend fetch:

```ts
const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
await fetch(`${backendUrl}/api/v1/knowledge/upload-pdf`, {
  method: "POST",
  body: formData,
});
```

> In prod, set `VITE_BACKEND_URL="https://genai-stack-ds1r.onrender.com"` on Netlify.

---

## 🧪 PDF Upload (RAG) — Recommended Pattern

Avoid reading entire files into memory:

```python
# knowledge.py (snippet)
with open(file_path, "wb") as buffer:
  while chunk := await file.read(1024 * 1024):  # stream 1MB chunks
      buffer.write(chunk)
```

If processing can take time, offload to background:

```python
from fastapi import BackgroundTasks

background_tasks.add_task(process_pdf_and_store, file_path, collection_name, api_key)
```

---

## 🌐 Deployments

### Netlify (Frontend)

- Build command: `npm run build`
- Publish directory: `dist`
- Environment:

  - `VITE_BACKEND_URL="https://genai-stack-ds1r.onrender.com"`

### Render (Backend)

- Start command (works well on Render):

  - **Recommended (simple):** `uvicorn main:app --host 0.0.0.0 --port 10000`
  - (If you prefer Gunicorn) `gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 main:app`

- Environment:

  - `DATABASE_URL`, `GEMINI_API_KEY`, `FRONTEND_URL`

- Make sure the service listens on `$PORT` (Render injects it; often 10000).

---

## 🧰 Troubleshooting & FAQ

**Q: Browser says “Failed to load module script… MIME type application/octet-stream”.**
A: Make sure you deploy Vite’s **built** assets (`dist/`). On Netlify, use:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Q: CORS error only on file upload (others OK).**
A:

- Ensure `allow_origins` includes your exact Netlify URL (no trailing slash).
- File uploads trigger **OPTIONS** preflight — add the wildcards above or an explicit `@app.options` handler.
- Confirm the backend actually returns `Access-Control-Allow-*` headers on **OPTIONS**.

**Q: Uploads work locally but fail on Render.**
A:

- Use `uvicorn` directly on Render (simpler).
- Stream file writes; avoid `await file.read()` for entire file.
- If processing is heavy, move to `BackgroundTasks` or a queue (Celery/RQ).

**Q: Netlify 404s on deep links.**
A: Add SPA fallback (`/*  /index.html  200`) via `_redirects` or `netlify.toml`.

## 👤 Author

**Umar Sayed**
GitHub: [umarsayed12](https://github.com/umarsayed12)
LinkedIn: [umar-khursheed](https://www.linkedin.com/in/umar-khursheed)
