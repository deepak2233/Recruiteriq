"""
RecruitIQ - Enterprise HR Recruitment Dashboard Backend
FastAPI + SQLAlchemy + SQLite (swap to PostgreSQL for production)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import json, io, csv, uuid

from database import engine, get_db, Base
from models import (
    JobDescription, Candidate, CandidateSkill, CandidateScore,
    RecruiterNote, InterviewStage, AuditLog
)
from schemas import (
    JDCreate, JDResponse, CandidateCreate, CandidateResponse,
    CandidateScoreResponse, CompareRequest, CompareResponse,
    NoteCreate, StageUpdate, DashboardStats, FunnelData,
    SkillHeatmapItem, HiringTrend, CandidateListResponse,
    ScoreBreakdown, BulkActionRequest
)
from scoring_engine import ScoringEngine
from resume_parser import ResumeParser
from jd_parser import JDParser

# ─── Create tables ───
Base.metadata.create_all(bind=engine)

# ─── App init ───
app = FastAPI(
    title="RecruitIQ API",
    description="Enterprise HR Recruitment Dashboard - AI-Powered Screening Engine",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scoring = ScoringEngine()
resume_parser = ResumeParser()
jd_parser = JDParser()


# ─── HEALTH CHECK ───
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "RecruitIQ", "version": "2.0.0"}


# ═══════════════════════════════════════════════════════════
# JOB DESCRIPTION ENDPOINTS
# ═══════════════════════════════════════════════════════════

@app.post("/api/jd", response_model=JDResponse)
def create_jd(jd_data: JDCreate, db: Session = Depends(get_db)):
    """Create/upload a Job Description and auto-parse requirements."""
    parsed = jd_parser.parse(jd_data.raw_text or "", jd_data.title)
    
    jd = JobDescription(
        id=str(uuid.uuid4()),
        title=jd_data.title,
        company=jd_data.company,
        location=jd_data.location,
        department=jd_data.department,
        experience_min=jd_data.experience_min,
        experience_max=jd_data.experience_max,
        salary_min=jd_data.salary_min,
        salary_max=jd_data.salary_max,
        education=jd_data.education,
        raw_text=jd_data.raw_text,
        mandatory_skills=json.dumps(parsed["mandatory_skills"]),
        preferred_skills=json.dumps(parsed["preferred_skills"]),
        certifications=json.dumps(parsed.get("certifications", [])),
        domain_knowledge=json.dumps(parsed.get("domain_knowledge", [])),
        responsibilities=json.dumps(parsed.get("responsibilities", [])),
        parsed=True,
        created_at=datetime.utcnow(),
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)

    _audit(db, "JD_CREATED", f"JD '{jd.title}' created", jd_id=jd.id)
    return _jd_to_response(jd)


@app.get("/api/jd", response_model=List[JDResponse])
def list_jds(db: Session = Depends(get_db)):
    jds = db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()
    return [_jd_to_response(j) for j in jds]


@app.get("/api/jd/{jd_id}", response_model=JDResponse)
def get_jd(jd_id: str, db: Session = Depends(get_db)):
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")
    return _jd_to_response(jd)


# ═══════════════════════════════════════════════════════════
# CANDIDATE ENDPOINTS
# ═══════════════════════════════════════════════════════════

@app.post("/api/candidates", response_model=CandidateResponse)
def create_candidate(data: CandidateCreate, db: Session = Depends(get_db)):
    """Create a candidate manually."""
    candidate = Candidate(
        id=str(uuid.uuid4()),
        name=data.name,
        email=data.email,
        phone=data.phone,
        location=data.location,
        experience_years=data.experience_years,
        current_ctc=data.current_ctc,
        expected_ctc=data.expected_ctc,
        notice_period=data.notice_period,
        education=data.education,
        gender=data.gender,
        companies=json.dumps(data.companies or []),
        projects=json.dumps(data.projects or []),
        achievements=json.dumps(data.achievements or []),
        certifications=json.dumps(data.certifications or []),
        resume_hash=data.resume_hash,
        created_at=datetime.utcnow(),
        interview_stage="Applied",
        shortlisted=False,
    )
    db.add(candidate)
    
    # Add skills
    for skill_name in (data.skills or []):
        db.add(CandidateSkill(
            id=str(uuid.uuid4()),
            candidate_id=candidate.id,
            skill_name=skill_name,
        ))
    
    db.commit()
    db.refresh(candidate)
    _audit(db, "CANDIDATE_CREATED", f"Candidate '{data.name}' added", candidate_id=candidate.id)
    return _candidate_to_response(candidate, db)


@app.post("/api/candidates/upload-resume")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a resume file (PDF/DOCX) and auto-parse candidate info."""
    if not file.filename.lower().endswith(('.pdf', '.docx', '.doc', '.txt')):
        raise HTTPException(400, "Supported formats: PDF, DOCX, DOC, TXT")
    
    content = await file.read()
    parsed = resume_parser.parse(content, file.filename)
    
    # Check duplicate by email or resume hash
    resume_hash = resume_parser.compute_hash(content)
    existing = db.query(Candidate).filter(
        (Candidate.email == parsed.get("email")) | 
        (Candidate.resume_hash == resume_hash)
    ).first()
    if existing:
        raise HTTPException(409, detail={
            "message": "Duplicate resume detected",
            "existing_candidate_id": existing.id,
            "existing_candidate_name": existing.name,
        })
    
    candidate = Candidate(
        id=str(uuid.uuid4()),
        name=parsed.get("name", "Unknown"),
        email=parsed.get("email", ""),
        phone=parsed.get("phone", ""),
        location=parsed.get("location", ""),
        experience_years=parsed.get("experience_years", 0),
        current_ctc=parsed.get("current_ctc", ""),
        expected_ctc=parsed.get("expected_ctc", ""),
        notice_period=parsed.get("notice_period", ""),
        education=parsed.get("education", ""),
        gender=parsed.get("gender", ""),
        companies=json.dumps(parsed.get("companies", [])),
        projects=json.dumps(parsed.get("projects", [])),
        achievements=json.dumps(parsed.get("achievements", [])),
        certifications=json.dumps(parsed.get("certifications", [])),
        resume_hash=resume_hash,
        created_at=datetime.utcnow(),
        interview_stage="Applied",
        shortlisted=False,
    )
    db.add(candidate)
    
    for skill_name in parsed.get("skills", []):
        db.add(CandidateSkill(
            id=str(uuid.uuid4()),
            candidate_id=candidate.id,
            skill_name=skill_name,
        ))
    
    db.commit()
    db.refresh(candidate)
    _audit(db, "RESUME_UPLOADED", f"Resume parsed for '{candidate.name}'", candidate_id=candidate.id)
    return _candidate_to_response(candidate, db)


@app.get("/api/candidates", response_model=CandidateListResponse)
def list_candidates(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    shortlisted: Optional[bool] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    min_experience: Optional[float] = None,
    max_experience: Optional[float] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,  # comma-separated
    stage: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 50,
):
    """List candidates with advanced filtering, sorting, and pagination."""
    q = db.query(Candidate)
    
    if search:
        q = q.filter(
            Candidate.name.ilike(f"%{search}%") |
            Candidate.email.ilike(f"%{search}%") |
            Candidate.location.ilike(f"%{search}%")
        )
    if shortlisted is not None:
        q = q.filter(Candidate.shortlisted == shortlisted)
    if min_experience is not None:
        q = q.filter(Candidate.experience_years >= min_experience)
    if max_experience is not None:
        q = q.filter(Candidate.experience_years <= max_experience)
    if location:
        q = q.filter(Candidate.location.ilike(f"%{location}%"))
    if stage:
        q = q.filter(Candidate.interview_stage == stage)
    
    # Sorting
    sort_col = getattr(Candidate, sort_by, Candidate.created_at)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())
    
    total = q.count()
    candidates = q.offset((page - 1) * page_size).limit(page_size).all()
    
    results = []
    for c in candidates:
        resp = _candidate_to_response(c, db)
        # Filter by skills post-query (for simplicity; use JOIN in production)
        if skills:
            required = [s.strip().lower() for s in skills.split(",")]
            candidate_skills = [s.lower() for s in resp.skills]
            if not all(r in candidate_skills for r in required):
                continue
        # Filter by score post-query
        if min_score and resp.scores and resp.scores.overall_score < min_score:
            continue
        if max_score and resp.scores and resp.scores.overall_score > max_score:
            continue
        results.append(resp)
    
    return CandidateListResponse(
        candidates=results,
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/api/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    return _candidate_to_response(c, db)


@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    _audit(db, "CANDIDATE_DELETED", f"Candidate '{c.name}' deleted", candidate_id=c.id)
    db.delete(c)
    db.commit()
    return {"message": "Candidate deleted"}


@app.post("/api/candidates/bulk-action")
def bulk_action(req: BulkActionRequest, db: Session = Depends(get_db)):
    """Bulk shortlist, reject, or change stage for multiple candidates."""
    candidates = db.query(Candidate).filter(Candidate.id.in_(req.candidate_ids)).all()
    for c in candidates:
        if req.action == "shortlist":
            c.shortlisted = True
        elif req.action == "unshortlist":
            c.shortlisted = False
        elif req.action == "change_stage" and req.value:
            c.interview_stage = req.value
        _audit(db, f"BULK_{req.action.upper()}", f"Bulk {req.action} for '{c.name}'", candidate_id=c.id)
    db.commit()
    return {"message": f"Applied '{req.action}' to {len(candidates)} candidates"}


# ═══════════════════════════════════════════════════════════
# SCORING & MATCHING ENGINE
# ═══════════════════════════════════════════════════════════

@app.post("/api/score/{jd_id}")
def score_all_candidates(jd_id: str, db: Session = Depends(get_db)):
    """Score ALL candidates against a specific JD."""
    jd = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not jd:
        raise HTTPException(404, "JD not found")
    
    candidates = db.query(Candidate).all()
    results = []
    
    for c in candidates:
        skills = [s.skill_name for s in db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == c.id
        ).all()]
        
        score_result = scoring.compute_score(
            candidate_skills=skills,
            candidate_experience=c.experience_years,
            candidate_education=c.education,
            candidate_certifications=json.loads(c.certifications or "[]"),
            mandatory_skills=json.loads(jd.mandatory_skills or "[]"),
            preferred_skills=json.loads(jd.preferred_skills or "[]"),
            required_experience_min=jd.experience_min,
            required_experience_max=jd.experience_max,
            required_education=jd.education,
            required_certifications=json.loads(jd.certifications or "[]"),
        )
        
        # Upsert score
        existing = db.query(CandidateScore).filter(
            CandidateScore.candidate_id == c.id,
            CandidateScore.jd_id == jd_id,
        ).first()
        
        if existing:
            for k, v in score_result.items():
                if isinstance(v, (list, dict)):
                    setattr(existing, k, json.dumps(v))
                else:
                    setattr(existing, k, v)
            existing.scored_at = datetime.utcnow()
        else:
            db.add(CandidateScore(
                id=str(uuid.uuid4()),
                candidate_id=c.id,
                jd_id=jd_id,
                overall_score=score_result["overall_score"],
                skill_score=score_result["skill_score"],
                experience_score=score_result["experience_score"],
                education_score=score_result["education_score"],
                keyword_score=score_result["keyword_score"],
                missing_mandatory=json.dumps(score_result["missing_mandatory"]),
                missing_preferred=json.dumps(score_result["missing_preferred"]),
                strengths=json.dumps(score_result["strengths"]),
                gaps=json.dumps(score_result["gaps"]),
                red_flags=json.dumps(score_result["red_flags"]),
                recommendation=score_result["recommendation"],
                score_explanation=json.dumps(score_result["explanation"]),
                scored_at=datetime.utcnow(),
            ))
        
        results.append({
            "candidate_id": c.id,
            "name": c.name,
            **score_result,
        })
    
    db.commit()
    _audit(db, "SCORING_RUN", f"Scored {len(candidates)} candidates against JD '{jd.title}'", jd_id=jd_id)
    return {"scored": len(results), "results": results}


@app.get("/api/score/{jd_id}/{candidate_id}", response_model=CandidateScoreResponse)
def get_candidate_score(jd_id: str, candidate_id: str, db: Session = Depends(get_db)):
    score = db.query(CandidateScore).filter(
        CandidateScore.jd_id == jd_id,
        CandidateScore.candidate_id == candidate_id,
    ).first()
    if not score:
        raise HTTPException(404, "Score not found. Run scoring first.")
    return _score_to_response(score)


# ═══════════════════════════════════════════════════════════
# COMPARISON & ANALYTICS
# ═══════════════════════════════════════════════════════════

@app.post("/api/compare", response_model=CompareResponse)
def compare_candidates(req: CompareRequest, db: Session = Depends(get_db)):
    """Side-by-side comparison of 2-5 candidates."""
    candidates = db.query(Candidate).filter(Candidate.id.in_(req.candidate_ids)).all()
    if len(candidates) < 2:
        raise HTTPException(400, "Need at least 2 candidates to compare")
    
    results = []
    for c in candidates:
        resp = _candidate_to_response(c, db, jd_id=req.jd_id)
        results.append(resp)
    
    return CompareResponse(candidates=results, jd_id=req.jd_id)


@app.get("/api/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(jd_id: Optional[str] = None, db: Session = Depends(get_db)):
    total = db.query(Candidate).count()
    shortlisted = db.query(Candidate).filter(Candidate.shortlisted == True).count()
    rejected = db.query(Candidate).filter(Candidate.interview_stage == "Rejected").count()
    
    avg_score = 0
    strong_hires = 0
    if jd_id:
        scores = db.query(CandidateScore).filter(CandidateScore.jd_id == jd_id).all()
        if scores:
            avg_score = round(sum(s.overall_score for s in scores) / len(scores), 1)
            strong_hires = sum(1 for s in scores if s.recommendation == "Strong Hire")
    
    return DashboardStats(
        total_applicants=total,
        shortlisted=shortlisted,
        rejected=rejected,
        avg_match_score=avg_score,
        strong_hires=strong_hires,
    )


@app.get("/api/dashboard/funnel", response_model=List[FunnelData])
def hiring_funnel(db: Session = Depends(get_db)):
    stages = ["Applied", "Screening", "Technical Round 1", "Technical Round 2",
              "HR Round", "Final Round", "Offer", "Rejected"]
    result = []
    for stage in stages:
        count = db.query(Candidate).filter(Candidate.interview_stage == stage).count()
        result.append(FunnelData(stage=stage, count=count))
    return result


@app.get("/api/dashboard/skill-heatmap", response_model=List[SkillHeatmapItem])
def skill_heatmap(jd_id: Optional[str] = None, db: Session = Depends(get_db)):
    skills_q = db.query(CandidateSkill.skill_name).all()
    skill_counts = {}
    for (s,) in skills_q:
        skill_counts[s] = skill_counts.get(s, 0) + 1
    
    result = []
    for skill, count in sorted(skill_counts.items(), key=lambda x: -x[1]):
        result.append(SkillHeatmapItem(skill=skill, candidate_count=count, avg_score=0))
    return result


@app.get("/api/dashboard/trends", response_model=List[HiringTrend])
def hiring_trends(db: Session = Depends(get_db)):
    # In production: aggregate by month from actual data
    # For now, return mock trends
    return [
        HiringTrend(month="Oct", applications=180, shortlisted=42, hired=3),
        HiringTrend(month="Nov", applications=210, shortlisted=55, hired=4),
        HiringTrend(month="Dec", applications=165, shortlisted=38, hired=2),
        HiringTrend(month="Jan", applications=248, shortlisted=62, hired=5),
        HiringTrend(month="Feb", applications=290, shortlisted=78, hired=6),
        HiringTrend(month="Mar", applications=320, shortlisted=85, hired=7),
    ]


# ═══════════════════════════════════════════════════════════
# RECRUITER NOTES & INTERVIEW TRACKING
# ═══════════════════════════════════════════════════════════

@app.post("/api/candidates/{candidate_id}/notes")
def add_note(candidate_id: str, note: NoteCreate, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    
    n = RecruiterNote(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        author=note.author,
        content=note.content,
        created_at=datetime.utcnow(),
    )
    db.add(n)
    db.commit()
    _audit(db, "NOTE_ADDED", f"Note added for '{c.name}'", candidate_id=candidate_id)
    return {"id": n.id, "message": "Note added"}


@app.get("/api/candidates/{candidate_id}/notes")
def get_notes(candidate_id: str, db: Session = Depends(get_db)):
    notes = db.query(RecruiterNote).filter(
        RecruiterNote.candidate_id == candidate_id
    ).order_by(RecruiterNote.created_at.desc()).all()
    return [{"id": n.id, "author": n.author, "content": n.content,
             "created_at": n.created_at.isoformat()} for n in notes]


@app.put("/api/candidates/{candidate_id}/stage")
def update_stage(candidate_id: str, update: StageUpdate, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    old_stage = c.interview_stage
    c.interview_stage = update.stage
    db.commit()
    _audit(db, "STAGE_CHANGE", f"'{c.name}' moved from '{old_stage}' to '{update.stage}'",
           candidate_id=candidate_id)
    return {"message": f"Stage updated to {update.stage}"}


@app.put("/api/candidates/{candidate_id}/shortlist")
def toggle_shortlist(candidate_id: str, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    c.shortlisted = not c.shortlisted
    db.commit()
    action = "shortlisted" if c.shortlisted else "removed from shortlist"
    _audit(db, "SHORTLIST_TOGGLE", f"'{c.name}' {action}", candidate_id=candidate_id)
    return {"shortlisted": c.shortlisted}


# ═══════════════════════════════════════════════════════════
# EXPORT & AUDIT
# ═══════════════════════════════════════════════════════════

@app.get("/api/export/candidates/csv")
def export_csv(jd_id: Optional[str] = None, db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Location", "Experience", "Education",
                     "Stage", "Shortlisted", "Score", "Recommendation"])
    for c in candidates:
        score = None
        if jd_id:
            score = db.query(CandidateScore).filter(
                CandidateScore.candidate_id == c.id,
                CandidateScore.jd_id == jd_id,
            ).first()
        writer.writerow([
            c.id, c.name, c.email, c.location, c.experience_years, c.education,
            c.interview_stage, c.shortlisted,
            score.overall_score if score else "N/A",
            score.recommendation if score else "N/A",
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidates_export.csv"},
    )


@app.get("/api/audit")
def get_audit_log(
    limit: int = 100,
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "action": l.action, "details": l.details,
             "candidate_id": l.candidate_id, "jd_id": l.jd_id,
             "created_at": l.created_at.isoformat()} for l in logs]


# ═══════════════════════════════════════════════════════════
# SEED DATA (for demo)
# ═══════════════════════════════════════════════════════════

@app.post("/api/seed")
def seed_data(db: Session = Depends(get_db)):
    """Seed database with demo JD and candidates."""
    # Check if already seeded
    if db.query(JobDescription).count() > 0:
        return {"message": "Already seeded"}
    
    # Create JD
    jd = JobDescription(
        id="jd-001",
        title="Senior Full-Stack Engineer",
        company="TechNova Global",
        location="Bangalore, India (Hybrid)",
        department="Engineering",
        experience_min=5, experience_max=8,
        salary_min=3500000, salary_max=5500000,
        education="B.Tech/M.Tech in CS/IT",
        raw_text="",
        mandatory_skills=json.dumps(["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git"]),
        preferred_skills=json.dumps(["GraphQL", "Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform", "Python"]),
        certifications=json.dumps(["AWS Certified", "Kubernetes Certified"]),
        domain_knowledge=json.dumps(["Fintech", "E-commerce", "SaaS"]),
        responsibilities=json.dumps([
            "Design and build scalable microservices",
            "Lead frontend development with React/TypeScript",
            "Mentor junior engineers",
            "Optimize performance and reliability",
        ]),
        parsed=True,
        created_at=datetime.utcnow(),
    )
    db.add(jd)
    
    # Create candidates
    seed_candidates = [
        {"name": "Priya Sharma", "email": "priya.sharma@gmail.com", "phone": "+91-98765-43210",
         "location": "Bangalore", "experience_years": 6.5, "education": "M.Tech, IIT Bombay",
         "gender": "Female", "notice_period": "30 days", "current_ctc": "38L", "expected_ctc": "48L",
         "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "Redis", "Python", "Kubernetes"],
         "companies": ["Flipkart (3y)", "Freshworks (2y)", "Startup (1.5y)"],
         "certifications": ["AWS Solutions Architect", "Google Cloud Professional"],
         "projects": ["Real-time payment system 10K TPS", "Monolith to microservices migration"],
         "achievements": ["Patent holder", "Speaker JSConf India 2024"],
         "stage": "Technical Round 2", "shortlisted": True},
        {"name": "Arjun Mehta", "email": "arjun.m@outlook.com", "phone": "+91-87654-32109",
         "location": "Pune", "experience_years": 7.2, "education": "B.Tech, NIT Trichy",
         "gender": "Male", "notice_period": "60 days", "current_ctc": "42L", "expected_ctc": "52L",
         "skills": ["React", "Node.js", "TypeScript", "AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "REST APIs", "Git"],
         "companies": ["Amazon (3y)", "Infosys (2y)", "TCS (2.2y)"],
         "certifications": ["AWS Certified Developer", "Kubernetes CKA"],
         "projects": ["Auto-scaling infra for 50M+ users", "CI/CD pipelines -70% deploy time"],
         "achievements": ["Promoted twice at Amazon", "2K+ GitHub stars"],
         "stage": "HR Round", "shortlisted": True},
        {"name": "Sneha Reddy", "email": "sneha.r@yahoo.com", "phone": "+91-76543-21098",
         "location": "Hyderabad", "experience_years": 5.8, "education": "M.Sc CS, IIIT Hyderabad",
         "gender": "Female", "notice_period": "90 days", "current_ctc": "35L", "expected_ctc": "45L",
         "skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git", "Python", "Elasticsearch", "Redis"],
         "companies": ["Microsoft (2.5y)", "Deloitte (2y)", "Capgemini (1.3y)"],
         "certifications": ["Azure Certified"],
         "projects": ["Search platform 5M queries/day", "C-suite analytics dashboard"],
         "achievements": ["Microsoft Hackathon winner 2023", "Published NLP paper"],
         "stage": "Technical Round 1", "shortlisted": True},
        {"name": "Vikram Singh", "email": "vikram.s@gmail.com", "phone": "+91-65432-10987",
         "location": "Delhi NCR", "experience_years": 5.1, "education": "B.Tech, DTU",
         "gender": "Male", "notice_period": "30 days", "current_ctc": "32L", "expected_ctc": "40L",
         "skills": ["React", "Node.js", "TypeScript", "Git", "REST APIs", "Docker", "MongoDB"],
         "companies": ["Paytm (2y)", "Wipro (3.1y)"],
         "certifications": [],
         "projects": ["Payment reconciliation module", "Merchant admin dashboard"],
         "achievements": ["Best team award Paytm Q3 2023"],
         "stage": "Screening", "shortlisted": False},
        {"name": "Ananya Iyer", "email": "ananya.i@proton.me", "phone": "+91-54321-09876",
         "location": "Chennai", "experience_years": 6.0, "education": "B.E, Anna University + MBA, ISB",
         "gender": "Female", "notice_period": "45 days", "current_ctc": "40L", "expected_ctc": "50L",
         "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "CI/CD", "Git", "REST APIs", "Terraform"],
         "companies": ["Google (2y)", "Zoho (2.5y)", "Startup CTO (1.5y)"],
         "certifications": ["AWS Solutions Architect", "Scrum Master"],
         "projects": ["SaaS platform 0 to 50K users", "Google Workspace integration"],
         "achievements": ["Forbes 30 Under 30 nominee", "Raised $2M seed"],
         "stage": "Final Round", "shortlisted": True},
        {"name": "Rahul Verma", "email": "rahul.v@gmail.com", "phone": "+91-43210-98765",
         "location": "Mumbai", "experience_years": 4.5, "education": "B.Tech, VIT Vellore",
         "gender": "Male", "notice_period": "60 days", "current_ctc": "28L", "expected_ctc": "38L",
         "skills": ["React", "JavaScript", "Node.js", "MongoDB", "Git", "REST APIs", "HTML/CSS"],
         "companies": ["Accenture (2.5y)", "Cognizant (2y)"],
         "certifications": [],
         "projects": ["Internal HR portal", "Reporting module"],
         "achievements": ["Star performer Q2 2024"],
         "stage": "Rejected", "shortlisted": False},
    ]
    
    for cd in seed_candidates:
        c = Candidate(
            id=str(uuid.uuid4()), name=cd["name"], email=cd["email"], phone=cd["phone"],
            location=cd["location"], experience_years=cd["experience_years"],
            education=cd["education"], gender=cd["gender"],
            notice_period=cd["notice_period"], current_ctc=cd["current_ctc"],
            expected_ctc=cd["expected_ctc"],
            companies=json.dumps(cd["companies"]), projects=json.dumps(cd["projects"]),
            achievements=json.dumps(cd["achievements"]), certifications=json.dumps(cd["certifications"]),
            resume_hash="", interview_stage=cd["stage"], shortlisted=cd["shortlisted"],
            created_at=datetime.utcnow(),
        )
        db.add(c)
        db.flush()
        for sk in cd["skills"]:
            db.add(CandidateSkill(id=str(uuid.uuid4()), candidate_id=c.id, skill_name=sk))
    
    db.commit()
    
    # Auto-score all candidates
    score_all_candidates("jd-001", db)
    
    return {"message": "Seeded 1 JD + 6 candidates with scores"}


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def _jd_to_response(jd: JobDescription) -> JDResponse:
    return JDResponse(
        id=jd.id, title=jd.title, company=jd.company, location=jd.location,
        department=jd.department, experience_min=jd.experience_min,
        experience_max=jd.experience_max, salary_min=jd.salary_min,
        salary_max=jd.salary_max, education=jd.education,
        mandatory_skills=json.loads(jd.mandatory_skills or "[]"),
        preferred_skills=json.loads(jd.preferred_skills or "[]"),
        certifications=json.loads(jd.certifications or "[]"),
        domain_knowledge=json.loads(jd.domain_knowledge or "[]"),
        responsibilities=json.loads(jd.responsibilities or "[]"),
        parsed=jd.parsed, created_at=jd.created_at.isoformat(),
    )


def _candidate_to_response(c: Candidate, db: Session, jd_id: str = None) -> CandidateResponse:
    skills = [s.skill_name for s in db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == c.id).all()]
    
    score = None
    if jd_id:
        score_obj = db.query(CandidateScore).filter(
            CandidateScore.candidate_id == c.id,
            CandidateScore.jd_id == jd_id,
        ).first()
        if score_obj:
            score = _score_to_response(score_obj)
    else:
        # Get latest score
        score_obj = db.query(CandidateScore).filter(
            CandidateScore.candidate_id == c.id
        ).order_by(CandidateScore.scored_at.desc()).first()
        if score_obj:
            score = _score_to_response(score_obj)
    
    return CandidateResponse(
        id=c.id, name=c.name, email=c.email, phone=c.phone,
        location=c.location, experience_years=c.experience_years,
        current_ctc=c.current_ctc, expected_ctc=c.expected_ctc,
        notice_period=c.notice_period, education=c.education,
        gender=c.gender, skills=skills,
        companies=json.loads(c.companies or "[]"),
        projects=json.loads(c.projects or "[]"),
        achievements=json.loads(c.achievements or "[]"),
        certifications=json.loads(c.certifications or "[]"),
        interview_stage=c.interview_stage, shortlisted=c.shortlisted,
        scores=score, created_at=c.created_at.isoformat(),
    )


def _score_to_response(s: CandidateScore) -> CandidateScoreResponse:
    return CandidateScoreResponse(
        overall_score=s.overall_score, skill_score=s.skill_score,
        experience_score=s.experience_score, education_score=s.education_score,
        keyword_score=s.keyword_score,
        missing_mandatory=json.loads(s.missing_mandatory or "[]"),
        missing_preferred=json.loads(s.missing_preferred or "[]"),
        strengths=json.loads(s.strengths or "[]"),
        gaps=json.loads(s.gaps or "[]"),
        red_flags=json.loads(s.red_flags or "[]"),
        recommendation=s.recommendation,
        explanation=json.loads(s.score_explanation or "{}"),
    )


def _audit(db: Session, action: str, details: str,
           candidate_id: str = None, jd_id: str = None):
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        action=action,
        details=details,
        candidate_id=candidate_id,
        jd_id=jd_id,
        created_at=datetime.utcnow(),
    ))
