/*
  # Create Separate Tables for Each Generator Type

  1. New Tables
    - `texture_prompts` - For texture generator prompts
    - `abstractwave_prompts` - For abstract wave generator prompts  
    - `sky_prompts` - For sky generator prompts
    - `whiteframe_prompts` - For white frame generator prompts
    - `custom_prompts` - For custom prompts

  2. Features
    - User-wise separation with foreign keys to auth.users
    - Generator-specific columns for each type
    - Proper indexing for performance
    - Row Level Security (RLS) enabled
    - Audit fields (created_at, updated_at)
    - Feedback tracking for AI training

  3. Security
    - RLS policies for user data isolation
    - Users can only access their own data
    - Proper foreign key constraints
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create texture_prompts table
CREATE TABLE IF NOT EXISTS texture_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prompt data
  prompt_text text NOT NULL,
  title text,
  keywords text[],
  
  -- Texture-specific parameters
  material_type text NOT NULL,
  primary_color_tone text NOT NULL,
  secondary_color_tone text NOT NULL,
  lighting_style text NOT NULL,
  
  -- User feedback for AI training
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create abstractwave_prompts table
CREATE TABLE IF NOT EXISTS abstractwave_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prompt data
  prompt_text text NOT NULL,
  title text,
  keywords text[],
  
  -- AbstractWave-specific parameters
  wave_descriptor text NOT NULL,
  gradient_type text NOT NULL,
  color_palette_1 text NOT NULL,
  color_palette_2 text NOT NULL,
  color_palette_3 text NOT NULL,
  depth_effect text NOT NULL,
  lighting_style text NOT NULL,
  optional_keywords text NOT NULL,
  
  -- User feedback for AI training
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create sky_prompts table
CREATE TABLE IF NOT EXISTS sky_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prompt data
  prompt_text text NOT NULL,
  title text,
  keywords text[],
  
  -- Sky-specific parameters
  time_of_day_sky text NOT NULL,
  celestial_object text NOT NULL,
  cloud_style text NOT NULL,
  art_style text NOT NULL,
  color_and_light text NOT NULL,
  
  -- User feedback for AI training
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create whiteframe_prompts table
CREATE TABLE IF NOT EXISTS whiteframe_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prompt data
  prompt_text text NOT NULL,
  title text,
  keywords text[],
  
  -- White Frame-specific parameters
  frame_number text NOT NULL,
  frame_orientation text NOT NULL,
  wall_color text NOT NULL,
  main_furniture_piece text NOT NULL,
  additional_furniture_piece text NOT NULL,
  lighting_description text NOT NULL,
  atmosphere_description text NOT NULL,
  aspect_ratio text NOT NULL,
  
  -- User feedback for AI training
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create custom_prompts table
CREATE TABLE IF NOT EXISTS custom_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Prompt data
  prompt_text text NOT NULL,
  title text NOT NULL,
  keywords text[] NOT NULL,
  
  -- User feedback for AI training
  user_feedback text CHECK (user_feedback IN ('like', 'dislike', 'neutral')),
  
  -- Audit fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_texture_prompts_user_id ON texture_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_texture_prompts_created_at ON texture_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_texture_prompts_feedback ON texture_prompts(user_feedback);

CREATE INDEX IF NOT EXISTS idx_abstractwave_prompts_user_id ON abstractwave_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_abstractwave_prompts_created_at ON abstractwave_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abstractwave_prompts_feedback ON abstractwave_prompts(user_feedback);

CREATE INDEX IF NOT EXISTS idx_sky_prompts_user_id ON sky_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_sky_prompts_created_at ON sky_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sky_prompts_feedback ON sky_prompts(user_feedback);

CREATE INDEX IF NOT EXISTS idx_whiteframe_prompts_user_id ON whiteframe_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteframe_prompts_created_at ON whiteframe_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whiteframe_prompts_feedback ON whiteframe_prompts(user_feedback);

CREATE INDEX IF NOT EXISTS idx_custom_prompts_user_id ON custom_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_prompts_created_at ON custom_prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_prompts_feedback ON custom_prompts(user_feedback);

-- Enable Row Level Security (RLS)
ALTER TABLE texture_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abstractwave_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sky_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteframe_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for texture_prompts
CREATE POLICY "Users can view own texture prompts"
  ON texture_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own texture prompts"
  ON texture_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own texture prompts"
  ON texture_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own texture prompts"
  ON texture_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for abstractwave_prompts
CREATE POLICY "Users can view own abstractwave prompts"
  ON abstractwave_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own abstractwave prompts"
  ON abstractwave_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own abstractwave prompts"
  ON abstractwave_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own abstractwave prompts"
  ON abstractwave_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for sky_prompts
CREATE POLICY "Users can view own sky prompts"
  ON sky_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sky prompts"
  ON sky_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sky prompts"
  ON sky_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sky prompts"
  ON sky_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for whiteframe_prompts
CREATE POLICY "Users can view own whiteframe prompts"
  ON whiteframe_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whiteframe prompts"
  ON whiteframe_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whiteframe prompts"
  ON whiteframe_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own whiteframe prompts"
  ON whiteframe_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for custom_prompts
CREATE POLICY "Users can view own custom prompts"
  ON custom_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom prompts"
  ON custom_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom prompts"
  ON custom_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom prompts"
  ON custom_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_texture_prompts_updated_at
  BEFORE UPDATE ON texture_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abstractwave_prompts_updated_at
  BEFORE UPDATE ON abstractwave_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sky_prompts_updated_at
  BEFORE UPDATE ON sky_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whiteframe_prompts_updated_at
  BEFORE UPDATE ON whiteframe_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_prompts_updated_at
  BEFORE UPDATE ON custom_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();