"""DynamoDB storage for Gmail OAuth tokens."""

import os
import boto3
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GmailTokenStorage:
    """Store and retrieve Gmail OAuth tokens from DynamoDB."""

    def __init__(self):
        endpoint = os.getenv("DYNAMODB_ENDPOINT")
        region = os.getenv("AWS_REGION", "us-east-1")
        table_prefix = os.getenv("TABLE_PREFIX", "smile-sales-funnel-dev")

        # Configure DynamoDB client
        config = {"region_name": region}
        if endpoint:
            config["endpoint_url"] = endpoint
            config["aws_access_key_id"] = "dummy"
            config["aws_secret_access_key"] = "dummy"

        self.dynamodb = boto3.resource("dynamodb", **config)
        self.table_name = f"{table_prefix}-gmail-tokens"
        self.table = self.dynamodb.Table(self.table_name)

        logger.info(f"Initialized Gmail token storage with table: {self.table_name}")

    def save_token(self, user_id: str, token_data: Dict[str, Any]) -> bool:
        """Save or update OAuth token for a user."""
        try:
            item = {
                "user_id": user_id,
                **token_data,
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Add created_at if new record
            if not self.get_token(user_id):
                item["created_at"] = datetime.utcnow().isoformat()

            self.table.put_item(Item=item)
            logger.info(f"Saved Gmail token for user: {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to save token for {user_id}: {e}")
            return False

    def get_token(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve OAuth token for a user."""
        try:
            response = self.table.get_item(Key={"user_id": user_id})
            item = response.get("Item")

            if item:
                logger.debug(f"Retrieved Gmail token for user: {user_id}")
                return item
            else:
                logger.debug(f"No token found for user: {user_id}")
                return None

        except Exception as e:
            logger.error(f"Failed to get token for {user_id}: {e}")
            return None

    def delete_token(self, user_id: str) -> bool:
        """Delete OAuth token for a user (disconnect Gmail)."""
        try:
            self.table.delete_item(Key={"user_id": user_id})
            logger.info(f"Deleted Gmail token for user: {user_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete token for {user_id}: {e}")
            return False

    def update_token(self, user_id: str, token_data: Dict[str, Any]) -> bool:
        """Update existing token (used after refresh)."""
        return self.save_token(user_id, token_data)

    def get_all_connected_users(self) -> list:
        """Get list of all users with connected Gmail accounts."""
        try:
            response = self.table.scan()
            items = response.get("Items", [])

            # Extract user_ids
            user_ids = [item["user_id"] for item in items]
            logger.debug(f"Found {len(user_ids)} connected Gmail accounts")
            return user_ids

        except Exception as e:
            logger.error(f"Failed to get connected users: {e}")
            return []
