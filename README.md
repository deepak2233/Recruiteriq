# RecruitIQ — Enterprise HR Recruitment Dashboard

> AI-powered resume screening, JD matching, candidate evaluation, and recruiter decision support platform.

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Scoring Logic](#scoring-logic)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RECRUITIQ PLATFORM                        │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   React UI   │         FastAPI Backend                      │
│   Dashboard  │  ┌──────────┬──────────┬──────────────┐     │
│              │  │  Resume   │   JD     │   Scoring    │     │
│  • Dashboard │  │  Parser   │  Parser  │   Engine     │     │
│  • Candidates│  │  (NLP)    │  (NLP)   │  (ML/Rules)  │     │
│  • JD View   │  ├──────────┴──────────┴──────────────┤     │
│  • Compare   │  │        SQLAlchemy ORM               │     │
│  • Analytics │  ├─────────────────────────────────────┤     │
│              │  │   SQLite (dev) / PostgreSQL (prod)   │     │
├──────────────┴──┴─────────────────────────────────────┴────┤
│                     Docker / Vercel                         │
└─────────────────────────────────────────────────────────────┘
```

### Scoring Engine Architecture

```
Candidate Resume                    Job Description
       │                                  │
       ▼                                  ▼
 ┌─────────────┐                  ┌──────────────┐
 │Resume Parser│                  │  JD Parser   │
 │ • Name      │                  │ • Mandatory  │
 │ • Skills    │                  │ • Preferred  │
 │ • Exp/Edu   │                  │ • Experience │
 │ • Certs     │                  │ • Education  │
 └──────┬──────┘                  └──────┬───────┘
        │                                │
        └────────────┬───────────────────┘
                     ▼
           ┌─────────────────┐
           │  Scoring Engine  │
           │                 │
           │ Skill    (40%)  │──→ Mandatory 2x + Preferred 1x
           │ Exp      (25%)  │──→ Band-fit + diminishing returns
           │ Education (20%) │──→ Tier + cert bonus
           │ Keywords  (15%) │──→ TF-IDF proxy + overlap
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  Recommendation  │
           │ Strong Hire/Hire │
           │ Maybe/Reject     │
           │                 │
           │ + Strengths     │
           │ + Gaps          │
           │ + Red Flags     │
           │ + Explanation   │
           └─────────────────┘
```

---

## Features

### Core Workflow
- **JD Upload & Parsing** — Auto-extract mandatory/preferred skills, experience, education, certifications
- **Resume Upload & Parsing** — PDF/DOCX/TXT parsing with NLP-based entity extraction
- **Resume-JD Matching** — Multi-factor weighted scoring with full explainability
- **Candidate Review** — Strengths/gaps/red flags analysis, shortlist recommendations
- **Recruiter Dashboard** — Funnel visualization, hiring trends, skill heatmaps

### Enterprise Capabilities
- Candidate comparison (side-by-side, up to 5)
- Duplicate resume detection (SHA256 hash)
- Bulk actions (shortlist, reject, stage change)
- Recruiter notes & feedback
- Interview stage tracking
- CSV/Excel export
- Full audit trail
- Pagination, filtering, sorting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **Frontend** | React, Recharts, Lucide Icons |
| **Parsing** | Regex + heuristic NLP (extensible to spaCy/LLM) |
| **Scoring** | Rule-based weighted engine (extensible to ML) |
| **DevOps** | Docker, Docker Compose, GitHub Actions, Vercel |
| **Testing** | Pytest, TestClient |

---

## Quick Start

### Option 1: Local Python

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/recruitiq.git
cd recruitiq

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy env
cp ../.env.example .env

# Run server
uvicorn main:app --reload --port 8000

# Seed demo data
curl -X POST http://localhost:8000/api/seed

# Open API docs
open http://localhost:8000/api/docs
```

### Option 2: Docker Compose (with PostgreSQL)

```bash
git clone https://github.com/YOUR_USERNAME/recruitiq.git
cd recruitiq

# Start all services
docker-compose up -d

# Seed demo data
curl -X POST http://localhost:8000/api/seed

# API: http://localhost:8000/api/docs
# pgAdmin: http://localhost:5050 (admin@recruitiq.dev / admin)
```

### Option 3: Run Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx ruff
pytest tests/ -v
```

---

## API Reference

### Job Descriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jd` | Create & parse JD |
| `GET` | `/api/jd` | List all JDs |
| `GET` | `/api/jd/{id}` | Get JD details |

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/candidates` | Create candidate |
| `POST` | `/api/candidates/upload-resume` | Upload & parse resume |
| `GET` | `/api/candidates` | List with filters/pagination |
| `GET` | `/api/candidates/{id}` | Get candidate details |
| `DELETE` | `/api/candidates/{id}` | Delete candidate |
| `PUT` | `/api/candidates/{id}/shortlist` | Toggle shortlist |
| `PUT` | `/api/candidates/{id}/stage` | Update interview stage |
| `POST` | `/api/candidates/{id}/notes` | Add recruiter note |
| `GET` | `/api/candidates/{id}/notes` | Get notes |
| `POST` | `/api/candidates/bulk-action` | Bulk operations |

### Scoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/score/{jd_id}` | Score all candidates vs JD |
| `GET` | `/api/score/{jd_id}/{candidate_id}` | Get specific score |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Overview statistics |
| `GET` | `/api/dashboard/funnel` | Hiring funnel data |
| `GET` | `/api/dashboard/skill-heatmap` | Skill distribution |
| `GET` | `/api/dashboard/trends` | Monthly trends |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/compare` | Compare candidates |
| `GET` | `/api/export/candidates/csv` | Export CSV |
| `GET` | `/api/audit` | Audit trail |
| `POST` | `/api/seed` | Seed demo data |

---

## Scoring Logic

### Weight Distribution

| Factor | Weight | Logic |
|--------|--------|-------|
| **Skills** | 40% | 70% mandatory match + 30% preferred match. Mandatory skills weighted 2x. |
| **Experience** | 25% | Band-fit scoring within required range (85-100). Slight penalty for over/under. |
| **Education** | 20% | Degree level (PhD > Master's > Bachelor's) + institution tier + certification bonus. |
| **Keywords** | 15% | JD keyword overlap ratio + breadth bonus for additional skills. |

### Recommendation Thresholds

| Score | Missing Mandatory | Red Flags | Recommendation |
|-------|------------------|-----------|----------------|
| ≥85 | 0 | 0 | **Strong Hire** |
| ≥75 | ≤1 | Any | **Hire** |
| ≥60 | ≤2 | Any | **Maybe** |
| <60 | Any | Any | **Reject** |

---

## Deployment

### Vercel (Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Login & link
vercel login
vercel link

# Set environment variables
vercel env add DATABASE_URL  # Use Vercel Postgres or Neon

# Deploy
vercel --prod
```

### GitHub Actions Setup

1. Add these secrets in GitHub repo settings:
   - `VERCEL_TOKEN` — from Vercel dashboard
   - `VERCEL_ORG_ID` — from `.vercel/project.json`
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json`

2. Push to `main` branch → auto-deploys to production
3. PRs → deploy preview URLs

### Railway / Render (Docker)

```bash
# Railway
railway init
railway link
railway up

# Render
# Connect GitHub repo → Auto-deploy from Dockerfile
```

---

## Project Structure

```
recruitiq/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # ORM models (7 tables)
│   ├── schemas.py           # Pydantic request/response
│   ├── scoring_engine.py    # ML scoring logic (explainable)
│   ├── resume_parser.py     # NLP resume extraction
│   ├── jd_parser.py         # JD requirement extraction
│   ├── requirements.txt     # Python dependencies
│   └── tests/
│       ├── __init__.py
│       └── test_api.py      # 20+ test cases
├── frontend/
│   └── src/                 # React dashboard (see artifact)
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions pipeline
├── .env.example             # Environment template
├── .gitignore
├── Dockerfile               # Container build
├── docker-compose.yml       # Local dev with PostgreSQL
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

---

## Future Enhancements

- [ ] LLM-powered resume parsing (Claude/GPT)
- [ ] Semantic search with pgvector embeddings
- [ ] ATS integration (Greenhouse, Lever, Workday)
- [ ] Email notification pipeline
- [ ] Candidate self-service portal
- [ ] Multi-tenant support
- [ ] Role-based access control (RBAC)
- [ ] Calendar integration for interviews
- [ ] Video interview assessment module
- [ ] Bias detection & fairness metrics

---

## License

MIT License. Built with FastAPI + SQLAlchemy + React.
