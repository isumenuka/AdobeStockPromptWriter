/*
  # Create CSV Projects Table

  1. New Tables
    - `csv_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_name` (text)
      - `description` (text, optional)
      - `csv_data` (jsonb array of CSV rows)
      - `total_rows` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `csv_projects` table
    - Add policies for authenticated users to manage their own projects

  3. Performance
    - Add indexes for user queries and sorting
    - Add trigger for auto-updating timestamps
*/

-- Create CSV projects table
CREATE TABLE IF NOT EXISTS csv_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  description text,
  csv_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_rows integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE csv_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own CSV projects"
  ON csv_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CSV projects"
  ON csv_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CSV projects"
  ON csv_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CSV projects"
  ON csv_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_csv_projects_user_id ON csv_projects(user_id);
CREATE INDEX idx_csv_projects_created_at ON csv_projects(created_at DESC);
CREATE INDEX idx_csv_projects_updated_at ON csv_projects(updated_at DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_csv_projects_updated_at
  BEFORE UPDATE ON csv_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();