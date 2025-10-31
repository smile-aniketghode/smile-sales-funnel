import re
from typing import Tuple
from email.message import EmailMessage

from ..models import PrefilterResult


class PrefilterService:
    """Email prefiltering service to reduce unnecessary LLM processing"""
    
    # Configuration
    MAX_CONTENT_LENGTH = 5000  # Max characters to send to LLM
    MIN_CONTENT_LENGTH = 20    # Minimum meaningful content
    
    # Regex patterns for filtering
    SPAM_PATTERNS = [
        r'\b(unsubscribe|opt[\-\s]?out)\b',
        r'\b(lottery|winner|congratulations)\b',
        r'\b(viagra|cialis|pharmacy)\b',
        r'\b(nigerian prince|inheritance)\b'
    ]
    
    # Keywords that suggest business relevance
    BUSINESS_KEYWORDS = [
        'proposal', 'quote', 'contract', 'agreement', 'deal', 'partnership',
        'meeting', 'call', 'schedule', 'follow up', 'followup',
        'project', 'requirements', 'budget', 'timeline', 'deadline',
        'client', 'customer', 'vendor', 'supplier', 'service',
        'purchase', 'order', 'invoice', 'payment', 'pricing',
        'logistics', 'transport', 'shipping', 'delivery', 'freight',
        'looking for', 'inquiry', 'request', 'need', 'require'
    ]
    
    # Email domains to prioritize
    PRIORITY_DOMAINS = [
        'gmail.com', 'outlook.com', 'yahoo.com',  # Personal
        # Add business domains as needed
    ]
    
    def __init__(self):
        self.spam_regex = re.compile('|'.join(self.SPAM_PATTERNS), re.IGNORECASE)
        self.business_regex = re.compile('|'.join(self.BUSINESS_KEYWORDS), re.IGNORECASE)
    
    async def process(self, content: str, email_msg: EmailMessage) -> Tuple[PrefilterResult, str]:
        """
        Process email through prefilters
        
        Args:
            content: Email text content
            email_msg: Parsed email message
            
        Returns:
            Tuple of (filter_result, processed_content)
        """
        # Check content length
        if len(content) < self.MIN_CONTENT_LENGTH:
            return PrefilterResult.FILTERED_OUT, ""
        
        # Check for spam patterns
        if self._is_spam(content, email_msg):
            return PrefilterResult.FILTERED_OUT, ""
        
        # Truncate if too long
        if len(content) > self.MAX_CONTENT_LENGTH:
            content = self._smart_truncate(content)
            if len(content) > self.MAX_CONTENT_LENGTH:
                return PrefilterResult.TOO_LARGE, ""
        
        # Check for business relevance (optional scoring)
        business_score = self._calculate_business_score(content, email_msg)
        if business_score < 0.05:  # Very low business relevance (lowered threshold)
            return PrefilterResult.FILTERED_OUT, ""
        
        return PrefilterResult.PASSED, content
    
    def _is_spam(self, content: str, email_msg: EmailMessage) -> bool:
        """Check if email appears to be spam"""
        # Check content for spam patterns
        if self.spam_regex.search(content):
            return True
        
        # Check subject for spam patterns
        subject = email_msg.get('Subject', '')
        if self.spam_regex.search(subject):
            return True
        
        # Check for excessive caps (>50% of letters)
        letters = [c for c in content if c.isalpha()]
        if letters:
            caps_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
            if caps_ratio > 0.5:
                return True
        
        return False
    
    def _calculate_business_score(self, content: str, email_msg: EmailMessage) -> float:
        """Calculate business relevance score (0.0 - 1.0)"""
        score = 0.0
        
        # Business keywords in content
        business_matches = len(self.business_regex.findall(content))
        score += min(business_matches * 0.1, 0.5)  # Max 0.5 from content
        
        # Business keywords in subject
        subject = email_msg.get('Subject', '')
        subject_matches = len(self.business_regex.findall(subject))
        score += min(subject_matches * 0.2, 0.3)  # Max 0.3 from subject
        
        # Sender domain reputation (simple check)
        sender = email_msg.get('From', '')
        if any(domain in sender.lower() for domain in self.PRIORITY_DOMAINS):
            score += 0.1
        
        # Has attachments (might indicate business communication)
        if email_msg.is_multipart():
            for part in email_msg.walk():
                if part.get_content_disposition() == 'attachment':
                    score += 0.1
                    break
        
        return min(score, 1.0)
    
    def _smart_truncate(self, content: str) -> str:
        """
        Intelligently truncate content while preserving important parts
        """
        # Try to preserve the beginning and end, removing middle
        if len(content) <= self.MAX_CONTENT_LENGTH:
            return content
        
        # Keep first 60% and last 20%
        first_part_size = int(self.MAX_CONTENT_LENGTH * 0.6)
        last_part_size = int(self.MAX_CONTENT_LENGTH * 0.2)
        
        first_part = content[:first_part_size]
        last_part = content[-last_part_size:] if last_part_size > 0 else ""
        
        # Add truncation indicator
        truncated = first_part + "\n\n[... content truncated ...]\n\n" + last_part
        
        # If still too long, just take the beginning
        if len(truncated) > self.MAX_CONTENT_LENGTH:
            return content[:self.MAX_CONTENT_LENGTH - 20] + "\n[... truncated]"
        
        return truncated