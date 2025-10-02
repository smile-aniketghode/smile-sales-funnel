# Multi-Tenant Architecture Implementation Plan

## Executive Summary

This document outlines the complete implementation of multi-user isolation for the SMILe Sales Funnel system to make it production-ready. Currently, all users share the same data pool, which is a **critical security/privacy issue** for production.

## Problem Statement

**Current Behavior (NOT production-ready):**
- All Gmail accounts share the same DynamoDB tables
- User A can see tasks/deals extracted from User B's emails
- Dashboard shows ALL data from ALL connected Gmail accounts
- No data isolation between users

**Required Behavior (Production-ready):**
- Each user sees ONLY their own data
- Tasks/deals/contacts scoped to the Gmail account that created them
- Complete data isolation between users

## Progress So Far (50% Complete)

### ✅ Completed:
1. Added `user_id` field to `BaseEntity` model (all models inherit it)
2. Added `user_id` to `EmailProcessingState`
3. Added `user_id` to `EmailLog` model
4. Updated `workflow.py process_email()` to accept `user_id` parameter

### 🔄 Remaining Work:

#### **1. Worker Layer (Python/LangGraph) - 2 hours**

**File: `worker/src/graph/workflow.py`**
- [ ] Update EmailLog creation to include `user_id` (line ~159)
  ```python
  "email_log": EmailLog(
      message_id_hash=message_hash,
      original_message_id=message_id,
      user_id=user_id or "default_user",  # ADD THIS
      subject=subject[:500],
      sender_email=sender_email,
      prefilter_result=PrefilterResult.PASSED
  ),
  ```

**File: `worker/src/graph/nodes/persist.py`**
- [ ] Update task creation to include `user_id` from state
  ```python
  task = Task(
      user_id=state["user_id"],  # ADD THIS
      title=task_data["task"],
      # ... rest of fields
  )
  ```
- [ ] Update deal creation to include `user_id` from state
  ```python
  deal = Deal(
      user_id=state["user_id"],  # ADD THIS
      company_name=deal_data.get("company"),
      # ... rest of fields
  )
  ```

**File: `worker/src/services/gmail_poller.py`**
- [ ] Update `poll_user()` to pass `user_id` to `process_email()`
  ```python
  result = await self.workflow.process_email(
      email_data['mime_content'],
      source="gmail",
      user_id=user_id  # ADD THIS - already have it from function parameter!
  )
  ```

**File: `worker/src/main.py`** (if manual upload endpoint exists)
- [ ] Update any manual email processing endpoints to require `user_id`

#### **2. NestJS API Layer (TypeScript) - 1 hour**

**File: `api/src/services/dynamodb.service.ts`**
- [ ] Add `user_id` filter to `getTasks()` method
  ```typescript
  const params = {
    TableName: this.tasksTable,
    FilterExpression: 'user_id = :userId',  // ADD THIS
    ExpressionAttributeValues: {
      ':userId': { S: userId }
    }
  };
  ```
- [ ] Add `user_id` filter to `getDeals()` method
- [ ] Add `user_id` filter to `getTodaysTasks()` method
- [ ] Add `user_id` filter to `getHotDeals()` method
- [ ] Add `user_id` filter to `getContacts()` method
- [ ] Update all query methods to accept and use `userId` parameter

**File: `api/src/app.controller.ts`**
- [ ] Add `user_id` query parameter to all GET endpoints
  ```typescript
  @Get('tasks')
  async getTasks(
    @Query('user_id') userId: string,  // ADD THIS (required)
    @Query('status') status?: TaskStatus,
    // ... other params
  ) {
    // Validate userId is provided
    if (!userId) {
      throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.dynamoDbService.getTasks(userId, status, ...);
  }
  ```
- [ ] Apply same pattern to ALL endpoints:
  - `/tasks`
  - `/tasks/today`
  - `/tasks/:id` (verify task belongs to user)
  - `/deals`
  - `/deals/hot`
  - `/deals/:id` (verify deal belongs to user)
  - `/contacts`
  - `/stats/summary`
  - `/insights`

#### **3. UI Layer (React/TypeScript) - 1 hour**

**File: `ui/src/services/api.ts`**
- [ ] Add user context to API client
  ```typescript
  // Get current user from localStorage
  const getCurrentUser = (): string => {
    return localStorage.getItem('user_id') || '';
  };

  // Add user_id to all requests
  apiClient.interceptors.request.use((config) => {
    const userId = getCurrentUser();
    if (userId) {
      config.params = { ...config.params, user_id: userId };
    }
    return config;
  });
  ```

**File: `ui/src/pages/Settings.tsx`**
- [ ] After successful Gmail OAuth, store user_id in localStorage
  ```typescript
  // After OAuth callback success:
  if (gmailStatus?.connected && gmailStatus?.email) {
    localStorage.setItem('user_id', gmailStatus.email);
    localStorage.setItem('user_email', gmailStatus.email);
  }
  ```

**File: `ui/src/App.tsx`** or create `ui/src/contexts/AuthContext.tsx`
- [ ] Create user context provider
  ```typescript
  const AuthContext = createContext<{
    userId: string | null;
    userEmail: string | null;
    isAuthenticated: boolean;
  }>({
    userId: null,
    userEmail: null,
    isAuthenticated: false
  });
  ```
- [ ] Add login/logout logic
- [ ] Redirect to Settings if no user_id in localStorage

**File: `ui/src/components/Navigation.tsx`** (if exists)
- [ ] Show currently logged-in user email
- [ ] Add logout button that clears localStorage

#### **4. Testing & Verification - 30 minutes**

- [ ] Connect 2 different Gmail accounts (e.g., user1@gmail.com, user2@gmail.com)
- [ ] Send test email to user1@gmail.com
- [ ] Send test email to user2@gmail.com
- [ ] Verify user1 ONLY sees their own tasks/deals
- [ ] Verify user2 ONLY sees their own tasks/deals
- [ ] Verify switching users (logout/login) shows correct data

## Authentication Flow (Simplified)

Since we already have Gmail OAuth:

1. User visits app → Check `localStorage` for `user_id`
2. If NO `user_id` → Redirect to Settings page → "Connect Gmail"
3. Gmail OAuth flow → Store `user_id = email` in localStorage
4. All API calls include `user_id` from localStorage
5. Backend filters all queries by `user_id`

## Migration Strategy for Existing Data

**Option 1: Assign all existing data to one user**
```bash
# Run a DynamoDB scan and update script
aws dynamodb scan --table-name smile-sales-funnel-dev-tasks --endpoint-url http://localhost:8001 | \
  jq -r '.Items[].id.S' | \
  while read id; do
    aws dynamodb update-item \
      --table-name smile-sales-funnel-dev-tasks \
      --endpoint-url http://localhost:8001 \
      --key "{\"id\": {\"S\": \"$id\"}}" \
      --update-expression "SET user_id = :uid" \
      --expression-attribute-values "{\":uid\": {\"S\": \"aniketghode@gmail.com\"}}"
  done
```

**Option 2: Clear all data and start fresh**
```bash
# Delete all tables and recreate
cd infra
node delete-local-tables.js
node create-local-tables.js
```

## File Checklist

### Worker (Python)
- [x] `worker/src/models/base.py` - Added user_id to BaseEntity
- [x] `worker/src/models/email_log.py` - Added user_id
- [x] `worker/src/graph/state.py` - Added user_id
- [x] `worker/src/graph/workflow.py` - Added user_id parameter
- [ ] `worker/src/graph/workflow.py` - Update EmailLog creation
- [ ] `worker/src/graph/nodes/persist.py` - Pass user_id to Task/Deal creation
- [ ] `worker/src/services/gmail_poller.py` - Pass user_id to process_email

### API (TypeScript)
- [ ] `api/src/services/dynamodb.service.ts` - Add user_id filters to all queries
- [ ] `api/src/app.controller.ts` - Add user_id parameters to all endpoints

### UI (TypeScript/React)
- [ ] `ui/src/services/api.ts` - Add user context and interceptor
- [ ] `ui/src/pages/Settings.tsx` - Store user_id after OAuth
- [ ] `ui/src/App.tsx` or `ui/src/contexts/AuthContext.tsx` - Add auth context
- [ ] All pages - Use auth context

## Estimated Time

- Worker Layer: 2 hours
- API Layer: 1 hour
- UI Layer: 1 hour
- Testing: 30 minutes

**Total: ~4.5 hours**

## Next Steps

1. Complete Worker layer changes (persist.py, workflow.py, gmail_poller.py)
2. Update NestJS API with user_id filtering
3. Add authentication context to UI
4. Test with multiple users
5. Migrate or clear existing data
6. Commit and deploy

## Notes

- Using Gmail email as `user_id` keeps it simple (no separate user table needed for MVP)
- Backend MUST validate user_id on every request (don't trust frontend)
- Consider adding a Users table later for more metadata (name, settings, etc.)
- For production AWS deployment, consider using Cognito for proper authentication

---

**Status:** 50% Complete (Models updated, workflow partially updated)
**Blocker:** Need to complete persist.py, API layer, and UI layer
**Priority:** HIGH - Required for production launch
