"""
Test script for email classification agent
Tests with various email types to validate classification accuracy
"""
import asyncio
import os
import sys

# Set environment for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Direct import without going through __init__
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# Import the classification classes directly
class EmailClassification(BaseModel):
    """Structured output for email classification"""
    category: str = Field(description="Email category")
    confidence: float = Field(description="Confidence score", ge=0.0, le=1.0)
    reasoning: str = Field(description="Brief explanation")

class ClassifyEmailNode:
    """Email classification agent"""

    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY")
        model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-small")

        self.llm = ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            model=model_name,
            temperature=0.1,
        )

        self.structured_llm = self.llm.with_structured_output(EmailClassification)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert email classifier for a sales CRM system.

Your job is to classify incoming emails into one of these categories:

1. **sales_lead**: External prospects/customers inquiring about products, services, pricing, partnerships, proposals, or business opportunities.

2. **internal_operations**: Emails from colleagues within the same organization about internal tasks, operations, development work (like pull requests), API integrations, internal processes, or administrative matters.

3. **spam_noise**: Marketing emails, newsletters, automated notifications, unsubscribe confirmations, or irrelevant messages.

4. **customer_support**: Existing customers with issues, complaints, or support requests.

Classification Rules:
- If sender domain matches recipient domain (e.g., both @shreemaruti.com) → likely internal_operations
- If email is from development tools (Bitbucket, GitHub, JIRA) → internal_operations
- If email discusses internal processes, APIs, software bugs, deployments → internal_operations
- If email is from unknown external party inquiring about services/pricing → sales_lead
- If email discusses deals, contracts, partnerships with external parties → sales_lead
- If existing customer has a problem or complaint → customer_support
- If automated notification or marketing → spam_noise

Provide your classification with confidence score and reasoning."""),
            ("human", """Classify this email:

**From:** {sender_email}
**Subject:** {subject}
**Content Preview:** {content}

Classify this email and explain your reasoning.""")
        ])

        self.chain = self.prompt | self.structured_llm

    async def __call__(self, state):
        try:
            sender_email = state.get("sender_email", "unknown")
            subject = state.get("subject", "No subject")
            content = state.get("filtered_content", "")

            content_preview = content[:1000] if len(content) > 1000 else content

            classification = await self.chain.ainvoke({
                "sender_email": sender_email,
                "subject": subject,
                "content": content_preview
            })

            return {
                "email_category": classification.category,
                "classification_confidence": classification.confidence,
                "classification_reasoning": classification.reasoning
            }
        except Exception as e:
            return {
                "email_category": "error",
                "classification_confidence": 0.0,
                "classification_reasoning": str(e)
            }


# Test emails covering different scenarios
TEST_EMAILS = [
    {
        "name": "External Sales Lead - Logistics Inquiry",
        "sender_email": "john.doe@externalcompany.com",
        "subject": "Looking for reliable logistics / transport service",
        "content": """Hi,

We are a manufacturing company looking for a reliable logistics partner for our shipments from Mumbai to Delhi.

Could you please share:
- Your pricing structure
- Transit times
- Insurance coverage

Looking forward to hearing from you.

Best regards,
John Doe""",
        "expected": "sales_lead"
    },
    {
        "name": "Internal Operations - Bitbucket PR",
        "sender_email": "pullrequests-reply@bitbucket.org",
        "subject": "Re: [Bitbucket] Pull request #530: Handle piece rate in bulk update prod",
        "content": """Nayan Ghoghari commented on pull request #530:

Handle piece rate in bulk update prod

Changes look good. Please ensure you've tested this on staging before merging.

Approved with comments.""",
        "expected": "internal_operations"
    },
    {
        "name": "Internal Operations - Same Domain",
        "sender_email": "anshul.deodia@shreemaruti.com",
        "subject": "Re: Request for NBA Booking API Endpoints - Integration Requirements",
        "content": """Hi Aniket,

As discussed, please set up a call to understand this better. There are some APIs that we don't have in the NBA.

Let's sync tomorrow at 3 PM.

Thanks,
Anshul""",
        "expected": "internal_operations"
    },
    {
        "name": "Internal Operations - Booking Software Request",
        "sender_email": "accounts.pune@shreemaruti.com",
        "subject": "Unlock/Block Booking Software",
        "content": """Dear Sir,

Please unlock booking software of below:
- Account XYZ
- Account ABC

Also block the booking software for these accounts.

Regards,
Accounts Team""",
        "expected": "internal_operations"
    },
    {
        "name": "Sales Lead - Partnership Inquiry",
        "sender_email": "rajesh.kumar@techcorpindia.com",
        "subject": "Enterprise SaaS Integration - 200 User Licenses",
        "content": """Hello,

We're interested in integrating your booking platform with our enterprise system for 200 users.

Could we schedule a demo and discuss:
- Pricing for enterprise licenses
- API integration capabilities
- Support and SLA terms

Best regards,
Rajesh Kumar
CTO, TechCorp India""",
        "expected": "sales_lead"
    },
    {
        "name": "Spam/Noise - MCN Report",
        "sender_email": "smcsoffical@gmail.com",
        "subject": "MCN Shipments Report",
        "content": """Daily shipment report

Total shipments: 145
Pending: 12
Completed: 133

[Automated Report - Do Not Reply]""",
        "expected": "spam_noise"
    },
    {
        "name": "Internal Operations - Project Status",
        "sender_email": "sachin.shelke@shreemaruti.com",
        "subject": "[IMPORTANT] BlazePost NBA Plan",
        "content": """Team,

Quick update on the NBA project:

Please ensure that each module owner updates daily progress and flags any blockers immediately.

We'll review this tracker in our next sync to ensure all dependencies are addressed on time.

Thanks,
Sachin""",
        "expected": "internal_operations"
    },
    {
        "name": "Customer Support - Service Restart",
        "sender_email": "client@evelynenterprises.com",
        "subject": "RE: Restart Service- Evelyn Ents",
        "content": """Hi,

Our booking service is down since yesterday. We've restarted multiple times but the issue persists.

Can you please look into this urgently? This is affecting our operations.

Thanks,
Client""",
        "expected": "customer_support"
    },
    {
        "name": "Sales Lead - Service Inquiry from Prospect",
        "sender_email": "procurement@newcompany.in",
        "subject": "Inquiry: Transport Services for Q1 2025",
        "content": """Dear Team,

We are planning our logistics for Q1 2025 and would like to evaluate your transport services.

Please share your rate card and terms for the following routes:
- Mumbai to Bangalore
- Delhi to Chennai
- Pune to Hyderabad

We expect monthly volumes of 500+ shipments.

Regards,
Procurement Team
New Company Pvt Ltd""",
        "expected": "sales_lead"
    }
]


async def test_classification():
    """Test email classification with sample emails"""
    print("🧪 Testing Email Classification Agent\n")
    print("=" * 80)

    # Initialize classifier
    classifier = ClassifyEmailNode()

    # Track results
    results = {
        "total": len(TEST_EMAILS),
        "correct": 0,
        "incorrect": 0,
        "errors": 0
    }

    for idx, test_email in enumerate(TEST_EMAILS, 1):
        print(f"\n📧 Test {idx}/{len(TEST_EMAILS)}: {test_email['name']}")
        print(f"From: {test_email['sender_email']}")
        print(f"Subject: {test_email['subject']}")
        print(f"Expected: {test_email['expected']}")

        try:
            # Create mock state
            state = {
                "sender_email": test_email["sender_email"],
                "subject": test_email["subject"],
                "filtered_content": test_email["content"]
            }

            # Run classification
            result = await classifier(state)

            category = result.get("email_category")
            confidence = result.get("classification_confidence", 0.0)
            reasoning = result.get("classification_reasoning", "")

            print(f"Result: {category} (confidence: {confidence:.2f})")
            print(f"Reasoning: {reasoning}")

            # Check if correct
            if category == test_email["expected"]:
                print("✅ CORRECT")
                results["correct"] += 1
            else:
                print(f"❌ INCORRECT (expected: {test_email['expected']}, got: {category})")
                results["incorrect"] += 1

        except Exception as e:
            print(f"❌ ERROR: {e}")
            results["errors"] += 1

        print("-" * 80)

    # Print summary
    print(f"\n\n📊 RESULTS SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {results['total']}")
    print(f"✅ Correct: {results['correct']} ({results['correct']/results['total']*100:.1f}%)")
    print(f"❌ Incorrect: {results['incorrect']} ({results['incorrect']/results['total']*100:.1f}%)")
    print(f"⚠️  Errors: {results['errors']}")
    print(f"\nAccuracy: {results['correct']/results['total']*100:.1f}%")

    # Pass/fail
    if results['correct'] >= results['total'] * 0.8:  # 80% threshold
        print("\n✅ CLASSIFICATION TEST PASSED")
    else:
        print("\n❌ CLASSIFICATION TEST FAILED - Accuracy below 80%")


if __name__ == "__main__":
    # Check for required env vars
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ Error: OPENROUTER_API_KEY environment variable not set")
        sys.exit(1)

    asyncio.run(test_classification())
