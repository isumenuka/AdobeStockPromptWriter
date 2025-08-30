/*
  # User Authentication and Prompt History Tables

  1. New Tables
    - `user_prompts` - Stores all generated prompts for authenticated users
    - Links to Supabase auth.users automatically
    
  2. Security
    - Enable RLS on all tables
    - Users can only access their own prompts
    - Automatic user_id population from auth context
    
  3. Features
    - Complete prompt history storage
    - Search and filter capabilities
    - Export functionality
    - Cross-device synchronization
*/

-- User Prompts Table
CREATE TABLE IF NOT EXISTS user_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('texture', 'abstractwave', 'sky', 'custom')),
  prompt_text text NOT NULL,
  prompt_parameters jsonb NOT NULL DEFAULT '{}',
  title text,
  keywords text[],
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own prompts"
  ON user_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON user_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON user_prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON user_prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX idx_user_prompts_type ON user_prompts(prompt_type);
CREATE INDEX idx_user_prompts_created_at ON user_prompts(created_at DESC);
CREATE INDEX idx_user_prompts_feedback ON user_prompts(user_feedback);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_prompts_updated_at
  BEFORE UPDATE ON user_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();