import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

const WORKER_API_BASE = 'http://localhost:8000';
const USER_ID = 'aniketghode@gmail.com'; // In production, get from auth context

interface GmailStatus {
  connected: boolean;
  email: string | null;
  token_expired: boolean;
  last_updated: string;
}

interface PollingStatus {
  is_polling: boolean;
  poll_interval_minutes: number;
  max_emails_per_poll: number;
  connected_users: number;
  last_sync_times: Record<string, string>;
}

export const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check for OAuth callback params
  useEffect(() => {
    const connected = searchParams.get('gmail_connected');
    const error = searchParams.get('gmail_error');

    if (connected === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } else if (error) {
      setErrorMessage(error || 'Failed to connect Gmail');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  }, [searchParams]);

  // Fetch Gmail connection status
  const { data: gmailStatus, isLoading: statusLoading } = useQuery<GmailStatus>({
    queryKey: ['gmail-status', USER_ID],
    queryFn: async () => {
      const res = await fetch(`${WORKER_API_BASE}/auth/gmail/status?user_id=${USER_ID}`);
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  // Store user_id in localStorage after successful OAuth
  useEffect(() => {
    if (gmailStatus?.connected && gmailStatus?.email) {
      localStorage.setItem('user_id', gmailStatus.email);
      localStorage.setItem('user_email', gmailStatus.email);
      console.log('✅ User ID stored:', gmailStatus.email);
    }
  }, [gmailStatus]);

  // Fetch polling status
  const { data: pollingStatus } = useQuery<PollingStatus>({
    queryKey: ['gmail-polling-status'],
    queryFn: async () => {
      const res = await fetch(`${WORKER_API_BASE}/gmail/polling/status`);
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${WORKER_API_BASE}/gmail/poll?user_id=${USER_ID}`, {
        method: 'POST',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
      queryClient.invalidateQueries({ queryKey: ['gmail-polling-status'] });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${WORKER_API_BASE}/auth/gmail/disconnect?user_id=${USER_ID}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
    },
  });

  const handleConnectGmail = () => {
    // Open OAuth flow in popup
    const authUrl = `${WORKER_API_BASE}/auth/gmail?user_id=${USER_ID}`;
    fetch(authUrl)
      .then(res => res.json())
      .then(data => {
        window.location.href = data.auth_url;
      });
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Gmail?')) {
      disconnectMutation.mutate();
    }
  };

  const handleManualSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success/Error Messages */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ Gmail connected successfully!
        </div>
      )}

      {showError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          ❌ {errorMessage || 'Failed to connect Gmail'}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your Gmail integration and sync preferences</p>
      </div>

      {/* Gmail Integration Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gmail Integration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Gmail account to automatically extract tasks and deals
            </p>
          </div>
          <div>
            <svg
              className="w-12 h-12 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
            </svg>
          </div>
        </div>

        {statusLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : gmailStatus?.connected ? (
          <div>
            {/* Connected Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-green-600 font-semibold mr-2">●</span>
                <span className="text-green-900 font-medium">Connected</span>
              </div>
              <div className="mt-2 text-sm text-green-800">
                <p><strong>Email:</strong> {gmailStatus.email}</p>
                <p><strong>Last Updated:</strong> {new Date(gmailStatus.last_updated).toLocaleString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleManualSync}
                disabled={syncMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {syncMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>

              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:bg-gray-100"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>

            {/* Sync Result */}
            {syncMutation.isSuccess && syncMutation.data && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-medium">✅ Sync Complete!</p>
                <div className="mt-2 text-sm text-blue-800">
                  <p>• Emails Fetched: {syncMutation.data.emails_fetched || 0}</p>
                  <p>• Emails Processed: {syncMutation.data.emails_processed || 0}</p>
                  <p>• Tasks Extracted: {syncMutation.data.tasks_extracted || 0}</p>
                  <p>• Deals Extracted: {syncMutation.data.deals_extracted || 0}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Not Connected */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-gray-400 font-semibold mr-2">○</span>
                <span className="text-gray-700 font-medium">Not Connected</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Connect your Gmail account to start automatically processing emails
              </p>
            </div>

            <button
              onClick={handleConnectGmail}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
              </svg>
              Connect Gmail
            </button>
          </div>
        )}
      </div>

      {/* Polling Status Section */}
      {gmailStatus?.connected && pollingStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto-Sync Status</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {pollingStatus.is_polling ? (
                  <span className="text-green-600">● Active</span>
                ) : (
                  <span className="text-gray-400">○ Inactive</span>
                )}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sync Interval</p>
              <p className="text-lg font-semibold text-gray-900">
                {pollingStatus.poll_interval_minutes} minutes
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Max Emails Per Sync</p>
              <p className="text-lg font-semibold text-gray-900">
                {pollingStatus.max_emails_per_poll}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Connected Accounts</p>
              <p className="text-lg font-semibold text-gray-900">
                {pollingStatus.connected_users}
              </p>
            </div>
          </div>

          {pollingStatus.last_sync_times[USER_ID] && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Last Sync</p>
              <p className="text-sm text-blue-800">
                {new Date(pollingStatus.last_sync_times[USER_ID]).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
