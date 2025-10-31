"""Background polling service for Gmail emails."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import os
from zoneinfo import ZoneInfo

from .gmail_client import GmailClient
from .gmail_token_storage import GmailTokenStorage
from ..graph.workflow import EmailProcessingWorkflow

logger = logging.getLogger(__name__)


class GmailPoller:
    """Poll Gmail and process new emails automatically."""

    def __init__(self, workflow: EmailProcessingWorkflow):
        self.gmail_client = GmailClient()
        self.token_storage = GmailTokenStorage()
        self.workflow = workflow

        # Polling configuration
        self.poll_interval_minutes = int(os.getenv("GMAIL_POLL_INTERVAL_MINUTES", "15"))
        self.max_emails_per_poll = int(os.getenv("GMAIL_MAX_EMAILS_PER_POLL", "100"))
        self.batch_size = int(os.getenv("GMAIL_BATCH_SIZE", "20"))  # Process N emails per LLM API call

        # Track last sync time per user
        self.last_sync: Dict[str, datetime] = {}

        # Track if polling is active
        self.is_polling = False
        self.poll_task: Optional[asyncio.Task] = None

        logger.info(f"Gmail poller initialized (interval: {self.poll_interval_minutes}min)")

    async def start_polling(self):
        """Start the background polling loop."""
        if self.is_polling:
            logger.warning("Polling already active")
            return

        self.is_polling = True
        self.poll_task = asyncio.create_task(self._polling_loop())
        logger.info("✅ Gmail polling started")

    async def stop_polling(self):
        """Stop the background polling loop."""
        if not self.is_polling:
            return

        self.is_polling = False
        if self.poll_task:
            self.poll_task.cancel()
            try:
                await self.poll_task
            except asyncio.CancelledError:
                pass

        logger.info("🛑 Gmail polling stopped")

    async def _polling_loop(self):
        """Main polling loop - runs every N minutes."""
        while self.is_polling:
            try:
                await self._poll_all_users()
            except Exception as e:
                logger.error(f"Polling error: {e}", exc_info=True)

            # Wait for next poll interval
            await asyncio.sleep(self.poll_interval_minutes * 60)

    async def _poll_all_users(self):
        """Poll Gmail for all connected users."""
        # Get all users with connected Gmail accounts
        connected_users = self.token_storage.get_all_connected_users()

        if not connected_users:
            logger.debug("No connected Gmail accounts to poll")
            return

        logger.info(f"🔄 Polling {len(connected_users)} Gmail accounts...")

        for user_id in connected_users:
            try:
                await self.poll_user(user_id)
            except Exception as e:
                logger.error(f"Failed to poll user {user_id}: {e}")

    async def poll_user(
        self,
        user_id: str,
        label_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Poll Gmail for a single user and process new emails.

        Args:
            user_id: User identifier
            label_ids: Optional list of label IDs to filter (default: INBOX)

        Returns:
            Polling results with counts
        """
        try:
            # Default to INBOX if no labels specified
            if not label_ids:
                label_ids = ["INBOX"]

            # Get last sync time
            last_sync = self.last_sync.get(user_id)

            # For first connection, fetch all emails from today (00:00 AM IST)
            # For subsequent polls, use timestamp to get only new emails
            if not last_sync:
                # First sync: get all emails from today's midnight IST
                ist = ZoneInfo("Asia/Kolkata")
                now_ist = datetime.now(ist)
                today_midnight_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
                logger.info(f"📧 First sync for {user_id} (labels: {label_ids}), fetching emails since today 00:00 IST")
                emails = self.gmail_client.fetch_emails_by_label(
                    user_id=user_id,
                    label_ids=label_ids,
                    max_results=self.max_emails_per_poll,
                    after_date=today_midnight_ist
                )
            else:
                logger.info(f"📧 Polling {user_id} (labels: {label_ids}, since: {last_sync.isoformat()})")
                emails = self.gmail_client.fetch_emails_by_label(
                    user_id=user_id,
                    label_ids=label_ids,
                    max_results=self.max_emails_per_poll,
                    after_date=last_sync
                )

            if not emails:
                logger.info(f"  No new emails for {user_id}")
                return {
                    "user_id": user_id,
                    "emails_fetched": 0,
                    "emails_processed": 0,
                    "tasks_extracted": 0,
                    "deals_extracted": 0,
                    "status": "success"
                }

            logger.info(f"  Found {len(emails)} new emails")

            # Process emails in batches
            results = {
                "user_id": user_id,
                "emails_fetched": len(emails),
                "emails_processed": 0,
                "tasks_extracted": 0,
                "deals_extracted": 0,
                "errors": []
            }

            # Process in batches of self.batch_size
            for i in range(0, len(emails), self.batch_size):
                batch = emails[i:i + self.batch_size]
                batch_num = (i // self.batch_size) + 1
                total_batches = (len(emails) + self.batch_size - 1) // self.batch_size

                logger.info(f"  Processing batch {batch_num}/{total_batches} ({len(batch)} emails) using LangChain abatch")

                # Prepare batch for workflow
                batch_mime_contents = [email_data['mime_content'] for email_data in batch]

                # Process entire batch with LangChain abatch for classification
                try:
                    batch_results = await self.workflow.process_emails_batch(
                        batch_mime_contents,
                        source="gmail",
                        user_id=user_id
                    )

                    # Aggregate results
                    for email_data, result in zip(batch, batch_results):
                        if result and result.get('status') == 'success':
                            results['emails_processed'] += 1
                            result_data = result.get('results', {})
                            results['tasks_extracted'] += result_data.get('tasks_created', 0)
                            results['deals_extracted'] += result_data.get('deals_created', 0)
                        elif result and result.get('status') == 'skipped':
                            results['emails_processed'] += 1  # Count as processed (classified and skipped)
                        else:
                            results['errors'].append({
                                "email_id": email_data.get('gmail_id'),
                                "error": result.get('message', 'Unknown error') if result else 'No result'
                            })

                except Exception as e:
                    logger.error(f"  Failed to process batch: {e}", exc_info=True)
                    for email_data in batch:
                        results['errors'].append({
                            "email_id": email_data.get('gmail_id'),
                            "error": str(e)
                        })

            # Update last sync time (IST)
            ist = ZoneInfo("Asia/Kolkata")
            self.last_sync[user_id] = datetime.now(ist)

            logger.info(
                f"  ✅ Processed {results['emails_processed']}/{results['emails_fetched']} emails "
                f"({results['tasks_extracted']} tasks, {results['deals_extracted']} deals)"
            )

            results['status'] = 'success'
            results['last_sync'] = self.last_sync[user_id].isoformat()
            return results

        except Exception as e:
            logger.error(f"Failed to poll user {user_id}: {e}", exc_info=True)
            return {
                "user_id": user_id,
                "status": "error",
                "error": str(e)
            }

    def get_polling_status(self) -> Dict[str, Any]:
        """Get current polling status."""
        return {
            "is_polling": self.is_polling,
            "poll_interval_minutes": self.poll_interval_minutes,
            "max_emails_per_poll": self.max_emails_per_poll,
            "connected_users": len(self.token_storage.get_all_connected_users()),
            "last_sync_times": {
                user_id: sync_time.isoformat()
                for user_id, sync_time in self.last_sync.items()
            }
        }
