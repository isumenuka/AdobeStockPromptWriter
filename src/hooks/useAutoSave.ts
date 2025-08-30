import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AutoSaveOptions {
  onSave?: () => Promise<void>;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export function useAutoSave(
  data: any,
  saveFunction: () => Promise<{ success: boolean; error?: string }>,
  options: AutoSaveOptions = {}
) {
  const { user } = useAuth();
  const { onError, onSuccess } = options;
  const delay = 3000; // Fixed 3 second delay
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!user || isSavingRef.current) return;

    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedRef.current) return;

    isSavingRef.current = true;
    try {
      const result = await saveFunction();
      if (result.success) {
        lastSavedRef.current = currentDataString;
        onSuccess?.();
      } else {
        onError?.(result.error || 'Failed to auto-save');
      }
    } catch (error) {
      onError?.('Auto-save failed');
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, user, onError, onSuccess]);

  useEffect(() => {
    if (!user) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}