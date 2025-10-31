from typing import List, Dict, Any, Optional, TypedDict
from datetime import datetime
from ..models import Task, Deal, EmailLog, PrefilterResult, ProcessingStatus


class EmailProcessingState(TypedDict):
    """State object that flows through the LangGraph workflow"""

    # Input data
    message_id: str
    subject: str
    sender_email: str
    sender_name: Optional[str]
    raw_content: str
    source: str
    user_id: str  # Gmail account/user that owns this email
    
    # Processing metadata
    message_hash: str
    start_time: float
    processing_time_ms: int
    
    # Classification results
    email_category: Optional[str]  # sales_lead, internal_operations, spam_noise, customer_support
    classification_confidence: Optional[float]
    classification_reasoning: Optional[str]

    # Prefilter results
    prefilter_result: PrefilterResult
    filtered_content: str
    business_score: float
    
    # LLM extraction results
    extraction_result: Dict[str, Any]
    tokens_used: int
    agent_used: str
    
    # Confidence gating
    high_confidence_tasks: List[Dict[str, Any]]
    draft_tasks: List[Dict[str, Any]]
    high_confidence_deals: List[Dict[str, Any]]
    draft_deals: List[Dict[str, Any]]
    
    # Final entities
    created_tasks: List[Task]
    created_deals: List[Deal]
    
    # Persistence results
    tasks_saved: List[str]  # Task IDs
    deals_saved: List[str]  # Deal IDs
    email_log: EmailLog
    
    # Status tracking
    status: ProcessingStatus
    error_message: Optional[str]
    
    # Events to emit
    events_to_emit: List[Dict[str, Any]]