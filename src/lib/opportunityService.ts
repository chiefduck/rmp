import { supabase } from './supabase'

export interface OpportunityScore {
  clientId: string
  clientName: string
  phone: string
  email: string
  loanAmount: number
  currentRate: number
  targetRate: number
  savingsMonthly: number
  savingsAnnual: number
  daysSinceContact: number
  pipelineStage: string
  score: number
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  reasoning: string[]
  callRecommendation: string
}

interface Client {
  id: string
  name: string
  first_name?: string
  last_name?: string
  phone: string
  email: string
  loan_amount: number
  current_rate?: number
  target_rate: number
  current_stage: string
  last_contact?: string
  notes?: string
}

function calculateFinancialScore(savingsMonthly: number): number {
  if (savingsMonthly >= 500) return 50
  if (savingsMonthly >= 400) return 45
  if (savingsMonthly >= 300) return 40
  if (savingsMonthly >= 200) return 35
  if (savingsMonthly >= 150) return 30
  if (savingsMonthly >= 100) return 25
  if (savingsMonthly >= 75) return 20
  if (savingsMonthly >= 50) return 15
  return Math.max(0, Math.floor(savingsMonthly / 5))
}

function calculateUrgencyScore(daysSinceContact: number): number {
  if (daysSinceContact >= 30) return 25
  if (daysSinceContact >= 21) return 20
  if (daysSinceContact >= 14) return 15
  if (daysSinceContact >= 7) return 10
  if (daysSinceContact >= 3) return 5
  return 0
}

function calculatePipelineScore(stage: string): number {
  if (!stage) return 5
  
  const stageScores: Record<string, number> = {
    'application': 15,
    'qualified': 12,
    'contacted': 8,
    'new': 5,
    'nurture': 3,
    'closed': 2,
    'lost': 0
  }
  return stageScores[stage.toLowerCase()] || 5
}

function calculateTargetHitBonus(currentMarketRate: number, targetRate: number): number {
  if (currentMarketRate <= targetRate) return 10
  if (currentMarketRate <= targetRate + 0.125) return 5
  return 0
}

function calculateLoanMultiplier(loanAmount: number): number {
  if (loanAmount >= 750000) return 1.3
  if (loanAmount >= 500000) return 1.2
  if (loanAmount >= 300000) return 1.1
  return 1.0
}

function calculateMonthlySavings(
  loanAmount: number,
  currentRate: number,
  newRate: number
): number {
  const months = 360
  
  const currentMonthlyRate = currentRate / 100 / 12
  const currentPayment = loanAmount * 
    (currentMonthlyRate * Math.pow(1 + currentMonthlyRate, months)) / 
    (Math.pow(1 + currentMonthlyRate, months) - 1)
  
  const newMonthlyRate = newRate / 100 / 12
  const newPayment = loanAmount * 
    (newMonthlyRate * Math.pow(1 + newMonthlyRate, months)) / 
    (Math.pow(1 + newMonthlyRate, months) - 1)
  
  return Math.max(0, currentPayment - newPayment)
}

function calculateDaysSinceContact(lastContact?: string): number {
  if (!lastContact) return 999
  
  const lastContactDate = new Date(lastContact)
  const today = new Date()
  const diffTime = today.getTime() - lastContactDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

function determineUrgencyLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

function generateReasoning(
  savingsMonthly: number,
  daysSinceContact: number,
  pipelineStage: string,
  targetHit: boolean,
  loanAmount: number
): string[] {
  const reasons: string[] = []
  
  if (targetHit) {
    reasons.push('🎯 TARGET RATE HIT! Client should be notified immediately')
  }
  
  if (savingsMonthly >= 300) {
    reasons.push(`💰 High savings potential: $${Math.round(savingsMonthly)}/month`)
  } else if (savingsMonthly >= 150) {
    reasons.push(`💵 Good savings: $${Math.round(savingsMonthly)}/month`)
  }
  
  if (daysSinceContact >= 30) {
    reasons.push(`⏰ No contact in ${daysSinceContact} days - follow up needed`)
  } else if (daysSinceContact >= 14) {
    reasons.push(`📅 ${daysSinceContact} days since last contact`)
  }
  
  if (pipelineStage === 'application' || pipelineStage === 'qualified') {
    reasons.push(`🔥 Hot lead: ${pipelineStage} stage`)
  }
  
  if (loanAmount >= 500000) {
    reasons.push(`🏠 Large loan: $${(loanAmount / 1000).toFixed(0)}K`)
  }
  
  return reasons
}

function generateCallRecommendation(
  savingsMonthly: number,
  targetHit: boolean,
  pipelineStage: string
): string {
  if (targetHit) {
    return `URGENT: Rates hit their target! Call immediately to discuss refinancing. Lead with: "Great news! Rates just dropped to ${savingsMonthly > 0 ? `your target, saving you $${Math.round(savingsMonthly)}/month` : 'your target rate'}."`
  }
  
  if (pipelineStage === 'application') {
    return `Check in on application status. Mention current rate environment and potential to lock in at a better rate.`
  }
  
  if (pipelineStage === 'qualified') {
    return `Client is pre-qualified. Discuss current market conditions and savings of $${Math.round(savingsMonthly)}/month.`
  }
  
  if (savingsMonthly >= 300) {
    return `Strong financial incentive. Lead with savings: "I found an opportunity to save you $${Math.round(savingsMonthly)} per month. Do you have 5 minutes?"`
  }
  
  return `Friendly check-in. Ask about their plans and mention potential savings of $${Math.round(savingsMonthly)}/month.`
}

export async function scoreClient(
  client: Client,
  currentMarketRate: number
): Promise<OpportunityScore> {
  const clientCurrentRate = client.current_rate || (client.target_rate + 1)
  
  const savingsMonthly = calculateMonthlySavings(
    client.loan_amount,
    clientCurrentRate,
    currentMarketRate
  )
  const savingsAnnual = savingsMonthly * 12
  
  const financialScore = calculateFinancialScore(savingsMonthly)
  const daysSinceContact = calculateDaysSinceContact(client.last_contact)
  const urgencyScore = calculateUrgencyScore(daysSinceContact)
  const pipelineScore = calculatePipelineScore(client.current_stage)
  const targetHitBonus = calculateTargetHitBonus(currentMarketRate, client.target_rate)
  const loanMultiplier = calculateLoanMultiplier(client.loan_amount)
  
  const baseScore = financialScore + urgencyScore + pipelineScore + targetHitBonus
  const finalScore = Math.round(baseScore * loanMultiplier)
  
  const targetHit = currentMarketRate <= client.target_rate
  const reasoning = generateReasoning(
    savingsMonthly,
    daysSinceContact,
    client.current_stage,
    targetHit,
    client.loan_amount
  )
  
  const clientName = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown Client'
  
  return {
    clientId: client.id,
    clientName,
    phone: client.phone,
    email: client.email,
    loanAmount: client.loan_amount,
    currentRate: clientCurrentRate,
    targetRate: client.target_rate,
    savingsMonthly,
    savingsAnnual,
    daysSinceContact,
    pipelineStage: client.current_stage,
    score: finalScore,
    urgencyLevel: determineUrgencyLevel(finalScore),
    reasoning,
    callRecommendation: generateCallRecommendation(savingsMonthly, targetHit, client.current_stage)
  }
}

export async function getTopOpportunities(
  userId: string,
  limit: number = 10
): Promise<OpportunityScore[]> {
  try {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      throw clientsError
    }
    
    if (!clients || clients.length === 0) {
      return []
    }
    
    const { data: rateData, error: ratesError } = await supabase
      .from('rate_history')
      .select('rate_value')
      .eq('rate_type', 'fixed')
      .eq('loan_type', 'conventional')
      .eq('term_years', 30)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (ratesError) {
      console.error('Error fetching rates:', ratesError)
      throw new Error('Unable to fetch current market rates.')
    }
    
    if (!rateData || !rateData.rate_value) {
      throw new Error('No market rate data available.')
    }
    
    const currentMarketRate = Number(rateData.rate_value)
    
    const scoredOpportunities = await Promise.all(
      clients.map(client => scoreClient(client, currentMarketRate))
    )
    
    const topOpportunities = scoredOpportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return topOpportunities
    
  } catch (error) {
    console.error('Error getting top opportunities:', error)
    throw error
  }
}

export async function getOpportunityStats(userId: string): Promise<{
  critical: number
  high: number
  medium: number
  low: number
  total: number
}> {
  try {
    const opportunities = await getTopOpportunities(userId, 100)
    
    return {
      critical: opportunities.filter(o => o.urgencyLevel === 'critical').length,
      high: opportunities.filter(o => o.urgencyLevel === 'high').length,
      medium: opportunities.filter(o => o.urgencyLevel === 'medium').length,
      low: opportunities.filter(o => o.urgencyLevel === 'low').length,
      total: opportunities.length
    }
    
  } catch (error) {
    console.error('Error getting opportunity stats:', error)
    return { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  }
}