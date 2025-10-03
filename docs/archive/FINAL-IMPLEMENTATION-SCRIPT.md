# Final Multi-Tenant Implementation - Executive Summary

## Current Status
- ✅ Worker Layer: 100% complete (all data has user_id)
- 🔄 API Layer: Need userId filtering
- 🔄 UI Layer: Need session management

## Quick Implementation (Copy-Paste Ready)

### 1. Update DynamoDB Service (api/src/services/dynamodb.service.ts)

Replace `getTasks` method with:

```typescript
async getTasks(userId: string, status?: TaskStatus, limit: number = 50, lastKey?: any): Promise<{
  items: Task[];
  lastKey?: any;
  count: number;
}> {
  try {
    let command;

    if (status) {
      command = new QueryCommand({
        TableName: this.getTableName('tasks'),
        IndexName: 'status-created_at-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastKey
      });
    } else {
      command = new ScanCommand({
        TableName: this.getTableName('tasks'),
        Limit: limit * 2, // Fetch extra for filtering
        ExclusiveStartKey: lastKey
      });
    }

    const response: any = await this.docClient.send(command);

    // Filter by user_id in application layer
    const filteredItems = (response.Items || []).filter(item => item.user_id === userId);

    return {
      items: filteredItems.slice(0, limit) as Task[],
      lastKey: response.LastEvaluatedKey,
      count: filteredItems.length
    };

  } catch (error) {
    this.logger.error(`Error getting tasks: ${error.message}`, error.stack);
    return { items: [], count: 0 };
  }
}
```

Apply same pattern to:
- `getDeals(userId: string, ...)`
- `getTodaysTasks(userId: string)`
- `getHotDeals(userId: string)`
- `getTaskById(userId: string, id: string)` - verify ownership
- `getDealById(userId: string, id: string)` - verify ownership

### 2. Update API Controllers (api/src/app.controller.ts)

Add userId to all endpoints:

```typescript
@Get('tasks/today')
async getTodaysTasks(@Query('user_id') userId: string) {
  if (!userId) {
    throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
  }
  const tasks = await this.dynamoDbService.getTodaysTasks(userId);
  return { tasks, count: tasks.length, status: 'success' };
}

@Get('tasks')
async getTasks(
  @Query('user_id') userId: string,
  @Query('status') status?: TaskStatus,
  @Query('limit') limit?: string,
  @Query('lastKey') lastKey?: string
) {
  if (!userId) {
    throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
  }

  const limitNum = limit ? parseInt(limit) : 50;
  const lastKeyObj = lastKey ? JSON.parse(lastKey) : undefined;

  const result = await this.dynamoDbService.getTasks(userId, status, limitNum, lastKeyObj);

  return {
    tasks: result.items,
    count: result.count,
    lastKey: result.lastKey,
    status: 'success'
  };
}

@Get('tasks/:id')
async getTaskById(
  @Param('id') id: string,
  @Query('user_id') userId: string
) {
  if (!userId) {
    throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
  }

  const task = await this.dynamoDbService.getTaskById(userId, id);

  if (!task) {
    throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
  }

  // Verify ownership
  if (task.user_id !== userId) {
    throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
  }

  return { task, status: 'success' };
}
```

Apply to ALL endpoints: `/deals`, `/deals/hot`, `/deals/:id`, `/contacts`, `/stats/summary`, `/insights`

### 3. Update UI API Service (ui/src/services/api.ts)

Add at top of file:

```typescript
// Get current user from localStorage
const getCurrentUser = (): string | null => {
  return localStorage.getItem('user_id');
};

// Add user_id to all requests
apiClient.interceptors.request.use(
  (config) => {
    const userId = getCurrentUser();

    if (userId) {
      // Add user_id to query parameters
      config.params = { ...config.params, user_id: userId };
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);
```

### 4. Update Settings Page (ui/src/pages/Settings.tsx)

Add after gmailStatus fetch:

```typescript
// Store user_id in localStorage after successful OAuth
useEffect(() => {
  if (gmailStatus?.connected && gmailStatus?.email) {
    localStorage.setItem('user_id', gmailStatus.email);
    localStorage.setItem('user_email', gmailStatus.email);
    console.log('✅ User ID stored:', gmailStatus.email);
  }
}, [gmailStatus]);
```

### 5. Add Auth Guard (ui/src/App.tsx)

Add at top of App component:

```typescript
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth guard - redirect to settings if no user_id
  useEffect(() => {
    const userId = localStorage.getItem('user_id');

    if (!userId && location.pathname !== '/settings') {
      console.log('⚠️ No user_id found, redirecting to /settings');
      navigate('/settings');
    }
  }, [location.pathname, navigate]);

  // ... rest of component
}
```

## Testing Steps

1. **Clear existing data:**
```bash
cd infra
node delete-local-tables.js
node create-local-tables.js
```

2. **Clear browser storage:**
- Open DevTools → Application → Local Storage
- Clear all items

3. **Test User 1:**
- Go to localhost:5173 (should redirect to /settings)
- Click "Connect Gmail"
- After OAuth, verify localStorage has user_id
- Send test email to connected account
- Click "Sync Now"
- Go to Dashboard - should see tasks

4. **Test User 2 (incognito):**
- Open incognito window
- Go to localhost:5173/settings
- Connect different Gmail
- Send test email
- Sync and verify isolation

5. **Verify:**
```bash
# Check user 1's tasks
aws dynamodb scan \
  --table-name smile-sales-funnel-dev-tasks \
  --endpoint-url http://localhost:8001 \
  --region local \
  --filter-expression "user_id = :uid" \
  --expression-attribute-values '{":uid":{"S":"user1@gmail.com"}}'

# Should NOT see user 2's tasks
```

## Success Criteria

✅ Each user sees ONLY their own data
✅ API rejects requests without user_id
✅ UI automatically injects user_id
✅ Multi-user isolation verified
✅ System production-ready

## Estimated Time: 1-2 hours

---

**That's it! Follow these steps and you'll be at 100% multi-tenant implementation.**
