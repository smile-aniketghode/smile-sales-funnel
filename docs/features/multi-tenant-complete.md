# Complete Multi-Tenant Implementation - Final 25%

## Quick Summary

**Current:** 75% complete - Worker layer done, API+UI pending
**Remaining:** ~2 hours of focused work
**Goal:** 100% production-ready multi-user isolation

## Critical Issue

The existing DynamoDB service uses **Scan** operations which don't support FilterExpression with user_id efficiently. We need a **user_id GSI (Global Secondary Index)** for proper filtering.

## Solution: Two Approaches

### Approach A: Simple (30 min) - Filter in Application Layer
- Keep current Scan
- Filter results by user_id in TypeScript after fetching
- **Pro:** Quick, no schema changes
- **Con:** Not scalable (fetches all data then filters)

### Approach B: Proper (2 hours) - Add GSI
- Create user_id GSI on all tables
- Use Query instead of Scan
- **Pro:** Scalable, production-ready
- **Con:** Requires DynamoDB schema update

## Recommendation: Approach A for MVP, Approach B for Production

Let's implement Approach A now to get to 100% quickly, then upgrade to Approach B later.

---

## Implementation Steps (Approach A)

### 1. Update NestJS DynamoDB Service (30 min)

**File:** `api/src/services/dynamodb.service.ts`

Add user_id parameter and filter results:

```typescript
async getTasks(userId: string, status?: TaskStatus, limit: number = 50, lastKey?: any) {
  // ... existing scan code ...

  const response = await this.docClient.send(command);

  // Filter by user_id in application layer
  const filteredItems = (response.Items || []).filter(item => item.user_id === userId);

  return {
    items: filteredItems.slice(0, limit) as Task[],
    count: filteredItems.length
  };
}

// Apply same pattern to:
// - getDeals(userId, ...)
// - getTodaysTasks(userId)
// - getHotDeals(userId)
// - getTaskById(userId, id) - verify ownership
// - getDealById(userId, id) - verify ownership
```

### 2. Update NestJS API Controllers (15 min)

**File:** `api/src/app.controller.ts`

Add user_id query parameter to all endpoints:

```typescript
@Get('tasks')
async getTasks(
  @Query('user_id') userId: string,
  @Query('status') status?: TaskStatus,
  @Query('limit') limit?: string
) {
  if (!userId) {
    throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
  }

  const result = await this.dynamoDbService.getTasks(userId, status, parseInt(limit) || 50);
  return { ...result, status: 'success' };
}

// Apply to ALL endpoints:
// /tasks, /tasks/today, /tasks/:id
// /deals, /deals/hot, /deals/:id
// /contacts, /stats/summary, /insights
```

### 3. Add UI Session Management (30 min)

**File:** `ui/src/services/api.ts`

Add request interceptor:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Get current user from localStorage
const getCurrentUser = (): string | null => {
  return localStorage.getItem('user_id');
};

// Add user_id to all requests
apiClient.interceptors.request.use((config) => {
  const userId = getCurrentUser();

  if (userId) {
    config.params = { ...config.params, user_id: userId };
  }

  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
  return config;
});

// ... rest of existing code
```

**File:** `ui/src/pages/Settings.tsx`

Store user_id after OAuth:

```typescript
// After fetching gmail status, store user_id
useEffect(() => {
  if (gmailStatus?.connected && gmailStatus?.email) {
    localStorage.setItem('user_id', gmailStatus.email);
    localStorage.setItem('user_email', gmailStatus.email);
  }
}, [gmailStatus]);
```

**File:** `ui/src/App.tsx`

Add auth guard:

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');

    // If no user_id and not on settings page, redirect to settings
    if (!userId && location.pathname !== '/settings') {
      navigate('/settings');
    }
  }, [location, navigate]);

  // ... rest of app
}
```

### 4. Test Multi-User Isolation (30 min)

#### Test Plan:

```bash
# 1. Clear existing data
cd infra
node delete-local-tables.js
node create-local-tables.js

# 2. Start all services
# Terminal 1: DynamoDB Local (should already be running on :8001)
# Terminal 2: Worker (should already be running on :8000)
# Terminal 3: NestJS API (should already be running on :3001)
# Terminal 4: UI (should already be running on :5173)

# 3. Test User 1
# - Open browser, go to localhost:5173/settings
# - Connect Gmail account 1 (e.g., aniket.ghode@shreemaruti.com)
# - Send test email to that account
# - Click "Sync Now"
# - Go to Dashboard - verify tasks appear
# - Check localStorage: should have user_id=aniket.ghode@shreemaruti.com

# 4. Test User 2 (separate browser/incognito)
# - Open incognito window, go to localhost:5173/settings
# - Connect different Gmail account (e.g., contact@cognitoapps.in)
# - Send test email to that account
# - Click "Sync Now"
# - Go to Dashboard - verify tasks appear
# - Should NOT see User 1's tasks

# 5. Verify Isolation
# - User 1 should only see their own tasks
# - User 2 should only see their own tasks
# - Check DynamoDB - all records should have user_id field
```

#### Verification Queries:

```bash
# Check tasks for user 1
aws dynamodb scan \
  --table-name smile-sales-funnel-dev-tasks \
  --endpoint-url http://localhost:8001 \
  --region local \
  --filter-expression "user_id = :uid" \
  --expression-attribute-values '{":uid":{"S":"aniket.ghode@shreemaruti.com"}}'

# Check tasks for user 2
aws dynamodb scan \
  --table-name smile-sales-funnel-dev-tasks \
  --endpoint-url http://localhost:8001 \
  --region local \
  --filter-expression "user_id = :uid" \
  --expression-attribute-values '{":uid":{"S":"contact@cognitoapps.in"}}'
```

---

## Migration Script for Existing Data

If you want to keep existing data, assign it to a user:

```bash
#!/bin/bash
# migrate-data-to-user.sh

USER_ID="aniketghode@gmail.com"
ENDPOINT="http://localhost:8001"
REGION="local"

for TABLE in tasks deals people companies email-logs; do
  echo "Migrating $TABLE..."

  aws dynamodb scan \
    --table-name "smile-sales-funnel-dev-$TABLE" \
    --endpoint-url $ENDPOINT \
    --region $REGION | \
  jq -r '.Items[].id.S' | \
  while read id; do
    aws dynamodb update-item \
      --table-name "smile-sales-funnel-dev-$TABLE" \
      --endpoint-url $ENDPOINT \
      --region $REGION \
      --key "{\"id\": {\"S\": \"$id\"}}" \
      --update-expression "SET user_id = :uid" \
      --expression-attribute-values "{\":uid\": {\"S\": \"$USER_ID\"}}"
  done
done

echo "Migration complete!"
```

---

## Files to Update

### API Layer:
- [ ] `api/src/services/dynamodb.service.ts` - Add userId filtering
- [ ] `api/src/app.controller.ts` - Add userId parameters

### UI Layer:
- [ ] `ui/src/services/api.ts` - Add request interceptor
- [ ] `ui/src/pages/Settings.tsx` - Store user_id after OAuth
- [ ] `ui/src/App.tsx` - Add auth guard

### Testing:
- [ ] Test with 2 different Gmail accounts
- [ ] Verify data isolation
- [ ] Verify API returns filtered results

---

## Expected Timeline

- API Service: 30 min
- API Controllers: 15 min
- UI Interceptor: 15 min
- UI Auth: 15 min
- Testing: 30 min
- **Total: ~2 hours**

---

## Success Criteria

✅ User 1 sees ONLY their own tasks/deals
✅ User 2 sees ONLY their own tasks/deals
✅ All new records have user_id field
✅ API rejects requests without user_id
✅ UI automatically adds user_id to all requests
✅ System is production-ready

---

## Future Improvements (Post-MVP)

1. Add user_id GSI to all DynamoDB tables
2. Replace Scan with Query for better performance
3. Add proper authentication (Cognito/Auth0)
4. Add user management UI
5. Add team/organization support
6. Add role-based access control (RBAC)
