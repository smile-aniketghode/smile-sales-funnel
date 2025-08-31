from typing import Dict, Any, List
import logging

from ..state import EmailProcessingState

logger = logging.getLogger(__name__)


class ConfidenceGateNode:
    """LangGraph node for confidence-based routing"""
    
    def __init__(self, confidence_threshold: float = 0.8):
        """
        Initialize confidence gate
        
        Args:
            confidence_threshold: Threshold above which items are auto-approved
        """
        self.confidence_threshold = confidence_threshold
    
    def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Route tasks and deals based on confidence scores
        
        Args:
            state: Current processing state
            
        Returns:
            Updated state with confidence-gated items
        """
        # Skip if no extraction results
        extraction_result = state.get("extraction_result", {})
        if not extraction_result:
            return {
                "high_confidence_tasks": [],
                "draft_tasks": [],
                "high_confidence_deals": [],
                "draft_deals": []
            }
        
        try:
            tasks = extraction_result.get("tasks", [])
            deals = extraction_result.get("deals", [])
            
            # Separate tasks by confidence
            high_confidence_tasks = []
            draft_tasks = []
            
            for task in tasks:
                confidence = task.get("confidence", 0.0)
                if confidence >= self.confidence_threshold:
                    high_confidence_tasks.append(task)
                    logger.info(f"High confidence task: {task['title']} ({confidence:.2f})")
                else:
                    draft_tasks.append(task)
                    logger.info(f"Draft task: {task['title']} ({confidence:.2f})")
            
            # Separate deals by confidence  
            high_confidence_deals = []
            draft_deals = []
            
            for deal in deals:
                confidence = deal.get("confidence", 0.0)
                if confidence >= self.confidence_threshold:
                    high_confidence_deals.append(deal)
                    logger.info(f"High confidence deal: {deal['title']} ({confidence:.2f})")
                else:
                    draft_deals.append(deal)
                    logger.info(f"Draft deal: {deal['title']} ({confidence:.2f})")
            
            logger.info(
                f"Confidence gating complete. "
                f"High conf tasks: {len(high_confidence_tasks)}, "
                f"Draft tasks: {len(draft_tasks)}, "
                f"High conf deals: {len(high_confidence_deals)}, "
                f"Draft deals: {len(draft_deals)}"
            )
            
            return {
                "high_confidence_tasks": high_confidence_tasks,
                "draft_tasks": draft_tasks,
                "high_confidence_deals": high_confidence_deals,
                "draft_deals": draft_deals
            }
            
        except Exception as e:
            logger.error(f"Confidence gating failed: {str(e)}")
            return {
                "high_confidence_tasks": [],
                "draft_tasks": extraction_result.get("tasks", []),
                "high_confidence_deals": [],
                "draft_deals": extraction_result.get("deals", []),
                "error_message": f"Confidence gate error: {str(e)}"
            }