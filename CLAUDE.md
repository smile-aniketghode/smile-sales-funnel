# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered sales funnel system that processes Gmail emails to automatically extract tasks and deals. The system follows a phased development approach from Phase 0 (repo setup) to Phase 4 (production-ready pilot).

## Architecture

The system uses a monorepo structure with these main components:
- `infra/` - Infrastructure as code (DynamoDB, CloudFormation/Terraform)
- `worker/` - Background processing service with LangGraph orchestration
- `api/` - NestJS REST API serving the UI
- `ui/` - React+Vite frontend with AI Inbox interface
- `prompts/` - LLM prompts and templates

### Data Flow
1. Gmail polling → labeled threads batch processing
2. Prefilter (regex/keywords/domains) → tokenizer truncation
3. Local LLM extraction → JSON schema validation
4. Confidence gating → auto-create vs draft
5. Persist to DynamoDB with idempotency (message-id+hash)
6. UI polling for draft tasks and suggested deals

### Core Models
- Tasks, Deals, EmailLog, People, Companies (DynamoDB tables)
- Person linking by sender email, company inference by domain
- Audit fields: agent, confidence, source message-id, snippet

## Development Guidelines

### Git Workflow
- **main**: stable, demo-ready
- **develop**: integration branch  
- **feature/\***: small, focused units of work
- **tags**: v0.x checkpoints per phase milestone

### Commit Format
Use conventional commits: `type(scope): message`
- Types: feat, fix, chore, docs, refactor, test, ci
- One logical change per commit
- Include rollback note when changing contracts or infra

### Feature Development
- Generate code only for the current feature branch scope
- One file or module per request to keep diffs small
- Include tests and keep prompts short
- Maintain JSON schema validation strictly; return null if unsure
- Avoid expanding scope—refer to this file for constraints

### Testing Strategy
- Unit tests for schema validation
- Node-by-node tests for LangGraph components
- End-to-end acceptance tests at phase boundaries
- Idempotency tests for duplicate message handling

### Infrastructure
- DynamoDB for persistence with schemaless fields during MVP
- Token budget limits and cost alarms
- Structured metrics (prefilter_pass, local_pass, fallback_rate, tokens)
- Direct processing without message queues (simplified architecture)

## Phase Checkpoints

Each phase ends with a tagged checkpoint for safe rollbacks:
- **v0.1-phase0-ready**: Repo skeleton and config guards
- **v0.2-phase1-e2e**: Thin end-to-end slice working
- **v0.3-phase2-auto**: Automated ingestion with confidence gating
- **v0.4-phase3-usable**: Bulk operations, linking, audit, undo
- **v0.5-phase4-pilot**: Production-ready with metrics and polish

## Rollback Strategy

Use tags at end of each phase for safe checkpoints.

For issues:
- `git revert <bad_sha>` (preferred over reset to keep history)
- For infra changes: roll back stack via IaC state to previous version
- Keep versioned infra templates in `infra/versions/`
- Keep DB migrations additive during MVP

## Key Constraints

- Local LLM processing (llama.cpp HTTP) for cost control
- Daily token budget and throttle guards
- Idempotency everywhere using message-id+hash
- Robust MIME parsing with signature/footer stripping
- Size limits and prefilter before LLM processing