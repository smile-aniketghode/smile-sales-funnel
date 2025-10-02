import React from 'react';
import type { Deal } from '../types/api';

interface DealKanbanCardProps {
  deal: Deal;
}

export const DealKanbanCard: React.FC<DealKanbanCardProps> = ({ deal }) => {
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
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
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
