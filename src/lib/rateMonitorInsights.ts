// src/lib/rateMonitorInsights.ts

export interface MortgageWithDetails {
  id: string
  client_id: string
  client_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  current_rate: number
  target_rate: number
  loan_amount: number
  term_years: number
  start_date: string
  lender: string
  notes?: string
  refi_eligible_date?: string
  created_at: string
  updated_at: string
  last_contact?: string
  last_ai_call?: string
  total_ai_calls?: number
  market_rate?: number
  savings_potential?: number
}

export interface RateMonitorInsights {
  targetHits: MortgageWithDetails[]
  closeToTarget: MortgageWithDetails[]
  aiCallsThisWeek: number
  staleMonitoring: MortgageWithDetails[]
  totalPotentialSavings: number
  allMonitored: number
  activeOpportunities: number
}

/**
 * Calculate monthly payment for a mortgage
 */
function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12
  const numPayments = termYears * 12
  
  if (monthlyRate === 0) return principal / numPayments
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  
  return payment
}

/**
 * Calculate monthly savings from refinancing
 */
export function calculateMonthlySavings(
  loanAmount: number,
  currentRate: number,
  newRate: number,
  termYears: number = 30
): number {
  if (currentRate <= newRate) return 0
  
  const currentPayment = calculateMonthlyPayment(loanAmount, currentRate, termYears)
  const newPayment = calculateMonthlyPayment(loanAmount, newRate, termYears)
  
  return Math.round(currentPayment - newPayment)
}

/**
 * Calculate days since last contact
 */
function getDaysSinceContact(lastContact?: string): number {
  if (!lastContact) return 999
  
  const lastContactDate = new Date(lastContact)
  const today = new Date()
  const diffTime = today.getTime() - lastContactDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Calculate days since last AI call
 */
function getDaysSinceAICall(lastAICall?: string): number {
  if (!lastAICall) return 999
  
  const lastCallDate = new Date(lastAICall)
  const today = new Date()
  const diffTime = today.getTime() - lastCallDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Count AI calls in the last 7 days
 */
function countRecentAICalls(mortgages: MortgageWithDetails[]): number {
  return mortgages.filter(m => {
    const daysSinceCall = getDaysSinceAICall(m.last_ai_call)
    return daysSinceCall <= 7
  }).length
}

/**
 * Analyze mortgages for rate monitoring insights
 */
export function analyzeRateMonitoring(
  mortgages: MortgageWithDetails[],
  currentMarketRate: number = 6.5 // Default if not provided
): RateMonitorInsights {
  
  // TARGET HITS: Market rate at or below target rate
  const targetHits = mortgages.filter(m => {
    const marketRate = m.market_rate || currentMarketRate
    return marketRate <= m.target_rate
  })
  
  // CLOSE TO TARGET: Within 0.25% of target rate (but not hit yet)
  const closeToTarget = mortgages.filter(m => {
    const marketRate = m.market_rate || currentMarketRate
    return marketRate > m.target_rate && marketRate <= (m.target_rate + 0.25)
  })
  
  // AI CALLS THIS WEEK: Count of calls in last 7 days
  const aiCallsThisWeek = countRecentAICalls(mortgages)
  
  // STALE MONITORING: No contact in 60+ days
  const staleMonitoring = mortgages.filter(m => {
    const daysSinceContact = getDaysSinceContact(m.last_contact)
    const daysSinceAICall = getDaysSinceAICall(m.last_ai_call)
    
    // Consider stale if BOTH manual contact and AI calls are 60+ days old
    return Math.min(daysSinceContact, daysSinceAICall) >= 60
  })
  
  // TOTAL POTENTIAL SAVINGS: Sum of monthly savings for all target hits
  const totalPotentialSavings = targetHits.reduce((sum, m) => {
    const marketRate = m.market_rate || currentMarketRate
    const savings = calculateMonthlySavings(
      m.loan_amount,
      m.current_rate,
      marketRate,
      m.term_years
    )
    return sum + savings
  }, 0)
  
  // ACTIVE OPPORTUNITIES: Target hits + close to target
  const activeOpportunities = targetHits.length + closeToTarget.length
  
  return {
    targetHits,
    closeToTarget,
    aiCallsThisWeek,
    staleMonitoring,
    totalPotentialSavings,
    allMonitored: mortgages.length,
    activeOpportunities
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

/**
 * Get refi eligibility status
 */
export function getRefiEligibility(refiEligibleDate?: string): {
  eligible: boolean
  daysUntil: number
  message: string
} {
  if (!refiEligibleDate) {
    return {
      eligible: true,
      daysUntil: 0,
      message: 'Eligible now'
    }
  }
  
  const eligibleDate = new Date(refiEligibleDate)
  const today = new Date()
  const diffTime = eligibleDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return {
      eligible: true,
      daysUntil: 0,
      message: 'Eligible now'
    }
  }
  
  return {
    eligible: false,
    daysUntil: diffDays,
    message: `Eligible in ${diffDays} days`
  }
}