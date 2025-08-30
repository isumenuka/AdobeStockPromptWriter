import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  saveTexturePrompt,
  saveAbstractWavePrompt,
  saveSkyPrompt,
  saveWhiteFramePrompt,
  saveCustomPrompt
} from '../services/generatorPrompts';
import type { 
  GeneratedPrompt, 
  GeneratedAbstractWavePrompt, 
  GeneratedSkyPrompt, 
  GeneratedWhiteFramePrompt,
  CustomPrompt 
} from '../types';

interface PromptAutoSaveOptions {
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

/**
 * Auto-saves individual prompts to their respective database tables
 */
export function usePromptAutoSave(
  prompts: {
    texture: GeneratedPrompt[];
    abstractwave: GeneratedAbstractWavePrompt[];
    sky: GeneratedSkyPrompt[];
    whiteframe: GeneratedWhiteFramePrompt[];
    custom: CustomPrompt[];
  },
  options: PromptAutoSaveOptions = {}
) {
  const { user } = useAuth();
  const { onError, onSuccess } = options;
  const savedPromptsRef = useRef<Set<string>>(new Set());
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!user || isSavingRef.current) return;

    const saveNewPrompts = async () => {
      isSavingRef.current = true;
      
      try {
        const savePromises: Promise<any>[] = [];

        // Check for new texture prompts
        prompts.texture.forEach(prompt => {
          if (!savedPromptsRef.current.has(prompt.id)) {
            savePromises.push(
              saveTexturePrompt(prompt).then(result => {
                if (result.success) {
                  savedPromptsRef.current.add(prompt.id);
                }
                return result;
              })
            );
          }
        });

        // Check for new abstract wave prompts
        prompts.abstractwave.forEach(prompt => {
          if (!savedPromptsRef.current.has(prompt.id)) {
            savePromises.push(
              saveAbstractWavePrompt(prompt).then(result => {
                if (result.success) {
                  savedPromptsRef.current.add(prompt.id);
                }
                return result;
              })
            );
          }
        });

        // Check for new sky prompts
        prompts.sky.forEach(prompt => {
          if (!savedPromptsRef.current.has(prompt.id)) {
            savePromises.push(
              saveSkyPrompt(prompt).then(result => {
                if (result.success) {
                  savedPromptsRef.current.add(prompt.id);
                }
                return result;
              })
            );
          }
        });

        // Check for new white frame prompts
        prompts.whiteframe.forEach(prompt => {
          if (!savedPromptsRef.current.has(prompt.id)) {
            savePromises.push(
              saveWhiteFramePrompt(prompt).then(result => {
                if (result.success) {
                  savedPromptsRef.current.add(prompt.id);
                }
                return result;
              })
            );
          }
        });

        // Check for new custom prompts
        prompts.custom.forEach(prompt => {
          if (!savedPromptsRef.current.has(prompt.id)) {
            savePromises.push(
              saveCustomPrompt(prompt).then(result => {
                if (result.success) {
                  savedPromptsRef.current.add(prompt.id);
                }
                return result;
              })
            );
          }
        });

        if (savePromises.length > 0) {
          const results = await Promise.all(savePromises);
          const failedSaves = results.filter(result => !result.success);
          
          if (failedSaves.length > 0) {
            onError?.(`Failed to auto-save ${failedSaves.length} prompts`);
          } else {
            onSuccess?.();
          }
        }
      } catch (error) {
        console.error('Auto-save prompts error:', error);
        onError?.('Auto-save failed');
      } finally {
        isSavingRef.current = false;
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveNewPrompts, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [prompts, user, onError, onSuccess]);

  // Reset saved prompts when user changes
  useEffect(() => {
    if (!user) {
      savedPromptsRef.current.clear();
    }
  }, [user]);
}