# SMILe Sales Funnel - Demo Readiness Plan

## Current Status (October 2, 2025)

### ✅ What's Working (Phase 1-2 Complete)
1. **OpenRouter AI Extraction** - 10x faster (2.7s vs 20-90s)
   - Mistral Small 3.2 24B integration
   - 90%+ confidence extraction
   - Real-time processing

2. **Pipeline Kanban** - Drag & drop working
   - 6 stages: Lead → Contacted → Demo → Proposal → Negotiation → Closed Won
   - Hybrid AI+manual approach
   - Visual feedback, optimistic updates

3. **Dashboard** - Metrics & widgets
   - 4 metric cards (Revenue, Active Deals, Conversion, Contacts)
   - Hot Deals widget
   - Today's Tasks widget
   - AI Insights panel

4. **Infrastructure**
   - Local DynamoDB for development
   - NestJS API (port 3001)
   - React + Vite UI (port 5173)
   - FastAPI Worker (port 8000)

---

## Mockup Alignment Status

### Screen 1: Pipeline View ✅ 90% Complete
**What's Done:**
- 6-column kanban layout
- Deal cards with value, contact, confidence
- Drag & drop between stages
- Stage totals

**Missing:**
- Contact avatars/initials
- "Demo tomorrow" badges
- "Last contact" timestamps
- Polish: rounded cards, better colors

**Time to Complete:** 2-3 days

---

### Screen 2: Dashboard View ✅ 85% Complete
**What's Done:**
- 4 metric cards
- Hot Deals list
- Today's Tasks list
- AI Insights panel

**Missing:**
- Trend arrows (↑22% from last month)
- Better visual design (rounded cards, shadows)
- Checkbox interactions for tasks
- "Due today" badges

**Time to Complete:** 2-3 days

---

### Screen 3: Contacts View ❌ 0% Complete
**Missing:**
- Contacts table with search/filters
- Avatar generation
- Status badges (Active, Prospect, Lead)
- Last Activity tracking
- Deal Value column
- Bulk actions

**Time to Complete:** 4-5 days

---

### Screens 4-6: Gmail Integration UI ❌ Not Started
These appear to be Gmail OAuth and sync settings screens.

**Missing:**
- Gmail OAuth flow UI
- "Connect Gmail" button
- Sync status indicator
- Label selection UI
- Settings page

**Time to Complete:** 3-4 days (UI only)

---

## Gmail Integration Backend Status

### ❌ Not Started (Critical for Demo)
**What's Needed:**
1. Gmail API OAuth setup
2. Token storage and refresh
3. Gmail polling service
4. Label-based filtering
5. Incremental sync (last sync timestamp)

**Time to Complete:** 5-7 days

---

## Critical Bugs to Fix

### 🐛 From Testing (Priority 1)
1. **INR currency not supported** - Add to enum (15 min)
2. **Float → Decimal for DynamoDB** - Type conversion (30 min)
3. **LLM returns string values** - Improve prompt (1 hour)

**Total Fix Time:** 2-3 hours

---

## Demo Timeline Options

### Option 1: Quick Demo (3-4 Days)
**Scope:** Fix bugs + polish existing UI
- ✅ Fix 3 critical bugs
- ✅ Polish Pipeline & Dashboard to match mockups
- ✅ Manual email upload (no Gmail integration)
- ✅ Demo with 5-10 sample emails

**Demo Ready By:** October 6, 2025
**Limitations:** No real Gmail, manual upload only

---

### Option 2: Contacts + Polish Demo (1 Week)
**Scope:** Add Contacts page + fix bugs
- ✅ Everything from Option 1
- ✅ Build Contacts table view (Screen 3)
- ✅ Avatar generation
- ✅ Search & filters

**Demo Ready By:** October 9, 2025
**Limitations:** No Gmail integration yet

---

### Option 3: Full Gmail Integration Demo (2 Weeks)
**Scope:** Complete Phase 3 with Gmail
- ✅ Everything from Option 2
- ✅ Gmail OAuth flow
- ✅ Automated email polling
- ✅ Label-based filtering
- ✅ Gmail integration UI (Screens 4-6)

**Demo Ready By:** October 16, 2025
**Features:** Fully automated, production-ready demo

---

### Option 4: MVP Pilot Launch (3-4 Weeks)
**Scope:** Production deployment + testing
- ✅ Everything from Option 3
- ✅ Deploy to AWS (DynamoDB, Lambda, S3)
- ✅ Domain + HTTPS
- ✅ User authentication
- ✅ Error monitoring
- ✅ Cost tracking

**Pilot Ready By:** October 30, 2025
**Features:** Production-ready pilot with 5-10 users

---

## Recommendation: Option 2 (1 Week)

**Target Demo Date:** October 9, 2025

**Why This Option:**
1. **Shows real value** - Pipeline + Contacts are core features
2. **Fast to deliver** - 1 week is achievable
3. **Impressive** - AI extraction with polished UI
4. **Proof of concept** - Validates approach before Gmail integration
5. **No blockers** - Manual upload is fine for demo

**Demo Script:**
1. Upload 5 sample emails (deal-high-value.txt, etc.)
2. Show AI extraction in ~3 seconds each
3. Navigate to Pipeline - show deals auto-organized by stage
4. Drag a deal from Demo → Proposal
5. Show Dashboard metrics updating
6. Navigate to Contacts - show auto-linked people/companies
7. Show AI Insights recommendations

**After Demo:**
- Phase 4: Gmail integration (1 week)
- Phase 5: AWS deployment (1 week)
- Phase 6: Pilot with 5 users (1 week)

---

## Current Branch Status

**feature/pipeline-kanban:** 4 commits ahead of main
- Pipeline kanban with drag & drop
- OpenRouter integration
- E2E test script
- Bugs documented

**Recommended:** Merge to main, create Phase 3 branch for Contacts

---

## Next Immediate Steps (Today)

1. ✅ Fix 3 critical bugs (2-3 hours)
2. ✅ Merge pipeline-kanban to main
3. ✅ Tag v0.3-phase3-pipeline
4. ✅ Start Contacts page (4-5 days)
5. ✅ Polish UI to match mockups (2-3 days)

**Demo on October 9, 2025** ✨
