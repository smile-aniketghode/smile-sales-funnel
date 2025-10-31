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
from .nodes.classify_email import ClassifyEmailNode
from ..models import EmailLog, PrefilterResult, ProcessingStatus
from ..utils import extract_text_content, extract_email_address, extract_sender_name

logger = logging.getLogger(__name__)


class EmailProcessingWorkflow:
    """LangGraph workflow for email processing pipeline"""
    
    def __init__(
        self,
        confidence_threshold: float = 0.8,
        llm_model: str = "mistralai/mistral-small-3.2-24b-instruct:free"
    ):
        """
        Initialize the workflow

        Args:
            confidence_threshold: Confidence threshold for auto-approval
            llm_model: OpenRouter model to use for extraction
        """
        self.confidence_threshold = confidence_threshold
        
        # Initialize nodes
        self.classify_node = ClassifyEmailNode()
        self.prefilter_node = PreFilterNode()
        # ExtractLocalNode auto-detects provider, model from env vars
        self.extract_node = ExtractLocalNode()
        self.confidence_gate_node = ConfidenceGateNode(confidence_threshold)
        self.persist_node = PersistNode()
        self.emit_event_node = EmitEventNode()

        # Initialize DynamoDB client for idempotency check
        import os
        from ..services.dynamodb_client import DynamoDBClient
        table_prefix = os.getenv("TABLE_PREFIX", "smile-sales-funnel-dev")
        region = os.getenv("AWS_REGION", "us-east-1")
        endpoint_url = os.getenv("DYNAMODB_ENDPOINT")
        self.db_client = DynamoDBClient(
            region=region,
            table_prefix=table_prefix,
            endpoint_url=endpoint_url
        )
        
        # Build the graph
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Define the workflow graph
        workflow = StateGraph(EmailProcessingState)
        
        # Add nodes
        workflow.add_node("classify", self.classify_node)
        workflow.add_node("prefilter", self.prefilter_node)
        workflow.add_node("extract_local", self.extract_node)
        workflow.add_node("confidence_gate", self.confidence_gate_node)
        workflow.add_node("persist", self.persist_node)
        workflow.add_node("emit_event", self.emit_event_node)

        # Define the flow
        workflow.set_entry_point("classify")

        # Conditional routing after classification
        workflow.add_conditional_edges(
            "classify",
            self._should_continue_after_classification,
            {
                "sales_lead": "prefilter",
                "skip": "emit_event"
            }
        )

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

    def _should_continue_after_classification(
        self,
        state: EmailProcessingState
    ) -> Literal["sales_lead", "skip"]:
        """Determine whether to continue processing after classification"""
        email_category = state.get("email_category")

        # Only process sales leads
        if email_category == "sales_lead":
            return "sales_lead"

        return "skip"

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
            from_header = email_msg.get('From', '')
            sender_email = extract_email_address(from_header)
            sender_name = extract_sender_name(from_header)

            # Generate message hash for idempotency
            content = extract_text_content(email_msg)
            message_hash = EmailLog.generate_message_hash(message_id, content)

            # Check if email was already processed (idempotency)
            existing_log = await self.db_client.get_email_log(message_hash)
            if existing_log:
                logger.info(
                    f"⏭️  Email already processed | "
                    f"From: {sender_email} | "
                    f"Subject: {subject[:50]}... | "
                    f"Hash: {message_hash[:16]}..."
                )
                return {
                    "status": "skipped",
                    "reason": "already_processed",
                    "message_id": message_id,
                    "message_hash": message_hash,
                    "previous_processing_time": existing_log.get("created_at"),
                    "tasks_created": 0,
                    "deals_created": 0
                }

            # Create initial state
            initial_state: EmailProcessingState = {
                "message_id": message_id,
                "subject": subject,
                "sender_email": sender_email,
                "sender_name": sender_name,
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
            
            logger.info(
                f"🔄 Starting workflow | "
                f"From: {sender_email} | "
                f"Subject: {subject[:60]}... | "
                f"ID: {message_id[:30]}..."
            )
            
            # Execute the workflow
            final_state = await self.app.ainvoke(initial_state)
            
            # Calculate final processing time
            processing_time = int((time.time() - start_time) * 1000)
            final_state["processing_time_ms"] = processing_time
            
            # Update and save email log for idempotency
            if "email_log" in final_state:
                email_log = final_state["email_log"]
                email_log.processing_time_ms = processing_time
                email_log.status = final_state.get("status", ProcessingStatus.PROCESSED)
                email_log.llm_tokens_used = final_state.get("tokens_used", 0)
                email_log.tasks_created = final_state.get("tasks_saved", [])
                email_log.deals_created = final_state.get("deals_saved", [])

                # Save email log to database for idempotency tracking
                try:
                    await self.db_client.save_email_log(email_log)
                    logger.debug(f"Saved email log for idempotency: {message_hash[:16]}...")
                except Exception as e:
                    logger.error(f"Failed to save email log: {e}")

            logger.info(
                f"✅ Workflow complete ({processing_time}ms) | "
                f"Status: {final_state.get('status')} | "
                f"Tasks: {len(final_state.get('tasks_saved', []))}, Deals: {len(final_state.get('deals_saved', []))} | "
                f"From: {sender_email} | "
                f"Subject: {subject[:50]}..."
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
            logger.error(
                f"❌ Workflow failed ({processing_time}ms) | "
                f"Error: {str(e)} | "
                f"From: {sender_email} | "
                f"Subject: {subject[:50]}...",
                exc_info=True
            )
            
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
    
