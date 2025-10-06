// Demo mode state management hook - handles local-only state for simulated processing

import { useState, useCallback } from 'react';
import type { DemoEmail, DemoState, DemoStats } from '../types/demo';
import { DemoStage } from '../types/demo';
import { DEMO_EMAILS, calculateDemoStats } from '../data/demoData';

/**
 * Custom hook for managing demo mode state
 * Handles email processing simulation, state accumulation, and transitions
 */
export function useDemoState() {
  const [state, setState] = useState<DemoState>({
    currentEmailIndex: -1, // -1 means not started
    stage: DemoStage.IDLE,
    deals: [],
    tasks: [],
    contacts: [],
    processedEmails: [],
  });

  const [currentEmail, setCurrentEmail] = useState<DemoEmail | null>(null);

  /**
   * Start processing the next email in the queue
   */
  const processNextEmail = useCallback(async () => {
    const nextIndex = state.currentEmailIndex + 1;

    if (nextIndex >= DEMO_EMAILS.length) {
      // All emails processed
      setState(prev => ({
        ...prev,
        stage: DemoStage.COMPLETE,
      }));
      return;
    }

    const email = DEMO_EMAILS[nextIndex];
    setCurrentEmail(email);

    // Stage 1: Show email content
    setState(prev => ({
      ...prev,
      currentEmailIndex: nextIndex,
      stage: DemoStage.SHOWING_EMAIL,
    }));

    await sleep(1500); // Show email for 1.5s

    // Stage 2: AI analyzing
    setState(prev => ({ ...prev, stage: DemoStage.ANALYZING }));
    await sleep(2000); // Analyzing animation for 2s

    // Stage 3: Show extraction results
    setState(prev => ({ ...prev, stage: DemoStage.SHOWING_RESULTS }));
    await sleep(2500); // Show results for 2.5s

    // Stage 4: Update dashboard with accumulated data
    setState(prev => {
      // Handle Email 5 special case: updates existing TechCorp deal to negotiation stage
      let updatedDeals = [...prev.deals, ...email.extractionResult.deals];

      if (email.id === 'demo-email-5') {
        // Update demo-deal-1 (TechCorp) to negotiation stage
        updatedDeals = updatedDeals.map(deal =>
          deal.id === 'demo-deal-1'
            ? { ...deal, stage: 'negotiation' as any }
            : deal
        );
      }

      // Deduplicate contacts by email
      const existingContactEmails = new Set(prev.contacts.map(c => c.email));
      const newContacts = email.extractionResult.contacts.filter(
        c => !existingContactEmails.has(c.email)
      );

      return {
        ...prev,
        stage: DemoStage.UPDATING_DASHBOARD,
        deals: updatedDeals,
        tasks: [...prev.tasks, ...email.extractionResult.tasks],
        contacts: [...prev.contacts, ...newContacts],
        processedEmails: [...prev.processedEmails, email.id],
      };
    });

    await sleep(1000); // Dashboard update animation for 1s

    // Stage 5: Ready for next email
    if (nextIndex < DEMO_EMAILS.length - 1) {
      setState(prev => ({ ...prev, stage: DemoStage.READY_FOR_NEXT }));
    } else {
      // Last email processed, go to complete
      setState(prev => ({ ...prev, stage: DemoStage.COMPLETE }));
    }
  }, [state.currentEmailIndex]);

  /**
   * Reset demo to initial state
   */
  const reset = useCallback(() => {
    setState({
      currentEmailIndex: -1,
      stage: DemoStage.IDLE,
      deals: [],
      tasks: [],
      contacts: [],
      processedEmails: [],
    });
    setCurrentEmail(null);
  }, []);

  /**
   * Get statistics for completion screen
   */
  const getStats = useCallback((): DemoStats => {
    return calculateDemoStats(state.deals, state.tasks, state.contacts);
  }, [state.deals, state.tasks, state.contacts]);

  /**
   * Get remaining email count
   */
  const getRemainingCount = useCallback((): number => {
    return DEMO_EMAILS.length - (state.currentEmailIndex + 1);
  }, [state.currentEmailIndex]);

  /**
   * Check if demo is in progress
   */
  const isProcessing = useCallback((): boolean => {
    return [
      DemoStage.SHOWING_EMAIL,
      DemoStage.ANALYZING,
      DemoStage.SHOWING_RESULTS,
      DemoStage.UPDATING_DASHBOARD,
    ].includes(state.stage);
  }, [state.stage]);

  return {
    // State
    state,
    currentEmail,

    // Actions
    processNextEmail,
    reset,

    // Computed values
    getStats,
    getRemainingCount,
    isProcessing,

    // Constants
    totalEmails: DEMO_EMAILS.length,
  };
}

/**
 * Utility: Sleep helper for simulating async delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
