// Extraction results component - displays AI-extracted deals and tasks

import React from 'react';
import { motion } from 'framer-motion';
import { Deal, Task, Contact, DealStage } from '../../types/api';

interface ExtractionResultsProps {
  deals: Deal[];
  tasks: Task[];
  contacts: Contact[];
}

export const ExtractionResults: React.FC<ExtractionResultsProps> = ({ deals, tasks, contacts }) => {
  // Indian currency formatter
  const formatCurrency = (value: number): string => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Stage label helper
  const getStageBadge = (stage: DealStage): { label: string; color: string } => {
    const badges: Record<DealStage, { label: string; color: string }> = {
      [DealStage.LEAD]: { label: 'Lead', color: 'bg-gray-100 text-gray-700' },
      [DealStage.CONTACTED]: { label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
      [DealStage.DEMO]: { label: 'Demo', color: 'bg-purple-100 text-purple-700' },
      [DealStage.PROPOSAL]: { label: 'Proposal', color: 'bg-yellow-100 text-yellow-700' },
      [DealStage.NEGOTIATION]: { label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
      [DealStage.QUALIFIED]: { label: 'Qualified', color: 'bg-green-100 text-green-700' },
      [DealStage.CLOSED]: { label: 'Closed', color: 'bg-green-100 text-green-700' },
      [DealStage.CLOSED_WON]: { label: 'Closed Won', color: 'bg-green-100 text-green-700' },
    };
    return badges[stage] || { label: stage, color: 'bg-gray-100 text-gray-700' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 20, stiffness: 300 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">✅</span>
            <div>
              <h3 className="text-2xl font-bold">Extraction Complete!</h3>
              <p className="text-green-100 text-sm mt-1">
                AI successfully identified {deals.length} {deals.length === 1 ? 'deal' : 'deals'},{' '}
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'},{' '}
                {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Deals */}
            {deals.length > 0 && (
              <motion.div variants={itemVariants}>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  💰 Deals Found ({deals.length})
                </h4>
                <div className="space-y-3">
                  {deals.map((deal) => {
                    const stageBadge = getStageBadge(deal.stage);
                    return (
                      <motion.div
                        key={deal.id}
                        variants={itemVariants}
                        className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-green-900">{deal.title}</h5>
                            <p className="text-sm text-green-700 mt-1">{deal.description}</p>
                            <p className="text-xs text-green-600 italic mt-2">
                              "{deal.audit_snippet}"
                            </p>
                            <div className="flex items-center space-x-3 mt-2">
                              {deal.value && (
                                <span className="font-bold text-green-800">
                                  {formatCurrency(deal.value)}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${stageBadge.color}`}>
                                {stageBadge.label}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {Math.round(deal.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <motion.div variants={itemVariants}>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  ✅ Tasks Identified ({tasks.length})
                </h4>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      variants={itemVariants}
                      className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-blue-900">{task.title}</h5>
                          <p className="text-sm text-blue-700 mt-1">{task.description}</p>
                          {task.audit_snippet && (
                            <p className="text-xs text-blue-600 italic mt-2">
                              "{task.audit_snippet}"
                            </p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-blue-600 mt-2">
                              📅 Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {Math.round(task.confidence * 100)}% confidence
                          </span>
                          <span className={`block mt-1 text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contacts */}
            {contacts.length > 0 && (
              <motion.div variants={itemVariants}>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  👤 Contacts Added ({contacts.length})
                </h4>
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      variants={itemVariants}
                      className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-semibold text-purple-900">{contact.name}</h5>
                        <p className="text-sm text-purple-700">
                          {contact.position} at {contact.company}
                        </p>
                        <p className="text-xs text-purple-600">{contact.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        {contact.segment}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Results */}
            {deals.length === 0 && tasks.length === 0 && contacts.length === 0 && (
              <motion.div variants={itemVariants} className="text-center py-8 text-gray-500">
                <p className="text-lg">No actionable items found in this email</p>
                <p className="text-sm mt-2">The email may not contain business-related content</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ⚡
            </motion.div>
            <span>Updating dashboard with new data...</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
