import boto3
from boto3.dynamodb.conditions import Key, Attr
from typing import Dict, Any, List, Optional
import logging
import os
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

from ..models import Task, Deal, EmailLog, Person, Company
from botocore.exceptions import ClientError as BotoClientError

logger = logging.getLogger(__name__)


class DynamoDBClient:
    """DynamoDB client for persisting extracted data (supports local and AWS)"""

    def __init__(self, region: str = None, table_prefix: str = None, endpoint_url: Optional[str] = None):
        # Use environment variables if not provided
        self.region = region or os.getenv("AWS_REGION", "us-east-1")
        self.table_prefix = table_prefix or os.getenv("TABLE_PREFIX", "smile-sales-funnel-dev")

        # Support local DynamoDB endpoint
        if endpoint_url is None:
            endpoint_url = os.getenv("DYNAMODB_ENDPOINT")

        self.endpoint_url = endpoint_url
        self.is_local = endpoint_url is not None

        # Initialize DynamoDB resource
        if self.is_local:
            logger.info(f"Using local DynamoDB at {endpoint_url}")
            self.dynamodb = boto3.resource(
                'dynamodb',
                region_name=region,
                endpoint_url=endpoint_url,
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy'
            )
        else:
            logger.info(f"Using AWS DynamoDB in region {region}")
            self.dynamodb = boto3.resource('dynamodb', region_name=region)

        # Table references
        self.tables = {
            'tasks': self.dynamodb.Table(f"{table_prefix}-tasks"),
            'deals': self.dynamodb.Table(f"{table_prefix}-deals"),
            'email_log': self.dynamodb.Table(f"{table_prefix}-email-logs"),
            'people': self.dynamodb.Table(f"{table_prefix}-people"),
            'companies': self.dynamodb.Table(f"{table_prefix}-companies")
        }
    
    async def save_extracted_data(
        self,
        tasks: List[Task],
        deals: List[Deal],
        people: List[Person],
        email_log: EmailLog
    ) -> Dict[str, Any]:
        """
        Save extracted tasks, deals, and people to DynamoDB

        Args:
            tasks: List of extracted tasks
            deals: List of extracted deals
            people: List of extracted people/contacts
            email_log: Email processing log

        Returns:
            Save operation results
        """
        try:
            saved_tasks = []
            saved_deals = []
            saved_people = []

            # Save people (with upsert logic - update if exists, insert if new)
            for person in people:
                try:
                    # Check if person already exists by email
                    existing = await self.get_person_by_email(person.email)

                    if existing:
                        # Update existing person - merge last_contact_date
                        person.id = existing.get('id')  # Keep existing ID
                        # Note: In production, you'd do more sophisticated merging
                        logger.debug(f"Updating existing person: {person.email}")

                    self.tables['people'].put_item(Item=person.to_dynamodb_item())
                    saved_people.append(person.id)
                    logger.debug(f"Saved person: {person.get_display_name()} ({person.email})")
                except Exception as e:
                    logger.error(f"Error saving person {person.email}: {e}")
                    continue

            # Save tasks
            for task in tasks:
                try:
                    self.tables['tasks'].put_item(Item=task.to_dynamodb_item())
                    saved_tasks.append(task.id)
                    logger.debug(f"Saved task: {task.id}")
                except Exception as e:
                    logger.error(f"Error saving task {task.id}: {e}")
                    continue

            # Save deals
            for deal in deals:
                try:
                    self.tables['deals'].put_item(Item=deal.to_dynamodb_item())
                    saved_deals.append(deal.id)
                    logger.debug(f"Saved deal: {deal.id}")
                except Exception as e:
                    logger.error(f"Error saving deal {deal.id}: {e}")
                    continue

            logger.info(f"Saved {len(saved_tasks)} tasks and {len(saved_deals)} deals")

            return {
                "tasks_saved": len(saved_tasks),
                "deals_saved": len(saved_deals),
                "people_saved": len(saved_people),
                "task_ids": saved_tasks,
                "deal_ids": saved_deals,
                "people_ids": saved_people
            }

        except Exception as e:
            logger.error(f"Error saving extracted data: {e}")
            raise
    
    async def save_email_log(self, email_log: EmailLog) -> bool:
        """Save email processing log"""
        try:
            self.tables['email_log'].put_item(Item=email_log.to_dynamodb_item())
            logger.debug(f"Saved email log: {email_log.message_id_hash}")
            return True
        except Exception as e:
            logger.error(f"Error saving email log: {e}")
            return False
    
    async def get_email_log(self, message_hash: str) -> Optional[Dict[str, Any]]:
        """Get email log by message hash for idempotency check"""
        try:
            response = self.tables['email_log'].get_item(
                Key={'message_id_hash': message_hash}
            )
            return response.get('Item')
        except Exception as e:
            logger.error(f"Error getting email log: {e}")
            return None
    
    async def get_tasks(
        self, 
        status: Optional[str] = None, 
        limit: int = 50,
        last_key: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Get tasks with optional status filter"""
        try:
            if status:
                # Query using GSI
                response = self.tables['tasks'].query(
                    IndexName='status-created_at-index',
                    KeyConditionExpression=Key('status').eq(status),
                    ScanIndexForward=False,  # Most recent first
                    Limit=limit,
                    ExclusiveStartKey=last_key if last_key else None
                )
            else:
                # Scan all tasks (expensive - only for development)
                response = self.tables['tasks'].scan(
                    Limit=limit,
                    ExclusiveStartKey=last_key if last_key else None
                )
            
            return {
                "items": response.get('Items', []),
                "last_key": response.get('LastEvaluatedKey'),
                "count": response.get('Count', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting tasks: {e}")
            return {"items": [], "last_key": None, "count": 0}
    
    async def get_deals(
        self, 
        status: Optional[str] = None,
        limit: int = 50,
        last_key: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Get deals with optional status filter"""
        try:
            if status:
                # Query using GSI
                response = self.tables['deals'].query(
                    IndexName='status-created_at-index',
                    KeyConditionExpression=Key('status').eq(status),
                    ScanIndexForward=False,  # Most recent first
                    Limit=limit,
                    ExclusiveStartKey=last_key if last_key else None
                )
            else:
                # Scan all deals (expensive - only for development)
                response = self.tables['deals'].scan(
                    Limit=limit,
                    ExclusiveStartKey=last_key if last_key else None
                )
            
            return {
                "items": response.get('Items', []),
                "last_key": response.get('LastEvaluatedKey'),
                "count": response.get('Count', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting deals: {e}")
            return {"items": [], "last_key": None, "count": 0}
    
    async def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a single task by ID"""
        try:
            response = self.tables['tasks'].get_item(
                Key={'id': task_id}
            )
            return response.get('Item')
        except Exception as e:
            logger.error(f"Error getting task {task_id}: {e}")
            return None
    
    async def get_deal_by_id(self, deal_id: str) -> Optional[Dict[str, Any]]:
        """Get a single deal by ID"""
        try:
            response = self.tables['deals'].get_item(
                Key={'id': deal_id}
            )
            return response.get('Item')
        except Exception as e:
            logger.error(f"Error getting deal {deal_id}: {e}")
            return None

    async def get_person_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a person by email address using the email-index GSI"""
        try:
            response = self.tables['people'].query(
                IndexName='email-index',
                KeyConditionExpression=Key('email').eq(email.lower()),
                Limit=1
            )
            items = response.get('Items', [])
            return items[0] if items else None
        except Exception as e:
            logger.error(f"Error getting person by email {email}: {e}")
            return None

    async def update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Update a task with provided fields"""
        try:
            # Build update expression
            update_expr = "SET updated_at = :updated_at"
            expr_values = {":updated_at": datetime.utcnow().isoformat()}
            
            for key, value in updates.items():
                if key != 'id':  # Don't update the primary key
                    update_expr += f", {key} = :{key}"
                    expr_values[f":{key}"] = value
            
            self.tables['tasks'].update_item(
                Key={'id': task_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values
            )
            
            logger.debug(f"Updated task: {task_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating task {task_id}: {e}")
            return False
    
    async def update_deal(self, deal_id: str, updates: Dict[str, Any]) -> bool:
        """Update a deal with provided fields"""
        try:
            # Build update expression
            update_expr = "SET updated_at = :updated_at"
            expr_values = {":updated_at": datetime.utcnow().isoformat()}
            
            for key, value in updates.items():
                if key != 'id':  # Don't update the primary key
                    update_expr += f", {key} = :{key}"
                    expr_values[f":{key}"] = value
            
            self.tables['deals'].update_item(
                Key={'id': deal_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values
            )
            
            logger.debug(f"Updated deal: {deal_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating deal {deal_id}: {e}")
            return False
    
    async def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics for monitoring"""
        try:
            now = datetime.utcnow()
            week_ago = (now - timedelta(days=7)).isoformat()
            
            # Get recent email logs for stats
            email_logs = self.tables['email_log'].query(
                IndexName='processed_at-index',
                KeyConditionExpression=Key('processed_at').gt(week_ago),
                Limit=1000
            )
            
            # Get draft tasks
            draft_tasks = await self.get_tasks(status='draft', limit=100)
            
            # Get draft deals  
            draft_deals = await self.get_deals(status='draft', limit=100)
            
            # Calculate stats
            logs = email_logs.get('Items', [])
            total_processed = len(logs)
            total_tokens = sum(log.get('llm_tokens_used', 0) for log in logs)
            successful_extractions = len([log for log in logs if 
                                        log.get('status') == 'processed' and 
                                        (log.get('tasks_created', []) or log.get('deals_created', []))])
            
            return {
                "week_stats": {
                    "emails_processed": total_processed,
                    "successful_extractions": successful_extractions,
                    "total_tokens_used": total_tokens,
                    "extraction_rate": successful_extractions / max(total_processed, 1)
                },
                "current_pending": {
                    "draft_tasks": draft_tasks['count'],
                    "draft_deals": draft_deals['count']
                },
                "generated_at": now.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting processing stats: {e}")
            return {
                "week_stats": {"emails_processed": 0, "successful_extractions": 0, "total_tokens_used": 0, "extraction_rate": 0},
                "current_pending": {"draft_tasks": 0, "draft_deals": 0},
                "generated_at": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check DynamoDB connectivity"""
        try:
            # Try to describe one of the tables
            response = self.tables['tasks'].meta.client.describe_table(
                TableName=self.tables['tasks'].table_name
            )
            
            table_status = response['Table']['TableStatus']
            return {
                "status": "healthy" if table_status == "ACTIVE" else "degraded",
                "table_status": table_status,
                "region": self.region
            }
            
        except ClientError as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "region": self.region
            }
        except Exception as e:
            return {
                "status": "unhealthy", 
                "error": str(e),
                "region": self.region
            }