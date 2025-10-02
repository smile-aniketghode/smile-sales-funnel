import axios from 'axios';
import type { Task, Deal, TasksResponse, DealsResponse, StatsResponse, ContactsResponse } from '../types/api';
import { TaskStatus, DealStatus, DealStage } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Get current user from localStorage
const getCurrentUser = (): string | null => {
  return localStorage.getItem('user_id');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging and user_id injection
apiClient.interceptors.request.use(
  (config) => {
    const userId = getCurrentUser();

    if (userId) {
      // Add user_id to query parameters
      config.params = { ...config.params, user_id: userId };
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const taskAPI = {
  // Get all tasks with optional status filter
  getTasks: async (status?: TaskStatus, limit: number = 50): Promise<TasksResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get single task by ID
  getTask: async (id: string): Promise<{ task: Task; status: string }> => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  // Update task
  updateTask: async (id: string, updates: Partial<Task>): Promise<{ message: string; status: string }> => {
    const response = await apiClient.put(`/tasks/${id}`, updates);
    return response.data;
  },

  // Accept task (change status to accepted)
  acceptTask: async (id: string): Promise<{ message: string; status: string }> => {
    return taskAPI.updateTask(id, { status: TaskStatus.ACCEPTED });
  },

  // Reject task (change status to rejected)
  rejectTask: async (id: string): Promise<{ message: string; status: string }> => {
    return taskAPI.updateTask(id, { status: TaskStatus.REJECTED });
  },

  // Complete task (change status to completed)
  completeTask: async (id: string): Promise<{ message: string; status: string }> => {
    return taskAPI.updateTask(id, { status: TaskStatus.COMPLETED });
  },

  // Get today's tasks (due today or overdue)
  getTodaysTasks: async (): Promise<{ tasks: any[]; count: number; status: string }> => {
    const response = await apiClient.get('/tasks/today');
    return response.data;
  },
};

export const dealAPI = {
  // Get all deals with optional status filter
  getDeals: async (status?: DealStatus, limit: number = 50): Promise<DealsResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/deals?${params.toString()}`);
    return response.data;
  },

  // Get single deal by ID
  getDeal: async (id: string): Promise<{ deal: Deal; status: string }> => {
    const response = await apiClient.get(`/deals/${id}`);
    return response.data;
  },

  // Update deal
  updateDeal: async (id: string, updates: Partial<Deal>): Promise<{ message: string; status: string }> => {
    const response = await apiClient.put(`/deals/${id}`, updates);
    return response.data;
  },

  // Accept deal (change status to accepted)
  acceptDeal: async (id: string): Promise<{ message: string; status: string }> => {
    return dealAPI.updateDeal(id, { status: DealStatus.ACCEPTED });
  },

  // Reject deal (change status to rejected)
  rejectDeal: async (id: string): Promise<{ message: string; status: string }> => {
    return dealAPI.updateDeal(id, { status: DealStatus.REJECTED });
  },

  // Get hot deals (urgent deals closing soon)
  getHotDeals: async (): Promise<{ deals: any[]; count: number; status: string }> => {
    const response = await apiClient.get('/deals/hot');
    return response.data;
  },

  // Update deal stage (for pipeline drag & drop)
  updateDealStage: async (id: string, stage: DealStage): Promise<{ message: string; status: string }> => {
    return dealAPI.updateDeal(id, { stage });
  },
};

export const statsAPI = {
  // Get summary statistics
  getSummary: async (): Promise<StatsResponse> => {
    const response = await apiClient.get('/stats/summary');
    return response.data;
  },

  // Get AI-powered insights
  getInsights: async (): Promise<{ insights: any[]; count: number; status: string }> => {
    const response = await apiClient.get('/insights');
    return response.data;
  },
};

export const contactAPI = {
  // Get all contacts
  getContacts: async (limit: number = 50): Promise<ContactsResponse> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/contacts?${params.toString()}`);
    return response.data;
  },
};

export const healthAPI = {
  // Health check
  check: async (): Promise<{ api: string; database: any; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;