import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  company?: string
  company_name?: string  // You have both company and company_name
  phone?: string
  created_at?: string
  updated_at?: string
  ghl_location_id?: string
  ghl_rmp_contact_id?: string
  timezone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  website?: string
  has_seen_welcome?: boolean
  theme?: 'light' | 'dark'
  notifications_enabled?: boolean
}

export interface Client {
  id: string
  user_id: string
  broker_id: string
  first_name: string
  last_name: string
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
  // Computed field for display
  name?: string
}

export interface ClientNote {
  id: string
  client_id: string
  user_id: string
  note: string
  note_type: 'general' | 'stage_change' | 'call' | 'email' | 'meeting' | 'follow_up'
  previous_stage?: string
  new_stage?: string
  created_at: string
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
  refi_eligible_date?: string  // ← ADDED
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

export interface EmailPreferences {
  id: string
  user_id: string
  rate_alerts: boolean
  weekly_reports: boolean
  client_updates: boolean
  market_insights: boolean
  product_updates: boolean
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  in_app_notifications: boolean
  rate_alerts: boolean
  call_results: boolean
  system_updates: boolean
  created_at: string
  updated_at: string
}