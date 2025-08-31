# Worker

Background processing service for email ingestion and LLM extraction.

## Architecture
- Gmail polling and batch processing
- LangGraph orchestration (PreFilter → ExtractLocal → ConfidenceGate → Persist)
- Local LLM integration (llama.cpp HTTP)
- DynamoDB persistence with idempotency

## Development
TBD - will be implemented in Phase 1