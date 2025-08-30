import { GeneratedPrompt, GeneratedAbstractWavePrompt, CustomPrompt } from '../types';

/**
 * Generates a unique hash for a prompt based on its content
 */
export function generatePromptHash(promptText: string): string {
  // Simple hash function for prompt text
  let hash = 0;
  for (let i = 0; i < promptText.length; i++) {
    const char = promptText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Checks if a prompt already exists in history
 */
export function isDuplicatePrompt(
  promptText: string,
  history: (GeneratedPrompt | GeneratedAbstractWavePrompt | CustomPrompt)[]
): boolean {
  const normalizedPrompt = promptText.toLowerCase().trim();
  return history.some(item => 
    item.promptText.toLowerCase().trim() === normalizedPrompt
  );
}

/**
 * Checks if texture parameters combination already exists
 */
export function isDuplicateTextureParams(
  materialType: string,
  primaryColorTone: string,
  secondaryColorTone: string,
  lightingStyle: string,
  history: GeneratedPrompt[]
): boolean {
  return history.some(item => 
    item.materialType === materialType &&
    item.primaryColorTone === primaryColorTone &&
    item.secondaryColorTone === secondaryColorTone &&
    item.lightingStyle === lightingStyle
  );
}

/**
 * Checks if abstract wave parameters combination already exists
 */
export function isDuplicateAbstractWaveParams(
  waveDescriptor: string,
  gradientType: string,
  colorPalette1: string,
  colorPalette2: string,
  colorPalette3: string,
  depthEffect: string,
  lightingStyle: string,
  optionalKeywords: string,
  history: GeneratedAbstractWavePrompt[]
): boolean {
  return history.some(item => 
    item.waveDescriptor === waveDescriptor &&
    item.gradientType === gradientType &&
    item.colorPalette1 === colorPalette1 &&
    item.colorPalette2 === colorPalette2 &&
    item.colorPalette3 === colorPalette3 &&
    item.depthEffect === depthEffect &&
    item.lightingStyle === lightingStyle &&
    item.optionalKeywords === optionalKeywords
  );
}

/**
 * Checks if sky parameters combination already exists
 */
export function isDuplicateSkyParams(
  timeOfDaySky: string,
  celestialObject: string,
  cloudStyle: string,
  colorAndLight: string,
  history: GeneratedSkyPrompt[]
): boolean {
  return history.some(item => 
    item.timeOfDaySky === timeOfDaySky &&
    item.celestialObject === celestialObject &&
    item.cloudStyle === cloudStyle &&
    item.colorAndLight === colorAndLight
  );
}

/**
 * Gets available combinations that haven't been used yet
 */
export function getAvailableCombinations<T>(
  allOptions: T[],
  usedOptions: T[],
  currentValue?: T
): T[] {
  const available = allOptions.filter(option => 
    !usedOptions.includes(option) && option !== currentValue
  );
  
  // If no unused options, return all except current
  if (available.length === 0) {
    return currentValue 
      ? allOptions.filter(option => option !== currentValue)
      : allOptions;
  }
  
  return available;
}