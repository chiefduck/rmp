// src/lib/crmInsights.ts
import { Client } from './supabase'

export interface PipelineInsights {
  staleLeads: Client[]
  readyToAdvance: Client[]
  needFollowUp: Client[]
  closingSoon: Client[]
  totalPipelineValue: number
  hotLeads: Client[]
  coldLeads: Client[]
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
 * Analyze active pipeline and return insights
 */
export function analyzePipeline(activeClients: Client[]): PipelineInsights {
  // Filter out non-active clients
  const active = activeClients.filter(c => c.status === 'active')
  
  // STALE LEADS: New/Prospect stage + no contact in 14+ days (or never contacted)
  const staleLeads = active.filter(client => {
    const stages = ['new', 'prospect']
    const daysSince = getDaysSinceContact(client.last_contact)
    return stages.includes(client.current_stage || '') && daysSince >= 14
  })
  
  // READY TO ADVANCE: Qualified stage + contacted within last 7 days (hot leads!)
  const readyToAdvance = active.filter(client => {
    const stages = ['qualified']
    const daysSince = getDaysSinceContact(client.last_contact)
    return stages.includes(client.current_stage || '') && daysSince <= 7
  })
  
  // NEED FOLLOW-UP: Application stage + no contact in 7+ days
  const needFollowUp = active.filter(client => {
    const stages = ['application']
    const daysSince = getDaysSinceContact(client.last_contact)
    return stages.includes(client.current_stage || '') && daysSince >= 7
  })
  
  // CLOSING SOON: Currently in closing stage
  const closingSoon = active.filter(client => client.current_stage === 'closing')
  
  // TOTAL PIPELINE VALUE: Sum of all loan amounts
  const totalPipelineValue = active.reduce((sum, client) => {
    const amount = client.loan_amount || 0
    return sum + Number(amount)
  }, 0)
  
  // HOT LEADS: Recently contacted + good stage
  const hotLeads = active.filter(client => {
    const daysSince = getDaysSinceContact(client.last_contact)
    const goodStages = ['qualified', 'application', 'closing']
    return daysSince <= 7 && goodStages.includes(client.current_stage || '')
  })
  
  // COLD LEADS: No contact in 30+ days
  const coldLeads = active.filter(client => {
    const daysSince = getDaysSinceContact(client.last_contact)
    return daysSince >= 30
  })
  
  return {
    staleLeads,
    readyToAdvance,
    needFollowUp,
    closingSoon,
    totalPipelineValue,
    hotLeads,
    coldLeads
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