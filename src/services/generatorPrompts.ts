import { supabase } from './supabase';
import type { 
  GeneratedPrompt, 
  GeneratedAbstractWavePrompt, 
  GeneratedSkyPrompt, 
  GeneratedWhiteFramePrompt,
  CustomPrompt 
} from '../types';

// Database interfaces for each generator type
export interface TexturePromptDB {
  id: string;
  user_id: string;
  prompt_text: string;
  title?: string;
  keywords?: string[];
  material_type: string;
  primary_color_tone: string;
  secondary_color_tone: string;
  lighting_style: string;
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface AbstractWavePromptDB {
  id: string;
  user_id: string;
  prompt_text: string;
  title?: string;
  keywords?: string[];
  wave_descriptor: string;
  gradient_type: string;
  color_palette_1: string;
  color_palette_2: string;
  color_palette_3: string;
  depth_effect: string;
  lighting_style: string;
  optional_keywords: string;
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface SkyPromptDB {
  id: string;
  user_id: string;
  prompt_text: string;
  title?: string;
  keywords?: string[];
  time_of_day_sky: string;
  celestial_object: string;
  cloud_style: string;
  art_style: string;
  color_and_light: string;
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface WhiteFramePromptDB {
  id: string;
  user_id: string;
  prompt_text: string;
  title?: string;
  keywords?: string[];
  frame_number: string;
  frame_orientation: string;
  wall_color: string;
  main_furniture_piece: string;
  additional_furniture_piece: string;
  lighting_description: string;
  atmosphere_description: string;
  aspect_ratio: string;
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

export interface CustomPromptDB {
  id: string;
  user_id: string;
  prompt_text: string;
  title: string;
  keywords: string[];
  user_feedback?: 'like' | 'dislike' | 'neutral';
  created_at: string;
  updated_at: string;
}

/**
 * Save texture prompt to database
 */
export async function saveTexturePrompt(promptData: GeneratedPrompt): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('texture_prompts')
      .insert({
        user_id: user.id,
        prompt_text: promptData.promptText,
        title: promptData.title,
        keywords: promptData.keywords,
        material_type: promptData.materialType,
        primary_color_tone: promptData.primaryColorTone,
        secondary_color_tone: promptData.secondaryColorTone,
        lighting_style: promptData.lightingStyle,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving texture prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving texture prompt:', error);
    return { success: false, error: 'Failed to save texture prompt' };
  }
}

/**
 * Save abstract wave prompt to database
 */
export async function saveAbstractWavePrompt(promptData: GeneratedAbstractWavePrompt): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('abstractwave_prompts')
      .insert({
        user_id: user.id,
        prompt_text: promptData.promptText,
        title: promptData.title,
        keywords: promptData.keywords,
        wave_descriptor: promptData.waveDescriptor,
        gradient_type: promptData.gradientType,
        color_palette_1: promptData.colorPalette1,
        color_palette_2: promptData.colorPalette2,
        color_palette_3: promptData.colorPalette3,
        depth_effect: promptData.depthEffect,
        lighting_style: promptData.lightingStyle,
        optional_keywords: promptData.optionalKeywords,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving abstract wave prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving abstract wave prompt:', error);
    return { success: false, error: 'Failed to save abstract wave prompt' };
  }
}

/**
 * Save sky prompt to database
 */
export async function saveSkyPrompt(promptData: GeneratedSkyPrompt): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('sky_prompts')
      .insert({
        user_id: user.id,
        prompt_text: promptData.promptText,
        title: promptData.title,
        keywords: promptData.keywords,
        time_of_day_sky: promptData.timeOfDaySky,
        celestial_object: promptData.celestialObject,
        cloud_style: promptData.cloudStyle,
        art_style: promptData.artStyle,
        color_and_light: promptData.colorAndLight,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving sky prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving sky prompt:', error);
    return { success: false, error: 'Failed to save sky prompt' };
  }
}

/**
 * Save white frame prompt to database
 */
export async function saveWhiteFramePrompt(promptData: GeneratedWhiteFramePrompt): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('whiteframe_prompts')
      .insert({
        user_id: user.id,
        prompt_text: promptData.promptText,
        title: promptData.title,
        keywords: promptData.keywords,
        frame_number: promptData.frameNumber,
        frame_orientation: promptData.frameOrientation,
        wall_color: promptData.wallColor,
        main_furniture_piece: promptData.mainFurniturePiece,
        additional_furniture_piece: promptData.additionalFurniturePiece,
        lighting_description: promptData.lightingDescription,
        atmosphere_description: promptData.atmosphereDescription,
        aspect_ratio: promptData.aspectRatio,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving white frame prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving white frame prompt:', error);
    return { success: false, error: 'Failed to save white frame prompt' };
  }
}

/**
 * Save custom prompt to database
 */
export async function saveCustomPrompt(promptData: CustomPrompt): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('custom_prompts')
      .insert({
        user_id: user.id,
        prompt_text: promptData.promptText,
        title: promptData.title,
        keywords: promptData.keywords,
        user_feedback: promptData.userFeedback
      });

    if (error) {
      console.error('Error saving custom prompt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving custom prompt:', error);
    return { success: false, error: 'Failed to save custom prompt' };
  }
}

/**
 * Get texture prompts for user
 */
export async function getTexturePrompts(limit?: number): Promise<{ prompts: TexturePromptDB[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('texture_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching texture prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching texture prompts:', error);
    return { prompts: [], error: 'Failed to fetch texture prompts' };
  }
}

/**
 * Get abstract wave prompts for user
 */
export async function getAbstractWavePrompts(limit?: number): Promise<{ prompts: AbstractWavePromptDB[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('abstractwave_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching abstract wave prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching abstract wave prompts:', error);
    return { prompts: [], error: 'Failed to fetch abstract wave prompts' };
  }
}

/**
 * Get sky prompts for user
 */
export async function getSkyPrompts(limit?: number): Promise<{ prompts: SkyPromptDB[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('sky_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sky prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching sky prompts:', error);
    return { prompts: [], error: 'Failed to fetch sky prompts' };
  }
}

/**
 * Get white frame prompts for user
 */
export async function getWhiteFramePrompts(limit?: number): Promise<{ prompts: WhiteFramePromptDB[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('whiteframe_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching white frame prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching white frame prompts:', error);
    return { prompts: [], error: 'Failed to fetch white frame prompts' };
  }
}

/**
 * Get custom prompts for user
 */
export async function getCustomPrompts(limit?: number): Promise<{ prompts: CustomPromptDB[]; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { prompts: [], error: 'User not authenticated' };
    }

    let query = supabase
      .from('custom_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching custom prompts:', error);
      return { prompts: [], error: error.message };
    }

    return { prompts: data || [] };
  } catch (error) {
    console.error('Error fetching custom prompts:', error);
    return { prompts: [], error: 'Failed to fetch custom prompts' };
  }
}

/**
 * Update feedback for any prompt type
 */
export async function updatePromptFeedback(
  promptId: string,
  feedback: 'like' | 'dislike' | 'neutral',
  promptType: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'custom'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const tableMap = {
      texture: 'texture_prompts',
      abstractwave: 'abstractwave_prompts',
      sky: 'sky_prompts',
      whiteframe: 'whiteframe_prompts',
      custom: 'custom_prompts'
    };

    const { error } = await supabase
      .from(tableMap[promptType])
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
 * Delete prompt by type
 */
export async function deletePrompt(
  promptId: string,
  promptType: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'custom'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const tableMap = {
      texture: 'texture_prompts',
      abstractwave: 'abstractwave_prompts',
      sky: 'sky_prompts',
      whiteframe: 'whiteframe_prompts',
      custom: 'custom_prompts'
    };

    const { error } = await supabase
      .from(tableMap[promptType])
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
 * Get comprehensive user statistics across all generators
 */
export async function getUserGeneratorStats(): Promise<{
  totalPrompts: number;
  promptsByType: Record<string, number>;
  feedbackStats: Record<string, number>;
  recentActivity: Array<{
    type: string;
    count: number;
    lastGenerated: string;
  }>;
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalPrompts: 0,
        promptsByType: {},
        feedbackStats: {},
        recentActivity: [],
        error: 'User not authenticated'
      };
    }

    // Get data from all tables with proper error handling
    const [textureResult, abstractwaveResult, skyResult, whiteframeResult, customResult] = await Promise.all([
      supabase.from('texture_prompts').select('user_feedback, created_at').eq('user_id', user.id),
      supabase.from('abstractwave_prompts').select('user_feedback, created_at').eq('user_id', user.id),
      supabase.from('sky_prompts').select('user_feedback, created_at').eq('user_id', user.id),
      supabase.from('whiteframe_prompts').select('user_feedback, created_at').eq('user_id', user.id),
      supabase.from('custom_prompts').select('user_feedback, created_at').eq('user_id', user.id)
    ]);

    // Check for errors in any of the queries
    const errors = [textureResult.error, abstractwaveResult.error, skyResult.error, whiteframeResult.error, customResult.error].filter(Boolean);
    if (errors.length > 0) {
      console.error('Database query errors:', errors);
      return {
        totalPrompts: 0,
        promptsByType: {},
        feedbackStats: {},
        recentActivity: [],
        error: 'Failed to fetch data from database'
      };
    }

    const promptsByType: Record<string, number> = {
      texture: textureResult.data?.length || 0,
      abstractwave: abstractwaveResult.data?.length || 0,
      sky: skyResult.data?.length || 0,
      whiteframe: whiteframeResult.data?.length || 0,
      custom: customResult.data?.length || 0
    };

    const totalPrompts = Object.values(promptsByType).reduce((sum, count) => sum + count, 0);

    // Aggregate feedback stats
    const feedbackStats: Record<string, number> = {};
    const allData = [
      ...(textureResult.data || []),
      ...(abstractwaveResult.data || []),
      ...(skyResult.data || []),
      ...(whiteframeResult.data || []),
      ...(customResult.data || [])
    ];

    allData.forEach(item => {
      if (item.user_feedback) {
        feedbackStats[item.user_feedback] = (feedbackStats[item.user_feedback] || 0) + 1;
      }
    });

    // Recent activity
    const recentActivity = Object.entries(promptsByType)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => {
        const typeData = {
          texture: textureResult.data,
          abstractwave: abstractwaveResult.data,
          sky: skyResult.data,
          whiteframe: whiteframeResult.data,
          custom: customResult.data
        }[type];

        const lastGenerated = typeData && typeData.length > 0 
          ? typeData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : '';

        return { type, count, lastGenerated };
      })
      .sort((a, b) => new Date(b.lastGenerated).getTime() - new Date(a.lastGenerated).getTime());

    return {
      totalPrompts,
      promptsByType,
      feedbackStats,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching generator stats:', error);
    return {
      totalPrompts: 0,
      promptsByType: {},
      feedbackStats: {},
      recentActivity: [],
      error: 'Failed to fetch stats'
    };
  }
}