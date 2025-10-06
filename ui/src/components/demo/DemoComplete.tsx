// Demo completion screen - shows final stats and CTAs

import React from 'react';
import { motion } from 'framer-motion';
import type { DemoStats } from '../../types/demo';

interface DemoCompleteProps {
  stats: DemoStats;
  onReset: () => void;
  onConnectGmail: () => void;
}

export const DemoComplete: React.FC<DemoCompleteProps> = ({ stats, onReset, onConnectGmail }) => {
  // Indian currency formatter
  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, damping: 15 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-4xl font-bold mb-2">Demo Complete!</h2>
          <p className="text-green-100 text-lg">
            You've seen how AI automates your sales pipeline
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-8">
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              From 5 emails, AI extracted:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: '💰',
                  label: 'Deals',
                  value: stats.totalDeals.toString(),
                  subtitle: formatCurrency(stats.totalValue),
                  color: 'from-green-400 to-emerald-500',
                },
                {
                  icon: '✅',
                  label: 'Tasks',
                  value: stats.totalTasks.toString(),
                  subtitle: 'Action items',
                  color: 'from-blue-400 to-cyan-500',
                },
                {
                  icon: '👥',
                  label: 'Contacts',
                  value: stats.totalContacts.toString(),
                  subtitle: 'CRM entries',
                  color: 'from-purple-400 to-pink-500',
                },
                {
                  icon: '⏱️',
                  label: 'Time Saved',
                  value: `${stats.timeSaved}`,
                  subtitle: 'minutes',
                  color: 'from-orange-400 to-red-500',
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl text-center shadow-lg text-white`}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs opacity-90">{stat.label}</div>
                  <div className="text-xs opacity-75 mt-1">{stat.subtitle}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Accuracy Stats */}
          <motion.div variants={itemVariants} className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.highConfidenceItems}
                </div>
                <div className="text-sm text-gray-600">High Confidence Items (≥90%)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.autoApprovedItems}
                </div>
                <div className="text-sm text-gray-600">Auto-Approved (≥80%)</div>
              </div>
            </div>
          </motion.div>

          {/* Value Proposition */}
          <motion.div variants={itemVariants} className="bg-blue-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
              <span className="text-2xl mr-2">✨</span>
              <span>The Power of Automation</span>
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Zero manual data entry - deals and tasks auto-created from emails</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Never miss an opportunity - AI scans every email for sales signals</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Save ~{stats.timeSaved} minutes per day on CRM updates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Pipeline stays current automatically - no more stale data</span>
              </li>
            </ul>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onReset}
              className="flex-1 px-6 py-4 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              🔄 Watch Again
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConnectGmail}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center space-x-2"
            >
              <span>📧 Connect Your Gmail</span>
              <span className="text-xl">→</span>
            </motion.button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-xs text-gray-500 mt-4">
            Join hundreds of sales teams saving time with AI-powered CRM automation
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};
