// API Configuration
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
export const GEMINI_MODEL = "gemini-2.5-pro";

// Storage Keys
export const STORAGE_KEYS = {
  CUSTOM_PROMPT_HISTORY: 'adobestock-custom-prompt-history',
  GENERATED_PROMPT_HISTORY: 'adobestock-generated-prompt-history',
  ABSTRACTWAVE_PROMPT_HISTORY: 'abstractwave-generated-prompt-history',
  SKY_PROMPT_HISTORY: 'sky-generated-prompt-history',
  WHITEFRAME_PROMPT_HISTORY: 'whiteframe-generated-prompt-history',
  GRADIENTFLOW_PROMPT_HISTORY: 'gradientflow-generated-prompt-history',
  GENERATOR_TYPE: 'generator-type-selection'
} as const;

// UI Constants
export const MAX_PROMPT_LENGTH = 500;
export const MAX_HISTORY_ITEMS = 50; // Increased to track more history for better duplicate detection
export const COPY_TIMEOUT = 2000;

// Prompt Generation
export const PROMPT_TEMPLATES = {
  TITLE_AND_KEYWORDS: `Create:
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
}`,

  ENHANCED_RANDOMIZATION: `You are an AI-Powered Prompt Generator designed to create high-quality, detailed prompts for AI image generation.

**Core Requirements:**
- Generate combinations that will produce visually appealing and professional results
- Use thoughtful consideration and logical matching when selecting elements
- Ensure all combinations are coherent and will produce high-quality texture images
- Focus on creating combinations that yield professional, usable images

**Randomization Guidelines:**
- Think strategically about element combinations before selecting
- Match complementary materials, colors, and lighting
- Consider how lighting enhances the material's characteristics
- Avoid combinations that would result in poor or unusable images
- Prioritize combinations that enhance overall image quality and realism
- NEVER generate combinations that have been used before
- Each combination must be completely unique and never repeated

**Material-Color-Lighting Harmony Rules:**
- Wood materials work best with warm colors and natural/warm lighting
- Stone/marble materials pair well with neutral colors and balanced lighting
- Metal materials benefit from cool colors and directional/studio lighting
- Fabric materials need soft colors and diffuse lighting
- Consider the natural appearance and properties of each material

Select EXACTLY ONE item from each category to create a visually harmonious, professional texture combination.
Avoid recently used combinations to ensure variety.
Return only a JSON object with these exact keys: materialType, primaryColorTone, secondaryColorTone, lightingStyle.
All values must exactly match items from the provided lists.`,

  ABSTRACTWAVE_RANDOMIZATION: `You are an AI-Powered Prompt Generator designed to create high-quality abstract wave designs.

**Core Requirements:**
- Generate combinations that will produce visually stunning and professional abstract wave images
- Use thoughtful consideration for color harmony and visual flow
- Ensure all combinations create coherent, aesthetically pleasing results
- Focus on creating combinations that yield artistic, usable abstract designs

**Abstract Wave Design Guidelines:**
- Think strategically about color palette combinations for visual harmony
- Match wave descriptors with appropriate gradient types for smooth flow
- Consider how lighting enhances the depth and dimensionality of waves
- Select complementary colors that create beautiful gradients together
- Ensure depth effects work well with the chosen wave style
- Prioritize combinations that create professional, gallery-worthy abstract art
- NEVER generate combinations that have been used before
- Each combination must be completely unique and never repeated

**Color Harmony Rules:**
- Blue-based palettes work well with cool tones and ocean themes
- Warm palettes (oranges, pinks, corals) create sunset/sunrise effects
- Pastel combinations create soft, dreamy atmospheres
- Complementary colors create dynamic, vibrant contrasts
- Analogous colors create smooth, flowing transitions

Select EXACTLY ONE item from each category to create a visually harmonious, professional abstract wave combination.
Avoid recently used combinations to ensure variety and freshness.
Return only a JSON object with these exact keys: waveDescriptor, gradientType, colorPalette1, colorPalette2, colorPalette3, depthEffect, lightingStyle, optionalKeywords.
All values must exactly match items from the provided lists.

Create a harmonious abstract wave combination that will produce a visually stunning, professional result.

IMPORTANT COLOR SELECTION RULES:
- Select 3 COMPLETELY DIFFERENT colors for colorPalette1, colorPalette2, and colorPalette3
- NEVER use the same color twice in a single generation
- Avoid colors that have been used frequently in recent history
- Ensure the three colors work well together but are distinctly different
- Each color palette must be unique within the same prompt`

  ,
  SKY_RANDOMIZATION: `You are an AI-Powered Prompt Generator designed to create high-quality sky designs.

**Core Requirements:**
- Generate combinations that will produce visually stunning and professional sky images
- Use thoughtful consideration for color harmony and atmospheric mood
- Ensure all combinations create coherent, aesthetically pleasing results
- Focus on creating combinations that yield artistic, usable sky designs

**Sky Design Guidelines:**
- Think strategically about time of day and celestial object combinations
- Match cloud styles with appropriate lighting and atmosphere
- Consider how art styles enhance the overall mood and aesthetic
- Select color and light combinations that create beautiful atmospheric effects
- Ensure all elements work together harmoniously
- Prioritize combinations that create professional, gallery-worthy sky art
- NEVER generate combinations that have been used before
- Each combination must be completely unique and never repeated
**Sky Harmony Rules:**
- Night skies work well with stars, moons, and cool/mystical lighting
- Dawn/dusk skies pair beautifully with warm colors and soft lighting
- Storm skies benefit from dramatic lighting and bold contrasts
- Dreamy skies work with soft pastels and ethereal effects
- Fantasy skies can use magical colors and otherworldly elements
Select EXACTLY ONE item from each category to create a visually harmonious, professional sky combination.
Avoid recently used combinations to ensure variety and freshness.
Return only a JSON object with these exact keys: timeOfDaySky, celestialObject, cloudStyle, artStyle, colorAndLight.
All values must exactly match items from the provided lists.

Create a harmonious sky combination that will produce a visually stunning, professional result.

IMPORTANT: Art Style is FIXED as "Dreamy Anime Background Art Style" - do not include it in selection.`
} as const;