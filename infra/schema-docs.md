# DynamoDB Table Schemas

## Tasks Table
**Primary Key:** `id` (String)  
**GSI:** `status-created_at-index` (status, created_at)

### Fields
- `id`: Unique task identifier (UUID)
- `title`: Task title/summary
- `description`: Detailed task description
- `status`: draft | accepted | rejected | completed
- `priority`: high | medium | low
- `due_date`: ISO 8601 date string (optional)
- `assignee`: Person ID (optional)
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `source_email_id`: Reference to email log entry
- `confidence`: Confidence score (0.0-1.0)
- `agent`: LLM agent that created the task
- `audit_snippet`: Email snippet used for extraction

## Deals Table
**Primary Key:** `id` (String)  
**GSI:** `status-created_at-index` (status, created_at)

### Fields
- `id`: Unique deal identifier (UUID)
- `title`: Deal title/summary
- `description`: Deal description
- `value`: Estimated deal value (number)
- `currency`: Currency code (default: USD)
- `status`: draft | accepted | rejected | won | lost
- `stage`: lead | qualified | proposal | negotiation | closed
- `probability`: Win probability (0-100)
- `contact_id`: Person ID
- `company_id`: Company ID (optional)
- `expected_close_date`: ISO 8601 date string
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `source_email_id`: Reference to email log entry
- `confidence`: Confidence score (0.0-1.0)
- `agent`: LLM agent that created the deal
- `audit_snippet`: Email snippet used for extraction

## EmailLog Table
**Primary Key:** `message_id_hash` (String)  
**GSI:** `processed_at-index` (processed_at)  
**TTL:** `ttl` field (90 days retention)

### Fields
- `message_id_hash`: SHA256 hash of Gmail message-id + content hash
- `original_message_id`: Original Gmail message ID
- `subject`: Email subject line
- `sender_email`: Sender email address
- `processed_at`: ISO 8601 timestamp
- `status`: processed | failed | skipped
- `tasks_created`: Array of task IDs created from this email
- `deals_created`: Array of deal IDs created from this email
- `prefilter_result`: passed | filtered_out | too_large
- `llm_tokens_used`: Number of tokens consumed
- `processing_time_ms`: Processing duration
- `ttl`: Unix timestamp for TTL (90 days from processed_at)

## People Table
**Primary Key:** `id` (String)  
**GSI:** `email-index` (email)

### Fields
- `id`: Unique person identifier (UUID)
- `email`: Primary email address (unique)
- `name`: Full name
- `first_name`: First name
- `last_name`: Last name
- `phone`: Phone number (optional)
- `company_id`: Company ID (optional)
- `job_title`: Job title/role
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `last_contact_date`: Last email interaction date
- `source`: manual | email_extraction

## Companies Table
**Primary Key:** `id` (String)  
**GSI:** `domain-index` (domain)

### Fields
- `id`: Unique company identifier (UUID)
- `name`: Company name
- `domain`: Primary domain (unique)
- `website`: Company website
- `industry`: Industry category
- `size`: startup | small | medium | enterprise
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp
- `last_contact_date`: Last interaction date
- `source`: manual | domain_inference

## Deployment

Deploy tables using:
```bash
cd infra/
./deploy.sh [stack-name] [region]
```

Default: `smile-sales-funnel-dev` in `us-east-1`