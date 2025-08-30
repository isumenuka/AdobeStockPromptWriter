import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getEnhancedRandomization } from '../services/gemini';
import { materials } from '../data/materials';
import { primaryColorTones, secondaryColorTones } from '../data/colorTones';
import { lightingStyles } from '../data/lightingStyles';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicatePrompt, isDuplicateTextureParams } from '../utils/duplicateChecker';
import type { PromptData, GeneratedPrompt, CSVRow } from '../types';
import ParameterSelector from './ParameterSelector';
import GeneratedPrompt from './GeneratedPrompt';
import PromptHistory from './PromptHistory';

interface PromptGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptGenerated?: (promptType: 'texture', promptData: GeneratedPrompt) => void;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onAddCsvEntry, onPromptGenerated }) => {
  const [promptData, setPromptData] = useState<PromptData>({
    materialType: '',
    primaryColorTone: '',
    secondaryColorTone: '',
    lightingStyle: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [promptHistory, setPromptHistory] = useLocalStorage<GeneratedPrompt[]>(
    STORAGE_KEYS.GENERATED_PROMPT_HISTORY,
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancedRandomizing, setIsEnhancedRandomizing] = useState(false);
  const [feedbackRequired, setFeedbackRequired] = useState(false);

  const handleParameterChange = (key: keyof PromptData, value: string) => {
    setPromptData(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeParameter = (key: keyof PromptData) => {
    const optionsMap = {
      materialType: materials,
      primaryColorTone: primaryColorTones,
      secondaryColorTone: secondaryColorTones,
      lightingStyle: lightingStyles,
    };

    const randomValue = getRandomUnusedOption(
      promptHistory,
      optionsMap[key],
      key,
      promptData[key]
    );

    handleParameterChange(key, randomValue);
  };

  const handleRandomizeAll = async () => {
    setIsEnhancedRandomizing(true);
    try {
      const result = await getEnhancedRandomization(
        materials,
        primaryColorTones,
        secondaryColorTones,
        lightingStyles,
        promptHistory
      );
      setPromptData(result);
    } finally {
      setIsEnhancedRandomizing(false);
    }
  };

  const generatePrompt = async () => {
    const { materialType, primaryColorTone, secondaryColorTone, lightingStyle } = promptData;
    
    if (!materialType || !primaryColorTone || !secondaryColorTone || !lightingStyle) {
      return;
    }

    // Check if this exact parameter combination already exists
    if (isDuplicateTextureParams(materialType, primaryColorTone, secondaryColorTone, lightingStyle, promptHistory)) {
      alert('This exact combination has already been generated. Please modify your selection or use AI Randomize to get a unique combination.');
      return;
    }
    setIsGenerating(true);
    
    try {
      const promptText = `Professional ${materialType} texture, seamless and high resolution, top view perspective, ${primaryColorTone} primary tones with ${secondaryColorTone} accents, realistic surface detail with natural patterns, intricate texture mapping, ${lightingStyle}, ultra detailed, 4K quality, perfect for design applications, texture background, photorealistic rendering`;
      
      // Double-check for duplicate prompt text
      if (isDuplicatePrompt(promptText, promptHistory)) {
        alert('This prompt has already been generated. Please try different parameters.');
        return;
      }
      
      const newPrompt: GeneratedPrompt = {
        id: uuidv4(),
        ...promptData,
        promptText,
        timestamp: Date.now()
      };
      
      setGeneratedPrompt(newPrompt);
      setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
      
      // Save to database if callback provided
      if (onPromptGenerated) {
        onPromptGenerated('texture', newPrompt);
      }
      
      setFeedbackRequired(true); // Require feedback for next generation
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      // Step 1: AI Smart Randomize
      setIsEnhancedRandomizing(true);
      const randomizedData = await getEnhancedRandomization(
        materials,
        primaryColorTones,
        secondaryColorTones,
        lightingStyles,
        promptHistory
      );
      setPromptData(randomizedData);
      setIsEnhancedRandomizing(false);
      
      // Step 2: Generate Prompt
      setIsGenerating(true);
      const promptText = `Professional ${randomizedData.materialType} texture, seamless and high resolution, top view perspective, ${randomizedData.primaryColorTone} primary tones with ${randomizedData.secondaryColorTone} accents, realistic surface detail with natural patterns, intricate texture mapping, ${randomizedData.lightingStyle}, ultra detailed, 4K quality, perfect for design applications, texture background, photorealistic rendering`;
      
      const newPrompt: GeneratedPrompt = {
        id: uuidv4(),
        ...randomizedData,
        promptText,
        timestamp: Date.now()
      };
      
      // Step 3: Generate Title and Keywords
      const { generateTitleAndKeywords } = await import('../services/gemini');
      const titleAndKeywords = await generateTitleAndKeywords(promptText);
      
      if (titleAndKeywords && titleAndKeywords.data) {
        newPrompt.title = titleAndKeywords.data.title;
        newPrompt.keywords = titleAndKeywords.data.keywords.split(',').map(k => k.trim());
      }
      
      setGeneratedPrompt(newPrompt);
      setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
      
      // Save to database if callback provided
      if (onPromptGenerated) {
        onPromptGenerated('texture', newPrompt);
      }
      
      setFeedbackRequired(true); // Require feedback for next generation
      
    } catch (error) {
      console.error('Auto-generation failed:', error);
      alert('Failed to auto-generate. Please try again.');
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

  const isFormComplete = Object.values(promptData).every(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Texture Generator</h2>
          <p className="text-sm text-gray-600">Professional texture prompts - auto-adds to CSV</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">Texture Formula:</h3>
        <p className="text-sm text-amber-800 font-mono">
          Professional [Material Type] texture + [Primary Color] tones + [Secondary Color] accents + [Lighting Style]
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ParameterSelector
            label="Material Type"
            options={materials}
            value={promptData.materialType}
            onChange={(value) => handleParameterChange('materialType', value)}
            onRandom={() => handleRandomizeParameter('materialType')}
          />
          <ParameterSelector
            label="Primary Color"
            options={primaryColorTones}
            value={promptData.primaryColorTone}
            onChange={(value) => handleParameterChange('primaryColorTone', value)}
            onRandom={() => handleRandomizeParameter('primaryColorTone')}
          />
        </div>
        <div className="space-y-6">
          <ParameterSelector
            label="Secondary Color"
            options={secondaryColorTones}
            value={promptData.secondaryColorTone}
            onChange={(value) => handleParameterChange('secondaryColorTone', value)}
            onRandom={() => handleRandomizeParameter('secondaryColorTone')}
          />
          <ParameterSelector
            label="Lighting Style"
            options={lightingStyles}
            value={promptData.lightingStyle}
            onChange={(value) => handleParameterChange('lightingStyle', value)}
            onRandom={() => handleRandomizeParameter('lightingStyle')}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating || isEnhancedRandomizing || feedbackRequired}
          className="w-full px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
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
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="font-medium">Feedback Required</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Please rate the generated image above (👍 👎 😐) before generating the next prompt. This helps train the AI to create better prompts for you!
          </p>
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-8">
          <GeneratedPrompt 
            prompt={generatedPrompt} 
            onFeedbackChange={handleFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={handlePromptUpdate}
          />
        </div>
      )}
      
      <PromptHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
        onPromptUpdate={handlePromptUpdate}
      />
    </div>
  );
};

export default PromptGenerator;