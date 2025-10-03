# 🚀 SMILe Sales Funnel - Quick Start

## Prerequisites (One-Time Setup)

```bash
# 1. Install Docker
# Download from: https://www.docker.com/products/docker-desktop

# 2. Install Ollama
# Mac:
brew install ollama
# Or download from: https://ollama.ai

# 3. Pull LLM model (one-time, ~2GB)
ollama pull llama3.2
```

## Run Demo (Every Time)

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start demo
make demo
```

**Open:** http://localhost:5173

## Test It

1. Click "Choose File"
2. Select `samples/deal-high-value.txt`
3. Click "Upload"
4. Wait 10-15 seconds
5. See extracted tasks & deals! ✨

## Commands

| Command | What it does |
|---------|--------------|
| `make demo` | Start everything + open browser |
| `make stop` | Stop all services |
| `make test` | Run automated tests |
| `make logs` | View all logs |
| `make clean` | Remove all generated files |

## Troubleshooting

**"Port already in use"**
```bash
make stop
make demo
```

**"Ollama not found"**
```bash
# In separate terminal:
ollama serve
```

**"No data in UI"**
```bash
# Check logs:
tail -f logs/worker.log
```

## Need Help?

See [LOCAL-DEMO-README.md](LOCAL-DEMO-README.md) for detailed docs.

---

**That's it! You're ready to demo.** 🎉
