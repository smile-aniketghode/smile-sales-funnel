from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
import json
import logging
import os

from ...models import ProcessingStatus
from ..state import EmailProcessingState
from ...services.openrouter_llm import OpenRouterLLM

logger = logging.getLogger(__name__)


class TaskExtraction(BaseModel):
    """Schema for task extraction"""
    title: str = Field(description="Clear, actionable task title")
    description: str = Field(description="Detailed task description")
    priority: str = Field(description="Task priority: high, medium, or low")
    due_date: str = Field(default="", description="Due date if mentioned (YYYY-MM-DD)")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    snippet: str = Field(description="Email snippet that led to this extraction")


class DealExtraction(BaseModel):
    """Schema for deal extraction"""
    title: str = Field(description="Deal title or opportunity name")
    description: str = Field(description="Detailed deal description")
    value: float = Field(default=0.0, description="Estimated deal value")
    currency: str = Field(default="INR", description="Currency code")
    stage: str = Field(description="Deal stage: lead, contacted, demo, proposal, negotiation, closed_won")
    probability: int = Field(description="Win probability between 0 and 100")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    snippet: str = Field(description="Email snippet that led to this extraction")


class ExtractionResult(BaseModel):
    """Complete extraction result"""
    tasks: List[TaskExtraction] = Field(default_factory=list)
    deals: List[DealExtraction] = Field(default_factory=list)


class ExtractLocalNode:
    """LangGraph node for LLM extraction using OpenRouter"""

    def __init__(
        self,
        model_name: str = None,
        api_key: str = None
    ):
        """
        Initialize extraction node with OpenRouter LLM

        Args:
            model_name: Model name (defaults to OPENROUTER_MODEL env var)
            api_key: OpenRouter API key (defaults to OPENROUTER_API_KEY env var)
        """
        # Use OpenRouter only (removed Ollama support)
        self.provider = "openrouter"
        model = model_name or os.getenv("OPENROUTER_MODEL", "mistralai/mistral-small")
        self.llm = OpenRouterLLM(
            model=model,
            api_key=api_key or os.getenv("OPENROUTER_API_KEY"),
            temperature=0.1,
        )
        logger.info(f"Using OpenRouter with model: {model}")

        self.parser = JsonOutputParser(pydantic_object=ExtractionResult)

        # Create extraction prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "Analyze this email:\n\nSUBJECT: {subject}\nFROM: {sender}\n\nCONTENT:\n{content}")
        ])

        # Create extraction chain
        self.chain = self.prompt | self.llm | self.parser

    async def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
        """
        Execute LLM extraction

        Args:
            state: Current processing state

        Returns:
            Updated state with extraction results
        """
        # Skip if already failed or filtered
        if state.get("status") in [ProcessingStatus.FAILED, ProcessingStatus.SKIPPED]:
            return {}

        try:
            # Prepare input for LLM
            llm_input = {
                "subject": state["subject"],
                "sender": state["sender_email"],
                "content": state["filtered_content"]
            }

            logger.info(f"Starting {self.provider} LLM extraction for email: {state['message_id']}")

            # Call LLM
            result = await self.chain.ainvoke(llm_input)

            # Extract token usage (if available)
            tokens_used = 0  # Would need to implement token counting

            logger.info(f"LLM returned: {type(result)} - {result}")

            # Handle both dict and Pydantic model results
            if isinstance(result, dict):
                # LLM returned dict - extract tasks and deals
                tasks_data = []
                deals_data = []

                for task_raw in result.get("tasks", []):
                    # Convert simplified format to full task format
                    # Extract title and description from available fields
                    # LLM returns 'task' field, use that as title if available
                    title = task_raw.get("task", task_raw.get("title", task_raw.get("text", task_raw.get("snippet", "Unknown task"))))
                    description = task_raw.get("snippet", task_raw.get("description", task_raw.get("text", title)))

                    task_data = {
                        "title": title,
                        "description": description if description else title,  # Ensure description is not empty
                        "priority": task_raw.get("priority", "medium"),
                        "due_date": task_raw.get("due_date", ""),
                        "confidence": task_raw.get("confidence", 0.5),
                        "snippet": task_raw.get("snippet", task_raw.get("text", title))
                    }
                    tasks_data.append(task_data)

                for deal_raw in result.get("deals", []):
                    # Convert simplified format to full deal format
                    # Extract title and description from available fields
                    title = deal_raw.get("title", deal_raw.get("text", deal_raw.get("snippet", "Unknown deal")))
                    description = deal_raw.get("description", deal_raw.get("snippet", deal_raw.get("text", title)))

                    deal_data = {
                        "title": title,
                        "description": description if description else title,  # Ensure description is not empty
                        "value": deal_raw.get("value", 0.0),
                        "currency": deal_raw.get("currency", "INR"),
                        "stage": deal_raw.get("stage", "lead"),
                        "probability": deal_raw.get("probability", 50),
                        "confidence": deal_raw.get("confidence", 0.5),
                        "snippet": deal_raw.get("snippet", deal_raw.get("text", title))
                    }
                    deals_data.append(deal_data)

                # Create extraction data
                extraction_data = {
                    "tasks": tasks_data,
                    "deals": deals_data,
                    "agent": getattr(self.llm, 'model', getattr(self.llm, 'model_name', self.provider)),
                    "tokens_used": tokens_used
                }
            else:
                # Pydantic model result
                extraction_data = {
                    "tasks": [task.dict() for task in result.tasks],
                    "deals": [deal.dict() for deal in result.deals],
                    "agent": getattr(self.llm, 'model', getattr(self.llm, 'model_name', self.provider)),
                    "tokens_used": tokens_used
                }

            logger.info(f"{self.provider} extraction complete. Tasks: {len(extraction_data['tasks'])}, Deals: {len(extraction_data['deals'])}")

            return {
                "extraction_result": extraction_data,
                "tokens_used": tokens_used,
                "agent_used": getattr(self.llm, 'model', getattr(self.llm, 'model_name', self.provider))
            }

        except Exception as e:
            logger.error(f"{self.provider} LLM extraction failed: {str(e)}")
            return {
                "status": ProcessingStatus.FAILED,
                "error_message": f"LLM extraction error: {str(e)}",
                "extraction_result": {"tasks": [], "deals": [], "agent": "failed", "tokens_used": 0},
                "tokens_used": 0,
                "agent_used": "failed"
            }

    def _get_system_prompt(self) -> str:
        """Get the system prompt for extraction"""
        return """You are a business email analyzer. Extract actionable tasks and potential deals from email content.

TASK EXTRACTION RULES:
- Only extract clear, actionable tasks with specific action verbs
- Must be specific enough to be actionable (not vague references)
- Examples: "Send proposal by Friday", "Schedule follow-up call", "Review contract terms"
- Set confidence based on clarity and actionability (0.0-1.0)

DEAL EXTRACTION RULES:
- Only identify potential revenue opportunities with genuine buying interest
- Must indicate monetary value, contract potential, or purchase intent
- Examples: "Interested in ₹50L contract", "Budget approved for ₹25 lakh project", "Ready to purchase for ₹2 crore"
- **IMPORTANT - Deal Value Format:**
  - Convert Indian currency to numeric INR (no symbols, no text)
  - ₹1 Lakh (L) = 100000, ₹1 Crore (Cr) = 10000000
  - Examples: "₹50L" → value: 5000000, "₹1.5 Cr" → value: 15000000, "₹2.5 lakhs" → value: 250000
  - If range given (e.g., "₹50L to ₹1Cr"), use the lower value
  - If multi-year total given (e.g., "₹50L first year, ₹1.5Cr over 3 years"), use first year value
- Currency: Always "INR" for Indian Rupee deals
- Deal stages: lead, contacted, demo, proposal, negotiation, closed_won
- Set confidence based on buying signals strength (0.0-1.0)

OUTPUT REQUIREMENTS:
- Return valid JSON matching the schema
- Include specific email snippets for each extraction
- Set realistic confidence scores
- Use empty arrays if no clear tasks/deals found
- Be conservative - false negatives better than false positives

CONFIDENCE SCORING:
- 0.9-1.0: Explicitly stated with clear details
- 0.7-0.8: Strongly implied with good context
- 0.5-0.6: Moderately suggested
- 0.3-0.4: Weakly implied
- 0.0-0.2: Very uncertain

Respond only with valid JSON. No additional text."""

    async def extract_batch(self, emails_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract tasks and deals from multiple emails using LangChain's batch processing

        Args:
            emails_data: List of dicts with keys: subject, sender, content

        Returns:
            List of extraction results matching input order: [{tasks: [], deals: []}, ...]
        """
        try:
            logger.info(f"Starting batch LLM extraction for {len(emails_data)} emails using LangChain abatch")

            # Prepare batch inputs
            batch_inputs = [
                {
                    "subject": email["subject"],
                    "sender": email["sender"],
                    "content": email["content"]
                }
                for email in emails_data
            ]

            # Use LangChain's abatch for parallel processing
            results = await self.chain.abatch(batch_inputs)

            # Process results
            processed_results = []
            for idx, result in enumerate(results):
                if isinstance(result, dict):
                    # Extract tasks and deals
                    tasks_data = []
                    for task_raw in result.get("tasks", []):
                        title = task_raw.get("task", task_raw.get("title", task_raw.get("snippet", "Unknown task")))
                        description = task_raw.get("snippet", task_raw.get("description", title))

                        task_data = {
                            "title": title,
                            "description": description if description else title,
                            "priority": task_raw.get("priority", "medium"),
                            "due_date": task_raw.get("due_date", ""),
                            "confidence": task_raw.get("confidence", 0.5),
                            "snippet": task_raw.get("snippet", title)
                        }
                        tasks_data.append(task_data)

                    deals_data = []
                    for deal_raw in result.get("deals", []):
                        title = deal_raw.get("title", deal_raw.get("snippet", "Unknown deal"))
                        description = deal_raw.get("description", deal_raw.get("snippet", title))

                        deal_data = {
                            "title": title,
                            "description": description if description else title,
                            "value": deal_raw.get("value", 0.0),
                            "currency": deal_raw.get("currency", "INR"),
                            "stage": deal_raw.get("stage", "lead"),
                            "probability": deal_raw.get("probability", 50),
                            "confidence": deal_raw.get("confidence", 0.5),
                            "snippet": deal_raw.get("snippet", title)
                        }
                        deals_data.append(deal_data)

                    processed_results.append({
                        "tasks": tasks_data,
                        "deals": deals_data
                    })
                else:
                    # Empty result
                    processed_results.append({"tasks": [], "deals": []})

            logger.info(f"Batch extraction complete. Processed {len(processed_results)} emails")
            return processed_results

        except Exception as e:
            logger.error(f"Batch LLM extraction failed: {str(e)}")
            # Return empty results for all emails on error
            return [{"tasks": [], "deals": []} for _ in emails_data]

