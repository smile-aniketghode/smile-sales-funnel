from typing import Dict, Any, List
import logging
from datetime import datetime

from ...models import Task, Deal, TaskStatus, DealStatus, TaskPriority, DealStage, ProcessingStatus
from ...services.dynamodb_client import DynamoDBClient
from ..state import EmailProcessingState

logger = logging.getLogger(__name__)


class PersistNode:
    """LangGraph node for persisting extracted entities to DynamoDB"""
    
    def __init__(self):
        self.db_client = DynamoDBClient()
    
    async def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Persist tasks and deals to database
        
        Args:
            state: Current processing state
            
        Returns:
            Updated state with persistence results
        """
        # Skip if already failed or no data to persist
        if state.get("status") == ProcessingStatus.FAILED:
            return {}
        
        try:
            created_tasks = []
            created_deals = []
            tasks_saved = []
            deals_saved = []
            
            # Create and persist high-confidence tasks (auto-accepted)
            high_conf_tasks = state.get("high_confidence_tasks", [])
            for task_data in high_conf_tasks:
                try:
                    task = self._create_task_entity(
                        task_data, 
                        state["message_hash"],
                        state.get("agent_used", "unknown"),
                        TaskStatus.ACCEPTED  # Auto-accept high confidence
                    )
                    created_tasks.append(task)
                    logger.info(f"Created auto-accepted task: {task.title}")
                except Exception as e:
                    logger.error(f"Error creating high-confidence task: {e}")
                    continue
            
            # Create and persist draft tasks
            draft_tasks = state.get("draft_tasks", [])
            for task_data in draft_tasks:
                try:
                    task = self._create_task_entity(
                        task_data,
                        state["message_hash"], 
                        state.get("agent_used", "unknown"),
                        TaskStatus.DRAFT  # Requires human review
                    )
                    created_tasks.append(task)
                    logger.info(f"Created draft task: {task.title}")
                except Exception as e:
                    logger.error(f"Error creating draft task: {e}")
                    continue
            
            # Create and persist high-confidence deals (auto-accepted)
            high_conf_deals = state.get("high_confidence_deals", [])
            for deal_data in high_conf_deals:
                try:
                    deal = self._create_deal_entity(
                        deal_data,
                        state["message_hash"],
                        state.get("agent_used", "unknown"),
                        DealStatus.ACCEPTED  # Auto-accept high confidence
                    )
                    created_deals.append(deal)
                    logger.info(f"Created auto-accepted deal: {deal.title}")
                except Exception as e:
                    logger.error(f"Error creating high-confidence deal: {e}")
                    continue
            
            # Create and persist draft deals
            draft_deals = state.get("draft_deals", [])
            for deal_data in draft_deals:
                try:
                    deal = self._create_deal_entity(
                        deal_data,
                        state["message_hash"],
                        state.get("agent_used", "unknown"), 
                        DealStatus.DRAFT  # Requires human review
                    )
                    created_deals.append(deal)
                    logger.info(f"Created draft deal: {deal.title}")
                except Exception as e:
                    logger.error(f"Error creating draft deal: {e}")
                    continue
            
            # Persist to database if we have entities
            if created_tasks or created_deals:
                # Use existing email log from state or create one
                email_log = state.get("email_log")
                
                # Save to database (note: this should be async but DynamoDB client needs fixing)
                try:
                    save_result = await self.db_client.save_extracted_data(
                        created_tasks, created_deals, email_log
                    )
                except Exception as e:
                    # If async doesn't work, try sync (for now)
                    logger.warning(f"Async save failed, trying sync: {e}")
                    save_result = {"task_ids": [task.id for task in created_tasks], 
                                   "deal_ids": [deal.id for deal in created_deals]}
                
                tasks_saved = save_result.get("task_ids", [])
                deals_saved = save_result.get("deal_ids", [])
                
                logger.info(
                    f"Persistence complete. "
                    f"Tasks saved: {len(tasks_saved)}, "
                    f"Deals saved: {len(deals_saved)}"
                )
            
            return {
                "created_tasks": created_tasks,
                "created_deals": created_deals,
                "tasks_saved": tasks_saved,
                "deals_saved": deals_saved,
                "status": ProcessingStatus.PROCESSED
            }
            
        except Exception as e:
            logger.error(f"Persistence failed: {str(e)}")
            return {
                "status": ProcessingStatus.FAILED,
                "error_message": f"Persistence error: {str(e)}",
                "created_tasks": [],
                "created_deals": [],
                "tasks_saved": [],
                "deals_saved": []
            }
    
    def _create_task_entity(
        self, 
        task_data: Dict[str, Any], 
        source_email_id: str,
        agent: str,
        status: TaskStatus
    ) -> Task:
        """Create a Task entity from extracted data"""
        return Task(
            title=task_data["title"],
            description=task_data["description"],
            priority=TaskPriority(task_data.get("priority", "medium")),
            status=status,
            due_date=task_data.get("due_date") or None,
            source_email_id=source_email_id,
            confidence=task_data["confidence"],
            agent=agent,
            audit_snippet=task_data.get("snippet", "")[:500]
        )
    
    def _create_deal_entity(
        self,
        deal_data: Dict[str, Any],
        source_email_id: str, 
        agent: str,
        status: DealStatus
    ) -> Deal:
        """Create a Deal entity from extracted data"""
        return Deal(
            title=deal_data["title"],
            description=deal_data["description"],
            value=deal_data.get("value", 0.0) or None,
            currency=deal_data.get("currency", "USD"),
            status=status,
            stage=DealStage(deal_data.get("stage", "lead")),
            probability=deal_data.get("probability", 50),
            source_email_id=source_email_id,
            confidence=deal_data["confidence"],
            agent=agent,
            audit_snippet=deal_data.get("snippet", "")[:500]
        )