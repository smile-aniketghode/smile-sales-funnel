from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
import json
import logging

from ...models import ProcessingStatus
from ..state import EmailProcessingState

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
    currency: str = Field(default="USD", description="Currency code")
    stage: str = Field(description="Deal stage: lead, qualified, proposal, negotiation, closed")
    probability: int = Field(description="Win probability between 0 and 100")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    snippet: str = Field(description="Email snippet that led to this extraction")


class ExtractionResult(BaseModel):
    """Complete extraction result"""
    tasks: List[TaskExtraction] = Field(default_factory=list)
    deals: List[DealExtraction] = Field(default_factory=list)


class ExtractLocalNode:
    """LangGraph node for local LLM extraction using OpenAI (or local compatible API)"""
    
    def __init__(self, model_name: str = "gpt-3.5-turbo", base_url: str = None):
        # Can point to local OpenAI-compatible API like llama.cpp server
        self.llm = ChatOpenAI(
            model=model_name,
            base_url=base_url,  # e.g., "http://localhost:8080/v1" for local
            temperature=0.1,  # Low temperature for consistent extraction
        )
        
        self.parser = JsonOutputParser(pydantic_object=ExtractionResult)
        
        # Create extraction prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "Analyze this email:\n\nSUBJECT: {subject}\nFROM: {sender}\n\nCONTENT:\n{content}")
        ])
        
        # Create extraction chain
        self.chain = self.prompt | self.llm | self.parser
    
    def __call__(self, state: EmailProcessingState) -> Dict[str, Any]:
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
            
            logger.info(f"Starting LLM extraction for email: {state['message_id']}")
            
            # Call LLM
            result = self.chain.invoke(llm_input)
            
            # Extract token usage (if available)
            tokens_used = 0  # Would need to implement token counting
            
            # Convert to dict format
            extraction_data = {
                "tasks": [task.dict() for task in result.tasks],
                "deals": [deal.dict() for deal in result.deals],
                "agent": self.llm.model_name,
                "tokens_used": tokens_used
            }
            
            logger.info(f"LLM extraction complete. Tasks: {len(result.tasks)}, Deals: {len(result.deals)}")
            
            return {
                "extraction_result": extraction_data,
                "tokens_used": tokens_used,
                "agent_used": self.llm.model_name
            }
            
        except Exception as e:
            logger.error(f"LLM extraction failed: {str(e)}")
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
- Examples: "Interested in $50K contract", "Budget approved for project", "Ready to purchase"
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