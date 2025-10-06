import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DEMO_EMAILS } from '../../data/demoData';

interface DemoEmailInputProps {
  onSubmit: (emailText: string) => void;
  isProcessing: boolean;
  remainingRequests?: number;
}

export const DemoEmailInput: React.FC<DemoEmailInputProps> = ({
  onSubmit,
  isProcessing,
  remainingRequests = 5
}) => {
  const [inputMode, setInputMode] = useState<'sample' | 'paste' | 'upload'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string>(DEMO_EMAILS[0].id);
  const [pastedText, setPastedText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let emailText = '';

    if (inputMode === 'sample') {
      const sample = DEMO_EMAILS.find(email => email.id === selectedSampleId);
      if (!sample) return;
      emailText = `From: ${sample.fromName} <${sample.from}>\nSubject: ${sample.subject}\n\n${sample.body}`;
    } else if (inputMode === 'paste') {
      emailText = pastedText.trim();
    } else if (inputMode === 'upload' && uploadedFile) {
      emailText = await uploadedFile.text();
    }

    if (!emailText) return;

    onSubmit(emailText);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Test AI Email Extraction
      </h2>
      <p className="text-gray-600 mb-6">
        Choose a sample email, paste your own, or upload a file to see real AI extraction in action.
      </p>

      {/* Rate Limit Warning */}
      {remainingRequests <= 2 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {remainingRequests} {remainingRequests === 1 ? 'request' : 'requests'} remaining this hour.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setInputMode('sample')}
          className={`px-6 py-3 font-medium transition-colors ${
            inputMode === 'sample'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📧 Sample Emails
        </button>
        <button
          onClick={() => setInputMode('paste')}
          className={`px-6 py-3 font-medium transition-colors ${
            inputMode === 'paste'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📝 Paste Email
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`px-6 py-3 font-medium transition-colors ${
            inputMode === 'upload'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📎 Upload File
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sample Email Selector */}
        {inputMode === 'sample' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a sample email:
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            >
              {DEMO_EMAILS.map((email) => (
                <option key={email.id} value={email.id}>
                  {email.fromName} - {email.subject}
                </option>
              ))}
            </select>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Preview: {DEMO_EMAILS.find(e => e.id === selectedSampleId)?.body.substring(0, 150)}...
              </p>
            </div>
          </div>
        )}

        {/* Paste Email Text */}
        {inputMode === 'paste' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste your email content:
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="From: john@example.com&#10;Subject: Budget approval&#10;&#10;Hi team, I've got approval for..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={12}
              disabled={isProcessing}
              maxLength={5000}
            />
            <p className="text-sm text-gray-500">
              {pastedText.length} / 5000 characters
            </p>
          </div>
        )}

        {/* Upload Email File */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload email file (.txt or .eml):
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-5xl mb-3">📁</span>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    .txt or .eml files (max 5KB)
                  </p>
                  {uploadedFile && (
                    <p className="mt-3 text-sm font-medium text-blue-600">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.eml"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isProcessing || remainingRequests === 0 ||
              (inputMode === 'paste' && !pastedText.trim()) ||
              (inputMode === 'upload' && !uploadedFile)
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-3">🤖</span>
                Processing with AI...
              </span>
            ) : remainingRequests === 0 ? (
              'Rate Limit Reached - Try Again Later'
            ) : (
              `🚀 Extract with AI (${remainingRequests} remaining)`
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How it works:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI analyzes email content in real-time</li>
            <li>• Extracts deals, tasks, and contacts</li>
            <li>• Returns confidence scores for each extraction</li>
            <li>• Rate limited to 5 requests per hour per IP</li>
            <li>• Demo results are not saved to database</li>
          </ul>
        </div>
      </form>
    </motion.div>
  );
};
