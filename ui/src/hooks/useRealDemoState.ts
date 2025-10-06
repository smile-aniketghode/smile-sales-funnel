// Real AI demo mode state management - calls backend API for extraction

import { useState, useCallback } from 'react';
import type { Deal, Task, Contact } from '../types/api';
import { demoAPI } from '../services/api';

export enum RealDemoStage {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  SHOWING_RESULTS = 'showing_results',
  ERROR = 'error',
}

interface RealDemoState {
  stage: RealDemoStage;
  deals: Deal[];
  tasks: Task[];
  contacts: Contact[];
  remainingRequests: number;
  error: string | null;
  isProcessing: boolean;
}

interface ProcessEmailResult {
  success: boolean;
  deals: Deal[];
  tasks: Task[];
  contacts: Contact[];
  remainingRequests: number;
  error?: string;
}

/**
 * Custom hook for real AI demo mode
 * Calls backend API for actual LLM extraction (rate limited, no persistence)
 */
export function useRealDemoState() {
  const [state, setState] = useState<RealDemoState>({
    stage: RealDemoStage.IDLE,
    deals: [],
    tasks: [],
    contacts: [],
    remainingRequests: 5,
    error: null,
    isProcessing: false,
  });

  /**
   * Process email with real AI extraction
   */
  const processEmail = useCallback(async (emailText: string): Promise<ProcessEmailResult> => {
    try {
      // Set analyzing state
      setState(prev => ({
        ...prev,
        stage: RealDemoStage.ANALYZING,
        isProcessing: true,
        error: null,
      }));

      // Call backend API
      const response = await demoAPI.processEmail(emailText);

      // Extract results
      const newDeals = response.deals || [];
      const newTasks = response.tasks || [];
      const newContacts = response.contacts || [];
      const remaining = response.rate_limit?.remaining || 0;

      // Update state with results
      setState(prev => ({
        ...prev,
        stage: RealDemoStage.SHOWING_RESULTS,
        deals: [...prev.deals, ...newDeals],
        tasks: [...prev.tasks, ...newTasks],
        contacts: [...prev.contacts, ...newContacts],
        remainingRequests: remaining,
        isProcessing: false,
      }));

      // Auto-transition back to IDLE after showing results
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          stage: RealDemoStage.IDLE,
        }));
      }, 3000);

      return {
        success: true,
        deals: newDeals,
        tasks: newTasks,
        contacts: newContacts,
        remainingRequests: remaining,
      };

    } catch (error: any) {
      // Handle errors
      let errorMessage = 'Failed to process email';

      if (error.response?.status === 429) {
        errorMessage = error.response.data.detail || 'Rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || 'Invalid email content';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - AI processing took too long';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setState(prev => ({
        ...prev,
        stage: RealDemoStage.ERROR,
        error: errorMessage,
        isProcessing: false,
      }));

      return {
        success: false,
        deals: [],
        tasks: [],
        contacts: [],
        remainingRequests: state.remainingRequests,
        error: errorMessage,
      };
    }
  }, [state.remainingRequests]);

  /**
   * Reset demo to initial state
   */
  const reset = useCallback(() => {
    setState({
      stage: RealDemoStage.IDLE,
      deals: [],
      tasks: [],
      contacts: [],
      remainingRequests: 5,
      error: null,
      isProcessing: false,
    });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      stage: RealDemoStage.IDLE,
    }));
  }, []);

  /**
   * Get demo statistics
   */
  const getStats = useCallback(() => {
    const totalDealsValue = state.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    return {
      totalDeals: state.deals.length,
      totalTasks: state.tasks.length,
      totalContacts: state.contacts.length,
      totalValue: totalDealsValue,
      emailsProcessed: state.deals.length > 0 ? 1 : 0, // Count non-zero extractions
    };
  }, [state.deals, state.tasks, state.contacts]);

  return {
    // State
    state,

    // Actions
    processEmail,
    reset,
    clearError,

    // Computed values
    getStats,

    // Flags
    isProcessing: state.isProcessing,
    hasError: !!state.error,
  };
}
