// API response types
export const enum TaskStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export const enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export const enum DealStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WON = 'won',
  LOST = 'lost'
}

export const enum DealStage {
  LEAD = 'lead',
  CONTACTED = 'contacted',
  DEMO = 'demo',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  QUALIFIED = 'qualified',
  CLOSED = 'closed',
  CLOSED_WON = 'closed_won'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee?: string;
  source_email_id: string;
  confidence: number;
  agent: string;
  audit_snippet: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  value?: number;
  currency: string; // Default: INR
  status: DealStatus;
  stage: DealStage;
  probability: number;
  contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
  source_email_id: string;
  confidence: number;
  agent: string;
  audit_snippet: string;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
  lastKey?: any;
  status: string;
}

export interface DealsResponse {
  deals: Deal[];
  count: number;
  lastKey?: any;
  status: string;
}

export interface StatsResponse {
  summary: {
    draft_tasks: number;
    draft_deals: number;
    total_tasks: number;
    total_deals: number;
    revenue?: number;
    revenue_trend?: string;
    active_deals?: number;
    closing_this_week?: number;
    conversion_rate?: number;
    conversion_trend?: string;
    new_contacts?: number;
  };
  generated_at: string;
  status: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  segment: string;
  status: string;
  deal_value: number;
  last_contact: string;
  created_at: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  count: number;
  status: string;
}