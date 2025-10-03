Branching model

main: stable, demo-ready

develop: integration branch

feature/*: small, focused units of work

tags: v0.x checkpoints per phase milestone

Commit format

Conventional commits: type(scope): message

types: feat, fix, chore, docs, refactor, test, ci

One logical change per commit

Include rollback note when changing contracts or infra

Phase 0: Scope, guards, repo skeleton (0.5 day)
Goal: Repo ready for Claude generation; guardrails set.

feature/repo-skel

chore(repo): init monorepo structure (infra/, worker/, api/, ui/, prompts/)

docs: add claude.md and README with MVP scope and guardrails

chore(git): add .gitignore, .editorconfig, commitlint config

chore(ci): add basic lint/test GH workflow (optional)

feature/config-guards

feat(config): add env loader and config schema (worker/api)

docs: document env vars and sample .env.example

test(config): add unit tests for required env

Tag checkpoint

tag: v0.1-phase0-ready

rollback: git checkout v0.1-phase0-ready

Phase 1: Thin end-to-end slice (3–5 days)
Goal: Labeled Gmail → prefilter → local LLM extract → persist → minimal UI

Infra and data

feature/infra-dynamo

feat(infra): DynamoDB table defs (tasks, deals, email_log, people, companies)

chore(infra): provision scripts (CloudFormation/Terraform) or docs for manual create

docs: table schemas documented in README

feature/models

feat(worker): add dataclasses/models and validators

test(worker): schema validation tests

feature/api-skel

feat(api): FastAPI/Express project bootstrap

feat(api): GET /tasks, GET /deals (stub returns)

test(api): smoke tests

Email and pipeline

feature/gmail-manual

feat(worker): /ingestEmail dev endpoint (raw MIME support) for local testing

test(worker): fixture MIME payload, verify parsed envelope fields

docs: how to test manual ingest with curl

feature/prefilter

feat(worker): prefilter (regex/keywords/domains), tokenizer-based truncation

test(worker): prefilter unit tests (skip/process cases)

feature/local-llm

feat(worker): local LLM client (llama.cpp HTTP) and extraction prompt

test(worker): JSON schema validation for LLM output

feature/persist

feat(worker): persist results to DynamoDB with idempotency (message-id+hash)

test(worker): idempotency tests, duplicate skip

feature/ui-inbox

feat(ui): React+Vite scaffold

feat(ui): AI Inbox page (Draft Tasks, Suggested Deals) and polling

feat(api): implement GET /tasks?status=draft, GET /deals?status=draft backed by DB

docs: running UI + API locally

Acceptance commit

feat(e2e): wire end-to-end: labeled email → draft task in UI within 30s

Tag: v0.2-phase1-e2e

Rollback: git checkout v0.2-phase1-e2e

Phase 2: Automated ingestion + review loop (1–2 weeks)
Goal: Batch poll, LangGraph orchestration, confidence gating, minimal dashboard, cost limits

Ingestion and orchestration

feature/gmail-batch

feat(worker): batch polling of labeled threads, dedupe by message-id

test(worker): poll limit and dedupe tests

feature/langgraph-min

feat(worker): LangGraph nodes (PreFilter → ExtractLocal → ConfidenceGate → Persist → EmitEvent)

test(worker): node-by-node unit tests

feature/confidence-auto

feat(worker): high-confidence auto-create vs draft

test(worker): confidence threshold branching

UI, counters, actions

feature/ui-actions

feat(api): POST /tasks/:id/accept|reject, POST /deals/:id/accept|reject

feat(ui): accept/reject actions with optimistic update

test(api): action handler tests

feature/ui-counters

feat(api): GET /stats/summary (extracted_week, accept_rate, suggested_deals)

feat(ui): show counters on top of inbox

feature/cost-quotas

feat(worker): daily token budget and throttle guard

test(worker): stop-on-budget test

Reliability

feature/retry-dlq

feat(infra): SQS DLQ and retry policy

feat(worker): push failed runs with context to DLQ

docs: DLQ inspection and replay procedure

Acceptance commit

feat(e2e): automated ingestion with confidence gating; dashboard counters live

Tag: v0.3-phase2-auto

Rollback: git checkout v0.3-phase2-auto

Phase 3: Usability, hygiene, batch ops (1–2 weeks)
Goal: Bulk actions, linking, dedupe hints, audit, undo, daily summary (optional)

Bulk and linking

feature/bulk-ops

feat(api): bulk accept/reject/reassign tasks and deals

feat(ui): bulk select and actions

test(api): bulk actions tests

feature/linking

feat(worker): link person by sender email, infer company by domain

feat(api): quick link endpoints; list unlinked items view

test(worker): linking tests

feature/dedupe-hints

feat(worker): simple dedupe suggestion for People by email

docs: manual merge guidance (MVP)

Audit and undo

feature/audit

feat(worker): write audit fields (agent, confidence, source message-id, snippet)

feat(api/ui): display audit info in lists

feature/undo

feat(api): undo last action (status revert or soft delete)

test(api): undo tests

Notifications (optional)

feature/daily-summary

feat(worker): daily digest generation

feat(api/ui): expose endpoint or email send (keep simple)

docs: how to enable/disable summary

Acceptance commit

feat(e2e): manager clears backlog; linking fixes; audit visible; undo works

Tag: v0.4-phase3-usable

Rollback: git checkout v0.4-phase3-usable

Phase 4: Hardening & polish (1–2 weeks)
Goal: Robust parsing, idempotency everywhere, metrics, budgets, UX polish

Reliability and polish

feature/mime-strip

feat(worker): robust MIME parse, signature/footer stripping, size limits

test(worker): parsing edge cases

feature/idempotency-all

refactor(worker): idempotency across nodes (message-id+hash)

test(worker): end-to-end idempotency

feature/metrics-logs

feat(worker): structured metrics (prefilter_pass, local_pass, fallback_rate, tokens)

docs: metrics dashboard recipe (CloudWatch/Grafana/Datadog)

feature/budget-alarms

feat(infra): LLM token budget alerts and cost alarms

docs: responding to alerts

feature/ui-polish

feat(ui): keyboard shortcuts, filters (owner, status, overdue), simple deals pipeline

fix(ui): bug fixes from pilot

Acceptance commit

feat(e2e): stable pilot-ready build with metrics, alarms, and smooth UX

Tag: v0.5-phase4-pilot

Rollback: git checkout v0.5-phase4-pilot

Claude usage guidance

One file or module per request to keep diffs small.

Ask Claude to:

Generate code only for the current feature branch scope.

Include tests and keep prompts short.

Maintain JSON schema validation strictly; return null if unsure.

Avoid expanding scope—refer to claude.md for constraints.

After each merged feature, request Claude to write:

A brief CHANGELOG entry

A rollback command snippet (git revert <sha> or revert plan)

Rollback strategy

Use tags at end of each phase for safe checkpoints.

For hot issues:

git revert <bad_sha> (preferred over reset to keep history)

If infra change broke env, roll back stack via IaC state (CloudFormation/Terraform) to previous version; keep versioned infra templates in infra/versions/

Keep DB migrations additive or avoid schema migrations by using schemaless fields in DynamoDB during MVP.

Sample commit sequence (Phase 1 excerpt)

chore(repo): init structure and tooling

docs: add claude.md and README

feat(infra): add DynamoDB table templates

feat(worker): models and validators

feat(worker): Gmail manual ingest endpoint

feat(worker): prefilter with token truncation

feat(worker): local LLM client and JSON schema validator

feat(worker): persist with idempotency

feat(api): GET /tasks, GET /deals

feat(ui): AI Inbox scaffold

feat(e2e): wire end-to-end demo path

tag v0.2-phase1-e2e

If you want, I can generate:

A starter GitHub repo structure with stub files and the first 10 commits

The exact LangGraph node stubs and unit tests

A small Makefile or taskfile to run worker/api/ui locally with seeded fixtures