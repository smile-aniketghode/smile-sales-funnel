"""
DynamoDB cleanup utilities for testing

Provides functions to delete test data from DynamoDB tables
"""
import boto3
from boto3.dynamodb.conditions import Key
from typing import List, Dict, Any, Optional
import logging
import os

logger = logging.getLogger(__name__)


class DynamoDBCleanup:
    """Utility class for cleaning up test data from DynamoDB"""

    def __init__(self, region: str = None, table_prefix: str = None, endpoint_url: Optional[str] = None):
        # Use environment variables if not provided
        self.region = region if region is not None else os.getenv("AWS_REGION", "us-east-1")
        self.table_prefix = table_prefix if table_prefix is not None else os.getenv("TABLE_PREFIX", "smile-sales-funnel-dev")

        # Support local DynamoDB endpoint
        if endpoint_url is None:
            endpoint_url = os.getenv("DYNAMODB_ENDPOINT")

        self.endpoint_url = endpoint_url
        self.is_local = endpoint_url is not None

        # Initialize DynamoDB resource
        if self.is_local:
            logger.info(f"Cleanup: Using local DynamoDB at {endpoint_url}")
            self.dynamodb = boto3.resource(
                'dynamodb',
                region_name=self.region,
                endpoint_url=endpoint_url,
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy'
            )
        else:
            logger.info(f"Cleanup: Using AWS DynamoDB in region {self.region}")
            self.dynamodb = boto3.resource('dynamodb', region_name=self.region)

        # Table references
        self.tables = {
            'tasks': self.dynamodb.Table(f"{self.table_prefix}-tasks"),
            'deals': self.dynamodb.Table(f"{self.table_prefix}-deals"),
            'email_logs': self.dynamodb.Table(f"{self.table_prefix}-email-logs"),
            'people': self.dynamodb.Table(f"{self.table_prefix}-people"),
            'companies': self.dynamodb.Table(f"{self.table_prefix}-companies")
        }

    def delete_task(self, task_id: str) -> bool:
        """Delete a single task by ID"""
        try:
            self.tables['tasks'].delete_item(Key={'id': task_id})
            logger.info(f"✅ Deleted task: {task_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete task {task_id}: {e}")
            return False

    def delete_deal(self, deal_id: str) -> bool:
        """Delete a single deal by ID"""
        try:
            self.tables['deals'].delete_item(Key={'id': deal_id})
            logger.info(f"✅ Deleted deal: {deal_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete deal {deal_id}: {e}")
            return False

    def delete_person(self, person_id: str) -> bool:
        """Delete a single person/contact by ID"""
        try:
            self.tables['people'].delete_item(Key={'id': person_id})
            logger.info(f"✅ Deleted person: {person_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete person {person_id}: {e}")
            return False

    def delete_email_log(self, message_hash: str) -> bool:
        """Delete a single email log by message hash"""
        try:
            self.tables['email_logs'].delete_item(Key={'message_id_hash': message_hash})
            logger.info(f"✅ Deleted email log: {message_hash[:16]}...")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete email log {message_hash[:16]}...: {e}")
            return False

    def delete_tasks_by_user(self, user_id: str, limit: int = 100) -> Dict[str, Any]:
        """Delete all tasks for a user (batch delete)"""
        try:
            logger.debug(f"Querying tasks table: {self.tables['tasks'].name}, Index: user_id-created_at-index, User: {user_id}")
            response = self.tables['tasks'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Limit=limit
            )

            items = response.get('Items', [])
            deleted_count = 0

            for item in items:
                if self.delete_task(item['id']):
                    deleted_count += 1

            logger.info(f"✅ Deleted {deleted_count} tasks for user: {user_id}")
            return {
                'deleted': deleted_count,
                'total': len(items),
                'success': deleted_count == len(items)
            }
        except Exception as e:
            logger.error(f"❌ Failed to delete tasks for user {user_id}: {e}")
            return {'deleted': 0, 'total': 0, 'success': False, 'error': str(e)}

    def delete_deals_by_user(self, user_id: str, limit: int = 100) -> Dict[str, Any]:
        """Delete all deals for a user (batch delete)"""
        try:
            response = self.tables['deals'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Limit=limit
            )

            items = response.get('Items', [])
            deleted_count = 0

            for item in items:
                if self.delete_deal(item['id']):
                    deleted_count += 1

            logger.info(f"✅ Deleted {deleted_count} deals for user: {user_id}")
            return {
                'deleted': deleted_count,
                'total': len(items),
                'success': deleted_count == len(items)
            }
        except Exception as e:
            logger.error(f"❌ Failed to delete deals for user {user_id}: {e}")
            return {'deleted': 0, 'total': 0, 'success': False, 'error': str(e)}

    def delete_people_by_user(self, user_id: str, limit: int = 100) -> Dict[str, Any]:
        """Delete all people/contacts for a user (batch delete)"""
        try:
            response = self.tables['people'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Limit=limit
            )

            items = response.get('Items', [])
            deleted_count = 0

            for item in items:
                if self.delete_person(item['id']):
                    deleted_count += 1

            logger.info(f"✅ Deleted {deleted_count} contacts for user: {user_id}")
            return {
                'deleted': deleted_count,
                'total': len(items),
                'success': deleted_count == len(items)
            }
        except Exception as e:
            logger.error(f"❌ Failed to delete contacts for user {user_id}: {e}")
            return {'deleted': 0, 'total': 0, 'success': False, 'error': str(e)}

    def delete_email_logs_by_user(self, user_id: str) -> Dict[str, Any]:
        """Delete all email logs for a user (uses scan - no GSI required)"""
        try:
            # Use scan with filter since email-logs table doesn't have user_id GSI
            response = self.tables['email_logs'].scan(
                FilterExpression='user_id = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )

            items = response.get('Items', [])
            deleted_count = 0

            for item in items:
                if self.delete_email_log(item['message_id_hash']):
                    deleted_count += 1

            logger.info(f"✅ Deleted {deleted_count} email logs for user: {user_id}")
            return {
                'deleted': deleted_count,
                'total': len(items),
                'success': deleted_count == len(items)
            }
        except Exception as e:
            logger.error(f"❌ Failed to delete email logs for user {user_id}: {e}")
            return {'deleted': 0, 'total': 0, 'success': False, 'error': str(e)}

    def cleanup_all_user_data(self, user_id: str, include_email_logs: bool = False) -> Dict[str, Any]:
        """
        Complete cleanup: delete all tasks, deals, and contacts for a user

        Args:
            user_id: User identifier
            include_email_logs: If True, also delete email-logs (for disconnect).
                              If False, preserve email-logs for idempotency (for testing)
        """
        logger.info(f"🧹 Starting complete cleanup for user: {user_id} (include_email_logs: {include_email_logs})")

        results = {
            'user_id': user_id,
            'tasks': self.delete_tasks_by_user(user_id),
            'deals': self.delete_deals_by_user(user_id),
            'people': self.delete_people_by_user(user_id)
        }

        if include_email_logs:
            results['email_logs'] = self.delete_email_logs_by_user(user_id)

        total_deleted = (
            results['tasks'].get('deleted', 0) +
            results['deals'].get('deleted', 0) +
            results['people'].get('deleted', 0) +
            results.get('email_logs', {}).get('deleted', 0)
        )

        logger.info(f"✅ Cleanup complete. Total items deleted: {total_deleted}")

        # Check success for each component (handle errors gracefully)
        all_success = True
        check_keys = ['tasks', 'deals', 'people']
        if include_email_logs:
            check_keys.append('email_logs')

        for key in check_keys:
            if isinstance(results[key], dict):
                all_success = all_success and results[key].get('success', False)
            else:
                all_success = False

        return {
            'success': all_success,
            'total_deleted': total_deleted,
            'details': results
        }

    def get_user_data_counts(self, user_id: str) -> Dict[str, int]:
        """Get counts of all data for a user (for verification)"""
        try:
            counts = {}

            # Count tasks
            response = self.tables['tasks'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Select='COUNT'
            )
            counts['tasks'] = response.get('Count', 0)

            # Count deals
            response = self.tables['deals'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Select='COUNT'
            )
            counts['deals'] = response.get('Count', 0)

            # Count people
            response = self.tables['people'].query(
                IndexName='user_id-created_at-index',
                KeyConditionExpression=Key('user_id').eq(user_id),
                Select='COUNT'
            )
            counts['people'] = response.get('Count', 0)

            return counts

        except Exception as e:
            logger.error(f"Failed to get counts for user {user_id}: {e}")
            return {'tasks': -1, 'deals': -1, 'people': -1, 'error': str(e)}
