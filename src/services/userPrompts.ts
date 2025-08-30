import { supabase } from './supabase';
import type { GeneratedPrompt, GeneratedAbstractWavePrompt, GeneratedSkyPrompt, CustomPrompt } from '../types';

export interface UserPrompt {
  id: string;
  user_id: string;
  prompt_type: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe';
  prompt_text: string;
  prompt_parameters: Record<string, any>;
  title?: string;
  keywords?: string[];
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

/**
 * Save a generated prompt to the database
 */
export async function saveUserPrompt(
  promptType: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe',
  promptData: GeneratedPrompt | GeneratedAbstractWavePrompt | GeneratedSkyPrompt | CustomPrompt
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Extract parameters based on prompt type
    let parameters: Record<string, any> = {};
    
    if (promptType === 'texture' && 'materialType' in promptData) {
      parameters = {
        materialType: promptData.materialType,
        primaryColorTone: promptData.primaryColorTone,
        secondaryColorTone: promptData.secondaryColorTone,
        lightingStyle: promptData.lightingStyle
      };
    } else if (promptType === 'abstractwave' && 'waveDescriptor' in promptData) {
      parameters = {
        waveDescriptor: promptData.waveDescriptor,
        gradientType: promptData.gradientType,
        colorPalette1: promptData.colorPalette1,
        colorPalette2: promptData.colorPalette2,
        colorPalette3: promptData.colorPalette3,
        depthEffect: promptData.depthEffect,
        lightingStyle: promptData.lightingStyle,
        optionalKeywords: promptData.optionalKeywords
      };
    } else if (promptType === 'sky' && 'timeOfDaySky' in promptData) {
      parameters = {
        timeOfDaySky: promptData.timeOfDaySky,
        celestialObject: promptData.celestialObject,
        cloudStyle: promptData.cloudStyle,
        artStyle: promptData.artStyle,
        colorAndLight: promptData.colorAndLight
      };
    } else if (promptType === 'whiteframe' && 'frameNumber' in promptData) {
      parameters = {
        frameNumber: promptData.frameNumber,
        frameOrientation: promptData.frameOrientation,
        wallColor: promptData.wallColor,
        mainFurniture: promptData.mainFurniture,
        additionalFurniture: promptData.additionalFurniture,
        lightingDescription: promptData.lightingDescription,
        atmosphereDescription: promptData.atmosphereDescription,
        aspectRatio: promptData.aspectRatio
      };
    }

    const { error } = await supabase
      .from('user_prompts')
      .insert({
        user_id: user.id,
        prompt_type: promptType,
        prompt_text: promptData.promptText,
        prompt_parameters: parameters,
        title: promptData.title,
        keywords: Array.isArray(promptData.keywords) ? promptData.keywords : 
                 typeof promptData.keywords === 'string' ? promptData.keywords.split(',').map(k => k.trim()) : 
                 undefined,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving prompt:', error);
    return { success: false, error: 'Failed to save prompt' };
  }
}

/**
 * Get all user prompts with optional filtering
 */
export async function getUserPrompts(
  promptType?: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe',
  limit?: number
): Promise<{ prompts: UserPrompt[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('user_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (promptType) {
      query = query.eq('prompt_type', promptType);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return { prompts: [], error: 'Failed to fetch prompts' };
  }
}

/**
 * Update user feedback for a prompt
 */
export async function updatePromptFeedback(
  promptId: string,
  feedback: 'like' | 'dislike' | 'neutral'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_prompts')
      .update({ 
        user_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating feedback:', error);
    return { success: false, error: 'Failed to update feedback' };
  }
}

/**
 * Update prompt title and keywords
 */
export async function updatePromptMetadata(
  promptId: string,
  updates: { title?: string; keywords?: string[] }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_prompts')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating metadata:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating metadata:', error);
    return { success: false, error: 'Failed to update metadata' };
  }
}

/**
 * Delete a user prompt
 */
export async function deleteUserPrompt(promptId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return { success: false, error: 'Failed to delete prompt' };
  }
}

/**
 * Get user prompt statistics
 */
export async function getUserPromptStats(): Promise<{
  totalPrompts: number;
  promptsByType: Record<string, number>;
  feedbackStats: Record<string, number>;
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalPrompts: 0,
        promptsByType: {},
        feedbackStats: {},
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('user_prompts')
      .select('prompt_type, user_feedback')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching stats:', error);
      return {
        totalPrompts: 0,
        promptsByType: {},
        feedbackStats: {},
        error: error.message
      };
    }

    const promptsByType: Record<string, number> = {};
    const feedbackStats: Record<string, number> = {};

    data?.forEach(prompt => {
      // Count by type
      promptsByType[prompt.prompt_type] = (promptsByType[prompt.prompt_type] || 0) + 1;
      
      // Count by feedback
      if (prompt.user_feedback) {
        feedbackStats[prompt.user_feedback] = (feedbackStats[prompt.user_feedback] || 0) + 1;
      }
    });

    return {
      totalPrompts: data?.length || 0,
      promptsByType,
      feedbackStats
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalPrompts: 0,
      promptsByType: {},
      feedbackStats: {},
      error: 'Failed to fetch stats'
    };
  }
}