"""
Load test batch processing with 100 emails
"""
import asyncio
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
os.chdir(os.path.dirname(__file__))

from src.graph.workflow import EmailProcessingWorkflow


def generate_test_emails(count=100):
    """Generate test emails with mix of sales/internal/spam"""
    emails = []

    # Pattern distribution: 30% sales, 50% internal, 20% spam
    patterns = {
        'sales': [
            {
                'from': 'client{idx}@external-company{idx}.com',
                'subject': 'Inquiry: Logistics Services for {month}',
                'body': 'We need transport services. Please share pricing for Mumbai-Delhi route. Volume: {volume} shipments/month.'
            },
            {
                'from': 'procurement{idx}@newcorp{idx}.in',
                'subject': 'RFQ: Transport Partnership',
                'body': 'Request for quotation for logistics partnership. Looking for reliable vendor for Q{quarter} 2025.'
            },
            {
                'from': 'buyer{idx}@manufacturing{idx}.com',
                'subject': 'Partnership Opportunity',
                'body': 'Interested in your platform for our enterprise needs. Can we schedule a demo? Budget: {budget} INR'
            }
        ],
        'internal': [
            {
                'from': 'dev{idx}@shreemaruti.com',
                'subject': 'Re: API Integration Issue',
                'body': 'Please fix the booking API endpoint. Deployment blocking production release.'
            },
            {
                'from': 'pullrequests-noreply@bitbucket.org',
                'subject': '[PR #{idx}] Code review needed',
                'body': 'Pull request ready for review. Please check changes in payment module.'
            },
            {
                'from': 'team{idx}@shreemaruti.com',
                'subject': 'Meeting: Sprint Planning',
                'body': 'Please join sprint planning at 3 PM. Agenda: backlog grooming and velocity review.'
            },
            {
                'from': 'hr@shreemaruti.com',
                'subject': 'Leave Application Update',
                'body': 'Your leave request has been approved. Remaining balance: {balance} days.'
            }
        ],
        'spam': [
            {
                'from': 'noreply@marketing{idx}.com',
                'subject': 'SALE: 50% OFF Everything!',
                'body': 'Limited time offer! Click here to shop now. Unsubscribe at bottom.'
            },
            {
                'from': 'notifications@service{idx}.com',
                'subject': 'Your daily report',
                'body': '[Automated] Daily summary report. Do not reply to this email.'
            }
        ]
    }

    for i in range(count):
        # Determine email type based on distribution
        if i < 30:  # 30 sales emails
            pattern = patterns['sales'][i % len(patterns['sales'])]
        elif i < 80:  # 50 internal emails
            pattern = patterns['internal'][i % len(patterns['internal'])]
        else:  # 20 spam emails
            pattern = patterns['spam'][i % len(patterns['spam'])]

        # Generate email with substitutions
        email = f"""From: {pattern['from'].format(idx=i)}
Subject: {pattern['subject'].format(idx=i, month='January', quarter='Q1', volume=500+i*10, budget=100000+i*5000, balance=15-i%10)}
Message-ID: <test-{i}@loadtest.example.com>

{pattern['body'].format(idx=i, month='January', quarter='Q1', volume=500+i*10, budget=100000+i*5000, balance=15-i%10)}

Best regards,
Test User {i}"""

        emails.append(email)

    return emails


async def test_batch_load():
    """Load test with 100 emails"""
    print("🧪 LOAD TEST: Batch Processing with 100 Emails\n")
    print("=" * 80)

    # Generate 100 test emails
    print("\n📧 Generating 100 test emails...")
    emails = generate_test_emails(100)
    print(f"   Generated: 30 sales, 50 internal, 20 spam\n")

    # Initialize workflow
    workflow = EmailProcessingWorkflow()

    print(f"🚀 Starting batch processing...\n")
    start_time = time.time()

    # Process batch
    results = await workflow.process_emails_batch(
        emails,
        source="loadtest",
        user_id="loadtest@example.com"
    )

    elapsed = time.time() - start_time

    # Analyze results
    print("\n" + "=" * 80)
    print("📊 LOAD TEST RESULTS\n")

    sales_processed = sum(1 for r in results if r and r.get('status') == 'success')
    skipped = sum(1 for r in results if r and r.get('status') == 'skipped')
    errors = sum(1 for r in results if r and r.get('status') == 'error')

    total_tasks = sum(r.get('results', {}).get('tasks_created', 0) for r in results if r)
    total_deals = sum(r.get('results', {}).get('deals_created', 0) for r in results if r)

    print(f"Total Emails:           {len(emails)}")
    print(f"✅ Sales Processed:     {sales_processed}")
    print(f"⏭️  Skipped:             {skipped}")
    print(f"❌ Errors:              {errors}")
    print(f"\n📋 Total Tasks:         {total_tasks}")
    print(f"💼 Total Deals:         {total_deals}")
    print(f"\n⏱️  Processing Time:     {elapsed:.2f}s")
    print(f"📈 Throughput:          {len(emails)/elapsed:.1f} emails/sec")
    print(f"⚡ Avg per email:       {elapsed/len(emails)*1000:.0f}ms")

    # Breakdown by category
    categories = {}
    for r in results:
        if r and r.get('status') == 'skipped':
            reason = r.get('reason', 'unknown')
            categories[reason] = categories.get(reason, 0) + 1

    if categories:
        print(f"\n📁 Skipped Breakdown:")
        for cat, count in categories.items():
            print(f"   {cat}: {count}")

    # Validation
    print(f"\n{'=' * 80}")
    expected_sales = 30
    expected_skipped = 70  # 50 internal + 20 spam

    if abs(sales_processed - expected_sales) <= 5 and abs(skipped - expected_skipped) <= 5:
        print(f"\n✅ LOAD TEST PASSED")
        print(f"   Classification accuracy within acceptable range")
        print(f"   Expected: ~{expected_sales} sales, ~{expected_skipped} skipped")
        print(f"   Got:      {sales_processed} sales, {skipped} skipped")
    else:
        print(f"\n⚠️  LOAD TEST WARNING")
        print(f"   Classification may need tuning")
        print(f"   Expected: ~{expected_sales} sales, ~{expected_skipped} skipped")
        print(f"   Got:      {sales_processed} sales, {skipped} skipped")


if __name__ == "__main__":
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ Error: OPENROUTER_API_KEY environment variable not set")
        sys.exit(1)

    asyncio.run(test_batch_load())
