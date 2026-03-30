import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Treemap } from "recharts";
import { Search, Upload, FileText, Users, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight, Star, Filter, Download, Eye, MessageSquare, Clock, Briefcase, GraduationCap, Award, MapPin, Phone, Mail, Linkedin, Github, TrendingUp, BarChart2, PieChart as PieChartIcon, Layers, Settings, Bell, Menu, X, Plus, Trash2, Edit3, Copy, ExternalLink, Zap, Target, Shield, BookOpen, Code, Database, Globe, Cpu, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, ChevronLeft, MoreVertical, Hash, Calendar, DollarSign } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabase";

// ─── DESIGN TOKENS ────────────────────────────────────────────
const T = {
  bg: "#0B0F1A", bgCard: "#111827", bgCardHover: "#1a2235", bgSurface: "#1E293B",
  border: "#1E293B", borderHover: "#334155", borderActive: "#3B82F6",
  text: "#F1F5F9", textMuted: "#94A3B8", textDim: "#64748B",
  accent: "#3B82F6", accentHover: "#2563EB", accentGlow: "rgba(59,130,246,0.15)",
  success: "#10B981", successBg: "rgba(16,185,129,0.12)",
  warning: "#F59E0B", warningBg: "rgba(245,158,11,0.12)",
  danger: "#EF4444", dangerBg: "rgba(239,68,68,0.12)",
  purple: "#8B5CF6", purpleBg: "rgba(139,92,246,0.12)",
  cyan: "#06B6D4", cyanBg: "rgba(6,182,212,0.12)",
  orange: "#F97316", orangeBg: "rgba(249,115,22,0.12)",
  gradient1: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
  gradient2: "linear-gradient(135deg, #10B981, #06B6D4)",
  gradient3: "linear-gradient(135deg, #F59E0B, #F97316)",
};

// ─── MOCK DATA ENGINE ─────────────────────────────────────────
const MOCK_JD = {
  title: "Senior Full-Stack Engineer",
  company: "TechNova Global",
  location: "Bangalore, India (Hybrid)",
  experience: "5-8 years",
  salary: "₹35L - ₹55L",
  department: "Engineering",
  mandatorySkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git"],
  preferredSkills: ["GraphQL", "Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform", "Python"],
  education: "B.Tech/M.Tech in CS/IT or equivalent",
  certifications: ["AWS Certified", "Kubernetes Certified"],
  domainKnowledge: ["Fintech", "E-commerce", "SaaS"],
  responsibilities: [
    "Design and build scalable microservices architecture",
    "Lead frontend development with React and TypeScript",
    "Mentor junior engineers and conduct code reviews",
    "Collaborate with product and design teams",
    "Optimize application performance and reliability",
  ],
  parsed: true,
};

const generateCandidates = () => [
  {
    id: "C001", name: "Priya Sharma", email: "priya.sharma@gmail.com", phone: "+91-98765-43210",
    location: "Bangalore", noticePeriod: "30 days", expectedCTC: "₹48L", currentCTC: "₹38L",
    experience: 6.5, education: "M.Tech, IIT Bombay", gender: "Female",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "Redis", "Python", "Kubernetes"],
    companies: ["Flipkart (3y)", "Freshworks (2y)", "Startup (1.5y)"],
    certifications: ["AWS Solutions Architect", "Google Cloud Professional"],
    projects: ["Built real-time payment system handling 10K TPS", "Led migration from monolith to microservices"],
    achievements: ["Patent holder - distributed caching system", "Speaker at JSConf India 2024"],
    overallScore: 94, skillScore: 96, expScore: 92, eduScore: 95, keywordScore: 93,
    missingMandatory: [], missingPreferred: ["Elasticsearch", "Terraform", "CI/CD"],
    strengths: ["Exceptional full-stack expertise", "Strong system design skills", "Leadership experience", "Top-tier education"],
    gaps: ["No direct Elasticsearch experience", "Limited Terraform exposure"],
    redFlags: [],
    recommendation: "Strong Hire", shortlisted: true, interviewStage: "Technical Round 2",
    recruiterNotes: "Excellent candidate. Strong system design skills demonstrated in portfolio.",
    avatar: "PS", color: T.success,
  },
  {
    id: "C002", name: "Arjun Mehta", email: "arjun.m@outlook.com", phone: "+91-87654-32109",
    location: "Pune", noticePeriod: "60 days", expectedCTC: "₹52L", currentCTC: "₹42L",
    experience: 7.2, education: "B.Tech, NIT Trichy", gender: "Male",
    skills: ["React", "Node.js", "TypeScript", "AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "REST APIs", "Git"],
    companies: ["Amazon (3y)", "Infosys (2y)", "TCS (2.2y)"],
    certifications: ["AWS Certified Developer", "Kubernetes CKA"],
    projects: ["Designed auto-scaling infrastructure for 50M+ users", "Built CI/CD pipelines reducing deploy time by 70%"],
    achievements: ["Promoted twice in 3 years at Amazon", "Open-source contributor - 2K+ GitHub stars"],
    overallScore: 88, skillScore: 85, expScore: 90, eduScore: 82, keywordScore: 89,
    missingMandatory: ["PostgreSQL"], missingPreferred: ["GraphQL", "Redis", "Elasticsearch", "Python"],
    strengths: ["Strong DevOps & cloud expertise", "Amazon pedigree", "Kubernetes specialist"],
    gaps: ["Missing PostgreSQL (uses DynamoDB)", "No GraphQL experience", "Limited Python"],
    redFlags: ["Frequent job switches in early career"],
    recommendation: "Hire", shortlisted: true, interviewStage: "HR Round",
    recruiterNotes: "Strong infra background. May need PostgreSQL ramp-up.",
    avatar: "AM", color: T.accent,
  },
  {
    id: "C003", name: "Sneha Reddy", email: "sneha.r@yahoo.com", phone: "+91-76543-21098",
    location: "Hyderabad", noticePeriod: "90 days", expectedCTC: "₹45L", currentCTC: "₹35L",
    experience: 5.8, education: "M.Sc CS, IIIT Hyderabad", gender: "Female",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git", "Python", "Elasticsearch", "Redis"],
    companies: ["Microsoft (2.5y)", "Deloitte (2y)", "Capgemini (1.3y)"],
    certifications: ["Azure Certified"],
    projects: ["Developed search platform with Elasticsearch serving 5M queries/day", "Built analytics dashboard for C-suite executives"],
    achievements: ["Microsoft Hackathon winner 2023", "Published paper on NLP-based search"],
    overallScore: 86, skillScore: 88, expScore: 84, eduScore: 90, keywordScore: 85,
    missingMandatory: ["AWS"], missingPreferred: ["Kubernetes", "Terraform", "CI/CD", "GraphQL"],
    strengths: ["Strong search & data skills", "Microsoft experience", "Research background"],
    gaps: ["No AWS experience (Azure focused)", "Missing Kubernetes", "No CI/CD pipeline experience"],
    redFlags: ["90-day notice period may delay joining"],
    recommendation: "Hire", shortlisted: true, interviewStage: "Technical Round 1",
    recruiterNotes: "Great search expertise. Azure-to-AWS transition needed.",
    avatar: "SR", color: T.purple,
  },
  {
    id: "C004", name: "Vikram Singh", email: "vikram.s@gmail.com", phone: "+91-65432-10987",
    location: "Delhi NCR", noticePeriod: "30 days", expectedCTC: "₹40L", currentCTC: "₹32L",
    experience: 5.1, education: "B.Tech, DTU", gender: "Male",
    skills: ["React", "Node.js", "TypeScript", "Git", "REST APIs", "Docker", "MongoDB"],
    companies: ["Paytm (2y)", "Wipro (3.1y)"],
    certifications: [],
    projects: ["Built payment reconciliation module", "Created admin dashboard for merchant management"],
    achievements: ["Best team award at Paytm Q3 2023"],
    overallScore: 68, skillScore: 62, expScore: 72, eduScore: 70, keywordScore: 65,
    missingMandatory: ["PostgreSQL", "AWS"], missingPreferred: ["GraphQL", "Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform", "Python"],
    strengths: ["Solid React/Node foundation", "Payment domain experience"],
    gaps: ["No cloud platform experience", "Missing many preferred skills", "No certifications", "Limited system design exposure"],
    redFlags: ["Mostly worked on maintenance tasks", "No leadership experience"],
    recommendation: "Maybe", shortlisted: false, interviewStage: "Screening",
    recruiterNotes: "Decent foundation but significant skill gaps for senior role.",
    avatar: "VS", color: T.warning,
  },
  {
    id: "C005", name: "Ananya Iyer", email: "ananya.i@proton.me", phone: "+91-54321-09876",
    location: "Chennai", noticePeriod: "45 days", expectedCTC: "₹50L", currentCTC: "₹40L",
    experience: 6.0, education: "B.E, Anna University + MBA, ISB", gender: "Female",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "CI/CD", "Git", "REST APIs", "Terraform"],
    companies: ["Google (2y)", "Zoho (2.5y)", "Startup CTO (1.5y)"],
    certifications: ["AWS Solutions Architect", "Scrum Master"],
    projects: ["Built SaaS platform from 0 to 50K users as CTO", "Led Google Workspace integration team"],
    achievements: ["Forbes 30 Under 30 nominee", "Raised $2M seed funding for startup"],
    overallScore: 92, skillScore: 94, expScore: 90, eduScore: 88, keywordScore: 91,
    missingMandatory: [], missingPreferred: ["Redis", "Elasticsearch", "Kubernetes", "Python"],
    strengths: ["Full-stack + leadership + business acumen", "Google experience", "Startup founder perspective", "Strong communication"],
    gaps: ["No Redis/Elasticsearch hands-on", "MBA may indicate shift to management"],
    redFlags: [],
    recommendation: "Strong Hire", shortlisted: true, interviewStage: "Final Round",
    recruiterNotes: "Exceptional profile. Leadership + technical depth. Fast-track.",
    avatar: "AI", color: T.cyan,
  },
  {
    id: "C006", name: "Rahul Verma", email: "rahul.v@gmail.com", phone: "+91-43210-98765",
    location: "Mumbai", noticePeriod: "60 days", expectedCTC: "₹38L", currentCTC: "₹28L",
    experience: 4.5, education: "B.Tech, VIT Vellore", gender: "Male",
    skills: ["React", "JavaScript", "Node.js", "MongoDB", "Git", "REST APIs", "HTML/CSS"],
    companies: ["Accenture (2.5y)", "Cognizant (2y)"],
    certifications: [],
    projects: ["Built internal HR portal", "Created reporting module"],
    achievements: ["Star performer Q2 2024"],
    overallScore: 45, skillScore: 40, expScore: 48, eduScore: 55, keywordScore: 42,
    missingMandatory: ["TypeScript", "PostgreSQL", "AWS", "Docker"],
    missingPreferred: ["GraphQL", "Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform", "Python"],
    strengths: ["Basic React/Node skills", "Willing to learn"],
    gaps: ["Missing most mandatory skills", "Below experience threshold", "No cloud/DevOps", "Service company background only"],
    redFlags: ["Significantly under-qualified", "No TypeScript", "No cloud experience", "No system design exposure"],
    recommendation: "Reject", shortlisted: false, interviewStage: "Rejected",
    recruiterNotes: "Does not meet minimum requirements for senior role.",
    avatar: "RV", color: T.danger,
  },
  {
    id: "C007", name: "Kavitha Nair", email: "kavitha.n@outlook.com", phone: "+91-32109-87654",
    location: "Bangalore", noticePeriod: "30 days", expectedCTC: "₹46L", currentCTC: "₹36L",
    experience: 5.5, education: "M.Tech, BITS Pilani", gender: "Female",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "REST APIs", "Git", "Redis", "CI/CD"],
    companies: ["Atlassian (2.5y)", "ThoughtWorks (2y)", "Infosys (1y)"],
    certifications: ["AWS Developer Associate"],
    projects: ["Built Jira plugin ecosystem with 100K+ installs", "Designed event-driven architecture for real-time collaboration"],
    achievements: ["Atlassian Kudos award", "Tech blog with 15K followers"],
    overallScore: 85, skillScore: 87, expScore: 83, eduScore: 88, keywordScore: 84,
    missingMandatory: [], missingPreferred: ["GraphQL", "Kubernetes", "Elasticsearch", "Terraform", "Python"],
    strengths: ["Atlassian product experience", "Strong engineering culture background", "Good communication", "Plugin/extensibility expertise"],
    gaps: ["No Kubernetes hands-on", "Limited Python", "No GraphQL"],
    redFlags: [],
    recommendation: "Hire", shortlisted: true, interviewStage: "Technical Round 1",
    recruiterNotes: "Solid profile. Atlassian experience is a plus.",
    avatar: "KN", color: T.accent,
  },
  {
    id: "C008", name: "Rohan Gupta", email: "rohan.g@gmail.com", phone: "+91-21098-76543",
    location: "Noida", noticePeriod: "Immediate", expectedCTC: "₹42L", currentCTC: "₹30L",
    experience: 5.0, education: "B.Tech, NSIT Delhi", gender: "Male",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "REST APIs", "Git", "Python", "GraphQL"],
    companies: ["Zomato (2y)", "HCL (3y)"],
    certifications: [],
    projects: ["Built restaurant discovery microservice", "Order tracking real-time system"],
    achievements: ["Zomato Hackathon winner"],
    overallScore: 74, skillScore: 75, expScore: 72, eduScore: 73, keywordScore: 76,
    missingMandatory: ["AWS"], missingPreferred: ["Kubernetes", "Redis", "Elasticsearch", "CI/CD", "Terraform"],
    strengths: ["Good full-stack skills", "Consumer tech experience", "Immediate joiner"],
    gaps: ["No AWS (limited cloud)", "Missing DevOps skills", "No certifications"],
    redFlags: ["Large CTC jump expected (40%)"],
    recommendation: "Maybe", shortlisted: false, interviewStage: "Screening",
    recruiterNotes: "Decent but missing cloud. Immediate availability is a plus.",
    avatar: "RG", color: T.orange,
  },
];

const INTERVIEW_STAGES = ["Applied", "Screening", "Technical Round 1", "Technical Round 2", "HR Round", "Final Round", "Offer", "Rejected"];
const FUNNEL_DATA = [
  { stage: "Applied", count: 248, color: T.textMuted },
  { stage: "Screened", count: 142, color: T.accent },
  { stage: "Phone Screen", count: 68, color: T.purple },
  { stage: "Technical", count: 34, color: T.cyan },
  { stage: "On-site", count: 18, color: T.warning },
  { stage: "Offer", count: 8, color: T.success },
  { stage: "Hired", count: 5, color: T.success },
];

const HIRING_TRENDS = [
  { month: "Oct", applications: 180, shortlisted: 42, hired: 3 },
  { month: "Nov", applications: 210, shortlisted: 55, hired: 4 },
  { month: "Dec", applications: 165, shortlisted: 38, hired: 2 },
  { month: "Jan", applications: 248, shortlisted: 62, hired: 5 },
  { month: "Feb", applications: 290, shortlisted: 78, hired: 6 },
  { month: "Mar", applications: 320, shortlisted: 85, hired: 7 },
];

const SKILL_HEATMAP_DATA = [
  { skill: "React", candidates: 7, avgScore: 88 },
  { skill: "Node.js", candidates: 7, avgScore: 85 },
  { skill: "TypeScript", candidates: 6, avgScore: 82 },
  { skill: "AWS", candidates: 4, avgScore: 78 },
  { skill: "Docker", candidates: 6, avgScore: 80 },
  { skill: "PostgreSQL", candidates: 5, avgScore: 76 },
  { skill: "Kubernetes", candidates: 2, avgScore: 72 },
  { skill: "GraphQL", candidates: 3, avgScore: 70 },
  { skill: "Python", candidates: 3, avgScore: 74 },
  { skill: "Redis", candidates: 3, avgScore: 71 },
  { skill: "Elasticsearch", candidates: 1, avgScore: 85 },
  { skill: "Terraform", candidates: 2, avgScore: 68 },
  { skill: "CI/CD", candidates: 3, avgScore: 75 },
];

// ─── UTILITY COMPONENTS ───────────────────────────────────────
const Badge = ({ children, variant = "default", size = "sm" }) => {
  const colors = {
    default: { bg: T.accentGlow, text: T.accent, border: "transparent" },
    success: { bg: T.successBg, text: T.success, border: "transparent" },
    warning: { bg: T.warningBg, text: T.warning, border: "transparent" },
    danger: { bg: T.dangerBg, text: T.danger, border: "transparent" },
    purple: { bg: T.purpleBg, text: T.purple, border: "transparent" },
    cyan: { bg: T.cyanBg, text: T.cyan, border: "transparent" },
    orange: { bg: T.orangeBg, text: T.orange, border: "transparent" },
    outline: { bg: "transparent", text: T.textMuted, border: T.border },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "xs" ? "1px 6px" : size === "sm" ? "2px 8px" : "4px 12px",
      borderRadius: 6, fontSize: size === "xs" ? 10 : size === "sm" ? 11 : 12,
      fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

const ScoreRing = ({ score, size = 56, strokeWidth = 4, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? T.success : score >= 70 ? T.warning : score >= 50 ? T.orange : T.danger;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={T.border} strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.28, fontWeight: 700, color: color, fontFamily: "'JetBrains Mono', monospace",
        }}>{score}</div>
      </div>
      {label && <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>}
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = T.accent, height = 6, showLabel = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
    <div style={{ flex: 1, height, borderRadius: height, background: T.bgSurface, overflow: "hidden" }}>
      <div style={{
        width: `${(value / max) * 100}%`, height: "100%", borderRadius: height,
        background: color, transition: "width 0.8s ease",
      }} />
    </div>
    {showLabel && <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 32, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{value}%</span>}
  </div>
);

const StatCard = ({ icon: Icon, label, value, change, changeType, color = T.accent, onClick }) => (
  <div onClick={onClick} style={{
    background: T.bgCard, borderRadius: 12, padding: "18px 20px", border: `1px solid ${T.border}`,
    cursor: onClick ? "pointer" : "default", transition: "all 0.2s",
    ...(onClick ? {} : {}),
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={color} />
      </div>
      {change !== undefined && (
        <div style={{
          display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600,
          color: changeType === "up" ? T.success : changeType === "down" ? T.danger : T.textMuted
        }}>
          {changeType === "up" ? <ArrowUpRight size={14} /> : changeType === "down" ? <ArrowDownRight size={14} /> : <Minus size={14} />}
          {change}
        </div>
      )}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</div>
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: T.bgSurface, borderRadius: 10, padding: 3 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 500, transition: "all 0.2s", whiteSpace: "nowrap",
        background: active === t.id ? T.bgCard : "transparent",
        color: active === t.id ? T.text : T.textMuted,
        boxShadow: active === t.id ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
      }}>{t.icon && <span style={{ marginRight: 6 }}>{t.icon}</span>}{t.label}</button>
    ))}
  </div>
);

const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
    <Search size={15} color={T.textDim} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px 8px 36px", borderRadius: 8, border: `1px solid ${T.border}`,
        background: T.bgSurface, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = T.borderActive}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  </div>
);

const Btn = ({ children, variant = "primary", size = "md", icon: Icon, onClick, style: s = {} }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer",
    fontWeight: 600, borderRadius: 8, transition: "all 0.2s", whiteSpace: "nowrap",
    fontSize: size === "sm" ? 12 : 13,
    padding: size === "sm" ? "6px 10px" : "8px 16px",
  };
  const variants = {
    primary: { background: T.accent, color: "#fff" },
    secondary: { background: T.bgSurface, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.textMuted },
    success: { background: T.success, color: "#fff" },
    danger: { background: T.dangerBg, color: T.danger, border: `1px solid ${T.danger}30` },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...s }}>{Icon && <Icon size={size === "sm" ? 13 : 15} />}{children}</button>;
};

const Avatar = ({ initials, color, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    background: `${color}20`, color: color, fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    border: `2px solid ${color}40`, letterSpacing: "0.02em",
  }}>{initials}</div>
);

// ─── AI ANALYSIS MODAL ────────────────────────────────────────
const AIAnalysisPanel = ({ candidate, jd, onClose }) => {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `You are an expert HR AI analyst. Analyze this candidate against the job description.

JD: ${jd.title} at ${jd.company}
Required Skills: ${jd.mandatorySkills.join(", ")}
Preferred Skills: ${jd.preferredSkills.join(", ")}
Experience Required: ${jd.experience}

Candidate: ${candidate.name}
Experience: ${candidate.experience} years
Skills: ${candidate.skills.join(", ")}
Companies: ${candidate.companies.join(", ")}
Education: ${candidate.education}
Score: ${candidate.overallScore}/100

Give a concise 150-word executive assessment covering: fit rating (1-10), key strengths for this role, critical gaps, interview focus areas, and a hiring recommendation. Use plain text with line breaks. Be direct and actionable.`
            }]
          })
        });
        const data = await res.json();
        setAnalysis(data.content?.[0]?.text || "Analysis complete. See scoring breakdown below.");
      } catch {
        setAnalysis(`Executive Assessment for ${candidate.name}:\n\nFit Rating: ${candidate.overallScore >= 85 ? "8-9/10 - Strong Match" : candidate.overallScore >= 70 ? "6-7/10 - Good Match" : "4-5/10 - Partial Match"}\n\nKey Strengths:\n• ${candidate.strengths.slice(0, 3).join("\n• ")}\n\nCritical Gaps:\n• ${candidate.gaps.length > 0 ? candidate.gaps.join("\n• ") : "No significant gaps identified"}\n\nInterview Focus:\n• Technical deep-dive on system design\n• Assess cultural fit and leadership potential\n• Validate claimed project outcomes\n\nRecommendation: ${candidate.recommendation}`);
      }
      setLoading(false);
    };
    runAnalysis();
  }, [candidate, jd]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bgCard, borderRadius: 16, border: `1px solid ${T.border}`,
        maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "auto",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Zap size={18} color={T.accent} />
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>AI Deep Analysis</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Avatar initials={candidate.avatar} color={candidate.color} size={48} />
            <div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{candidate.name}</div>
              <div style={{ color: T.textMuted, fontSize: 12 }}>{candidate.experience}y exp · {candidate.location}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><ScoreRing score={candidate.overallScore} size={50} /></div>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 }}>
              <RefreshCw size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ color: T.textMuted, fontSize: 13 }}>Analyzing candidate profile...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{
              background: T.bgSurface, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7,
              color: T.text, whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace",
              border: `1px solid ${T.border}`,
            }}>{analysis}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CANDIDATE DETAIL PANEL ───────────────────────────────────
const CandidateDetail = ({ candidate, jd, onClose, onShortlist }) => {
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const c = candidate;
  const radarData = [
    { metric: "Skills", value: c.skillScore, fullMark: 100 },
    { metric: "Experience", value: c.expScore, fullMark: 100 },
    { metric: "Education", value: c.eduScore, fullMark: 100 },
    { metric: "Keywords", value: c.keywordScore, fullMark: 100 },
    { metric: "Overall", value: c.overallScore, fullMark: 100 },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      display: "flex", justifyContent: "flex-end", zIndex: 900,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(680px, 90vw)", height: "100%", background: T.bg, borderLeft: `1px solid ${T.border}`,
        overflow: "auto", animation: "slideIn 0.3s ease",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, background: T.bgCard }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="ghost" icon={Zap} onClick={() => setShowAI(true)}>AI Analysis</Btn>
              <Btn size="sm" variant={c.shortlisted ? "success" : "secondary"} icon={c.shortlisted ? CheckCircle : Plus}
                onClick={() => onShortlist(c.id)}>{c.shortlisted ? "Shortlisted" : "Shortlist"}</Btn>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar initials={c.avatar} color={c.color} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>{c.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: T.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{c.location}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={12} />{c.experience}y exp</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{c.noticePeriod}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={12} />{c.expectedCTC}</span>
              </div>
            </div>
            <ScoreRing score={c.overallScore} size={64} label="Match" />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            <Badge variant={c.recommendation === "Strong Hire" ? "success" : c.recommendation === "Hire" ? "default" : c.recommendation === "Maybe" ? "warning" : "danger"}>
              {c.recommendation}
            </Badge>
            <Badge variant="outline">{c.interviewStage}</Badge>
            <Badge variant="purple">{c.education.split(",")[0]}</Badge>
          </div>
        </div>

        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ margin: "16px 0" }}>
            <TabBar tabs={[
              { id: "overview", label: "Overview" },
              { id: "scoring", label: "Scoring" },
              { id: "experience", label: "Experience" },
              { id: "assessment", label: "Assessment" },
            ]} active={activeTab} onChange={setActiveTab} />
          </div>

          {activeTab === "overview" && (
            <>
              {/* Contact */}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Contact</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  <span style={{ color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}><Mail size={13} />{c.email}</span>
                  <span style={{ color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} />{c.phone}</span>
                </div>
              </div>

              {/* Skills */}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.skills.map(s => (
                    <Badge key={s} variant={jd.mandatorySkills.includes(s) ? "success" : jd.preferredSkills.includes(s) ? "cyan" : "outline"} size="sm">{s}</Badge>
                  ))}
                </div>
                {c.missingMandatory.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: T.danger, fontWeight: 600, marginBottom: 6 }}>Missing Mandatory</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {c.missingMandatory.map(s => <Badge key={s} variant="danger" size="xs">{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              {/* Companies */}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Work History</div>
                {c.companies.map((comp, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < c.companies.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? T.success : T.accent }} />
                    <span style={{ fontSize: 13, color: T.text }}>{comp}</span>
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Key Projects</div>
                {c.projects.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: T.text, padding: "6px 0", display: "flex", gap: 8 }}>
                    <ChevronRight size={14} color={T.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "scoring" && (
            <>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Match Breakdown</div>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
                  <ScoreRing score={c.skillScore} size={64} label="Skills" />
                  <ScoreRing score={c.expScore} size={64} label="Experience" />
                  <ScoreRing score={c.eduScore} size={64} label="Education" />
                  <ScoreRing score={c.keywordScore} size={64} label="Keywords" />
                </div>
              </div>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Radar Profile</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: T.textMuted, fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Scoring Logic</div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: T.text }}>Skill Match ({c.skillScore}%)</strong>: {c.skills.filter(s => jd.mandatorySkills.includes(s)).length}/{jd.mandatorySkills.length} mandatory skills matched. {c.skills.filter(s => jd.preferredSkills.includes(s)).length}/{jd.preferredSkills.length} preferred skills matched.
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: T.text }}>Experience ({c.expScore}%)</strong>: {c.experience}y actual vs {jd.experience} required. {c.experience >= 5 ? "Meets" : "Below"} minimum threshold.
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: T.text }}>Education ({c.eduScore}%)</strong>: {c.education}. {c.certifications.length > 0 ? `Certifications: ${c.certifications.join(", ")}` : "No relevant certifications."}
                  </div>
                  <div>
                    <strong style={{ color: T.text }}>Keywords ({c.keywordScore}%)</strong>: Resume-JD keyword overlap analysis factoring TF-IDF weighting and semantic similarity.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "experience" && (
            <>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Career Timeline</div>
                {c.companies.map((comp, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < c.companies.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: i === 0 ? T.success : T.accent, border: `2px solid ${T.bg}` }} />
                      {i < c.companies.length - 1 && <div style={{ width: 2, flex: 1, background: T.border, marginTop: 4 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{comp}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{i === 0 ? "Current" : "Previous"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Education</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <GraduationCap size={18} color={T.purple} />
                  <span style={{ fontSize: 14, color: T.text }}>{c.education}</span>
                </div>
              </div>
              {c.certifications.length > 0 && (
                <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Certifications</div>
                  {c.certifications.map((cert, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <Award size={14} color={T.warning} />
                      <span style={{ fontSize: 13, color: T.text }}>{cert}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Achievements</div>
                {c.achievements.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <Star size={14} color={T.warning} />
                    <span style={{ fontSize: 13, color: T.text }}>{a}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "assessment" && (
            <>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.success, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Strengths</div>
                {c.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: T.text }}>
                    <CheckCircle size={14} color={T.success} style={{ marginTop: 2, flexShrink: 0 }} />{s}
                  </div>
                ))}
              </div>
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.warning, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Gaps</div>
                {c.gaps.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: T.text }}>
                    <AlertTriangle size={14} color={T.warning} style={{ marginTop: 2, flexShrink: 0 }} />{g}
                  </div>
                ))}
              </div>
              {c.redFlags.length > 0 && (
                <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.danger, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Red Flags</div>
                  {c.redFlags.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: T.text }}>
                      <XCircle size={14} color={T.danger} style={{ marginTop: 2, flexShrink: 0 }} />{r}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Recruiter Notes</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, padding: 12, background: T.bgSurface, borderRadius: 8 }}>{c.recruiterNotes}</div>
              </div>
            </>
          )}
        </div>
      </div>
      {showAI && <AIAnalysisPanel candidate={c} jd={jd} onClose={() => setShowAI(false)} />}
    </div>
  );
};

// ─── COMPARISON VIEW ──────────────────────────────────────────
const ComparisonView = ({ candidates, jd }) => {
  const [selected, setSelected] = useState([candidates[0]?.id, candidates[1]?.id].filter(Boolean));
  const compared = candidates.filter(c => selected.includes(c.id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Target size={18} color={T.accent} />
        <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Side-by-Side Comparison</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {candidates.map(c => (
          <button key={c.id} onClick={() => {
            setSelected(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : prev.length < 3 ? [...prev, c.id] : prev);
          }} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${selected.includes(c.id) ? T.accent : T.border}`,
            background: selected.includes(c.id) ? T.accentGlow : T.bgCard, color: selected.includes(c.id) ? T.accent : T.textMuted,
            cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
          }}>{c.name}</button>
        ))}
      </div>
      {compared.length >= 2 ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${compared.length}, 1fr)`, gap: 16 }}>
          {compared.map(c => (
            <div key={c.id} style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: 16, background: `${c.color}10`, borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
                <Avatar initials={c.avatar} color={c.color} size={48} />
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15, marginTop: 8 }}>{c.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12 }}>{c.location} · {c.experience}y</div>
                <div style={{ marginTop: 8 }}><ScoreRing score={c.overallScore} size={56} /></div>
              </div>
              <div style={{ padding: 16 }}>
                {[
                  { label: "Skills", value: c.skillScore, color: c.skillScore >= 85 ? T.success : c.skillScore >= 70 ? T.warning : T.danger },
                  { label: "Experience", value: c.expScore, color: c.expScore >= 85 ? T.success : c.expScore >= 70 ? T.warning : T.danger },
                  { label: "Education", value: c.eduScore, color: c.eduScore >= 85 ? T.success : c.eduScore >= 70 ? T.warning : T.danger },
                  { label: "Keywords", value: c.keywordScore, color: c.keywordScore >= 85 ? T.success : c.keywordScore >= 70 ? T.warning : T.danger },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: T.textMuted }}>{m.label}</span>
                      <span style={{ color: m.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}%</span>
                    </div>
                    <ProgressBar value={m.value} color={m.color} />
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>KEY SKILLS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {c.skills.slice(0, 6).map(s => (
                      <Badge key={s} variant={jd.mandatorySkills.includes(s) ? "success" : "outline"} size="xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>MISSING</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {c.missingMandatory.map(s => <Badge key={s} variant="danger" size="xs">{s}</Badge>)}
                    {c.missingMandatory.length === 0 && <span style={{ fontSize: 11, color: T.success }}>None</span>}
                  </div>
                </div>
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <Badge variant={c.recommendation === "Strong Hire" ? "success" : c.recommendation === "Hire" ? "default" : c.recommendation === "Maybe" ? "warning" : "danger"} size="md">
                    {c.recommendation}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 14 }}>
          Select at least 2 candidates to compare
        </div>
      )}
    </div>
  );
};

// ─── SKILL HEATMAP ────────────────────────────────────────────
const SkillHeatmap = () => (
  <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Skill Coverage Heatmap</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
      {SKILL_HEATMAP_DATA.map(s => {
        const intensity = s.avgScore / 100;
        const bg = s.avgScore >= 80 ? `rgba(16,185,129,${intensity * 0.4})` : s.avgScore >= 65 ? `rgba(245,158,11,${intensity * 0.4})` : `rgba(239,68,68,${intensity * 0.4})`;
        return (
          <div key={s.skill} style={{
            padding: "12px 10px", borderRadius: 8, background: bg, border: `1px solid ${T.border}`,
            textAlign: "center", transition: "transform 0.2s", cursor: "default",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.skill}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace", margin: "4px 0" }}>{s.candidates}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>avg {s.avgScore}%</div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── JD PANEL ─────────────────────────────────────────────────
const JDPanel = ({ jd }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <FileText size={18} color={T.accent} />
      <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Job Description</span>
      <Badge variant="success">Parsed</Badge>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Position</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{jd.title}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{jd.company}</div>
      </div>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
          <div><span style={{ color: T.textMuted }}>Location:</span><div style={{ color: T.text, fontWeight: 600, marginTop: 2 }}>{jd.location}</div></div>
          <div><span style={{ color: T.textMuted }}>Experience:</span><div style={{ color: T.text, fontWeight: 600, marginTop: 2 }}>{jd.experience}</div></div>
          <div><span style={{ color: T.textMuted }}>Salary:</span><div style={{ color: T.text, fontWeight: 600, marginTop: 2 }}>{jd.salary}</div></div>
          <div><span style={{ color: T.textMuted }}>Department:</span><div style={{ color: T.text, fontWeight: 600, marginTop: 2 }}>{jd.department}</div></div>
        </div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.danger, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Mandatory Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {jd.mandatorySkills.map(s => <Badge key={s} variant="danger" size="sm">{s}</Badge>)}
        </div>
      </div>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.cyan, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Preferred Skills</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {jd.preferredSkills.map(s => <Badge key={s} variant="cyan" size="sm">{s}</Badge>)}
        </div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Education</div>
        <div style={{ fontSize: 13, color: T.text }}>{jd.education}</div>
      </div>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Certifications</div>
        {jd.certifications.map(c => <div key={c} style={{ fontSize: 13, color: T.text }}>{c}</div>)}
      </div>
      <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>Domain</div>
        {jd.domainKnowledge.map(d => <Badge key={d} variant="purple" size="sm" style={{ marginBottom: 4 }}>{d}</Badge>)}
      </div>
    </div>
    <div style={{ background: T.bgCard, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Key Responsibilities</div>
      {jd.responsibilities.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13, color: T.text }}>
          <ChevronRight size={14} color={T.accent} style={{ marginTop: 2, flexShrink: 0 }} />{r}
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────
export default function HRDashboard() {
  const [candidates, setCandidates] = useState(generateCandidates);
  const [jd, setJd] = useState(MOCK_JD);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [sortBy, setSortBy] = useState("overallScore");
  const [sortDir, setSortDir] = useState("desc");
  const [filterShortlisted, setFilterShortlisted] = useState("all");
  const [filterMinScore, setFilterMinScore] = useState(0);

  // Sync with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: 'id=eq.recruiteriq'
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            const d = payload.new.data;
            if (d.candidates) setCandidates(d.candidates);
            if (d.jd) setJd(d.jd);
          }
        }
      )
      .subscribe();

    async function init() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('data')
          .eq('id', 'recruiteriq')
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // Not found
            await supabase.from('settings').upsert({ id: 'recruiteriq', data: { candidates: generateCandidates(), jd: MOCK_JD } });
          }
        } else if (data && data.data) {
          if (data.data.candidates) setCandidates(data.data.candidates);
          if (data.data.jd) setJd(data.data.jd);
        }
      } catch (e) {
        console.error("Supabase init error:", e);
      }
    }

    init();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveToCloud = useCallback(async (newCandidates, newJd) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('settings').upsert({
        id: 'recruiteriq',
        data: { candidates: newCandidates || candidates, jd: newJd || jd }
      });
    } catch (e) {
      console.error("Cloud save failed:", e);
    }
  }, [candidates, jd]);

  const toggleShortlist = (id) => {
    const next = candidates.map(c => c.id === id ? { ...c, shortlisted: !c.shortlisted } : c);
    setCandidates(next);
    saveToCloud(next);
  };

  const filtered = useMemo(() => {
    let result = [...candidates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q) || c.companies.some(co => co.toLowerCase().includes(q))
      );
    }
    if (filterShortlisted === "yes") result = result.filter(c => c.shortlisted);
    if (filterShortlisted === "no") result = result.filter(c => !c.shortlisted);
    if (filterMinScore > 0) result = result.filter(c => c.overallScore >= filterMinScore);
    result.sort((a, b) => sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);
    return result;
  }, [candidates, searchQuery, sortBy, sortDir, filterShortlisted, filterMinScore]);

  const stats = useMemo(() => ({
    total: candidates.length,
    shortlisted: candidates.filter(c => c.shortlisted).length,
    rejected: candidates.filter(c => c.recommendation === "Reject").length,
    avgScore: Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / candidates.length),
    strongHires: candidates.filter(c => c.recommendation === "Strong Hire").length,
  }), [candidates]);

  const DIVERSITY_DATA = [
    { name: "Female", value: candidates.filter(c => c.gender === "Female").length },
    { name: "Male", value: candidates.filter(c => c.gender === "Male").length },
  ];
  const DIVERSITY_COLORS = [T.purple, T.accent];

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart2 size={16} /> },
    { id: "candidates", label: "Candidates", icon: <Users size={16} /> },
    { id: "jd", label: "Job Description", icon: <FileText size={16} /> },
    { id: "compare", label: "Compare", icon: <Layers size={16} /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ─── TOP NAV ─── */}
      <header style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", borderBottom: `1px solid ${T.border}`, background: T.bgCard,
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: T.gradient1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>RecruitIQ</span>
            <Badge variant="purple" size="xs">Enterprise</Badge>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActiveView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              background: activeView === n.id ? T.accentGlow : "transparent",
              color: activeView === n.id ? T.accent : T.textMuted,
            }}>{n.icon}{n.label}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, position: "relative" }}>
            <Bell size={18} />
            <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: T.danger }} />
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.gradient1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>DY</div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>

        {/* ═══ DASHBOARD VIEW ═══ */}
        {activeView === "dashboard" && (
          <>
            {/* Executive Banner */}
            <div style={{
              background: `linear-gradient(135deg, ${T.bgCard} 0%, ${T.bgSurface} 100%)`,
              borderRadius: 16, padding: 24, marginBottom: 24, border: `1px solid ${T.border}`,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `${T.accent}08` }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Active Requisition</div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{jd.title}</div>
                <div style={{ fontSize: 14, color: T.textMuted }}>{jd.company} · {jd.location} · {jd.salary}</div>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard icon={Users} label="Total Applicants" value={stats.total} change="+12%" changeType="up" color={T.accent} />
              <StatCard icon={CheckCircle} label="Shortlisted" value={stats.shortlisted} change="+3" changeType="up" color={T.success} />
              <StatCard icon={XCircle} label="Rejected" value={stats.rejected} change="-2" changeType="down" color={T.danger} />
              <StatCard icon={Target} label="Avg Match Score" value={`${stats.avgScore}%`} change="+5%" changeType="up" color={T.warning} />
              <StatCard icon={Star} label="Strong Hires" value={stats.strongHires} color={T.purple} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              {/* Hiring Funnel */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Hiring Funnel</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {FUNNEL_DATA.map((f, i) => (
                    <div key={f.stage} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 90, fontSize: 12, color: T.textMuted, fontWeight: 500, textAlign: "right" }}>{f.stage}</div>
                      <div style={{ flex: 1, position: "relative" }}>
                        <div style={{
                          height: 28, borderRadius: 6, background: `${f.color}20`,
                          width: `${(f.count / FUNNEL_DATA[0].count) * 100}%`, minWidth: 40,
                          display: "flex", alignItems: "center", paddingLeft: 10,
                          transition: "width 0.8s ease",
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: f.color, fontFamily: "'JetBrains Mono', monospace" }}>{f.count}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textDim, width: 40, textAlign: "right" }}>
                        {i > 0 ? `${Math.round((f.count / FUNNEL_DATA[i - 1].count) * 100)}%` : "100%"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Candidates */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Top Matches</div>
                {candidates.sort((a, b) => b.overallScore - a.overallScore).slice(0, 5).map((c, i) => (
                  <div key={c.id} onClick={() => setSelectedCandidate(c)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                    borderBottom: i < 4 ? `1px solid ${T.border}` : "none", cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textDim, width: 18, fontFamily: "'JetBrains Mono', monospace" }}>#{i + 1}</span>
                    <Avatar initials={c.avatar} color={c.color} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{c.experience}y · {c.location}</div>
                    </div>
                    <ScoreRing score={c.overallScore} size={38} strokeWidth={3} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              {/* Hiring Trends */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Hiring Trends</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={HIRING_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="applications" stroke={T.accent} fill={T.accentGlow} strokeWidth={2} />
                    <Area type="monotone" dataKey="shortlisted" stroke={T.success} fill={T.successBg} strokeWidth={2} />
                    <Area type="monotone" dataKey="hired" stroke={T.purple} fill={T.purpleBg} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Diversity */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Diversity Snapshot</div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={DIVERSITY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={4}>
                        {DIVERSITY_DATA.map((_, i) => <Cell key={i} fill={DIVERSITY_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {DIVERSITY_DATA.map((d, i) => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: DIVERSITY_COLORS[i] }} />
                        <span style={{ fontSize: 13, color: T.text }}>{d.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: DIVERSITY_COLORS[i], fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
                      {Math.round((DIVERSITY_DATA[0].value / candidates.length) * 100)}% female representation
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <SkillHeatmap />
          </>
        )}

        {/* ═══ CANDIDATES VIEW ═══ */}
        {activeView === "candidates" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Candidates</div>
                <div style={{ fontSize: 13, color: T.textMuted }}>{filtered.length} of {candidates.length} candidates</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, skill, company..." />
                <select value={filterShortlisted} onChange={e => setFilterShortlisted(e.target.value)} style={{
                  padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgSurface,
                  color: T.text, fontSize: 13, outline: "none", cursor: "pointer",
                }}>
                  <option value="all">All Status</option>
                  <option value="yes">Shortlisted</option>
                  <option value="no">Not Shortlisted</option>
                </select>
                <select value={`${sortBy}-${sortDir}`} onChange={e => {
                  const [s, d] = e.target.value.split("-");
                  setSortBy(s); setSortDir(d);
                }} style={{
                  padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgSurface,
                  color: T.text, fontSize: 13, outline: "none", cursor: "pointer",
                }}>
                  <option value="overallScore-desc">Score ↓</option>
                  <option value="overallScore-asc">Score ↑</option>
                  <option value="experience-desc">Experience ↓</option>
                  <option value="experience-asc">Experience ↑</option>
                </select>
              </div>
            </div>

            {/* Candidate Table */}
            <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1.2fr 0.8fr",
                padding: "12px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 11,
                fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                <span>Candidate</span><span>Score</span><span>Experience</span><span>Location</span><span>Notice</span><span>Status</span><span>Actions</span>
              </div>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelectedCandidate(c)} style={{
                  display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 1.2fr 0.8fr",
                  padding: "14px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer",
                  alignItems: "center", transition: "background 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bgCardHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar initials={c.avatar} color={c.color} size={36} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>{c.education.split(",")[0]}</div>
                    </div>
                  </div>
                  <div><ScoreRing score={c.overallScore} size={40} strokeWidth={3} /></div>
                  <div style={{ fontSize: 13, color: T.text }}>{c.experience}y</div>
                  <div style={{ fontSize: 13, color: T.textMuted }}>{c.location}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{c.noticePeriod}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Badge variant={c.recommendation === "Strong Hire" ? "success" : c.recommendation === "Hire" ? "default" : c.recommendation === "Maybe" ? "warning" : "danger"} size="xs">
                      {c.recommendation}
                    </Badge>
                  </div>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleShortlist(c.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: c.shortlisted ? T.success : T.textDim, transition: "color 0.2s",
                    }}><Star size={16} fill={c.shortlisted ? T.success : "none"} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ JD VIEW ═══ */}
        {activeView === "jd" && <JDPanel jd={jd} />}

        {/* ═══ COMPARE VIEW ═══ */}
        {activeView === "compare" && <ComparisonView candidates={candidates} jd={jd} />}

        {/* ═══ ANALYTICS VIEW ═══ */}
        {activeView === "analytics" && (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 20 }}>Analytics & Insights</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              {/* Score Distribution */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Score Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={candidates.map(c => ({ name: c.name.split(" ")[0], score: c.overallScore, skill: c.skillScore }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: T.textMuted }} />
                    <Bar dataKey="score" name="Overall" fill={T.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="skill" name="Skills" fill={T.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendation Breakdown */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Recommendation Breakdown</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Strong Hire", value: candidates.filter(c => c.recommendation === "Strong Hire").length },
                        { name: "Hire", value: candidates.filter(c => c.recommendation === "Hire").length },
                        { name: "Maybe", value: candidates.filter(c => c.recommendation === "Maybe").length },
                        { name: "Reject", value: candidates.filter(c => c.recommendation === "Reject").length },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}
                    >
                      <Cell fill={T.success} /><Cell fill={T.accent} /><Cell fill={T.warning} /><Cell fill={T.danger} />
                    </Pie>
                    <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              {/* Experience vs Score */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Experience vs Match Score</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={candidates.sort((a, b) => b.experience - a.experience).map(c => ({ name: c.name.split(" ")[0], exp: c.experience, score: c.overallScore }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="exp" name="Years" fill={T.cyan} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="score" name="Score" fill={T.orange} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hiring Trends Line */}
              <div style={{ background: T.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Monthly Pipeline</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={HIRING_TRENDS}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="applications" name="Applied" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 4 }} />
                    <Line type="monotone" dataKey="shortlisted" name="Shortlisted" stroke={T.success} strokeWidth={2} dot={{ fill: T.success, r: 4 }} />
                    <Line type="monotone" dataKey="hired" name="Hired" stroke={T.purple} strokeWidth={2} dot={{ fill: T.purple, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <SkillHeatmap />
          </>
        )}
      </main>

      {/* ─── CANDIDATE DETAIL SLIDE-OUT ─── */}
      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate} jd={jd}
          onClose={() => setSelectedCandidate(null)}
          onShortlist={toggleShortlist}
        />
      )}
    </div>
  );
}
