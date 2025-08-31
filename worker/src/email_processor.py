import logging
from typing import Dict, Any

from .graph.workflow import EmailProcessingWorkflow
from .services.dynamodb_client import DynamoDBClient

logger = logging.getLogger(__name__)


class EmailProcessor:
    """Main email processing pipeline using LangGraph workflow"""
    
    def __init__(
        self, 
        confidence_threshold: float = 0.8,
        llm_model: str = "gpt-3.5-turbo",
        llm_base_url: str = None
    ):
        """
        Initialize email processor with LangGraph workflow
        
        Args:
            confidence_threshold: Confidence threshold for auto-approval
            llm_model: LLM model to use for extraction
            llm_base_url: Base URL for LLM API (for local models)
        """
        self.workflow = EmailProcessingWorkflow(
            confidence_threshold=confidence_threshold,
            llm_model=llm_model,
            llm_base_url=llm_base_url
        )
        self.db_client = DynamoDBClient()
    
    async def process_email(self, mime_content: str, source: str = "manual") -> Dict[str, Any]:
        """
        Process a single email through the LangGraph workflow
        
        Args:
            mime_content: Raw MIME email content
            source: Source identifier for tracking
            
        Returns:
            Processing results with tasks, deals, and metadata
        """
        # Check for idempotency first
        import email
        from .models import EmailLog
        
        try:
            email_msg = email.message_from_string(mime_content)
            message_id = email_msg.get('Message-ID', f"unknown-{int(time.time())}")
            content = self._extract_text_content(email_msg)
            message_hash = EmailLog.generate_message_hash(message_id, content)
            
            # Check if already processed
            existing_log = await self.db_client.get_email_log(message_hash)
            if existing_log:
                logger.info(f"Email already processed: {message_hash}")
                return {
                    "status": "already_processed",
                    "message_hash": message_hash,
                    "original_results": existing_log
                }
        except Exception as e:
            logger.error(f"Idempotency check failed: {e}")
        
        # Process through LangGraph workflow
        return await self.workflow.process_email(mime_content, source)
    
    def _extract_text_content(self, email_msg) -> str:
        """Extract text content from email message"""
        content_parts = []
        
        if email_msg.is_multipart():
            for part in email_msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        content_parts.append(part.get_content())
                    except Exception:
                        continue
        else:
            if email_msg.get_content_type() == "text/plain":
                try:
                    content_parts.append(email_msg.get_content())
                except Exception:
                    pass
        
        return "\n\n".join(content_parts)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return await self.db_client.get_processing_stats()