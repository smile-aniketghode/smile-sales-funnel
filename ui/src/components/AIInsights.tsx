import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../services/api';

interface Insight {
  id: string;
  type: string;
  message: string;
  severity: 'positive' | 'warning' | 'info';
  deal_id?: string;
  task_id?: string;
  created_at: string;
}

export const AIInsights: React.FC = () => {
  const { data: insights, isLoading, isError } = useQuery({
    queryKey: ['insights'],
    queryFn: () => statsAPI.getInsights(),
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 1,
  });

  const getInsightColor = (severity: string): string => {
    switch (severity) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'high_interest':
        return '🔥';
      case 'inactive_deal':
        return '⏰';
      case 'best_time':
        return '📞';
      case 'follow_up':
        return '👋';
      default:
        return '💡';
    }
  };

  const getInsightTextColor = (severity: string): string => {
    switch (severity) {
      case 'positive':
        return 'text-green-900';
      case 'warning':
        return 'text-orange-900';
      case 'info':
        return 'text-purple-900';
      default:
        return 'text-blue-900';
    }
  };

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          🤖 AI-Powered Insights
        </h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Unable to load insights</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          🤖 AI-Powered Insights
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Generating insights...</p>
        </div>
      </div>
    );
  }

  const insightsList = insights?.insights || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          🤖 AI-Powered Insights
        </h2>
        <span className="text-sm text-gray-500">
          {insightsList.length} {insightsList.length === 1 ? 'insight' : 'insights'}
        </span>
      </div>

      {insightsList.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No insights available at the moment</p>
          <p className="text-xs mt-1">AI will analyze your sales data for recommendations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insightsList.map((insight: Insight) => (
            <div
              key={insight.id}
              className={`border-2 rounded-lg p-4 ${getInsightColor(insight.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${getInsightTextColor(insight.severity)}`}>
                    {insight.message}
                  </p>
                  {(insight.deal_id || insight.task_id) && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                      {insight.deal_id && (
                        <span className="px-2 py-1 bg-white rounded-full border border-gray-300">
                          💼 Deal linked
                        </span>
                      )}
                      {insight.task_id && (
                        <span className="px-2 py-1 bg-white rounded-full border border-gray-300">
                          ✅ Task linked
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          💡 Insights are generated based on your email activity and deal patterns
        </p>
      </div>
    </div>
  );
};
