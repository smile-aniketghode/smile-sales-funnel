// Real AI Demo Mode Page - Uses actual LLM extraction via backend API

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealDemoState, RealDemoStage } from '../hooks/useRealDemoState';
import { DemoEmailInput } from '../components/demo/DemoEmailInput';
import { AIAnalyzing } from '../components/demo/AIAnalyzing';
import { ExtractionResults } from '../components/demo/ExtractionResults';
import { MetricCard } from '../components/MetricCard';

export const RealDemoMode: React.FC = () => {
  const {
    state,
    processEmail,
    reset,
    clearError,
    isProcessing,
    hasError,
    getStats,
  } = useRealDemoState();

  const handleSubmitEmail = async (emailText: string) => {
    await processEmail(emailText);
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>🤖</span>
              <span>AI Demo Mode - Real Extraction</span>
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              Test our AI email extraction with your own samples
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Reset Demo
            </button>
            <a
              href="/login"
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Connect Gmail
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Dashboard - Shows accumulated results */}
        {(stats.totalDeals > 0 || stats.totalTasks > 0 || stats.totalContacts > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <MetricCard
              title="Deals Extracted"
              value={stats.totalDeals}
              subtitle="From processed emails"
              color="blue"
              icon="🎯"
            />
            <MetricCard
              title="Tasks Found"
              value={stats.totalTasks}
              subtitle="Action items"
              color="purple"
              icon="✅"
            />
            <MetricCard
              title="Contacts Added"
              value={stats.totalContacts}
              subtitle="People identified"
              color="orange"
              icon="👥"
            />
            <MetricCard
              title="Total Value"
              value={stats.totalValue}
              subtitle="Deal pipeline"
              color="green"
              icon="💰"
              format="currency"
            />
          </motion.div>
        )}

        {/* Error Message */}
        {hasError && state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded"
          >
            <div className="flex items-start">
              <span className="text-red-500 text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold">Processing Failed</h3>
                <p className="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Email Input Form */}
        <DemoEmailInput
          onSubmit={handleSubmitEmail}
          isProcessing={isProcessing}
          remainingRequests={state.remainingRequests}
        />

        {/* Processed Results List */}
        {(state.deals.length > 0 || state.tasks.length > 0 || state.contacts.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Extraction Results
            </h2>

            {/* Deals */}
            {state.deals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Deals ({state.deals.length})</span>
                </h3>
                <div className="space-y-3">
                  {state.deals.map((deal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            {deal.value && (
                              <span className="text-sm font-medium text-green-700">
                                ₹{(deal.value / 100000).toFixed(2)}L
                              </span>
                            )}
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                              {deal.stage}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(deal.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {state.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  <span>Tasks ({state.tasks.length})</span>
                </h3>
                <div className="space-y-3">
                  {state.tasks.map((task, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-lg font-bold text-purple-600">
                            {Math.round(task.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts */}
            {state.contacts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👥</span>
                  <span>Contacts ({state.contacts.length})</span>
                </h3>
                <div className="space-y-3">
                  {state.contacts.map((contact, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-orange-50 rounded-lg p-4 border border-orange-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-300 rounded-full flex items-center justify-center text-white font-bold">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                          {contact.company && (
                            <p className="text-xs text-gray-500 mt-1">
                              {contact.position} at {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {/* AI Analyzing Overlay */}
        {state.stage === RealDemoStage.ANALYZING && (
          <AIAnalyzing key="analyzing" />
        )}

        {/* Extraction Results Modal */}
        {state.stage === RealDemoStage.SHOWING_RESULTS && state.deals.length > 0 && (
          <ExtractionResults
            key="results"
            deals={state.deals.slice(-1)} // Show only latest extraction
            tasks={state.tasks.slice(-1)}
            contacts={state.contacts.slice(-1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
