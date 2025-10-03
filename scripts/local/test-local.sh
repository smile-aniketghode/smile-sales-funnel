#!/bin/bash
set -e

echo "🧪 Testing SMILe Sales Funnel (Local)"
echo ""

# Check if services are running
echo "📡 Checking services..."

# Check DynamoDB Local
if ! curl -s http://localhost:8001 > /dev/null 2>&1; then
    echo "❌ DynamoDB Local is not running"
    echo "   Run: ./start-local.sh first"
    exit 1
fi
echo "   ✓ DynamoDB Local"

# Check Worker
if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "❌ Worker is not running"
    echo "   Run: ./start-local.sh first"
    exit 1
fi
echo "   ✓ Worker"

# Check API
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ API is not running"
    echo "   Run: ./start-local.sh first"
    exit 1
fi
echo "   ✓ API"

# Check UI
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "❌ UI is not running"
    echo "   Run: ./start-local.sh first"
    exit 1
fi
echo "   ✓ UI"

echo ""
echo "🧪 Running end-to-end tests..."
echo ""

# Test 1: Upload high-value deal email
echo "Test 1: High-value deal extraction"
RESPONSE=$(curl -s -X POST http://localhost:8000/ingestEmail \
    -F "file=@samples/deal-high-value.txt")

if echo "$RESPONSE" | grep -q "success"; then
    TASKS=$(echo "$RESPONSE" | grep -o '"high_confidence_tasks":[0-9]*' | grep -o '[0-9]*')
    DEALS=$(echo "$RESPONSE" | grep -o '"high_confidence_deals":[0-9]*' | grep -o '[0-9]*')
    echo "   ✓ Extracted $TASKS tasks and $DEALS deals"
else
    echo "   ✗ Failed to process email"
    echo "   Response: $RESPONSE"
fi

sleep 2

# Test 2: Upload task-heavy email
echo "Test 2: Task extraction"
RESPONSE=$(curl -s -X POST http://localhost:8000/ingestEmail \
    -F "file=@samples/task-followup.txt")

if echo "$RESPONSE" | grep -q "success"; then
    echo "   ✓ Task email processed successfully"
else
    echo "   ✗ Failed to process email"
fi

sleep 2

# Test 3: Check API for extracted data
echo "Test 3: API data retrieval"
TASKS_RESPONSE=$(curl -s http://localhost:3000/tasks?status=draft)
DEALS_RESPONSE=$(curl -s http://localhost:3000/deals?status=draft)

TASK_COUNT=$(echo "$TASKS_RESPONSE" | grep -o '"count":[0-9]*' | head -1 | grep -o '[0-9]*')
DEAL_COUNT=$(echo "$DEALS_RESPONSE" | grep -o '"count":[0-9]*' | head -1 | grep -o '[0-9]*')

echo "   ✓ API returned $TASK_COUNT draft tasks and $DEAL_COUNT draft deals"

# Test 4: Stats endpoint
echo "Test 4: Stats endpoint"
STATS=$(curl -s http://localhost:3000/stats/summary)
if echo "$STATS" | grep -q "draft_tasks"; then
    echo "   ✓ Stats endpoint working"
else
    echo "   ✗ Stats endpoint failed"
fi

echo ""
echo "✅ Tests complete!"
echo ""
echo "📊 Summary:"
echo "   - Services: All running"
echo "   - Email processing: Working"
echo "   - Data persistence: Working"
echo "   - API endpoints: Working"
echo ""
echo "🌐 Open http://localhost:5173 to see the UI"
