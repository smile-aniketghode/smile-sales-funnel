import time
import email
from typing import Dict, Any
from email.message import EmailMessage

from ...models import PrefilterResult, ProcessingStatus
from ...services.prefilter import PrefilterService
from ..state import EmailProcessingState


class PreFilterNode:
    """LangGraph node for email prefiltering"""
    
    def __init__(self):
        self.prefilter_service = PrefilterService()
    
    async def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Execute prefiltering logic
        
        Args:
            state: Current processing state
            
        Returns:
            Updated state with prefilter results
        """
        try:
            # Parse email message
            email_msg = email.message_from_string(state["raw_content"])
            
            # Extract text content
            content = self._extract_text_content(email_msg)
            
            # Apply prefilter
            filter_result, filtered_content = await self.prefilter_service.process(content, email_msg)
            business_score = self.prefilter_service._calculate_business_score(content, email_msg)
            
            # Update state
            updates = {
                "prefilter_result": filter_result,
                "filtered_content": filtered_content,
                "business_score": business_score,
            }
            
            # If filtered out, set status and skip further processing
            if filter_result != PrefilterResult.PASSED:
                updates["status"] = ProcessingStatus.SKIPPED
                updates["error_message"] = f"Filtered out: {filter_result.value}"
            
            return updates
            
        except Exception as e:
            return {
                "status": ProcessingStatus.FAILED,
                "error_message": f"Prefilter error: {str(e)}",
                "prefilter_result": PrefilterResult.FILTERED_OUT,
                "filtered_content": "",
                "business_score": 0.0
            }
    
    def _extract_text_content(self, email_msg: EmailMessage) -> str:
        """Extract text content from email message"""
        content_parts = []
        
        if email_msg.is_multipart():
            for part in email_msg.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        content_parts.append(part.get_payload(decode=True).decode('utf-8'))
                    except Exception:
                        continue
        else:
            if email_msg.get_content_type() == "text/plain":
                try:
                    payload = email_msg.get_payload()
                    if isinstance(payload, str):
                        content_parts.append(payload)
                    else:
                        content_parts.append(payload.decode('utf-8'))
                except Exception:
                    pass
        
        return "\n\n".join(content_parts)