"""Email parsing utilities"""

from email.message import EmailMessage


def extract_text_content(email_msg: EmailMessage) -> str:
    """
    Extract text content from email message
    
    Args:
        email_msg: Parsed email message
        
    Returns:
        Extracted text content
    """
    content_parts = []
    
    if email_msg.is_multipart():
        for part in email_msg.walk():
            if part.get_content_type() == "text/plain":
                try:
                    content_parts.append(part.get_payload(decode=True).decode('utf-8'))
                except Exception:
                    continue
    else:
        if email_msg.get_content_type() == "text/plain":
            try:
                payload = email_msg.get_payload()
                if isinstance(payload, str):
                    content_parts.append(payload)
                else:
                    content_parts.append(payload.decode('utf-8'))
            except Exception:
                pass
    
    return "\n\n".join(content_parts)


def extract_email_address(from_header: str) -> str:
    """
    Extract email address from From header

    Args:
        from_header: Raw From header string

    Returns:
        Cleaned email address
    """
    if '<' in from_header and '>' in from_header:
        start = from_header.find('<') + 1
        end = from_header.find('>')
        return from_header[start:end].lower()
    else:
        # Simple fallback
        parts = from_header.split()
        for part in parts:
            if '@' in part:
                return part.lower()
    return from_header.lower()


def extract_sender_name(from_header: str) -> str:
    """
    Extract sender name from From header

    Examples:
        "Sachin Shelke <sachin@example.com>" -> "Sachin Shelke"
        "John Doe" <john@example.com> -> "John Doe"
        "john@example.com" -> None

    Args:
        from_header: Raw From header string

    Returns:
        Sender name or None if not found
    """
    if '<' in from_header and '>' in from_header:
        # Extract name before the email address
        name = from_header[:from_header.find('<')].strip()
        # Remove quotes if present
        name = name.strip('"').strip("'").strip()
        return name if name else None
    else:
        # If no angle brackets, check if it looks like an email
        if '@' in from_header:
            return None
        # Otherwise treat the whole thing as a name
        return from_header.strip()