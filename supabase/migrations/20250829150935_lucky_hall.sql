/*
  # Email Access Management System

  1. New Tables
    - `allowed_emails`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `added_by` (uuid, foreign key to auth.users)
      - `status` (text) - 'active', 'revoked'
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `allowed_emails` table
    - Only owner can manage email access
    - Public read access for checking email authorization

  3. Features
    - Add/remove email addresses
    - Track who added each email
    - Optional notes for each email
    - Status management (active/revoked)
*/

-- Create allowed_emails table
CREATE TABLE IF NOT EXISTS allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can check email access"
  ON allowed_emails
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Owner can manage all emails"
  ON allowed_emails
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'isumenuka@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'isumenuka@gmail.com'
  );

-- Create indexes
CREATE INDEX idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX idx_allowed_emails_status ON allowed_emails(status);
CREATE INDEX idx_allowed_emails_created_at ON allowed_emails(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_allowed_emails_updated_at
  BEFORE UPDATE ON allowed_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert owner email as default
INSERT INTO allowed_emails (email, status, notes) 
VALUES ('isumenuka@gmail.com', 'active', 'Owner - permanent access')
ON CONFLICT (email) DO NOTHING;