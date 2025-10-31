"""
Test script for batch LLM extraction
Run from worker directory: python test_batch_extraction.py
"""
import asyncio
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.graph.nodes.extract_local import ExtractLocalNode

# Sample email data
test_emails = [
    {
        "subject": "RE: Request for API Booking and Tracking Facility",
        "sender": "noc.it@shreemaruti.com",
        "content": """Dear Team,

Please find below booking & tracking API details for the CP client.

Client Name: A S ENTERPRISES
Client Code: 889766
Courier API Secret Key – Prod: VWpyaHijkts
Courier API Secret Key - Beta: HtT3ep0KZvw
Username: ASENTERPRISES
Password: ASEN@1234

Production API, we must require the client's IP address to be whitelisted. Hence, provide the same soon.
Till then they can use Beta API for integration testing.

Best regards,
NOC Team"""
    },
    {
        "subject": "looking for reliable logistics / transport service",
        "sender": "aniket.ghode@shreemaruti.com",
        "content": """Dear Sir,

Hope you are doing well. We are looking for reliable logistics / transport service for our company goods delivery. We have regular dispatch from our warehouse and we need proper pickup and delivery support.

Kindly send your quotation and contact details for further discussion.

Please let us know your service area, charges, and time for delivery.

Thanks & regards,
Aniket Ghode"""
    },
    {
        "subject": "Pull request #528: Return client_id in shipment listing API",
        "sender": "pullrequests-reply@bitbucket.org",
        "content": """You have been added as a reviewer to a pull request opened by Nayan Ghoghari.

Approval on pull request:
https://bitbucket.org/delcaperadmin/booking-service/pull-requests/528

Please review and merge pull request #528 for returning client id in shipment listing API.

Changes include:
- Added client_id field to response
- Updated API documentation
- Added unit tests

Thanks,
Bitbucket"""
    }
]


async def test_batch_extraction():
    """Test batch extraction with sample emails"""
    print("🧪 Testing batch LLM extraction...")
    print(f"📧 Processing {len(test_emails)} emails in a single batch\n")

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not set in environment")
        print("   Please export OPENROUTER_API_KEY=your_key")
        print("   Or run: railway run python test_batch_extraction.py")
        return

    # Initialize extraction node
    extractor = ExtractLocalNode()

    # Print model being used
    model = extractor.llm.model_name if hasattr(extractor.llm, 'model_name') else getattr(extractor.llm, 'model', 'unknown')
    print(f"🤖 Using model: {model}\n")

    # Run batch extraction
    results = await extractor.extract_batch(test_emails)

    # Print results
    print(f"\n✅ Batch extraction complete!")
    print(f"📊 Results for {len(results)} emails:\n")

    for idx, (email, result) in enumerate(zip(test_emails, results), 1):
        print(f"{'='*80}")
        print(f"EMAIL {idx}: {email['subject']}")
        print(f"FROM: {email['sender']}")
        print(f"-" * 80)

        tasks = result.get('tasks', [])
        deals = result.get('deals', [])

        if tasks:
            print(f"📋 TASKS ({len(tasks)}):")
            for task in tasks:
                print(f"  • {task['title']}")
                print(f"    Confidence: {task['confidence']}")
        else:
            print(f"📋 TASKS: None")

        if deals:
            print(f"💰 DEALS ({len(deals)}):")
            for deal in deals:
                print(f"  • {deal['title']}")
                print(f"    Stage: {deal['stage']}, Confidence: {deal['confidence']}")
                print(f"    Value: {deal.get('value', 0)} {deal.get('currency', 'INR')}")
        else:
            print(f"💰 DEALS: None")

        print()

    print(f"{'='*80}")

    # Summary
    total_tasks = sum(len(r.get('tasks', [])) for r in results)
    total_deals = sum(len(r.get('deals', [])) for r in results)

    print(f"\n📈 SUMMARY:")
    print(f"  Total emails processed: {len(results)}")
    print(f"  Total tasks extracted: {total_tasks}")
    print(f"  Total deals extracted: {total_deals}")
    print(f"  API calls made: 1 (batch)")
    print(f"  vs Sequential: {len(test_emails)} API calls\n")


if __name__ == "__main__":
    asyncio.run(test_batch_extraction())
