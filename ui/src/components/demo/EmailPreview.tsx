// Email preview component - displays email content during demo processing

import React from 'react';
import { motion } from 'framer-motion';
import type { DemoEmail } from '../../types/demo';

interface EmailPreviewProps {
  email: DemoEmail;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({ email }) => {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
      >
        {/* Email Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-2xl">📧</span>
                <span className="text-sm font-medium opacity-90">New Email Received</span>
              </div>
              <h3 className="font-bold text-lg">{email.subject}</h3>
            </div>
          </div>
        </div>

        {/* Email Metadata */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-600">From:</span>{' '}
              <span className="font-medium text-gray-900">
                {email.fromName} &lt;{email.from}&gt;
              </span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="px-6 py-6 max-h-96 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {email.body}
            </pre>
          </div>
        </div>

        {/* Processing Indicator */}
        <div className="bg-blue-50 px-6 py-4 border-t border-blue-100">
          <div className="flex items-center justify-center space-x-2 text-blue-700">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5"
            >
              🤖
            </motion.div>
            <span className="text-sm font-medium">AI is reading this email...</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
