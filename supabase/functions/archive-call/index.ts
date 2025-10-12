// supabase/functions/archive-call/index.ts - Archive/Restore Calls
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

    const { callIds, action } = await req.json()
    // action: 'archive' | 'restore' | 'delete'
    
    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
      throw new Error('callIds array is required')
    }

    if (!['archive', 'restore', 'delete'].includes(action)) {
      throw new Error('Invalid action. Must be: archive, restore, or delete')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract user ID from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log(`📝 ${action} action for ${callIds.length} calls by user ${user.id}`)

    // Verify all calls belong to the user
    const { data: calls, error: verifyError } = await supabase
      .from('call_logs')
      .select('id, user_id')
      .in('id', callIds)

    if (verifyError) throw verifyError

    const unauthorizedCalls = calls?.filter(call => call.user_id !== user.id)
    if (unauthorizedCalls && unauthorizedCalls.length > 0) {
      throw new Error('Unauthorized: Some calls do not belong to this user')
    }

    // Perform the action
    let result
    
    if (action === 'archive') {
      // Soft delete - set deleted_at timestamp
      result = await supabase
        .from('call_logs')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', callIds)
        .eq('user_id', user.id)
    } else if (action === 'restore') {
      // Restore - clear deleted_at timestamp
      result = await supabase
        .from('call_logs')
        .update({ deleted_at: null })
        .in('id', callIds)
        .eq('user_id', user.id)
    } else if (action === 'delete') {
      // Hard delete - permanently remove
      result = await supabase
        .from('call_logs')
        .delete()
        .in('id', callIds)
        .eq('user_id', user.id)
    }

    if (result.error) throw result.error

    console.log(`✅ Successfully ${action}d ${callIds.length} calls`)

    return new Response(
      JSON.stringify({ 
        success: true,
        action,
        count: callIds.length,
        message: `Successfully ${action}d ${callIds.length} call(s)`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error(`❌ Archive call error:`, error)
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