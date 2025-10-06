// AI analyzing animation - shown while "processing" email

import React from 'react';
import { motion } from 'framer-motion';

export const AIAnalyzing: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 bg-opacity-95"
    >
      <div className="text-center">
        {/* Animated Robot */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-8xl mb-6"
        >
          🤖
        </motion.div>

        {/* Main Text */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-4"
        >
          AI Analyzing Email...
        </motion.h2>

        {/* Processing Steps */}
        <div className="space-y-3 mb-8">
          {[
            { text: 'Extracting deal information', delay: 0.3 },
            { text: 'Identifying tasks and action items', delay: 0.5 },
            { text: 'Finding contact details', delay: 0.7 },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: step.delay }}
              className="flex items-center justify-center space-x-3 text-purple-200"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"
              />
              <span className="text-sm font-medium">{step.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-purple-300 text-xs mt-3"
          >
            Using advanced NLP and entity extraction models...
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
