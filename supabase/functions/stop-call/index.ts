// supabase/functions/stop-call/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { callId } = await req.json()
    
    if (!callId) {
      throw new Error('callId is required')
    }

    const BLAND_API_KEY = Deno.env.get('BLAND_API_KEY')
    
    if (!BLAND_API_KEY) {
      throw new Error('BLAND_API_KEY not configured')
    }

    console.log(`🛑 Stopping call: ${callId}`)

    // Call Bland API to stop the call
    const response = await fetch(
      `https://api.bland.ai/v1/calls/${callId}/stop`,
      {
        method: 'POST',
        headers: {
          'authorization': BLAND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Bland API error:', response.status, errorText)
      
      // If 404, call doesn't exist or already ended
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Call not found or already ended' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      throw new Error(`Bland API error: ${response.status} - ${errorText}`)
    }

    console.log('✅ Call stopped successfully')

    // Update call status in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('call_logs')
      .update({
        call_status: 'stopped',
        completed_at: new Date().toISOString()
      })
      .eq('bland_call_id', callId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Call stopped successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Stop call error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})