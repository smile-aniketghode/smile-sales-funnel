import React from 'react';
import { Task, TaskPriority } from '../types/api';

interface TaskCardProps {
  task: Task;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onAccept, onReject }) => {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW:
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(task.confidence)}`}>
            {Math.round(task.confidence * 100)}%
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{task.description}</p>

      <div className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
        <p className="text-sm text-gray-600 italic">"{task.audit_snippet}"</p>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Agent: {task.agent}</span>
        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
      </div>

      {task.status === 'draft' && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(task.id)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Accept Task
          </button>
          <button
            onClick={() => onReject(task.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {task.status !== 'draft' && (
        <div className="text-center">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            task.status === 'accepted' ? 'bg-green-100 text-green-800' :
            task.status === 'rejected' ? 'bg-red-100 text-red-800' :
            task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
};