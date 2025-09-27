/*
  # Fix RLS policies for stripe_customers table

  1. Security Changes
    - Add INSERT policy for authenticated users to create their own customer records
    - Ensure proper RLS policies exist for SELECT and UPDATE operations
    - Allow users to manage their own stripe customer data

  This fixes the RLS violation error when users try to create trial subscriptions.
*/

-- Enable RLS on stripe_customers table (if not already enabled)
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Users can update own customer data" ON stripe_customers;

-- Allow authenticated users to insert their own customer records
CREATE POLICY "Users can insert own customer data"
  ON stripe_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own customer records
CREATE POLICY "Users can update own customer data"
  ON stripe_customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The SELECT policy already exists and is correct:
-- "Users can view their own customer data" with USING (auth.uid() = user_id)