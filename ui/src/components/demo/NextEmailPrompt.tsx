// Next email prompt - shows between emails during demo

import React from 'react';
import { motion } from 'framer-motion';

interface NextEmailPromptProps {
  remaining: number;
  onNext: () => void;
}

export const NextEmailPrompt: React.FC<NextEmailPromptProps> = ({ remaining, onNext }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl px-8 py-6 flex items-center space-x-6"
      >
        <div>
          <p className="font-semibold text-lg">Dashboard updated!</p>
          <p className="text-blue-100 text-sm">
            {remaining} {remaining === 1 ? 'email' : 'emails'} remaining in queue
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center space-x-2"
        >
          <span>Process Next Email</span>
          <span className="text-xl">→</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
