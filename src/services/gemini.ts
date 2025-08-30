import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_MODEL, PROMPT_TEMPLATES } from '../config/constants';
import { getRandomUnusedOption } from '../utils/selectionManager';
import { isDuplicateTextureParams, isDuplicateAbstractWaveParams, isDuplicateSkyParams } from '../utils/duplicateChecker';
import { analyzeTextureFeedback, analyzeAbstractWaveFeedback, analyzeSkyFeedback, filterByPreferences } from '../utils/feedbackAnalyzer';
import { AITrainingService } from './aiTraining';
import type { EnhancedRandomizationResponse, AbstractWaveRandomizationResponse, WhiteFrameRandomizationResponse, TitleAndKeywordsResponse, GeneratedPrompt, GeneratedAbstractWavePrompt, GeneratedWhiteFramePrompt } from '../types';

if (!GEMINI_API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY environment variable. Please add it to your .env file.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

export async function generateTitleAndKeywords(promptText: string): Promise<TitleAndKeywordsResponse> {
  try {
    const prompt = `Given this texture prompt: "${promptText}"\n\n${PROMPT_TEMPLATES.TITLE_AND_KEYWORDS}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const cleanJson = text.replace(/```json\n|\n```|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    return {
      data: {
        title: parsed.title.replace(/[.,;:!?]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70),
        keywords: parsed.keywords.split(',').map((k: string) => k.trim()).slice(0, 49).join(', ')
      }
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('overloaded')) {
        return {
          error: 'The AI service is currently overloaded. Please try again in a few moments.'
        };
      } else if (error.message.includes('quota')) {
        return {
          error: 'API quota exceeded. Please try again later.'
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          error: 'Network connection issue. Please check your internet connection and try again.'
        };
      }
    }
    
    return {
      error: 'Failed to generate title and keywords. Please try again.'
    };
  }
}

export async function getEnhancedRandomization(
  materials: string[],
  primaryColors: string[],
  secondaryColors: string[],
  lightingStyles: string[],
  history: GeneratedPrompt[]
): Promise<EnhancedRandomizationResponse> {
  // Analyze user feedback to understand preferences
  const feedback = analyzeTextureFeedback(history);
  
  // Filter options based on user preferences
  const preferredMaterials = filterByPreferences(materials, feedback.likedMaterials, feedback.dislikedMaterials, 0);
  const preferredPrimaryColors = filterByPreferences(primaryColors, feedback.likedPrimaryColors, feedback.dislikedPrimaryColors, 0);
  const preferredSecondaryColors = filterByPreferences(secondaryColors, feedback.likedSecondaryColors, feedback.dislikedSecondaryColors, 0);
  const preferredLighting = filterByPreferences(lightingStyles, feedback.likedLighting, feedback.dislikedLighting, 0);
  
  // Use preferred options if available, otherwise use all options
  const materialsToUse = preferredMaterials.length > 0 ? preferredMaterials : materials;
  const primaryColorsToUse = preferredPrimaryColors.length > 0 ? preferredPrimaryColors : primaryColors;
  const secondaryColorsToUse = preferredSecondaryColors.length > 0 ? preferredSecondaryColors : secondaryColors;
  const lightingToUse = preferredLighting.length > 0 ? preferredLighting : lightingStyles;

  let attempts = 0;
  const maxAttempts = 50;
  
  try {
    while (attempts < maxAttempts) {
      // Get AI training context from Supabase
      const aiTrainingContext = await AITrainingService.getTrainingContextForGemini('texture');
      
      const localFeedbackContext = feedback.likedMaterials.length > 0 || feedback.dislikedMaterials.length > 0 ? 
        `\n\n**Local Session Preferences:**
- Session Liked Materials: ${feedback.likedMaterials.join(', ') || 'None yet'}
- Session Disliked Materials: ${feedback.dislikedMaterials.join(', ') || 'None yet'}
- Session Liked Primary Colors: ${feedback.likedPrimaryColors.join(', ') || 'None yet'}
- Session Disliked Primary Colors: ${feedback.dislikedPrimaryColors.join(', ') || 'None yet'}
- Session Liked Secondary Colors: ${feedback.likedSecondaryColors.join(', ') || 'None yet'}
- Session Disliked Secondary Colors: ${feedback.dislikedSecondaryColors.join(', ') || 'None yet'}
- Session Liked Lighting: ${feedback.likedLighting.join(', ') || 'None yet'}
- Session Disliked Lighting: ${feedback.dislikedLighting.join(', ') || 'None yet'}` : '';

      const prompt = `${PROMPT_TEMPLATES.ENHANCED_RANDOMIZATION}

${aiTrainingContext}
${localFeedbackContext}

Available Materials: ${JSON.stringify(materialsToUse)}
Available Primary Colors: ${JSON.stringify(primaryColorsToUse)}
Available Secondary Colors: ${JSON.stringify(secondaryColorsToUse)}
Available Lighting Styles: ${JSON.stringify(lightingToUse)}

Recently used combinations to avoid: ${JSON.stringify(history.slice(0, 5).map(h => ({
  material: h.materialType,
  primary: h.primaryColorTone,
  secondary: h.secondaryColorTone,
  lighting: h.lightingStyle
})))}

CRITICAL: Generate a combination that has NEVER been used before. Avoid ALL previous combinations completely.

Create a harmonious combination that will produce a high-quality, professional texture image.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        attempts++;
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.materialType || !parsed.primaryColorTone || 
          !parsed.secondaryColorTone || !parsed.lightingStyle ||
          !materialsToUse.includes(parsed.materialType) ||
          !primaryColorsToUse.includes(parsed.primaryColorTone) ||
          !secondaryColorsToUse.includes(parsed.secondaryColorTone) ||
          !lightingToUse.includes(parsed.lightingStyle)) {
        attempts++;
        continue;
      }

      // Check for duplicates
      if (!isDuplicateTextureParams(
        parsed.materialType,
        parsed.primaryColorTone,
        parsed.secondaryColorTone,
        parsed.lightingStyle,
        history
      )) {
        return parsed;
      }
      
      attempts++;
    }

    // If AI fails to generate unique combination, use intelligent fallback
    return getIntelligentFallbackSelection(materialsToUse, primaryColorsToUse, secondaryColorsToUse, lightingToUse, history);
  } catch (error) {
    console.error('Enhanced randomization failed:', error);
    return getIntelligentFallbackSelection(materialsToUse, primaryColorsToUse, secondaryColorsToUse, lightingToUse, history);
  }
}

export async function getAbstractWaveRandomization(
  waveDescriptors: string[],
  gradientTypes: string[],
  colorPalettes: string[],
  depthEffects: string[],
  lightingStyles: string[],
  optionalKeywords: string[],
  history: GeneratedAbstractWavePrompt[]
): Promise<AbstractWaveRandomizationResponse> {
  // Analyze user feedback to understand preferences
  const feedback = analyzeAbstractWaveFeedback(history);
  
  // Filter options based on user preferences
  const preferredWaves = filterByPreferences(waveDescriptors, feedback.likedWaveDescriptors, feedback.dislikedWaveDescriptors, 0);
  const preferredGradients = filterByPreferences(gradientTypes, feedback.likedGradientTypes, feedback.dislikedGradientTypes, 0);
  const preferredColors = filterByPreferences(colorPalettes, feedback.likedColorPalettes, feedback.dislikedColorPalettes, 0);
  const preferredDepth = filterByPreferences(depthEffects, feedback.likedDepthEffects, feedback.dislikedDepthEffects, 0);
  const preferredLighting = filterByPreferences(lightingStyles, feedback.likedLighting, feedback.dislikedLighting, 0);
  const preferredKeywords = filterByPreferences(optionalKeywords, feedback.likedKeywords, feedback.dislikedKeywords, 0);
  
  // Use preferred options if available, otherwise use all options
  const wavesToUse = preferredWaves.length > 0 ? preferredWaves : waveDescriptors;
  const gradientsToUse = preferredGradients.length > 0 ? preferredGradients : gradientTypes;
  const colorsToUse = preferredColors.length > 0 ? preferredColors : colorPalettes;
  const depthToUse = preferredDepth.length > 0 ? preferredDepth : depthEffects;
  const lightingToUse = preferredLighting.length > 0 ? preferredLighting : lightingStyles;
  const keywordsToUse = preferredKeywords.length > 0 ? preferredKeywords : optionalKeywords;

  let attempts = 0;
  const maxAttempts = 50;
  
  try {
    while (attempts < maxAttempts) {
      // Get AI training context from Supabase
      const aiTrainingContext = await AITrainingService.getTrainingContextForGemini('abstractwave');
      
      const localFeedbackContext = feedback.likedWaveDescriptors.length > 0 || feedback.dislikedWaveDescriptors.length > 0 ? 
        `\n\n**Local Session Preferences:**
- Session Liked Wave Descriptors: ${feedback.likedWaveDescriptors.join(', ') || 'None yet'}
- Session Disliked Wave Descriptors: ${feedback.dislikedWaveDescriptors.join(', ') || 'None yet'}
- Session Liked Gradient Types: ${feedback.likedGradientTypes.join(', ') || 'None yet'}
- Session Disliked Gradient Types: ${feedback.dislikedGradientTypes.join(', ') || 'None yet'}
- Session Liked Color Palettes: ${feedback.likedColorPalettes.join(', ') || 'None yet'}
- Session Disliked Color Palettes: ${feedback.dislikedColorPalettes.join(', ') || 'None yet'}
- Session Liked Depth Effects: ${feedback.likedDepthEffects.join(', ') || 'None yet'}
- Session Disliked Depth Effects: ${feedback.dislikedDepthEffects.join(', ') || 'None yet'}
- Session Liked Lighting: ${feedback.likedLighting.join(', ') || 'None yet'}
- Session Disliked Lighting: ${feedback.dislikedLighting.join(', ') || 'None yet'}
- Session Liked Keywords: ${feedback.likedKeywords.join(', ') || 'None yet'}
- Session Disliked Keywords: ${feedback.dislikedKeywords.join(', ') || 'None yet'}` : '';

      const prompt = `${PROMPT_TEMPLATES.ABSTRACTWAVE_RANDOMIZATION}

${aiTrainingContext}
${localFeedbackContext}

Available Wave Descriptors: ${JSON.stringify(wavesToUse)}
Available Gradient Types: ${JSON.stringify(gradientsToUse)}
Available Color Palettes: ${JSON.stringify(colorsToUse)}
Available Depth Effects: ${JSON.stringify(depthToUse)}
Available Lighting Styles: ${JSON.stringify(lightingToUse)}
Available Optional Keywords: ${JSON.stringify(keywordsToUse)}

Recently used combinations to avoid: ${JSON.stringify(history.slice(0, 3).map(h => ({
  wave: h.waveDescriptor,
  gradient: h.gradientType,
  colors: [h.colorPalette1, h.colorPalette2, h.colorPalette3],
  depth: h.depthEffect,
  lighting: h.lightingStyle
})))}

CRITICAL: Generate a combination that has NEVER been used before. Avoid ALL previous combinations completely.

Create a harmonious abstract wave combination that will produce a visually stunning, professional result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        attempts++;
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate all required fields
      if (!parsed.waveDescriptor || !parsed.gradientType || 
          !parsed.colorPalette1 || !parsed.colorPalette2 || !parsed.colorPalette3 ||
          !parsed.depthEffect || !parsed.lightingStyle || !parsed.optionalKeywords ||
          !wavesToUse.includes(parsed.waveDescriptor) ||
          !gradientsToUse.includes(parsed.gradientType) ||
          !colorsToUse.includes(parsed.colorPalette1) ||
          !colorsToUse.includes(parsed.colorPalette2) ||
          !colorsToUse.includes(parsed.colorPalette3) ||
          !depthToUse.includes(parsed.depthEffect) ||
          !lightingToUse.includes(parsed.lightingStyle) ||
          !keywordsToUse.includes(parsed.optionalKeywords)) {
        attempts++;
        continue;
      }

      // Check for duplicates
      if (!isDuplicateAbstractWaveParams(
        parsed.waveDescriptor,
        parsed.gradientType,
        parsed.colorPalette1,
        parsed.colorPalette2,
        parsed.colorPalette3,
        parsed.depthEffect,
        parsed.lightingStyle,
        parsed.optionalKeywords,
        history
      )) {
        return parsed;
      }
      
      attempts++;
    }

    // If AI fails to generate unique combination, use intelligent fallback
    return getIntelligentAbstractWaveFallback(wavesToUse, gradientsToUse, colorsToUse, depthToUse, lightingToUse, keywordsToUse, history);
  } catch (error) {
    console.error('AbstractWave randomization failed:', error);
    return getIntelligentAbstractWaveFallback(wavesToUse, gradientsToUse, colorsToUse, depthToUse, lightingToUse, keywordsToUse, history);
  }
}

export async function getSkyRandomization(
  timeOfDaySkies: string[],
  celestialObjects: string[],
  cloudStyles: string[],
  colorAndLight: string[],
  history: GeneratedSkyPrompt[]
): Promise<SkyRandomizationResponse> {
  // Analyze user feedback to understand preferences
  const feedback = analyzeSkyFeedback(history);
  
  // Filter options based on user preferences
  const preferredTimeSkies = filterByPreferences(timeOfDaySkies, feedback.likedTimeOfDaySkies, feedback.dislikedTimeOfDaySkies, 0);
  const preferredCelestial = filterByPreferences(celestialObjects, feedback.likedCelestialObjects, feedback.dislikedCelestialObjects, 0);
  const preferredClouds = filterByPreferences(cloudStyles, feedback.likedCloudStyles, feedback.dislikedCloudStyles, 0);
  const preferredColors = filterByPreferences(colorAndLight, feedback.likedColorAndLight, feedback.dislikedColorAndLight, 0);
  
  // Use preferred options if available, otherwise use all options
  const timeSkiesToUse = preferredTimeSkies.length > 0 ? preferredTimeSkies : timeOfDaySkies;
  const celestialToUse = preferredCelestial.length > 0 ? preferredCelestial : celestialObjects;
  const cloudsToUse = preferredClouds.length > 0 ? preferredClouds : cloudStyles;
  const colorsToUse = preferredColors.length > 0 ? preferredColors : colorAndLight;

  let attempts = 0;
  const maxAttempts = 50;
  
  try {
    while (attempts < maxAttempts) {
      // Get AI training context from Supabase
      const aiTrainingContext = await AITrainingService.getTrainingContextForGemini('sky');
      
      const localFeedbackContext = feedback.likedTimeOfDaySkies.length > 0 || feedback.dislikedTimeOfDaySkies.length > 0 ? 
        `\n\n**Local Session Preferences:**
- Session Liked Time/Sky Types: ${feedback.likedTimeOfDaySkies.join(', ') || 'None yet'}
- Session Disliked Time/Sky Types: ${feedback.dislikedTimeOfDaySkies.join(', ') || 'None yet'}
- Session Liked Celestial Objects: ${feedback.likedCelestialObjects.join(', ') || 'None yet'}
- Session Disliked Celestial Objects: ${feedback.dislikedCelestialObjects.join(', ') || 'None yet'}
- Session Liked Cloud Styles: ${feedback.likedCloudStyles.join(', ') || 'None yet'}
- Session Disliked Cloud Styles: ${feedback.dislikedCloudStyles.join(', ') || 'None yet'}
- Session Liked Color & Light: ${feedback.likedColorAndLight.join(', ') || 'None yet'}
- Session Disliked Color & Light: ${feedback.dislikedColorAndLight.join(', ') || 'None yet'}` : '';

      const prompt = `${PROMPT_TEMPLATES.SKY_RANDOMIZATION}

${aiTrainingContext}
${localFeedbackContext}

Available Time of Day/Sky Types: ${JSON.stringify(timeSkiesToUse)}
Available Celestial Objects: ${JSON.stringify(celestialToUse)}
Available Cloud Styles: ${JSON.stringify(cloudsToUse)}
Available Color and Light: ${JSON.stringify(colorsToUse)}

Recently used combinations to avoid: ${JSON.stringify(history.slice(0, 3).map(h => ({
  timeOfDaySky: h.timeOfDaySky,
  celestialObject: h.celestialObject,
  cloudStyle: h.cloudStyle,
  colorAndLight: h.colorAndLight
})))}

CRITICAL: Generate a combination that has NEVER been used before. Avoid ALL previous combinations completely.

Create a harmonious sky combination that will produce a visually stunning, professional result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        attempts++;
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate all required fields
      if (!parsed.timeOfDaySky || !parsed.celestialObject || 
          !parsed.cloudStyle || !parsed.colorAndLight ||
          !timeSkiesToUse.includes(parsed.timeOfDaySky) ||
          !celestialToUse.includes(parsed.celestialObject) ||
          !cloudsToUse.includes(parsed.cloudStyle) ||
          !colorsToUse.includes(parsed.colorAndLight)) {
        attempts++;
        continue;
      }

      // Check for duplicates
      if (!isDuplicateSkyParams(
        parsed.timeOfDaySky,
        parsed.celestialObject,
        parsed.cloudStyle,
        parsed.colorAndLight,
        history
      )) {
        // Add the fixed art style
        parsed.artStyle = 'Dreamy Anime Background Art Style';
        return parsed;
      }
      
      attempts++;
    }

    // If AI fails to generate unique combination, use intelligent fallback
    return getIntelligentSkyFallback(timeSkiesToUse, celestialToUse, cloudsToUse, colorsToUse, history);
  } catch (error) {
    console.error('Sky randomization failed:', error);
    return getIntelligentSkyFallback(timeSkiesToUse, celestialToUse, cloudsToUse, colorsToUse, history);
  }
}

export async function getGradientFlowRandomization(
  colors: string[],
  backgroundColors: string[],
  colorSpreadStyles: string[],
  history: GeneratedGradientFlowPrompt[]
): Promise<GradientFlowRandomizationResponse> {
  let attempts = 0;
  const maxAttempts = 50;
  
  try {
    while (attempts < maxAttempts) {
      const prompt = `You are an AI-Powered Prompt Generator designed to create high-quality gradient flow backgrounds.

**Core Requirements:**
- Generate combinations that will produce visually stunning and professional gradient backgrounds
- Use thoughtful consideration for color harmony and visual appeal
- Ensure all combinations create coherent, aesthetically pleasing results
- Focus on creating combinations that yield artistic, usable gradient designs

**GradientFlow Design Guidelines:**
- Think strategically about color combinations for visual harmony
- Select three colors that work beautifully together in gradients
- Choose background colors that enhance the gradient effect
- Match color spread styles with the overall aesthetic
- Prioritize combinations that create professional, gallery-worthy gradient art
- NEVER generate combinations that have been used before
- Each combination must be completely unique and never repeated

**Color Harmony Rules:**
- Analogous colors create smooth, flowing transitions
- Complementary colors create dynamic, vibrant contrasts
- Triadic colors create balanced, harmonious compositions
- Monochromatic variations create subtle, sophisticated effects
- Warm colors work well with warm backgrounds
- Cool colors pair beautifully with cool backgrounds

Select EXACTLY ONE item from each category to create a visually harmonious, professional gradient flow combination.
Avoid recently used combinations to ensure variety and freshness.
Return only a JSON object with these exact keys: color1, color2, color3, backgroundColor, colorSpreadStyle.
All values must exactly match items from the provided lists.

Available Colors: ${JSON.stringify(colors)}
Available Background Colors: ${JSON.stringify(backgroundColors)}
Available Color Spread Styles: ${JSON.stringify(colorSpreadStyles)}

Recently used combinations to avoid: ${JSON.stringify(history.slice(0, 3).map(h => ({
  colors: [h.color1, h.color2, h.color3],
  background: h.backgroundColor,
  style: h.colorSpreadStyle
})))}

CRITICAL: Generate a combination that has NEVER been used before. Avoid ALL previous combinations completely.

IMPORTANT COLOR SELECTION RULES:
- Select 3 COMPLETELY DIFFERENT colors for color1, color2, and color3
- NEVER use the same color twice in a single generation
- Avoid colors that have been used frequently in recent history
- Ensure the three colors work well together but are distinctly different
- Each color must be unique within the same prompt

Create a harmonious gradient flow combination that will produce a visually stunning, professional result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        attempts++;
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate all required fields
      if (!parsed.color1 || !parsed.color2 || !parsed.color3 ||
          !parsed.backgroundColor || !parsed.colorSpreadStyle ||
          !colors.includes(parsed.color1) ||
          !colors.includes(parsed.color2) ||
          !colors.includes(parsed.color3) ||
          !backgroundColors.includes(parsed.backgroundColor) ||
          !colorSpreadStyles.includes(parsed.colorSpreadStyle)) {
        attempts++;
        continue;
      }

      // Ensure colors are different
      if (parsed.color1 === parsed.color2 || 
          parsed.color1 === parsed.color3 || 
          parsed.color2 === parsed.color3) {
        attempts++;
        continue;
      }

      // Check for duplicates
      const isDuplicate = history.some(h => 
        h.color1 === parsed.color1 &&
        h.color2 === parsed.color2 &&
        h.color3 === parsed.color3 &&
        h.backgroundColor === parsed.backgroundColor &&
        h.colorSpreadStyle === parsed.colorSpreadStyle
      );

      if (!isDuplicate) {
        return parsed;
      }
      
      attempts++;
    }

    // If AI fails to generate unique combination, use intelligent fallback
    return getIntelligentGradientFlowFallback(colors, backgroundColors, colorSpreadStyles, history);
  } catch (error) {
    console.error('GradientFlow randomization failed:', error);
    return getIntelligentGradientFlowFallback(colors, backgroundColors, colorSpreadStyles, history);
  }
}

export async function getWhiteFrameRandomization(
  frameNumbers: string[],
  frameOrientations: string[],
  wallColors: string[],
  mainFurniturePieces: string[],
  additionalFurniturePieces: string[],
  lightingDescriptions: string[],
  atmosphereDescriptions: string[],
  aspectRatios: string[],
  history: GeneratedWhiteFramePrompt[]
): Promise<WhiteFrameRandomizationResponse> {
  let attempts = 0;
  const maxAttempts = 50;
  
  try {
    while (attempts < maxAttempts) {
      const prompt = `You are an AI-Powered Prompt Generator designed to create high-quality white frame interior mockups.

**Core Requirements:**
- Generate combinations that will produce visually stunning and professional interior mockups
- Use thoughtful consideration for interior design harmony and visual appeal
- Ensure all combinations create coherent, aesthetically pleasing results
- Focus on creating combinations that yield professional, usable interior designs

**White Frame Design Guidelines:**
- Think strategically about furniture and lighting combinations for visual harmony
- Match wall colors with appropriate furniture styles
- Consider how lighting enhances the overall mood and atmosphere
- Select furniture pieces that work well together in the same space
- Ensure atmosphere descriptions match the overall design aesthetic
- Prioritize combinations that create professional, magazine-worthy interiors
- NEVER generate combinations that have been used before
- Each combination must be completely unique and never repeated

**Interior Design Harmony Rules:**
- Modern furniture works well with neutral walls and contemporary lighting
- Traditional furniture pairs beautifully with warm colors and classic lighting
- Minimalist furniture benefits from clean walls and simple lighting
- Industrial furniture works with bold colors and dramatic lighting
- Scandinavian furniture matches light colors and natural lighting

Select EXACTLY ONE item from each category to create a visually harmonious, professional white frame interior combination.
Avoid recently used combinations to ensure variety and freshness.
Return only a JSON object with these exact keys: frameNumber, frameOrientation, wallColor, mainFurniturePiece, additionalFurniturePiece, lightingDescription, atmosphereDescription, aspectRatio.
All values must exactly match items from the provided lists.

Available Frame Numbers: ${JSON.stringify(frameNumbers)}
Available Frame Orientations: ${JSON.stringify(frameOrientations)}
Available Wall Colors: ${JSON.stringify(wallColors)}
Available Main Furniture Pieces: ${JSON.stringify(mainFurniturePieces)}
Available Additional Furniture Pieces: ${JSON.stringify(additionalFurniturePieces)}
Available Lighting Descriptions: ${JSON.stringify(lightingDescriptions)}
Available Atmosphere Descriptions: ${JSON.stringify(atmosphereDescriptions)}
Available Aspect Ratios: ${JSON.stringify(aspectRatios)}

Recently used combinations to avoid: ${JSON.stringify(history.slice(0, 3).map(h => ({
  frameNumber: h.frameNumber,
  frameOrientation: h.frameOrientation,
  wallColor: h.wallColor,
  mainFurniturePiece: h.mainFurniturePiece,
  additionalFurniturePiece: h.additionalFurniturePiece,
  lightingDescription: h.lightingDescription,
  atmosphereDescription: h.atmosphereDescription,
  aspectRatio: h.aspectRatio
})))}

CRITICAL: Generate a combination that has NEVER been used before. Avoid ALL previous combinations completely.

Create a harmonious white frame interior combination that will produce a visually stunning, professional result.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        attempts++;
        continue;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate all required fields
      if (!parsed.frameNumber || !parsed.frameOrientation || 
          !parsed.wallColor || !parsed.mainFurniturePiece || 
          !parsed.additionalFurniturePiece || !parsed.lightingDescription ||
          !parsed.atmosphereDescription || !parsed.aspectRatio ||
          !frameNumbers.includes(parsed.frameNumber) ||
          !frameOrientations.includes(parsed.frameOrientation) ||
          !wallColors.includes(parsed.wallColor) ||
          !mainFurniturePieces.includes(parsed.mainFurniturePiece) ||
          !additionalFurniturePieces.includes(parsed.additionalFurniturePiece) ||
          !lightingDescriptions.includes(parsed.lightingDescription) ||
          !atmosphereDescriptions.includes(parsed.atmosphereDescription) ||
          !aspectRatios.includes(parsed.aspectRatio)) {
        attempts++;
        continue;
      }

      // Check for duplicates (simplified check)
      const isDuplicate = history.some(h => 
        h.frameNumber === parsed.frameNumber &&
        h.frameOrientation === parsed.frameOrientation &&
        h.wallColor === parsed.wallColor &&
        h.mainFurniturePiece === parsed.mainFurniturePiece &&
        h.additionalFurniturePiece === parsed.additionalFurniturePiece &&
        h.lightingDescription === parsed.lightingDescription &&
        h.atmosphereDescription === parsed.atmosphereDescription &&
        h.aspectRatio === parsed.aspectRatio
      );

      if (!isDuplicate) {
        return parsed;
      }
      
      attempts++;
    }

    // If AI fails to generate unique combination, use intelligent fallback
    return getIntelligentWhiteFrameFallback(
      frameNumbers, frameOrientations, wallColors, mainFurniturePieces,
      additionalFurniturePieces, lightingDescriptions, atmosphereDescriptions, aspectRatios, history
    );
  } catch (error) {
    console.error('White frame randomization failed:', error);
    return getIntelligentWhiteFrameFallback(
      frameNumbers, frameOrientations, wallColors, mainFurniturePieces,
      additionalFurniturePieces, lightingDescriptions, atmosphereDescriptions, aspectRatios, history
    );
  }
}

// Intelligent fallback selection for texture generation
function getIntelligentFallbackSelection(
  materials: string[],
  primaryColors: string[],
  secondaryColors: string[],
  lightingStyles: string[],
  history: GeneratedPrompt[]
): EnhancedRandomizationResponse {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    // Get unused options with intelligent matching
    const materialType = getRandomUnusedOption(history, materials, 'materialType');
    
    // Match colors that work well with the selected material
    const compatiblePrimaries = getCompatibleColors(materialType, primaryColors);
    const primaryColorTone = getRandomUnusedOption(history, compatiblePrimaries, 'primaryColorTone');
    
    // Select complementary secondary color
    const compatibleSecondaries = getComplementaryColors(primaryColorTone, secondaryColors);
    const secondaryColorTone = getRandomUnusedOption(history, compatibleSecondaries, 'secondaryColorTone');
    
    // Select appropriate lighting for the material
    const compatibleLighting = getCompatibleLighting(materialType, lightingStyles);
    const lightingStyle = getRandomUnusedOption(history, compatibleLighting, 'lightingStyle');
    
    // Check if this combination is unique
    if (!isDuplicateTextureParams(materialType, primaryColorTone, secondaryColorTone, lightingStyle, history)) {
      return {
        materialType,
        primaryColorTone,
        secondaryColorTone,
        lightingStyle
      };
    }
    
    attempts++;
  }
  
  // If we can't find a unique combination, return a random one (this should rarely happen)
  console.warn('Could not generate unique texture combination after maximum attempts');
  return {
    materialType: materials[Math.floor(Math.random() * materials.length)],
    primaryColorTone: primaryColors[Math.floor(Math.random() * primaryColors.length)],
    secondaryColorTone: secondaryColors[Math.floor(Math.random() * secondaryColors.length)],
    lightingStyle: lightingStyles[Math.floor(Math.random() * lightingStyles.length)]
  };
}

// Intelligent fallback for abstract wave generation
function getIntelligentAbstractWaveFallback(
  waveDescriptors: string[],
  gradientTypes: string[],
  colorPalettes: string[],
  depthEffects: string[],
  lightingStyles: string[],
  optionalKeywords: string[],
  history: GeneratedAbstractWavePrompt[]
): AbstractWaveRandomizationResponse {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const waveDescriptor = getRandomUnusedOption(history, waveDescriptors, 'waveDescriptor');
    const gradientType = getRandomUnusedOption(history, gradientTypes, 'gradientType');
    
    // Select three different colors, avoiding previously used ones
    const usedColors = new Set([
      ...history.map(h => h.colorPalette1),
      ...history.map(h => h.colorPalette2),
      ...history.map(h => h.colorPalette3)
    ]);
    
    const availableColors = colorPalettes.filter(color => !usedColors.has(color));
    const colorsToUse = availableColors.length >= 3 ? availableColors : colorPalettes;
    
    // Shuffle and select 3 different colors
    const shuffledColors = [...colorsToUse].sort(() => Math.random() - 0.5);
    const colorPalette1 = shuffledColors[0];
    const colorPalette2 = shuffledColors[1];
    const colorPalette3 = shuffledColors[2];
    
    const depthEffect = getRandomUnusedOption(history, depthEffects, 'depthEffect');
    const lightingStyle = getRandomUnusedOption(history, lightingStyles, 'lightingStyle');
    const selectedOptionalKeywords = getRandomUnusedOption(history, optionalKeywords, 'optionalKeywords');
    
    // Check if this combination is unique
    if (!isDuplicateAbstractWaveParams(
      waveDescriptor,
      gradientType,
      colorPalette1,
      colorPalette2,
      colorPalette3,
      depthEffect,
      lightingStyle,
      selectedOptionalKeywords,
      history
    )) {
      return {
        waveDescriptor,
        gradientType,
        colorPalette1,
        colorPalette2,
        colorPalette3,
        depthEffect,
        lightingStyle,
        optionalKeywords: selectedOptionalKeywords
      };
    }
    
    attempts++;
  }
  
  // If we can't find a unique combination, return a random one (this should rarely happen)
  console.warn('Could not generate unique abstract wave combination after maximum attempts');
  const shuffledColors = [...colorPalettes].sort(() => Math.random() - 0.5);
  return {
    waveDescriptor: waveDescriptors[Math.floor(Math.random() * waveDescriptors.length)],
    gradientType: gradientTypes[Math.floor(Math.random() * gradientTypes.length)],
    colorPalette1: shuffledColors[0],
    colorPalette2: shuffledColors[1],
    colorPalette3: shuffledColors[2],
    depthEffect: depthEffects[Math.floor(Math.random() * depthEffects.length)],
    lightingStyle: lightingStyles[Math.floor(Math.random() * lightingStyles.length)],
    optionalKeywords: optionalKeywords[Math.floor(Math.random() * optionalKeywords.length)]
  };
}

// Intelligent fallback for sky generation
function getIntelligentSkyFallback(
  timeOfDaySkies: string[],
  celestialObjects: string[],
  cloudStyles: string[],
  colorAndLight: string[],
  history: GeneratedSkyPrompt[]
): SkyRandomizationResponse {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const timeOfDaySky = getRandomUnusedOption(history, timeOfDaySkies, 'timeOfDaySky');
    const celestialObject = getRandomUnusedOption(history, celestialObjects, 'celestialObject');
    const cloudStyle = getRandomUnusedOption(history, cloudStyles, 'cloudStyle');
    const selectedColorAndLight = getRandomUnusedOption(history, colorAndLight, 'colorAndLight');
    
    // Check if this combination is unique
    if (!isDuplicateSkyParams(
      timeOfDaySky,
      celestialObject,
      cloudStyle,
      selectedColorAndLight,
      history
    )) {
      return {
        timeOfDaySky,
        celestialObject,
        cloudStyle,
        artStyle: 'Dreamy Anime Background Art Style',
        colorAndLight: selectedColorAndLight
      };
    }
    
    attempts++;
  }
  
  // If we can't find a unique combination, return a random one (this should rarely happen)
  console.warn('Could not generate unique sky combination after maximum attempts');
  return {
    timeOfDaySky: timeOfDaySkies[Math.floor(Math.random() * timeOfDaySkies.length)],
    celestialObject: celestialObjects[Math.floor(Math.random() * celestialObjects.length)],
    cloudStyle: cloudStyles[Math.floor(Math.random() * cloudStyles.length)],
    artStyle: 'Dreamy Anime Background Art Style',
    colorAndLight: colorAndLight[Math.floor(Math.random() * colorAndLight.length)]
  };
}

// Intelligent fallback for white frame generation
function getIntelligentWhiteFrameFallback(
  frameNumbers: string[],
  frameOrientations: string[],
  wallColors: string[],
  mainFurniturePieces: string[],
  additionalFurniturePieces: string[],
  lightingDescriptions: string[],
  atmosphereDescriptions: string[],
  aspectRatios: string[],
  history: GeneratedWhiteFramePrompt[]
): WhiteFrameRandomizationResponse {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const frameNumber = frameNumbers[Math.floor(Math.random() * frameNumbers.length)];
    const frameOrientation = frameOrientations[Math.floor(Math.random() * frameOrientations.length)];
    const wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
    const mainFurniturePiece = mainFurniturePieces[Math.floor(Math.random() * mainFurniturePieces.length)];
    const additionalFurniturePiece = additionalFurniturePieces[Math.floor(Math.random() * additionalFurniturePieces.length)];
    const lightingDescription = lightingDescriptions[Math.floor(Math.random() * lightingDescriptions.length)];
    const atmosphereDescription = atmosphereDescriptions[Math.floor(Math.random() * atmosphereDescriptions.length)];
    const aspectRatio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)];
    
    // Check if this combination is unique
    const isDuplicate = history.some(h => 
      h.frameNumber === frameNumber &&
      h.frameOrientation === frameOrientation &&
      h.wallColor === wallColor &&
      h.mainFurniturePiece === mainFurniturePiece &&
      h.additionalFurniturePiece === additionalFurniturePiece &&
      h.lightingDescription === lightingDescription &&
      h.atmosphereDescription === atmosphereDescription &&
      h.aspectRatio === aspectRatio
    );

    if (!isDuplicate) {
      return {
        frameNumber,
        frameOrientation,
        wallColor,
        mainFurniturePiece,
        additionalFurniturePiece,
        lightingDescription,
        atmosphereDescription,
        aspectRatio
      };
    }
    
    attempts++;
  }
  
  // If we can't find a unique combination, return a random one (this should rarely happen)
  console.warn('Could not generate unique white frame combination after maximum attempts');
  return {
    frameNumber: frameNumbers[Math.floor(Math.random() * frameNumbers.length)],
    frameOrientation: frameOrientations[Math.floor(Math.random() * frameOrientations.length)],
    wallColor: wallColors[Math.floor(Math.random() * wallColors.length)],
    mainFurniturePiece: mainFurniturePieces[Math.floor(Math.random() * mainFurniturePieces.length)],
    additionalFurniturePiece: additionalFurniturePieces[Math.floor(Math.random() * additionalFurniturePieces.length)],
    lightingDescription: lightingDescriptions[Math.floor(Math.random() * lightingDescriptions.length)],
    atmosphereDescription: atmosphereDescriptions[Math.floor(Math.random() * atmosphereDescriptions.length)],
    aspectRatio: aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
  };
}

// Helper functions for intelligent matching
function getCompatibleColors(material: string, colors: string[]): string[] {
  const materialType = material.toLowerCase();
  
  if (materialType.includes('wood')) {
    return colors.filter(c => 
      c.includes('brown') || c.includes('tan') || c.includes('warm') || 
      c.includes('amber') || c.includes('golden') || c.includes('honey')
    );
  }
  
  if (materialType.includes('marble') || materialType.includes('stone')) {
    return colors.filter(c => 
      c.includes('white') || c.includes('gray') || c.includes('beige') || 
      c.includes('cream') || c.includes('cool')
    );
  }
  
  if (materialType.includes('metal')) {
    return colors.filter(c => 
      c.includes('silver') || c.includes('gray') || c.includes('steel') || 
      c.includes('gunmetal') || c.includes('chrome')
    );
  }
  
  return colors; // Return all if no specific match
}

function getComplementaryColors(primaryColor: string, colors: string[]): string[] {
  const primary = primaryColor.toLowerCase();
  
  // Return colors that complement the primary
  if (primary.includes('warm') || primary.includes('brown') || primary.includes('amber')) {
    return colors.filter(c => 
      c.includes('cream') || c.includes('beige') || c.includes('tan') || 
      c.includes('ivory') || c.includes('pale')
    );
  }
  
  if (primary.includes('cool') || primary.includes('blue') || primary.includes('gray')) {
    return colors.filter(c => 
      c.includes('white') || c.includes('silver') || c.includes('light') || 
      c.includes('pale') || c.includes('cool')
    );
  }
  
  return colors;
}

function getCompatibleLighting(material: string, lightingStyles: string[]): string[] {
  const materialType = material.toLowerCase();
  
  if (materialType.includes('wood')) {
    return lightingStyles.filter(l => 
      l.includes('warm') || l.includes('natural') || l.includes('soft') || 
      l.includes('golden') || l.includes('ambient')
    );
  }
  
  if (materialType.includes('marble') || materialType.includes('stone')) {
    return lightingStyles.filter(l => 
      l.includes('natural') || l.includes('diffuse') || l.includes('balanced') || 
      l.includes('daylight') || l.includes('even')
    );
  }
  
  if (materialType.includes('metal')) {
    return lightingStyles.filter(l => 
      l.includes('studio') || l.includes('directional') || l.includes('high contrast') || 
      l.includes('spot') || l.includes('reflected')
    );
  }
  
  return lightingStyles;
}

function selectUniqueColors(colorPalettes: string[], history: GeneratedAbstractWavePrompt[]): string[] {
  // Get all previously used colors
  const usedColors = new Set([
    ...history.slice(0, 10).map(h => h.colorPalette1), // Only check recent history
    ...history.slice(0, 10).map(h => h.colorPalette2),
    ...history.slice(0, 10).map(h => h.colorPalette3)
  ]);
  
  // Filter out recently used colors
  const availableColors = colorPalettes.filter(color => !usedColors.has(color));
  const colorsToUse = availableColors.length >= 3 ? availableColors : colorPalettes;
  
  // Shuffle and select 3 different colors
  const shuffledColors = [...colorsToUse].sort(() => Math.random() - 0.5);
  return shuffledColors;
}

// Intelligent fallback for gradient flow generation
function getIntelligentGradientFlowFallback(
  colors: string[],
  backgroundColors: string[],
  colorSpreadStyles: string[],
  history: GeneratedGradientFlowPrompt[]
): GradientFlowRandomizationResponse {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    // Select three different colors, avoiding previously used ones
    const usedColors = new Set([
      ...history.map(h => h.color1),
      ...history.map(h => h.color2),
      ...history.map(h => h.color3)
    ]);
    
    const availableColors = colors.filter(color => !usedColors.has(color));
    const colorsToUse = availableColors.length >= 3 ? availableColors : colors;
    
    // Shuffle and select 3 different colors
    const shuffledColors = [...colorsToUse].sort(() => Math.random() - 0.5);
    const color1 = shuffledColors[0];
    const color2 = shuffledColors[1];
    const color3 = shuffledColors[2];
    
    const backgroundColor = getRandomUnusedOption(history, backgroundColors, 'backgroundColor');
    const colorSpreadStyle = getRandomUnusedOption(history, colorSpreadStyles, 'colorSpreadStyle');
    
    // Check if this combination is unique
    const isDuplicate = history.some(h => 
      h.color1 === color1 &&
      h.color2 === color2 &&
      h.color3 === color3 &&
      h.backgroundColor === backgroundColor &&
      h.colorSpreadStyle === colorSpreadStyle
    );

    if (!isDuplicate) {
      return {
        color1,
        color2,
        color3,
        backgroundColor,
        colorSpreadStyle
      };
    }
    
    attempts++;
  }
  
  // If we can't find a unique combination, return a random one (this should rarely happen)
  console.warn('Could not generate unique gradient flow combination after maximum attempts');
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
  return {
    color1: shuffledColors[0],
    color2: shuffledColors[1],
    color3: shuffledColors[2],
    backgroundColor: backgroundColors[Math.floor(Math.random() * backgroundColors.length)],
    colorSpreadStyle: colorSpreadStyles[Math.floor(Math.random() * colorSpreadStyles.length)]
  };
}