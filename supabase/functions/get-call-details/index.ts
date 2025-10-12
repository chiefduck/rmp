// supabase/functions/get-call-details/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    const { callId, type } = await req.json()
    // type: 'transcript' | 'recording' | 'emotions'
    
    if (!callId || !type) {
      throw new Error('callId and type are required')
    }

    const BLAND_API_KEY = Deno.env.get('BLAND_API_KEY')
    
    if (!BLAND_API_KEY) {
      throw new Error('BLAND_API_KEY not configured')
    }

    console.log(`📞 Getting ${type} for call: ${callId}`)

    let url = ''
    let method = 'GET'
    let body = null

    switch (type) {
      case 'transcript':
        url = `https://api.bland.ai/v1/calls/${callId}/corrected-transcript`
        break
      case 'recording':
        url = `https://api.bland.ai/v1/calls/${callId}/recording`
        break
      case 'emotions':
        url = `https://api.bland.ai/v1/intelligence/emotions`
        method = 'POST'
        body = JSON.stringify({ callId })
        break
      default:
        throw new Error(`Invalid type: ${type}`)
    }

    const response = await fetch(url, {
      method,
      headers: {
        'authorization': BLAND_API_KEY,
        'Content-Type': 'application/json'
      },
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Failed to get ${type}:`, response.status, errorText)
      
      // Return empty response instead of error
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false,
            data: null,
            message: `${type} not available yet`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
      
      throw new Error(`Bland API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ Got ${type} successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Get call details error:', error)
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