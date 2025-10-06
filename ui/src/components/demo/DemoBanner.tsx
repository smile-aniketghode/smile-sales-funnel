// Demo mode persistent banner - shows demo status and CTAs

import React from 'react';
import { motion } from 'framer-motion';

interface DemoBannerProps {
  onReset: () => void;
  onConnectGmail: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onReset, onConnectGmail }) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎭</span>
            <div>
              <h3 className="font-semibold text-sm">Interactive Demo Mode</h3>
              <p className="text-xs text-purple-100">
                Watch AI extract deals and tasks from emails • All features work • Data resets on refresh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-white rounded-lg hover:bg-purple-50 transition-colors"
            >
              🔄 Reset Demo
            </button>
            <button
              onClick={onConnectGmail}
              className="px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
            >
              📧 Connect Your Gmail →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
