"""
SQLAlchemy ORM Models - RecruitIQ Database Schema
"""

from sqlalchemy import Column, String, Float, Boolean, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String, primary_key=True)
    title = Column(String(200), nullable=False)
    company = Column(String(200))
    location = Column(String(200))
    department = Column(String(100))
    experience_min = Column(Float, default=0)
    experience_max = Column(Float, default=0)
    salary_min = Column(Float, default=0)
    salary_max = Column(Float, default=0)
    education = Column(String(500))
    raw_text = Column(Text)
    mandatory_skills = Column(Text)       # JSON array
    preferred_skills = Column(Text)       # JSON array
    certifications = Column(Text)         # JSON array
    domain_knowledge = Column(Text)       # JSON array
    responsibilities = Column(Text)       # JSON array
    parsed = Column(Boolean, default=False)
    created_at = Column(DateTime)

    scores = relationship("CandidateScore", back_populates="jd", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200))
    phone = Column(String(50))
    location = Column(String(200))
    experience_years = Column(Float, default=0)
    current_ctc = Column(String(50))
    expected_ctc = Column(String(50))
    notice_period = Column(String(50))
    education = Column(String(500))
    gender = Column(String(20))
    companies = Column(Text)              # JSON array
    projects = Column(Text)               # JSON array
    achievements = Column(Text)           # JSON array
    certifications = Column(Text)         # JSON array
    resume_hash = Column(String(64))      # SHA256 for duplicate detection
    interview_stage = Column(String(50), default="Applied")
    shortlisted = Column(Boolean, default=False)
    created_at = Column(DateTime)

    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    scores = relationship("CandidateScore", back_populates="candidate", cascade="all, delete-orphan")
    notes = relationship("RecruiterNote", back_populates="candidate", cascade="all, delete-orphan")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"))
    skill_name = Column(String(100), nullable=False)

    candidate = relationship("Candidate", back_populates="skills")


class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"))
    jd_id = Column(String, ForeignKey("job_descriptions.id", ondelete="CASCADE"))
    overall_score = Column(Float, default=0)
    skill_score = Column(Float, default=0)
    experience_score = Column(Float, default=0)
    education_score = Column(Float, default=0)
    keyword_score = Column(Float, default=0)
    missing_mandatory = Column(Text)      # JSON array
    missing_preferred = Column(Text)      # JSON array
    strengths = Column(Text)              # JSON array
    gaps = Column(Text)                   # JSON array
    red_flags = Column(Text)              # JSON array
    recommendation = Column(String(50))
    score_explanation = Column(Text)      # JSON object
    scored_at = Column(DateTime)

    candidate = relationship("Candidate", back_populates="scores")
    jd = relationship("JobDescription", back_populates="scores")


class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"

    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"))
    author = Column(String(100))
    content = Column(Text)
    created_at = Column(DateTime)

    candidate = relationship("Candidate", back_populates="notes")


class InterviewStage(Base):
    __tablename__ = "interview_stages"

    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"))
    stage = Column(String(50))
    scheduled_at = Column(DateTime)
    interviewer = Column(String(100))
    feedback = Column(Text)
    rating = Column(Float)
    created_at = Column(DateTime)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    action = Column(String(50))
    details = Column(Text)
    candidate_id = Column(String, nullable=True)
    jd_id = Column(String, nullable=True)
    created_at = Column(DateTime)
