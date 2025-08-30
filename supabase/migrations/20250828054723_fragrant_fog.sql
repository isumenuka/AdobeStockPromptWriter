/*
  # Add whiteframe prompt type support

  1. Changes
    - Update user_prompts table check constraint to include 'whiteframe'
    - Update user_feedback table check constraint to include 'whiteframe'  
    - Update ai_training_insights table check constraint to include 'whiteframe'

  2. Security
    - No changes to existing RLS policies needed
    - All existing security remains intact
*/

-- Update user_prompts table constraint
ALTER TABLE user_prompts DROP CONSTRAINT IF EXISTS user_prompts_prompt_type_check;
ALTER TABLE user_prompts ADD CONSTRAINT user_prompts_prompt_type_check 
  CHECK (prompt_type = ANY (ARRAY['texture'::text, 'abstractwave'::text, 'sky'::text, 'custom'::text, 'whiteframe'::text]));

-- Update user_feedback table constraint  
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_prompt_type_check;
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_prompt_type_check
  CHECK (prompt_type = ANY (ARRAY['texture'::text, 'abstractwave'::text, 'sky'::text, 'custom'::text, 'whiteframe'::text]));

-- Update ai_training_insights table constraint
ALTER TABLE ai_training_insights DROP CONSTRAINT IF EXISTS ai_training_insights_prompt_type_check;
ALTER TABLE ai_training_insights ADD CONSTRAINT ai_training_insights_prompt_type_check
  CHECK (prompt_type = ANY (ARRAY['texture'::text, 'abstractwave'::text, 'sky'::text, 'custom'::text, 'whiteframe'::text]));