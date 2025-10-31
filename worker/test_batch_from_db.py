"""
Test batch extraction with REAL emails from DynamoDB
"""
import asyncio
import sys
import os
import boto3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.graph.nodes.extract_local import ExtractLocalNode

# Get real emails from DynamoDB
def get_emails_from_db(user_id: str, limit: int = 5):
    """Fetch real email subjects and senders from email-logs table"""
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.getenv('AWS_REGION', 'ap-south-1')
    )
    
    table = dynamodb.Table('smile-sales-funnel-prod-email-logs')
    
    # Scan ALL emails - remove Limit to get everything
    scan_kwargs = {
        'FilterExpression': 'user_id = :uid',
        'ExpressionAttributeValues': {':uid': user_id}
    }
    if limit:
        scan_kwargs['Limit'] = limit

    response = table.scan(**scan_kwargs)
    
    emails = []
    for item in response.get('Items', []):
        # For testing, we need content but we only have subject/sender in email-logs
        # So we'll use subject as a proxy for content
        emails.append({
            'subject': item.get('subject', 'No subject'),
            'sender': item.get('sender_email', 'unknown@example.com'),
            'content': f"Subject: {item.get('subject', 'No subject')}\n\nThis is a test email for batch processing."
        })
    
    return emails


async def test_batch_from_db():
    """Test batch extraction with real emails from database"""
    print("🧪 Testing batch LLM extraction with REAL emails from DynamoDB...")
    
    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY not set")
        return
    
    # Get ALL real emails (no limit)
    print("📧 Fetching ALL emails from DynamoDB...\n")
    emails = get_emails_from_db('aniket.ghode@shreemaruti.com', limit=None)
    
    if not emails:
        print("❌ No emails found in database")
        return
    
    print(f"✅ Found {len(emails)} emails\n")
    for idx, email in enumerate(emails, 1):
        print(f"{idx}. {email['subject'][:60]}...")
    
    print(f"\n{'='*80}")
    
    # Initialize extraction node
    extractor = ExtractLocalNode()
    model = extractor.llm.model_name if hasattr(extractor.llm, 'model_name') else getattr(extractor.llm, 'model', 'unknown')
    print(f"🤖 Using model: {model}")
    print(f"📦 Batch size: {len(emails)} emails in 1 API call\n")
    
    # Run batch extraction
    results = await extractor.extract_batch(emails)
    
    # Print results
    print(f"\n✅ Batch extraction complete!")
    print(f"📊 Results:\n")
    
    for idx, (email, result) in enumerate(zip(emails, results), 1):
        print(f"{'='*80}")
        print(f"EMAIL {idx}: {email['subject'][:70]}")
        print(f"FROM: {email['sender']}")
        print(f"-" * 80)
        
        tasks = result.get('tasks', [])
        deals = result.get('deals', [])
        
        if tasks:
            print(f"📋 TASKS ({len(tasks)}):")
            for task in tasks:
                print(f"  • {task['title'][:100]}")
                print(f"    Confidence: {task['confidence']}")
        else:
            print(f"📋 TASKS: None")
        
        if deals:
            print(f"💰 DEALS ({len(deals)}):")
            for deal in deals:
                print(f"  • {deal['title'][:100]}")
                print(f"    Stage: {deal['stage']}, Confidence: {deal['confidence']}")
        else:
            print(f"💰 DEALS: None")
        
        print()
    
    # Summary
    total_tasks = sum(len(r.get('tasks', [])) for r in results)
    total_deals = sum(len(r.get('deals', [])) for r in results)
    
    print(f"{'='*80}")
    print(f"\n📈 SUMMARY:")
    print(f"  Emails processed: {len(results)}")
    print(f"  Tasks extracted: {total_tasks}")
    print(f"  Deals extracted: {total_deals}")
    print(f"  API calls: 1 (batch)")
    print(f"  vs Sequential: {len(emails)} calls\n")


if __name__ == "__main__":
    asyncio.run(test_batch_from_db())
