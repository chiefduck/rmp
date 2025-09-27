/*
  # Fix stripe_customers INSERT policy

  1. Security Updates
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows authenticated users to create their own customer records
    - Ensure the policy uses the correct auth.uid() function
    
  2. Policy Changes
    - Allow INSERT for authenticated users where user_id matches auth.uid()
    - Keep existing SELECT and UPDATE policies intact
*/

-- Drop the existing INSERT policy that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own customer data" ON stripe_customers;

-- Create a new INSERT policy that allows authenticated users to create their own customer records
CREATE POLICY "Allow authenticated users to insert own customer data"
  ON stripe_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure the UPDATE policy exists and is correct
DROP POLICY IF EXISTS "Users can update own customer data" ON stripe_customers;
CREATE POLICY "Allow authenticated users to update own customer data"
  ON stripe_customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the SELECT policy exists and is correct
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Allow authenticated users to view own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);