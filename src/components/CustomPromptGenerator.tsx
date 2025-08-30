import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Edit3, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_PROMPT_LENGTH, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateTitleAndKeywords } from '../services/gemini';
import { isDuplicatePrompt } from '../utils/duplicateChecker';
import { validatePromptText, detectXSS, rateLimiter } from '../utils/inputValidation';
import type { CustomPrompt, CSVRow } from '../types';
import CustomPromptHistory from './CustomPromptHistory';

interface CustomPromptGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
}

const CustomPromptGenerator: React.FC<CustomPromptGeneratorProps> = ({ onAddCsvEntry }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customError, setCustomError] = useState('');
  const [promptHistory, setPromptHistory] = useLocalStorage<CustomPrompt[]>(
    STORAGE_KEYS.CUSTOM_PROMPT_HISTORY,
    []
  );

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    
    // Rate limiting check
    const clientId = 'custom_prompt_generation';
    if (!rateLimiter.isAllowed(clientId, 10, 60 * 1000)) { // 10 attempts per minute
      const timeUntilReset = rateLimiter.getTimeUntilReset(clientId, 60 * 1000);
      setCustomError(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      return;
    }
    
    // Validate and sanitize input
    const validation = validatePromptText(customPrompt, MAX_PROMPT_LENGTH);
    if (!validation.isValid) {
      setCustomError(validation.error || 'Invalid prompt text');
      return;
    }
    
    // Check for XSS attempts
    if (detectXSS(customPrompt)) {
      setCustomError('Invalid content detected. Please remove any HTML or script tags.');
      return;
    }
    
    // Check for duplicate prompt
    if (isDuplicatePrompt(validation.sanitized, promptHistory)) {
      setCustomError('This prompt has already been generated. Please enter a different prompt.');
      return;
    }
    
    setCustomError('');
    setIsGenerating(true);
    
    try {
      const result = await generateTitleAndKeywords(validation.sanitized);
      if (result.data) {
        const newPrompt: CustomPrompt = {
          id: uuidv4(),
          promptText: validation.sanitized,
          title: result.data.title,
          keywords: result.data.keywords.split(',').map(k => k.trim()),
          timestamp: Date.now(),
        };

        setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
        setCustomPrompt('');
        
        // Note: User can manually add to CSV using the + button in history
      } else if (result.error) {
        setCustomError(result.error);
      }
    } catch (error) {
      console.error('Failed to generate custom prompt:', error);
      setCustomError('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    setPromptHistory([]);
  };

  const handleFeedbackChange = (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => {
    setPromptHistory(prev => 
      prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, userFeedback: feedback }
          : prompt
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <Edit3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custom Prompt Generator</h2>
          <p className="text-sm text-gray-600">Enter your prompt - auto-adds to CSV export</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Custom Prompt</label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH));
                  setCustomError('');
                }}
                placeholder="Enter your custom prompt here... Be descriptive and specific for best results!"
                className={`w-full px-4 py-4 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                  customError ? 'border-red-300' : 'border-gray-300'
                } transition-all`}
                rows={4}
                disabled={isGenerating}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                {customPrompt.length}/{MAX_PROMPT_LENGTH}
              </div>
            </div>
          </div>
          
          {customError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span>Generate & Add to CSV</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!customPrompt.trim() || isGenerating}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Your Prompt...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate Title & Keywords</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CustomPromptHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
      />
    </div>
  );
};

export default CustomPromptGenerator;