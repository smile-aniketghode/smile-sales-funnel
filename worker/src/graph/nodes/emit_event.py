from typing import Dict, Any, List
import logging
from datetime import datetime

from ..state import EmailProcessingState

logger = logging.getLogger(__name__)


class EmitEventNode:
    """LangGraph node for emitting events for downstream processing"""
    
    def __init__(self):
        pass
    
    def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Emit events for downstream systems
        
        Args:
            state: Current processing state
            
        Returns:
            Updated state with events to emit
        """
        try:
            events = []
            
            # Create processing completion event
            completion_event = {
                "type": "email.processing.completed",
                "timestamp": datetime.utcnow().isoformat(),
                "message_id": state["message_id"],
                "message_hash": state["message_hash"],
                "status": state.get("status"),
                "processing_time_ms": state.get("processing_time_ms", 0),
                "summary": {
                    "tasks_created": len(state.get("tasks_saved", [])),
                    "deals_created": len(state.get("deals_saved", [])),
                    "high_confidence_tasks": len(state.get("high_confidence_tasks", [])),
                    "high_confidence_deals": len(state.get("high_confidence_deals", [])),
                    "tokens_used": state.get("tokens_used", 0),
                    "business_score": state.get("business_score", 0.0)
                }
            }
            events.append(completion_event)
            
            # Create events for high-confidence auto-approvals
            high_conf_tasks = state.get("high_confidence_tasks", [])
            for i, task in enumerate(high_conf_tasks):
                if i < len(state.get("tasks_saved", [])):  # Ensure it was actually saved
                    task_id = state["tasks_saved"][i]
                    event = {
                        "type": "task.auto_approved",
                        "timestamp": datetime.utcnow().isoformat(),
                        "task_id": task_id,
                        "title": task["title"],
                        "confidence": task["confidence"],
                        "source_email": state["message_id"]
                    }
                    events.append(event)
            
            high_conf_deals = state.get("high_confidence_deals", [])
            deal_start_idx = len(state.get("tasks_saved", []))
            for i, deal in enumerate(high_conf_deals):
                saved_deals = state.get("deals_saved", [])
                if i < len(saved_deals):  # Ensure it was actually saved
                    deal_id = saved_deals[i]
                    event = {
                        "type": "deal.auto_approved", 
                        "timestamp": datetime.utcnow().isoformat(),
                        "deal_id": deal_id,
                        "title": deal["title"],
                        "confidence": deal["confidence"],
                        "value": deal.get("value"),
                        "source_email": state["message_id"]
                    }
                    events.append(event)
            
            # Create events for items requiring human review
            draft_tasks = state.get("draft_tasks", [])
            if draft_tasks:
                event = {
                    "type": "tasks.require_review",
                    "timestamp": datetime.utcnow().isoformat(),
                    "count": len(draft_tasks),
                    "source_email": state["message_id"],
                    "tasks": [{"title": t["title"], "confidence": t["confidence"]} for t in draft_tasks]
                }
                events.append(event)
            
            draft_deals = state.get("draft_deals", [])
            if draft_deals:
                event = {
                    "type": "deals.require_review",
                    "timestamp": datetime.utcnow().isoformat(),
                    "count": len(draft_deals),
                    "source_email": state["message_id"], 
                    "deals": [{"title": d["title"], "confidence": d["confidence"], "value": d.get("value")} for d in draft_deals]
                }
                events.append(event)
            
            # Log events (in production, these would go to event bus, webhooks, etc.)
            for event in events:
                logger.info(f"Emitting event: {event['type']}")
            
            return {
                "events_to_emit": events
            }
            
        except Exception as e:
            logger.error(f"Event emission failed: {str(e)}")
            return {
                "events_to_emit": [],
                "error_message": f"Event emission error: {str(e)}"
            }