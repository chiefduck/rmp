/*
  # Comprehensive Database Schema and RLS Fix

  This migration ensures all required columns exist and RLS policies are properly configured
  for the Rate Monitor Pro application.

  ## Changes Made:
  1. Fix clients table - ensure user_id column exists (currently using broker_id)
  2. Fix stripe_subscriptions table - ensure proper status column
  3. Update all RLS policies to work correctly
  4. Add missing columns where needed
*/

-- First, let's check and fix the clients table structure
-- The current schema shows clients.broker_id but the app expects clients.user_id

DO $$
BEGIN
  -- Check if user_id column exists in clients table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    -- Add user_id column and copy data from broker_id
    ALTER TABLE clients ADD COLUMN user_id uuid;
    
    -- Copy existing broker_id values to user_id
    UPDATE clients SET user_id = broker_id;
    
    -- Make user_id NOT NULL and add foreign key constraint
    ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE clients ADD CONSTRAINT clients_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id);
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
  END IF;
END $$;

-- Fix stripe_customers RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to insert own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Allow authenticated users to update own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Allow authenticated users to view own customer data" ON stripe_customers;

-- Create proper RLS policies for stripe_customers
CREATE POLICY "Users can insert own customer data" ON stripe_customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer data" ON stripe_customers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own customer data" ON stripe_customers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Fix stripe_subscriptions table and RLS policies
-- Ensure the status column has proper default and constraints
ALTER TABLE stripe_subscriptions 
  ALTER COLUMN status SET DEFAULT 'not_started'::stripe_subscription_status;

-- Drop and recreate RLS policies for stripe_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to create their own subscription" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to read their own subscription" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON stripe_subscriptions;

-- Create comprehensive RLS policies for stripe_subscriptions
CREATE POLICY "Users can view own subscriptions" ON stripe_subscriptions
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) 
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert own subscriptions" ON stripe_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update own subscriptions" ON stripe_subscriptions
  FOR UPDATE TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Fix clients table RLS policies to use user_id instead of broker_id
DROP POLICY IF EXISTS "Brokers can create own clients" ON clients;
DROP POLICY IF EXISTS "Brokers can delete own clients" ON clients;
DROP POLICY IF EXISTS "Brokers can update own clients" ON clients;
DROP POLICY IF EXISTS "Brokers can view own clients" ON clients;

-- Create new RLS policies for clients using user_id
CREATE POLICY "Users can create own clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Fix mortgages table RLS policies to work with the new clients.user_id structure
DROP POLICY IF EXISTS "Brokers can create client mortgages" ON mortgages;
DROP POLICY IF EXISTS "Brokers can delete client mortgages" ON mortgages;
DROP POLICY IF EXISTS "Brokers can update client mortgages" ON mortgages;
DROP POLICY IF EXISTS "Brokers can view client mortgages" ON mortgages;

-- Create new RLS policies for mortgages
CREATE POLICY "Users can create client mortgages" ON mortgages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = mortgages.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view client mortgages" ON mortgages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = mortgages.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update client mortgages" ON mortgages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = mortgages.client_id 
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = mortgages.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client mortgages" ON mortgages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = mortgages.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Ensure all tables have RLS enabled
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;

-- Add service role policies for webhook operations
CREATE POLICY "Service role can manage stripe data" ON stripe_customers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage subscriptions" ON stripe_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON stripe_subscriptions TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON mortgages TO authenticated;