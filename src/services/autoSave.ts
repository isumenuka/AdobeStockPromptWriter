import { saveCSVProject } from './csvProjects';
import { saveTexturePrompt, saveAbstractWavePrompt, saveSkyPrompt, saveWhiteFramePrompt, saveCustomPrompt } from './generatorPrompts';
import type { CSVRow, GeneratedPrompt, GeneratedAbstractWavePrompt, GeneratedSkyPrompt, GeneratedWhiteFramePrompt, CustomPrompt } from '../types';

export interface AutoSaveState {
  csvData: CSVRow[];
  texturePrompts: GeneratedPrompt[];
  abstractWavePrompts: GeneratedAbstractWavePrompt[];
  skyPrompts: GeneratedSkyPrompt[];
  whiteFramePrompts: GeneratedWhiteFramePrompt[];
  customPrompts: CustomPrompt[];
  currentProjectId?: string;
}

/**
 * Auto-save CSV project to cloud
 */
export async function autoSaveCSVProject(
  csvData: CSVRow[],
  currentProjectId?: string
): Promise<{ success: boolean; error?: string; projectId?: string }> {
  if (csvData.length === 0) {
    return { success: true }; // Nothing to save
  }

  try {
    const projectName = currentProjectId 
      ? `Auto-saved Project ${new Date().toLocaleDateString()}`
      : `Auto-saved Project ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    const result = await saveCSVProject(
      projectName,
      csvData,
      'Auto-saved project',
      currentProjectId
    );

    return result;
  } catch (error) {
    console.error('Auto-save CSV project failed:', error);
    return { success: false, error: 'Auto-save failed' };
  }
}

/**
 * Auto-save individual prompts to their respective tables
 */
export async function autoSavePrompts(state: AutoSaveState): Promise<{ success: boolean; error?: string }> {
  try {
    const savePromises: Promise<any>[] = [];

    // Save texture prompts
    state.texturePrompts.forEach(prompt => {
      if (!prompt.autoSaved) {
        savePromises.push(saveTexturePrompt(prompt));
      }
    });

    // Save abstract wave prompts
    state.abstractWavePrompts.forEach(prompt => {
      if (!prompt.autoSaved) {
        savePromises.push(saveAbstractWavePrompt(prompt));
      }
    });

    // Save sky prompts
    state.skyPrompts.forEach(prompt => {
      if (!prompt.autoSaved) {
        savePromises.push(saveSkyPrompt(prompt));
      }
    });

    // Save white frame prompts
    state.whiteFramePrompts.forEach(prompt => {
      if (!prompt.autoSaved) {
        savePromises.push(saveWhiteFramePrompt(prompt));
      }
    });

    // Save custom prompts
    state.customPrompts.forEach(prompt => {
      if (!prompt.autoSaved) {
        savePromises.push(saveCustomPrompt(prompt));
      }
    });

    await Promise.all(savePromises);
    return { success: true };
  } catch (error) {
    console.error('Auto-save prompts failed:', error);
    return { success: false, error: 'Failed to auto-save prompts' };
  }
}

/**
 * Get auto-save status message
 */
export function getAutoSaveStatus(lastSaved?: Date): string {
  if (!lastSaved) return 'Not saved';
  
  const now = new Date();
  const diffMs = now.getTime() - lastSaved.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffSeconds < 10) return 'Saved just now';
  if (diffSeconds < 60) return `Saved ${diffSeconds}s ago`;
  if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`;
  
  return `Saved at ${lastSaved.toLocaleTimeString()}`;
}