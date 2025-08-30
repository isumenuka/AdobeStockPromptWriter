import { getTrainingInsights, AITrainingInsight } from './supabase';
import { GeneratedPrompt, GeneratedAbstractWavePrompt, GeneratedSkyPrompt } from '../types';

/**
 * Enhanced feedback analyzer that uses Supabase training data
 */
export class AITrainingService {
  
  /**
   * Get AI-trained preferences for texture generation
   */
  static async getTexturePreferences(): Promise<{
    preferredMaterials: string[];
    preferredPrimaryColors: string[];
    preferredSecondaryColors: string[];
    preferredLighting: string[];
    avoidMaterials: string[];
    avoidPrimaryColors: string[];
    avoidSecondaryColors: string[];
    avoidLighting: string[];
  }> {
    try {
      const insights = await getTrainingInsights('texture');
      
      const materials = insights.filter(i => i.parameter_name === 'materialType');
      const primaryColors = insights.filter(i => i.parameter_name === 'primaryColorTone');
      const secondaryColors = insights.filter(i => i.parameter_name === 'secondaryColorTone');
      const lighting = insights.filter(i => i.parameter_name === 'lightingStyle');

      return {
        preferredMaterials: materials
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredPrimaryColors: primaryColors
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredSecondaryColors: secondaryColors
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredLighting: lighting
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        avoidMaterials: materials
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidPrimaryColors: primaryColors
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidSecondaryColors: secondaryColors
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidLighting: lighting
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value)
      };
    } catch (error) {
      console.error('Error getting texture preferences:', error);
      return {
        preferredMaterials: [],
        preferredPrimaryColors: [],
        preferredSecondaryColors: [],
        preferredLighting: [],
        avoidMaterials: [],
        avoidPrimaryColors: [],
        avoidSecondaryColors: [],
        avoidLighting: []
      };
    }
  }

  /**
   * Get AI-trained preferences for abstract wave generation
   */
  static async getAbstractWavePreferences(): Promise<{
    preferredWaves: string[];
    preferredGradients: string[];
    preferredColors: string[];
    preferredDepth: string[];
    preferredLighting: string[];
    preferredKeywords: string[];
    avoidWaves: string[];
    avoidGradients: string[];
    avoidColors: string[];
    avoidDepth: string[];
    avoidLighting: string[];
    avoidKeywords: string[];
  }> {
    try {
      const insights = await getTrainingInsights('abstractwave');
      
      const waves = insights.filter(i => i.parameter_name === 'waveDescriptor');
      const gradients = insights.filter(i => i.parameter_name === 'gradientType');
      const colors = insights.filter(i => 
        ['colorPalette1', 'colorPalette2', 'colorPalette3'].includes(i.parameter_name)
      );
      const depth = insights.filter(i => i.parameter_name === 'depthEffect');
      const lighting = insights.filter(i => i.parameter_name === 'lightingStyle');
      const keywords = insights.filter(i => i.parameter_name === 'optionalKeywords');

      return {
        preferredWaves: waves
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredGradients: gradients
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredColors: colors
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredDepth: depth
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredLighting: lighting
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredKeywords: keywords
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        avoidWaves: waves
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidGradients: gradients
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidColors: colors
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidDepth: depth
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidLighting: lighting
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidKeywords: keywords
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value)
      };
    } catch (error) {
      console.error('Error getting abstract wave preferences:', error);
      return {
        preferredWaves: [],
        preferredGradients: [],
        preferredColors: [],
        preferredDepth: [],
        preferredLighting: [],
        preferredKeywords: [],
        avoidWaves: [],
        avoidGradients: [],
        avoidColors: [],
        avoidDepth: [],
        avoidLighting: [],
        avoidKeywords: []
      };
    }
  }

  /**
   * Get AI-trained preferences for sky generation
   */
  static async getSkyPreferences(): Promise<{
    preferredTimeSkies: string[];
    preferredCelestial: string[];
    preferredClouds: string[];
    preferredColors: string[];
    avoidTimeSkies: string[];
    avoidCelestial: string[];
    avoidClouds: string[];
    avoidColors: string[];
  }> {
    try {
      const insights = await getTrainingInsights('sky');
      
      const timeSkies = insights.filter(i => i.parameter_name === 'timeOfDaySky');
      const celestial = insights.filter(i => i.parameter_name === 'celestialObject');
      const clouds = insights.filter(i => i.parameter_name === 'cloudStyle');
      const colors = insights.filter(i => i.parameter_name === 'colorAndLight');

      return {
        preferredTimeSkies: timeSkies
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredCelestial: celestial
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredClouds: clouds
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        preferredColors: colors
          .filter(i => i.preference_score > 0)
          .sort((a, b) => b.preference_score - a.preference_score)
          .map(i => i.parameter_value),
        avoidTimeSkies: timeSkies
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidCelestial: celestial
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidClouds: clouds
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value),
        avoidColors: colors
          .filter(i => i.preference_score < -1)
          .map(i => i.parameter_value)
      };
    } catch (error) {
      console.error('Error getting sky preferences:', error);
      return {
        preferredTimeSkies: [],
        preferredCelestial: [],
        preferredClouds: [],
        preferredColors: [],
        avoidTimeSkies: [],
        avoidCelestial: [],
        avoidClouds: [],
        avoidColors: []
      };
    }
  }

  /**
   * Generate training context for Gemini AI based on Supabase data
   */
  static async getTrainingContextForGemini(
    promptType: 'texture' | 'abstractwave' | 'sky' | 'whiteframe' | 'gradientflow'
  ): Promise<string> {
    try {
      let preferences: any;
      
      switch (promptType) {
        case 'texture':
          preferences = await this.getTexturePreferences();
          return `
**AI Training Data from User Feedback:**

STRONGLY PREFERRED (High user satisfaction):
- Materials: ${preferences.preferredMaterials.slice(0, 10).join(', ') || 'None yet'}
- Primary Colors: ${preferences.preferredPrimaryColors.slice(0, 10).join(', ') || 'None yet'}
- Secondary Colors: ${preferences.preferredSecondaryColors.slice(0, 10).join(', ') || 'None yet'}
- Lighting: ${preferences.preferredLighting.slice(0, 10).join(', ') || 'None yet'}

AVOID (Low user satisfaction):
- Materials: ${preferences.avoidMaterials.join(', ') || 'None yet'}
- Primary Colors: ${preferences.avoidPrimaryColors.join(', ') || 'None yet'}
- Secondary Colors: ${preferences.avoidSecondaryColors.join(', ') || 'None yet'}
- Lighting: ${preferences.avoidLighting.join(', ') || 'None yet'}

CRITICAL: Strongly prioritize preferred items and completely avoid items in the avoid lists.`;

        case 'abstractwave':
          preferences = await this.getAbstractWavePreferences();
          return `
**AI Training Data from User Feedback:**

STRONGLY PREFERRED (High user satisfaction):
- Wave Descriptors: ${preferences.preferredWaves.slice(0, 10).join(', ') || 'None yet'}
- Gradient Types: ${preferences.preferredGradients.slice(0, 10).join(', ') || 'None yet'}
- Color Palettes: ${preferences.preferredColors.slice(0, 10).join(', ') || 'None yet'}
- Depth Effects: ${preferences.preferredDepth.slice(0, 10).join(', ') || 'None yet'}
- Lighting: ${preferences.preferredLighting.slice(0, 10).join(', ') || 'None yet'}
- Keywords: ${preferences.preferredKeywords.slice(0, 10).join(', ') || 'None yet'}

AVOID (Low user satisfaction):
- Wave Descriptors: ${preferences.avoidWaves.join(', ') || 'None yet'}
- Gradient Types: ${preferences.avoidGradients.join(', ') || 'None yet'}
- Color Palettes: ${preferences.avoidColors.join(', ') || 'None yet'}
- Depth Effects: ${preferences.avoidDepth.join(', ') || 'None yet'}
- Lighting: ${preferences.avoidLighting.join(', ') || 'None yet'}
- Keywords: ${preferences.avoidKeywords.join(', ') || 'None yet'}

CRITICAL: Strongly prioritize preferred items and completely avoid items in the avoid lists.`;

        case 'sky':
          preferences = await this.getSkyPreferences();
          return `
**AI Training Data from User Feedback:**

STRONGLY PREFERRED (High user satisfaction):
- Time/Sky Types: ${preferences.preferredTimeSkies.slice(0, 10).join(', ') || 'None yet'}
- Celestial Objects: ${preferences.preferredCelestial.slice(0, 10).join(', ') || 'None yet'}
- Cloud Styles: ${preferences.preferredClouds.slice(0, 10).join(', ') || 'None yet'}
- Color & Light: ${preferences.preferredColors.slice(0, 10).join(', ') || 'None yet'}

AVOID (Low user satisfaction):
- Time/Sky Types: ${preferences.avoidTimeSkies.join(', ') || 'None yet'}
- Celestial Objects: ${preferences.avoidCelestial.join(', ') || 'None yet'}
- Cloud Styles: ${preferences.avoidClouds.join(', ') || 'None yet'}
- Color & Light: ${preferences.avoidColors.join(', ') || 'None yet'}

CRITICAL: Strongly prioritize preferred items and completely avoid items in the avoid lists.`;

        case 'whiteframe':
          return `
**AI Training Data from User Feedback:**

STRONGLY PREFERRED (High user satisfaction):
- Frame Numbers: None yet
- Frame Orientations: None yet
- Wall Colors: None yet
- Furniture Pieces: None yet
- Lighting Descriptions: None yet
- Atmosphere Descriptions: None yet
- Aspect Ratios: None yet

AVOID (Low user satisfaction):
- Frame Numbers: None yet
- Frame Orientations: None yet
- Wall Colors: None yet
- Furniture Pieces: None yet
- Lighting Descriptions: None yet
- Atmosphere Descriptions: None yet
- Aspect Ratios: None yet

CRITICAL: Strongly prioritize preferred items and completely avoid items in the avoid lists.`;

        case 'gradientflow':
          return `
**AI Training Data from User Feedback:**

STRONGLY PREFERRED (High user satisfaction):
- Color 1: None yet
- Color 2: None yet
- Color 3: None yet
- Background Colors: None yet
- Color Spread Styles: None yet

AVOID (Low user satisfaction):
- Color 1: None yet
- Color 2: None yet
- Color 3: None yet
- Background Colors: None yet
- Color Spread Styles: None yet

CRITICAL: Strongly prioritize preferred items and completely avoid items in the avoid lists.`;

        default:
          return '';
      }
    } catch (error) {
      console.error('Error generating training context:', error);
      return '';
    }
  }
}