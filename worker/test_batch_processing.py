"""
Test batch processing with sample emails
"""
import asyncio
import os
import sys

# Setup Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
os.chdir(os.path.dirname(__file__))

from src.graph.workflow import EmailProcessingWorkflow


# Sample emails for testing
SAMPLE_EMAILS = [
    # Email 1: Sales lead
    """From: john.doe@externalcompany.com
Subject: Looking for logistics service
Message-ID: <test1@example.com>

Hi,

We need a logistics partner for shipments from Mumbai to Delhi.
Can you share pricing and transit times?

Thanks,
John""",

    # Email 2: Internal operations
    """From: anshul.deodia@shreemaruti.com
Subject: Re: NBA Booking API
Message-ID: <test2@example.com>

Hi,

Please set up a call to discuss the API endpoints.

Thanks,
Anshul""",

    # Email 3: Sales lead
    """From: procurement@newcompany.in
Subject: Transport Services Quote Request
Message-ID: <test3@example.com>

Dear Team,

We need transport services for Q1 2025.
Please share your rate card for:
- Mumbai to Bangalore
- Delhi to Chennai

Monthly volume: 500+ shipments

Regards,
Procurement""",

    # Email 4: Internal PR
    """From: pullrequests-reply@bitbucket.org
Subject: [Bitbucket] Pull request #530
Message-ID: <test4@example.com>

Nayan Ghoghari commented on pull request:
Handle piece rate in bulk update

Changes approved.""",

    # Email 5: Sales lead
    """From: rajesh.kumar@techcorp.com
Subject: Enterprise SaaS Integration
Message-ID: <test5@example.com>

Hello,

Interested in your platform for 200 users.
Can we schedule a demo?

Best regards,
Rajesh Kumar"""
]


async def test_batch_processing():
    """Test batch processing with sample emails"""
    print("🧪 Testing Batch Email Processing\n")
    print("=" * 80)

    # Initialize workflow
    workflow = EmailProcessingWorkflow()

    print(f"\n📧 Processing {len(SAMPLE_EMAILS)} emails in batch...\n")

    # Process batch
    results = await workflow.process_emails_batch(
        SAMPLE_EMAILS,
        source="test",
        user_id="test@example.com"
    )

    # Analyze results
    print("\n" + "=" * 80)
    print("📊 RESULTS SUMMARY\n")

    sales_leads = 0
    skipped = 0
    errors = 0

    for idx, result in enumerate(results, 1):
        print(f"\nEmail {idx}:")
        if result['status'] == 'success':
            sales_leads += 1
            result_data = result.get('results', {})
            print(f"  ✅ Status: SUCCESS (Sales Lead)")
            print(f"  📋 Tasks: {result_data.get('tasks_created', 0)}")
            print(f"  💼 Deals: {result_data.get('deals_created', 0)}")
        elif result['status'] == 'skipped':
            skipped += 1
            print(f"  ⏭️  Status: SKIPPED")
            print(f"  📁 Reason: {result.get('reason', 'unknown')}")
        else:
            errors += 1
            print(f"  ❌ Status: ERROR")
            print(f"  ⚠️  Message: {result.get('message', 'unknown')}")

    print("\n" + "=" * 80)
    print(f"\nTotal Emails: {len(SAMPLE_EMAILS)}")
    print(f"✅ Sales Leads Processed: {sales_leads}")
    print(f"⏭️  Skipped (Internal/Spam): {skipped}")
    print(f"❌ Errors: {errors}")

    # Expected: 3 sales leads, 2 skipped
    if sales_leads == 3 and skipped == 2 and errors == 0:
        print("\n✅ TEST PASSED - Batch processing working correctly!")
    else:
        print(f"\n❌ TEST FAILED - Expected 3 sales leads and 2 skipped")


if __name__ == "__main__":
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ Error: OPENROUTER_API_KEY environment variable not set")
        sys.exit(1)

    asyncio.run(test_batch_processing())
