import { PromptData, AbstractWaveData } from '../types';

/**
 * Gets unused options from the history for a specific parameter
 * @param history - Array of previous prompts
 * @param allOptions - All available options for the parameter
 * @param currentValue - Currently selected value (to exclude)
 * @returns Array of unused options
 */
export function getUnusedOptions<T>(
  history: { [key: string]: string }[],
  allOptions: T[],
  parameterKey: keyof PromptData | keyof AbstractWaveData,
  currentValue?: string
): T[] {
  // Get all used values from history
  const usedValues = new Set(history.map(item => item[parameterKey]));
  
  // Add current value to used values if it exists
  if (currentValue) {
    usedValues.add(currentValue);
  }

  // Filter out used options
  const unusedOptions = allOptions.filter(option => !usedValues.has(String(option)));

  // If all options have been used, return all options except the current value
  if (unusedOptions.length === 0) {
    return currentValue 
      ? allOptions.filter(option => option !== currentValue)
      : [...allOptions];
  }

  return unusedOptions;
}

/**
 * Gets a random unused option
 * @param history - Array of previous prompts
 * @param allOptions - All available options
 * @param parameterKey - Key of the parameter to check
 * @param currentValue - Currently selected value
 * @returns Random unused option or random option excluding current if all are used
 */
export function getRandomUnusedOption<T>(
  history: { [key: string]: string }[],
  allOptions: T[],
  parameterKey: keyof PromptData | keyof AbstractWaveData,
  currentValue?: string
): T {
  const unusedOptions = getUnusedOptions(history, allOptions, parameterKey, currentValue);
  return unusedOptions[Math.floor(Math.random() * unusedOptions.length)];
}