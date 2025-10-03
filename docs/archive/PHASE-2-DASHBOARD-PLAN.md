# Phase 2 - Dashboard Implementation Plan

**Branch:** feature/dashboard-metrics
**Duration:** Week 1 of Phase 2 (3-4 days)
**Goal:** Build Dashboard UI matching mockup screen 2

---

## Business Value

- Management visibility (key metrics at a glance)
- Quick identification of hot deals
- Today's task prioritization
- AI-powered insights for action

---

## Mockup Reference

**Screen 2:** Dashboard with:
1. Metric cards (Revenue, Active Deals, Conversion Rate, New Contacts)
2. Hot Deals widget (sorted by confidence + close date)
3. Today's Tasks widget (filtered by due date)
4. AI-Powered Insights panel

---

## Implementation Plan

### Day 1: Dashboard Page + Metric Cards (4-5 hours)

**Task 1.1: Create Dashboard Page** (1 hour)
```bash
# File: ui/src/pages/Dashboard.tsx
feat(ui): add dashboard page component
- Basic layout with grid
- Navigation integration
- Responsive design

# File: ui/src/App.tsx
feat(ui): add dashboard route
- Add /dashboard route
- Set as default home page
```

**Task 1.2: Build Metric Card Component** (1 hour)
```bash
# File: ui/src/components/MetricCard.tsx
feat(ui): add reusable metric card component
- Props: title, value, trend, subtitle
- Styled to match mockup
- Responsive sizing
```

**Task 1.3: Implement 4 Metric Cards** (2 hours)
```bash
# In Dashboard.tsx
feat(ui): add dashboard metric cards
1. Revenue card (total deal value)
2. Active Deals count
3. Conversion Rate (won deals / total)
4. New Contacts (this month)

- Connect to API endpoint
- Loading states
- Error handling
- Trend indicators (↗️ 22% from last month)
```

**Task 1.4: Enhance API Stats Endpoint** (1 hour)
```bash
# File: api/src/app.controller.ts
feat(api): enhance GET /stats/summary
- Add revenue calculation (sum of deal values)
- Add conversion rate (won / total deals)
- Add new contacts count (last 30 days)
- Add trend comparisons (vs last month)

test(api): stats endpoint tests
```

---

### Day 2: Hot Deals Widget (3-4 hours)

**Task 2.1: Build Hot Deals Component** (2 hours)
```bash
# File: ui/src/components/HotDeals.tsx
feat(ui): add hot deals widget
- List of top 3 deals by urgency
- Sort by: close date (soonest) + confidence (highest)
- Display: company, value, close date, confidence badge
- Color-coded confidence (90% green, 75% orange, 60% purple)
```

**Task 2.2: Add API Endpoint** (1 hour)
```bash
# File: api/src/app.controller.ts
feat(api): add GET /deals/hot endpoint
- Query deals with close_date soon (<7 days)
- Sort by confidence DESC, then close_date ASC
- Return top 5 deals
- Include company, value, stage, confidence

test(api): hot deals endpoint tests
```

**Task 2.3: Connect UI to API** (30 min)
```bash
feat(ui): connect hot deals to API
- Fetch from /deals/hot
- Display in dashboard
- Click to view deal details (future)
```

---

### Day 3: Today's Tasks Widget (2-3 hours)

**Task 3.1: Build Tasks Widget** (1.5 hours)
```bash
# File: ui/src/components/TodaysTasks.tsx
feat(ui): add today's tasks widget
- Filter tasks: due_date = today OR overdue
- Show 5 most recent
- Display: description, priority badge, checkbox
- Quick actions: complete, dismiss
```

**Task 3.2: Add API Endpoint** (1 hour)
```bash
# File: api/src/app.controller.ts
feat(api): add GET /tasks/today endpoint
- Filter by due_date <= today
- Sort by priority (high → medium → low), then due_date
- Return top 10 tasks
- Include id, description, priority, due_date, status

test(api): today's tasks endpoint
```

**Task 3.3: Quick Actions** (30 min)
```bash
feat(ui): add task quick actions
- Checkbox to mark complete
- X button to dismiss
- Optimistic UI updates
- Call PUT /tasks/:id/status
```

---

### Day 4: AI Insights Panel (2-3 hours)

**Task 4.1: Build Insights Component** (1 hour)
```bash
# File: ui/src/components/AIInsights.tsx
feat(ui): add AI insights widget
- 3 insight cards with color coding
- Icons for different insight types
- Light background colors (purple, orange, green)
- Clean typography matching mockup
```

**Task 4.2: Generate Basic Insights** (1.5 hours)
```bash
# File: worker/src/services/insights_generator.py (new)
feat(worker): add insight generation service
- Check deal inactivity (>4 days → recommend follow-up)
- Track email response times (>avg → high interest)
- Best contact times (placeholder for now)

# File: api/src/app.controller.ts
feat(api): add GET /insights endpoint
- Return top 3 insights
- Sort by priority/urgency
- Include type, message, context

test(worker): insight generation tests
```

**Task 4.3: Connect UI** (30 min)
```bash
feat(ui): connect insights to API
- Fetch from /insights
- Display in color-coded cards
- Auto-refresh every 5 minutes
```

---

## File Structure

```
ui/src/
├── pages/
│   └── Dashboard.tsx (NEW)
├── components/
│   ├── MetricCard.tsx (NEW)
│   ├── HotDeals.tsx (NEW)
│   ├── TodaysTasks.tsx (NEW)
│   └── AIInsights.tsx (NEW)
└── App.tsx (MODIFY - add route)

api/src/
└── app.controller.ts (MODIFY - add endpoints)
    - GET /stats/summary (enhance)
    - GET /deals/hot (new)
    - GET /tasks/today (new)
    - GET /insights (new)

worker/src/services/
└── insights_generator.py (NEW)
```

---

## API Contracts

### GET /stats/summary (Enhanced)
```typescript
{
  summary: {
    revenue: 847000,           // Sum of all deal values
    revenue_trend: "+22%",     // vs last month
    active_deals: 47,
    closing_this_week: 12,
    conversion_rate: 68,       // won / total * 100
    conversion_trend: "+5%",
    new_contacts: 234          // Last 30 days
  },
  generated_at: "2025-10-02T..."
}
```

### GET /deals/hot (New)
```typescript
[
  {
    id: "deal-123",
    company: "Acme Corp",
    title: "Enterprise",
    value: 125000,
    close_date: "2025-10-05",  // 3 days
    confidence: 90,
    stage: "negotiation"
  },
  // ... top 5
]
```

### GET /tasks/today (New)
```typescript
[
  {
    id: "task-456",
    description: "Follow up with Acme Corp - contract review",
    priority: "high",
    due_date: "2025-10-02",
    status: "pending",
    deal_id: "deal-123"  // optional link
  },
  // ... top 10
]
```

### GET /insights (New)
```typescript
[
  {
    id: "insight-789",
    type: "high_interest",  // or "inactive_deal", "best_time"
    message: "Acme Corp contact replied 3x faster than average - high interest detected",
    severity: "positive",   // or "warning", "info"
    deal_id: "deal-123",
    created_at: "2025-10-02T..."
  },
  // ... top 3
]
```

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Dashboard loads without errors
- [ ] All 4 metric cards display correctly
- [ ] Metrics show realistic data
- [ ] Hot deals sorted correctly
- [ ] Today's tasks filtered properly
- [ ] Task complete action works
- [ ] Insights display with correct colors
- [ ] Responsive design works (mobile/tablet)

### E2E Tests
- [ ] Dashboard renders with mock data
- [ ] API endpoints return correct structure
- [ ] UI updates on API data change
- [ ] Error states display properly

---

## Commit Strategy

**Small, focused commits every 2-3 hours:**

1. `feat(ui): add dashboard page with navigation`
2. `feat(ui): add metric card component`
3. `feat(ui): implement 4 dashboard metric cards`
4. `feat(api): enhance stats endpoint with revenue and conversion`
5. `feat(ui): add hot deals widget`
6. `feat(api): add hot deals endpoint`
7. `feat(ui): add today's tasks widget`
8. `feat(api): add today's tasks endpoint`
9. `feat(ui): add AI insights widget`
10. `feat(worker): add basic insight generation`
11. `feat(api): add insights endpoint`
12. `test(e2e): dashboard integration tests`
13. `docs: update dashboard user guide`

**Merge to main:** After all tasks complete + tested

---

## Success Criteria

✅ Dashboard matches mockup screen 2
✅ All 4 metric cards working
✅ Hot deals show top opportunities
✅ Today's tasks actionable
✅ AI insights provide value
✅ Responsive design
✅ <2s page load time
✅ No console errors

---

## Next Steps After Dashboard

1. **Week 2:** Gmail Integration UI (mockup screens 4, 5, 6)
2. **Week 3-4:** Pipeline Kanban + Contacts (mockup screens 1, 3)

---

**Ready to build! Let's ship the Dashboard! 🚀**
