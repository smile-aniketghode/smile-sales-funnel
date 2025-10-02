from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, validator
import hashlib


class ProcessingStatus(str, Enum):
    PROCESSED = "processed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PrefilterResult(str, Enum):
    PASSED = "passed"
    FILTERED_OUT = "filtered_out"
    TOO_LARGE = "too_large"


class EmailLog(BaseModel):
    """Email processing log for idempotency and audit"""
    message_id_hash: str = Field(..., description="SHA256 hash of message-id + content")
    original_message_id: str = Field(..., description="Original Gmail message ID")
    user_id: str = Field(..., description="User/Gmail account that owns this email")
    subject: str = Field(..., max_length=500)
    sender_email: str = Field(..., description="Sender email address")
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    status: ProcessingStatus = Field(default=ProcessingStatus.PROCESSED)
    tasks_created: List[str] = Field(default_factory=list, description="Task IDs created")
    deals_created: List[str] = Field(default_factory=list, description="Deal IDs created")
    prefilter_result: PrefilterResult = Field(..., description="Prefilter outcome")
    llm_tokens_used: int = Field(default=0, ge=0, description="Tokens consumed")
    processing_time_ms: int = Field(default=0, ge=0, description="Processing duration")
    ttl: int = Field(..., description="Unix timestamp for TTL")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def __init__(self, **data):
        # Set TTL to 90 days from now if not provided
        if 'ttl' not in data:
            data['ttl'] = int((datetime.utcnow() + timedelta(days=90)).timestamp())
        super().__init__(**data)
    
    @validator('sender_email')
    def validate_email(cls, v):
        # Basic email validation
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v.lower()
    
    @staticmethod
    def generate_message_hash(message_id: str, content: str) -> str:
        """Generate SHA256 hash for message ID + content"""
        combined = f"{message_id}:{content}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    def add_task_created(self, task_id: str):
        """Add a task ID to the created list"""
        if task_id not in self.tasks_created:
            self.tasks_created.append(task_id)
    
    def add_deal_created(self, deal_id: str):
        """Add a deal ID to the created list"""
        if deal_id not in self.deals_created:
            self.deals_created.append(deal_id)
    
    def to_dynamodb_item(self) -> dict:
        """Convert to DynamoDB item format"""
        item = self.model_dump()
        # Convert datetime to ISO string
        if isinstance(item['processed_at'], datetime):
            item['processed_at'] = item['processed_at'].isoformat()
        return item