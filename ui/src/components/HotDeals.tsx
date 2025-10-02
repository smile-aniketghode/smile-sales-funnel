import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dealAPI } from '../services/api';

interface HotDeal {
  id: string;
  title: string;
  company_name?: string;
  value?: number;
  expected_close_date?: string;
  confidence: number;
  stage: string;
  probability: number;
}

export const HotDeals: React.FC = () => {
  const { data: deals, isLoading, isError } = useQuery({
    queryKey: ['deals', 'hot'],
    queryFn: () => dealAPI.getHotDeals(),
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    } else {
      return `₹${value.toLocaleString('en-IN')}`;
    }
  };

  const getDaysUntilClose = (closeDate?: string): string => {
    if (!closeDate) return 'No date';
    const now = new Date();
    const close = new Date(closeDate);
    const diffTime = close.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const getConfidenceBadgeColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 75) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getStageBadgeColor = (stage: string): string => {
    switch (stage.toLowerCase()) {
      case 'negotiation':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          🔥 Hot Deals
        </h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Unable to load hot deals</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          🔥 Hot Deals
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading hot deals...</p>
        </div>
      </div>
    );
  }

  const hotDeals = deals?.deals || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          🔥 Hot Deals
        </h2>
        <span className="text-sm text-gray-500">
          {hotDeals.length} urgent {hotDeals.length === 1 ? 'deal' : 'deals'}
        </span>
      </div>

      {hotDeals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No urgent deals at the moment</p>
          <p className="text-xs mt-1">Deals closing soon will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hotDeals.map((deal: HotDeal) => (
            <div
              key={deal.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {deal.company_name || 'Unknown Company'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">{deal.title}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(deal.confidence)}`}>
                  {deal.confidence}% confidence
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-3 text-xs">
                  {deal.value && (
                    <span className="font-bold text-green-700">
                      {formatIndianCurrency(deal.value)}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full ${getStageBadgeColor(deal.stage)}`}>
                    {deal.stage}
                  </span>
                  <span className="text-gray-600">
                    {deal.probability}% probability
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">
                    📅 Closes {getDaysUntilClose(deal.expected_close_date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all deals →
        </button>
      </div>
    </div>
  );
};
