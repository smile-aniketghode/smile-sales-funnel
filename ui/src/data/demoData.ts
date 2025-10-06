// Demo mode sample data - 5 realistic business emails with pre-computed extraction results

import type { DemoEmail } from '../types/demo';
import { DealStage, DealStatus, TaskStatus, TaskPriority } from '../types/api';

/**
 * Sample emails for demo mode with realistic extraction results
 * Based on Innofulfill logistics/supply chain business context
 */
export const DEMO_EMAILS: DemoEmail[] = [
  // Email 1: High-value enterprise deal
  {
    id: 'demo-email-1',
    from: 'priya.sharma@techcorp.in',
    fromName: 'Priya Sharma',
    subject: 'Budget approval for enterprise project',
    body: `Hi Aniket,

Great news! We got budget approval for the ₹75 lakh enterprise deployment we discussed.

Our board has approved the comprehensive logistics solution for our pan-India operations. We need integrated warehousing, last-mile delivery, and real-time tracking capabilities across 15 major cities.

Can you send the detailed proposal by Friday? We're looking to start implementation by next quarter.

Thanks,
Priya Sharma
VP Engineering, TechCorp`,
    extractionResult: {
      deals: [
        {
          id: 'demo-deal-1',
          title: 'TechCorp - Pan-India Logistics Solution',
          description: 'Comprehensive logistics solution including warehousing, last-mile delivery, and real-time tracking across 15 major cities',
          value: 7500000, // ₹75L
          currency: 'INR',
          status: DealStatus.ACCEPTED,
          stage: DealStage.PROPOSAL,
          probability: 75,
          contact_id: 'demo-contact-1',
          company_id: 'demo-company-1',
          expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          source_email_id: 'demo-email-1',
          confidence: 0.95,
          agent: 'demo-ai',
          audit_snippet: 'budget approval for the ₹75 lakh enterprise deployment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: 'demo-task-1',
          title: 'Send detailed proposal to TechCorp',
          description: 'Prepare and send comprehensive proposal for pan-India logistics solution covering warehousing, delivery, and tracking',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.HIGH,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Friday (2 days)
          assignee: 'Aniket',
          source_email_id: 'demo-email-1',
          confidence: 0.92,
          agent: 'demo-ai',
          audit_snippet: 'Can you send the detailed proposal by Friday?',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      contacts: [
        {
          id: 'demo-contact-1',
          name: 'Priya Sharma',
          email: 'priya.sharma@techcorp.in',
          company: 'TechCorp',
          position: 'VP Engineering',
          segment: 'Enterprise',
          status: 'active',
          deal_value: 7500000,
          last_contact: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    },
    processingTime: 2500,
  },

  // Email 2: Follow-up task (no new deal)
  {
    id: 'demo-email-2',
    from: 'rajesh@acmeindia.com',
    fromName: 'Rajesh Kumar',
    subject: 'Demo follow-up - Case studies needed',
    body: `Hi Aniket,

Thanks for the excellent demo yesterday on your Innofulfill platform. The automated order assignment and route optimization features look promising for our e-commerce operations.

Can you send those case studies we discussed? Specifically interested in:
- Similar scale implementations (500+ orders/day)
- ROI metrics from existing clients
- Integration timeline with WooCommerce

Need them by tomorrow for the board meeting.

Best regards,
Rajesh Kumar
Operations Head, ACME India`,
    extractionResult: {
      deals: [], // No new deal, existing prospect
      tasks: [
        {
          id: 'demo-task-2',
          title: 'Send case studies to ACME India',
          description: 'Share case studies: similar scale implementations (500+ orders/day), ROI metrics, WooCommerce integration timeline',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.HIGH,
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          assignee: 'Aniket',
          source_email_id: 'demo-email-2',
          confidence: 0.88,
          agent: 'demo-ai',
          audit_snippet: 'Can you send those case studies we discussed? Need them by tomorrow',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      contacts: [
        {
          id: 'demo-contact-2',
          name: 'Rajesh Kumar',
          email: 'rajesh@acmeindia.com',
          company: 'ACME India',
          position: 'Operations Head',
          segment: 'Mid-Market',
          status: 'active',
          deal_value: 0,
          last_contact: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    },
    processingTime: 2200,
  },

  // Email 3: Large enterprise deal
  {
    id: 'demo-email-3',
    from: 'cfo@bigcorp.com',
    fromName: 'Amit Patel',
    subject: 'Q4 Budget Discussion - Logistics Partnership',
    body: `Dear Aniket,

Following our initial conversation, we're planning a ₹1.5 Cr deployment for Q4 to revamp our entire supply chain infrastructure.

The scope includes:
- 3PL services across 20 warehouses
- Integration with our existing ERP system
- COD reconciliation and finance dashboard
- Multi-SLA delivery options

Let's schedule a call next week to discuss terms and implementation roadmap.

Looking forward to a long-term partnership.

Regards,
Amit Patel
CFO, BigCorp Industries`,
    extractionResult: {
      deals: [
        {
          id: 'demo-deal-3',
          title: 'BigCorp - Supply Chain Infrastructure Overhaul',
          description: '3PL services across 20 warehouses with ERP integration, COD reconciliation, and multi-SLA delivery',
          value: 15000000, // ₹1.5Cr
          currency: 'INR',
          status: DealStatus.ACCEPTED,
          stage: DealStage.LEAD,
          probability: 60,
          contact_id: 'demo-contact-3',
          company_id: 'demo-company-3',
          expected_close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Q4
          source_email_id: 'demo-email-3',
          confidence: 0.93,
          agent: 'demo-ai',
          audit_snippet: "we're planning a ₹1.5 Cr deployment for Q4",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: 'demo-task-3',
          title: 'Schedule call with BigCorp CFO',
          description: 'Set up call next week to discuss Q4 deployment terms and implementation roadmap',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.HIGH,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
          assignee: 'Aniket',
          source_email_id: 'demo-email-3',
          confidence: 0.90,
          agent: 'demo-ai',
          audit_snippet: "Let's schedule a call next week to discuss terms",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      contacts: [
        {
          id: 'demo-contact-3',
          name: 'Amit Patel',
          email: 'cfo@bigcorp.com',
          company: 'BigCorp Industries',
          position: 'CFO',
          segment: 'Enterprise',
          status: 'active',
          deal_value: 15000000,
          last_contact: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    },
    processingTime: 2800,
  },

  // Email 4: Multi-task opportunity
  {
    id: 'demo-email-4',
    from: 'sarah@startup.io',
    fromName: 'Sarah Chen',
    subject: 'Next steps after demo',
    body: `Hi Aniket,

After our demo yesterday, the Innofulfill platform looks perfect for scaling our D2C operations. The marketplace integration and RTO management features address our key pain points.

We need:
1. Pricing for the ₹25L package (includes 10K monthly shipments)
2. Reference call with existing client in fashion/lifestyle space
3. Contract draft by Wednesday for legal review

Our founders are excited to move forward! The collection centre management feature will be game-changing for our returns process.

Best,
Sarah Chen
Co-founder, Startup.io`,
    extractionResult: {
      deals: [
        {
          id: 'demo-deal-4',
          title: 'Startup.io - D2C Operations Scaling',
          description: 'Innofulfill platform for D2C scaling with marketplace integration, RTO management, and collection centre features',
          value: 2500000, // ₹25L
          currency: 'INR',
          status: DealStatus.ACCEPTED,
          stage: DealStage.DEMO,
          probability: 80,
          contact_id: 'demo-contact-4',
          company_id: 'demo-company-4',
          expected_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
          source_email_id: 'demo-email-4',
          confidence: 0.89,
          agent: 'demo-ai',
          audit_snippet: 'Pricing for the ₹25L package (includes 10K monthly shipments)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: 'demo-task-4a',
          title: 'Send pricing details to Startup.io',
          description: 'Provide pricing breakdown for ₹25L package with 10K monthly shipments',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.MEDIUM,
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          assignee: 'Aniket',
          source_email_id: 'demo-email-4',
          confidence: 0.91,
          agent: 'demo-ai',
          audit_snippet: 'Pricing for the ₹25L package',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-task-4b',
          title: 'Arrange reference call for Startup.io',
          description: 'Set up reference call with existing client in fashion/lifestyle space',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.MEDIUM,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignee: 'Aniket',
          source_email_id: 'demo-email-4',
          confidence: 0.87,
          agent: 'demo-ai',
          audit_snippet: 'Reference call with existing client in fashion/lifestyle space',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-task-4c',
          title: 'Send contract draft to Startup.io',
          description: 'Prepare and send contract draft for legal review by Wednesday',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.HIGH,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Wednesday
          assignee: 'Aniket',
          source_email_id: 'demo-email-4',
          confidence: 0.93,
          agent: 'demo-ai',
          audit_snippet: 'Contract draft by Wednesday for legal review',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      contacts: [
        {
          id: 'demo-contact-4',
          name: 'Sarah Chen',
          email: 'sarah@startup.io',
          company: 'Startup.io',
          position: 'Co-founder',
          segment: 'Startup',
          status: 'active',
          deal_value: 2500000,
          last_contact: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    },
    processingTime: 3000,
  },

  // Email 5: Deal progression
  {
    id: 'demo-email-5',
    from: 'priya.sharma@techcorp.in',
    fromName: 'Priya Sharma',
    subject: 'RE: Proposal received - Moving to procurement',
    body: `Hi Aniket,

Perfect, got the detailed proposal. The pricing structure and implementation timeline look reasonable.

We're moving forward with procurement. Our legal team will review the contract terms by end of this week. The phased rollout approach you suggested (starting with Mumbai and Delhi) makes sense.

Let's schedule a call to discuss the SLA commitments and performance metrics. We're targeting a December go-live.

Thanks for the comprehensive proposal!

Priya Sharma
VP Engineering, TechCorp`,
    extractionResult: {
      deals: [], // Updates existing deal (demo-deal-1) to negotiation stage
      tasks: [
        {
          id: 'demo-task-5',
          title: 'Schedule SLA discussion call with TechCorp',
          description: 'Set up call to discuss SLA commitments and performance metrics for TechCorp deployment',
          status: TaskStatus.ACCEPTED,
          priority: TaskPriority.HIGH,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignee: 'Aniket',
          source_email_id: 'demo-email-5',
          confidence: 0.90,
          agent: 'demo-ai',
          audit_snippet: "Let's schedule a call to discuss the SLA commitments",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      contacts: [], // Existing contact, no new one
    },
    processingTime: 2100,
  },
];

/**
 * Calculate demo statistics from processed emails
 */
export function calculateDemoStats(deals: any[], tasks: any[], contacts: any[]): any {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const highConfidenceItems = [
    ...deals.filter(d => d.confidence >= 0.9),
    ...tasks.filter(t => t.confidence >= 0.9),
  ].length;
  const autoApprovedItems = [
    ...deals.filter(d => d.status === DealStatus.ACCEPTED),
    ...tasks.filter(t => t.status === TaskStatus.ACCEPTED),
  ].length;

  // Estimate time saved: ~10 min per deal, ~5 min per task for manual entry
  const timeSaved = (deals.length * 10) + (tasks.length * 5);

  return {
    totalDeals: deals.length,
    totalValue,
    totalTasks: tasks.length,
    totalContacts: contacts.length,
    highConfidenceItems,
    autoApprovedItems,
    timeSaved,
  };
}
