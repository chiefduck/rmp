/*
  # Add subscription_status column to stripe_subscriptions table

  1. Changes
    - Add `subscription_status` column to `stripe_subscriptions` table
    - Set it as NOT NULL with default value 'not_started'
    - Use the stripe_subscription_status enum type that already exists
    - Update existing rows to use the current `status` values if they exist

  2. Notes
    - This resolves the frontend error where code expects `subscription_status` column
    - The existing `status` column remains for backward compatibility
    - Uses the existing enum type for data consistency
*/

-- Add the subscription_status column using the existing enum type
ALTER TABLE public.stripe_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_status stripe_subscription_status NOT NULL DEFAULT 'not_started';

-- Update existing rows to copy status to subscription_status if status exists
UPDATE public.stripe_subscriptions 
SET subscription_status = status::stripe_subscription_status 
WHERE status IS NOT NULL;