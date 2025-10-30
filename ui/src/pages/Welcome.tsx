import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleConnectGmail = () => {
    // Redirect to login page which handles email input and OAuth flow
    navigate('/login');
  };

  const handleTryDemo = () => {
    // Mark that user tried demo (skip onboarding later)
    localStorage.setItem('tried_demo', 'true');
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex">
      {/* Left Side - Visual Impact */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative w-full max-w-lg z-10">
          {/* Main visual - simplified pipeline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl mb-6 animate-float">
              <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
              </svg>
            </div>

            {/* Value proposition cards - simplified */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
                <div className="text-4xl mb-3">💰</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">₹50L - ₹1.5Cr</div>
                <div className="text-sm text-gray-600">Average deal size identified by AI</div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
                <div className="text-4xl mb-3">⚡</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">Under 2 minutes</div>
                <div className="text-sm text-gray-600">From email to actionable pipeline</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Clean, focused CTA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="max-w-md w-full">
          {/* Branding */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">🎯</span>
              <div>
                <div className="text-3xl font-black text-blue-600">SMILe</div>
                <div className="text-xs text-gray-500 font-medium">Sales Funnel</div>
              </div>
            </div>
          </div>

          {/* Hero message */}
          <div className="mb-12">
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              Turn emails into deals
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              AI automatically extracts sales opportunities, tasks, and contacts from your Gmail inbox
            </p>
          </div>

          {/* Single strong CTA */}
          <button
            onClick={handleConnectGmail}
            className="w-full mb-6 px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-4 group"
          >
            <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
            </svg>
            Connect Gmail to Start
          </button>

          {/* Trust indicators */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500">
              🔒 Secure OAuth 2.0 • Takes 30 seconds • Revoke anytime
            </p>
          </div>

          {/* Social proof / stats */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">80%+</div>
                <div className="text-xs text-gray-600 mt-1">AI Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">5min</div>
                <div className="text-xs text-gray-600 mt-1">Setup Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">Auto</div>
                <div className="text-xs text-gray-600 mt-1">Sync Daily</div>
              </div>
            </div>
          </div>

          {/* Demo link */}
          <div className="mt-8 text-center">
            <button
              onClick={handleTryDemo}
              className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors inline-flex items-center gap-2"
            >
              <span>🎬</span>
              <span>See demo first</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
