import React from 'react';
import type { Deal } from '../types/api';
import { DealStage } from '../types/api';

interface DealCardProps {
  deal: Deal;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onAccept, onReject }) => {
  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case DealStage.LEAD:
        return 'bg-gray-100 text-gray-800';
      case DealStage.QUALIFIED:
        return 'bg-blue-100 text-blue-800';
      case DealStage.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case DealStage.NEGOTIATION:
        return 'bg-orange-100 text-orange-800';
      case DealStage.CLOSED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (value?: number, currency: string = 'USD') => {
    if (!value) return 'Value not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
            {deal.stage}
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(deal.confidence)}`}>
            {Math.round(deal.confidence * 100)}%
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-3">{deal.description}</p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Value</p>
          <p className="text-lg font-semibold text-green-600">
            {formatValue(deal.value, deal.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Win Probability</p>
          <p className="text-lg font-semibold text-blue-600">{deal.probability}%</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-green-500">
        <p className="text-sm text-gray-600 italic">"{deal.audit_snippet}"</p>
      </div>

      {deal.expected_close_date && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">Expected Close Date</p>
          <p className="text-sm text-gray-700">
            {new Date(deal.expected_close_date).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Agent: {deal.agent}</span>
        <span>Created: {new Date(deal.created_at).toLocaleDateString()}</span>
      </div>

      {deal.status === 'draft' && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(deal.id)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Accept Deal
          </button>
          <button
            onClick={() => onReject(deal.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {deal.status !== 'draft' && (
        <div className="text-center">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            deal.status === 'accepted' ? 'bg-green-100 text-green-800' :
            deal.status === 'rejected' ? 'bg-red-100 text-red-800' :
            deal.status === 'won' ? 'bg-green-100 text-green-800' :
            deal.status === 'lost' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
};