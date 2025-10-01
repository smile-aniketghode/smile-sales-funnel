#!/bin/bash
set -e

echo "🚀 Starting SMILe Sales Funnel (Local Mode)"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker first."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js first."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Please install Python 3 first."; exit 1; }

# Start DynamoDB Local
echo "📦 Starting DynamoDB Local..."
if [ "$(docker ps -q -f name=smile-dynamodb)" ]; then
    echo "   DynamoDB Local already running"
else
    docker run -d --name smile-dynamodb -p 8001:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb
    echo "   Waiting for DynamoDB Local to start..."
    sleep 3
fi

# Create tables
echo "🗄️  Creating DynamoDB tables..."
node infra/create-local-tables.js

# Check Ollama
echo "🤖 Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running!"
    echo "   Please start Ollama first:"
    echo "   ollama serve"
    echo ""
    echo "   Then ensure llama3.2 is installed:"
    echo "   ollama pull llama3.2"
    exit 1
fi

# Check for llama3.2 model
if ! curl -s http://localhost:11434/api/tags | grep -q "llama3.2"; then
    echo "⚠️  llama3.2 model not found. Pulling it now..."
    ollama pull llama3.2
fi

echo "   ✓ Ollama is running with llama3.2"

# Start Worker
echo "⚙️  Starting Worker..."
cd worker
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
python -m src.main > ../logs/worker.log 2>&1 &
WORKER_PID=$!
cd ..
echo "   ✓ Worker started (PID: $WORKER_PID)"

# Start API
echo "🔌 Starting API..."
cd api
if [ ! -d "node_modules" ]; then
    echo "   Installing API dependencies..."
    npm install
fi
npm run start:dev > ../logs/api.log 2>&1 &
API_PID=$!
cd ..
echo "   ✓ API started (PID: $API_PID)"

# Start UI
echo "🎨 Starting UI..."
cd ui
if [ ! -d "node_modules" ]; then
    echo "   Installing UI dependencies..."
    npm install
fi
npm run dev > ../logs/ui.log 2>&1 &
UI_PID=$!
cd ..
echo "   ✓ UI started (PID: $UI_PID)"

# Save PIDs for cleanup
mkdir -p .local
echo $WORKER_PID > .local/worker.pid
echo $API_PID > .local/api.pid
echo $UI_PID > .local/ui.pid

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 8

echo ""
echo "✅ SMILe Sales Funnel is running locally!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   UI:      http://localhost:5173"
echo "   API:     http://localhost:3000"
echo "   Worker:  http://localhost:8000"
echo "   DynamoDB: http://localhost:8001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 Upload a sample email at http://localhost:5173"
echo ""
echo "📊 Logs:"
echo "   Worker: tail -f logs/worker.log"
echo "   API:    tail -f logs/api.log"
echo "   UI:     tail -f logs/ui.log"
echo ""
echo "🛑 To stop: ./stop-local.sh"
echo ""
