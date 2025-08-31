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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string; // ISO 8601 date string
  assignee?: string; // Person ID
  source_email_id: string;
  confidence: number; // 0.0-1.0
  agent: string;
  audit_snippet: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority?: TaskPriority;
  due_date?: string;
  assignee?: string;
  source_email_id: string;
  confidence: number;
  agent: string;
  audit_snippet: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assignee?: string;
}