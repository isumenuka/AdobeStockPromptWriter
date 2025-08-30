import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Wand2, Loader2, Frame, Sparkles } from 'lucide-react';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../config/constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getWhiteFrameRandomization } from '../services/gemini';
import { 
  frameNumbers,
  frameOrientations,
  wallColors,
  mainFurniturePieces,
  additionalFurniturePieces,
  lightingDescriptions,
  atmosphereDescriptions,
  aspectRatios
} from '../data/whiteFrameData';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicatePrompt } from '../utils/duplicateChecker';
import type { WhiteFrameData, GeneratedWhiteFramePrompt, CSVRow } from '../types';
import ParameterSelector from './ParameterSelector';
import GeneratedWhiteFramePrompt from './GeneratedWhiteFramePrompt';
import WhiteFrameHistory from './WhiteFrameHistory';

interface WhiteFrameGeneratorProps {
  onAddCsvEntry: (entry: Omit<CSVRow, 'id'>) => void;
  onPromptGenerated?: (promptType: 'whiteframe', promptData: GeneratedWhiteFramePrompt) => void;
}

const WhiteFrameGenerator: React.FC<WhiteFrameGeneratorProps> = ({ onAddCsvEntry, onPromptGenerated }) => {
  const [promptData, setPromptData] = useState<WhiteFrameData>({
    frameNumber: '',
    frameOrientation: '',
    wallColor: '',
    mainFurniturePiece: '',
    additionalFurniturePiece: '',
    lightingDescription: '',
    atmosphereDescription: '',
    aspectRatio: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedWhiteFramePrompt | null>(null);
  const [promptHistory, setPromptHistory] = useLocalStorage<GeneratedWhiteFramePrompt[]>(
    STORAGE_KEYS.WHITEFRAME_PROMPT_HISTORY,
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancedRandomizing, setIsEnhancedRandomizing] = useState(false);
  const [feedbackRequired, setFeedbackRequired] = useState(false);

  const handleParameterChange = (key: keyof WhiteFrameData, value: string) => {
    setPromptData(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeParameter = (key: keyof WhiteFrameData) => {
    const optionsMap = {
      frameNumber: frameNumbers,
      frameOrientation: frameOrientations,
      wallColor: wallColors,
      mainFurniturePiece: mainFurniturePieces,
      additionalFurniturePiece: additionalFurniturePieces,
      lightingDescription: lightingDescriptions,
      atmosphereDescription: atmosphereDescriptions,
      aspectRatio: aspectRatios,
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
      const result = await getWhiteFrameRandomization(
        frameNumbers,
        frameOrientations,
        wallColors,
        mainFurniturePieces,
        additionalFurniturePieces,
        lightingDescriptions,
        atmosphereDescriptions,
        aspectRatios,
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
      const randomizedData = await getWhiteFrameRandomization(
        frameNumbers,
        frameOrientations,
        wallColors,
        mainFurniturePieces,
        additionalFurniturePieces,
        lightingDescriptions,
        atmosphereDescriptions,
        aspectRatios,
        promptHistory
      );
      setPromptData(randomizedData);
      setIsEnhancedRandomizing(false);
      
      // Step 2: Generate Prompt
      setIsGenerating(true);
      const promptText = `photorealistic interior mockup, focus on ${randomizedData.frameNumber} prominent empty white ${randomizedData.frameOrientation} photo frame(s) on a ${randomizedData.wallColor} wall, with ${randomizedData.mainFurniturePiece}, ${randomizedData.additionalFurniturePiece}, and ${randomizedData.lightingDescription}. The overall atmosphere is ${randomizedData.atmosphereDescription}. --ar ${randomizedData.aspectRatio} --no clutter, messy, scattered items, small decor, knick-knacks, trinkets, remote controls, pens, stationery, mugs, personal items, text, words, logos, branding, people, pets, distracting patterns, vibrant colors`;
      
      const newPrompt: GeneratedWhiteFramePrompt = {
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
        onPromptGenerated('whiteframe', newPrompt);
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg shadow-lg">
          <Frame className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">White Frame Generator</h2>
          <p className="text-sm text-gray-600">Interior mockup frames - auto-adds to CSV</p>
        </div>
      </div>

      {/* Formula Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">White Frame Formula:</h3>
        <p className="text-sm text-gray-800 font-mono">
          photorealistic interior mockup + [Number] [Frame_Orientation] frame(s) + [Wall_Color] wall + [Main_Furniture] + [Additional_Furniture] + [Lighting] + [Atmosphere] --ar [Aspect_Ratio]
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ParameterSelector
            label="Frame Number"
            options={frameNumbers}
            value={promptData.frameNumber}
            onChange={(value) => handleParameterChange('frameNumber', value)}
            onRandom={() => handleRandomizeParameter('frameNumber')}
          />
          <ParameterSelector
            label="Frame Orientation"
            options={frameOrientations}
            value={promptData.frameOrientation}
            onChange={(value) => handleParameterChange('frameOrientation', value)}
            onRandom={() => handleRandomizeParameter('frameOrientation')}
          />
          <ParameterSelector
            label="Wall Color"
            options={wallColors}
            value={promptData.wallColor}
            onChange={(value) => handleParameterChange('wallColor', value)}
            onRandom={() => handleRandomizeParameter('wallColor')}
          />
          <ParameterSelector
            label="Main Furniture Piece"
            options={mainFurniturePieces}
            value={promptData.mainFurniturePiece}
            onChange={(value) => handleParameterChange('mainFurniturePiece', value)}
            onRandom={() => handleRandomizeParameter('mainFurniturePiece')}
          />
        </div>
        <div className="space-y-6">
          <ParameterSelector
            label="Additional Furniture Piece"
            options={additionalFurniturePieces}
            value={promptData.additionalFurniturePiece}
            onChange={(value) => handleParameterChange('additionalFurniturePiece', value)}
            onRandom={() => handleRandomizeParameter('additionalFurniturePiece')}
          />
          <ParameterSelector
            label="Lighting Description"
            options={lightingDescriptions}
            value={promptData.lightingDescription}
            onChange={(value) => handleParameterChange('lightingDescription', value)}
            onRandom={() => handleRandomizeParameter('lightingDescription')}
          />
          <ParameterSelector
            label="Atmosphere Description"
            options={atmosphereDescriptions}
            value={promptData.atmosphereDescription}
            onChange={(value) => handleParameterChange('atmosphereDescription', value)}
            onRandom={() => handleRandomizeParameter('atmosphereDescription')}
          />
          <ParameterSelector
            label="Aspect Ratio"
            options={aspectRatios}
            value={promptData.aspectRatio}
            onChange={(value) => handleParameterChange('aspectRatio', value)}
            onRandom={() => handleRandomizeParameter('aspectRatio')}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAutoGenerate}
          disabled={isGenerating || isEnhancedRandomizing || feedbackRequired}
          className="w-full px-8 py-4 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-lg hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
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
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-800">
            <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="font-medium">Feedback Required</span>
          </div>
          <p className="text-gray-700 text-sm mt-1">
            Please rate the generated image above (👍 👎 😐) before generating the next prompt. This helps train the AI to create better prompts for you!
          </p>
        </div>
      )}

      {generatedPrompt && (
        <div className="mt-8">
          <GeneratedWhiteFramePrompt 
            prompt={generatedPrompt} 
            onFeedbackChange={handleFeedbackChange}
            onAddCsvEntry={onAddCsvEntry}
            onPromptUpdate={handlePromptUpdate}
          />
        </div>
      )}
      
      <WhiteFrameHistory 
        prompts={promptHistory} 
        onClear={clearHistory}
        onFeedbackChange={handleFeedbackChange}
        onAddCsvEntry={onAddCsvEntry}
        onPromptUpdate={handlePromptUpdate}
      />
    </div>
  );
};

export default WhiteFrameGenerator;