# SMILe Sales Funnel

AI-powered sales funnel system that processes Gmail emails to automatically extract tasks and deals.

## Architecture

This is a monorepo containing:
- `api/` - NestJS REST API
- `worker/` - Background processing service
- `ui/` - React + Vite frontend
- `infra/` - Infrastructure as Code
- `prompts/` - LLM prompts and templates

## Development Phases

- **Phase 0**: Repo skeleton and config (current)
- **Phase 1**: Thin end-to-end slice
- **Phase 2**: Automated ingestion + review loop
- **Phase 3**: Usability, hygiene, batch ops
- **Phase 4**: Hardening & polish

See `Phasewise Plan.md` for detailed development roadmap.

## Quick Start

### Complete Local Demo (Recommended)
```bash
# 1. Start Ollama (separate terminal)
ollama serve

# 2. Start all services
make demo

# 3. Open browser at http://localhost:5173
```

**⚠️ Important:** For best performance, use `qwen2.5-coder:7b` model:
```bash
# Edit worker/.env.local
LLM_MODEL=qwen2.5-coder:7b  # Fast (20-30s)
# NOT llama3.2 (too slow - 90s+)
```

See [QUICKSTART.md](QUICKSTART.md) for full instructions.

---

## Development

### API Development
```bash
cd api
npm install
npm run start:dev
```

### Worker Development
```bash
cd worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m src.main
```

### Commands
- Start demo: `make demo`
- Stop all: `make stop`
- Run tests: `make test`
- View logs: `make logs`

## Current Status

### Phase 1: Local Demo ✅ 90% Complete
- ✅ Local-first architecture (DynamoDB Local)
- ✅ Worker + LangGraph + Ollama LLM
- ✅ React UI with email upload
- ✅ Task/Deal extraction working
- ✅ 5 sample business emails
- ✅ Comprehensive documentation (7 guides)
- ⚠️ Use qwen2.5-coder model for speed

**Next:** Tag v0.2-phase1-e2e, start Phase 2 Dashboard

### Phase 2: Dashboard + Gmail (Next - 2 weeks)
- Week 1: Dashboard UI with metrics
- Week 2: Gmail OAuth + auto-sync

See **[Phasewise Plan v3.md](Phasewise Plan v3.md)** for detailed roadmap.