/**
 * Onboarding State Detection Service
 *
 * Determines where the user is in their onboarding journey and
 * provides routing logic for the onboarding flow.
 */

export interface OnboardingState {
  needsOnboarding: boolean;
  reason: 'no_user' | 'not_connected' | 'never_synced' | 'completed';
  redirectTo: '/welcome' | '/onboarding/analyzing' | '/dashboard' | null;
}

/**
 * Check if user needs onboarding
 */
export function checkOnboardingState(): OnboardingState {
  // Check if user explicitly completed onboarding
  const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true';
  if (onboardingComplete) {
    return {
      needsOnboarding: false,
      reason: 'completed',
      redirectTo: null,
    };
  }

  // Check if user tried demo mode (skip onboarding)
  const triedDemo = localStorage.getItem('tried_demo') === 'true';
  if (triedDemo) {
    return {
      needsOnboarding: false,
      reason: 'completed',
      redirectTo: null,
    };
  }

  // Check if user is connected
  const userId = localStorage.getItem('user_id');
  const userEmail = localStorage.getItem('user_email');

  if (!userId && !userEmail) {
    return {
      needsOnboarding: true,
      reason: 'no_user',
      redirectTo: '/welcome',
    };
  }

  // User is connected, assume they've been through onboarding
  // (This handles users who connected before onboarding flow was added)
  return {
    needsOnboarding: false,
    reason: 'completed',
    redirectTo: null,
  };
}

/**
 * Mark onboarding as complete
 */
export function completeOnboarding(): void {
  localStorage.setItem('onboarding_complete', 'true');
}

/**
 * Reset onboarding state (for testing or re-onboarding)
 */
export function resetOnboarding(): void {
  localStorage.removeItem('onboarding_complete');
  localStorage.removeItem('tried_demo');
}

/**
 * Check if this is a first-time user
 */
export function isFirstTimeUser(): boolean {
  const onboardingComplete = localStorage.getItem('onboarding_complete');
  const triedDemo = localStorage.getItem('tried_demo');
  const userId = localStorage.getItem('user_id');

  return !onboardingComplete && !triedDemo && !userId;
}

/**
 * Get appropriate welcome message based on user state
 */
export function getWelcomeMessage(): string {
  const userId = localStorage.getItem('user_id');
  const userEmail = localStorage.getItem('user_email');

  if (userId || userEmail) {
    return `Welcome back${userEmail ? `, ${userEmail.split('@')[0]}` : ''}!`;
  }

  return 'Welcome to SMILe Sales Funnel';
}
