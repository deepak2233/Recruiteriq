"""
Pydantic Schemas - API Request/Response Models
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any


# ─── JD Schemas ───
class JDCreate(BaseModel):
    title: str
    company: str = ""
    location: str = ""
    department: str = ""
    experience_min: float = 0
    experience_max: float = 0
    salary_min: float = 0
    salary_max: float = 0
    education: str = ""
    raw_text: str = ""
    mandatory_skills: List[str] = []
    preferred_skills: List[str] = []
    certifications: List[str] = []
    domain_knowledge: List[str] = []


class JDResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    department: str
    experience_min: float
    experience_max: float
    salary_min: float
    salary_max: float
    education: str
    mandatory_skills: List[str]
    preferred_skills: List[str]
    certifications: List[str]
    domain_knowledge: List[str]
    responsibilities: List[str]
    parsed: bool
    created_at: str


# ─── Candidate Schemas ───
class CandidateCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    location: str = ""
    experience_years: float = 0
    current_ctc: str = ""
    expected_ctc: str = ""
    notice_period: str = ""
    education: str = ""
    gender: str = ""
    skills: List[str] = []
    companies: List[str] = []
    projects: List[str] = []
    achievements: List[str] = []
    certifications: List[str] = []
    resume_hash: str = ""


class CandidateScoreResponse(BaseModel):
    overall_score: float
    skill_score: float
    experience_score: float
    education_score: float
    keyword_score: float
    missing_mandatory: List[str]
    missing_preferred: List[str]
    strengths: List[str]
    gaps: List[str]
    red_flags: List[str]
    recommendation: str
    explanation: Dict[str, Any] = {}


class CandidateResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    location: str
    experience_years: float
    current_ctc: str
    expected_ctc: str
    notice_period: str
    education: str
    gender: str
    skills: List[str]
    companies: List[str]
    projects: List[str]
    achievements: List[str]
    certifications: List[str]
    interview_stage: str
    shortlisted: bool
    scores: Optional[CandidateScoreResponse] = None
    created_at: str


class CandidateListResponse(BaseModel):
    candidates: List[CandidateResponse]
    total: int
    page: int
    page_size: int


# ─── Comparison ───
class CompareRequest(BaseModel):
    candidate_ids: List[str]
    jd_id: str


class CompareResponse(BaseModel):
    candidates: List[CandidateResponse]
    jd_id: str


# ─── Notes & Stage ───
class NoteCreate(BaseModel):
    author: str = "Recruiter"
    content: str


class StageUpdate(BaseModel):
    stage: str


# ─── Dashboard ───
class DashboardStats(BaseModel):
    total_applicants: int
    shortlisted: int
    rejected: int
    avg_match_score: float
    strong_hires: int


class FunnelData(BaseModel):
    stage: str
    count: int


class SkillHeatmapItem(BaseModel):
    skill: str
    candidate_count: int
    avg_score: float


class HiringTrend(BaseModel):
    month: str
    applications: int
    shortlisted: int
    hired: int


class ScoreBreakdown(BaseModel):
    category: str
    score: float
    weight: float
    details: str


class BulkActionRequest(BaseModel):
    candidate_ids: List[str]
    action: str  # "shortlist", "unshortlist", "change_stage"
    value: Optional[str] = None
