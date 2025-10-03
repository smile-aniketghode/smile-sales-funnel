# SMILe Sales Funnel - Development Plan v3 (UPDATED)

**Last Updated:** October 2, 2025
**Current Phase:** Phase 1 → Phase 2 Transition
**Progress:** Phase 1: 90% Complete

---

## Recent Progress (Oct 2, 2025)

### ✅ Completed Today
1. **Local-first architecture** - DynamoDB Local + full stack working
2. **All services running** - Worker, UI, DynamoDB tested
3. **Bug fixes** - python-multipart dependency added
4. **Documentation** - 7 comprehensive guides created
5. **Mockup analysis** - UI designs align 95% with data models
6. **Testing** - Identified LLM speed issue (llama3.2 too slow)

### 📊 Git Progress
- **4 commits** made today
- **39 files** created/modified
- **20,776 lines** added
- **Tag ready:** v0.2-phase1-e2e (pending LLM fix)

---

## Phase 0: Repo Skeleton ✅ COMPLETE
**Duration:** 0.5 day
**Tag:** v0.1-phase0-ready
**Status:** ✅ Done

---

## Phase 1: Local Demo ✅ 90% COMPLETE
**Duration:** 5 days
**Tag:** v0.2-phase1-e2e (ready to tag)
**Status:** 🟡 Working - needs LLM speed fix

### What We Built
✅ Complete local-first architecture
✅ DynamoDB Local (Docker) with 5 tables
✅ Worker (FastAPI + LangGraph + Ollama)
✅ UI (React + Vite)
✅ Email upload and processing
✅ Task/Deal extraction with confidence gating
✅ 5 sample business emails
✅ Comprehensive documentation (7 guides)
✅ Automated scripts (start-local.sh, Makefile)

### Known Issues
⚠️ **LLM Speed:** llama3.2 takes 90+ seconds (need qwen2.5-coder)
⚠️ **Port Conflict:** Port 3000 used by Open WebUI
✅ **Dependencies:** python-multipart fixed

### Business Value Delivered
- 🎯 Proof: AI can extract tasks/deals from emails
- 🎯 Zero cloud costs during development
- 🎯 Fast iteration (everything local)
- 🎯 Demo-ready (with faster model)

### Files Created (39 total)
**Scripts:** start-local.sh, stop-local.sh, test-local.sh, Makefile
**Docs:** QUICKSTART.md, READY-TO-RUN.md, LOCAL-DEMO-README.md, LOCAL-FIRST-PLAN.md, PHASE-1-SUMMARY.md, TEST-RESULTS.md, MOCKUP-ALIGNMENT.md
**Config:** .env.local files, .env.example
**Samples:** 5 business emails
**Infra:** create-local-tables.js

### Next Action
1. Switch to qwen2.5-coder model (1 hour)
2. Test with 5 sample emails (1 hour)
3. Tag v0.2-phase1-e2e
4. Move to Phase 2

---

## Phase 2: Dashboard + Gmail Integration (NEXT - Based on Mockups)
**Duration:** 2 weeks
**Tag:** v0.3-phase2-dashboard
**Business Goal:** Professional UI + automated Gmail sync
**Success Metrics:**
- Dashboard with key metrics visible
- Gmail auto-sync every 5 minutes
- 70%+ auto-approval rate
- <$100/month LLM costs

### Business Value
- 🎯 Management visibility (dashboard metrics)
- 🎯 Automation (Gmail polling)
- 🎯 Professional UX matching mockups
- 🎯 Team-ready (multiple users)

### Week 1: Dashboard UI (Mockup Screen 2)

**feature/dashboard-metrics** (3 days)
```bash
# Metric cards
feat(ui): add dashboard page with metric cards
- Revenue card (total deal value)
- Active deals count
- Conversion rate calculation
- New contacts this month

# Hot deals widget
feat(ui): add hot deals list component
- Sort by close date + confidence
- Show deal value, stage, confidence badge
- Quick actions (view, edit)

# Today's tasks widget
feat(ui): add today's tasks component
- Filter tasks by due date
- Priority badges (high/medium/low)
- Quick complete/dismiss actions

# Connect to existing API
feat(api): enhance GET /stats/summary endpoint
- Add conversion rate calculation
- Add revenue totals by stage
- Add new contacts count

test(e2e): dashboard metrics E2E test
docs: dashboard user guide
```

**feature/ai-insights-basic** (2 days)
```bash
# AI insights panel (Mockup Screen 2)
feat(ui): add AI insights widget
- "Deal inactive X days - recommend follow-up"
- "Contact replied faster than average"
- Basic template-based insights

feat(worker): add insight generation logic
- Check deal inactivity (>4 days)
- Track email response times
- Generate insight records

feat(api): GET /insights endpoint
docs: AI insights documentation
```

### Week 2: Gmail Integration (Mockup Screens 4, 5, 6)

**feature/gmail-oauth** (2 days)
```bash
# OAuth flow
feat(api): add Gmail OAuth endpoints
- /auth/gmail/authorize
- /auth/gmail/callback
- Token storage in DynamoDB

feat(ui): add Gmail connection modal (Mockup Screen 5)
- "Connect Gmail" button
- OAuth consent flow
- Connection status display

docs: Gmail OAuth setup guide
test(api): OAuth flow tests
```

**feature/gmail-polling** (2 days)
```bash
# Automated polling
feat(worker): add Gmail polling service
- Poll every 5 minutes
- Label filtering (INBOX, Prospects, Leads)
- Batch processing (50 emails max)
- Dedupe by message-id

feat(worker): add background scheduler
- Cron-like scheduling
- Per-user polling queues
- Error handling + retry

test(worker): polling tests with mocked Gmail API
docs: Gmail sync configuration guide
```

**feature/gmail-settings-ui** (2 days)
```bash
# Settings panel (Mockup Screens 5, 6)
feat(ui): add Gmail settings modal
- Sync frequency dropdown
- Auto-create contacts toggle
- Email labels multi-select
- AI enhancement toggle
- Track email opens toggle

feat(api): POST /settings/gmail endpoint
feat(ui): integrations panel in nav (Mockup Screen 4)
- Connected services list
- Gmail status (Active/Inactive)
- Last sync time
- Configure button

docs: Gmail integration user guide
```

**feature/cost-control** (1 day)
```bash
feat(worker): add daily token budget
feat(worker): add cost tracking
feat(api): GET /admin/costs endpoint
test(worker): budget limit tests
```

### Acceptance Criteria
- ✅ Dashboard shows live metrics
- ✅ Hot deals and tasks visible
- ✅ Gmail OAuth connection works
- ✅ Automatic polling every 5 minutes
- ✅ Settings UI matches mockup screens
- ✅ Token budget enforced

### Tag: v0.3-phase2-dashboard

---

## Phase 3: Pipeline + Contacts (Mockup Screens 1, 3)
**Duration:** 2 weeks
**Tag:** v0.4-phase3-pipeline
**Business Goal:** Complete CRM experience
**Success Metrics:**
- Drag-and-drop pipeline working
- 500+ contacts manageable
- Bulk operations <5 seconds
- 90%+ linking accuracy

### Week 1: Pipeline Kanban (Mockup Screen 1)

**feature/pipeline-kanban** (3-4 days)
```bash
# Kanban board
feat(ui): add pipeline page with drag-drop columns
- Stages: Lead, Contacted, Demo, Proposal, Negotiation, Closed Won
- Deal cards with value, company, confidence
- Drag-and-drop between stages
- Stage totals at column top

feat(ui): deal card component
- Deal value display (₹ formatted)
- Company name + contact initials
- Confidence badge (90%, 75%, 60%)
- Last activity timestamp
- Quick actions menu

feat(api): PUT /deals/:id/stage endpoint
feat(ui): deal detail modal
- Full deal information
- Edit deal fields
- Mark as won/lost
- Activity timeline

test(e2e): drag-drop pipeline tests
docs: pipeline user guide
```

**feature/deal-actions** (1-2 days)
```bash
feat(ui): bulk deal operations
feat(ui): deal filters (stage, value, confidence)
feat(ui): deal search
feat(api): bulk deal update endpoints
```

### Week 2: Contacts Management (Mockup Screen 3)

**feature/contacts-list** (2-3 days)
```bash
# Contacts table
feat(ui): add contacts page with data table
- Columns: Contact, Company, Role, Status, Last Activity, Deal Value
- Search bar
- Segment filter dropdown
- Status filter dropdown
- Pagination (50 per page)

feat(ui): contact avatar with initials
feat(ui): status badges (Active/Prospect/Lead)
feat(ui): edit contact modal

feat(api): GET /contacts endpoint with filters
feat(api): POST /contacts (add contact manually)
docs: contacts management guide
```

**feature/contact-linking** (2 days)
```bash
# Auto-linking (already partially done)
feat(worker): enhance person linking from emails
feat(worker): company inference by domain
feat(api): GET /people/unlinked endpoint
feat(ui): unlinked items view
feat(ui): manual link UI

test(worker): linking accuracy tests
```

**feature/bulk-operations** (1-2 days)
```bash
feat(ui): multi-select contacts
feat(ui): bulk actions (delete, change status, export)
feat(api): bulk contact operations
test(api): bulk operations performance tests
```

### Acceptance Criteria
- ✅ Pipeline Kanban matches mockup
- ✅ Drag-drop working smoothly
- ✅ Contacts list with search/filter
- ✅ Auto-linking 90%+ accurate
- ✅ Bulk operations fast (<5s)

### Tag: v0.4-phase3-pipeline

---

## Phase 4: Production Hardening
**Duration:** 1.5-2 weeks
**Tag:** v0.5-phase4-pilot
**Business Goal:** Pilot-ready with 10-20 users

### Features (High-Level)
- Robust MIME parsing
- Email signature stripping
- Advanced AI insights (behavioral analysis)
- Full audit trail
- Undo functionality
- Metrics dashboard (CloudWatch)
- Budget alarms
- UI polish (dark mode, keyboard shortcuts)
- Mobile responsive
- Performance optimization

**Detailed breakdown TBD after Phase 3**

---

## Current Checkpoint: Phase 1 → Phase 2

### Immediate Actions (Next 2 Hours)
1. ✅ Commit updated plan (this file)
2. 🔄 Fix LLM speed (switch to qwen2.5-coder)
3. 🔄 Test with sample emails
4. 🔄 Tag v0.2-phase1-e2e
5. ✅ Commit mockup analysis
6. ✅ Document progress

### Decision Point
**Should we:**
- **Option A:** Fix LLM speed, tag Phase 1, move to Phase 2 Dashboard
- **Option B:** Start Phase 2 now (Dashboard UI) while LLM is slow
- **Option C:** Demo Phase 1 as-is to stakeholders first

**Recommendation:** Option A - Complete Phase 1 properly, then Phase 2

---

## Timeline Summary

| Phase | Duration | Status | Tag |
|-------|----------|--------|-----|
| Phase 0 | 0.5 day | ✅ Done | v0.1-phase0-ready |
| Phase 1 | 5 days | 🟡 90% | v0.2-phase1-e2e (pending) |
| Phase 2 | 2 weeks | ⏳ Next | v0.3-phase2-dashboard |
| Phase 3 | 2 weeks | 📅 Planned | v0.4-phase3-pipeline |
| Phase 4 | 2 weeks | 📅 Planned | v0.5-phase4-pilot |

**Total to Pilot:** 6-7 weeks from start
**Current Progress:** Week 1 complete, starting Week 2

---

## Key Architectural Decisions

### Local-First Development ✅
- DynamoDB Local (not AWS) for Phase 1-3
- Ollama (local LLM) for development
- Zero cloud costs until deployment
- Identical API for easy AWS migration

### Mockup-Driven UI ✅
- 6 mockup screens analyzed
- 95% data model alignment
- Phase 2-3 UI = implement mockups
- No architectural changes needed

### Incremental Delivery ✅
- Small commits every 2-4 hours
- Tag checkpoints after each phase
- Feature branches for isolation
- Easy rollback at any point

---

## Success Metrics (Updated)

### Phase 1 (Current)
- ✅ Services running: 100%
- ✅ Data models: 100%
- 🟡 LLM extraction: 60% (works but slow)
- ✅ Documentation: 100%
- **Overall: 90%**

### Phase 2 (Target)
- Dashboard metrics visible
- Gmail auto-sync working
- 70%+ auto-approval rate
- Professional UI matching mockups

### Phase 3 (Target)
- Pipeline Kanban functional
- 500+ contacts manageable
- Bulk ops <5 seconds
- Full CRM experience

### Phase 4 (Target)
- 99% uptime
- <2% duplicate rate
- Budget alerts working
- Pilot with 10-20 users

---

**Next commit:** Small checkpoint documenting current progress
**Next tag:** v0.2-phase1-e2e (after LLM fix)
**Next phase:** Phase 2 Dashboard (2 weeks)
