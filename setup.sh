#!/bin/bash
# ─── RecruitIQ Quick Setup ───
# Run: chmod +x setup.sh && ./setup.sh

set -e

echo "╔══════════════════════════════════════════╗"
echo "║        RecruitIQ - Quick Setup           ║"
echo "╚══════════════════════════════════════════╝"

# ─── Backend Setup ───
echo ""
echo "▶ Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  ✓ Virtual environment created"
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo "  ✓ Dependencies installed"

# Copy env if not exists
cd ..
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  ✓ .env created from template"
fi

# ─── Frontend Setup ───
echo ""
echo "▶ Setting up React frontend..."
cd frontend
if command -v npm &> /dev/null; then
    npm install --silent
    echo "  ✓ Node modules installed"
else
    echo "  ⚠ npm not found — skip frontend install (install Node.js 20+)"
fi

cd ..

# ─── Run Tests ───
echo ""
echo "▶ Running backend tests..."
cd backend
source venv/bin/activate
pip install pytest httpx -q
python -m pytest tests/ -v --tb=short 2>/dev/null || echo "  ⚠ Some tests need review"

cd ..

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║            Setup Complete!               ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Start backend:                          ║"
echo "║    cd backend && source venv/bin/activate ║"
echo "║    uvicorn main:app --reload --port 8000 ║"
echo "║                                          ║"
echo "║  Seed demo data:                         ║"
echo "║    curl -X POST localhost:8000/api/seed  ║"
echo "║                                          ║"
echo "║  API docs:                               ║"
echo "║    http://localhost:8000/api/docs         ║"
echo "║                                          ║"
echo "║  Start frontend:                         ║"
echo "║    cd frontend && npm run dev             ║"
echo "║    http://localhost:3000                  ║"
echo "║                                          ║"
echo "║  Docker (with PostgreSQL):               ║"
echo "║    docker-compose up -d                   ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
