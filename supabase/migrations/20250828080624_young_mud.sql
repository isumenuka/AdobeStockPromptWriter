/*
  # Add gradientflow to prompt type constraints

  1. Changes
    - Update user_feedback table check constraint to include 'gradientflow'
    - Update ai_training_insights table check constraint to include 'gradientflow'
  
  2. Security
    - No changes to RLS policies needed
*/

-- Update user_feedback table constraint to include gradientflow
ALTER TABLE user_feedback DROP CONSTRAINT IF EXISTS user_feedback_prompt_type_check;
ALTER TABLE user_feedback ADD CONSTRAINT user_feedback_prompt_type_check 
  CHECK (prompt_type = ANY (ARRAY['texture'::text, 'abstractwave'::text, 'sky'::text, 'custom'::text, 'whiteframe'::text, 'gradientflow'::text]));

-- Update ai_training_insights table constraint to include gradientflow
ALTER TABLE ai_training_insights DROP CONSTRAINT IF EXISTS ai_training_insights_prompt_type_check;
ALTER TABLE ai_training_insights ADD CONSTRAINT ai_training_insights_prompt_type_check 
  CHECK (prompt_type = ANY (ARRAY['texture'::text, 'abstractwave'::text, 'sky'::text, 'custom'::text, 'whiteframe'::text, 'gradientflow'::text]));