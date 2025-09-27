/*
  # Add theme column to profiles table

  1. New Columns
    - `theme` (text) - User's preferred theme (light/dark)
    - `notifications_enabled` (boolean) - User's notification preferences

  2. Changes
    - Add theme column with default value 'light'
    - Add notifications_enabled column with default value true
    - Add check constraint to ensure theme is either 'light' or 'dark'
*/

-- Add theme column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'light';
    ALTER TABLE profiles ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('light', 'dark'));
  END IF;
END $$;

-- Add notifications_enabled column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;
END $$;