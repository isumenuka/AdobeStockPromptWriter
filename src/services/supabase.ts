import { createClient } from '@supabase/supabase-js';
import { generateSecureId } from '../utils/inputValidation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up Supabase connection.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a unique session ID for anonymous users
export const getUserSession = (): string => {
  let sessionId = localStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${generateSecureId(16)}`;
    localStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

// Database types
export interface UserFeedback {
  id?: string;
  prompt_type: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe' | 'gradientflow';
  prompt_text: string;
  prompt_parameters: Record<string, any>;
  feedback: 'like' | 'dislike' | 'neutral';
  title?: string;
  keywords?: string[];
  user_session: string;
  created_at?: string;
  updated_at?: string;
}

export interface AITrainingInsight {
  id?: string;
  prompt_type: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe' | 'gradientflow';
  parameter_name: string;
  parameter_value: string;
  like_count: number;
  dislike_count: number;
  neutral_count: number;
  preference_score: number;
  last_updated?: string;
}

// Store user feedback in Supabase
export async function storeFeedback(feedback: Omit<UserFeedback, 'user_session'>): Promise<boolean> {
  try {
    const userSession = getUserSession();
    
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        ...feedback,
        user_session: userSession
      });

    if (error) {
      console.error('Error storing feedback:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing feedback:', error);
    return false;
  }
}

// Get AI training insights for better prompt generation
export async function getTrainingInsights(
  promptType: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe' | 'gradientflow',
  parameterName?: string
): Promise<AITrainingInsight[]> {
  try {
    let query = supabase
      .from('ai_training_insights')
      .select('*')
      .eq('prompt_type', promptType)
      .order('preference_score', { ascending: false });

    if (parameterName) {
      query = query.eq('parameter_name', parameterName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching training insights:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching training insights:', error);
    return [];
  }
}

// Get user's feedback history
export async function getUserFeedbackHistory(
  promptType?: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'whiteframe' | 'gradientflow'
): Promise<UserFeedback[]> {
  try {
    const userSession = getUserSession();
    
    let query = supabase
      .from('user_feedback')
      .select('*')
      .eq('user_session', userSession)
      .order('created_at', { ascending: false });

    if (promptType) {
      query = query.eq('prompt_type', promptType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user feedback history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user feedback history:', error);
    return [];
  }
}

// Get aggregated feedback statistics
export async function getFeedbackStats(
  promptType: 'texture' | 'abstractwave' | 'sky' | 'custom' | 'gradientflow'
): Promise<{
  totalFeedback: number;
  likeCount: number;
  dislikeCount: number;
  neutralCount: number;
  topLikedParameters: AITrainingInsight[];
  topDislikedParameters: AITrainingInsight[];
}> {
  try {
    // Get total feedback count
    const { count: totalFeedback } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_type', promptType);

    // Get feedback counts by type
    const { count: likeCount } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_type', promptType)
      .eq('feedback', 'like');

    const { count: dislikeCount } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_type', promptType)
      .eq('feedback', 'dislike');

    const { count: neutralCount } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('prompt_type', promptType)
      .eq('feedback', 'neutral');

    // Get top liked parameters
    const { data: topLiked } = await supabase
      .from('ai_training_insights')
      .select('*')
      .eq('prompt_type', promptType)
      .gt('like_count', 0)
      .order('preference_score', { ascending: false })
      .limit(10);

    // Get top disliked parameters
    const { data: topDisliked } = await supabase
      .from('ai_training_insights')
      .select('*')
      .eq('prompt_type', promptType)
      .gt('dislike_count', 0)
      .order('preference_score', { ascending: true })
      .limit(10);

    return {
      totalFeedback: totalFeedback || 0,
      likeCount: likeCount || 0,
      dislikeCount: dislikeCount || 0,
      neutralCount: neutralCount || 0,
      topLikedParameters: topLiked || [],
      topDislikedParameters: topDisliked || []
    };
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return {
      totalFeedback: 0,
      likeCount: 0,
      dislikeCount: 0,
      neutralCount: 0,
      topLikedParameters: [],
      topDislikedParameters: []
    };
  }
}