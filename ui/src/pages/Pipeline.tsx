import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dealAPI } from '../services/api';
import type { Deal } from '../types/api';
import { DealStage } from '../types/api';
import { DealKanbanCard } from '../components/DealKanbanCard';

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
  const queryClient = useQueryClient();
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<Deal | null>(null);

  // Fetch all deals
  const { data: dealsData, isLoading, isError } = useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: () => dealAPI.getDeals(undefined, 500),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  // Update deal stage mutation
  const updateDealStageMutation = useMutation({
    mutationFn: ({ dealId, newStage }: { dealId: string; newStage: DealStage }) =>
      dealAPI.updateDealStage(dealId, newStage),
    onMutate: async ({ dealId, newStage }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['deals', 'pipeline'] });

      // Snapshot previous value
      const previousDeals = queryClient.getQueryData(['deals', 'pipeline']);

      // Optimistically update
      queryClient.setQueryData(['deals', 'pipeline'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          deals: old.deals.map((deal: Deal) =>
            deal.id === dealId ? { ...deal, stage: newStage } : deal
          ),
        };
      });

      return { previousDeals };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', 'pipeline'], context.previousDeals);
      }
      console.error('Failed to update deal stage:', err);
    },
    onSuccess: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = allDeals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;

    // Update deal stage
    updateDealStageMutation.mutate({ dealId, newStage });
  };

  if (isError) {
    return (
      <div className="px-6 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded max-w-2xl">
          <p className="font-bold">⚠️ Unable to load pipeline</p>
          <p className="text-sm">Please check the API connection and try again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8">
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
    acc[stage.id] = allDeals.filter((deal) => deal.stage === stage.id);
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

  const totalPipelineValue = PIPELINE_STAGES.reduce(
    (sum, stage) => sum + getStageValue(stage.id),
    0
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full">
        {/* Header with padding */}
        <div className="px-6 py-8 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline</h1>
          <p className="text-gray-600">
            {allDeals.length} {allDeals.length === 1 ? 'deal' : 'deals'} • Total value:{' '}
            {formatIndianCurrency(totalPipelineValue)}
          </p>
        </div>

        {/* Empty Pipeline Banner */}
        {allDeals.length === 0 && (
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No deals in your pipeline yet
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Your emails don't contain deal opportunities yet. Want to see how the pipeline works?
                  </p>
                  <a
                    href="/demo"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    🎬 Try Demo Mode
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board - full width with horizontal scroll */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 px-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage.id] || [];
            const stageValue = getStageValue(stage.id);

            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
                stageValue={stageValue}
                formatCurrency={formatIndianCurrency}
                onDealClick={setSelectedDeal}
              />
            );
          })}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal ? <DealKanbanCard deal={activeDeal} /> : null}
      </DragOverlay>

      {/* Deal Preview Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDeal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedDeal.title}</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedDeal.stage === DealStage.CLOSED_WON ? 'bg-green-100 text-green-800' :
                      selectedDeal.stage === DealStage.NEGOTIATION ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {PIPELINE_STAGES.find(s => s.id === selectedDeal.stage)?.label}
                    </span>
                    <span className="text-gray-600">{selectedDeal.probability}% probability</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Deal Value */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Deal Value</h3>
                <p className="text-3xl font-bold text-gray-900">{formatIndianCurrency(selectedDeal.value || 0)}</p>
              </div>

              {/* Description */}
              {selectedDeal.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedDeal.description}</p>
                </div>
              )}

              {/* Email Snippet */}
              {selectedDeal.audit_snippet && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">From Email</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 italic">"{selectedDeal.audit_snippet}"</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">AI Agent</h3>
                  <p className="text-sm text-gray-900">{selectedDeal.agent || 'qwen2.5-coder'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Confidence</h3>
                  <p className="text-sm text-gray-900">{Math.round((selectedDeal.confidence || 0) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

// Stage Column Component with Droppable Area
interface StageColumnProps {
  stage: { id: DealStage; label: string; color: string };
  deals: Deal[];
  stageValue: number;
  formatCurrency: (value: number) => string;
  onDealClick: (deal: Deal) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({ stage, deals, stageValue, formatCurrency, onDealClick }) => {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'stage' },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0"
      style={{ width: 'calc((100vw - 120px) / 6)', minWidth: '260px' }}
    >
      {/* Column Header */}
      <div className={`${stage.color} p-4 rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">{stage.label}</h2>
          <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-gray-600">{formatCurrency(stageValue)}</p>
      </div>

      {/* Deals List */}
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
          {deals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No deals</p>
            </div>
          ) : (
            deals.map((deal) => <DraggableDealCard key={deal.id} deal={deal} onClick={onDealClick} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// Draggable Deal Card Wrapper
interface DraggableDealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
}

const DraggableDealCard: React.FC<DraggableDealCardProps> = ({ deal, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    if (!isDragging) {
      onClick(deal);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <DealKanbanCard deal={deal} />
    </div>
  );
};
