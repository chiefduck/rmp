// src/lib/blandService.ts - SECURE VERSION (No Direct API Calls)
import { supabase } from './supabase'

export interface BlandCall {
  call_id: string
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'voicemail'
  to: string
  from?: string
  call_length?: number // seconds
  transcript?: string
  recording_url?: string
  error_message?: string
  metadata?: any
}

export interface CallLogEntry {
  id: string
  user_id: string
  client_id: string
  call_type: 'broker' | 'client'
  bland_call_id: string
  phone_number: string
  call_status: string
  call_duration?: number
  transcript?: string
  recording_url?: string
  cost_cents: number
  completed_at?: string
  created_at: string
  updated_at: string
  // Joined data
  client_name?: string
  client_first_name?: string
  client_last_name?: string
}

export class BlandService {
  /**
   * Get call recording URL - SECURE VERSION
   */
  static async getRecording(callId: string): Promise<string> {
    console.log('🎵 Fetching recording via Edge Function')
    
    const { data, error } = await supabase.functions.invoke('get-call-details', {
      body: { callId, type: 'recording' }
    })
    
    if (error) {
      console.error('Recording error:', error)
      throw new Error('Recording not available')
    }
    
    if (!data.success || !data.data) {
      throw new Error('Recording not found')
    }
    
    return data.data.recording_url || data.data.url
  }

  /**
   * Get corrected transcript - SECURE VERSION
   */
  static async getTranscript(callId: string): Promise<string> {
    console.log('📝 Fetching transcript via Edge Function')
    
    const { data, error } = await supabase.functions.invoke('get-call-details', {
      body: { callId, type: 'transcript' }
    })
    
    if (error) {
      console.error('Transcript error:', error)
      throw new Error('Transcript not available')
    }
    
    if (!data.success || !data.data) {
      throw new Error('Transcript not found')
    }
    
    return data.data.transcript || ''
  }

  /**
   * Analyze call emotions - SECURE VERSION
   */
  static async analyzeEmotions(callId: string): Promise<{
    emotion: string
    confidence?: number
  }> {
    console.log('😊 Analyzing emotions via Edge Function')
    
    const { data, error } = await supabase.functions.invoke('get-call-details', {
      body: { callId, type: 'emotions' }
    })
    
    if (error) {
      console.error('Emotion analysis error:', error)
      return { emotion: 'neutral' }
    }
    
    if (!data.success || !data.data) {
      return { emotion: 'neutral' }
    }
    
    return {
      emotion: data.data.data?.emotion || 'neutral',
      confidence: data.data.data?.confidence
    }
  }

  /**
   * Stop an active call - SECURE VERSION
   */
  static async stopCall(callId: string): Promise<void> {
    console.log(`🛑 Stopping call via Edge Function: ${callId}`)
    
    const { data, error } = await supabase.functions.invoke('stop-call', {
      body: { callId }
    })
    
    if (error) {
      console.error('Stop call error:', error)
      throw new Error('Failed to stop call')
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to stop call')
    }
    
    console.log('✅ Call stopped successfully')
  }

  /**
   * Trigger a manual call via Edge Function
   */
  static async makeCall(params: {
    clientId: string
    userId: string
    callType?: 'both' | 'client-only' | 'broker-only'
  }): Promise<{
    success: boolean
    brokerCallId?: string
    clientCallId?: string
    error?: string
  }> {
    const { data, error } = await supabase.functions.invoke('make-call', {
      body: params
    })
    
    if (error) throw error
    return data
  }

  /**
   * Get call logs from database (with client info)
   */
  static async getCallLogs(params?: {
    userId?: string
    clientId?: string
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<CallLogEntry[]> {
    let query = supabase
      .from('call_logs')
      .select(`
        *,
        clients!inner(
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (params?.userId) {
      query = query.eq('user_id', params.userId)
    }
    
    if (params?.clientId) {
      query = query.eq('client_id', params.clientId)
    }
    
    if (params?.status) {
      query = query.eq('call_status', params.status)
    }
    
    if (params?.startDate) {
      query = query.gte('created_at', params.startDate)
    }
    
    if (params?.endDate) {
      query = query.lte('created_at', params.endDate)
    }
    
    if (params?.limit) {
      query = query.limit(params.limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Transform data to include client_name
    return (data || []).map((log: any) => ({
      ...log,
      client_name: `${log.clients.first_name} ${log.clients.last_name}`,
      client_first_name: log.clients.first_name,
      client_last_name: log.clients.last_name
    }))
  }

  /**
   * Get call statistics
   */
  static async getCallStats(userId: string, days: number = 30): Promise<{
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    totalDuration: number
    totalCost: number
    averageDuration: number
    successRate: number
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const logs = await this.getCallLogs({
      userId,
      startDate: startDate.toISOString()
    })
    
    const totalCalls = logs.length
    const successfulCalls = logs.filter(l => 
      l.call_status === 'completed'
    ).length
    const failedCalls = logs.filter(l => 
      ['failed', 'no-answer', 'busy'].includes(l.call_status)
    ).length
    const totalDuration = logs.reduce((sum, l) => sum + (l.call_duration || 0), 0)
    const totalCost = logs.reduce((sum, l) => sum + (l.cost_cents || 0), 0)
    
    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalDuration,
      totalCost,
      averageDuration: successfulCalls > 0 ? totalDuration / successfulCalls : 0,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
    }
  }
}

// Export both named and default
export default BlandService