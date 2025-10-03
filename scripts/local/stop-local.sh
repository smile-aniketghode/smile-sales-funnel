#!/bin/bash

echo "🛑 Stopping SMILe Sales Funnel..."
echo ""

# Stop services
if [ -f .local/worker.pid ]; then
    WORKER_PID=$(cat .local/worker.pid)
    kill $WORKER_PID 2>/dev/null && echo "   ✓ Worker stopped" || echo "   ⚠️  Worker already stopped"
fi

if [ -f .local/api.pid ]; then
    API_PID=$(cat .local/api.pid)
    kill $API_PID 2>/dev/null && echo "   ✓ API stopped" || echo "   ⚠️  API already stopped"
fi

if [ -f .local/ui.pid ]; then
    UI_PID=$(cat .local/ui.pid)
    kill $UI_PID 2>/dev/null && echo "   ✓ UI stopped" || echo "   ⚠️  UI already stopped"
fi

# Stop DynamoDB Local
if [ "$(docker ps -q -f name=smile-dynamodb)" ]; then
    docker stop smile-dynamodb >/dev/null 2>&1
    docker rm smile-dynamodb >/dev/null 2>&1
    echo "   ✓ DynamoDB Local stopped"
else
    echo "   ⚠️  DynamoDB Local already stopped"
fi

# Cleanup PID files
rm -rf .local

echo ""
echo "✅ All services stopped"
