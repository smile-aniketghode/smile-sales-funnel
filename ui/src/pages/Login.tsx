import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const WORKER_API_BASE = 'http://localhost:8000';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Check for OAuth callback
  useEffect(() => {
    const connected = searchParams.get('gmail_connected');
    const callbackEmail = searchParams.get('email');
    const errorParam = searchParams.get('gmail_error');

    if (connected === 'true' && callbackEmail) {
      // Store user_id and redirect to dashboard
      localStorage.setItem('user_id', callbackEmail);
      localStorage.setItem('user_email', callbackEmail);
      console.log('✅ User authenticated:', callbackEmail);

      // Redirect to dashboard
      navigate('/', { replace: true });
    } else if (errorParam) {
      setError(errorParam || 'Failed to connect Gmail');
      setIsConnecting(false);
    }
  }, [searchParams, navigate]);

  const handleConnectGmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Get OAuth URL from worker
      const authUrl = `${WORKER_API_BASE}/auth/gmail?user_id=${encodeURIComponent(email)}`;
      const response = await fetch(authUrl);
      const data = await response.json();

      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (err) {
      setError('Failed to connect to authentication server');
      setIsConnecting(false);
      console.error('Auth error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnectGmail();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SMILe Sales Funnel
          </h1>
          <p className="text-gray-600">
            AI-powered sales pipeline from your inbox
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600 text-sm">
              Connect your Gmail to automatically extract tasks and deals from your emails
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@company.com"
                disabled={isConnecting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Connect Button */}
            <button
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
                  </svg>
                  <span>Connect with Gmail</span>
                </>
              )}
            </button>
          </div>

          {/* Features List */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              What you'll get
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automatic task extraction from emails</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI-powered deal tracking and insights</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Complete sales funnel visualization</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Phase 3 - Gmail Integration • Powered by AI
        </p>
      </div>
    </div>
  );
};
