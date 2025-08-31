export enum ProcessingStatus {
  PROCESSED = 'processed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum PrefilterResult {
  PASSED = 'passed',
  FILTERED_OUT = 'filtered_out',
  TOO_LARGE = 'too_large'
}

export enum PersonSource {
  MANUAL = 'manual',
  EMAIL_EXTRACTION = 'email_extraction'
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  ENTERPRISE = 'enterprise'
}

export enum CompanySource {
  MANUAL = 'manual',
  DOMAIN_INFERENCE = 'domain_inference'
}

export interface EmailLog {
  message_id_hash: string;
  original_message_id: string;
  subject: string;
  sender_email: string;
  processed_at: string;
  status: ProcessingStatus;
  tasks_created: string[];
  deals_created: string[];
  prefilter_result: PrefilterResult;
  llm_tokens_used: number;
  processing_time_ms: number;
  ttl: number;
}

export interface Person {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_id?: string;
  job_title?: string;
  last_contact_date?: string;
  source: PersonSource;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  last_contact_date?: string;
  source: CompanySource;
  created_at: string;
  updated_at: string;
}