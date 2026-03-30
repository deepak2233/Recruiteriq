"""
Resume Parser - NLP-based structured extraction from resumes.
Supports PDF, DOCX, and TXT formats.
Uses regex + heuristic NLP for entity extraction.
For production: integrate with spaCy NER or LLM-based extraction.
"""

import re
import hashlib
from typing import Dict, Any, List, Optional


class ResumeParser:
    """Parse resumes into structured candidate data."""

    # Common skill keywords (extendable)
    KNOWN_SKILLS = {
        "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "react", "angular", "vue.js", "next.js", "svelte", "node.js", "express",
        "django", "flask", "fastapi", "spring", "rails",
        "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
        "cassandra", "sqlite", "oracle", "sql server",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "github actions", "gitlab ci", "circleci",
        "graphql", "rest apis", "grpc", "kafka", "rabbitmq",
        "git", "linux", "ci/cd", "agile", "scrum",
        "machine learning", "deep learning", "nlp", "computer vision",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
        "html", "css", "sass", "tailwind", "bootstrap",
        "figma", "jira", "confluence", "slack",
    }

    EMAIL_PATTERN = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
    PHONE_PATTERN = re.compile(r'[\+]?[\d\s\-\(\)]{10,15}')
    LINKEDIN_PATTERN = re.compile(r'linkedin\.com/in/[\w-]+')
    GITHUB_PATTERN = re.compile(r'github\.com/[\w-]+')
    YEAR_PATTERN = re.compile(r'(\d{4})\s*[-–]\s*(\d{4}|present|current)', re.IGNORECASE)
    EXPERIENCE_PATTERN = re.compile(r'(\d+\.?\d*)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?', re.IGNORECASE)

    def parse(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Parse resume content into structured data."""
        text = self._extract_text(content, filename)
        
        return {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "location": self._extract_location(text),
            "experience_years": self._extract_experience_years(text),
            "education": self._extract_education(text),
            "skills": self._extract_skills(text),
            "companies": self._extract_companies(text),
            "projects": self._extract_projects(text),
            "achievements": self._extract_achievements(text),
            "certifications": self._extract_certifications(text),
            "gender": "",  # Not inferred from resume
            "current_ctc": "",
            "expected_ctc": "",
            "notice_period": "",
            "linkedin": self._extract_linkedin(text),
            "github": self._extract_github(text),
        }

    def compute_hash(self, content: bytes) -> str:
        """SHA256 hash for duplicate detection."""
        return hashlib.sha256(content).hexdigest()

    def _extract_text(self, content: bytes, filename: str) -> str:
        """Extract text from file bytes. In production, use PyPDF2/python-docx."""
        ext = filename.lower().split('.')[-1]
        
        if ext == 'txt':
            return content.decode('utf-8', errors='ignore')
        
        if ext == 'pdf':
            try:
                import PyPDF2
                import io
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                return "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                # Fallback: try to decode as text
                return content.decode('utf-8', errors='ignore')
        
        if ext in ('docx', 'doc'):
            try:
                import docx
                import io
                doc = docx.Document(io.BytesIO(content))
                return "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                return content.decode('utf-8', errors='ignore')
        
        return content.decode('utf-8', errors='ignore')

    def _extract_name(self, text: str) -> str:
        """Extract candidate name (typically first line or first non-empty line)."""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines[:5]:
            # Skip lines with email, phone, or common headers
            if '@' in line or re.search(r'\d{5,}', line):
                continue
            if any(h in line.lower() for h in ['resume', 'curriculum', 'objective', 'summary']):
                continue
            # Likely a name if it's 2-4 title-case words
            words = line.split()
            if 1 <= len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
                return line
        return "Unknown"

    def _extract_email(self, text: str) -> str:
        match = self.EMAIL_PATTERN.search(text)
        return match.group() if match else ""

    def _extract_phone(self, text: str) -> str:
        match = self.PHONE_PATTERN.search(text)
        return match.group().strip() if match else ""

    def _extract_linkedin(self, text: str) -> str:
        match = self.LINKEDIN_PATTERN.search(text)
        return match.group() if match else ""

    def _extract_github(self, text: str) -> str:
        match = self.GITHUB_PATTERN.search(text)
        return match.group() if match else ""

    def _extract_location(self, text: str) -> str:
        """Extract location from resume text."""
        cities = [
            "bangalore", "bengaluru", "mumbai", "delhi", "ncr", "noida", "gurgaon",
            "pune", "hyderabad", "chennai", "kolkata", "ahmedabad", "jaipur",
            "new york", "san francisco", "london", "singapore", "dubai", "toronto",
            "seattle", "austin", "boston", "chicago", "berlin", "amsterdam",
        ]
        text_lower = text.lower()
        for city in cities:
            if city in text_lower:
                return city.title()
        return ""

    def _extract_experience_years(self, text: str) -> float:
        """Extract total years of experience."""
        # Direct mention: "6+ years of experience"
        match = self.EXPERIENCE_PATTERN.search(text)
        if match:
            return float(match.group(1))
        
        # Calculate from date ranges
        years = self.YEAR_PATTERN.findall(text)
        if years:
            total = 0
            for start, end in years:
                end_year = 2025 if end.lower() in ('present', 'current') else int(end)
                total += end_year - int(start)
            return min(total, 30)  # Cap at 30
        
        return 0

    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills using keyword matching."""
        text_lower = text.lower()
        found = []
        for skill in self.KNOWN_SKILLS:
            # Word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found.append(skill.title() if len(skill) > 3 else skill.upper())
        return found

    def _extract_education(self, text: str) -> str:
        """Extract highest education."""
        edu_patterns = [
            (r'(?:Ph\.?D|Doctor)', "PhD"),
            (r'(?:M\.?Tech|M\.?S\.?|M\.?Sc|MBA|Master)', "Master's"),
            (r'(?:B\.?Tech|B\.?E\.?|B\.?Sc|B\.?S\.?|Bachelor)', "Bachelor's"),
        ]
        text_lower = text.lower()
        for pattern, degree in edu_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                # Try to find institution name nearby
                match = re.search(
                    pattern + r'[^.]*?(?:from|at|,)\s*([A-Z][A-Za-z\s]+)',
                    text, re.IGNORECASE
                )
                if match:
                    return f"{degree}, {match.group(1).strip()}"
                return degree
        return ""

    def _extract_companies(self, text: str) -> List[str]:
        """Extract company names from experience section."""
        companies = []
        # Common patterns: "Company Name | Role" or "Role at Company"
        patterns = [
            re.compile(r'(?:at|@)\s+([A-Z][A-Za-z\s&]+?)(?:\s*[\|,\-]|\s+as\b)', re.MULTILINE),
            re.compile(r'^([A-Z][A-Za-z\s&]+?)\s*[\|•]\s*(?:Software|Engineer|Developer|Manager|Lead)',
                       re.MULTILINE),
        ]
        for pattern in patterns:
            for match in pattern.finditer(text):
                company = match.group(1).strip()
                if 2 <= len(company) <= 50 and company not in companies:
                    companies.append(company)
        return companies[:5]  # Limit to 5

    def _extract_projects(self, text: str) -> List[str]:
        """Extract project descriptions."""
        projects = []
        # Look for bullet points after "Projects" section
        project_section = re.search(
            r'(?:Projects?|Key Projects?)[:\s]*\n(.*?)(?:\n(?:Education|Skills|Certif|Achiev|Award)|\Z)',
            text, re.IGNORECASE | re.DOTALL
        )
        if project_section:
            lines = project_section.group(1).split('\n')
            for line in lines:
                line = line.strip().lstrip('•-*◦▪')
                if len(line) > 20:
                    projects.append(line.strip())
        return projects[:5]

    def _extract_achievements(self, text: str) -> List[str]:
        """Extract achievements and awards."""
        achievements = []
        section = re.search(
            r'(?:Achievements?|Awards?|Honors?)[:\s]*\n(.*?)(?:\n(?:Education|Skills|Projects?)|\Z)',
            text, re.IGNORECASE | re.DOTALL
        )
        if section:
            lines = section.group(1).split('\n')
            for line in lines:
                line = line.strip().lstrip('•-*◦▪')
                if len(line) > 10:
                    achievements.append(line.strip())
        return achievements[:5]

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications."""
        certs = []
        cert_patterns = [
            r'AWS\s+(?:Certified|Solutions?\s+Architect|Developer)',
            r'Google\s+Cloud\s+(?:Professional|Certified)',
            r'Azure\s+(?:Certified|Administrator|Developer)',
            r'Kubernetes\s+(?:CKA|CKAD|CKS|Certified)',
            r'Scrum\s+Master',
            r'PMP',
            r'CISSP',
            r'Terraform\s+(?:Associate|Certified)',
        ]
        for pattern in cert_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                certs.append(match.group().strip())
        return certs
