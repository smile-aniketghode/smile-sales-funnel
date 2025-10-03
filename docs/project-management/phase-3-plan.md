# Phase 3: Pipeline Kanban + Contacts Management

**Duration:** 2-3 weeks
**Goal:** Build core CRM UI matching mockup screens 1 & 3

---

## Business Value

### For Sales Reps:
- Visual pipeline view for deal tracking
- Drag-and-drop deal stage updates
- Quick contact lookup and management
- Deal-to-contact linking

### For Managers:
- Pipeline health at a glance
- Deal stage distribution
- Contact database visibility
- Revenue forecasting by stage

---

## Mockup References

### Screen 1: Pipeline Kanban
- 6 stage columns: Lead → Contacted → Demo → Proposal → Negotiation → Closed Won
- Deal cards with: company, value, confidence%, last activity
- Drag-and-drop between stages
- Quick actions: view details, mark won/lost

### Screen 3: Contacts List
- Searchable table with filters
- Columns: Name, Company, Role, Status, Last Contact
- Pagination (20 per page)
- "Add Contact" button
- Link to related deals

---

## Phase 3 Breakdown

### Week 1: Pipeline Kanban View (5-6 days)

#### Day 1-2: Kanban Board Layout
- **File:** `ui/src/pages/Pipeline.tsx`
- 6-column responsive layout
- Stage headers with deal counts
- Empty state for each column
- Add to navigation

#### Day 3-4: Deal Cards & Drag-Drop
- **File:** `ui/src/components/DealKanbanCard.tsx`
- Deal card component (company, value, confidence, date)
- Integrate `@dnd-kit` or `react-beautiful-dnd`
- Drag between columns
- Optimistic UI updates

#### Day 5: API Integration
- **Endpoint:** `PUT /deals/:id/stage`
- Update deal stage on drop
- Real-time updates with React Query
- Error handling & rollback

#### Day 6: Polish
- Stage color coding
- Confidence badges (90%+ green, 75%+ orange, <75% purple)
- Deal count summaries
- Revenue totals per stage

---

### Week 2: Contacts Management (4-5 days)

#### Day 1-2: Contacts List Page
- **File:** `ui/src/pages/Contacts.tsx`
- Table with search bar
- Columns: Name, Email, Company, Role, Status, Last Contact
- Pagination (20 per page)
- Loading/empty states

#### Day 3: Contact Detail Modal
- **File:** `ui/src/components/ContactDetailModal.tsx`
- View/edit contact info
- Linked deals list
- Activity timeline (emails, tasks)
- "Add Note" button

#### Day 4: Add/Edit Contact
- **File:** `ui/src/components/ContactFormModal.tsx`
- Form: name, email, company, role, phone
- Company autocomplete (link to existing)
- Validation
- Create/update API calls

#### Day 5: Polish
- Status badges (Active, Lead, Customer, Inactive)
- Search by name/email/company
- Filter by status/company
- Export to CSV (bonus)

---

### Week 3: Integration & Enhancement (3-4 days)

#### Day 1: Link Deals to Contacts
- Add contact picker to Deal detail
- Show contact info on Deal card
- API: `PUT /deals/:id` with `contact_id`

#### Day 2: Contact Insights
- Last email date
- Response rate
- Deal count & total value
- Hot/cold contact indicators

#### Day 3: Advanced Filters
- Filter pipeline by contact
- Filter pipeline by date range
- Filter pipeline by value (>₹1L, >₹10L)
- Saved filter presets

#### Day 4: Polish & Testing
- Mobile responsive design
- Keyboard shortcuts (arrows to navigate)
- Empty states with CTAs
- E2E tests

---

## Technical Architecture

### New Components
```
ui/src/pages/
├── Pipeline.tsx          (Kanban board)
├── Contacts.tsx          (Contacts list)

ui/src/components/
├── DealKanbanCard.tsx    (Deal card for Kanban)
├── ContactDetailModal.tsx (Contact detail view)
├── ContactFormModal.tsx   (Add/edit contact)
├── StageColumn.tsx        (Kanban column)
└── ContactSearchBar.tsx   (Search with autocomplete)
```

### New API Endpoints
```typescript
// Deal stage updates
PUT /deals/:id/stage
Body: { stage: 'proposal' }

// Contacts CRUD
GET /contacts?search=&status=&page=1&limit=20
GET /contacts/:id
POST /contacts
PUT /contacts/:id
DELETE /contacts/:id

// Contact-Deal linking
GET /contacts/:id/deals
PUT /deals/:id/contact
```

### New DynamoDB Methods
```typescript
// api/src/services/dynamodb.service.ts
async updateDealStage(dealId: string, newStage: DealStage)
async getContacts(filters: ContactFilters, pagination: Pagination)
async getContactById(id: string)
async createContact(data: CreateContactDto)
async updateContact(id: string, data: UpdateContactDto)
async getContactDeals(contactId: string)
```

---

## Dependencies

### UI Libraries
```bash
# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable

# Or alternative:
npm install react-beautiful-dnd

# Table & Pagination
# (Already have Tailwind, no extra needed)
```

---

## Data Flow

### Kanban Board
1. User drags deal from "Demo" to "Proposal"
2. UI optimistically updates position
3. API call: `PUT /deals/:dealId/stage { stage: 'proposal' }`
4. On success: React Query invalidates & refetches
5. On error: Rollback to original position

### Contact Management
1. User searches "acme"
2. Debounced API call: `GET /contacts?search=acme`
3. Table updates with results
4. User clicks contact → Modal opens with details
5. Load linked deals: `GET /contacts/:id/deals`

---

## Success Criteria

### Pipeline Kanban
✅ 6 stage columns displayed
✅ Deals load in correct stages
✅ Drag & drop works smoothly
✅ Stage updates persist to DynamoDB
✅ Deal counts show per column
✅ Revenue totals per stage
✅ Mobile responsive (stacked view)

### Contacts
✅ All contacts display in table
✅ Search works (name, email, company)
✅ Add new contact works
✅ Edit contact works
✅ Contact detail modal shows deals
✅ Pagination works (20 per page)
✅ Status filtering works

### Integration
✅ Deals link to contacts
✅ Contact info shows on deal cards
✅ Filter pipeline by contact
✅ No performance issues with 100+ deals

---

## Testing Strategy

### Manual Testing
- Create 20+ test deals across all stages
- Test drag & drop edge cases
- Test search with various queries
- Test mobile responsive views

### E2E Tests (Playwright)
```typescript
test('drag deal from Demo to Proposal', async ({ page }) => {
  // ... drag & drop test
});

test('search contacts by name', async ({ page }) => {
  // ... search test
});
```

---

## Commits Strategy

**Small, focused commits every 2-3 hours:**

1. `feat(ui): add pipeline kanban page with 6-column layout`
2. `feat(ui): add deal kanban card component`
3. `feat(ui): implement drag & drop with @dnd-kit`
4. `feat(api): add PUT /deals/:id/stage endpoint`
5. `feat(ui): connect kanban to API with optimistic updates`
6. `feat(ui): add stage summaries and revenue totals`
7. `feat(ui): add contacts list page with search`
8. `feat(ui): add contact detail modal`
9. `feat(ui): add contact form for create/edit`
10. `feat(api): add contacts CRUD endpoints`
11. `feat(ui): link deals to contacts`
12. `feat(ui): add contact insights and filters`
13. `test(e2e): add pipeline kanban tests`
14. `docs: update Phase 3 completion summary`

---

## Mockup Alignment

| Mockup Feature (Screen 1) | Implementation |
|---------------------------|----------------|
| 6-stage pipeline | ✅ Lead, Contacted, Demo, Proposal, Negotiation, Closed Won |
| Deal cards | ✅ Company, value, confidence, last activity |
| Drag & drop | ✅ @dnd-kit with optimistic updates |
| Deal counts | ✅ Per column header |
| Quick actions | ✅ View details, mark won/lost |

| Mockup Feature (Screen 3) | Implementation |
|---------------------------|----------------|
| Contacts table | ✅ Name, Company, Role, Status, Last Contact |
| Search | ✅ Debounced search by name/email/company |
| Add contact | ✅ Form modal |
| Status badges | ✅ Active, Lead, Customer, Inactive |
| Pagination | ✅ 20 per page |
| Linked deals | ✅ Show in detail modal |

---

## Risks & Mitigation

### Risk 1: Drag & Drop Performance
**Mitigation:** Use virtualization for 100+ deals, lazy load cards

### Risk 2: DynamoDB Query Performance
**Mitigation:** Add GSI on `stage-created_at` for fast stage queries

### Risk 3: Contact-Deal Linking Complexity
**Mitigation:** Start simple - one contact per deal, expand later

---

## Next Steps After Phase 3

### Phase 4: Gmail Integration UI (2 weeks)
- OAuth connection flow
- Sync settings
- Label configuration
- Email preview

### Phase 5: Advanced Features (2-3 weeks)
- Email tracking (opens, replies)
- Auto-follow-up reminders
- Deal probability AI
- Revenue forecasting

---

## Branch Strategy

```bash
# Start Phase 3
git checkout -b feature/pipeline-kanban

# Later
git checkout -b feature/contacts-management

# Merge both to main when done
```

---

**Ready to build the core CRM experience! 🚀**

**Estimated Completion:** 2-3 weeks
**Deliverable:** Fully functional Pipeline + Contacts matching mockups
