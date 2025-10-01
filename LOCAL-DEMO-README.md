# SMILe Sales Funnel - Local Demo Guide

## Quick Start (5 Minutes)

### Prerequisites
- Docker installed and running
- Node.js 18+ installed
- Python 3.9+ installed
- Ollama installed with llama3.2 model

### One-Command Demo

```bash
make demo
```

That's it! The demo will:
1. Start DynamoDB Local in Docker
2. Create database tables
3. Start all services (Worker, API, UI)
4. Open your browser to http://localhost:5173

---

## Detailed Setup

### Step 1: Install Dependencies

```bash
make install
```

This installs:
- API dependencies (Node.js)
- UI dependencies (Node.js)
- Worker dependencies (Python)

### Step 2: Start Ollama

```bash
# In a separate terminal
ollama serve

# Pull the model (if not already pulled)
ollama pull llama3.2
```

### Step 3: Start the Demo

```bash
make start
# OR
./start-local.sh
```

### Step 4: Test It

Upload a sample email at http://localhost:5173

Or test from command line:

```bash
make test
# OR
./test-local.sh
```

---

## What's Running

| Service | URL | Purpose |
|---------|-----|---------|
| **UI** | http://localhost:5173 | React frontend - AI Inbox |
| **API** | http://localhost:3000 | NestJS REST API |
| **Worker** | http://localhost:8000 | FastAPI worker with LangGraph |
| **DynamoDB** | http://localhost:8001 | DynamoDB Local (Docker) |
| **Ollama** | http://localhost:11434 | Local LLM server |

---

## Demo Workflow

### 1. Upload Email

1. Go to http://localhost:5173
2. Click **"Choose File"** or drag-drop
3. Select one of the sample emails from `samples/` directory
4. Click **"Upload"**

### 2. Watch Processing

The email goes through LangGraph workflow:
- **Prefilter**: Check if business-relevant
- **Extract**: LLM extracts tasks and deals
- **Confidence Gate**: High confidence → auto-approve, low → draft
- **Persist**: Save to DynamoDB Local
- **Display**: Show in UI

Processing time: 5-15 seconds

### 3. Review Results

**Draft Tasks Tab:**
- Tasks that need human review (confidence < 0.8)
- Click "Accept" to approve or "Reject" to dismiss

**Suggested Deals Tab:**
- Potential deals extracted from emails
- Shows value, stage, probability
- Accept to add to pipeline

---

## Sample Emails

### High-Value Deal (`samples/deal-high-value.txt`)
- **Expected**: 1-2 tasks, 1 high-value deal (₹50L-1.5Cr)
- **Use case**: Large enterprise inquiry

### Interest Email (`samples/deal-interest.txt`)
- **Expected**: 1 deal (mid-value), 2-3 tasks
- **Use case**: SMB inquiry

### Follow-up (`samples/task-followup.txt`)
- **Expected**: 3-4 tasks, no deals
- **Use case**: Post-demo action items

### Meeting Request (`samples/task-meeting.txt`)
- **Expected**: 1-2 tasks (schedule call)
- **Use case**: Scheduling coordination

### Mixed (`samples/mixed.txt`)
- **Expected**: 4-5 tasks, 1 deal
- **Use case**: Complex email with multiple items

---

## Testing

### Automated Tests

```bash
make test
```

Runs end-to-end tests:
1. Upload sample emails
2. Verify extraction
3. Check API endpoints
4. Validate data persistence

### Manual Testing

```bash
# Upload via curl
curl -X POST http://localhost:8000/ingestEmail \
  -F "file=@samples/deal-high-value.txt"

# Check tasks
curl http://localhost:3000/tasks?status=draft | jq

# Check deals
curl http://localhost:3000/deals?status=draft | jq

# Get stats
curl http://localhost:3000/stats/summary | jq
```

---

## Troubleshooting

### DynamoDB Local Won't Start

```bash
# Check if port 8001 is in use
lsof -i :8001

# Kill existing DynamoDB container
docker stop smile-dynamodb
docker rm smile-dynamodb

# Restart
./start-local.sh
```

### Ollama Not Found

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Ensure llama3.2 is installed
ollama pull llama3.2
```

### Worker/API/UI Not Starting

```bash
# Check logs
tail -f logs/worker.log
tail -f logs/api.log
tail -f logs/ui.log

# Common issues:
# - Port already in use (change in .env.local)
# - Missing dependencies (run: make install)
# - Node/Python version mismatch
```

### No Data Showing in UI

```bash
# 1. Check if DynamoDB Local has data
# Install AWS CLI locally or use SDK

# 2. Verify API can connect to DynamoDB
curl http://localhost:3000/health

# 3. Check browser console for errors
# Open DevTools → Console tab

# 4. Verify CORS settings
# API should allow http://localhost:5173
```

### Tables Not Created

```bash
# Manually create tables
cd infra
npm install
node create-local-tables.js
```

---

## Stopping Services

### Stop All Services

```bash
make stop
# OR
./stop-local.sh
```

This stops:
- Worker
- API
- UI
- DynamoDB Local Docker container

### Stop Individual Services

```bash
# Stop Worker
kill $(cat .local/worker.pid)

# Stop API
kill $(cat .local/api.pid)

# Stop UI
kill $(cat .local/ui.pid)

# Stop DynamoDB Local
docker stop smile-dynamodb
```

---

## Clean Up

### Remove All Data

```bash
make clean
```

This removes:
- Docker containers
- Node modules
- Python venv
- Generated logs
- PID files

**Note**: Does NOT remove sample emails or source code

---

## Architecture (Local)

```
┌─────────────────────────────────────────────────────┐
│                  Browser (You)                      │
│              http://localhost:5173                  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Upload Email
                     ▼
┌─────────────────────────────────────────────────────┐
│                 React UI (Vite)                     │
│  • Email upload component                           │
│  • AI Inbox (Tasks/Deals tabs)                      │
│  • Accept/Reject actions                            │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────┐
│          FastAPI Worker (Python)                    │
│              Port 8000                              │
│                                                      │
│  LangGraph Workflow:                                │
│  1. Prefilter → 2. Extract → 3. Gate →             │
│  4. Persist → 5. Emit                               │
│                                                      │
│         Uses Ollama LLM locally                     │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Ollama LLM      │  │ DynamoDB Local   │
│  Port 11434      │  │ Port 8001        │
│                  │  │ (Docker)         │
│  • llama3.2      │  │                  │
│  • Extraction    │  │ • tasks          │
│  • Structured    │  │ • deals          │
│    output        │  │ • email_logs     │
└──────────────────┘  └─────────┬────────┘
                                │
                                │ Query
                                ▼
┌─────────────────────────────────────────────────────┐
│          NestJS API (TypeScript)                    │
│              Port 3000                              │
│                                                      │
│  Endpoints:                                         │
│  • GET /tasks?status=draft                          │
│  • GET /deals?status=draft                          │
│  • PUT /tasks/:id (accept/reject)                   │
│  • GET /stats/summary                               │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTP GET
                       ▼
            ┌──────────────────┐
            │   React UI       │
            │   Displays Data  │
            └──────────────────┘
```

---

## What's Next?

### After Demo Works

1. **Show stakeholders** - Working AI email extraction
2. **Gather feedback** - What features are most valuable?
3. **Tune prompts** - Improve extraction accuracy
4. **Add more samples** - Test edge cases

### Phase 2 (Cloud Deployment)

1. **Gmail Integration** - Auto-poll inbox
2. **AWS Deployment** - Move to cloud
3. **Management Dashboard** - Team metrics
4. **Multi-user** - Auth and permissions

---

## Cost Comparison

| Environment | Monthly Cost |
|-------------|--------------|
| **Local** | $0 (free!) |
| **AWS Dev** | ~$50-100 |
| **AWS Prod** | ~$200-500 |

Local development = **Zero cloud costs** ✨

---

## Support

### Common Commands

```bash
# Start everything
make demo

# Stop everything
make stop

# Run tests
make test

# View logs
make logs

# Clean up
make clean

# Help
make help
```

### Get Help

- Check logs: `tail -f logs/*.log`
- Test APIs: `curl http://localhost:3000/health`
- Verify DynamoDB: `docker logs smile-dynamodb`
- Check Ollama: `ollama list`

---

## Success Checklist

Before showing stakeholders, verify:

- [ ] All 5 services running (UI, API, Worker, DynamoDB, Ollama)
- [ ] Can upload email via UI
- [ ] Tasks/deals appear in inbox within 30 seconds
- [ ] Accept/Reject buttons work
- [ ] Stats counters update
- [ ] Browser console has no errors
- [ ] Sample emails extract correctly

---

Ready to demo! 🚀
