from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import Field, validator
from .base import BaseEntity


class DealStatus(str, Enum):
    DRAFT = "draft"
    ACCEPTED = "accepted"
    REJECTED = "rejected" 
    WON = "won"
    LOST = "lost"


class DealStage(str, Enum):
    LEAD = "lead"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED = "closed"


class Deal(BaseEntity):
    """Deal model extracted from emails"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    value: Optional[float] = Field(None, ge=0, description="Estimated deal value")
    currency: str = Field(default="INR", description="Currency code")
    status: DealStatus = Field(default=DealStatus.DRAFT)
    stage: DealStage = Field(default=DealStage.LEAD)
    probability: int = Field(default=50, ge=0, le=100, description="Win probability")
    contact_id: Optional[str] = None  # Person ID
    company_id: Optional[str] = None  # Company ID
    expected_close_date: Optional[datetime] = None
    source_email_id: str = Field(..., description="Reference to email log entry")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    agent: str = Field(..., description="LLM agent that created the deal")
    audit_snippet: str = Field(..., description="Email snippet used for extraction")
    
    @validator('confidence')
    def validate_confidence(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError('Confidence must be between 0.0 and 1.0')
        return v
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @validator('probability')
    def validate_probability(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Probability must be between 0 and 100')
        return v
    
    @validator('currency')
    def validate_currency(cls, v):
        # Simple currency validation - can be expanded
        valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']
        if v.upper() not in valid_currencies:
            raise ValueError(f'Currency must be one of: {valid_currencies}')
        return v.upper()
    
    def is_high_confidence(self) -> bool:
        """Check if deal has high confidence (>= 0.8)"""
        return self.confidence >= 0.8
    
    def is_high_value(self, threshold: float = 10000.0) -> bool:
        """Check if deal is high value"""
        return self.value is not None and self.value >= threshold