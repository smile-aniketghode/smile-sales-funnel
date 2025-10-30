import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

interface LocationState {
  syncData?: {
    emails_fetched: number;
    emails_processed: number;
    tasks_extracted: number;
    deals_extracted: number;
  };
}

export const OnboardingResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const status = searchParams.get('status'); // 'success' or 'no-sales'
  const syncData = (location.state as LocationState)?.syncData;

  const handleContinueToDashboard = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/dashboard');
  };

  const handleReviewInbox = () => {
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/ai-inbox');
  };

  const handleTryDemo = () => {
    localStorage.setItem('tried_demo', 'true');
    navigate('/demo');
  };

  // Success state - found sales content
  if (status === 'success') {
    const deals = syncData?.deals_extracted || 0;
    const tasks = syncData?.tasks_extracted || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Great! We Found Sales Activity
              </h1>
              <p className="text-gray-600">
                AI has successfully analyzed your inbox and extracted actionable items
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-4xl font-bold text-blue-600 mb-1">{deals}</div>
                <div className="text-sm font-medium text-blue-800">Deals Extracted</div>
                <div className="text-xs text-blue-600 mt-1">Ready for review</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200">
                <div className="text-4xl font-bold text-purple-600 mb-1">{tasks}</div>
                <div className="text-sm font-medium text-purple-800">Tasks Identified</div>
                <div className="text-xs text-purple-600 mt-1">Pending approval</div>
              </div>
            </div>

            {/* What's Next */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl flex-shrink-0">📥</span>
                  <div>
                    <div className="font-medium text-gray-900">Review AI Suggestions</div>
                    <div className="text-sm text-gray-600">Approve or reject extracted deals and tasks</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl flex-shrink-0">📊</span>
                  <div>
                    <div className="font-medium text-gray-900">Build Your Pipeline</div>
                    <div className="text-sm text-gray-600">Manage deals through stages from Lead to Closed Won</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl flex-shrink-0">⚡</span>
                  <div>
                    <div className="font-medium text-gray-900">Auto-Sync</div>
                    <div className="text-sm text-gray-600">New emails are automatically processed every 5 minutes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReviewInbox}
                className="flex-1 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Review in AI Inbox →
              </button>
              <button
                onClick={handleContinueToDashboard}
                className="flex-1 px-6 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              💡 You can always reconnect or disconnect Gmail from Settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No sales content found
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Info Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <span className="text-4xl">💡</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              No Sales Emails Found
            </h1>
            <p className="text-gray-600">
              We analyzed your inbox but didn't find any deals or tasks. This is completely normal!
            </p>
          </div>

          {/* Sync Stats */}
          {syncData && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{syncData.emails_fetched}</div>
                <div className="text-xs text-gray-600">Emails Scanned</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">{syncData.emails_processed}</div>
                <div className="text-xs text-gray-600">Emails Analyzed</div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Why This Happens</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl flex-shrink-0">📧</span>
                <div>
                  <span className="font-medium text-gray-900">Non-Sales Inbox:</span> Your emails might be internal communications, newsletters, or personal messages
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl flex-shrink-0">🔍</span>
                <div>
                  <span className="font-medium text-gray-900">AI Precision:</span> Our AI only extracts high-confidence sales opportunities to avoid false positives
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl flex-shrink-0">⏰</span>
                <div>
                  <span className="font-medium text-gray-900">New Sales Emails:</span> As you receive sales-related emails, they'll be processed automatically
                </div>
              </div>
            </div>
          </div>

          {/* What to Do Next */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What You Can Do</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="text-2xl flex-shrink-0">🎬</span>
                <div>
                  <div className="font-semibold text-blue-900">Try Demo Mode</div>
                  <div className="text-sm text-blue-700 mt-1">
                    See how the system works with sample sales emails and real AI extraction
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl flex-shrink-0">📊</span>
                <div>
                  <div className="font-medium text-gray-900">Go to Dashboard</div>
                  <div className="text-sm text-gray-600">
                    Your pipeline will populate as you receive sales emails
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl flex-shrink-0">📥</span>
                <div>
                  <div className="font-medium text-gray-900">Forward Sales Emails</div>
                  <div className="text-sm text-gray-600">
                    Forward existing sales conversations to your connected Gmail
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTryDemo}
              className="flex-1 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              🎬 Try Demo Mode
            </button>
            <button
              onClick={handleContinueToDashboard}
              className="flex-1 px-6 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ⚡ Auto-sync is active - new sales emails will be processed automatically
          </p>
        </div>
      </div>
    </div>
  );
};
