import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Wand2, Loader2, Waves, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getAbstractWaveRandomization } from '../services/gemini';
import { 
  colorPalettes, 
  abstractLightingStyles, 
  optionalKeywords, 
  waveDescriptors, 
  depthEffects, 
  gradientTypes 
} from '../data/abstractWaveData';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicatePrompt, isDuplicateAbstractWaveParams } from '../utils/duplicateChecker';
import type { AbstractWaveData, GeneratedAbstractWavePrompt, CSVRow } from '../types';
import ParameterSelector from './ParameterSelector';
import GeneratedAbstractWavePrompt from './GeneratedAbstractWavePrompt';
import AbstractWaveHistory from './AbstractWaveHistory';

interface AbstractWaveGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptGenerated?: (promptType: 'abstractwave', promptData: GeneratedAbstractWavePrompt) => void;
}

const AbstractWaveGenerator: React.FC<AbstractWaveGeneratorProps> = ({ onAddCsvEntry, onPromptGenerated }) => {
  const [promptData, setPromptData] = useState<AbstractWaveData>({
    waveDescriptor: '',
    gradientType: '',
    colorPalette1: '',
    colorPalette2: '',
    colorPalette3: '',
    depthEffect: '',
    lightingStyle: '',
    optionalKeywords: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedAbstractWavePrompt | null>(null);
  const [promptHistory, setPromptHistory] = useLocalStorage<GeneratedAbstractWavePrompt[]>(
    STORAGE_KEYS.ABSTRACTWAVE_PROMPT_HISTORY,
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancedRandomizing, setIsEnhancedRandomizing] = useState(false);
  const [feedbackRequired, setFeedbackRequired] = useState(false);

  const handleParameterChange = (key: keyof AbstractWaveData, value: string) => {
    setPromptData(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeParameter = (key: keyof AbstractWaveData) => {
    const optionsMap = {
      waveDescriptor: waveDescriptors,
      gradientType: gradientTypes,
      colorPalette1: colorPalettes,
      colorPalette2: colorPalettes,
      colorPalette3: colorPalettes,
      depthEffect: depthEffects,
      lightingStyle: abstractLightingStyles,
      optionalKeywords: optionalKeywords,
    };

    let randomValue;
    
    // Special handling for color palettes to ensure they're different from each other
    if (key === 'colorPalette1' || key === 'colorPalette2' || key === 'colorPalette3') {
      const usedColorsInCurrentPrompt = [
        promptData.colorPalette1,
        promptData.colorPalette2,
        promptData.colorPalette3
      ].filter(Boolean);
      
      const usedColorsInHistory = new Set([
        ...promptHistory.map(h => h.colorPalette1),
        ...promptHistory.map(h => h.colorPalette2),
        ...promptHistory.map(h => h.colorPalette3)
      ]);
      
      // Filter out colors already used in current prompt and frequently used in history
      const availableColors = colorPalettes.filter(color => 
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
      const result = await getAbstractWaveRandomization(
        waveDescriptors,
        gradientTypes,
        colorPalettes,
        depthEffects,
        abstractLightingStyles,
        optionalKeywords,
        promptHistory
      );
      setPromptData(result);
    } finally {
      setIsEnhancedRandomizing(false);
    }
  };

  const generatePrompt = async () => {
    const { 
      waveDescriptor, 
      gradientType, 
      colorPalette1, 
      colorPalette2, 
      colorPalette3, 
      depthEffect, 
      lightingStyle, 
      optionalKeywords: keywords 
    } = promptData;
    
    if (!waveDescriptor || !gradientType || !colorPalette1 || !colorPalette2 || 
        !colorPalette3 || !depthEffect || !lightingStyle || !keywords) {
      return;
    }

    // Check if this exact parameter combination already exists
    if (isDuplicateAbstractWaveParams(
      waveDescriptor, gradientType, colorPalette1, colorPalette2, colorPalette3, 
      depthEffect, lightingStyle, keywords, promptHistory
    )) {
      alert('This exact combination has already been generated. Please modify your selection or use AI Randomize to get a unique combination.');
      return;
    }
    setIsGenerating(true);
    
    try {
      const promptText = `Professional abstract ${waveDescriptor} wavy layers with ${gradientType} featuring harmonious blend of ${colorPalette1}, ${colorPalette2}, and ${colorPalette3} color palettes, ${depthEffect} for dimensional depth, enhanced with ${lightingStyle}, ${keywords}, ultra smooth transitions, 4K quality, modern digital art style, perfect for backgrounds and design applications`;
      
      // Double-check for duplicate prompt text
      if (isDuplicatePrompt(promptText, promptHistory)) {
        alert('This prompt has already been generated. Please try different parameters.');
        return;
      }
      
      const newPrompt: GeneratedAbstractWavePrompt = {
        id: uuidv4(),
        ...promptData,
        promptText,
        timestamp: Date.now()
      };
      
      setGeneratedPrompt(newPrompt);
      setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
      
      // Save to database if callback provided
      if (onPromptGenerated) {
        onPromptGenerated('abstractwave', newPrompt);
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
      const randomizedData = await getAbstractWaveRandomization(
        waveDescriptors,
        gradientTypes,
        colorPalettes,
        depthEffects,
        abstractLightingStyles,
        optionalKeywords,
        promptHistory
      );
      setPromptData(randomizedData);
      setIsEnhancedRandomizing(false);
      
      // Step 2: Generate Prompt
      setIsGenerating(true);
      const promptText = `Professional abstract ${randomizedData.waveDescriptor} wavy layers with ${randomizedData.gradientType} featuring harmonious blend of ${randomizedData.colorPalette1}, ${randomizedData.colorPalette2}, and ${randomizedData.colorPalette3} color palettes, ${randomizedData.depthEffect} for dimensional depth, enhanced with ${randomizedData.lightingStyle}, ${randomizedData.optionalKeywords}, ultra smooth transitions, 4K quality, modern digital art style, perfect for backgrounds and design applications`;
      
      const newPrompt: GeneratedAbstractWavePrompt = {
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
        onPromptGenerated('abstractwave', newPrompt);
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
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
          <Waves className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AbstractWave Generator</h2>
          <p className="text-sm text-gray-600">Abstract wavy layers - auto-adds to CSV</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">AbstractWave Formula:</h3>
        <p className="text-sm text-blue-800 font-mono">
          [Wave Descriptor] wavy layers + [Gradient Type] + [Color Palette 1, 2, 3] + [Depth Effect] + [Lighting Style] + [Keywords]
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ParameterSelector
            label="Wave Descriptor"
            options={waveDescriptors}
            value={promptData.waveDescriptor}
            onChange={(value) => handleParameterChange('waveDescriptor', value)}
            onRandom={() => handleRandomizeParameter('waveDescriptor')}
          />
          <ParameterSelector
            label="Gradient Type"
            options={gradientTypes}
            value={promptData.gradientType}
            onChange={(value) => handleParameterChange('gradientType', value)}
            onRandom={() => handleRandomizeParameter('gradientType')}
          />
          <ParameterSelector
            label="Color Palette 1"
            options={colorPalettes}
            value={promptData.colorPalette1}
            onChange={(value) => handleParameterChange('colorPalette1', value)}
            onRandom={() => handleRandomizeParameter('colorPalette1')}
          />
          <ParameterSelector
            label="Color Palette 2"
            options={colorPalettes}
            value={promptData.colorPalette2}
            onChange={(value) => handleParameterChange('colorPalette2', value)}
            onRandom={() => handleRandomizeParameter('colorPalette2')}
          />
        </div>
        <div className="space-y-6">
          <ParameterSelector
            label="Color Palette 3"
            options={colorPalettes}
            value={promptData.colorPalette3}
            onChange={(value) => handleParameterChange('colorPalette3', value)}
            onRandom={() => handleRandomizeParameter('colorPalette3')}
          />
          <ParameterSelector
            label="Depth Effect"
            options={depthEffects}
            value={promptData.depthEffect}
            onChange={(value) => handleParameterChange('depthEffect', value)}
            onRandom={() => handleRandomizeParameter('depthEffect')}
          />
          <ParameterSelector
            label="Lighting Style"
            options={abstractLightingStyles}
            value={promptData.lightingStyle}
            onChange={(value) => handleParameterChange('lightingStyle', value)}
            onRandom={() => handleRandomizeParameter('lightingStyle')}
          />
          <ParameterSelector
            label="Optional Keywords"
            options={optionalKeywords}
            value={promptData.optionalKeywords}
            onChange={(value) => handleParameterChange('optionalKeywords', value)}
            onRandom={() => handleRandomizeParameter('optionalKeywords')}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating || isEnhancedRandomizing || feedbackRequired}
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
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
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="font-medium">Feedback Required</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Please rate the generated image above (👍 👎 😐) before generating the next prompt. This helps train the AI to create better prompts for you!
          </p>
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-8">
          <GeneratedAbstractWavePrompt 
            prompt={generatedPrompt} 
            onFeedbackChange={handleFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={handlePromptUpdate}
          />
        </div>
      )}
      
      <AbstractWaveHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
        onPromptUpdate={handlePromptUpdate}
      />
    </div>
  );
};

export default AbstractWaveGenerator;