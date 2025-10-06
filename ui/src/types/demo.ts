// Demo mode types - defines structure for simulated email processing demo

import type { Deal, Task, Contact } from './api';

/**
 * Represents a single email in the demo queue
 */
export interface DemoEmail {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;

  /**
   * Pre-computed extraction results for this email
   */
  extractionResult: {
    deals: Deal[];
    tasks: Task[];
    contacts: Contact[];
  };

  /**
   * Simulated processing time in milliseconds
   */
  processingTime: number;
}

/**
 * Demo processing stages
 */
export enum DemoStage {
  IDLE = 'idle',                   // Demo not started
  SHOWING_EMAIL = 'showing_email', // Email content displayed
  ANALYZING = 'analyzing',         // AI analyzing animation
  SHOWING_RESULTS = 'showing_results', // Extraction results reveal
  UPDATING_DASHBOARD = 'updating_dashboard', // Dashboard updates
  READY_FOR_NEXT = 'ready_for_next', // Waiting for user to continue
  COMPLETE = 'complete'            // All emails processed
}

/**
 * Accumulated state after processing N emails
 */
export interface DemoState {
  currentEmailIndex: number;
  stage: DemoStage;
  deals: Deal[];
  tasks: Task[];
  contacts: Contact[];
  processedEmails: string[]; // IDs of processed emails
}

/**
 * Demo statistics for completion screen
 */
export interface DemoStats {
  totalDeals: number;
  totalValue: number;
  totalTasks: number;
  totalContacts: number;
  highConfidenceItems: number;
  autoApprovedItems: number;
  timeSaved: number; // estimated minutes saved
}
