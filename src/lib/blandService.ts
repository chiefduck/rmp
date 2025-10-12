// src/lib/blandService.ts - Bland AI API Wrapper
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
  private static BLAND_API_URL = 'https://api.bland.ai/v1'
  
  /**
   * Get Bland API key from user profile or environment
   */
  private static async getApiKey(): Promise<string> {
    // Try environment variable first
    const envKey = import.meta.env.VITE_BLAND_API_KEY
    if (envKey) return envKey
    
    // Otherwise get from Supabase secrets (if stored per user)
    const { data } = await supabase.auth.getUser()
    if (!data.user) throw new Error('Not authenticated')
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('bland_api_key')
      .eq('id', data.user.id)
      .single()
    
    if (!profile?.bland_api_key) {
      throw new Error('Bland API key not configured')
    }
    
    return profile.bland_api_key
  }

  /**
   * List all calls with optional filters
   */
  static async listCalls(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<BlandCall[]> {
    const apiKey = await this.getApiKey()
    const queryParams = new URLSearchParams()
    
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.status) queryParams.append('status', params.status)
    
    const response = await fetch(
      `${this.BLAND_API_URL}/calls?${queryParams}`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Bland API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.calls || []
  }

  /**
   * Get details for a specific call
   */
  static async getCallDetails(callId: string): Promise<BlandCall> {
    const apiKey = await this.getApiKey()
    
    const response = await fetch(
      `${this.BLAND_API_URL}/calls/${callId}`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Bland API error: ${response.status}`)
    }
    
    return await response.json()
  }

  /**
   * Get call recording URL or stream
   */
  static async getRecording(callId: string, format: 'mp3' | 'wav' = 'mp3'): Promise<string> {
    const apiKey = await this.getApiKey()
    
    const response = await fetch(
      `${this.BLAND_API_URL}/recordings/${callId}`,
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Recording not found: ${response.status}`)
    }
    
    // Return the URL or blob
    return response.url
  }

  /**
   * Get corrected transcript for a call
   */
  static async getTranscript(callId: string): Promise<string> {
    const apiKey = await this.getApiKey()
    
    const response = await fetch(
      `${this.BLAND_API_URL}/calls/${callId}/corrected-transcript`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Transcript not found: ${response.status}`)
    }
    
    const data = await response.json()
    return data.transcript || ''
  }

  /**
   * Analyze call emotions
   */
  static async analyzeEmotions(callId: string): Promise<{
    emotion: string
    confidence?: number
  }> {
    const apiKey = await this.getApiKey()
    
    const response = await fetch(
      `${this.BLAND_API_URL}/intelligence/emotions`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ callId })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Emotion analysis failed: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      emotion: data.data?.emotion || 'neutral',
      confidence: data.data?.confidence
    }
  }

  /**
   * Stop an active call
   */
  static async stopCall(callId: string): Promise<void> {
    const apiKey = await this.getApiKey()
    
    const response = await fetch(
      `${this.BLAND_API_URL}/calls/${callId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': apiKey
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to stop call: ${response.status}`)
    }
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
      averageDuration: totalCalls > 0 ? totalDuration / totalCalls : 0,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
    }
  }
}

// Export both named and default
export default BlandService
