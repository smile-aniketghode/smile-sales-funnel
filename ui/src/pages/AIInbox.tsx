import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, dealAPI, statsAPI } from '../services/api';
import { TaskCard } from '../components/TaskCard';
import { DealCard } from '../components/DealCard';
import { StatsCard } from '../components/StatsCard';
import { TaskStatus, DealStatus } from '../types/api';

export const AIInbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'deals'>('tasks');
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsAPI.getSummary(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch draft tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'draft'],
    queryFn: () => taskAPI.getTasks(TaskStatus.DRAFT),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch draft deals
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', 'draft'],
    queryFn: () => dealAPI.getDeals(DealStatus.DRAFT),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Task mutations
  const acceptTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskAPI.acceptTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskAPI.rejectTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Deal mutations
  const acceptDealMutation = useMutation({
    mutationFn: (dealId: string) => dealAPI.acceptDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const rejectDealMutation = useMutation({
    mutationFn: (dealId: string) => dealAPI.rejectDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleAcceptTask = (taskId: string) => {
    acceptTaskMutation.mutate(taskId);
  };

  const handleRejectTask = (taskId: string) => {
    rejectTaskMutation.mutate(taskId);
  };

  const handleAcceptDeal = (dealId: string) => {
    acceptDealMutation.mutate(dealId);
  };

  const handleRejectDeal = (dealId: string) => {
    rejectDealMutation.mutate(dealId);
  };

  const tasks = tasksData?.tasks || [];
  const deals = dealsData?.deals || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Inbox</h1>
          <p className="text-gray-600">Review and manage AI-extracted tasks and deals from your emails</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Draft Tasks"
              value={stats.summary.draft_tasks}
              subtitle="Pending review"
              color="yellow"
            />
            <StatsCard
              title="Draft Deals"
              value={stats.summary.draft_deals}
              subtitle="Pending review"
              color="green"
            />
            <StatsCard
              title="Total Tasks"
              value={stats.summary.total_tasks}
              subtitle="All time"
              color="blue"
            />
            <StatsCard
              title="Total Deals"
              value={stats.summary.total_deals}
              subtitle="All time"
              color="blue"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 font-medium text-sm border-b-2 ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Draft Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-6 py-3 font-medium text-sm border-b-2 ${
              activeTab === 'deals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Suggested Deals ({deals.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tasks' && (
          <div>
            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No draft tasks to review</p>
                <p className="text-gray-400 text-sm mt-2">New tasks will appear here when emails are processed</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onAccept={handleAcceptTask}
                    onReject={handleRejectTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div>
            {dealsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deals...</p>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No suggested deals to review</p>
                <p className="text-gray-400 text-sm mt-2">New deals will appear here when emails are processed</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onAccept={handleAcceptDeal}
                    onReject={handleRejectDeal}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};