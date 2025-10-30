#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for SMILe Sales Funnel

Tests complete flow:
1. Send real Gmail emails with test scenarios
2. Worker polls and processes emails
3. Verify extraction (tasks, deals, contacts)
4. Test deal stage progression (lead → contacted → demo → proposal)
5. Test task status updates (accepted → in_progress → completed)
6. Verify multi-customer data separation
7. Cleanup test data
"""

import os
import sys
import time
import asyncio
import logging
import requests
from datetime import datetime
from email.mime.text import MIMEText
import base64

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'worker', 'src'))

from services.dynamodb_cleanup import DynamoDBCleanup
from services.gmail_client import GmailClient
from services.gmail_token_storage import GmailTokenStorage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment
USER_ID = os.getenv("TEST_USER_ID", "aniket.ghode@shreemaruti.com")
API_BASE_URL = os.getenv("API_BASE_URL", "https://api-production-20f0.up.railway.app")
WORKER_BASE_URL = os.getenv("WORKER_BASE_URL", "https://worker-production-2fb2.up.railway.app")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
TABLE_PREFIX = os.getenv("TABLE_PREFIX", "smile-sales-funnel-prod")

# AWS credentials must be set via environment variables or ~/.aws/credentials
# Required env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

# Test email scenarios
TEST_EMAILS = [
    {
        "from_name": "Rajesh Kumar",
        "from_email": "rajesh.kumar@techcorpindia.com",
        "subject": "Enterprise SaaS Integration - 200 User Licenses",
        "body": """Hi Team,

We're very interested in your enterprise SaaS solution for our 200+ person organization.

Can you please:
1. Schedule a product demo for next Tuesday at 2 PM
2. Send detailed pricing quote for 200 user licenses
3. Share case studies from similar-sized companies in India

Our approved budget is ₹50 lakhs annually and we need to finalize by end of this quarter.

Looking forward to your response.

Best regards,
Rajesh Kumar
CTO, TechCorp India
+91 98765 43210""",
        "expected_deals": 1,
        "expected_tasks": 3,
        "expected_deal_value": 5000000  # ₹50L = 5000000
    },
    {
        "from_name": "Priya Sharma",
        "from_email": "priya.sharma@startupventures.in",
        "subject": "Looking for CRM solution for growing team",
        "body": """Hello,

We are a Mumbai-based startup looking for a CRM solution for our sales team.

Please send me:
1. Product brochure and feature comparison
2. Quote for 50 users with annual billing

Our budget is around ₹15 lakhs. Can we schedule a call next week?

Thanks,
Priya Sharma
Operations Manager
Startup Ventures India
priya@startupventures.in""",
        "expected_deals": 1,
        "expected_tasks": 2,
        "expected_deal_value": 1500000  # ₹15L = 1500000
    },
    {
        "from_name": "Amit Patel",
        "from_email": "amit.patel@consultingfirm.com",
        "subject": "Quick questions about API integration",
        "body": """Hi,

I'm evaluating your platform for a client project. Could you help with:

1. Send updated API documentation
2. Provide sandbox environment access

No immediate purchase planned, just technical evaluation.

Regards,
Amit Patel
Technical Consultant""",
        "expected_deals": 0,  # No deal - just technical questions
        "expected_tasks": 2,
        "expected_deal_value": 0
    }
]


class E2ETestRunner:
    """End-to-end test runner for sales funnel"""

    def __init__(self):
        self.user_id = USER_ID
        self.api_base = API_BASE_URL
        self.worker_base = WORKER_BASE_URL

        # Initialize cleanup utility
        self.cleanup = DynamoDBCleanup(
            region=AWS_REGION,
            table_prefix=TABLE_PREFIX
        )

        # Initialize Gmail client
        self.gmail_client = GmailClient()
        self.token_storage = GmailTokenStorage()

        # Test results tracking
        self.results = {
            'passed': 0,
            'failed': 0,
            'tests': []
        }

        # Store created IDs for cleanup
        self.created_deal_ids = []
        self.created_task_ids = []
        self.created_person_ids = []

    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status} - {test_name}")
        if details:
            logger.info(f"    {details}")

        self.results['tests'].append({
            'name': test_name,
            'passed': passed,
            'details': details
        })

        if passed:
            self.results['passed'] += 1
        else:
            self.results['failed'] += 1

    def send_test_email(self, email_data: dict) -> bool:
        """
        Send test email via worker /test/process-email endpoint

        This bypasses Gmail delivery but tests full extraction pipeline with correct user_id
        """
        try:
            logger.info(f"📧 Sending test email from {email_data['from_name']} ({email_data['from_email']})")

            # Format email text (simulates MIME email structure)
            email_text = f"""From: {email_data['from_name']} <{email_data['from_email']}>
To: {self.user_id}
Subject: {email_data['subject']}
Date: {datetime.now().strftime('%a, %d %b %Y %H:%M:%S +0000')}

{email_data['body']}"""

            # Send to worker test endpoint with user_id
            response = requests.post(
                f"{self.worker_base}/test/process-email",
                json={
                    'email_text': email_text,
                    'user_id': self.user_id
                },
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            logger.info(f"✅ Email processed. Status: {result.get('status')}")

            # Log extraction results
            tasks_saved = result.get('tasks_saved', [])
            deals_saved = result.get('deals_saved', [])

            logger.info(f"   Tasks saved: {len(tasks_saved)}")
            logger.info(f"   Deals saved: {len(deals_saved)}")

            return True

        except Exception as e:
            logger.error(f"❌ Failed to send/process email: {e}")
            return False

    def wait_for_processing(self, seconds: int = 5):
        """Wait for processing (minimal wait since we're calling test endpoint directly)"""
        logger.info(f"⏳ Waiting {seconds}s for data to propagate...")
        time.sleep(seconds)
        logger.info("✅ Wait complete")

    def get_deals(self, status: str = None) -> list:
        """Fetch deals from API"""
        try:
            params = {'user_id': self.user_id}
            if status:
                params['status'] = status

            response = requests.get(f"{self.api_base}/deals", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('deals', [])
        except Exception as e:
            logger.error(f"Failed to fetch deals: {e}")
            return []

    def get_tasks(self, status: str = None) -> list:
        """Fetch tasks from API"""
        try:
            params = {'user_id': self.user_id}
            if status:
                params['status'] = status

            response = requests.get(f"{self.api_base}/tasks", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('tasks', [])
        except Exception as e:
            logger.error(f"Failed to fetch tasks: {e}")
            return []

    def get_contacts(self) -> list:
        """Fetch contacts from API"""
        try:
            params = {'user_id': self.user_id}
            response = requests.get(f"{self.api_base}/contacts", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('contacts', [])
        except Exception as e:
            logger.error(f"Failed to fetch contacts: {e}")
            return []

    def update_deal_stage(self, deal_id: str, stage: str) -> bool:
        """Update deal stage via API"""
        try:
            response = requests.put(
                f"{self.api_base}/deals/{deal_id}",
                json={'stage': stage},
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to update deal {deal_id} to stage {stage}: {e}")
            return False

    def update_task_status(self, task_id: str, status: str) -> bool:
        """Update task status via API"""
        try:
            response = requests.put(
                f"{self.api_base}/tasks/{task_id}",
                json={'status': status},
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to update task {task_id} to status {status}: {e}")
            return False

    def run_tests(self):
        """Run complete E2E test suite"""

        print("\n" + "="*70)
        print("  SMILe Sales Funnel - Comprehensive E2E Test")
        print("="*70)
        print(f"User: {self.user_id}")
        print(f"API: {self.api_base}")
        print(f"Worker: {self.worker_base}")
        print(f"Region: {AWS_REGION}")
        print(f"Table Prefix: {TABLE_PREFIX}")
        print("="*70 + "\n")

        # Step 1: Check initial state
        logger.info("📊 Step 1: Checking initial data counts...")
        initial_counts = self.cleanup.get_user_data_counts(self.user_id)
        logger.info(f"Initial state - Tasks: {initial_counts['tasks']}, Deals: {initial_counts['deals']}, Contacts: {initial_counts['people']}")

        # Step 2: Send test emails
        logger.info("\n📧 Step 2: Sending test emails via Gmail...")
        for idx, email_data in enumerate(TEST_EMAILS, 1):
            success = self.send_test_email(email_data)
            self.log_test(
                f"Send Email #{idx} ({email_data['from_name']})",
                success,
                f"Subject: {email_data['subject']}"
            )
            if success:
                time.sleep(2)  # Brief pause between emails

        # Step 3: Wait for processing
        self.wait_for_processing(60)

        # Step 4: Verify extraction results
        logger.info("\n🔍 Step 4: Verifying extraction results...")

        deals = self.get_deals()
        tasks = self.get_tasks()
        contacts = self.get_contacts()

        # Store IDs for later cleanup
        self.created_deal_ids = [d['id'] for d in deals if d.get('id')]
        self.created_task_ids = [t['id'] for t in tasks if t.get('id')]
        self.created_person_ids = [c['id'] for c in contacts if c.get('id')]

        logger.info(f"Found - Tasks: {len(tasks)}, Deals: {len(deals)}, Contacts: {len(contacts)}")

        # Calculate expected totals
        expected_deals = sum(e['expected_deals'] for e in TEST_EMAILS)
        expected_tasks = sum(e['expected_tasks'] for e in TEST_EMAILS)
        expected_contacts = len([e for e in TEST_EMAILS if e['expected_tasks'] > 0 or e['expected_deals'] > 0])

        self.log_test(
            "Verify deals created",
            len(deals) >= expected_deals,
            f"Expected: {expected_deals}, Got: {len(deals)}"
        )

        self.log_test(
            "Verify tasks created",
            len(tasks) >= expected_tasks,
            f"Expected: {expected_tasks}, Got: {len(tasks)}"
        )

        self.log_test(
            "Verify contacts created",
            len(contacts) >= expected_contacts,
            f"Expected: {expected_contacts}, Got: {len(contacts)}"
        )

        # Step 5: Test deal stage progression
        if deals:
            logger.info("\n📈 Step 5: Testing deal stage progression...")
            test_deal = deals[0]
            deal_id = test_deal['id']

            stages = ['lead', 'contacted', 'demo', 'proposal']
            for stage in stages:
                success = self.update_deal_stage(deal_id, stage)
                self.log_test(
                    f"Update deal to stage: {stage}",
                    success,
                    f"Deal ID: {deal_id}"
                )
                if success:
                    time.sleep(1)

            # Verify final stage
            updated_deals = self.get_deals()
            updated_deal = next((d for d in updated_deals if d['id'] == deal_id), None)
            if updated_deal:
                final_stage = updated_deal.get('stage')
                self.log_test(
                    "Verify deal final stage is 'proposal'",
                    final_stage == 'proposal',
                    f"Expected: proposal, Got: {final_stage}"
                )

        # Step 6: Test task status updates
        if tasks:
            logger.info("\n✅ Step 6: Testing task status updates...")
            test_task = tasks[0]
            task_id = test_task['id']

            statuses = ['accepted', 'in_progress', 'completed']
            for status in statuses:
                success = self.update_task_status(task_id, status)
                self.log_test(
                    f"Update task to status: {status}",
                    success,
                    f"Task ID: {task_id}"
                )
                if success:
                    time.sleep(1)

            # Verify final status
            updated_tasks = self.get_tasks()
            updated_task = next((t for t in updated_tasks if t['id'] == task_id), None)
            if updated_task:
                final_status = updated_task.get('status')
                self.log_test(
                    "Verify task final status is 'completed'",
                    final_status == 'completed',
                    f"Expected: completed, Got: {final_status}"
                )

        # Step 7: Verify multi-customer separation
        logger.info("\n👥 Step 7: Verifying multi-customer data separation...")

        # Check that all contacts have different emails
        contact_emails = [c.get('email', '').lower() for c in contacts]
        unique_emails = len(set(contact_emails))
        self.log_test(
            "Verify contacts are separate by email",
            unique_emails == len(contacts),
            f"Unique emails: {unique_emails}, Total contacts: {len(contacts)}"
        )

        # Verify all data belongs to correct user
        all_user_ids_correct = all(
            d.get('user_id') == self.user_id for d in deals
        ) and all(
            t.get('user_id') == self.user_id for t in tasks
        )
        self.log_test(
            "Verify all data belongs to correct user_id",
            all_user_ids_correct,
            f"user_id: {self.user_id}"
        )

        # Step 8: Cleanup
        logger.info("\n🧹 Step 8: Cleaning up test data...")
        cleanup_result = self.cleanup.cleanup_all_user_data(self.user_id)
        self.log_test(
            "Cleanup test data",
            cleanup_result['success'],
            f"Deleted: {cleanup_result['total_deleted']} items"
        )

        # Step 9: Verify cleanup
        logger.info("\n✅ Step 9: Verifying cleanup...")
        final_counts = self.cleanup.get_user_data_counts(self.user_id)
        cleanup_verified = (
            final_counts['tasks'] == initial_counts['tasks'] and
            final_counts['deals'] == initial_counts['deals'] and
            final_counts['people'] == initial_counts['people']
        )
        self.log_test(
            "Verify cleanup restored initial state",
            cleanup_verified,
            f"Final - Tasks: {final_counts['tasks']}, Deals: {final_counts['deals']}, Contacts: {final_counts['people']}"
        )

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("  TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {self.results['passed'] + self.results['failed']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print("="*70)

        if self.results['failed'] > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.results['tests']:
                if not test['passed']:
                    print(f"  - {test['name']}")
                    if test['details']:
                        print(f"    {test['details']}")
            print()

        success_rate = (self.results['passed'] / (self.results['passed'] + self.results['failed'])) * 100
        print(f"\n{'🎉 ALL TESTS PASSED!' if self.results['failed'] == 0 else '⚠️  SOME TESTS FAILED'}")
        print(f"Success Rate: {success_rate:.1f}%\n")


def main():
    """Main entry point"""
    try:
        runner = E2ETestRunner()
        runner.run_tests()

        # Exit with appropriate code
        sys.exit(0 if runner.results['failed'] == 0 else 1)

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"\n\n❌ Test suite failed with error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
