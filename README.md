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

## Getting Started

### API Development
```bash
cd api
npm install
npm run start:dev
```

### Commands
- Build: `npm run build` (in api/)
- Test: `npm run test` (in api/)
- Lint: `npm run lint` (in api/)

## Phase 0 Status: Complete ✅
- ✅ Monorepo structure created
- ✅ NestJS API initialized with stub endpoints
- ✅ Basic tooling configured