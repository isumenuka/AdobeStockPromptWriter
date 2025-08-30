import React from 'react';
import { History } from 'lucide-react';
import { CustomPrompt, CSVRow } from '../types';
import CustomPromptHistoryItem from './CustomPromptHistoryItem';

interface CustomPromptHistoryProps {
  prompts: CustomPrompt[];
  onClear: () => void;
  onFeedbackChange: (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => void;
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
}

const CustomPromptHistory: React.FC<CustomPromptHistoryProps> = ({ prompts, onClear, onFeedbackChange, onAddCsvEntry }) => {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Custom Prompt History</h3>
        </div>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-amber-600 transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <CustomPromptHistoryItem 
            key={prompt.id} 
            prompt={prompt} 
            onFeedbackChange={onFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomPromptHistory;