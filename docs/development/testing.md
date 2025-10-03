# Phase 2 Dashboard Testing Guide

**Branch:** `feature/dashboard-metrics`
**Status:** ✅ Complete - Ready for Testing

---

## What's New in Phase 2

### Dashboard Features
1. **Navigation Bar** - Dashboard, AI Inbox, Upload Email tabs
2. **4 Metric Cards** - Revenue, Active Deals, Conversion Rate, New Contacts
3. **Hot Deals Widget** - Top 5 urgent deals closing soon
4. **Today's Tasks Widget** - Tasks due today/overdue with quick actions
5. **AI Insights Panel** - Smart recommendations based on sales data

---

## Testing Instructions

### Prerequisites
- DynamoDB Local running (port 8001)
- Worker service running (port 8000)
- API service running (port 3000)
- UI running (port 5173)

### Quick Start

```bash
# Terminal 1: Start all services
make demo

# Terminal 2: Open browser
open http://localhost:5173
```

---

## Test Cases

### 1. Navigation Testing
**Steps:**
1. Open http://localhost:5173
2. Click "Dashboard" tab (should be active by default)
3. Click "AI Inbox" tab
4. Click "Upload Email" tab
5. Return to "Dashboard"

**Expected:**
- Active tab highlighted in blue
- Smooth navigation without page refresh
- Content changes correctly

---

### 2. Metric Cards Testing
**What to verify:**
- ✅ Revenue Pipeline card (green, ₹ format)
- ✅ Active Deals card (blue, count)
- ✅ Conversion Rate card (purple, percentage)
- ✅ New Contacts card (orange, count)
- ✅ All cards display icons
- ✅ Trend indicators show (if data available)
- ✅ Cards refresh every 30 seconds

**Test with no data:**
```bash
# Stop DynamoDB and restart to clear data
docker stop smile-dynamodb
docker rm smile-dynamodb
docker run -d --name smile-dynamodb -p 8001:8000 amazon/dynamodb-local
node infra/create-local-tables.js
```

**Expected:**
- All metrics show 0
- No errors displayed
- Cards still render properly

---

### 3. Hot Deals Widget Testing
**What to verify:**
- ✅ Shows "No urgent deals" if no data
- ✅ Displays up to 5 deals
- ✅ Deals sorted by close date (soonest first)
- ✅ Currency formatted as ₹ Lakhs/Crores
- ✅ Confidence badges color-coded (green 90%+, orange 75%+, purple <75%)
- ✅ Stage badges displayed (negotiation, proposal, qualified)
- ✅ Days until close calculated (Today, Tomorrow, Xd, Overdue)
- ✅ Refreshes every 60 seconds

**Test data upload:**
```bash
# Upload sample deals
curl -X POST http://localhost:8000/ingestEmail \
  -F "file=@samples/deal-high-value.txt"
```

**Expected:**
- Deal appears in Hot Deals widget within 60 seconds
- Correct formatting and badges

---

### 4. Today's Tasks Widget Testing
**What to verify:**
- ✅ Shows "You're all caught up! 🎉" if no tasks
- ✅ Displays up to 10 tasks
- ✅ Tasks sorted by priority (high → medium → low)
- ✅ Priority badges color-coded (🔴 high, 🟡 medium, 🟢 low)
- ✅ Overdue tasks highlighted in red
- ✅ Days calculation correct (Xd overdue, Due today, Due in Xd)
- ✅ Checkbox to mark complete works
- ✅ Dismiss button works
- ✅ Refreshes every 60 seconds

**Test quick actions:**
1. Upload task email: `curl -X POST http://localhost:8000/ingestEmail -F "file=@samples/task-followup.txt"`
2. Click checkbox to complete task
3. Verify task disappears from list
4. Verify stats update

**Expected:**
- Task removed from Today's Tasks
- Total Tasks count decreases in metric card

---

### 5. AI Insights Panel Testing
**What to verify:**
- ✅ Shows "No insights available" if no data
- ✅ Displays up to 3 insights
- ✅ Color-coded by severity (green/orange/purple)
- ✅ Correct icons for insight types
- ✅ Deal linking badges show when applicable
- ✅ Refreshes every 5 minutes

**Insights generated:**
1. **Inactive Deal Warning** (orange) - Deals inactive 4+ days
2. **High-Value Urgency** (green) - Deals ₹1L+ closing <7 days
3. **Contact Timing** (purple) - Best time to contact recommendations

**Expected:**
- At least 1 insight shows (contact timing should always show if deals exist)
- Messages are clear and actionable
- Links to deals work (future enhancement)

---

### 6. Data Flow Testing
**End-to-End Test:**

```bash
# 1. Upload high-value deal
curl -X POST http://localhost:8000/ingestEmail \
  -F "file=@samples/deal-high-value.txt"

# 2. Wait 10-20 seconds for processing

# 3. Check Dashboard
open http://localhost:5173
```

**Expected Dashboard Updates:**
1. Revenue card increases (deal value added)
2. Active Deals count increases
3. Deal appears in Hot Deals widget
4. AI Insights shows high-value urgency (if close date <7 days)
5. New Contacts count increases

---

### 7. Error Handling Testing

**Test API Down:**
```bash
# Stop API service
# Refresh dashboard
```

**Expected:**
- "⚠️ API Connection Issue" warning shown
- No crashes
- Graceful degradation

**Test Empty States:**
- Dashboard with no data shows all 0s
- Widgets show empty state messages
- No console errors

---

### 8. Performance Testing
**What to verify:**
- ✅ Initial dashboard load <2s
- ✅ Navigation transitions smooth
- ✅ Auto-refresh doesn't cause UI flicker
- ✅ No memory leaks after 5+ minutes
- ✅ Multiple widgets load in parallel

**Monitor:**
```bash
# Open browser DevTools
# Check Network tab - all requests should be <500ms
# Check Console - no errors or warnings
```

---

### 9. Responsive Design Testing
**Breakpoints to test:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px+ (laptop)

**What to verify:**
- Metric cards stack vertically on mobile
- Widgets stack on tablet
- Navigation remains usable
- No horizontal scroll
- Text remains readable

---

## Known Issues / Limitations

1. **Port 3000 Conflict**: If Open WebUI is running, API won't start
   - **Solution**: Stop Open WebUI or change API port to 3001

2. **LLM Speed**: llama3.2 model too slow (90s+ processing)
   - **Solution**: Use qwen2.5-coder:7b model (configured in worker/.env.local)

3. **Trend Placeholders**: Revenue trend and conversion trend are hardcoded (+22%, +5%)
   - **Future**: Calculate actual trends from historical data

4. **Company Names**: Hot Deals shows "Unknown Company" instead of actual company
   - **Future**: Link to actual company records from People/Companies tables

---

## Success Criteria

✅ All navigation tabs work
✅ All 4 metric cards display correctly
✅ Hot Deals widget shows deals when available
✅ Today's Tasks widget shows tasks with quick actions
✅ AI Insights panel shows at least 1 insight
✅ Auto-refresh works for all widgets
✅ No console errors
✅ Page loads in <2 seconds
✅ Responsive design works on mobile/tablet/desktop

---

## Next Steps After Testing

If all tests pass:
1. Merge `feature/dashboard-metrics` → `main`
2. Tag `v0.3-phase2-dashboard`
3. Update README with Phase 2 completion status
4. Plan Phase 3: Gmail Integration + Pipeline Kanban

---

**Happy Testing! 🚀**
