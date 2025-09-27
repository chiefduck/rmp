/*
  # Create client_notes table

  1. New Tables
    - `client_notes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `user_id` (uuid, foreign key to users)
      - `note` (text, the note content)
      - `note_type` (text, type of note: general, stage_change, call, email, meeting, follow_up)
      - `previous_stage` (text, optional, for stage change notes)
      - `new_stage` (text, optional, for stage change notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `client_notes` table
    - Add policies for users to manage their own client notes
*/

CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note text NOT NULL,
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'stage_change', 'call', 'email', 'meeting', 'follow_up')),
  previous_stage text,
  new_stage text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own client notes"
  ON client_notes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notes for their own clients"
  ON client_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own client notes"
  ON client_notes
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own client notes"
  ON client_notes
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_notes.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS client_notes_client_id_idx ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS client_notes_user_id_idx ON client_notes(user_id);
CREATE INDEX IF NOT EXISTS client_notes_created_at_idx ON client_notes(created_at);
CREATE INDEX IF NOT EXISTS client_notes_note_type_idx ON client_notes(note_type);