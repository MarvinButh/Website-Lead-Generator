# Website Lead Generator

**ALWAYS follow these instructions first and fall back to additional search and context gathering only if the information in these instructions is incomplete or found to be in error.**

Website Lead Generator is a Python FastAPI backend + Next.js frontend monorepo for finding local businesses without websites and generating sales leads/offers.

## Working Effectively

### Initial Setup
Bootstrap and validate the repository setup:
```bash
# Copy environment configuration
cp .env.example .env

# Backend setup
cd Backend
pip install -r requirements.txt  # Takes ~25 seconds. NEVER CANCEL.
export PYTHONPATH=$PWD
mkdir -p data src/pipelines/data

# Frontend setup  
cd Frontend/website-lead-dashboard
npm install -g pnpm  # If not already installed
pnpm install  # Takes ~2 seconds with cache, ~15 seconds clean. NEVER CANCEL.
```

### Build and Test Commands
**CRITICAL: Set timeout to 180+ seconds for all commands. NEVER CANCEL builds or tests.**

Backend testing:
```bash
cd Backend
export PYTHONPATH=/path/to/repo/Backend
python -m pytest tests/ -v  # Takes ~2 seconds. NEVER CANCEL timeout=180s.
```

Frontend linting and validation:
```bash
cd Frontend/website-lead-dashboard  
pnpm run lint  # Takes ~3 seconds. NEVER CANCEL timeout=180s.
# Note: Build may fail due to Google Fonts access in restricted environments
# pnpm run build  # KNOWN ISSUE: Fails with Google Fonts SSL errors in some environments
```

### Running the Application

**ALWAYS run both backend and frontend servers for complete validation:**

Backend server:
```bash
cd Backend
export PYTHONPATH=/path/to/repo/Backend  
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
# Server ready when you see "Application startup complete."
# Falls back to SQLite if PostgreSQL not available (normal in local dev)
```

Frontend server:
```bash
cd Frontend/website-lead-dashboard
export NEXT_PUBLIC_API_BASE=http://localhost:8000
pnpm run dev  # Ready in ~1 second. Available at http://localhost:3000
```

Docker alternative (if SSL certificate issues are resolved):
```bash
# Note: May fail with SSL certificate errors in restricted environments
docker compose up --build  # NEVER CANCEL timeout=1800s (30 minutes)
```

## Validation Scenarios

**CRITICAL: Always test these complete user workflows after making changes:**

### 1. API Health Check
```bash
curl -s http://localhost:8000/healthz  # Should return {"status":"ok"}
```

### 2. Lead Generation Workflow
```bash
# Test lead generation endpoint
curl -s -X POST http://localhost:8000/leads/generate \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["Test"], "use_places": false, "use_overpass": false, "city": "Berlin", "country_code": "DE"}'
  
# Verify leads endpoint
curl -s http://localhost:8000/leads
```

### 3. Frontend Accessibility
```bash
curl -s -I http://localhost:3000  # Should return HTTP/1.1 200 OK
```

### 4. Pipeline Script Validation
```bash
cd Backend
export PYTHONPATH=/path/to/repo/Backend
python src/pipelines/lead_auto_pipeline_de.py  # Should complete without errors
# Note: May warn about missing GOOGLE_API_KEY (expected in development)
```

### 5. Manual Frontend Testing
Visit http://localhost:3000 in browser and:
- Verify dashboard loads without errors (should show "Website Lead Dashboard" with form)
- Navigate to settings page (/settings) 
- Test lead generation form with keywords like "Test" (will show 0 results without API keys - this is expected)
- Verify "Generate leads" button works and returns to dashboard
- Test "Filter Leads", "Generate Offers", and "Clear Leads" buttons (should work without errors)

## Important File Locations

### Backend Structure
- `Backend/src/api/main.py` - FastAPI application entry point
- `Backend/src/db/` - Database models and repositories  
- `Backend/src/pipelines/` - Lead generation and filtering pipelines
- `Backend/tests/` - Test suite (8 tests, ~2 seconds runtime)
- `Backend/requirements.txt` - Python dependencies

### Frontend Structure  
- `Frontend/website-lead-dashboard/src/app/` - Next.js app directory
- `Frontend/website-lead-dashboard/src/components/` - React components
- `Frontend/website-lead-dashboard/package.json` - Node.js dependencies
- `Frontend/website-lead-dashboard/src/app/settings/` - Configuration UI

### Configuration
- `.env.example` → `.env` - Environment variables and API keys
- `docker-compose.yml` - Multi-service Docker setup
- `Backend/alembic/` - Database migrations

## Common Tasks and Timings

### Dependency Installation (NEVER CANCEL)
- Backend `pip install -r requirements.txt`: ~25 seconds (timeout=180s)
- Frontend `pnpm install`: ~2 seconds cached, ~15 seconds clean (timeout=180s)

### Testing and Validation (NEVER CANCEL)  
- Backend tests: ~2 seconds (timeout=180s)
- Frontend linting: ~3 seconds (timeout=180s)
- Pipeline script execution: ~5 seconds (timeout=180s)

### Server Startup Times
- Backend server: ~2 seconds to "Application startup complete"  
- Frontend dev server: ~1 second to "Ready in Xms"

## Known Issues and Workarounds

### Google Fonts Access
Frontend build may fail with SSL certificate errors when accessing Google Fonts:
```
Failed to fetch `Geist` from Google Fonts
```
**Workaround:** Use local development mode (`pnpm run dev`) which works correctly.

### Docker Build Issues
Docker builds may fail with SSL certificate verification errors:
```
[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed
```
**Workaround:** Use local development setup instead of Docker.

### Database Connection
Backend falls back to SQLite when PostgreSQL unavailable (normal in development):
```
WARNING: Could not connect to primary DATABASE_URL. Falling back to SQLite.
```
**This is expected behavior and not an error.**

### Frontend Linting
ESLint may show one warning about unused variable:
```
_e' is defined but never used @typescript-eslint/no-unused-vars
```
**This is a minor warning and does not prevent the application from working.**

## Pre-commit Validation

**ALWAYS run these checks before committing changes:**
```bash
# Backend validation
cd Backend && export PYTHONPATH=$PWD && python -m pytest tests/ -v  # 8 tests should pass

# Frontend validation  
cd Frontend/website-lead-dashboard && pnpm run lint  # Should show only 1 warning about unused variable

# End-to-end validation (CRITICAL - run complete user workflow)
# 1. Start both servers (backend + frontend)
# 2. Test API endpoints with curl (health check, lead generation, leads list)
# 3. Verify frontend loads in browser at http://localhost:3000
# 4. Test lead generation form with sample keywords
# 5. Verify no JavaScript errors in browser console
```

## Emergency Recovery

If environment becomes corrupted:
```bash
# Clean Python environment
rm -rf Backend/__pycache__ Backend/.pytest_cache Backend/test.db

# Clean Frontend environment  
cd Frontend/website-lead-dashboard && rm -rf node_modules .next

# Reinstall everything
pip install -r Backend/requirements.txt
cd Frontend/website-lead-dashboard && pnpm install
```

## Architecture Notes

- **Backend:** Python 3.11+ FastAPI with SQLAlchemy ORM
- **Frontend:** Next.js 15 with React 19, Tailwind CSS, pnpm
- **Database:** PostgreSQL (production) / SQLite (development fallback)
- **Deployment:** Vercel-ready with Docker support
- **API Style:** RESTful endpoints with JSON payloads
- **Key Dependencies:** pandas, requests (backend), React/Next.js (frontend)

**Remember: NEVER CANCEL long-running operations. Wait for completion and set appropriate timeouts.**