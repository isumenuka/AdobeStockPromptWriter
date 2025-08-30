import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Wand2, Loader2, Cloud, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getSkyRandomization } from '../services/gemini';
import { 
  timeOfDaySkies, 
  celestialObjects, 
  cloudStyles, 
  artStyles, 
  colorAndLight 
} from '../data/skyData';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicatePrompt, isDuplicateSkyParams } from '../utils/duplicateChecker';
import type { SkyData, GeneratedSkyPrompt, CSVRow } from '../types';
import ParameterSelector from './ParameterSelector';
import GeneratedSkyPrompt from './GeneratedSkyPrompt';
import SkyHistory from './SkyHistory';

interface SkyGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptGenerated?: (promptType: 'sky', promptData: GeneratedSkyPrompt) => void;
}

const SkyGenerator: React.FC<SkyGeneratorProps> = ({ onAddCsvEntry, onPromptGenerated }) => {
  const [promptData, setPromptData] = useState<SkyData>({
    timeOfDaySky: '',
    celestialObject: '',
    cloudStyle: '',
    artStyle: 'Dreamy Anime Background Art Style',
    colorAndLight: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedSkyPrompt | null>(null);
  const [promptHistory, setPromptHistory] = useLocalStorage<GeneratedSkyPrompt[]>(
    STORAGE_KEYS.SKY_PROMPT_HISTORY,
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancedRandomizing, setIsEnhancedRandomizing] = useState(false);
  const [feedbackRequired, setFeedbackRequired] = useState(false);

  const handleParameterChange = (key: keyof SkyData, value: string) => {
    setPromptData(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeParameter = (key: keyof SkyData) => {
    const optionsMap = {
      timeOfDaySky: timeOfDaySkies,
      celestialObject: celestialObjects,
      cloudStyle: cloudStyles,
      artStyle: artStyles,
      colorAndLight: colorAndLight,
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
      const result = await getSkyRandomization(
        timeOfDaySkies,
        celestialObjects,
        cloudStyles,
        colorAndLight,
        promptHistory
      );
      setPromptData(result);
    } finally {
      setIsEnhancedRandomizing(false);
    }
  };

  const generatePrompt = async () => {
    const { 
      timeOfDaySky, 
      celestialObject, 
      cloudStyle, 
      artStyle, 
      colorAndLight: colorLight 
    } = promptData;
    
    if (!timeOfDaySky || !celestialObject || !cloudStyle || !artStyle || !colorLight) {
      return;
    }

    // Check if this exact parameter combination already exists
    if (isDuplicateSkyParams(
      timeOfDaySky, celestialObject, cloudStyle, artStyle, colorLight, promptHistory
    )) {
      alert('This exact combination has already been generated. Please modify your selection or use AI Randomize to get a unique combination.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const promptText = `${timeOfDaySky} ${celestialObject} ${cloudStyle}, ${artStyle}, ${colorLight}, ultra detailed, 4K quality, perfect for backgrounds and design applications, cinematic composition, professional sky illustration`;
      
      // Double-check for duplicate prompt text
      if (isDuplicatePrompt(promptText, promptHistory)) {
        alert('This prompt has already been generated. Please try different parameters.');
        return;
      }
      
      const newPrompt: GeneratedSkyPrompt = {
        id: uuidv4(),
        ...promptData,
        promptText,
        timestamp: Date.now()
      };
      
      setGeneratedPrompt(newPrompt);
      setPromptHistory(prev => [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS));
      
      // Save to database if callback provided
      if (onPromptGenerated) {
        onPromptGenerated('sky', newPrompt);
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
      const randomizedData = await getSkyRandomization(
        timeOfDaySkies,
        celestialObjects,
        cloudStyles,
        colorAndLight,
        promptHistory
      );
      setPromptData(randomizedData);
      setIsEnhancedRandomizing(false);
      
      // Step 2: Generate Prompt
      setIsGenerating(true);
      const promptText = `${randomizedData.timeOfDaySky} ${randomizedData.celestialObject} ${randomizedData.cloudStyle}, Dreamy Anime Background Art Style, ${randomizedData.colorAndLight}, ultra detailed, 4K quality, perfect for backgrounds and design applications, cinematic composition, professional sky illustration`;
      
      const newPrompt: GeneratedSkyPrompt = {
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
        onPromptGenerated('sky', newPrompt);
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
        <div className="p-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-lg shadow-lg">
          <Cloud className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sky Generator</h2>
          <p className="text-sm text-gray-600">Beautiful atmospheric skies - auto-adds to CSV</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-lg border border-sky-200">
        <h3 className="font-semibold text-sky-900 mb-2">Sky Formula:</h3>
        <p className="text-sm text-sky-800 font-mono">
          [Time of Day/Sky Type] + [Celestial Objects] + with [Cloud Style] + [Art Style] + [Color and Light]
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ParameterSelector
            label="Time of Day / Sky Type"
            options={timeOfDaySkies}
            value={promptData.timeOfDaySky}
            onChange={(value) => handleParameterChange('timeOfDaySky', value)}
            onRandom={() => handleRandomizeParameter('timeOfDaySky')}
          />
          <ParameterSelector
            label="Celestial Objects"
            options={celestialObjects}
            value={promptData.celestialObject}
            onChange={(value) => handleParameterChange('celestialObject', value)}
            onRandom={() => handleRandomizeParameter('celestialObject')}
          />
          <ParameterSelector
            label="Cloud Style"
            options={cloudStyles}
            value={promptData.cloudStyle}
            onChange={(value) => handleParameterChange('cloudStyle', value)}
            onRandom={() => handleRandomizeParameter('cloudStyle')}
          />
        </div>
        <div className="space-y-6">
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2">Art Style</label>
            <div className="flex items-center justify-between w-full p-4 border-2 rounded-lg bg-green-50 border-green-300">
              <span className="text-gray-900 font-medium">Dreamy Anime Background Art Style</span>
              <div className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                FIXED
              </div>
            </div>
          </div>
          <ParameterSelector
            label="Color and Light"
            options={colorAndLight}
            value={promptData.colorAndLight}
            onChange={(value) => handleParameterChange('colorAndLight', value)}
            onRandom={() => handleRandomizeParameter('colorAndLight')}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating || isEnhancedRandomizing || feedbackRequired}
          className="w-full px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-lg hover:from-sky-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
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
        <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <div className="flex items-center gap-2 text-sky-800">
            <div className="w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="font-medium">Feedback Required</span>
          </div>
          <p className="text-sky-700 text-sm mt-1">
            Please rate the generated image above (👍 👎 😐) before generating the next prompt. This helps train the AI to create better prompts for you!
          </p>
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-8">
          <GeneratedSkyPrompt 
            prompt={generatedPrompt} 
            onFeedbackChange={handleFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={handlePromptUpdate}
          />
        </div>
      )}
      
      <SkyHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
        onPromptUpdate={handlePromptUpdate}
      />
    </div>
  );
};

export default SkyGenerator;