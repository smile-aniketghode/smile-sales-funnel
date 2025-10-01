# SMILe Sales Funnel - Development Plan v2

## Business Context

**Problem:** Sales teams lose 3-5 hours/day manually triaging emails, miss opportunities buried in inbox, and have no systematic way to track customer conversations.

**Solution:** AI-powered sales funnel that automatically extracts tasks and deals from Gmail, reducing email triage time by 80% and ensuring zero missed opportunities.

**Target Users:**
- Sales reps (5-50 people per team)
- Sales managers (need visibility and control)
- Small business owners (wear multiple hats)

---

## Branching Model

- **main**: stable, demo-ready
- **develop**: integration branch
- **feature/\***: small, focused units of work
- **tags**: v0.x checkpoints per phase milestone

## Commit Format

Conventional commits: `type(scope): message`
- **Types**: feat, fix, chore, docs, refactor, test, ci
- One logical change per commit
- Include rollback note when changing contracts or infra

---

## Phase 0: Repo Skeleton ✅ COMPLETE
**Duration:** 0.5 day
**Business Goal:** Development infrastructure ready

### Features
- ✅ Monorepo structure (infra/, worker/, api/, ui/, prompts/)
- ✅ Config guards and env validation
- ✅ Git workflow and tooling

### Tag: v0.1-phase0-ready

---

## Phase 1: Working Demo (CURRENT - 80% Complete)
**Duration:** 1-2 days remaining
**Business Goal:** Prove AI can extract actionable intelligence from emails
**Success Metric:** Upload email → see tasks/deals in UI in <30s

### Business Value
- 🎯 Demonstrate ROI to stakeholders
- 🎯 Validate AI extraction quality
- 🎯 Get early user feedback

### Current Status
| Feature | Status | Remaining |
|---------|--------|-----------|
| Models & validation | ✅ Done | - |
| API skeleton | ✅ Done | - |
| Manual email upload | ✅ Done | - |
| Prefilter logic | ✅ Done | - |
| LLM extraction (Ollama) | ✅ Done | - |
| LangGraph workflow | ✅ Done | - |
| Confidence gating | ✅ Done | - |
| UI inbox | ✅ Done | - |
| **DynamoDB tables** | ❌ Missing | 2 hours |
| **Persistence layer** | ❌ Broken | 3 hours |
| **End-to-end test** | ❌ Needed | 1 hour |

### Remaining Work

**feature/infra-complete** (2-3 hours)
```bash
feat(infra): provision DynamoDB tables with CloudFormation
docs(infra): table schemas and setup instructions
```

**feature/persistence-fix** (3-4 hours)
```bash
fix(worker): implement async DynamoDB persistence
test(worker): idempotency tests with real DynamoDB
fix(api): wire DynamoDB service to endpoints
test(e2e): upload email → verify data in DB → see in UI
```

**feature/sample-emails** (1 hour)
```bash
chore(test): add 5 sample business emails (deal/task variations)
docs: demo script for stakeholders
```

### Acceptance Criteria
- ✅ Upload email file via UI
- ✅ Worker extracts tasks/deals with Ollama LLM
- ✅ Data persists to DynamoDB
- ✅ API returns data to UI
- ✅ Tasks/deals visible in inbox within 30s
- ✅ High-confidence items auto-approved, low-confidence as drafts

### Tag: v0.2-phase1-e2e

---

## Phase 2: Automation + Management View
**Duration:** 1.5-2 weeks
**Business Goal:** Run unattended 24/7, process 50-200 emails/day, give managers visibility
**Success Metrics:**
- 70%+ auto-approval rate
- <$100/month LLM costs
- Manager can see team performance in 30 seconds

### Business Value
- 🎯 Scale from manual to automated processing
- 🎯 Handle real inbox volume (100s of emails/day)
- 🎯 Management visibility and control
- 🎯 Cost control and budget enforcement

### Features

#### Automation (Week 1)

**feature/gmail-batch** (2-3 days)
```bash
feat(worker): OAuth Gmail integration with token refresh
feat(worker): batch polling of labeled threads (every 5 min)
feat(worker): dedupe by message-id hash
test(worker): poll limit and dedupe tests
docs: Gmail API setup guide
```

**feature/ui-actions** (2 days)
```bash
feat(api): POST /tasks/:id/accept, /tasks/:id/reject
feat(api): POST /deals/:id/accept, /deals/:id/reject
feat(ui): accept/reject buttons with optimistic update
test(api): action handler tests
```

**feature/cost-control** (1 day)
```bash
feat(worker): daily token budget limit (env configurable)
feat(worker): throttle guard (max 10 emails/min)
test(worker): stop-on-budget test
```

#### Management Dashboard (Week 2)

**feature/management-dashboard** (3-4 days)
```bash
feat(api): GET /admin/stats (team breakdown, quality metrics)
feat(api): GET /admin/activity (recent extractions with status)
feat(ui): Management page (/admin route)
feat(ui): Team performance table (user, accept rate, deals created)
feat(ui): Quality metrics cards (acceptance rate, processing time, cost)
feat(ui): Activity timeline (last 50 extractions)
feat(ui): Simple trend charts (tasks/deals over 7/30 days)
feat(api): CSV export endpoint (/admin/export)
test(api): stats endpoint tests
docs: management dashboard user guide
```

**Management Dashboard Features:**
- **Team Stats**: Breakdown by user (emails processed, tasks created, accept rate)
- **Quality Metrics**: Overall acceptance rate, false positive tracking, extraction accuracy
- **Cost Dashboard**: Daily/monthly spend, cost per deal, budget remaining
- **Activity Feed**: Last 50 extractions with status, confidence, user actions
- **Trends**: 7-day and 30-day charts for tasks, deals, acceptance rates
- **Export**: CSV download for offline analysis

#### Infrastructure

**feature/retry-dlq** (1-2 days)
```bash
feat(infra): SQS dead letter queue for failed processing
feat(worker): push failed runs to DLQ with context
docs: DLQ inspection and replay procedure
```

### Acceptance Criteria
- ✅ Gmail polling runs every 5 minutes automatically
- ✅ 50-200 emails/day processed without intervention
- ✅ Token budget enforced (<$100/month)
- ✅ Manager can view team stats in dashboard
- ✅ Accept/reject actions work from UI
- ✅ Failed emails go to DLQ for debugging

### Tag: v0.3-phase2-auto-mgmt

---

## Phase 3: Team Collaboration
**Duration:** 1.5-2 weeks
**Business Goal:** Scale from 1 user to sales team (5-10 people)
**Success Metrics:**
- 10x faster bulk operations (2 min vs 30 min)
- 90%+ person-linking accuracy
- Full audit trail on all items

### Business Value
- 🎯 Multi-user team collaboration
- 🎯 Bulk productivity (process 50 items in 2 minutes)
- 🎯 Contact intelligence (auto-link people/companies)
- 🎯 Trust via audit trail
- 🎯 Mistake recovery (undo)

### Features

**feature/bulk-ops** (2-3 days)
```bash
feat(api): POST /tasks/bulk-accept, /tasks/bulk-reject
feat(api): POST /deals/bulk-accept, /deals/bulk-reject
feat(ui): multi-select checkboxes in inbox
feat(ui): bulk action toolbar
test(api): bulk operation tests (50+ items)
```

**feature/linking** (3-4 days)
```bash
feat(worker): link Person by sender email (auto-create)
feat(worker): infer Company by email domain (@acme.com → Acme Inc)
feat(api): GET /people, GET /companies
feat(api): POST /link/person/:id, POST /link/company/:id
feat(ui): people/companies pages
feat(ui): unlinked items view (needs manual linking)
test(worker): linking accuracy tests
```

**feature/audit** (2 days)
```bash
feat(worker): write audit fields (agent, confidence, source message-id, snippet)
feat(api): include audit info in API responses
feat(ui): show audit panel (expandable card)
feat(ui): "View source email" link
```

**feature/undo** (1-2 days)
```bash
feat(api): POST /tasks/:id/undo (revert status)
feat(api): POST /deals/:id/undo (revert status)
feat(ui): undo button (5-minute window)
test(api): undo tests
```

**feature/dedupe-hints** (1-2 days)
```bash
feat(worker): detect duplicate people by email similarity
feat(ui): merge suggestions UI
docs: manual merge procedure
```

**feature/daily-summary** (Optional, 1 day)
```bash
feat(worker): daily digest email generation
feat(api): POST /admin/send-digest
docs: scheduling with cron
```

### Acceptance Criteria
- ✅ Bulk accept 50 tasks in <5 seconds
- ✅ People auto-linked to emails (90%+ accuracy)
- ✅ Companies inferred from domains
- ✅ Audit trail visible on every item
- ✅ Undo works within 5-minute window
- ✅ Duplicate person detection suggests merges

### Tag: v0.4-phase3-team

---

## Phase 4: Production Hardening
**Duration:** 1.5-2 weeks
**Business Goal:** Reliable enough to depend on daily without issues
**Success Metrics:**
- 99% uptime
- <2% duplicate rate
- Budget alerts working
- 95%+ extraction accuracy

### Business Value
- 🎯 Production-grade reliability
- 🎯 Zero data loss (idempotency)
- 🎯 Observable system (metrics/alerts)
- 🎯 Polished UX for daily use

### Features

**feature/mime-robust** (2-3 days)
```bash
feat(worker): robust MIME parsing (handle edge cases)
feat(worker): signature/footer stripping
feat(worker): size limits (max 500KB per email)
feat(worker): handle forwarded/replied emails
test(worker): 50+ edge case email fixtures
```

**feature/idempotency-strict** (2 days)
```bash
refactor(worker): idempotency across all nodes
test(worker): duplicate email handling (message-id + hash)
test(e2e): send same email 5 times → only 1 extraction
```

**feature/metrics** (2-3 days)
```bash
feat(worker): structured logging with metrics
feat(worker): emit metrics (prefilter_pass, local_pass, tokens, latency)
feat(infra): CloudWatch dashboard template
docs: metrics dashboard setup (CloudWatch/Grafana)
```

**feature/budget-alarms** (1-2 days)
```bash
feat(infra): CloudWatch alarms (token budget, error rate, latency)
feat(infra): SNS notifications for alerts
docs: responding to alerts runbook
```

**feature/ui-polish** (3-4 days)
```bash
feat(ui): keyboard shortcuts (j/k navigation, x select, a accept, r reject)
feat(ui): filters (status, owner, date range, confidence)
feat(ui): search (full-text across tasks/deals)
feat(ui): deals pipeline view (Kanban board)
feat(ui): dark mode
fix(ui): accessibility improvements
fix(ui): mobile responsive
```

**feature/prompt-tuning** (2 days)
```bash
feat(prompts): A/B test different extraction prompts
feat(worker): prompt versioning
test(worker): compare extraction accuracy across prompts
docs: prompt tuning guide
```

### Acceptance Criteria
- ✅ Handles 500+ emails/day without issues
- ✅ Duplicate rate <2%
- ✅ Processing time <10s average
- ✅ Budget alerts fire before limit
- ✅ Metrics dashboard shows real-time data
- ✅ UI polished with keyboard shortcuts
- ✅ 95%+ extraction accuracy validated
- ✅ Mobile responsive

### Tag: v0.5-phase4-pilot

---

## Phase 5: Scale & Intelligence (Future)
**Duration:** TBD
**Business Goal:** Scale to 50+ users, advanced AI features

### Potential Features
- CRM integration (Salesforce, HubSpot)
- Email sending (AI-generated replies)
- Calendar integration (auto-schedule follow-ups)
- Lead scoring and prioritization
- Advanced analytics (funnel conversion, win/loss)
- Mobile apps (iOS/Android)
- Multi-agent collaboration (specialized agents)
- Tool use (web search, calendar check, CRM lookup)
- Self-improving prompts (learning from corrections)
- Multi-language support

---

## Rollback Strategy

### Tags for Safe Checkpoints
Use tags at end of each phase:
```bash
git checkout v0.2-phase1-e2e    # Working demo
git checkout v0.3-phase2-auto-mgmt  # Automation + management
git checkout v0.4-phase3-team    # Team features
git checkout v0.5-phase4-pilot   # Production ready
```

### For Issues
```bash
# Prefer revert (keeps history)
git revert <bad_sha>

# For infra changes
# Roll back via IaC state (CloudFormation/Terraform)
# Keep versioned templates in infra/versions/
```

### Database Migrations
- Keep migrations additive during MVP
- Use schemaless DynamoDB fields for flexibility
- Never delete columns in production

---

## Success Metrics by Phase

| Phase | Time Saved | Deals Captured | Cost | Users |
|-------|------------|----------------|------|-------|
| Phase 1 | 30 min/day | Manual tracking | Free (local LLM) | 1 |
| Phase 2 | 2-3 hrs/day | 90%+ capture | <$100/month | 1-3 |
| Phase 3 | 3-4 hrs/day | 95%+ capture | <$200/month | 5-10 |
| Phase 4 | 4-5 hrs/day | 98%+ capture | <$300/month | 10-20 |

---

## Management Dashboard Overview

### Key Screens

**Dashboard Home** (`/admin`)
- Team overview cards
- Today's activity summary
- Quick stats (acceptance rate, cost, processing time)

**Team Performance** (`/admin/team`)
- Table: User | Emails | Tasks | Deals | Accept Rate | Last Active
- Individual user drill-down
- Leaderboard view

**Quality Metrics** (`/admin/quality`)
- Extraction accuracy trends
- False positive/negative tracking
- Confidence score distribution
- Error rate by email type

**Cost Management** (`/admin/costs`)
- Daily/weekly/monthly spend charts
- Cost per extraction
- Budget remaining (with forecast)
- Token usage breakdown

**Activity Feed** (`/admin/activity`)
- Real-time extraction log
- Filterable by user, status, confidence
- Link to source emails
- Audit trail for debugging

**System Health** (`/admin/health`)
- Processing SLA (95% under 60s)
- Error rates and types
- Queue depths
- Capacity metrics

---

## Current Priority: Complete Phase 1

**Immediate Next Steps (6-8 hours):**
1. Provision DynamoDB tables (2 hours)
2. Fix persistence layer (3-4 hours)
3. End-to-end testing with sample emails (1 hour)
4. Tag v0.2-phase1-e2e

**Then decide:** Demo to stakeholders, gather feedback, adjust Phase 2 scope.
