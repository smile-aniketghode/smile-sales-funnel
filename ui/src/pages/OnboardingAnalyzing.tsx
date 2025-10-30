import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const WORKER_API_BASE = import.meta.env.VITE_WORKER_API_BASE_URL || 'http://localhost:8000';

interface PollingResult {
  emails_fetched: number;
  emails_processed: number;
  tasks_extracted: number;
  deals_extracted: number;
}

export const OnboardingAnalyzing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<'connecting' | 'syncing' | 'analyzing' | 'complete'>('connecting');
  const [result, setResult] = useState<PollingResult | null>(null);
  const userId = localStorage.getItem('user_id');

  // Check if we just came from OAuth
  const justConnected = searchParams.get('gmail_connected') === 'true';

  useEffect(() => {
    if (!userId && !justConnected) {
      // No user, redirect to welcome
      navigate('/welcome');
      return;
    }

    // Simulate progression through stages
    const timer1 = setTimeout(() => setStage('syncing'), 1500);
    const timer2 = setTimeout(() => setStage('analyzing'), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [userId, justConnected, navigate]);

  // Trigger sync and poll for results
  const { data: syncData } = useQuery({
    queryKey: ['onboarding-sync', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`${WORKER_API_BASE}/gmail/poll?user_id=${userId}`, {
        method: 'POST',
      });
      return res.json();
    },
    enabled: !!userId && stage === 'analyzing',
    retry: 1,
  });

  // When sync completes, navigate to results
  useEffect(() => {
    if (syncData) {
      setResult(syncData);
      setStage('complete');

      // Wait a moment to show "complete" state, then navigate
      setTimeout(() => {
        const hasData = (syncData.tasks_extracted > 0 || syncData.deals_extracted > 0);
        if (hasData) {
          navigate('/onboarding/results?status=success', { state: { syncData } });
        } else {
          navigate('/onboarding/results?status=no-sales', { state: { syncData } });
        }
      }, 1500);
    }
  }, [syncData, navigate]);

  const getProgressMessage = () => {
    switch (stage) {
      case 'connecting':
        return 'Connecting to Gmail...';
      case 'syncing':
        return 'Fetching your emails...';
      case 'analyzing':
        return 'AI is analyzing your inbox...';
      case 'complete':
        return 'Analysis complete!';
      default:
        return 'Processing...';
    }
  };

  const getProgressIcon = () => {
    switch (stage) {
      case 'connecting':
        return '🔗';
      case 'syncing':
        return '📧';
      case 'analyzing':
        return '🤖';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getProgressPercentage = () => {
    switch (stage) {
      case 'connecting':
        return 25;
      case 'syncing':
        return 50;
      case 'analyzing':
        return 75;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <span className="text-4xl animate-pulse">{getProgressIcon()}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getProgressMessage()}
            </h1>
            <p className="text-gray-600">
              This will only take a moment
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {getProgressPercentage()}% complete
            </p>
          </div>

          {/* Stats (show when we have data) */}
          {result && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{result.emails_fetched}</div>
                <div className="text-xs text-gray-600">Emails Fetched</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{result.emails_processed}</div>
                <div className="text-xs text-gray-600">Emails Processed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{result.deals_extracted}</div>
                <div className="text-xs text-gray-600">Deals Found</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{result.tasks_extracted}</div>
                <div className="text-xs text-gray-600">Tasks Found</div>
              </div>
            </div>
          )}

          {/* Processing Steps */}
          <div className="mt-8 space-y-3">
            <div className={`flex items-center gap-3 text-sm ${stage === 'connecting' || stage === 'syncing' || stage === 'analyzing' || stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-lg">{stage === 'connecting' || stage === 'syncing' || stage === 'analyzing' || stage === 'complete' ? '✅' : '⏳'}</span>
              <span>Gmail connected</span>
            </div>
            <div className={`flex items-center gap-3 text-sm ${stage === 'syncing' || stage === 'analyzing' || stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-lg">{stage === 'syncing' || stage === 'analyzing' || stage === 'complete' ? '✅' : '⏳'}</span>
              <span>Emails synced</span>
            </div>
            <div className={`flex items-center gap-3 text-sm ${stage === 'analyzing' || stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-lg">{stage === 'analyzing' || stage === 'complete' ? '✅' : '⏳'}</span>
              <span>AI analysis running</span>
            </div>
            <div className={`flex items-center gap-3 text-sm ${stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <span className="text-lg">{stage === 'complete' ? '✅' : '⏳'}</span>
              <span>Results ready</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 We only read emails, never send or modify them
          </p>
        </div>
      </div>
    </div>
  );
};
