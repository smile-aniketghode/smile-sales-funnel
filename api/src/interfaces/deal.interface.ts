export enum DealStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WON = 'won',
  LOST = 'lost'
}

export enum DealStage {
  LEAD = 'lead',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED = 'closed'
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  value?: number;
  currency: string;
  status: DealStatus;
  stage: DealStage;
  probability: number; // 0-100
  contact_id?: string; // Person ID
  company_id?: string; // Company ID
  expected_close_date?: string; // ISO 8601 date string
  source_email_id: string;
  confidence: number; // 0.0-1.0
  agent: string;
  audit_snippet: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface CreateDealDto {
  title: string;
  description: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
  source_email_id: string;
  confidence: number;
  agent: string;
  audit_snippet: string;
}

export interface UpdateDealDto {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  status?: DealStatus;
  stage?: DealStage;
  probability?: number;
  contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
}