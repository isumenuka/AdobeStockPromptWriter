import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../config/constants';

if (!GEMINI_API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateTitleAndKeywords(promptText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `Given this texture prompt: "${promptText}"
    
    Create:
    1. A title that:
       - Is factual and descriptive
       - Uses natural phrases
       - Focuses on material, color, and texture characteristics
       - Is 70 characters or less
       - Avoids keyword stuffing
       - Excludes brand names or artistic references
       
    2. Generate EXACTLY 49 relevant keywords that:
       - Describe physical properties (material, texture, pattern)
       - Include surface characteristics
       - Specify visual qualities
       - Mention technical aspects
       - Cover design applications
       - Use specific, scientific terms where applicable
       - Are individual words or simple phrases
       - Avoid combined terms
       - Exclude copyrighted terms or brands
       
    Return as JSON with format:
    {
      "title": "concise natural phrase describing the texture",
      "keywords": "keyword1, keyword2, ..., keyword49"
    }

    Ensure all keywords are unique and highly relevant to the texture description.
    The title should be a natural phrase without unnecessary punctuation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanJson = text.replace(/```json\n|\n```|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      // Clean and validate title
      parsed.title = parsed.title
        .replace(/[.,;:!?]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      if (parsed.title.length > 70) {
        parsed.title = parsed.title.substring(0, 67) + '...';
      }
      
      // Validate keyword count
      const keywords = parsed.keywords.split(',').map((k: string) => k.trim());
      if (keywords.length !== 49) {
        console.warn('Invalid keyword count:', keywords.length);
        // Take first 49 if more, pad with relevant terms if less
        parsed.keywords = keywords.slice(0, 49).join(', ');
      }
      
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return null;
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

export async function getEnhancedRandomization(currentPrompt: {
  materialType?: string;
  primaryColorTone?: string;
  secondaryColorTone?: string;
  lightingStyle?: string;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Initial random selection as fallback and reference
    const randomMaterial = getRandomElement(materials);
    const randomPrimary = getRandomElement(primaryColorTones);
    const randomSecondary = getRandomElement(secondaryColorTones);
    const randomLighting = getRandomElement(lightingStyles);

    const fallbackSelection = {
      materialType: randomMaterial,
      primaryColorTone: randomPrimary,
      secondaryColorTone: randomSecondary,
      lightingStyle: randomLighting
    };

    const prompt = `Create a visually harmonious texture combination.
      Current selection (for reference only):
      Material: ${currentPrompt.materialType || randomMaterial}
      Primary Color: ${currentPrompt.primaryColorTone || randomPrimary}
      Secondary Color: ${currentPrompt.secondaryColorTone || randomSecondary}
      Lighting: ${currentPrompt.lightingStyle || randomLighting}

      Create a NEW combination that would work well together, considering:
      - Material and color compatibility
      - Lighting that enhances the material's characteristics
      - Complementary color combinations
      
      Select EXACTLY ONE item from each of these lists:
      Materials: ${JSON.stringify(materials)}
      Primary Colors: ${JSON.stringify(primaryColorTones)}
      Secondary Colors: ${JSON.stringify(secondaryColorTones)}
      Lighting: ${JSON.stringify(lightingStyles)}

      Return only a JSON object with these exact keys: materialType, primaryColorTone, secondaryColorTone, lightingStyle.
      All fields are required. Values must exactly match items from the provided lists.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanJson = text.replace(/```json\n|\n```|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate that all required fields are present and valid
      if (!parsed.materialType || !parsed.primaryColorTone || 
          !parsed.secondaryColorTone || !parsed.lightingStyle ||
          !materials.includes(parsed.materialType) ||
          !primaryColorTones.includes(parsed.primaryColorTone) ||
          !secondaryColorTones.includes(parsed.secondaryColorTone) ||
          !lightingStyles.includes(parsed.lightingStyle)) {
        console.warn('Invalid or missing values in AI response, using fallback');
        return fallbackSelection;
      }

      return parsed;
    } catch (e) {
      console.error('AI response parsing failed:', e);
      return fallbackSelection;
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      materialType: getRandomElement(materials),
      primaryColorTone: getRandomElement(primaryColorTones),
      secondaryColorTone: getRandomElement(secondaryColorTones),
      lightingStyle: getRandomElement(lightingStyles)
    };
  }
}