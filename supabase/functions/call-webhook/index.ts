// supabase/functions/call-webhook/index.ts - Secure Bland Webhook Handler
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify webhook signature for security
    const signature = req.headers.get('bland-signature')
    const webhookSecret = Deno.env.get('BLAND_WEBHOOK_SECRET')
    
    if (webhookSecret && signature !== webhookSecret) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    const payload = await req.json()
    
    console.log('Webhook received:', {
      call_id: payload.call_id,
      status: payload.status,
      call_length: payload.call_length
    })
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Bland.AI webhook payload structure
    const {
      call_id,
      status, // 'completed', 'failed', 'no-answer', etc.
      call_length, // in seconds
      transcript,
      recording_url,
      metadata
    } = payload

    // Calculate cost (Bland charges ~$0.09/minute)
    const costCents = Math.ceil((call_length || 0) / 60 * 9)

    // Update call log
    const { data, error } = await supabase
      .from('call_logs')
      .update({
        call_status: status,
        call_duration: call_length,
        transcript: transcript,
        recording_url: recording_url,
        cost_cents: costCents,
        completed_at: new Date().toISOString() 
      })
      .eq('bland_call_id', call_id)

    if (error) {
      console.error('Error updating call log:', error)
      throw error
    }

    console.log('Call log updated successfully:', call_id)

    // Optional: Send notification to user about completed call
    if (metadata?.user_id && status === 'completed') {
      // Could trigger email notification here
      // Or update a notifications table
      console.log('Call completed for user:', metadata.user_id)
    }

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
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})