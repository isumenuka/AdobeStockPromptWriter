import { GeneratedPrompt, GeneratedAbstractWavePrompt, CustomPrompt } from '../types';

export interface FeedbackAnalysis {
  likedMaterials: string[];
  dislikedMaterials: string[];
  likedPrimaryColors: string[];
  dislikedPrimaryColors: string[];
  likedSecondaryColors: string[];
  dislikedSecondaryColors: string[];
  likedLighting: string[];
  dislikedLighting: string[];
  preferredCombinations: Array<{
    materialType: string;
    primaryColorTone: string;
    secondaryColorTone: string;
    lightingStyle: string;
    score: number;
  }>;
}

export interface AbstractWaveFeedbackAnalysis {
  likedWaveDescriptors: string[];
  dislikedWaveDescriptors: string[];
  likedGradientTypes: string[];
  dislikedGradientTypes: string[];
  likedColorPalettes: string[];
  dislikedColorPalettes: string[];
  likedDepthEffects: string[];
  dislikedDepthEffects: string[];
  likedLighting: string[];
  dislikedLighting: string[];
  likedKeywords: string[];
  dislikedKeywords: string[];
  preferredCombinations: Array<{
    waveDescriptor: string;
    gradientType: string;
    colorPalette1: string;
    colorPalette2: string;
    colorPalette3: string;
    depthEffect: string;
    lightingStyle: string;
    optionalKeywords: string;
    score: number;
  }>;
}

export interface SkyFeedbackAnalysis {
  likedTimeOfDaySkies: string[];
  dislikedTimeOfDaySkies: string[];
  likedCelestialObjects: string[];
  dislikedCelestialObjects: string[];
  likedCloudStyles: string[];
  dislikedCloudStyles: string[];
  likedArtStyles: string[];
  dislikedArtStyles: string[];
  likedColorAndLight: string[];
  dislikedColorAndLight: string[];
  preferredCombinations: Array<{
    timeOfDaySky: string;
    celestialObject: string;
    cloudStyle: string;
    artStyle: string;
    colorAndLight: string;
    score: number;
  }>;
}

/**
 * Analyzes user feedback to understand preferences for texture prompts
 */
export function analyzeTextureFeedback(history: GeneratedPrompt[]): FeedbackAnalysis {
  const liked = history.filter(p => p.userFeedback === 'like');
  const disliked = history.filter(p => p.userFeedback === 'dislike');

  const analysis: FeedbackAnalysis = {
    likedMaterials: getFrequentItems(liked.map(p => p.materialType)),
    dislikedMaterials: getFrequentItems(disliked.map(p => p.materialType)),
    likedPrimaryColors: getFrequentItems(liked.map(p => p.primaryColorTone)),
    dislikedPrimaryColors: getFrequentItems(disliked.map(p => p.primaryColorTone)),
    likedSecondaryColors: getFrequentItems(liked.map(p => p.secondaryColorTone)),
    dislikedSecondaryColors: getFrequentItems(disliked.map(p => p.secondaryColorTone)),
    likedLighting: getFrequentItems(liked.map(p => p.lightingStyle)),
    dislikedLighting: getFrequentItems(disliked.map(p => p.lightingStyle)),
    preferredCombinations: []
  };

  // Analyze successful combinations
  liked.forEach(prompt => {
    analysis.preferredCombinations.push({
      materialType: prompt.materialType,
      primaryColorTone: prompt.primaryColorTone,
      secondaryColorTone: prompt.secondaryColorTone,
      lightingStyle: prompt.lightingStyle,
      score: 1
    });
  });

  return analysis;
}

/**
 * Analyzes user feedback for abstract wave prompts
 */
export function analyzeAbstractWaveFeedback(history: GeneratedAbstractWavePrompt[]): AbstractWaveFeedbackAnalysis {
  const liked = history.filter(p => p.userFeedback === 'like');
  const disliked = history.filter(p => p.userFeedback === 'dislike');

  const analysis: AbstractWaveFeedbackAnalysis = {
    likedWaveDescriptors: getFrequentItems(liked.map(p => p.waveDescriptor)),
    dislikedWaveDescriptors: getFrequentItems(disliked.map(p => p.waveDescriptor)),
    likedGradientTypes: getFrequentItems(liked.map(p => p.gradientType)),
    dislikedGradientTypes: getFrequentItems(disliked.map(p => p.gradientType)),
    likedColorPalettes: getFrequentItems([
      ...liked.map(p => p.colorPalette1),
      ...liked.map(p => p.colorPalette2),
      ...liked.map(p => p.colorPalette3)
    ]),
    dislikedColorPalettes: getFrequentItems([
      ...disliked.map(p => p.colorPalette1),
      ...disliked.map(p => p.colorPalette2),
      ...disliked.map(p => p.colorPalette3)
    ]),
    likedDepthEffects: getFrequentItems(liked.map(p => p.depthEffect)),
    dislikedDepthEffects: getFrequentItems(disliked.map(p => p.depthEffect)),
    likedLighting: getFrequentItems(liked.map(p => p.lightingStyle)),
    dislikedLighting: getFrequentItems(disliked.map(p => p.lightingStyle)),
    likedKeywords: getFrequentItems(liked.map(p => p.optionalKeywords)),
    dislikedKeywords: getFrequentItems(disliked.map(p => p.optionalKeywords)),
    preferredCombinations: []
  };

  // Analyze successful combinations
  liked.forEach(prompt => {
    analysis.preferredCombinations.push({
      waveDescriptor: prompt.waveDescriptor,
      gradientType: prompt.gradientType,
      colorPalette1: prompt.colorPalette1,
      colorPalette2: prompt.colorPalette2,
      colorPalette3: prompt.colorPalette3,
      depthEffect: prompt.depthEffect,
      lightingStyle: prompt.lightingStyle,
      optionalKeywords: prompt.optionalKeywords,
      score: 1
    });
  });

  return analysis;
}

/**
 * Analyzes user feedback for sky prompts
 */
export function analyzeSkyFeedback(history: GeneratedSkyPrompt[]): SkyFeedbackAnalysis {
  const liked = history.filter(p => p.userFeedback === 'like');
  const disliked = history.filter(p => p.userFeedback === 'dislike');

  const analysis: SkyFeedbackAnalysis = {
    likedTimeOfDaySkies: getFrequentItems(liked.map(p => p.timeOfDaySky)),
    dislikedTimeOfDaySkies: getFrequentItems(disliked.map(p => p.timeOfDaySky)),
    likedCelestialObjects: getFrequentItems(liked.map(p => p.celestialObject)),
    dislikedCelestialObjects: getFrequentItems(disliked.map(p => p.celestialObject)),
    likedCloudStyles: getFrequentItems(liked.map(p => p.cloudStyle)),
    dislikedCloudStyles: getFrequentItems(disliked.map(p => p.cloudStyle)),
    likedArtStyles: getFrequentItems(liked.map(p => p.artStyle)),
    dislikedArtStyles: getFrequentItems(disliked.map(p => p.artStyle)),
    likedColorAndLight: getFrequentItems(liked.map(p => p.colorAndLight)),
    dislikedColorAndLight: getFrequentItems(disliked.map(p => p.colorAndLight)),
    preferredCombinations: []
  };

  // Analyze successful combinations
  liked.forEach(prompt => {
    analysis.preferredCombinations.push({
      timeOfDaySky: prompt.timeOfDaySky,
      celestialObject: prompt.celestialObject,
      cloudStyle: prompt.cloudStyle,
      artStyle: prompt.artStyle,
      colorAndLight: prompt.colorAndLight,
      score: 1
    });
  });

  return analysis;
}

/**
 * Gets items that appear frequently in the array
 */
function getFrequentItems(items: string[]): string[] {
  const frequency: { [key: string]: number } = {};
  
  items.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });

  // Return items that appear more than once, sorted by frequency
  return Object.entries(frequency)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .map(([item, _]) => item);
}

/**
 * Calculates preference score for an item based on feedback
 */
export function calculatePreferenceScore(
  item: string,
  likedItems: string[],
  dislikedItems: string[]
): number {
  const likeCount = likedItems.filter(liked => liked === item).length;
  const dislikeCount = dislikedItems.filter(disliked => disliked === item).length;
  
  // Score: +2 for each like, -1 for each dislike
  return (likeCount * 2) - dislikeCount;
}

/**
 * Filters options based on user preferences
 */
export function filterByPreferences<T extends string>(
  options: T[],
  likedItems: string[],
  dislikedItems: string[],
  minScore: number = 0
): T[] {
  return options.filter(option => {
    const score = calculatePreferenceScore(option, likedItems, dislikedItems);
    return score >= minScore;
  });
}