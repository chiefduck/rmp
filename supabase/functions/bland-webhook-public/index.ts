// supabase/functions/bland-webhook-public/index.ts
// PUBLIC WEBHOOK - No authentication required - FIXED VERSION
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('📞 Webhook START')

  try {
    const payload = await req.json()
    console.log('✅ Payload received:', JSON.stringify(payload, null, 2))
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔑 Env vars:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    })
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created')

    // Bland.AI webhook payload
    const {
      call_id,
      status,
      call_length,
      transcript,
      concatenated_transcript,
      recording_url,
      metadata,
      corrected_duration
    } = payload

    // 🔧 FIX: Round call_length to integer (Bland sends decimals)
    const durationSeconds = Math.round(call_length || corrected_duration || 0)
    
    // Calculate cost
    const costCents = Math.ceil(durationSeconds / 60 * 9)
    
    console.log(`📞 Processing call ${call_id} - Status: ${status}, Duration: ${durationSeconds}s`)

    // Find existing log
    console.log('🔍 Searching for existing log...')
    const { data: existingLog, error: findError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('bland_call_id', call_id)
      .maybeSingle()

    if (findError) {
      console.error('⚠️ Query error:', findError)
    }
    
    console.log('📊 Existing log found:', !!existingLog)

    if (existingLog) {
      // Update existing
      console.log('📝 Updating existing log...')
      const { error } = await supabase
        .from('call_logs')
        .update({
          call_status: status,
          call_duration: durationSeconds, // ✅ INTEGER
          transcript: concatenated_transcript || transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          completed_at: new Date().toISOString()
        })
        .eq('bland_call_id', call_id)

      if (error) {
        console.error('❌ Update error:', error)
        throw error
      }
      console.log('✅ Updated existing call log')
    } else {
      // Create new (shouldn't happen but handle it)
      console.log('📝 Creating new log...')
      
      // Validate UUIDs before inserting
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }
      
      const userId = metadata?.user_id && isValidUUID(metadata.user_id) ? metadata.user_id : null
      const clientId = metadata?.client_id && isValidUUID(metadata.client_id) ? metadata.client_id : null
      
      console.log('🔑 IDs:', { userId, clientId, hasValidUser: !!userId, hasValidClient: !!clientId })
      
      const { error } = await supabase
        .from('call_logs')
        .insert({
          bland_call_id: call_id,
          call_status: status,
          call_duration: durationSeconds, // ✅ INTEGER
          transcript: concatenated_transcript || transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          completed_at: new Date().toISOString(),
          user_id: userId,
          client_id: clientId,
          call_type: metadata?.call_type || 'client',
          phone_number: payload.to || 'unknown'
        })

      if (error) {
        console.error('❌ Insert error:', error)
        throw error
      }
      console.log('✅ Created new call log')
    }

    console.log('🎉 Webhook processing complete')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed',
        call_id: call_id,
        status: status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    console.error('Stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})