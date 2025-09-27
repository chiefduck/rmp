/*
  # Add missing columns to clients table

  1. New Columns
    - `loan_amount` (numeric) - The loan amount for the client
    - `current_stage` (text) - The current stage in the sales pipeline
    - `loan_type` (text) - The type of loan (30yr, fha, va, 15yr)
    - `credit_score` (integer) - Client's credit score
    - `target_rate` (numeric) - Target interest rate for the client
    - `notes` (text) - Additional notes about the client
    - `last_contact` (timestamp) - Last contact date

  2. Indexes
    - Add indexes for frequently queried columns

  3. Constraints
    - Add check constraints for valid values
*/

-- Add missing columns to clients table
DO $$
BEGIN
  -- Add loan_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'loan_amount'
  ) THEN
    ALTER TABLE clients ADD COLUMN loan_amount numeric(12,2);
  END IF;

  -- Add current_stage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'current_stage'
  ) THEN
    ALTER TABLE clients ADD COLUMN current_stage text DEFAULT 'prospect';
  END IF;

  -- Add loan_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'loan_type'
  ) THEN
    ALTER TABLE clients ADD COLUMN loan_type text DEFAULT '30yr';
  END IF;

  -- Add credit_score column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'credit_score'
  ) THEN
    ALTER TABLE clients ADD COLUMN credit_score integer;
  END IF;

  -- Add target_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'target_rate'
  ) THEN
    ALTER TABLE clients ADD COLUMN target_rate numeric(5,3);
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'notes'
  ) THEN
    ALTER TABLE clients ADD COLUMN notes text;
  END IF;

  -- Add last_contact column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'last_contact'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_contact timestamp with time zone;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  -- Check constraint for current_stage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clients_current_stage_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_current_stage_check 
    CHECK (current_stage IN ('prospect', 'qualified', 'application', 'closed'));
  END IF;

  -- Check constraint for loan_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clients_loan_type_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_loan_type_check 
    CHECK (loan_type IN ('30yr', 'fha', 'va', '15yr'));
  END IF;

  -- Check constraint for credit_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clients_credit_score_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_credit_score_check 
    CHECK (credit_score >= 300 AND credit_score <= 850);
  END IF;

  -- Check constraint for target_rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clients_target_rate_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_target_rate_check 
    CHECK (target_rate >= 0 AND target_rate <= 15);
  END IF;

  -- Check constraint for loan_amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'clients_loan_amount_check'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_loan_amount_check 
    CHECK (loan_amount > 0);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS clients_current_stage_idx ON clients(current_stage);
CREATE INDEX IF NOT EXISTS clients_loan_type_idx ON clients(loan_type);
CREATE INDEX IF NOT EXISTS clients_target_rate_idx ON clients(target_rate);
CREATE INDEX IF NOT EXISTS clients_last_contact_idx ON clients(last_contact);