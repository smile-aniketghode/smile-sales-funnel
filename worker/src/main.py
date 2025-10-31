import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
import uvicorn
from typing import Dict, Any, Optional
import logging
from collections import defaultdict
import time

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

# ============================================================================
# Rate Limiter for Demo Endpoint
# ============================================================================

class SimpleRateLimiter:
    """Simple in-memory rate limiter for demo endpoint"""
    def __init__(self, max_requests: int = 5, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # IP -> [timestamps]

    def is_allowed(self, ip: str) -> bool:
        """Check if request from IP is allowed"""
        now = time.time()
        # Clean old requests
        self.requests[ip] = [ts for ts in self.requests[ip] if now - ts < self.window_seconds]

        # Check limit
        if len(self.requests[ip]) >= self.max_requests:
            return False

        # Record request
        self.requests[ip].append(now)
        return True

    def get_remaining(self, ip: str) -> int:
        """Get remaining requests for IP"""
        now = time.time()
        self.requests[ip] = [ts for ts in self.requests[ip] if now - ts < self.window_seconds]
        return max(0, self.max_requests - len(self.requests[ip]))

# Initialize rate limiter: 5 requests per hour per IP
demo_rate_limiter = SimpleRateLimiter(max_requests=5, window_seconds=3600)

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
    Disconnect Gmail account (delete stored tokens and ALL user data including email-logs)
    """
    try:
        logger.info(f"🔌 Disconnect requested for user: {user_id}")

        # Import cleanup utility
        from .services.dynamodb_cleanup import DynamoDBCleanup

        # Delete OAuth tokens
        token_deleted = token_storage.delete_token(user_id)
        logger.info(f"Token deletion result: {token_deleted}")

        # Clear last_sync timestamp from poller to force fresh sync on reconnect
        if user_id in gmail_poller.last_sync:
            del gmail_poller.last_sync[user_id]
            logger.info(f"Cleared last_sync timestamp for user: {user_id}")

        # Clean up all user data INCLUDING email-logs
        # This allows re-processing emails if user reconnects
        cleanup = DynamoDBCleanup()
        cleanup_result = cleanup.cleanup_all_user_data(user_id, include_email_logs=True)

        logger.info(f"Cleanup result: {cleanup_result}")

        if token_deleted and cleanup_result['success']:
            logger.info(f"Gmail disconnected and data cleaned for user: {user_id} ({cleanup_result['total_deleted']} items)")
            return {
                "message": "Gmail disconnected and all data removed successfully",
                "user_id": user_id,
                "items_deleted": cleanup_result['total_deleted'],
                "details": cleanup_result['details']
            }
        else:
            error_msg = f"Token deleted: {token_deleted}, Cleanup success: {cleanup_result['success']}"
            logger.error(f"Disconnect validation failed: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to disconnect Gmail or clean data - {error_msg}")

    except Exception as e:
        logger.error(f"Disconnect failed for {user_id}: {e}", exc_info=True)
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

@app.post("/demo/process-email")
async def process_demo_email(
    request: Request,
    email_text: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """
    Demo endpoint: Process email text with real AI extraction

    **Public endpoint** - No authentication required
    **Rate limited** - 5 requests per hour per IP
    **No persistence** - Results not saved to database

    Args:
        email_text: Raw email content (with From, Subject, Body)

    Returns:
        Extracted deals, tasks, and contacts with confidence scores
    """
    try:
        # Get client IP for rate limiting
        client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        if not demo_rate_limiter.is_allowed(client_ip):
            remaining = demo_rate_limiter.get_remaining(client_ip)
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. You can process {demo_rate_limiter.max_requests} emails per hour. Try again later."
            )

        # Validate email length (max 5KB to prevent abuse)
        if len(email_text) > 5000:
            raise HTTPException(
                status_code=400,
                detail="Email too large. Maximum 5000 characters allowed for demo."
            )

        if len(email_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Email content too short. Please provide valid email text."
            )

        logger.info(f"[DEMO] Processing email from IP: {client_ip} (length: {len(email_text)} chars)")

        # Process through LangGraph workflow (same as real endpoint)
        result = await workflow.process_email(email_text, source="demo")

        # Add rate limit info to response
        result["rate_limit"] = {
            "remaining": demo_rate_limiter.get_remaining(client_ip),
            "limit": demo_rate_limiter.max_requests,
            "window": "1 hour"
        }

        # Add demo disclaimer
        result["demo_mode"] = True
        result["note"] = "Demo extraction - results not saved to database"

        logger.info(f"[DEMO] Processing complete: {result['status']} (IP: {client_ip})")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DEMO] Error processing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/test/process-email")
async def test_process_email(
    email_text: str = Body(..., embed=True),
    user_id: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """
    Test endpoint: Process email with specified user_id for E2E testing

    **For testing only** - Bypasses Gmail polling but tests full extraction pipeline
    **Persists to database** - Unlike /demo endpoint, saves with correct user_id

    Args:
        email_text: Raw email content (with From, Subject, Body)
        user_id: User ID to associate extracted data with

    Returns:
        Processing results with extracted and persisted data
    """
    try:
        logger.info(f"[TEST] Processing email for user: {user_id} (length: {len(email_text)} chars)")

        # Process through LangGraph workflow with user_id
        result = await workflow.process_email(email_text, source="test", user_id=user_id)

        logger.info(f"[TEST] Processing complete: {result['status']} (user: {user_id})")

        return result

    except Exception as e:
        logger.error(f"[TEST] Error processing email: {str(e)}")
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