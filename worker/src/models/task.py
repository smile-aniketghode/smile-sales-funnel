from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import Field, validator
from .base import BaseEntity


class TaskStatus(str, Enum):
    DRAFT = "draft"
    ACCEPTED = "accepted" 
    REJECTED = "rejected"
    COMPLETED = "completed"


class TaskPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Task(BaseEntity):
    """Task model extracted from emails"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    status: TaskStatus = Field(default=TaskStatus.DRAFT)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[datetime] = None
    assignee: Optional[str] = None  # Person ID
    source_email_id: str = Field(..., description="Reference to email log entry")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    agent: str = Field(..., description="LLM agent that created the task")
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
    
    def is_high_confidence(self) -> bool:
        """Check if task has high confidence (>= 0.8)"""
        return self.confidence >= 0.8