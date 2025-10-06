import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { Pipeline } from './pages/Pipeline';
import { Contacts } from './pages/Contacts';
import { AIInbox } from './pages/AIInbox';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { DemoMode } from './pages/DemoMode';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">
              🎯 SMILe Sales Funnel
            </h1>
            <div className="flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/pipeline"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/pipeline')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Pipeline
              </Link>
              <Link
                to="/contacts"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/contacts')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Contacts
              </Link>
              <Link
                to="/inbox"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/inbox')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                AI Inbox
              </Link>
              <Link
                to="/upload"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/upload')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Upload Email
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/settings"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              ⚙️ Settings
            </Link>
            <div className="text-sm text-gray-500">
              AI-Powered CRM
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8">
          <h2 className="text-2xl font-bold">Upload Email for AI Processing</h2>
          <p>Manual email processing for stakeholder testing</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Upload Email File</h3>
          <div
            className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-8 text-center transition-colors duration-200 drag-drop-zone"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.eml,.msg"
              onChange={handleFileUpload}
            />
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium text-lg"
            >
              📎 Drag & drop or click to upload
            </label>
            <p className="text-gray-500 mt-2">Support: .txt, .eml, .msg files</p>
            <p className="text-gray-400 text-sm mt-2">AI will extract tasks and deals automatically</p>
          </div>
          <div id="result" className="mt-4 p-4 bg-gray-100 rounded hidden">
            <p className="text-sm font-medium">Processing results will appear here...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function handleDragEnter(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget as HTMLElement;
  zone.classList.add('border-blue-500', 'bg-blue-50');
}

function handleDragLeave(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  const zone = e.currentTarget as HTMLElement;
  zone.classList.remove('border-blue-500', 'bg-blue-50');
}

function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();

  const zone = e.currentTarget as HTMLElement;
  zone.classList.remove('border-blue-500', 'bg-blue-50');

  const files = e.dataTransfer.files;
  if (files && files[0]) {
    processFile(files[0]);
  }
}

async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;
  processFile(file);
}

async function processFile(file: File) {
  const resultDiv = document.getElementById('result')!;
  resultDiv.className = 'mt-4 p-4 bg-blue-100 rounded';
  resultDiv.innerHTML = `
    <div class="flex items-center">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
      <p>🔄 Processing "${file.name}" with AI...</p>
    </div>
  `;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const WORKER_API_BASE = import.meta.env.VITE_WORKER_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${WORKER_API_BASE}/ingestEmail`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.status === 'success') {
      const tasks = result.tasks || [];
      const deals = result.deals || [];

      let tasksHTML = '';
      let dealsHTML = '';

      if (tasks.length > 0) {
        tasksHTML = `
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              📋 Extracted Tasks (${tasks.length})
            </h4>
            <div class="space-y-3">
              ${tasks.map((task: any) => `
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h5 class="font-medium text-blue-900">${task.title}</h5>
                      <p class="text-sm text-blue-700 mt-1">${task.description}</p>
                      <p class="text-xs text-blue-600 mt-2 italic">"${task.audit_snippet}"</p>
                    </div>
                    <div class="ml-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.confidence >= 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${Math.round(task.confidence * 100)}% confidence
                      </span>
                      <p class="text-xs text-gray-500 mt-1">
                        ${task.status === 'accepted' ? '✅ Auto-approved' : '⏳ Needs review'}
                      </p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (deals.length > 0) {
        dealsHTML = `
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              💰 Potential Deals (${deals.length})
            </h4>
            <div class="space-y-3">
              ${deals.map((deal: any) => `
                <div class="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h5 class="font-medium text-green-900">${deal.title}</h5>
                      <p class="text-sm text-green-700 mt-1">${deal.description}</p>
                      <p class="text-xs text-green-600 mt-2 italic">"${deal.audit_snippet}"</p>
                      <div class="flex items-center space-x-4 mt-2 text-sm text-green-600">
                        <span>Stage: ${deal.stage}</span>
                        <span>Probability: ${deal.probability}%</span>
                        ${deal.value ? `<span class="font-medium">₹${formatIndianCurrency(deal.value)}</span>` : ''}
                      </div>
                    </div>
                    <div class="ml-4 text-right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        deal.confidence >= 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${Math.round(deal.confidence * 100)}% confidence
                      </span>
                      <p class="text-xs text-gray-500 mt-1">
                        ${deal.status === 'accepted' ? '✅ Auto-approved' : '⏳ Needs review'}
                      </p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      resultDiv.className = 'mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden';
      resultDiv.innerHTML = `
        <div class="bg-gradient-to-r from-blue-500 to-green-500 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            🤖 AI Processing Complete
            <span class="ml-2 text-blue-100 text-sm font-normal">(${result.processing_time_ms}ms)</span>
          </h3>
          <div class="flex items-center space-x-6 mt-2 text-blue-100 text-sm">
            <span>🎯 Business Score: ${Math.round((result.results?.business_score || 0) * 100)}%</span>
            <span>🔍 AI Agent: ${result.tasks[0]?.agent || 'qwen2.5-coder'}</span>
            <span>⚡ ${result.results?.prefilter_result === 'passed' ? 'Prefilter: Passed' : 'Prefilter: Failed'}</span>
          </div>
        </div>
        <div class="p-6">
          ${tasksHTML}
          ${dealsHTML}
          ${tasks.length === 0 && deals.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <p class="text-lg">No tasks or deals were extracted from this email.</p>
              <p class="text-sm mt-2">The email may not contain actionable business content.</p>
            </div>
          ` : ''}
          <div class="mt-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
            <h5 class="font-medium text-gray-700 mb-2">🔧 Processing Summary</h5>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div><strong>High Confidence Items:</strong> ${(result.results?.high_confidence_tasks || 0) + (result.results?.high_confidence_deals || 0)}</div>
              <div><strong>Total Extracted:</strong> ${tasks.length + deals.length}</div>
              <div><strong>Processing Time:</strong> ${result.processing_time_ms}ms</div>
              <div><strong>Auto-approved:</strong> ${tasks.filter((t: any) => t.status === 'accepted').length + deals.filter((d: any) => d.status === 'accepted').length}</div>
            </div>
            <p class="text-xs text-gray-500 mt-3">
              💡 Items with ≥80% confidence are automatically approved. Lower confidence items require manual review.
            </p>
          </div>
        </div>
      `;
    } else {
      throw new Error('Processing failed');
    }
  } catch (error) {
    resultDiv.className = 'mt-4 p-4 bg-red-100 border border-red-200 rounded';
    resultDiv.innerHTML = `
      <h3 class="font-bold text-red-800">❌ Processing Failed</h3>
      <p class="text-red-700 text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p class="text-red-600 text-xs mt-2">Make sure the AI worker service is running on port 8000</p>
    `;
  }
}

// Indian currency formatter (lakhs and crores)
function formatIndianCurrency(value: number): string {
  if (value >= 10000000) { // 1 crore
    return `${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) { // 1 lakh
    return `${(value / 100000).toFixed(2)} L`;
  } else if (value >= 1000) { // thousands
    return `${(value / 1000).toFixed(0)}K`;
  } else {
    return value.toLocaleString('en-IN');
  }
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('user_id');
  });

  // Listen for authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const hasUserId = !!localStorage.getItem('user_id');
      setIsAuthenticated(hasUserId);
      console.log('🔍 Auth check:', hasUserId ? 'Authenticated' : 'Not authenticated');
    };

    // Check on mount and location change
    checkAuth();

    // Listen for storage events (in case user logs out in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      console.log('✅ Already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // PUBLIC ROUTE: Demo mode (no auth required)
  if (location.pathname === '/demo') {
    return <DemoMode />;
  }

  // Show Login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show authenticated app with navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/inbox" element={<AIInbox />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
