// Recent Activity feed - shows last 10 actions/events in the system

import React from 'react';
import { useQuery } from '@tanstack/react-query';

const WORKER_API_BASE = import.meta.env.VITE_WORKER_API_BASE_URL || 'http://localhost:8000';

interface ActivityItem {
  id: string;
  type: 'email_processed' | 'deal_created' | 'deal_moved' | 'task_completed' | 'contact_added';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ProcessingStats {
  week_stats: {
    emails_processed: number;
    successful_extractions: number;
  };
  current_pending: {
    draft_tasks: number;
    draft_deals: number;
  };
}

export const RecentActivity: React.FC = () => {
  const userId = localStorage.getItem('user_id');

  // Fetch processing stats to determine state
  const { data: stats, isLoading } = useQuery<ProcessingStats>({
    queryKey: ['processing-stats'],
    queryFn: async () => {
      const res = await fetch(`${WORKER_API_BASE}/stats`);
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
    enabled: !!userId,
  });

  // TODO: Replace with real activity feed API when available
  const mockActivities: ActivityItem[] = [];

  const hasProcessedEmails = stats && stats.week_stats.emails_processed > 0;
  const hasExtractions = stats && stats.week_stats.successful_extractions > 0;

  const getTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - time) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      red: 'bg-red-100 text-red-700',
    };
    return colors[color] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">📊</span>
          Recent Activity
        </h3>
        <span className="text-sm text-gray-500">Last 24 hours</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : mockActivities.length > 0 ? (
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getColorClasses(activity.color)} flex items-center justify-center text-lg`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasProcessedEmails && !hasExtractions ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-700 font-medium">Emails processed, no sales activity detected</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            AI analyzed your recent emails but didn't find any deals or tasks. This is normal if your inbox doesn't contain sales-related content.
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400">No recent activity</p>
          <p className="text-sm text-gray-400 mt-2">
            Sync your Gmail to start processing emails
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Activity feed tracks all AI extractions and manual actions
        </p>
      </div>
    </div>
  );
};
