from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Any
import logging

from .email_processor import EmailProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SMILe Sales Funnel Worker",
    description="Background processing service for email ingestion and LLM extraction",
    version="0.1.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize email processor
email_processor = EmailProcessor()

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SMILe Sales Funnel Worker",
        "version": "0.1.0"
    }

@app.post("/ingestEmail")
async def ingest_email_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Manual email ingest endpoint for development.
    Accepts raw MIME email files for processing.
    
    Returns:
        Processing results with extracted tasks and deals
    """
    try:
        # Read the uploaded file
        if not file.content_type or 'text' not in file.content_type:
            raise HTTPException(
                status_code=400, 
                detail="File must be a text file (MIME email)"
            )
        
        content = await file.read()
        mime_content = content.decode('utf-8')
        
        logger.info(f"Processing email file: {file.filename}")
        
        # Process the email through the pipeline
        result = await email_processor.process_email(
            mime_content=mime_content,
            source=f"manual_upload:{file.filename}"
        )
        
        logger.info(f"Processing complete. Tasks: {len(result.get('tasks', []))}, Deals: {len(result.get('deals', []))}")
        
        return {
            "status": "success",
            "message": "Email processed successfully",
            "results": result
        }
        
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/stats")
async def get_processing_stats():
    """Get processing statistics"""
    return await email_processor.get_stats()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)