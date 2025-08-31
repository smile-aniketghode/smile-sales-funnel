import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIInbox } from './pages/AIInbox';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AIInbox />
    </QueryClientProvider>
  );
}

export default App
