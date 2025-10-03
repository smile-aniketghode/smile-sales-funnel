import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
import uvicorn
from typing import Dict, Any, Optional
import logging

from .graph.workflow import EmailProcessingWorkflow
from .services.gmail_oauth import GmailOAuthService
from .services.gmail_token_storage import GmailTokenStorage
from .services.gmail_client import GmailClient
from .services.gmail_poller import GmailPoller

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SMILe Sales Funnel Worker",
    description="Background processing service for email ingestion with LangGraph + OpenRouter",
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
llm_model = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-small-3.2-24b-instruct:free")

workflow = EmailProcessingWorkflow(
    confidence_threshold=confidence_threshold,
    llm_model=llm_model
)

# Initialize Gmail OAuth services
gmail_oauth = GmailOAuthService()
token_storage = GmailTokenStorage()
gmail_client = GmailClient()
gmail_poller = GmailPoller(workflow)

# App lifecycle events
@app.on_event("startup")
async def startup_event():
    """Start background Gmail polling on app startup."""
    if os.getenv("GMAIL_POLLING_ENABLED", "true").lower() == "true":
        await gmail_poller.start_polling()
        logger.info("✅ Gmail background polling enabled")
    else:
        logger.info("⚠️  Gmail polling disabled (set GMAIL_POLLING_ENABLED=true to enable)")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background Gmail polling on app shutdown."""
    await gmail_poller.stop_polling()

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SMILe Sales Funnel Worker",
        "version": "0.3.0",
        "llm_model": llm_model,
        "llm_provider": "openrouter",
        "confidence_threshold": confidence_threshold,
        "gmail_oauth_configured": bool(os.getenv("GMAIL_CLIENT_ID")),
        "message": "LangGraph + OpenRouter + Gmail OAuth integration"
    }

# ============================================================================
# Gmail OAuth Endpoints
# ============================================================================

@app.get("/auth/gmail")
async def gmail_auth_init(user_id: str = Query(..., description="User email or ID")):
    """
    Initiate Gmail OAuth flow
    Returns authorization URL to redirect user to
    """
    try:
        if not gmail_oauth.client_id:
            raise HTTPException(
                status_code=500,
                detail="Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET."
            )

        # Generate auth URL with user_id as state
        auth_url = gmail_oauth.get_authorization_url(state=user_id)

        logger.info(f"Gmail OAuth initiated for user: {user_id}")

        return {
            "auth_url": auth_url,
            "user_id": user_id,
            "message": "Redirect user to auth_url to complete OAuth flow"
        }

    except Exception as e:
        logger.error(f"Gmail OAuth init failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auth/gmail/callback")
async def gmail_auth_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None)
):
    """
    Gmail OAuth callback - exchanges code for tokens
    """
    try:
        # Exchange code for tokens
        token_data = gmail_oauth.exchange_code_for_tokens(code)

        # Get user email from token
        user_email = gmail_oauth.get_user_email(token_data)
        if not user_email:
            raise HTTPException(status_code=500, detail="Failed to get user email")

        # Use state (user_id) if provided, otherwise use email
        user_id = state or user_email

        # Save tokens to DynamoDB
        success = token_storage.save_token(user_id, token_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save tokens")

        logger.info(f"Gmail OAuth completed for: {user_email} (user_id: {user_id})")

        # Redirect to success page in UI
        ui_base_url = os.getenv("UI_BASE_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{ui_base_url}/settings?gmail_connected=true&email={user_email}",
            status_code=302
        )

    except Exception as e:
        logger.error(f"Gmail OAuth callback failed: {e}")
        # Redirect to error page
        ui_base_url = os.getenv("UI_BASE_URL", "http://localhost:5173")
        return RedirectResponse(
            url=f"{ui_base_url}/settings?gmail_error={str(e)}",
            status_code=302
        )


@app.get("/auth/gmail/status")
async def gmail_auth_status(user_id: str = Query(...)):
    """
    Check Gmail connection status for a user
    """
    try:
        token_data = token_storage.get_token(user_id)

        if not token_data:
            return {
                "connected": False,
                "user_id": user_id,
                "email": None
            }

        # Check if token is expired
        is_expired = gmail_oauth.is_token_expired(token_data)

        # If expired, try to refresh
        if is_expired and token_data.get('refresh_token'):
            try:
                refreshed_token = gmail_oauth.refresh_access_token(token_data)
                token_storage.update_token(user_id, refreshed_token)
                token_data = refreshed_token
                is_expired = False
                logger.info(f"Refreshed Gmail token for: {user_id}")
            except Exception as e:
                logger.error(f"Token refresh failed for {user_id}: {e}")

        # Get user email
        user_email = gmail_oauth.get_user_email(token_data) if not is_expired else None

        return {
            "connected": not is_expired,
            "user_id": user_id,
            "email": user_email,
            "token_expired": is_expired,
            "last_updated": token_data.get('updated_at')
        }

    except Exception as e:
        logger.error(f"Status check failed for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/auth/gmail/disconnect")
async def gmail_auth_disconnect(user_id: str = Query(...)):
    """
    Disconnect Gmail account (delete stored tokens)
    """
    try:
        success = token_storage.delete_token(user_id)

        if success:
            logger.info(f"Gmail disconnected for user: {user_id}")
            return {"message": "Gmail disconnected successfully", "user_id": user_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to disconnect Gmail")

    except Exception as e:
        logger.error(f"Disconnect failed for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Gmail API Endpoints
# ============================================================================

@app.get("/gmail/labels")
async def get_gmail_labels(user_id: str = Query(...)):
    """Get all Gmail labels for a user"""
    try:
        labels = gmail_client.list_labels(user_id)
        return {
            "labels": labels,
            "count": len(labels),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to get labels for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gmail/fetch")
async def fetch_gmail_emails(
    user_id: str = Query(...),
    label_ids: list[str] = Query(...),
    max_results: int = Query(10)
):
    """Fetch emails from Gmail by label"""
    try:
        emails = gmail_client.fetch_emails_by_label(
            user_id=user_id,
            label_ids=label_ids,
            max_results=max_results
        )
        return {
            "emails": emails,
            "count": len(emails),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to fetch emails for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gmail/poll")
async def manual_poll(
    user_id: str = Query(...),
    label_ids: Optional[list[str]] = Query(None)
):
    """Manually trigger Gmail polling for a user"""
    try:
        result = await gmail_poller.poll_user(user_id, label_ids)
        return result
    except Exception as e:
        logger.error(f"Manual poll failed for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/gmail/polling/status")
async def get_polling_status():
    """Get Gmail polling status"""
    return gmail_poller.get_polling_status()


@app.post("/gmail/polling/start")
async def start_polling():
    """Start Gmail background polling"""
    await gmail_poller.start_polling()
    return {"message": "Gmail polling started", "status": "success"}


@app.post("/gmail/polling/stop")
async def stop_polling():
    """Stop Gmail background polling"""
    await gmail_poller.stop_polling()
    return {"message": "Gmail polling stopped", "status": "success"}

# ============================================================================
# Email Processing Endpoints
# ============================================================================

@app.post("/ingestEmail")
async def ingest_email_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Process email through complete LangGraph pipeline with OpenRouter LLM

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
            "provider": "openrouter"
        },
        "generated_at": "2025-09-01T02:52:00Z",
        "note": "Real LangGraph + OpenRouter integration"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)