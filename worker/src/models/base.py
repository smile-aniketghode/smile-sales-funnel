from datetime import datetime
from typing import Optional
from uuid import uuid4
from decimal import Decimal
from pydantic import BaseModel, Field


class BaseEntity(BaseModel):
    """Base model for all entities with common fields"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
    def to_dynamodb_item(self) -> dict:
        """Convert to DynamoDB item format"""
        item = self.model_dump()
        # Convert datetime and float to DynamoDB-compatible types
        for key, value in item.items():
            if isinstance(value, datetime):
                item[key] = value.isoformat()
            elif isinstance(value, float):
                # DynamoDB doesn't support float, convert to Decimal
                item[key] = Decimal(str(value))
        return item