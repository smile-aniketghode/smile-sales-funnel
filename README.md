# 🎯 SMILe Sales Funnel

> **AI-powered sales pipeline that automatically extracts tasks and deals from your Gmail inbox**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Phase](https://img.shields.io/badge/Phase-3-blue.svg)](https://github.com/smile-aniketghode/smile-sales-funnel)
[![Multi-Tenant](https://img.shields.io/badge/Multi--Tenant-Ready-green.svg)](https://github.com/smile-aniketghode/smile-sales-funnel)

---

## ✨ Features

- 🤖 **AI-Powered Extraction**: LangGraph agents automatically extract tasks and deals from emails
- 📧 **Gmail Integration**: OAuth-based Gmail polling with automatic sync
- 🎨 **Beautiful UI**: Modern React interface with Tailwind CSS
- 🔒 **Multi-Tenant**: Complete data isolation per user
- 📊 **Pipeline Management**: Visual kanban board with drag-and-drop
- 📈 **Analytics**: Revenue tracking, conversion rates, and insights
- 🌐 **Cloud-Ready**: Deploy to Railway, Render, Fly.io, or AWS in minutes
- 💰 **Cost-Optimized**: Free tier strategy for 6+ months

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/smile-aniketghode/smile-sales-funnel.git
cd smile-sales-funnel

# Install dependencies
make install

# Start local demo
make demo
```

Visit [http://localhost:5173](http://localhost:5173) to see the app!

**📖 See [docs/QUICKSTART.md](docs/QUICKSTART.md) for detailed setup instructions**

---

## 📁 Project Structure

```
📁 SMILe Sales Funnel/
├── 📁 api/              # NestJS REST API
├── 📁 worker/           # Python LangGraph email processor
├── 📁 ui/               # React + Vite frontend
├── 📁 infra/            # Infrastructure as code (DynamoDB, etc.)
├── 📁 docs/             # 📚 All documentation
├── 📁 scripts/          # Shell scripts for local dev & deployment
├── 📁 config/           # Environment & deployment configs
├── 📁 samples/          # Sample emails for testing
└── Makefile            # Convenience commands
```

---

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Local Setup](docs/development/local-setup.md)** - Detailed local development guide
- **[Ready to Run](docs/development/ready-to-run.md)** - Complete demo walkthrough

### Architecture
- **[Local-First Plan](docs/architecture/local-first-plan.md)** - Development architecture
- **[Mockup Alignment](docs/architecture/mockup-alignment.md)** - Design system overview

### Features
- **[Gmail Integration](docs/features/gmail-integration.md)** - OAuth setup & email sync
- **[Multi-Tenant Architecture](docs/features/multi-tenant.md)** - Data isolation & security

### Deployment
- **[Railway Deployment](docs/deployment/railway.md)** - One-click cloud deployment
- **[Railway CLI](docs/deployment/railway-cli.md)** - CLI-based deployment
- **[Docker Deployment](docs/deployment/railway-docker.md)** - Container-based deployment

### Development
- **[Testing Guide](docs/development/testing.md)** - E2E and unit testing
- **[Test Results](docs/development/test-results.md)** - Latest test coverage

### Project Management
- **[Phased Plan](docs/project-management/phases.md)** - Development roadmap
- **[Progress Tracker](docs/project-management/progress.md)** - Current status

---

## 🛠️ Commands

```bash
make help      # Show all available commands
make install   # Install all dependencies
make start     # Start all services
make stop      # Stop all services
make test      # Run E2E tests
make clean     # Clean generated files
make logs      # Tail all logs
```

---

## 🏗️ Technology Stack

### Backend
- **API**: NestJS (TypeScript)
- **Worker**: Python + LangGraph + LangChain
- **Database**: DynamoDB (local via Docker for dev)
- **AI**: OpenRouter (Mistral, GPT-4, Claude)

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Context API
- **Icons**: Lucide React

### Infrastructure
- **Local Dev**: Docker + DynamoDB Local
- **Deployment**: Railway, Render, Fly.io, AWS
- **CI/CD**: GitHub Actions (planned)

---

## 🎯 Development Workflow

1. **Feature Development**: Work on `feature/*` branches
2. **Integration**: Merge to `develop` branch
3. **Production**: Merge to `main` for deployment
4. **Tagging**: Use `v0.x` tags for phase checkpoints

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

---

## 📊 Current Status

- ✅ **Phase 1**: Local-first demo complete
- ✅ **Phase 2**: Dashboard & analytics live
- 🚧 **Phase 3**: Gmail OAuth integration (in progress)
- 📋 **Phase 4**: Production pilot (planned)

---

## 🤝 Contributing

This is currently a solo project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`feature/amazing-feature`)
3. Follow the commit format in [CLAUDE.md](CLAUDE.md)
4. Submit a PR with clear description

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **GitHub**: [https://github.com/smile-aniketghode/smile-sales-funnel](https://github.com/smile-aniketghode/smile-sales-funnel)
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/smile-aniketghode/smile-sales-funnel/issues)

---

<div align="center">
  <p>Made with ❤️ using AI</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
