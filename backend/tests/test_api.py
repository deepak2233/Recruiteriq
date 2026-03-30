"""
RecruitIQ Test Suite
Run: pytest tests/ -v
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db


# ─── Test DB Setup ───
TEST_DB_URL = "sqlite:///./test_recruitiq.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ═══════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════

class TestHealth:
    def test_health_check(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "RecruitIQ"


# ═══════════════════════════════════════════
# Job Description CRUD
# ═══════════════════════════════════════════

class TestJD:
    def test_create_jd(self):
        r = client.post("/api/jd", json={
            "title": "Senior Backend Engineer",
            "company": "TestCorp",
            "location": "Bangalore",
            "experience_min": 5,
            "experience_max": 8,
            "education": "B.Tech CS",
            "raw_text": "Must have Python, AWS, Docker. Nice to have Kubernetes.",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "Senior Backend Engineer"
        assert data["parsed"] == True
        assert len(data["mandatory_skills"]) > 0

    def test_list_jds(self):
        r = client.get("/api/jd")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ═══════════════════════════════════════════
# Candidate CRUD
# ═══════════════════════════════════════════

class TestCandidates:
    def test_create_candidate(self):
        r = client.post("/api/candidates", json={
            "name": "Test Candidate",
            "email": "test@example.com",
            "phone": "+91-12345-67890",
            "location": "Bangalore",
            "experience_years": 6.0,
            "education": "B.Tech, IIT Delhi",
            "skills": ["Python", "AWS", "Docker", "React", "PostgreSQL"],
            "companies": ["Google (2y)", "Startup (4y)"],
            "certifications": ["AWS Solutions Architect"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Test Candidate"
        assert "Python" in data["skills"]
        assert data["interview_stage"] == "Applied"

    def test_list_candidates(self):
        r = client.get("/api/candidates")
        assert r.status_code == 200
        data = r.json()
        assert "candidates" in data
        assert "total" in data

    def test_filter_candidates_by_location(self):
        r = client.get("/api/candidates?location=Bangalore")
        assert r.status_code == 200

    def test_search_candidates(self):
        r = client.get("/api/candidates?search=Test")
        assert r.status_code == 200


# ═══════════════════════════════════════════
# Scoring Engine Unit Tests
# ═══════════════════════════════════════════

class TestScoringEngine:
    def setup_method(self):
        from scoring_engine import ScoringEngine
        self.engine = ScoringEngine()

    def test_perfect_match(self):
        result = self.engine.compute_score(
            candidate_skills=["React", "Node.js", "TypeScript", "AWS"],
            candidate_experience=6.0,
            candidate_certifications=["AWS Certified"],
            candidate_education="M.Tech, IIT Bombay",
            mandatory_skills=["React", "Node.js", "TypeScript", "AWS"],
            preferred_skills=["GraphQL", "Redis"],
            required_experience_min=5,
            required_experience_max=8,
            required_education="B.Tech CS",
            required_certifications=["AWS Certified"],
        )
        assert result["overall_score"] >= 80
        assert result["recommendation"] in ["Strong Hire", "Hire"]
        assert len(result["missing_mandatory"]) == 0

    def test_poor_match(self):
        result = self.engine.compute_score(
            candidate_skills=["HTML", "CSS"],
            candidate_experience=2.0,
            candidate_certifications=[],
            candidate_education="B.Sc",
            mandatory_skills=["React", "Node.js", "TypeScript", "AWS", "Docker"],
            preferred_skills=["Kubernetes", "Redis"],
            required_experience_min=5,
            required_experience_max=8,
            required_education="B.Tech CS",
            required_certifications=["AWS Certified"],
        )
        assert result["overall_score"] < 50
        assert result["recommendation"] == "Reject"
        assert len(result["missing_mandatory"]) >= 3
        assert len(result["red_flags"]) > 0

    def test_partial_match(self):
        result = self.engine.compute_score(
            candidate_skills=["React", "Node.js", "TypeScript"],
            candidate_experience=5.5,
            candidate_certifications=[],
            candidate_education="B.Tech, NIT",
            mandatory_skills=["React", "Node.js", "TypeScript", "AWS", "Docker"],
            preferred_skills=["GraphQL"],
            required_experience_min=5,
            required_experience_max=8,
            required_education="B.Tech CS",
            required_certifications=[],
        )
        assert 50 <= result["overall_score"] <= 85
        assert len(result["missing_mandatory"]) == 2

    def test_score_explanation_present(self):
        result = self.engine.compute_score(
            candidate_skills=["Python"],
            candidate_experience=3.0,
            candidate_certifications=[],
            candidate_education="B.Tech",
            mandatory_skills=["Python", "AWS"],
            preferred_skills=[],
            required_experience_min=3,
            required_experience_max=5,
            required_education="B.Tech",
            required_certifications=[],
        )
        assert "explanation" in result
        assert "skill" in result["explanation"]
        assert "experience" in result["explanation"]
        assert "education" in result["explanation"]


# ═══════════════════════════════════════════
# Resume Parser Unit Tests
# ═══════════════════════════════════════════

class TestResumeParser:
    def setup_method(self):
        from resume_parser import ResumeParser
        self.parser = ResumeParser()

    def test_extract_email(self):
        result = self.parser.parse(b"John Doe\njohn@example.com\nSkills: Python", "test.txt")
        assert result["email"] == "john@example.com"

    def test_extract_skills(self):
        text = b"Skills: Python, React, Node.js, AWS, Docker, PostgreSQL"
        result = self.parser.parse(text, "test.txt")
        assert len(result["skills"]) >= 4

    def test_extract_experience_years(self):
        text = b"John Doe\n6+ years of experience in software development"
        result = self.parser.parse(text, "test.txt")
        assert result["experience_years"] == 6.0

    def test_hash_uniqueness(self):
        h1 = self.parser.compute_hash(b"resume content 1")
        h2 = self.parser.compute_hash(b"resume content 2")
        h3 = self.parser.compute_hash(b"resume content 1")
        assert h1 != h2
        assert h1 == h3


# ═══════════════════════════════════════════
# Dashboard Analytics
# ═══════════════════════════════════════════

class TestDashboard:
    def test_dashboard_stats(self):
        r = client.get("/api/dashboard/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_applicants" in data
        assert "shortlisted" in data

    def test_funnel(self):
        r = client.get("/api/dashboard/funnel")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_skill_heatmap(self):
        r = client.get("/api/dashboard/skill-heatmap")
        assert r.status_code == 200

    def test_trends(self):
        r = client.get("/api/dashboard/trends")
        assert r.status_code == 200


# ═══════════════════════════════════════════
# Audit Trail
# ═══════════════════════════════════════════

class TestAudit:
    def test_audit_log(self):
        r = client.get("/api/audit")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ─── Cleanup ───
@pytest.fixture(autouse=True, scope="session")
def cleanup():
    yield
    import os
    if os.path.exists("./test_recruitiq.db"):
        os.remove("./test_recruitiq.db")
