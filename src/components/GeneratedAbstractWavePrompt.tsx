import React, { useState } from 'react';
import { Copy, Check, Wand2, Plus } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { GeneratedAbstractWavePrompt as PromptType, CSVRow } from '../types';
import { generateTitleAndKeywords } from '../services/gemini';
import FeedbackButtons from './FeedbackButtons';

interface GeneratedAbstractWavePromptProps {
  prompt: PromptType;
  onFeedbackChange: (promptId: string, feedback: 'like' | 'dislike' | 'neutral') => void;
  onAddCsvEntry?: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptUpdate?: (id: string, updates: { title?: string; keywords?: string[] }) => void;
}

const GeneratedAbstractWavePrompt: React.FC<GeneratedAbstractWavePromptProps> = ({ prompt, onFeedbackChange, onAddCsvEntry, onPromptUpdate }) => {
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
      if (result) {
        const newKeywords = result.keywords.split(',').map(k => k.trim());
        if (onPromptUpdate) {
          onPromptUpdate(prompt.id, {
            title: result.title,
            keywords: newKeywords
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate title and keywords:', error);
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
      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
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
        <h3 className="text-lg font-medium text-gray-900">Generated AbstractWave Prompt</h3>
        <div className="flex items-center gap-2">
          <FeedbackButtons 
            currentFeedback={prompt.userFeedback}
            onFeedback={handleFeedback}
            promptData={{
              promptType: 'abstractwave',
              promptText: prompt.promptText,
              promptParameters: {
                waveDescriptor: prompt.waveDescriptor,
                gradientType: prompt.gradientType,
                colorPalette1: prompt.colorPalette1,
                colorPalette2: prompt.colorPalette2,
                colorPalette3: prompt.colorPalette3,
                depthEffect: prompt.depthEffect,
                lightingStyle: prompt.lightingStyle,
                optionalKeywords: prompt.optionalKeywords
              },
              title: prompt.title,
              keywords: prompt.keywords
            }}
          />
          {!prompt.title && !prompt.keywords && (
            <button
              onClick={handleGenerateTitleAndKeywords}
              disabled={isGenerating}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
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
          <span className="font-medium text-gray-700">Wave:</span>
          <span className="text-gray-600 ml-2">{prompt.waveDescriptor}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Gradient:</span>
          <span className="text-gray-600 ml-2">{prompt.gradientType}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 1:</span>
          <span className="text-gray-600 ml-2">{prompt.colorPalette1}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 2:</span>
          <span className="text-gray-600 ml-2">{prompt.colorPalette2}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Color 3:</span>
          <span className="text-gray-600 ml-2">{prompt.colorPalette3}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Depth:</span>
          <span className="text-gray-600 ml-2">{prompt.depthEffect}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Lighting:</span>
          <span className="text-gray-600 ml-2">{prompt.lightingStyle}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg">
          <span className="font-medium text-gray-700">Keywords:</span>
          <span className="text-gray-600 ml-2">{prompt.optionalKeywords}</span>
        </div>
      </div>
    </div>
  );
};

export default GeneratedAbstractWavePrompt;