import React, { useState } from 'react';
import { Copy, Check, Wand2, Plus } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { GeneratedGradientFlowPrompt as PromptType, CSVRow } from '../types';
import { generateTitleAndKeywords } from '../services/gemini';
import FeedbackButtons from './FeedbackButtons';

interface GeneratedGradientFlowPromptProps {
  prompt: PromptType;
  onFeedbackChange: (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => void;
  onAddCsvEntry?: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptUpdate?: (id: string, updates: { title?: string; keywords?: string[] }) => void;
}

const GeneratedGradientFlowPrompt: React.FC<GeneratedGradientFlowPromptProps> = ({ prompt, onFeedbackChange, onAddCsvEntry, onPromptUpdate }) => {
  const [copiedStates, setCopiedStates] = useState({
    title: false,
    keywords: false,
    prompt: false
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopy = async (type: 'title' | 'keywords' | 'prompt', text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    }
  };

  const handleGenerateTitleAndKeywords = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTitleAndKeywords(prompt.promptText);
      if (result.error) {
        alert(`Title/Keywords generation failed: ${result.error}`);
      } else if (result.data) {
        const newKeywords = result.data.keywords.split(',').map(k => k.trim());
        if (onPromptUpdate) {
          onPromptUpdate(prompt.id, {
            title: result.data.title,
            keywords: newKeywords
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate title and keywords:', error);
      alert('Failed to generate title and keywords. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = (feedback: 'like' | 'dislike' | 'neutral') => {
    onFeedbackChange(prompt.id, feedback);
  };

  const handleAddToCsv = () => {
    if (!onAddCsvEntry || !prompt.title || !prompt.keywords || prompt.keywords.length === 0) return;
    
    onAddCsvEntry({
      filename: '',
      title: prompt.title,
      keywords: Array.isArray(prompt.keywords) ? prompt.keywords.join(', ') : prompt.keywords,
      category: '8',
      releases: ''
    });
  };

  const CopyButton = ({ type, text }: { type: 'title' | 'keywords' | 'prompt', text: string }) => (
    <button
      onClick={() => handleCopy(type, text)}
      className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors"
      aria-label={`Copy ${type}`}
    >
      {copiedStates[type] ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Generated GradientFlow Prompt</h3>
        <div className="flex items-center gap-2">
          <FeedbackButtons 
            currentFeedback={prompt.userFeedback}
            onFeedback={handleFeedback}
            promptData={{
              promptType: 'gradientflow',
              promptText: prompt.promptText,
              promptParameters: {
                color1: prompt.color1,
                color2: prompt.color2,
                color3: prompt.color3,
                backgroundColor: prompt.backgroundColor,
                colorSpreadStyle: prompt.colorSpreadStyle
              },
              title: prompt.title,
              keywords: prompt.keywords
            }}
          />
          {!prompt.title && !prompt.keywords && (
            <button
              onClick={handleGenerateTitleAndKeywords}
              disabled={isGenerating}
              className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
              title="Generate Title & Keywords"
            >
              <Wand2 className="h-4 w-4" />
            </button>
          )}
          {prompt.title && prompt.keywords && prompt.keywords.length > 0 && onAddCsvEntry && (
            <button
              onClick={handleAddToCsv}
              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
              title="Add to CSV Export"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {prompt.title && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <CopyButton type="title" text={prompt.title} />
          </div>
          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{prompt.title}</p>
        </div>
      )}

      {prompt.keywords && prompt.keywords.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Keywords</span>
            <CopyButton type="keywords" text={Array.isArray(prompt.keywords) ? prompt.keywords.join(', ') : prompt.keywords} />
          </div>
          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
            {Array.isArray(prompt.keywords) ? prompt.keywords.join(', ') : prompt.keywords}
          </p>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Prompt</span>
          <CopyButton type="prompt" text={prompt.promptText} />
        </div>
        <p className="text-gray-800 bg-gray-50 p-3 rounded-lg break-words">{prompt.promptText}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 1:</span>
          <span className="text-gray-600 ml-2">{prompt.color1}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 2:</span>
          <span className="text-gray-600 ml-2">{prompt.color2}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 3:</span>
          <span className="text-gray-600 ml-2">{prompt.color3}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Background:</span>
          <span className="text-gray-600 ml-2">{prompt.backgroundColor}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg col-span-2">
          <span className="font-medium text-gray-700">Style:</span>
          <span className="text-gray-600 ml-2">{prompt.colorSpreadStyle}</span>
        </div>
      </div>
    </div>
  );
};

export default GeneratedGradientFlowPrompt;