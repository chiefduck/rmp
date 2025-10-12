import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bland-signature',
}

// Helper to verify Bland webhook signature (optional but recommended)
function verifyBlandSignature(payload: any, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return true // Skip verification if not configured
  
  // TODO: Implement Bland's signature verification algorithm
  // For now, we'll trust webhooks since they come from Bland's servers
  return true
}

// IMPORTANT: This function accepts requests from Bland AI webhooks
// It does NOT require Supabase authentication
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // NOTE: Webhooks from Bland won't have auth headers - that's OK!
  // We verify via signature instead (optional)
  
  // Log request details for debugging
  console.log('📞 Webhook received from:', req.headers.get('user-agent'))
  console.log('Method:', req.method)
  console.log('Has auth header:', !!req.headers.get('authorization'))

  try {
    console.log('📞 Webhook received')
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const payload = await req.json()
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Optional: Verify webhook signature if secret is configured
    const signature = req.headers.get('x-bland-signature')
    const webhookSecret = Deno.env.get('BLAND_WEBHOOK_SECRET')
    
    if (signature && webhookSecret) {
      console.log('🔐 Verifying webhook signature...')
      // TODO: Implement signature verification if needed
      // For now, we'll trust the webhook since it's coming from Bland
    }

    // Bland.AI webhook payload structure
    const {
      call_id,
      status, // 'completed', 'failed', 'no-answer', etc.
      call_length, // in seconds
      transcript,
      recording_url,
      metadata,
      to,
      from,
      error_message
    } = payload

    console.log(`📊 Call ${call_id} - Status: ${status}, Duration: ${call_length}s`)

    // Calculate cost (Bland charges ~$0.09/minute)
    const costCents = Math.ceil((call_length || 0) / 60 * 9)

    // Find the call log by bland_call_id
    const { data: existingLog, error: findError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('bland_call_id', call_id)
      .single()

    if (findError) {
      console.error('❌ Call log not found:', call_id, findError)
      
      // If call not found, create a new log entry
      // This can happen if webhook arrives before our initial insert
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert({
          bland_call_id: call_id,
          call_status: status,
          call_duration: call_length,
          transcript: transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          phone_number: to,
          completed_at: new Date().toISOString(),
          // We don't have user_id or client_id, so this will need to be matched later
          user_id: metadata?.user_id || null,
          client_id: metadata?.client_id || null,
          call_type: metadata?.call_type || 'client'
        })
      
      if (insertError) {
        console.error('❌ Failed to insert new call log:', insertError)
        throw insertError
      }
      
      console.log('✅ Created new call log from webhook')
    } else {
      // Update existing call log
      const { error: updateError } = await supabase
        .from('call_logs')
        .update({
          call_status: status,
          call_duration: call_length,
          transcript: transcript,
          recording_url: recording_url,
          cost_cents: costCents,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('bland_call_id', call_id)

      if (updateError) {
        console.error('❌ Error updating call log:', updateError)
        throw updateError
      }

      console.log('✅ Updated call log successfully')
    }

    // Optional: Send notification to user about completed call
    if (metadata?.user_id && status === 'completed') {
      console.log(`📧 Could send notification to user ${metadata.user_id}`)
      // TODO: Implement email/SMS notification
      // Could trigger email notification here
      // Or update a notifications table
    }

    // If call failed, log the error
    if (status === 'failed' && error_message) {
      console.error('❌ Call failed:', error_message)
    }

    console.log('✅ Webhook processed successfully')

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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})