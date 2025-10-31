"""
Email Classification Node - Uses LLM to classify emails as sales-relevant or not
"""
import logging
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
import os

from ...models import ProcessingStatus
from ..state import EmailProcessingState

logger = logging.getLogger(__name__)


class EmailClassification(BaseModel):
    """Structured output for email classification"""
    category: str = Field(
        description="Email category: 'sales_lead', 'internal_operations', 'spam_noise', 'customer_support'"
    )
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0"
    )
    reasoning: str = Field(
        description="Brief explanation for the classification"
    )


class ClassifyEmailNode:
    """
    LangGraph node that uses LLM to classify emails into categories.
    Only 'sales_lead' emails proceed to task/deal extraction.
    """

    def __init__(self):
        """Initialize the classification agent with OpenRouter LLM"""
        api_key = os.getenv("OPENROUTER_API_KEY")
        model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-small")

        self.llm = ChatOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            model=model_name,
            temperature=0.1,  # Low temperature for consistent classification
        )

        # Create structured output LLM
        self.structured_llm = self.llm.with_structured_output(EmailClassification)

        # Classification prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert email classifier for a sales CRM system.

Your job is to classify incoming emails into one of these categories:

1. **sales_lead**: External prospects/customers inquiring about products, services, pricing, partnerships, proposals, or business opportunities. These are potential revenue-generating conversations.

2. **internal_operations**: Emails from colleagues within the same organization about internal tasks, operations, development work (like pull requests), API integrations, internal processes, or administrative matters.

3. **spam_noise**: Marketing emails, newsletters, automated notifications, unsubscribe confirmations, or irrelevant messages.

4. **customer_support**: Existing customers with issues, complaints, or support requests (not new sales opportunities).

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

        # Create the chain
        self.chain = self.prompt | self.structured_llm

    async def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Classify the email using LLM

        Args:
            state: Current processing state with email data

        Returns:
            Updated state with classification results
        """
        try:
            sender_email = state.get("sender_email", "unknown@unknown.com")
            subject = state.get("subject", "No subject")
            content = state.get("filtered_content", state.get("raw_content", ""))

            # Truncate content for classification (don't need full email)
            content_preview = content[:1000] if len(content) > 1000 else content

            logger.info(f"Classifying email from {sender_email}: {subject[:50]}...")

            # Run classification
            classification: EmailClassification = await self.chain.ainvoke({
                "sender_email": sender_email,
                "subject": subject,
                "content": content_preview
            })

            logger.info(
                f"Classification: {classification.category} "
                f"(confidence: {classification.confidence:.2f}) - {classification.reasoning}"
            )

            # Update state
            updates = {
                "email_category": classification.category,
                "classification_confidence": classification.confidence,
                "classification_reasoning": classification.reasoning
            }

            # If not a sales lead, mark for skipping
            if classification.category != "sales_lead":
                updates["status"] = ProcessingStatus.SKIPPED
                updates["error_message"] = f"Filtered: {classification.category} - {classification.reasoning}"

            return updates

        except Exception as e:
            logger.error(f"Classification failed: {e}", exc_info=True)
            # On error, default to processing (fail-open approach)
            return {
                "email_category": "unknown",
                "classification_confidence": 0.0,
                "classification_reasoning": f"Classification error: {str(e)}"
            }
