/*
  # Add name column to clients table

  1. Changes
    - Add `name` column to clients table as NOT NULL with default value
    - Use IF NOT EXISTS to prevent errors if column already exists
    - Set default value for existing rows to handle NOT NULL constraint

  2. Notes
    - This resolves the "Could not find the 'name' column" error
    - Existing clients will get 'Unnamed Client' as default name
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'name'
  ) THEN
    ALTER TABLE clients ADD COLUMN name text NOT NULL DEFAULT 'Unnamed Client';
  END IF;
END $$;