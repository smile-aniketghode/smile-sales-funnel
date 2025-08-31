from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import Field, validator, EmailStr
from .base import BaseEntity


class PersonSource(str, Enum):
    MANUAL = "manual"
    EMAIL_EXTRACTION = "email_extraction"


class Person(BaseEntity):
    """Person/Contact model"""
    email: EmailStr = Field(..., description="Primary email address")
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_id: Optional[str] = None
    job_title: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    source: PersonSource = Field(default=PersonSource.EMAIL_EXTRACTION)
    
    @validator('email')
    def validate_email(cls, v):
        return v.lower()
    
    @validator('name', 'first_name', 'last_name', 'job_title')
    def validate_string_fields(cls, v):
        if v is not None:
            return v.strip() if v.strip() else None
        return v
    
    def get_display_name(self) -> str:
        """Get display name prioritizing full name, then first+last, then email"""
        if self.name:
            return self.name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        else:
            return self.email.split('@')[0]
    
    def infer_name_from_email(self):
        """Attempt to infer name from email address"""
        if not self.name and not self.first_name:
            local_part = self.email.split('@')[0]
            # Handle common patterns like firstname.lastname
            if '.' in local_part:
                parts = local_part.split('.')
                if len(parts) == 2:
                    self.first_name = parts[0].capitalize()
                    self.last_name = parts[1].capitalize()
                    self.name = f"{self.first_name} {self.last_name}"