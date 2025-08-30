// Base Types
export interface PromptData {
  materialType: string;
  primaryColorTone: string;
  secondaryColorTone: string;
  lightingStyle: string;
}

// AbstractWave Types
export interface AbstractWaveData {
  waveDescriptor: string;
  gradientType: string;
  colorPalette1: string;
  colorPalette2: string;
  colorPalette3: string;
  depthEffect: string;
  lightingStyle: string;
  optionalKeywords: string;
}

// Generated Prompts
export interface GeneratedPrompt extends PromptData {
  id: string;
  promptText: string;
  timestamp: number;
  title?: string;
  keywords?: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

export interface GeneratedAbstractWavePrompt extends AbstractWaveData {
  id: string;
  promptText: string;
  timestamp: number;
  title?: string;
  keywords?: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

// Sky Types
export interface SkyData {
  timeOfDaySky: string;
  celestialObject: string;
  cloudStyle: string;
  artStyle: string;
  colorAndLight: string;
}

// White Frame Types
export interface WhiteFrameData {
  frameNumber: string;
  frameOrientation: string;
  wallColor: string;
  mainFurniturePiece: string;
  additionalFurniturePiece: string;
  lightingDescription: string;
  atmosphereDescription: string;
  aspectRatio: string;
}

export interface GeneratedWhiteFramePrompt extends WhiteFrameData {
  id: string;
  promptText: string;
  timestamp: number;
  title?: string;
  keywords?: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

export interface GeneratedSkyPrompt extends SkyData {
  id: string;
  promptText: string;
  timestamp: number;
  title?: string;
  keywords?: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

// Custom Prompts
export interface CustomPrompt {
  id: string;
  promptText: string;
  timestamp: number;
  title: string;
  keywords: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

// API Responses
export interface TitleAndKeywordsResponse {
  data?: {
    title: string;
    keywords: string;
  };
  error?: string;
}

export interface LegacyTitleAndKeywordsResponse {
  title: string;
  keywords: string;
}

export interface EnhancedRandomizationResponse {
  materialType: string;
  primaryColorTone: string;
  secondaryColorTone: string;
  lightingStyle: string;
}

export interface AbstractWaveRandomizationResponse {
  waveDescriptor: string;
  gradientType: string;
  colorPalette1: string;
  colorPalette2: string;
  colorPalette3: string;
  depthEffect: string;
  lightingStyle: string;
  optionalKeywords: string;
}

export interface WhiteFrameRandomizationResponse {
  frameNumber: string;
  frameOrientation: string;
  wallColor: string;
  mainFurniturePiece: string;
  additionalFurniturePiece: string;
  lightingDescription: string;
  atmosphereDescription: string;
  aspectRatio: string;
}

export interface SkyRandomizationResponse {
  timeOfDaySky: string;
  celestialObject: string;
  cloudStyle: string;
  artStyle: string;
  colorAndLight: string;
}

// GradientFlow Types
export interface GradientFlowData {
  color1: string;
  color2: string;
  color3: string;
  backgroundColor: string;
  colorSpreadStyle: string;
}

export interface GeneratedGradientFlowPrompt extends GradientFlowData {
  id: string;
  promptText: string;
  timestamp: number;
  title?: string;
  keywords?: string[];
  userFeedback?: 'like' | 'dislike' | 'neutral';
  autoSaved?: boolean;
}

export interface GradientFlowRandomizationResponse {
  color1: string;
  color2: string;
  color3: string;
  backgroundColor: string;
  colorSpreadStyle: string;
}

// Component Props
export interface ParameterSelectorProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onRandom: () => void;
}

export interface CustomPromptHistoryProps {
  prompts: CustomPrompt[];
  onClear: () => void;
}

export interface CustomPromptHistoryItemProps {
  prompt: CustomPrompt;
}

export interface GeneratedPromptProps {
  prompt: GeneratedPrompt;
}

export interface GeneratedAbstractWavePromptProps {
  prompt: GeneratedAbstractWavePrompt;
}

export interface GeneratedSkyPromptProps {
  prompt: GeneratedSkyPrompt;
}

export interface PromptHistoryProps {
  prompts: GeneratedPrompt[];
  onClear: () => void;
}

export interface PromptHistoryItemProps {
  prompt: GeneratedPrompt;
}

export interface AbstractWaveHistoryProps {
  prompts: GeneratedAbstractWavePrompt[];
  onClear: () => void;
}

export interface AbstractWaveHistoryItemProps {
  prompt: GeneratedAbstractWavePrompt;
}

export interface SkyHistoryProps {
  prompts: GeneratedSkyPrompt[];
  onClear: () => void;
}

export interface SkyHistoryItemProps {
  prompt: GeneratedSkyPrompt;
}

// CSV Export Types
export interface CSVRow {
  id: string;
  filename: string;
  title: string;
  keywords: string;
  category: string;
  releases: string;
  imageUrl?: string;
}