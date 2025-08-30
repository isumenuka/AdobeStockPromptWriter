import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Plus, Wand2 } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { GeneratedPrompt, CSVRow } from '../types';
import FeedbackButtons from './FeedbackButtons';

interface PromptHistoryItemProps {
  prompt: GeneratedPrompt;
  onFeedbackChange: (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => void;
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptUpdate: (promptId: string, updates: { title?: string; keywords?: string[] }) => void;
}

const PromptHistoryItem: React.FC<PromptHistoryItemProps> = ({ prompt, onFeedbackChange, onAddCsvEntry, onPromptUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt.promptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFeedback = (feedback: 'like' | 'dislike' | 'neutral') => {
    onFeedbackChange(prompt.id, feedback);
  };

  const handleGenerateTitleAndKeywords = async () => {
    setIsGenerating(true);
    try {
      const { generateTitleAndKeywords } = await import('../services/gemini');
      const result = await generateTitleAndKeywords(prompt.promptText);
      if (result) {
        const newKeywords = result.keywords.split(',').map(k => k.trim());
        onPromptUpdate(prompt.id, {
          title: result.title,
          keywords: newKeywords
        });
      }
    } catch (error) {
      console.error('Failed to generate title and keywords:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCsv = () => {
    if (!prompt.title || !prompt.keywords || prompt.keywords.length === 0) return;
    
    const keywordsString = Array.isArray(prompt.keywords) 
      ? prompt.keywords.join(', ') 
      : prompt.keywords;
    
    onAddCsvEntry({
      filename: '',
      title: prompt.title,
      keywords: keywordsString,
      category: '8',
      releases: ''
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <div 
        className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
          <div>
            <span className="font-medium text-gray-900">{prompt.materialType}</span>
            <span className="text-sm text-gray-500 ml-2">{formatDate(prompt.timestamp)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <FeedbackButtons 
            currentFeedback={prompt.userFeedback}
            onFeedback={(feedback) => {
              handleFeedback(feedback);
            }}
            size="sm"
            promptData={{
              promptType: 'texture',
              promptText: prompt.promptText,
              promptParameters: {
                materialType: prompt.materialType,
                primaryColorTone: prompt.primaryColorTone,
                secondaryColorTone: prompt.secondaryColorTone,
                lightingStyle: prompt.lightingStyle
              },
              title: prompt.title,
              keywords: prompt.keywords
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!prompt.title || !prompt.keywords || (Array.isArray(prompt.keywords) && prompt.keywords.length === 0)) {
                handleGenerateTitleAndKeywords();
              }
            }}
            disabled={isGenerating || (prompt.title && prompt.keywords && Array.isArray(prompt.keywords) && prompt.keywords.length > 0)}
            className="text-amber-600 hover:text-amber-800 p-2 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
            title="Generate Title & Keywords"
          >
            <Wand2 className="h-3 w-3" />
          </button>
          {prompt.title && prompt.keywords && Array.isArray(prompt.keywords) && prompt.keywords.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCsv();
              }}
              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
              title="Add to CSV Export"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="text-amber-600 hover:text-amber-800 p-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-3 pb-3">
          <p className="text-gray-700 mb-3 break-words bg-white p-3 rounded-lg border border-gray-200">
            {prompt.promptText}
          </p>
          {prompt.materialType !== 'Custom' && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">
                <span className="font-medium text-gray-700">Primary:</span> {prompt.primaryColorTone}
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-gray-700">Secondary:</span> {prompt.secondaryColorTone}
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-gray-700">Lighting:</span> {prompt.lightingStyle}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptHistoryItem;