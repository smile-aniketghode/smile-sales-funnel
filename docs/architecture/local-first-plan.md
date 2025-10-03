# SMILe Sales Funnel - Local-First Development Plan

## Philosophy: Local-First, Cloud-Later

**Goal:** Everything runs on localhost with zero AWS dependencies until Phase 2+

**Benefits:**
- ✅ Faster development (no deploy cycles)
- ✅ Zero cloud costs during development
- ✅ Works offline
- ✅ Easy for team to clone and run
- ✅ Simpler debugging

---

## Architecture: Local vs Cloud

| Component | Local (Phase 1) | Cloud (Phase 2+) |
|-----------|-----------------|------------------|
| **Database** | DynamoDB Local | AWS DynamoDB |
| **LLM** | Ollama (local) | Ollama (local) OR Bedrock |
| **Storage** | SQLite for email_log | S3 for attachments |
| **Queue** | In-memory | SQS |
| **Gmail** | Manual upload | Gmail API polling |
| **Metrics** | Console logs | CloudWatch |
| **Auth** | None (single user) | Cognito/Auth0 |

---

## Phase 1: Complete Local Demo (1-2 days)

### Current Status: 80% Complete

**What's Working:**
- ✅ Ollama LLM running locally
- ✅ LangGraph workflow
- ✅ UI with upload
- ✅ API endpoints

**What's Broken:**
- ❌ DynamoDB persistence (expects AWS)
- ❌ Data not saving anywhere
- ❌ API returns empty data

### Solution: Replace DynamoDB with Local Alternatives

**Option 1: DynamoDB Local (Recommended)**
- Official AWS tool, runs in Docker
- 100% compatible with production DynamoDB code
- Easy migration to AWS later
- Setup: 10 minutes

**Option 2: SQLite (Simpler)**
- Single file database
- Fast, zero setup
- Need to rewrite queries for AWS later
- Setup: 5 minutes

**Option 3: JSON Files (Quick & Dirty)**
- Store tasks/deals as JSON files
- Good for demo, throwaway code
- Setup: 2 minutes

---

## Immediate Tasks (Local Phase 1)

### Task 1: Local Database Setup (1-2 hours)

**Using DynamoDB Local (Recommended):**

```bash
# Start DynamoDB Local with Docker
docker run -p 8001:8000 amazon/dynamodb-local

# Create tables locally
cd infra/
node create-local-tables.js  # We'll create this script
```

**What we'll build:**
1. `infra/dynamodb-local/` - Local table definitions
2. `infra/create-local-tables.js` - Script to provision tables
3. `.env.local` - Local config pointing to localhost:8001

**OR Using SQLite (Simpler):**

```bash
# No setup needed, just:
pip install aiosqlite  # Python async SQLite
```

**What we'll build:**
1. `worker/src/services/sqlite_client.py` - Drop-in replacement
2. `worker/data/local.db` - SQLite file
3. Schema migration script

### Task 2: Fix Persistence Layer (2-3 hours)

**File changes:**
1. `worker/src/services/dynamodb_client.py`
   - Add local endpoint support (localhost:8001)
   - OR replace with SQLite client

2. `api/src/services/dynamodb.service.ts`
   - Point to local endpoint
   - OR replace with SQLite client

3. `.env.local` (new file)
   ```bash
   # Worker
   DYNAMODB_ENDPOINT=http://localhost:8001
   AWS_REGION=local
   AWS_ACCESS_KEY_ID=dummy
   AWS_SECRET_ACCESS_KEY=dummy

   OLLAMA_BASE_URL=http://localhost:11434
   LLM_MODEL=llama3.2
   CONFIDENCE_THRESHOLD=0.8

   # API
   DYNAMODB_ENDPOINT=http://localhost:8001
   AWS_REGION=local
   ```

### Task 3: End-to-End Testing (1 hour)

**Create test script:**

```bash
# test-local.sh
#!/bin/bash

# 1. Start DynamoDB Local
docker run -d -p 8001:8000 amazon/dynamodb-local

# 2. Create tables
node infra/create-local-tables.js

# 3. Start Ollama (if not running)
ollama serve &

# 4. Start Worker
cd worker && python -m src.main &

# 5. Start API
cd api && npm run start:dev &

# 6. Start UI
cd ui && npm run dev &

# 7. Wait for services
sleep 10

# 8. Test upload
curl -F "file=@sample-business-email.txt" http://localhost:8000/ingestEmail

# 9. Check API
curl http://localhost:3000/tasks?status=draft

echo "✅ Local demo ready at http://localhost:5173"
```

### Task 4: Sample Data (30 min)

Add 5 sample business emails:
1. `samples/deal-high-value.txt` - ₹50L contract mention
2. `samples/deal-interest.txt` - "Interested in your services"
3. `samples/task-followup.txt` - "Send proposal by Friday"
4. `samples/task-meeting.txt` - "Schedule call next week"
5. `samples/mixed.txt` - Multiple tasks and deals

---

## Local Development Workflow

### Daily Development

```bash
# Start everything
./start-local.sh

# Your services:
# - UI: http://localhost:5173
# - API: http://localhost:3000
# - Worker: http://localhost:8000
# - DynamoDB Local: http://localhost:8001

# Test with sample email
./test-upload.sh samples/deal-high-value.txt

# Check logs
docker logs dynamodb-local
tail -f worker/logs/worker.log
tail -f api/logs/api.log
```

### Stop Everything

```bash
./stop-local.sh
```

---

## Phase 1 Deliverables (Local Only)

### Demo Script (For Stakeholders)

```bash
# 1. Clone repo
git clone <repo>
cd SMILe-Sales-Funnel

# 2. Install dependencies
make install  # Or ./install.sh

# 3. Start demo
make demo  # Or ./start-local.sh

# 4. Open browser
open http://localhost:5173

# 5. Upload sample email
# Click "Upload Email" → Choose samples/deal-high-value.txt

# 6. See results in <30 seconds
# - Task appears in "Draft Tasks" tab
# - Deal appears in "Suggested Deals" tab
# - Accept/Reject buttons work
```

### What Works (Local Demo)

✅ **Email Processing:**
- Upload email via UI
- LangGraph workflow processes it
- Ollama LLM extracts tasks/deals
- Confidence gating (high → auto-accept, low → draft)

✅ **Data Persistence:**
- Tasks saved to local database
- Deals saved to local database
- Email logs tracked
- Idempotency (duplicate detection)

✅ **UI Features:**
- AI Inbox with tabs (Tasks/Deals)
- Accept/Reject actions
- Stats counters
- Email upload

✅ **Zero Cloud Dependencies:**
- No AWS account needed
- No API keys required
- No internet needed (after setup)

### What Doesn't Work Yet

❌ Gmail integration (manual upload only)
❌ Automated polling
❌ Management dashboard
❌ Multiple users
❌ Cost tracking (not relevant locally)

---

## Phase 2: Add Cloud Deployment (Later)

### When You're Ready for AWS

**Migration Strategy:**

1. **Database:** Swap DynamoDB Local → AWS DynamoDB
   ```bash
   # Change .env
   DYNAMODB_ENDPOINT=  # Empty = use AWS
   AWS_REGION=us-east-1
   # Add real AWS credentials
   ```

2. **Deploy Worker:** Lambda or ECS
3. **Deploy API:** Lambda or ECS
4. **Deploy UI:** S3 + CloudFront
5. **Add Gmail Polling:** Lambda on schedule

**No code changes needed** - just config!

---

## Local Development Scripts

### `start-local.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting SMILe Sales Funnel (Local Mode)"

# Start DynamoDB Local
echo "📦 Starting DynamoDB Local..."
docker run -d --name smile-dynamodb -p 8001:8000 amazon/dynamodb-local

# Wait for DynamoDB
sleep 2

# Create tables
echo "🗄️  Creating tables..."
node infra/create-local-tables.js

# Start Ollama (if not running)
echo "🤖 Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 5
fi

# Ensure llama3.2 is pulled
ollama pull llama3.2

# Start Worker
echo "⚙️  Starting Worker..."
cd worker
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt -q
python -m src.main &
WORKER_PID=$!
cd ..

# Start API
echo "🔌 Starting API..."
cd api
npm install
npm run start:dev &
API_PID=$!
cd ..

# Start UI
echo "🎨 Starting UI..."
cd ui
npm install
npm run dev &
UI_PID=$!
cd ..

# Save PIDs for cleanup
echo $WORKER_PID > .worker.pid
echo $API_PID > .api.pid
echo $UI_PID > .ui.pid

echo ""
echo "✅ SMILe Sales Funnel is running!"
echo ""
echo "   UI:      http://localhost:5173"
echo "   API:     http://localhost:3000"
echo "   Worker:  http://localhost:8000"
echo ""
echo "📧 Upload a sample email to get started!"
echo ""
echo "To stop: ./stop-local.sh"
```

### `stop-local.sh`

```bash
#!/bin/bash

echo "🛑 Stopping SMILe Sales Funnel..."

# Stop services
kill $(cat .worker.pid 2>/dev/null) 2>/dev/null
kill $(cat .api.pid 2>/dev/null) 2>/dev/null
kill $(cat .ui.pid 2>/dev/null) 2>/dev/null

# Stop Docker
docker stop smile-dynamodb 2>/dev/null
docker rm smile-dynamodb 2>/dev/null

# Cleanup
rm -f .worker.pid .api.pid .ui.pid

echo "✅ All services stopped"
```

### `Makefile`

```makefile
.PHONY: install demo test stop clean

install:
	@echo "📦 Installing dependencies..."
	cd api && npm install
	cd ui && npm install
	cd worker && pip install -r requirements.txt
	@echo "✅ Installation complete"

demo:
	@./start-local.sh

test:
	@./test-local.sh

stop:
	@./stop-local.sh

clean:
	@docker stop smile-dynamodb 2>/dev/null || true
	@docker rm smile-dynamodb 2>/dev/null || true
	@rm -rf worker/data/*.db
	@rm -rf api/node_modules ui/node_modules
	@echo "✅ Clean complete"
```

---

## Current Priority

**Complete Phase 1 Local Demo:**

1. ✅ Choose database (DynamoDB Local recommended)
2. ⏳ Create local setup scripts
3. ⏳ Fix persistence layer to use local DB
4. ⏳ Test end-to-end with samples
5. ⏳ Create demo scripts for stakeholders

**Time Estimate:** 6-8 hours focused work

**When Done:**
- Working local demo you can show anyone
- Zero AWS costs
- Easy to clone and run
- Foundation for cloud deployment later

---

## Decision: Which Local Database?

### Recommendation: **DynamoDB Local**

**Pros:**
- ✅ Same API as AWS DynamoDB
- ✅ Zero code changes for cloud migration
- ✅ Official AWS tool
- ✅ Tests work in both environments

**Cons:**
- ⚠️ Requires Docker
- ⚠️ 10-minute setup vs 2-minute

### Alternative: **SQLite**

**Pros:**
- ✅ Zero setup (single file)
- ✅ Simpler for beginners
- ✅ Fast

**Cons:**
- ⚠️ Need to rewrite queries for DynamoDB later
- ⚠️ Different query patterns

**Your choice!** Both work fine for local demo.
