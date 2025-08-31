// API response types matching NestJS backend
export enum TaskStatus {
  DRAFT = 'draft',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

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
  currency: string;
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

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
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
  };
  generated_at: string;
  status: string;
}