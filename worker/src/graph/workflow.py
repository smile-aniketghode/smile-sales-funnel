import time
import email
import hashlib
from datetime import datetime
from typing import Dict, Any, Literal
import logging

from langgraph.graph import StateGraph, END

from .state import EmailProcessingState
from .nodes import (
    PreFilterNode,
    ExtractLocalNode, 
    ConfidenceGateNode,
    PersistNode,
    EmitEventNode
)
from ..models import EmailLog, PrefilterResult, ProcessingStatus
from ..utils import extract_text_content, extract_email_address

logger = logging.getLogger(__name__)


class EmailProcessingWorkflow:
    """LangGraph workflow for email processing pipeline"""
    
    def __init__(
        self, 
        confidence_threshold: float = 0.8,
        llm_model: str = "llama3.2",
        llm_base_url: str = "http://localhost:11434"
    ):
        """
        Initialize the workflow
        
        Args:
            confidence_threshold: Confidence threshold for auto-approval
            llm_model: Ollama model to use for extraction
            llm_base_url: Base URL for Ollama API
        """
        self.confidence_threshold = confidence_threshold
        
        # Initialize nodes
        self.prefilter_node = PreFilterNode()
        # ExtractLocalNode auto-detects provider, model from env vars
        self.extract_node = ExtractLocalNode()
        self.confidence_gate_node = ConfidenceGateNode(confidence_threshold)
        self.persist_node = PersistNode()
        self.emit_event_node = EmitEventNode()
        
        # Build the graph
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Define the workflow graph
        workflow = StateGraph(EmailProcessingState)
        
        # Add nodes
        workflow.add_node("prefilter", self.prefilter_node)
        workflow.add_node("extract_local", self.extract_node)
        workflow.add_node("confidence_gate", self.confidence_gate_node)
        workflow.add_node("persist", self.persist_node)
        workflow.add_node("emit_event", self.emit_event_node)
        
        # Define the flow
        workflow.set_entry_point("prefilter")
        
        # Conditional routing after prefilter
        workflow.add_conditional_edges(
            "prefilter",
            self._should_continue_after_prefilter,
            {
                "continue": "extract_local",
                "skip": "emit_event"
            }
        )
        
        # Linear flow for successful processing
        workflow.add_edge("extract_local", "confidence_gate")
        workflow.add_edge("confidence_gate", "persist")
        workflow.add_edge("persist", "emit_event")
        workflow.add_edge("emit_event", END)
        
        return workflow
    
    def _should_continue_after_prefilter(
        self, 
        state: EmailProcessingState
    ) -> Literal["continue", "skip"]:
        """Determine whether to continue processing after prefilter"""
        prefilter_result = state.get("prefilter_result")
        status = state.get("status")
        
        # Skip if filtered out or failed
        if (prefilter_result != PrefilterResult.PASSED or 
            status in [ProcessingStatus.FAILED, ProcessingStatus.SKIPPED]):
            return "skip"
        
        return "continue"
    
    async def process_email(
        self,
        mime_content: str,
        source: str = "manual",
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Process an email through the complete LangGraph pipeline

        Args:
            mime_content: Raw MIME email content
            source: Source identifier
            user_id: User/Gmail account that owns this email

        Returns:
            Processing results
        """
        start_time = time.time()
        
        try:
            # Parse email to extract metadata
            email_msg = email.message_from_string(mime_content)
            message_id = email_msg.get('Message-ID', f"unknown-{int(time.time())}")
            subject = email_msg.get('Subject', '')
            sender_email = extract_email_address(email_msg.get('From', ''))
            
            # Generate message hash for idempotency
            content = extract_text_content(email_msg)
            message_hash = EmailLog.generate_message_hash(message_id, content)
            
            # Create initial state
            initial_state: EmailProcessingState = {
                "message_id": message_id,
                "subject": subject,
                "sender_email": sender_email,
                "raw_content": mime_content,
                "source": source,
                "user_id": user_id or "default_user",  # Fallback for backward compatibility
                "message_hash": message_hash,
                "start_time": start_time,
                "processing_time_ms": 0,
                "prefilter_result": PrefilterResult.PASSED,
                "filtered_content": "",
                "business_score": 0.0,
                "extraction_result": {},
                "tokens_used": 0,
                "agent_used": "",
                "high_confidence_tasks": [],
                "draft_tasks": [],
                "high_confidence_deals": [],
                "draft_deals": [],
                "created_tasks": [],
                "created_deals": [],
                "tasks_saved": [],
                "deals_saved": [],
                "email_log": EmailLog(
                    message_id_hash=message_hash,
                    original_message_id=message_id,
                    user_id=user_id or "default_user",
                    subject=subject[:500],
                    sender_email=sender_email,
                    prefilter_result=PrefilterResult.PASSED
                ),
                "status": ProcessingStatus.PROCESSED,
                "error_message": None,
                "events_to_emit": []
            }
            
            logger.info(f"Starting email processing workflow for: {message_id}")
            
            # Execute the workflow
            final_state = await self.app.ainvoke(initial_state)
            
            # Calculate final processing time
            processing_time = int((time.time() - start_time) * 1000)
            final_state["processing_time_ms"] = processing_time
            
            # Update email log
            if "email_log" in final_state:
                email_log = final_state["email_log"]
                email_log.processing_time_ms = processing_time
                email_log.status = final_state.get("status", ProcessingStatus.PROCESSED)
                email_log.llm_tokens_used = final_state.get("tokens_used", 0)
                email_log.tasks_created = final_state.get("tasks_saved", [])
                email_log.deals_created = final_state.get("deals_saved", [])
            
            logger.info(
                f"Workflow complete in {processing_time}ms. "
                f"Status: {final_state.get('status')}, "
                f"Tasks: {len(final_state.get('tasks_saved', []))}, "
                f"Deals: {len(final_state.get('deals_saved', []))}"
            )
            
            # Return summary results
            return {
                "status": "success",
                "message_hash": message_hash,
                "processing_time_ms": processing_time,
                "results": {
                    "tasks_created": len(final_state.get("tasks_saved", [])),
                    "deals_created": len(final_state.get("deals_saved", [])),
                    "high_confidence_tasks": len(final_state.get("high_confidence_tasks", [])),
                    "high_confidence_deals": len(final_state.get("high_confidence_deals", [])),
                    "tokens_used": final_state.get("tokens_used", 0),
                    "business_score": final_state.get("business_score", 0.0),
                    "prefilter_result": final_state.get("prefilter_result"),
                    "events_emitted": len(final_state.get("events_to_emit", []))
                },
                "tasks": [task.model_dump() for task in final_state.get("created_tasks", [])],
                "deals": [deal.model_dump() for deal in final_state.get("created_deals", [])],
                "events": final_state.get("events_to_emit", [])
            }
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"Workflow failed after {processing_time}ms: {str(e)}")
            
            return {
                "status": "error",
                "message": str(e),
                "processing_time_ms": processing_time,
                "results": {
                    "tasks_created": 0,
                    "deals_created": 0,
                    "high_confidence_tasks": 0,
                    "high_confidence_deals": 0,
                    "tokens_used": 0,
                    "business_score": 0.0
                }
            }
    
