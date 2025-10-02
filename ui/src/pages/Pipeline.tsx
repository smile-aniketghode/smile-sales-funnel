import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dealAPI } from '../services/api';
import type { Deal } from '../types/api';
import { DealStage } from '../types/api';

// Pipeline stages matching mockup screen 1
const PIPELINE_STAGES = [
  { id: DealStage.LEAD, label: 'Lead', color: 'bg-gray-100' },
  { id: DealStage.CONTACTED, label: 'Contacted', color: 'bg-blue-100' },
  { id: DealStage.DEMO, label: 'Demo', color: 'bg-purple-100' },
  { id: DealStage.PROPOSAL, label: 'Proposal', color: 'bg-yellow-100' },
  { id: DealStage.NEGOTIATION, label: 'Negotiation', color: 'bg-orange-100' },
  { id: DealStage.CLOSED_WON, label: 'Closed Won', color: 'bg-green-100' },
] as const;

export const Pipeline: React.FC = () => {
  // Fetch all deals
  const { data: dealsData, isLoading, isError } = useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: () => dealAPI.getDeals(undefined, 500),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">⚠️ Unable to load pipeline</p>
          <p className="text-sm">Please check the API connection and try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  const allDeals = dealsData?.deals || [];

  // Group deals by stage
  const dealsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = allDeals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  // Calculate total value per stage
  const getStageValue = (stageId: string): number => {
    return dealsByStage[stageId]?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  };

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline</h1>
        <p className="text-gray-600">
          {allDeals.length} {allDeals.length === 1 ? 'deal' : 'deals'} • Total value: {formatIndianCurrency(getStageValue(PIPELINE_STAGES[0].id) + getStageValue(PIPELINE_STAGES[1].id) + getStageValue(PIPELINE_STAGES[2].id) + getStageValue(PIPELINE_STAGES[3].id) + getStageValue(PIPELINE_STAGES[4].id) + getStageValue(PIPELINE_STAGES[5].id))}
        </p>
      </div>

      {/* Kanban Board - 6 columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || [];
          const stageValue = getStageValue(stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Column Header */}
              <div className={`${stage.color} p-4 rounded-t-lg border-b border-gray-200`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-gray-900">{stage.label}</h2>
                  <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {formatIndianCurrency(stageValue)}
                </p>
              </div>

              {/* Deals List */}
              <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Deal card component (will be extracted to separate file later)
interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.75) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-purple-100 text-purple-800 border-purple-300';
  };

  const formatIndianCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const getDaysUntilClose = (closeDate?: string): string => {
    if (!closeDate) return '';
    const diffDays = Math.ceil((new Date(closeDate).getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays}d`;
  };

  const lastActivity = new Date(deal.updated_at).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer">
      {/* Company Name */}
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
        {deal.title}
      </h3>

      {/* Value & Confidence */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold text-blue-600">
          {formatIndianCurrency(deal.value || 0)}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getConfidenceColor(deal.confidence)}`}>
          {Math.round(deal.confidence * 100)}%
        </span>
      </div>

      {/* Description */}
      {deal.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {deal.description}
        </p>
      )}

      {/* Last Activity & Close Date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>📅 {lastActivity}</span>
        {deal.expected_close_date && (
          <span className={getDaysUntilClose(deal.expected_close_date) === 'Overdue' ? 'text-red-600 font-medium' : ''}>
            🎯 {getDaysUntilClose(deal.expected_close_date)}
          </span>
        )}
      </div>
    </div>
  );
};
