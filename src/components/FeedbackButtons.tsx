import React from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { storeFeedback } from '../services/supabase';

interface FeedbackButtonsProps {
  currentFeedback?: 'like' | 'dislike' | 'neutral';
  onFeedback: (feedback: 'like' | 'dislike' | 'neutral') => void;
  size?: 'sm' | 'md';
  promptData?: {
    promptType: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'gradientflow' | 'whiteframe';
    promptText: string;
    promptParameters: Record<string, any>;
    title?: string;
    keywords?: string[];
  };
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ 
  currentFeedback, 
  onFeedback, 
  size = 'md',
  promptData
}) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'p-1' : 'p-2';

  const handleFeedback = async (feedback: 'like' | 'dislike' | 'neutral') => {
    // Store feedback in Supabase for AI training
    if (promptData) {
      await storeFeedback({
        prompt_type: promptData.promptType,
        prompt_text: promptData.promptText,
        prompt_parameters: promptData.promptParameters,
        feedback,
        title: promptData.title,
        keywords: promptData.keywords
      });
    }
    
    // Call the original feedback handler
    onFeedback(feedback);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback('like')}
        className={`${buttonSize} rounded-lg transition-colors ${
          currentFeedback === 'like'
            ? 'bg-green-100 text-green-700'
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        }`}
        title="I like this image"
      >
        <ThumbsUp className={iconSize} />
      </button>
      <button
        onClick={() => handleFeedback('neutral')}
        className={`${buttonSize} rounded-lg transition-colors ${
          currentFeedback === 'neutral'
            ? 'bg-gray-100 text-gray-700'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title="I'm neutral on this image"
      >
        <Minus className={iconSize} />
      </button>
      <button
        onClick={() => handleFeedback('dislike')}
        className={`${buttonSize} rounded-lg transition-colors ${
          currentFeedback === 'dislike'
            ? 'bg-red-100 text-red-700'
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        }`}
        title="I don't like this image"
      >
        <ThumbsDown className={iconSize} />
      </button>
    </div>
  );
};

export default FeedbackButtons;