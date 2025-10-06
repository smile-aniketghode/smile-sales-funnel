// Demo mode page - orchestrates the entire simulated processing flow

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useDemoState } from '../hooks/useDemoState';
import { DemoStage } from '../types/demo';
import { DemoBanner } from '../components/demo/DemoBanner';
import { EmailPreview } from '../components/demo/EmailPreview';
import { AIAnalyzing } from '../components/demo/AIAnalyzing';
import { ExtractionResults } from '../components/demo/ExtractionResults';
import { NextEmailPrompt } from '../components/demo/NextEmailPrompt';
import { DemoComplete } from '../components/demo/DemoComplete';
import { MetricCard } from '../components/MetricCard';
import { motion } from 'framer-motion';

export const DemoMode: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    currentEmail,
    processNextEmail,
    reset,
    getStats,
    getRemainingCount,
    isProcessing,
    totalEmails,
  } = useDemoState();

  // Handle Connect Gmail CTA
  const handleConnectGmail = () => {
    navigate('/login');
  };

  // Calculate dashboard metrics from current state
  const totalRevenue = state.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const activeDeals = state.deals.length;
  const todayTasks = state.tasks.length;
  const totalContacts = state.contacts.length;

  // Indian currency formatter
  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <DemoBanner onReset={reset} onConnectGmail={handleConnectGmail} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Idle State - Start Demo */}
        {state.stage === DemoStage.IDLE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                📬
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                See AI-Powered Sales Tracking in Action
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Watch how our AI automatically extracts deals, tasks, and contacts from {totalEmails} real
                business emails. No signup required.
              </p>
            </div>

            {/* Empty Dashboard Preview */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Revenue Pipeline"
                  value={0}
                  subtitle="Total deal value"
                  color="green"
                  icon="💰"
                  format="currency"
                />
                <MetricCard
                  title="Active Deals"
                  value={0}
                  subtitle="In pipeline"
                  color="blue"
                  icon="🎯"
                />
                <MetricCard
                  title="Tasks Today"
                  value={0}
                  subtitle="Action items"
                  color="purple"
                  icon="✅"
                />
                <MetricCard
                  title="Contacts"
                  value={0}
                  subtitle="In CRM"
                  color="orange"
                  icon="👥"
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-blue-900 mb-2">📧 Inbox Queue</h3>
                <p className="text-blue-700 mb-4">
                  {totalEmails} unprocessed emails waiting for AI analysis
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={processNextEmail}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center space-x-3"
                >
                  <span>Start Processing Emails</span>
                  <span className="text-2xl">→</span>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              {[
                {
                  icon: '🤖',
                  title: 'AI Extraction',
                  desc: 'Watch deals, tasks, and contacts extracted from emails in real-time',
                },
                {
                  icon: '📊',
                  title: 'Live Dashboard',
                  desc: 'See your pipeline update automatically as each email is processed',
                },
                {
                  icon: '⚡',
                  title: '~2 Minutes',
                  desc: 'Complete demo with all 5 emails - see the full automation flow',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-md"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Demo - Show Dashboard with Current State */}
        {state.stage !== DemoStage.IDLE && state.stage !== DemoStage.COMPLETE && (
          <div>
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Processing Email {state.currentEmailIndex + 1} of {totalEmails}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(((state.currentEmailIndex + 1) / totalEmails) * 100)}% Complete
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((state.currentEmailIndex + 1) / totalEmails) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>

            {/* Dashboard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Revenue Pipeline"
                value={totalRevenue}
                subtitle="Total deal value"
                color="green"
                icon="💰"
                format="currency"
              />
              <MetricCard
                title="Active Deals"
                value={activeDeals}
                subtitle="In pipeline"
                color="blue"
                icon="🎯"
              />
              <MetricCard
                title="Tasks Today"
                value={todayTasks}
                subtitle="Action items"
                color="purple"
                icon="✅"
              />
              <MetricCard
                title="Contacts"
                value={totalContacts}
                subtitle="In CRM"
                color="orange"
                icon="👥"
              />
            </div>

            {/* Deals & Tasks Summary (simplified view) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deals */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💰</span>
                  Active Deals ({state.deals.length})
                </h3>
                {state.deals.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No deals yet - processing emails...
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {state.deals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-l-4 border-green-500 bg-green-50 p-3 rounded-r"
                      >
                        <div className="font-medium text-gray-900">{deal.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {deal.value ? formatCurrency(deal.value) : 'Value TBD'} •{' '}
                          <span className="capitalize">{deal.stage}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">✅</span>
                  Tasks ({state.tasks.length})
                </h3>
                {state.tasks.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No tasks yet - processing emails...
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {state.tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r"
                      >
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {task.priority && (
                            <span className="capitalize">{task.priority} priority</span>
                          )}
                          {task.due_date && (
                            <span> • Due {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated Overlays */}
      <AnimatePresence mode="wait">
        {state.stage === DemoStage.SHOWING_EMAIL && currentEmail && (
          <EmailPreview key="email" email={currentEmail} />
        )}

        {state.stage === DemoStage.ANALYZING && <AIAnalyzing key="analyzing" />}

        {state.stage === DemoStage.SHOWING_RESULTS && currentEmail && (
          <ExtractionResults
            key="results"
            deals={currentEmail.extractionResult.deals}
            tasks={currentEmail.extractionResult.tasks}
            contacts={currentEmail.extractionResult.contacts}
          />
        )}

        {state.stage === DemoStage.READY_FOR_NEXT && (
          <NextEmailPrompt
            key="next"
            remaining={getRemainingCount()}
            onNext={processNextEmail}
          />
        )}

        {state.stage === DemoStage.COMPLETE && (
          <DemoComplete
            key="complete"
            stats={getStats()}
            onReset={reset}
            onConnectGmail={handleConnectGmail}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
