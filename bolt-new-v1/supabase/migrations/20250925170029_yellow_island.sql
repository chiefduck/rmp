/*
  # Rate Monitor Pro Database Schema

  1. New Tables
    - `profiles`
      - User profile information and preferences
      - Links to Supabase auth.users
    - `clients` 
      - CRM client management with pipeline stages
      - Target rates and contact information
    - `mortgages`
      - Mortgage application tracking
      - Loan details and status
    - `rate_history`
      - Historical mortgage rate data
      - Different loan types and rates over time
    - `subscriptions`
      - Stripe subscription management
      - Plan details and billing status
    - `ai_interactions`
      - Chat history and AI insights
      - User interaction tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Profiles table for user data
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company text,
  phone text,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Clients table for CRM
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  target_rate decimal(5,3),
  current_stage text DEFAULT 'prospect' CHECK (current_stage IN ('prospect', 'qualified', 'application', 'closed')),
  loan_amount decimal(12,2),
  loan_type text DEFAULT '30yr' CHECK (loan_type IN ('30yr', 'fha', 'va', '15yr')),
  credit_score integer,
  notes text,
  last_contact timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mortgages table for tracking applications
CREATE TABLE IF NOT EXISTS mortgages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  loan_amount decimal(12,2) NOT NULL,
  loan_type text NOT NULL CHECK (loan_type IN ('30yr', 'fha', 'va', '15yr')),
  interest_rate decimal(5,3) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'closed')),
  application_date timestamptz DEFAULT now(),
  closing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rate history for monitoring trends
CREATE TABLE IF NOT EXISTS rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_type text NOT NULL CHECK (loan_type IN ('30yr', 'fha', 'va', '15yr')),
  rate decimal(5,3) NOT NULL,
  date timestamptz DEFAULT now(),
  source text DEFAULT 'api'
);

-- Subscriptions for billing
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  plan_id text DEFAULT 'pro_monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- AI interactions for chat history
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);

-- Policies for clients
CREATE POLICY "Users can manage their own clients"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

-- Policies for mortgages
CREATE POLICY "Users can manage their own mortgages"
  ON mortgages FOR ALL
  USING (auth.uid() = user_id);

-- Policies for rate_history (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read rate history"
  ON rate_history FOR SELECT
  TO authenticated
  USING (true);

-- Policies for subscriptions
CREATE POLICY "Users can manage their own subscription"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Policies for AI interactions
CREATE POLICY "Users can manage their own AI interactions"
  ON ai_interactions FOR ALL
  USING (auth.uid() = user_id);

-- Insert sample rate data
INSERT INTO rate_history (loan_type, rate) VALUES
  ('30yr', 7.25),
  ('fha', 6.95),
  ('va', 6.85),
  ('15yr', 6.75);