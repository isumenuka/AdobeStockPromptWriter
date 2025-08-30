import React from 'react';
import GradientFlowHistoryItem from './GradientFlowHistoryItem';
import { GeneratedGradientFlowPrompt, CSVRow } from '../types';
import { History } from 'lucide-react';

interface GradientFlowHistoryProps {
  prompts: GeneratedGradientFlowPrompt[];
  onClear: () => void;
  onFeedbackChange: (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => void;
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptUpdate: (promptId: string, updates: { title?: string; keywords?: string[] }) => void;
}

const GradientFlowHistory: React.FC<GradientFlowHistoryProps> = ({ prompts, onClear, onFeedbackChange, onAddCsvEntry, onPromptUpdate }) => {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Recent GradientFlow Prompts</h3>
        </div>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
        >
          Clear History
        </button>
      </div>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <GradientFlowHistoryItem 
            key={prompt.id} 
            prompt={prompt} 
            onFeedbackChange={onFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={onPromptUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default GradientFlowHistory;