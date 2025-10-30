import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { HotDeals } from '../components/HotDeals';
import { TodaysTasks } from '../components/TodaysTasks';
import { AIInsights } from '../components/AIInsights';
import { RecentContacts } from '../components/RecentContacts';
import { RecentActivity } from '../components/RecentActivity';

export const Dashboard: React.FC = () => {
  // Fetch enhanced statistics
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => statsAPI.getSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">⚠️ API Connection Issue</p>
          <p className="text-sm">Backend API is not responding. Please make sure the API service is running.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from stats
  const revenue = stats?.summary?.revenue || 0;
  const revenueTrend = stats?.summary?.revenue_trend || '+0%';
  const activeDeals = stats?.summary?.active_deals || stats?.summary?.total_deals || 0;
  const closingThisWeek = stats?.summary?.closing_this_week || 0;
  const conversionRate = stats?.summary?.conversion_rate || 0;
  const conversionTrend = stats?.summary?.conversion_trend || '+0%';
  const newContacts = stats?.summary?.new_contacts || 0;

  // Check if user has any data
  const hasAnyData = activeDeals > 0 || newContacts > 0 || revenue > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Sales funnel overview and key metrics</p>
      </div>

      {/* No Data Banner */}
      {!hasAnyData && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your pipeline is empty
              </h3>
              <p className="text-gray-700 mb-3">
                No sales data found in your inbox yet. Want to see how the system works?
              </p>
              <a
                href="/demo"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                🎬 Try Demo Mode with Sample Emails
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Revenue Pipeline"
          value={revenue}
          trend={revenueTrend}
          subtitle="Total deal value"
          color="green"
          icon="💰"
          format="currency"
        />
        <MetricCard
          title="Active Deals"
          value={activeDeals}
          trend={closingThisWeek > 0 ? `${closingThisWeek} closing this week` : undefined}
          subtitle="In pipeline"
          color="blue"
          icon="🎯"
        />
        <MetricCard
          title="Conversion Rate"
          value={conversionRate}
          trend={conversionTrend}
          subtitle="Won deals"
          color="purple"
          icon="📈"
          format="percentage"
        />
        <MetricCard
          title="New Contacts"
          value={newContacts}
          trend="Last 30 days"
          subtitle="Added to CRM"
          color="orange"
          icon="👥"
        />
      </div>

      {/* Top Widgets Grid - Hot Deals & Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HotDeals />
        <TodaysTasks />
      </div>

      {/* Middle Widgets Grid - Recent Contacts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentContacts />
        <RecentActivity />
      </div>

      {/* AI Insights Panel - Full Width */}
      <AIInsights />

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Last updated: {stats?.generated_at ? new Date(stats.generated_at).toLocaleString() : 'N/A'}
        </p>
      </div>
    </div>
  );
};
