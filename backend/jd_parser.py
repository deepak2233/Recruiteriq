"""
JD Parser - Extract structured requirements from Job Description text.
Uses keyword matching + heuristic NLP.
For production: integrate LLM-based extraction for higher accuracy.
"""

import re
from typing import Dict, Any, List


class JDParser:
    """Parse raw JD text into structured skill/experience/education requirements."""

    SKILL_KEYWORDS = {
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "react", "angular", "vue",
        "next.js", "node.js", "express", "django", "flask", "fastapi", "spring",
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "graphql", "rest", "grpc", "kafka", "rabbitmq", "git",
        "linux", "ci/cd", "agile", "scrum", "machine learning", "deep learning",
        "nlp", "tensorflow", "pytorch", "html", "css", "tailwind", "figma",
    }

    MANDATORY_MARKERS = [
        "must have", "required", "mandatory", "essential", "minimum",
        "need to have", "should have", "necessary",
    ]

    PREFERRED_MARKERS = [
        "nice to have", "preferred", "good to have", "bonus", "plus",
        "desirable", "advantageous", "ideally",
    ]

    def parse(self, raw_text: str, title: str = "") -> Dict[str, Any]:
        """Parse JD text into structured requirements."""
        if not raw_text:
            return self._default_for_title(title)

        text_lower = raw_text.lower()

        return {
            "mandatory_skills": self._extract_mandatory_skills(raw_text, text_lower),
            "preferred_skills": self._extract_preferred_skills(raw_text, text_lower),
            "certifications": self._extract_certifications(raw_text),
            "domain_knowledge": self._extract_domains(raw_text),
            "responsibilities": self._extract_responsibilities(raw_text),
        }

    def _extract_mandatory_skills(self, text: str, text_lower: str) -> List[str]:
        """Extract mandatory/required skills."""
        skills = set()

        # Look in mandatory sections
        for marker in self.MANDATORY_MARKERS:
            section = self._extract_section_after(text_lower, marker, max_lines=15)
            if section:
                for skill in self.SKILL_KEYWORDS:
                    if re.search(r'\b' + re.escape(skill) + r'\b', section):
                        skills.add(skill.title() if len(skill) > 3 else skill.upper())

        # If no mandatory section found, extract all skills
        if not skills:
            for skill in self.SKILL_KEYWORDS:
                if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                    skills.add(skill.title() if len(skill) > 3 else skill.upper())

        return sorted(skills)

    def _extract_preferred_skills(self, text: str, text_lower: str) -> List[str]:
        """Extract preferred/nice-to-have skills."""
        skills = set()
        for marker in self.PREFERRED_MARKERS:
            section = self._extract_section_after(text_lower, marker, max_lines=10)
            if section:
                for skill in self.SKILL_KEYWORDS:
                    if re.search(r'\b' + re.escape(skill) + r'\b', section):
                        skills.add(skill.title() if len(skill) > 3 else skill.upper())
        return sorted(skills)

    def _extract_certifications(self, text: str) -> List[str]:
        certs = []
        patterns = [
            r'AWS\s+Certified', r'Google\s+Cloud', r'Azure\s+Certified',
            r'Kubernetes\s+(?:CKA|CKAD)', r'Scrum\s+Master', r'PMP',
        ]
        for p in patterns:
            if re.search(p, text, re.IGNORECASE):
                match = re.search(p, text, re.IGNORECASE)
                certs.append(match.group())
        return certs

    def _extract_domains(self, text: str) -> List[str]:
        domains = []
        domain_keywords = [
            "fintech", "e-commerce", "ecommerce", "saas", "healthcare",
            "edtech", "logistics", "banking", "insurance", "retail",
            "media", "gaming", "cybersecurity", "ai/ml",
        ]
        text_lower = text.lower()
        for d in domain_keywords:
            if d in text_lower:
                domains.append(d.title())
        return domains

    def _extract_responsibilities(self, text: str) -> List[str]:
        """Extract key responsibilities."""
        responsibilities = []
        section = self._extract_section_after(
            text.lower(), "responsibilit", max_lines=15
        )
        if section:
            lines = section.split('\n')
            for line in lines:
                line = line.strip().lstrip('•-*◦▪0123456789.')
                if len(line) > 20:
                    responsibilities.append(line.strip().capitalize())
        return responsibilities[:8]

    def _extract_section_after(self, text: str, keyword: str, max_lines: int = 10) -> str:
        """Extract text section after a keyword."""
        idx = text.find(keyword)
        if idx == -1:
            return ""
        after = text[idx:]
        lines = after.split('\n')[:max_lines]
        return '\n'.join(lines)

    def _default_for_title(self, title: str) -> Dict[str, Any]:
        """Generate default requirements based on job title."""
        title_lower = title.lower()
        
        if "full-stack" in title_lower or "fullstack" in title_lower:
            return {
                "mandatory_skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git"],
                "preferred_skills": ["GraphQL", "Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform", "Python"],
                "certifications": ["AWS Certified"],
                "domain_knowledge": ["SaaS", "E-commerce"],
                "responsibilities": [],
            }
        elif "backend" in title_lower:
            return {
                "mandatory_skills": ["Python", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git"],
                "preferred_skills": ["Kubernetes", "Redis", "Kafka", "Elasticsearch", "CI/CD"],
                "certifications": [],
                "domain_knowledge": [],
                "responsibilities": [],
            }
        elif "frontend" in title_lower:
            return {
                "mandatory_skills": ["React", "TypeScript", "HTML", "CSS", "Git"],
                "preferred_skills": ["Next.js", "GraphQL", "Tailwind", "Figma"],
                "certifications": [],
                "domain_knowledge": [],
                "responsibilities": [],
            }
        elif "data" in title_lower or "ml" in title_lower:
            return {
                "mandatory_skills": ["Python", "Machine Learning", "PostgreSQL", "Git"],
                "preferred_skills": ["PyTorch", "TensorFlow", "AWS", "Docker", "Kafka"],
                "certifications": [],
                "domain_knowledge": ["AI/ML"],
                "responsibilities": [],
            }
        
        return {
            "mandatory_skills": [], "preferred_skills": [],
            "certifications": [], "domain_knowledge": [],
            "responsibilities": [],
        }
