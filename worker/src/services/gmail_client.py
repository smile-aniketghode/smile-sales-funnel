"""Gmail API client for fetching and processing emails."""

import base64
import email
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from .gmail_oauth import GmailOAuthService
from .gmail_token_storage import GmailTokenStorage

logger = logging.getLogger(__name__)


class GmailClient:
    """Fetch emails from Gmail API."""

    def __init__(self):
        self.oauth_service = GmailOAuthService()
        self.token_storage = GmailTokenStorage()

    def get_service(self, user_id: str):
        """Get Gmail API service for a user."""
        token_data = self.token_storage.get_token(user_id)
        if not token_data:
            raise ValueError(f"No Gmail token found for user: {user_id}")

        # Check if token is expired and refresh if needed
        if self.oauth_service.is_token_expired(token_data):
            if token_data.get('refresh_token'):
                token_data = self.oauth_service.refresh_access_token(token_data)
                self.token_storage.update_token(user_id, token_data)
            else:
                raise ValueError(f"Token expired and no refresh token for user: {user_id}")

        return self.oauth_service.get_gmail_service(token_data)

    def list_labels(self, user_id: str) -> List[Dict[str, str]]:
        """List all Gmail labels for a user."""
        try:
            service = self.get_service(user_id)
            results = service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])

            return [
                {"id": label['id'], "name": label['name']}
                for label in labels
            ]

        except Exception as e:
            logger.error(f"Failed to list labels for {user_id}: {e}")
            raise

    def fetch_emails_by_label(
        self,
        user_id: str,
        label_ids: List[str],
        max_results: int = 10,
        after_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch emails from Gmail by label.

        Args:
            user_id: User identifier
            label_ids: List of Gmail label IDs to filter by
            max_results: Maximum number of emails to fetch
            after_date: Only fetch emails after this date

        Returns:
            List of email dictionaries with parsed content
        """
        try:
            service = self.get_service(user_id)

            # Build query
            query_parts = []
            if label_ids:
                for label_id in label_ids:
                    query_parts.append(f"label:{label_id}")

            if after_date:
                # Gmail uses format: after:YYYY/MM/DD
                date_str = after_date.strftime("%Y/%m/%d")
                query_parts.append(f"after:{date_str}")

            query = " ".join(query_parts) if query_parts else ""

            # List messages with pagination
            logger.info(f"Fetching emails for {user_id} with query: {query}")
            messages = []
            page_token = None

            while len(messages) < max_results:
                results = service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=min(500, max_results - len(messages)),
                    pageToken=page_token
                ).execute()

                page_messages = results.get('messages', [])
                messages.extend(page_messages)

                page_token = results.get('nextPageToken')
                if not page_token:
                    break

            logger.info(f"Found {len(messages)} messages")

            emails = []
            for msg in messages:
                try:
                    email_data = self._fetch_email_content(service, msg['id'])
                    if email_data:
                        emails.append(email_data)
                except Exception as e:
                    logger.error(f"Failed to fetch message {msg['id']}: {e}")
                    continue

            return emails

        except Exception as e:
            logger.error(f"Failed to fetch emails for {user_id}: {e}")
            raise

    def _fetch_email_content(self, service, message_id: str) -> Optional[Dict[str, Any]]:
        """Fetch and parse individual email content."""
        try:
            # Get full message
            msg = service.users().messages().get(
                userId='me',
                id=message_id,
                format='raw'
            ).execute()

            # Decode raw message
            msg_str = base64.urlsafe_b64decode(msg['raw']).decode('utf-8')

            # Parse email
            email_msg = email.message_from_string(msg_str)

            # Extract headers
            from_header = email_msg['From']
            to_header = email_msg['To']
            subject = email_msg['Subject']
            date_header = email_msg['Date']
            message_id_header = email_msg['Message-ID']

            # Extract body
            body = self._get_email_body(email_msg)

            # Build MIME format (for compatibility with existing ingestion pipeline)
            mime_content = f"""From: {from_header}
To: {to_header}
Subject: {subject}
Date: {date_header}
Message-ID: {message_id_header}

{body}"""

            return {
                'id': message_id,
                'from': from_header,
                'to': to_header,
                'subject': subject,
                'date': date_header,
                'message_id': message_id_header,
                'body': body,
                'mime_content': mime_content,
                'gmail_id': message_id
            }

        except Exception as e:
            logger.error(f"Failed to parse email {message_id}: {e}")
            return None

    def _get_email_body(self, email_msg) -> str:
        """Extract email body from message."""
        body = ""

        if email_msg.is_multipart():
            for part in email_msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))

                # Skip attachments
                if "attachment" in content_disposition:
                    continue

                # Get text/plain or text/html
                if content_type == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                elif content_type == "text/html" and not body:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            body = email_msg.get_payload(decode=True).decode('utf-8', errors='ignore')

        return body.strip()

    def mark_as_read(self, user_id: str, message_id: str) -> bool:
        """Mark an email as read."""
        try:
            service = self.get_service(user_id)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to mark message {message_id} as read: {e}")
            return False

    def add_label(self, user_id: str, message_id: str, label_id: str) -> bool:
        """Add a label to an email."""
        try:
            service = self.get_service(user_id)
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': [label_id]}
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to add label to message {message_id}: {e}")
            return False
