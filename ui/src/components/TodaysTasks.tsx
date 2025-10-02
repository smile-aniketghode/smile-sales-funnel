import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI } from '../services/api';

interface TodaysTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  due_date?: string;
  status: string;
  deal_id?: string;
}

export const TodaysTasks: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => taskAPI.getTodaysTasks(),
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskAPI.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Dismiss task mutation (reject)
  const dismissTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskAPI.rejectTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleComplete = (taskId: string) => {
    completeTaskMutation.mutate(taskId);
  };

  const handleDismiss = (taskId: string) => {
    dismissTaskMutation.mutate(taskId);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getDueDateLabel = (dueDate?: string): string => {
    if (!dueDate) return 'No due date';

    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays}d`;
  };

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          ✅ Today's Tasks
        </h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Unable to load tasks</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          ✅ Today's Tasks
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const todaysTasks = tasks?.tasks || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          ✅ Today's Tasks
        </h2>
        <span className="text-sm text-gray-500">
          {todaysTasks.length} {todaysTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {todaysTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No tasks due today</p>
          <p className="text-xs mt-1">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todaysTasks.map((task: TodaysTask) => (
            <div
              key={task.id}
              className={`border rounded-lg p-3 hover:shadow-sm transition-all ${
                isOverdue(task.due_date) ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={completeTaskMutation.isPending}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    completeTaskMutation.isPending
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-blue-500 hover:bg-blue-50 cursor-pointer'
                  }`}
                  title="Mark as complete"
                >
                  {completeTaskMutation.isPending && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={isOverdue(task.due_date) ? 'text-red-600 font-medium' : ''}>
                        📅 {getDueDateLabel(task.due_date)}
                      </span>
                      {task.deal_id && (
                        <span className="text-blue-600">🔗 Linked to deal</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismiss(task.id)}
                      disabled={dismissTaskMutation.isPending}
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Dismiss task"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all tasks →
        </button>
      </div>
    </div>
  );
};
