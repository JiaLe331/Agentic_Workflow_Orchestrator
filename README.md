# 🤖 n8n Agent Creator — Deriv Hackathon

> **An AI-powered platform that converts plain-English prompts into fully-functional n8n automation workflows — instantly.**

---

## 📖 Overview

**n8n Agent Creator** is a full-stack monorepo application built for the Deriv Hackathon. It lets non-technical users describe what they want to automate in plain English, and the system uses a multi-agent AI pipeline to:

1. **Understand** the intent behind the request
2. **Plan** the workflow step-by-step
3. **Generate** a valid n8n workflow JSON
4. **Deploy** it directly to a live n8n instance
5. **Persist** the workflow to a PostgreSQL database
6. **Stream** live progress updates to the browser via WebSocket

**Example prompts:**
- *"Send a weekly payroll summary to employees via WhatsApp"*
- *"Parse my uploaded PDF and email a summary to a customer"*
- *"Create a new employee record from onboarding form data"*
- *"Generate a CNY greeting image and email it to all customers"*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│              Next.js 16 Frontend (apps/web)                     │
│   Prompt Input ──► WebSocket Live Status ──► Workflow Gallery   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / WebSocket
          ┌──────────────▼──────────────────────────┐
          │     Python FastAPI Backend (backend/)    │
          │         Port 8000                        │
          │                                          │
          │  Agent 0: Safety Guard (Groq/Llama 3.1)  │
          │       ↓                                  │
          │  Agent 1: Intent Analyzer (Gemini Flash)  │
          │       ↓                                  │
          │  Agent 2: Workflow Planner (Gemini Pro)   │
          │       ↓                                  │
          │  Agent 3: n8n JSON Generator (Gemini Pro) │
          │       ↓                                  │
          │  n8n Deployment & Execution              │
          └──────────────┬──────────────────────────┘
                         │
          ┌──────────────▼──────────────────────────┐
          │    NestJS REST API (apps/api)            │
          │         Port 3001                        │
          │   Workflow CRUD + Drizzle ORM            │
          └──────────────┬──────────────────────────┘
                         │
          ┌──────────────▼──────────────────────────┐
          │        PostgreSQL (Supabase)             │
          │  Tables: workflow, employee, customer,   │
          │  company, product, sale, onboarding,     │
          │  payroll                                 │
          └─────────────────────────────────────────┘
```

---

## 🗂️ Repository Structure

```
Deriv-hackathon/              ← Monorepo root (Turborepo + pnpm)
├── apps/
│   ├── web/                  ← Next.js 16 frontend
│   │   └── src/
│   │       ├── app/          ← App Router pages
│   │       │   ├── page.tsx              ← Home: Prompt input
│   │       │   ├── collections/          ← Saved workflows gallery
│   │       │   ├── agent/[id]/           ← Workflow execution page
│   │       │   ├── employees/            ← Employee data views
│   │       │   ├── sales/                ← Sales data views
│   │       │   └── onboarding/           ← Onboarding pipeline
│   │       ├── components/   ← Sidebar, DynamicRenderer, LiveStatus
│   │       ├── context/      ← WorkflowContext, LiveStatusContext
│   │       └── hooks/        ← use-workflows SWR hook
│   │
│   └── api/                  ← NestJS REST API
│       └── src/
│           ├── database/     ← Drizzle ORM schema & connection
│           └── modules/
│               ├── workflow/ ← Workflow CRUD endpoints
│               └── universal/
│
└── backend/                  ← Python FastAPI AI backend (git subtree)
    ├── main.py               ← Server entry point
    ├── router_factory.py     ← FastAPI app + route registration
    ├── agents/
    │   ├── agent_0_guard.py      ← Safety Guard (Groq Llama 3.1 8B)
    │   ├── agent_1_intent.py     ← Intent Analyzer (Gemini Flash)
    │   ├── agent_2_planner.py    ← Workflow Planner (Gemini Pro)
    │   ├── agent_3_n8n.py        ← n8n JSON Generator (Gemini Pro)
    │   ├── agent_validator.py    ← Output validator + disruptors
    │   └── models.py             ← Pydantic data models
    ├── services/
    │   ├── workflow_orchestrator.py  ← Main pipeline coordinator
    │   ├── workflow_persistence.py   ← Save/update to NestJS API
    │   ├── websocket_manager.py      ← Live WS streams to frontend
    │   ├── firebase_service.py       ← Firebase Storage integration
    │   └── n8n_primer_service.py     ← n8n node pre-population
    ├── controllers/          ← API endpoints (email, WhatsApp, LLM, etc.)
    ├── utils/
    │   ├── n8n_executor.py   ← Import, activate & trigger workflows
    │   └── n8n_crawler.py    ← Playwright screenshot of n8n canvas
    ├── prompts/              ← DB schema definitions for LLM context
    └── docs/                 ← Node documentation loaded at runtime
```

---

## 🤖 Multi-Agent AI Pipeline

The core of the application is a sequential 4-agent pipeline coordinated by `workflow_orchestrator.py`:

| Agent | Model | Role |
|-------|-------|------|
| **Agent 0 — Safety Guard** | Groq `llama-3.1-8b-instant` | Blocks destructive, malicious, or prompt-injection requests before any processing begins |
| **Agent 1 — Intent Analyzer** | Google `gemini-2.0-flash-001` | Maps free-text to DB schema, extracts target table, operation, values, and required tools |
| **Agent 2 — Workflow Planner** | Google `gemini-3-pro-preview` | Breaks the intent into atomic n8n nodes with proper sequencing and input requirements |
| **Agent 3 — n8n JSON Generator** | Google `gemini-3-pro-preview` | Converts the node plan into production-ready n8n workflow JSON with credentials injected |

### Validation & Retry
- Agent 3 output is validated by `agent_validator.py`
- On failure, the error is fed back as context and Agent 3 retries (up to 3 attempts)
- Critical schema violations trigger an immediate "Disruptor" abort

### Deployment Sequence (after valid JSON)
1. **Import** workflow to n8n via REST API
2. **Screenshot** the n8n canvas using Playwright → upload to Firebase Storage
3. **Save** workflow metadata to PostgreSQL (via NestJS API)
4. **Activate** workflow in n8n
5. **Trigger** webhook to execute the workflow
6. **Update** the DB record with the webhook URL and result

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts, ReactFlow |
| **BFF/REST API** | NestJS 11, Drizzle ORM, PostgreSQL (via Supabase) |
| **AI Backend** | Python 3, FastAPI, LangChain, Google Gemini, Groq (Llama) |
| **Automation** | n8n (self-hosted) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Firebase Storage (workflow screenshots) |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Real-time** | WebSocket (FastAPI + browser native WS) |

### External Services Used
- **Google Gemini** — Intent analysis, workflow planning, n8n JSON generation
- **Groq** — Safety guard (fast Llama inference)
- **Supabase** — Database + n8n Supabase node credentials
- **Firebase** — Screenshot storage
- **n8n** — Workflow execution engine
- **Twilio** — WhatsApp message delivery (via n8n node)

---

## 🗄️ Database Schema

The Supabase PostgreSQL database contains 7 business tables and 1 system table:

| Table | Purpose |
|-------|---------|
| `employee` | Employee records (name, IC, DOB, gender, email, phone) |
| `company` | Company information and registration details |
| `pay_roll` | Payroll records with EPF, tax, salary breakdowns |
| `customer` | Customer records linked to companies |
| `product` | Product catalog with pricing and supplier info |
| `sale` | Sales transactions: customer ↔ product |
| `onboarding` | Candidate onboarding pipeline stages |
| `workflow` | Generated workflow metadata, JSON, screenshots, webhook URLs |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9
- **Python** ≥ 3.10
- **n8n** (self-hosted, accessible via API)
- **Supabase** project (PostgreSQL)
- **Firebase** project (Storage)

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Deriv-hackathon
```

---

### 2. Frontend & NestJS API Setup

```bash
# Install all dependencies (from monorepo root)
pnpm install

# Set up NestJS API environment
cp apps/api/.env.example apps/api/.env
# Fill in DATABASE_URL (Supabase PostgreSQL connection string)

# Push database schema
cd apps/api
pnpm migration:push

# (Optional) Seed database with sample data
pnpm db:seed
```

---

### 3. Python AI Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env       # or create .env manually
```

**Required `.env` variables for the backend:**

```env
GOOGLE_API_KEY=your_google_gemini_api_key
GROQ_LLM_GUARD_API_KEY=your_groq_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_CREDENTIAL_ID=your_n8n_supabase_credential_id

# n8n
N8N_API_KEY=your_n8n_api_key
N8N_BASE_URL=http://localhost:5678

# Firebase
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# NestJS API (for workflow persistence)
NEST_API_URL=http://localhost:3001
```

---

### 4. Frontend Environment

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### 5. Run the Full Stack

Open **three terminal windows**:

```bash
# Terminal 1 — Frontend + NestJS API (Turborepo)
cd Deriv-hackathon
pnpm dev

# Terminal 2 — Python AI Backend
cd Deriv-hackathon/backend
venv\Scripts\activate
python main.py

# Terminal 3 — n8n (if running locally)
npx n8n
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| NestJS API | http://localhost:3001 |
| Python AI API | http://localhost:8000 |
| Python API Docs | http://localhost:8000/docs |
| n8n | http://localhost:5678 |

---

## 📡 API Endpoints

### Python FastAPI Backend (`port 8000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-workflow` | Generate an n8n workflow from a text prompt |
| `WS` | `/ws/{client_id}` | WebSocket for live generation progress |
| `POST` | `/api/parse-pdf` | Parse a PDF file and extract text |
| `POST` | `/api/whatsapp/send` | Send a WhatsApp message via Twilio |
| `POST` | `/api/email/send` | Send an email |
| `POST` | `/api/llm/generate` | Generate text using Gemini LLM |
| `POST` | `/api/calendar/create` | Create a Google Calendar event |
| `POST` | `/api/storage/upload` | Upload a file to Firebase Storage |
| `POST` | `/api/image/generate` | Generate an image using Gemini |
| `POST` | `/api/trigger-workflow` | Trigger a saved n8n workflow |

### NestJS REST API (`port 3001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows` | List all saved workflows |
| `POST` | `/workflows` | Create a workflow record |
| `GET` | `/workflows/:id` | Get a workflow by ID |
| `PATCH` | `/workflows/:id` | Update a workflow |
| `DELETE` | `/workflows/:id` | Delete a workflow |
| `POST` | `/workflows/delete-bulk` | Bulk delete workflows |

---

## 🌐 Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Home — Prompt input with suggested examples |
| `/collections` | Gallery of all generated & saved workflows |
| `/agent/:id` | Workflow execution page with dynamic input form |
| `/employees` | Employee data browser |
| `/sales` | Sales data browser |
| `/onboarding` | Onboarding pipeline view |
| `/entities` | Entity management (companies, customers, products) |

---

## ✨ Key Features

- **Natural Language → n8n JSON**: Describe automation in plain English; get a deployed workflow.
- **Live WebSocket Progress**: Watch each AI agent step complete in real time.
- **Safety Guard**: LLM-based input moderation blocks destructive or malicious prompts before processing.
- **Schema-Aware AI**: Agents are grounded in the actual Supabase DB schema, preventing hallucinated column names.
- **Auto-Retry with Feedback**: If generated JSON fails validation, the error is fed back to the generator (up to 3 retries).
- **Workflow Screenshots**: Playwright crawls the n8n UI and captures a visual snapshot of every generated workflow.
- **Dynamic Input Forms**: AI determines what inputs a recyclable workflow needs, and the frontend renders the correct form fields automatically.
- **Multi-capability Nodes**: Supports Supabase DB, WhatsApp, Email, PDF parsing, Google Calendar, image generation, and LLM text generation.

---


