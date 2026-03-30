"""
RecruitIQ Scoring Engine
Explainable, weighted multi-factor candidate scoring against Job Descriptions.

Architecture:
  ┌──────────────┐
  │  Skill Match  │ weight=0.40  (mandatory 2x, preferred 1x)
  ├──────────────┤
  │  Experience   │ weight=0.25  (band-fit with diminishing returns)
  ├──────────────┤
  │  Education    │ weight=0.20  (tier + certification bonus)
  ├──────────────┤
  │  Keyword/NLP  │ weight=0.15  (TF-IDF proxy + semantic overlap)
  └──────────────┘
         │
         ▼
  Overall Score → Recommendation → Strengths/Gaps/Red Flags
"""

import re
from typing import List, Dict, Any, Optional
from difflib import SequenceMatcher


class ScoringEngine:
    """Multi-factor explainable scoring engine for resume-JD matching."""

    # Scoring weights
    WEIGHTS = {
        "skill": 0.40,
        "experience": 0.25,
        "education": 0.20,
        "keyword": 0.15,
    }

    # Institution tiers (Indian context - extend as needed)
    TIER1_INSTITUTIONS = [
        "iit", "iiit", "nit", "bits", "iisc", "isb", "iim",
        "mit", "stanford", "cmu", "berkeley", "harvard", "oxford", "cambridge",
    ]
    TIER2_INSTITUTIONS = [
        "dtu", "nsit", "vit", "srm", "manipal", "thapar", "coep",
        "anna university", "jadavpur", "bhu",
    ]

    # Skill aliases for fuzzy matching
    SKILL_ALIASES = {
        "js": "javascript", "ts": "typescript", "py": "python",
        "pg": "postgresql", "postgres": "postgresql", "mongo": "mongodb",
        "k8s": "kubernetes", "tf": "terraform", "gql": "graphql",
        "es": "elasticsearch", "aws": "aws", "gcp": "google cloud",
        "react.js": "react", "reactjs": "react", "node": "node.js",
        "nodejs": "node.js", "vue": "vue.js", "vuejs": "vue.js",
        "next": "next.js", "nextjs": "next.js",
    }

    def compute_score(
        self,
        candidate_skills: List[str],
        candidate_experience: float,
        candidate_education: str,
        candidate_certifications: List[str],
        mandatory_skills: List[str],
        preferred_skills: List[str],
        required_experience_min: float,
        required_experience_max: float,
        required_education: str,
        required_certifications: List[str],
    ) -> Dict[str, Any]:
        """
        Compute a comprehensive, explainable score for a candidate against a JD.
        Returns scores, missing skills, strengths, gaps, red flags, and recommendation.
        """
        # Normalize skills
        c_skills = self._normalize_skills(candidate_skills)
        m_skills = self._normalize_skills(mandatory_skills)
        p_skills = self._normalize_skills(preferred_skills)

        # ─── 1. SKILL SCORE (40%) ───
        skill_result = self._score_skills(c_skills, m_skills, p_skills)

        # ─── 2. EXPERIENCE SCORE (25%) ───
        exp_result = self._score_experience(
            candidate_experience, required_experience_min, required_experience_max
        )

        # ─── 3. EDUCATION SCORE (20%) ───
        edu_result = self._score_education(
            candidate_education, required_education,
            candidate_certifications, required_certifications,
        )

        # ─── 4. KEYWORD SCORE (15%) ───
        keyword_result = self._score_keywords(c_skills, m_skills, p_skills)

        # ─── OVERALL WEIGHTED SCORE ───
        overall = round(
            skill_result["score"] * self.WEIGHTS["skill"] +
            exp_result["score"] * self.WEIGHTS["experience"] +
            edu_result["score"] * self.WEIGHTS["education"] +
            keyword_result["score"] * self.WEIGHTS["keyword"],
            1
        )

        # ─── MISSING SKILLS ───
        missing_mandatory = [s for s in mandatory_skills
                            if self._normalize(s) not in c_skills]
        missing_preferred = [s for s in preferred_skills
                            if self._normalize(s) not in c_skills]

        # ─── STRENGTHS ───
        strengths = []
        if skill_result["score"] >= 85:
            strengths.append("Strong skill alignment with JD requirements")
        if skill_result["mandatory_match_pct"] == 100:
            strengths.append("All mandatory skills matched")
        if exp_result["score"] >= 85:
            strengths.append(f"Experience ({candidate_experience}y) well-aligned with role")
        if edu_result["score"] >= 85:
            strengths.append("Strong educational background")
        if len(candidate_certifications) >= 2:
            strengths.append(f"Multiple relevant certifications ({len(candidate_certifications)})")
        if candidate_experience > required_experience_max:
            strengths.append("Senior experience brings leadership potential")
        if len(missing_mandatory) == 0 and len(missing_preferred) <= 2:
            strengths.append("Comprehensive skill coverage across mandatory and preferred")

        # ─── GAPS ───
        gaps = []
        if missing_mandatory:
            gaps.append(f"Missing mandatory skills: {', '.join(missing_mandatory)}")
        if len(missing_preferred) > len(preferred_skills) * 0.5:
            gaps.append(f"Missing {len(missing_preferred)}/{len(preferred_skills)} preferred skills")
        if exp_result["score"] < 60:
            gaps.append(f"Experience ({candidate_experience}y) below required range ({required_experience_min}-{required_experience_max}y)")
        if edu_result["score"] < 60:
            gaps.append("Education/certifications below expectations")

        # ─── RED FLAGS ───
        red_flags = []
        if len(missing_mandatory) >= 3:
            red_flags.append(f"Missing {len(missing_mandatory)} mandatory skills — significant gap")
        if candidate_experience < required_experience_min - 1:
            red_flags.append("Significantly under-experienced for this role level")
        if skill_result["score"] < 40:
            red_flags.append("Very low skill match — likely not qualified")

        # ─── RECOMMENDATION ───
        recommendation = self._generate_recommendation(
            overall, len(missing_mandatory), len(red_flags), skill_result["mandatory_match_pct"]
        )

        # ─── EXPLANATION ───
        explanation = {
            "skill": {
                "score": skill_result["score"],
                "weight": self.WEIGHTS["skill"],
                "mandatory_matched": skill_result["mandatory_matched"],
                "mandatory_total": len(m_skills),
                "preferred_matched": skill_result["preferred_matched"],
                "preferred_total": len(p_skills),
                "details": skill_result["details"],
            },
            "experience": {
                "score": exp_result["score"],
                "weight": self.WEIGHTS["experience"],
                "candidate_years": candidate_experience,
                "required_range": f"{required_experience_min}-{required_experience_max}",
                "details": exp_result["details"],
            },
            "education": {
                "score": edu_result["score"],
                "weight": self.WEIGHTS["education"],
                "details": edu_result["details"],
            },
            "keyword": {
                "score": keyword_result["score"],
                "weight": self.WEIGHTS["keyword"],
                "details": keyword_result["details"],
            },
        }

        return {
            "overall_score": overall,
            "skill_score": skill_result["score"],
            "experience_score": exp_result["score"],
            "education_score": edu_result["score"],
            "keyword_score": keyword_result["score"],
            "missing_mandatory": missing_mandatory,
            "missing_preferred": missing_preferred,
            "strengths": strengths,
            "gaps": gaps,
            "red_flags": red_flags,
            "recommendation": recommendation,
            "explanation": explanation,
        }

    # ─── SKILL SCORING ───
    def _score_skills(self, candidate: set, mandatory: set, preferred: set) -> Dict:
        mandatory_matched = len(candidate & mandatory)
        mandatory_total = max(len(mandatory), 1)
        preferred_matched = len(candidate & preferred)
        preferred_total = max(len(preferred), 1)

        # Mandatory skills weighted 2x
        mandatory_pct = (mandatory_matched / mandatory_total) * 100
        preferred_pct = (preferred_matched / preferred_total) * 100

        # Weighted combination: 70% mandatory, 30% preferred
        score = round(mandatory_pct * 0.7 + preferred_pct * 0.3, 1)

        return {
            "score": min(score, 100),
            "mandatory_matched": mandatory_matched,
            "preferred_matched": preferred_matched,
            "mandatory_match_pct": round(mandatory_pct, 1),
            "details": f"{mandatory_matched}/{mandatory_total} mandatory, {preferred_matched}/{preferred_total} preferred",
        }

    # ─── EXPERIENCE SCORING ───
    def _score_experience(self, actual: float, req_min: float, req_max: float) -> Dict:
        if req_min <= 0 and req_max <= 0:
            return {"score": 75, "details": "No experience requirement specified"}

        if req_min <= actual <= req_max:
            # Perfect fit — score based on position in range
            position = (actual - req_min) / max(req_max - req_min, 1)
            score = 85 + position * 15  # 85-100 range
            details = f"Within required range ({req_min}-{req_max}y)"
        elif actual > req_max:
            # Over-experienced: slight diminishing returns
            overshoot = actual - req_max
            score = max(100 - overshoot * 5, 70)  # Penalize slightly
            details = f"Over-experienced by {overshoot:.1f}y (diminishing returns)"
        elif actual >= req_min - 1:
            # Slightly under: partial credit
            deficit = req_min - actual
            score = max(70 - deficit * 20, 40)
            details = f"Slightly below minimum ({deficit:.1f}y short)"
        else:
            # Significantly under
            score = max(30, 20 + actual * 5)
            details = f"Significantly below requirement ({req_min - actual:.1f}y short)"

        return {"score": round(min(score, 100), 1), "details": details}

    # ─── EDUCATION SCORING ───
    def _score_education(self, candidate_edu: str, required_edu: str,
                         candidate_certs: List[str], required_certs: List[str]) -> Dict:
        edu_lower = candidate_edu.lower()
        score = 50  # Base score
        details_parts = []

        # Degree level
        if any(d in edu_lower for d in ["phd", "ph.d"]):
            score += 30
            details_parts.append("PhD holder (+30)")
        elif any(d in edu_lower for d in ["m.tech", "mtech", "m.sc", "msc", "mba", "m.s.", "master"]):
            score += 25
            details_parts.append("Master's degree (+25)")
        elif any(d in edu_lower for d in ["b.tech", "btech", "b.e", "b.sc", "bachelor"]):
            score += 15
            details_parts.append("Bachelor's degree (+15)")

        # Institution tier
        if any(inst in edu_lower for inst in self.TIER1_INSTITUTIONS):
            score += 15
            details_parts.append("Tier-1 institution (+15)")
        elif any(inst in edu_lower for inst in self.TIER2_INSTITUTIONS):
            score += 8
            details_parts.append("Tier-2 institution (+8)")

        # Certifications bonus
        if candidate_certs:
            cert_bonus = min(len(candidate_certs) * 5, 15)
            score += cert_bonus
            details_parts.append(f"{len(candidate_certs)} cert(s) (+{cert_bonus})")

            # Check required cert match
            if required_certs:
                c_certs_lower = {c.lower() for c in candidate_certs}
                r_certs_lower = {c.lower() for c in required_certs}
                matched = len(c_certs_lower & r_certs_lower)
                if matched:
                    score += matched * 3
                    details_parts.append(f"{matched} required cert(s) matched (+{matched*3})")

        return {
            "score": round(min(score, 100), 1),
            "details": "; ".join(details_parts) if details_parts else "Basic education",
        }

    # ─── KEYWORD SCORING ───
    def _score_keywords(self, candidate: set, mandatory: set, preferred: set) -> Dict:
        all_jd = mandatory | preferred
        if not all_jd:
            return {"score": 75, "details": "No keywords to match"}

        # Simple overlap ratio as a proxy for TF-IDF
        overlap = len(candidate & all_jd)
        total = len(all_jd)
        base_score = (overlap / total) * 100

        # Bonus for breadth (having skills beyond JD)
        extra_skills = len(candidate - all_jd)
        breadth_bonus = min(extra_skills * 2, 10)

        score = min(base_score + breadth_bonus, 100)
        return {
            "score": round(score, 1),
            "details": f"{overlap}/{total} JD keywords matched, {extra_skills} additional skills",
        }

    # ─── RECOMMENDATION ENGINE ───
    def _generate_recommendation(self, overall: float, missing_mandatory: int,
                                  red_flags: int, mandatory_match_pct: float) -> str:
        if overall >= 85 and missing_mandatory == 0 and red_flags == 0:
            return "Strong Hire"
        elif overall >= 75 and missing_mandatory <= 1:
            return "Hire"
        elif overall >= 60 and missing_mandatory <= 2:
            return "Maybe"
        else:
            return "Reject"

    # ─── UTILITIES ───
    def _normalize_skills(self, skills: List[str]) -> set:
        return {self._normalize(s) for s in skills}

    def _normalize(self, skill: str) -> str:
        s = skill.strip().lower()
        return self.SKILL_ALIASES.get(s, s)

    def _fuzzy_match(self, s1: str, s2: str, threshold: float = 0.8) -> bool:
        return SequenceMatcher(None, s1.lower(), s2.lower()).ratio() >= threshold
