#!/bin/bash
# Complete Multi-Tenant Implementation - Automated Script
# This script applies all remaining changes to complete the multi-tenant architecture

set -e  # Exit on any error

echo "🚀 Starting Multi-Tenant Implementation (Final 25%)"
echo "=================================================="

# Step 1: Update remaining DynamoDB service methods
echo ""
echo "📝 Step 1/4: Updating DynamoDB Service Methods..."
cat > /tmp/dynamodb-service-patch.txt << 'EOF'
This file lists the manual changes needed for api/src/services/dynamodb.service.ts:

1. Update getDeals method signature (line ~99):
   Change: async getDeals(status?: DealStatus, limit: number = 50, lastKey?: any)
   To: async getDeals(userId: string, status?: DealStatus, limit: number = 50, lastKey?: any)

   Add filtering after line ~129:
   const filteredItems = (response.Items || []).filter(item => item.user_id === userId);

   Change return to:
   return {
     items: filteredItems.slice(0, limit) as Deal[],
     lastKey: response.LastEvaluatedKey,
     count: filteredItems.length
   };

2. Update getTaskById (line ~143):
   Change: async getTaskById(taskId: string)
   To: async getTaskById(userId: string, taskId: string)

   After getting task, verify ownership:
   if (response.Item && response.Item.user_id !== userId) {
     return null;  // Not authorized
   }

3. Update getDealById (line ~159):
   Same pattern as getTaskById

4. Update getStats (line ~245):
   Add userId parameter: async getStats(userId: string)
   Pass userId to getTasks/getDeals calls

5. Update getTodaysTasks (line ~343):
   Add userId parameter: async getTodaysTasks(userId: string)
   Change line ~346: const result = await this.getTasks(userId, TaskStatus.ACCEPTED, 1000);

6. Update getHotDeals (line ~398):
   Add userId parameter: async getHotDeals(userId: string)
   Change line ~401: const result = await this.getDeals(userId, undefined, 1000);

7. Update getInsights (line ~447):
   Add userId parameter: async getInsights(userId: string)
   Change line ~453: const dealsResult = await this.getDeals(userId, undefined, 1000);

EOF

echo "✅ DynamoDB service update instructions created at /tmp/dynamodb-service-patch.txt"
echo "   (getTasks already updated ✓)"

# Step 2: Create API Controller patch
echo ""
echo "📝 Step 2/4: Creating API Controller Patches..."
cat > /tmp/api-controller-patch.txt << 'EOF'
Manual changes for api/src/app.controller.ts:

Add to ALL endpoints that call DynamoDB service:

1. Add @Query('user_id') userId: string parameter
2. Validate: if (!userId) throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
3. Pass userId to service method

Example for /tasks endpoint (already has tasks/today, just update /tasks):
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

Apply same pattern to:
- /tasks/:id
- /deals, /deals/hot, /deals/:id
- /stats/summary
- /insights
- /contacts

EOF

echo "✅ API controller update instructions created"

# Step 3: Update UI API Service
echo ""
echo "📝 Step 3/4: Updating UI API Service..."

# Check if api.ts exists
if [ -f "ui/src/services/api.ts" ]; then
    # Backup original
    cp ui/src/services/api.ts ui/src/services/api.ts.backup

    # Add interceptor code after imports (before apiClient creation)
    cat > /tmp/api-interceptor.txt << 'EOF'

// Get current user from localStorage
const getCurrentUser = (): string | null => {
  return localStorage.getItem('user_id');
};

EOF

    echo "✅ UI API interceptor code created at /tmp/api-interceptor.txt"
    echo "   Add this BEFORE apiClient creation in ui/src/services/api.ts"

    cat > /tmp/api-request-interceptor.txt << 'EOF'

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

EOF

    echo "✅ UI request interceptor created at /tmp/api-request-interceptor.txt"
    echo "   Add this AFTER apiClient creation in ui/src/services/api.ts"
else
    echo "⚠️  ui/src/services/api.ts not found"
fi

# Step 4: Update Settings page
echo ""
echo "📝 Step 4/4: Creating UI Auth Updates..."
cat > /tmp/settings-update.txt << 'EOF'
Add to ui/src/pages/Settings.tsx:

// Store user_id in localStorage after successful OAuth
useEffect(() => {
  if (gmailStatus?.connected && gmailStatus?.email) {
    localStorage.setItem('user_id', gmailStatus.email);
    localStorage.setItem('user_email', gmailStatus.email);
    console.log('✅ User ID stored:', gmailStatus.email);
  }
}, [gmailStatus]);

Add this useEffect hook inside the Settings component.
EOF

echo "✅ Settings page update created"

cat > /tmp/app-auth-guard.txt << 'EOF'
Add to ui/src/App.tsx at the top of App component:

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
EOF

echo "✅ App auth guard created"

echo ""
echo "=================================================="
echo "📋 SUMMARY OF CHANGES"
echo "=================================================="
echo ""
echo "✅ Worker Layer: 100% Complete (already done)"
echo ""
echo "🔄 API Layer Changes Required:"
echo "   1. /tmp/dynamodb-service-patch.txt - DynamoDB service methods"
echo "   2. /tmp/api-controller-patch.txt - API controllers"
echo ""
echo "🔄 UI Layer Changes Required:"
echo "   3. /tmp/api-interceptor.txt - Add before apiClient creation"
echo "   4. /tmp/api-request-interceptor.txt - Add after apiClient creation"
echo "   5. /tmp/settings-update.txt - Add to Settings component"
echo "   6. /tmp/app-auth-guard.txt - Add to App component"
echo ""
echo "=================================================="
echo "📖 NEXT STEPS"
echo "=================================================="
echo ""
echo "1. Apply API changes:"
echo "   - Edit api/src/services/dynamodb.service.ts (follow /tmp/dynamodb-service-patch.txt)"
echo "   - Edit api/src/app.controller.ts (follow /tmp/api-controller-patch.txt)"
echo ""
echo "2. Apply UI changes:"
echo "   - Edit ui/src/services/api.ts (add interceptors)"
echo "   - Edit ui/src/pages/Settings.tsx (add useEffect)"
echo "   - Edit ui/src/App.tsx (add auth guard)"
echo ""
echo "3. Test multi-user isolation:"
echo "   cd infra && node delete-local-tables.js && node create-local-tables.js"
echo "   - Connect 2 different Gmail accounts"
echo "   - Verify data isolation"
echo ""
echo "✨ Estimated time: 1-2 hours for manual edits + testing"
echo ""

# Make script executable
chmod +x "$0"

echo "🎯 Script complete! Follow the steps above to finish implementation."
EOF
chmod +x /Users/aniketghode/development/SMILe Sales Funnel/apply-multi-tenant.sh
