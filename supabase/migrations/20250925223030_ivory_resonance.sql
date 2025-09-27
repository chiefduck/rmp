/*
  # Add missing company column to profiles table

  1. Changes
    - Add `company` column to profiles table as text type
    - Use IF NOT EXISTS to prevent errors if column already exists

  2. Notes
    - This resolves the "Could not find the 'company' column" error
    - Column is nullable to allow existing profiles without company info
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company text;
  END IF;
END $$;