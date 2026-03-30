.PHONY: setup run test seed docker clean lint

# ─── Setup ───
setup:
	chmod +x setup.sh && ./setup.sh

# ─── Run Backend ───
run:
	cd backend && uvicorn main:app --reload --port 8000

# ─── Run Frontend ───
frontend:
	cd frontend && npm run dev

# ─── Run Both ───
dev:
	@echo "Starting backend on :8000 and frontend on :3000..."
	cd backend && uvicorn main:app --reload --port 8000 &
	cd frontend && npm run dev

# ─── Seed Demo Data ───
seed:
	curl -s -X POST http://localhost:8000/api/seed | python3 -m json.tool

# ─── Run Tests ───
test:
	cd backend && python -m pytest tests/ -v --tb=short

# ─── Lint ───
lint:
	cd backend && ruff check . --ignore E501

# ─── Docker ───
docker:
	docker-compose up -d

docker-down:
	docker-compose down -v

# ─── Export CSV ───
export:
	curl -s http://localhost:8000/api/export/candidates/csv -o candidates_export.csv
	@echo "Exported to candidates_export.csv"

# ─── Clean ───
clean:
	rm -f backend/*.db backend/test_*.db
	rm -rf backend/__pycache__ backend/tests/__pycache__
	rm -rf backend/.pytest_cache
	rm -rf frontend/node_modules frontend/dist
	@echo "Cleaned!"
