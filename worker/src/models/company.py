from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import Field, validator
from .base import BaseEntity


class CompanySize(str, Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    ENTERPRISE = "enterprise"


class CompanySource(str, Enum):
    MANUAL = "manual"
    DOMAIN_INFERENCE = "domain_inference"


class Company(BaseEntity):
    """Company model"""
    name: str = Field(..., min_length=1, max_length=200)
    domain: str = Field(..., description="Primary domain")
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[CompanySize] = None
    last_contact_date: Optional[datetime] = None
    source: CompanySource = Field(default=CompanySource.DOMAIN_INFERENCE)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Company name cannot be empty')
        return v.strip()
    
    @validator('domain')
    def validate_domain(cls, v):
        # Basic domain validation
        if not v or '.' not in v or ' ' in v:
            raise ValueError('Invalid domain format')
        return v.lower()
    
    @validator('website')
    def validate_website(cls, v):
        if v:
            # Ensure website starts with http/https
            v = v.strip()
            if v and not v.startswith(('http://', 'https://')):
                v = f"https://{v}"
        return v
    
    @classmethod
    def from_domain(cls, domain: str, name: Optional[str] = None) -> 'Company':
        """Create company from domain, inferring name if not provided"""
        domain = domain.lower()
        if not name:
            # Try to infer name from domain
            name = domain.split('.')[0].replace('-', ' ').replace('_', ' ').title()
        
        return cls(
            name=name,
            domain=domain,
            website=f"https://{domain}",
            source=CompanySource.DOMAIN_INFERENCE
        )