import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  user_id: string
  email: string
  full_name?: string
  company?: string
  phone?: string
  theme: 'light' | 'dark'
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  target_rate?: number
  current_stage: 'prospect' | 'qualified' | 'application' | 'closed'
  loan_amount?: number
  loan_type: '30yr' | 'fha' | 'va' | '15yr'
  credit_score?: number
  notes?: string
  last_contact?: string
  created_at: string
  updated_at: string
}

export interface Mortgage {
  id: string
  user_id: string
  client_id: string
  loan_amount: number
  loan_type: '30yr' | 'fha' | 'va' | '15yr'
  interest_rate: number
  status: 'pending' | 'approved' | 'denied' | 'closed'
  application_date: string
  closing_date?: string
  created_at: string
  updated_at: string
}

export interface RateHistory {
  id: string
  loan_type: '30yr' | 'fha' | 'va' | '15yr'
  rate: number
  date: string
  source: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan_id: string
  current_period_start?: string
  current_period_end?: string
  created_at: string
  updated_at: string
}

export interface AIInteraction {
  id: string
  user_id: string
  message: string
  response: string
  context?: any
  created_at: string
}