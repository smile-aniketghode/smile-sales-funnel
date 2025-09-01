import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Any
import logging

from .graph.workflow import EmailProcessingWorkflow

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SMILe Sales Funnel Worker",
    description="Background processing service for email ingestion with LangGraph + Ollama",
    version="0.2.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow with environment variables
confidence_threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.8"))
llm_model = os.getenv("LLM_MODEL", "llama3.2")
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

workflow = EmailProcessingWorkflow(
    confidence_threshold=confidence_threshold,
    llm_model=llm_model,
    llm_base_url=ollama_base_url
)

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SMILe Sales Funnel Worker",
        "version": "0.2.0",
        "llm_model": llm_model,
        "ollama_url": ollama_base_url,
        "confidence_threshold": confidence_threshold,
        "message": "LangGraph + Ollama integration active"
    }

@app.post("/ingestEmail")
async def ingest_email_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Process email through complete LangGraph pipeline with Ollama LLM
    
    Returns:
        Processing results with extracted tasks and deals
    """
    try:
        # Validate file
        if not file.content_type or 'text' not in file.content_type:
            raise HTTPException(
                status_code=400, 
                detail="File must be a text file (MIME email)"
            )
        
        # Read email content
        content = await file.read()
        mime_content = content.decode('utf-8')
        
        logger.info(f"Processing email file: {file.filename}")
        logger.info(f"Email content length: {len(mime_content)} chars")
        
        # Process through LangGraph workflow
        result = await workflow.process_email(mime_content, source="upload")
        
        logger.info(f"Email processing complete: {result['status']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/stats")
async def get_processing_stats():
    """Processing statistics - would be pulled from DynamoDB in production"""
    return {
        "week_stats": {
            "emails_processed": 0,
            "successful_extractions": 0,
            "total_tokens_used": 0,
            "extraction_rate": 0.0
        },
        "current_pending": {
            "draft_tasks": 0,
            "draft_deals": 0
        },
        "llm_info": {
            "model": llm_model,
            "provider": "ollama",
            "endpoint": ollama_base_url
        },
        "generated_at": "2025-09-01T02:52:00Z",
        "note": "Real LangGraph + Ollama integration"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)