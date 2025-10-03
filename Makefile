.PHONY: install demo start stop clean test help

help:
	@echo "SMILe Sales Funnel - Local Development"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make demo       - Start complete local demo"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make test       - Run end-to-end tests"
	@echo "  make clean      - Clean all generated files"
	@echo "  make logs       - Tail all logs"
	@echo ""

install:
	@echo "📦 Installing dependencies..."
	@mkdir -p logs
	@echo "   Installing API dependencies..."
	@cd api && npm install
	@echo "   Installing UI dependencies..."
	@cd ui && npm install
	@echo "   Installing Worker dependencies..."
	@cd worker && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "✅ Installation complete"
	@echo ""
	@echo "Next: make demo"

demo: start
	@echo ""
	@echo "🎬 Opening browser..."
	@sleep 3
	@open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null || echo "   Please open http://localhost:5173 in your browser"

start:
	@chmod +x scripts/local/start-local.sh
	@./scripts/local/start-local.sh

stop:
	@chmod +x scripts/local/stop-local.sh
	@./scripts/local/stop-local.sh

clean:
	@echo "🧹 Cleaning up..."
	@docker stop smile-dynamodb 2>/dev/null || true
	@docker rm smile-dynamodb 2>/dev/null || true
	@rm -rf .local
	@rm -rf logs/*.log
	@rm -rf worker/venv
	@rm -rf api/node_modules api/dist
	@rm -rf ui/node_modules ui/dist
	@echo "✅ Clean complete"

logs:
	@echo "📊 Tailing logs (Ctrl+C to stop)..."
	@tail -f logs/*.log

test:
	@chmod +x scripts/local/test-local.sh
	@./scripts/local/test-local.sh
