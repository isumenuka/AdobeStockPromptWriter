import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Wand2, Loader2, Palette, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getGradientFlowRandomization } from '../services/gemini';
import { colors, backgroundColors, colorSpreadStyles, gradientFlowPromptTemplate } from '../data/gradientFlowData';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicatePrompt } from '../utils/duplicateChecker';
import type { GradientFlowData, GeneratedGradientFlowPrompt, CSVRow } from '../types';
import ParameterSelector from './ParameterSelector';
import GeneratedGradientFlowPrompt from './GeneratedGradientFlowPrompt';
import GradientFlowHistory from './GradientFlowHistory';

interface GradientFlowGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptGenerated?: (promptType: 'gradientflow', promptData: GeneratedGradientFlowPrompt) => void;
}

const GradientFlowGenerator: React.FC<GradientFlowGeneratorProps> = ({ onAddCsvEntry, onPromptGenerated }) => {
  const [promptData, setPromptData] = useState<GradientFlowData>({
    color1: '',
    color2: '',
    color3: '',
    backgroundColor: '',
    colorSpreadStyle: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedGradientFlowPrompt | null>(null);
  const [promptHistory, setPromptHistory] = useLocalStorage<GeneratedGradientFlowPrompt[]>(
    STORAGE_KEYS.GRADIENTFLOW_PROMPT_HISTORY,
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancedRandomizing, setIsEnhancedRandomizing] = useState(false);
  const [feedbackRequired, setFeedbackRequired] = useState(false);

  const handleParameterChange = (key: keyof GradientFlowData, value: string) => {
    setPromptData(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeParameter = (key: keyof GradientFlowData) => {
    const optionsMap = {
      color1: colors,
      color2: colors,
      color3: colors,
      backgroundColor: backgroundColors,
      colorSpreadStyle: colorSpreadStyles,
    };

    let randomValue;
    
    // Special handling for colors to ensure they're different from each other
    if (key === 'color1' || key === 'color2' || key === 'color3') {
      const usedColorsInCurrentPrompt = [
        promptData.color1,
        promptData.color2,
        promptData.color3
      ].filter(Boolean);
      
      const usedColorsInHistory = new Set([
        ...promptHistory.map(h => h.color1),
        ...promptHistory.map(h => h.color2),
        ...promptHistory.map(h => h.color3)
      ]);
      
      // Filter out colors already used in current prompt and frequently used in history
      const availableColors = colors.filter(color => 
        !usedColorsInCurrentPrompt.includes(color) && 
        color !== promptData[key]
      );
      
      // Prefer colors not used in recent history
      const preferredColors = availableColors.filter(color => !usedColorsInHistory.has(color));
      const colorsToUse = preferredColors.length > 0 ? preferredColors : availableColors;
      
      randomValue = colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
    } else {
      randomValue = getRandomUnusedOption(
        promptHistory,
        optionsMap[key],
        key,
        promptData[key]
      );
    }

    handleParameterChange(key, randomValue);
  };

  const handleRandomizeAll = async () => {
    setIsEnhancedRandomizing(true);
    try {
      const result = await getGradientFlowRandomization(
        colors,
        backgroundColors,
        colorSpreadStyles,
        promptHistory
      );
      setPromptData(result);
    } finally {
      setIsEnhancedRandomizing(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      // Step 1: AI Smart Randomize
      setIsEnhancedRandomizing(true);
      const randomizedData = await getGradientFlowRandomization(
        colors,
        backgroundColors,
        colorSpreadStyles,
        promptHistory
      );
      setPromptData(randomizedData);
      setIsEnhancedRandomizing(false);
      
      // Step 2: Generate Prompt
      setIsGenerating(true);
      const promptText = gradientFlowPromptTemplate(
        randomizedData.color1,
        randomizedData.color2,
        randomizedData.color3,
        randomizedData.backgroundColor,
        randomizedData.colorSpreadStyle
      );
      
      const newPrompt: GeneratedGradientFlowPrompt = {
        id: uuidv4(),
        ...randomizedData,
        promptText,
        timestamp: Date.now()
      };
      
      // Step 3: Generate Title and Keywords
      const { generateTitleAndKeywords } = await import('../services/gemini');
      const titleAndKeywordsResult = await generateTitleAndKeywords(promptText);
      
      if (titleAndKeywordsResult.error) {
        alert(`Title/Keywords generation failed: ${titleAndKeywordsResult.error}`);
      } else if (titleAndKeywordsResult.data) {
        newPrompt.title = titleAndKeywordsResult.data.title;
        newPrompt.keywords = titleAndKeywordsResult.data.keywords.split(',').map(k => k.trim());
      }
      
      setGeneratedPrompt(newPrompt);
      setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
      
      // Save to database if callback provided
      if (onPromptGenerated) {
        onPromptGenerated('gradientflow', newPrompt);
      }
      
      setFeedbackRequired(true); // Require feedback for next generation
      
    } catch (error) {
      console.error('Auto-generation failed:', error);
    } finally {
      setIsGenerating(false);
      setIsEnhancedRandomizing(false);
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
    
    // Update the current generated prompt if it matches
    if (generatedPrompt && generatedPrompt.id === promptId) {
      setGeneratedPrompt(prev => prev ? { ...prev, userFeedback: feedback } : null);
      setFeedbackRequired(false); // Allow next generation after feedback
    }
  };

  const handlePromptUpdate = (promptId: string, updates: { title?: string; keywords?: string[] }) => {
    setPromptHistory(prev => 
      prev.map(prompt => 
        prompt.id === promptId 
          ? { ...prompt, ...updates }
          : prompt
      )
    );
    
    // Update the current generated prompt if it matches
    if (generatedPrompt && generatedPrompt.id === promptId) {
      setGeneratedPrompt(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">GradientFlow Generator</h2>
          <p className="text-sm text-gray-600">Abstract gradient backgrounds - auto-adds to CSV</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">GradientFlow Formula:</h3>
        <p className="text-sm text-purple-800 font-mono">
          abstract gradient background + [Color 1, 2, 3] + [Background Color] + [Color Spread Style] + grainy texture + blurred effect + film grain + digital noise
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ParameterSelector
            label="Color 1"
            options={colors}
            value={promptData.color1}
            onChange={(value) => handleParameterChange('color1', value)}
            onRandom={() => handleRandomizeParameter('color1')}
          />
          <ParameterSelector
            label="Color 2"
            options={colors}
            value={promptData.color2}
            onChange={(value) => handleParameterChange('color2', value)}
            onRandom={() => handleRandomizeParameter('color2')}
          />
          <ParameterSelector
            label="Color 3"
            options={colors}
            value={promptData.color3}
            onChange={(value) => handleParameterChange('color3', value)}
            onRandom={() => handleRandomizeParameter('color3')}
          />
        </div>
        <div className="space-y-6">
          <ParameterSelector
            label="Background Color"
            options={backgroundColors}
            value={promptData.backgroundColor}
            onChange={(value) => handleParameterChange('backgroundColor', value)}
            onRandom={() => handleRandomizeParameter('backgroundColor')}
          />
          <ParameterSelector
            label="Color Spread Style"
            options={colorSpreadStyles}
            value={promptData.colorSpreadStyle}
            onChange={(value) => handleParameterChange('colorSpreadStyle', value)}
            onRandom={() => handleRandomizeParameter('colorSpreadStyle')}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating || isEnhancedRandomizing || feedbackRequired}
          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
        >
          {isGenerating || isEnhancedRandomizing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>
                {isEnhancedRandomizing ? 'AI Selecting Parameters...' : 
                 isGenerating ? 'Creating Everything...' : 'Processing...'}
              </span>
            </>
          ) : feedbackRequired ? (
            <>
              <Wand2 className="h-6 w-6" />
              <span>👆 Please rate the image above first</span>
            </>
          ) : (
            <>
              <Wand2 className="h-6 w-6" />
              <span>🎯 Auto-Generate Everything!</span>
            </>
          )}
        </button>
      </div>

      {feedbackRequired && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-800">
            <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="font-medium">Feedback Required</span>
          </div>
          <p className="text-purple-700 text-sm mt-1">
            Please rate the generated image above (👍 👎 😐) before generating the next prompt. This helps train the AI to create better prompts for you!
          </p>
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-8">
          <GeneratedGradientFlowPrompt 
            prompt={generatedPrompt} 
            onFeedbackChange={handleFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={handlePromptUpdate}
          />
        </div>
      )}
      
      <GradientFlowHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
        onPromptUpdate={handlePromptUpdate}
      />
    </div>
  );
};

export default GradientFlowGenerator;