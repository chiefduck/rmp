import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Service Role Key:', supabaseServiceKey ? 'Set' : 'Missing')
    console.log('Stripe Secret:', stripeSecret ? 'Set' : 'Missing')

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecret) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecret, {
      appInfo: {
        name: 'Rate Monitor Pro',
        version: '1.0.0',
      },
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user making the request
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Deleting account for user:', user.id)

    // Step 1: Get Stripe customer ID from database
    const { data: stripeCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single()

    // Step 2: Cancel and delete Stripe subscription if exists
    if (stripeCustomer?.customer_id) {
      console.log('Found Stripe customer:', stripeCustomer.customer_id)
      
      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomer.customer_id,
          limit: 100
        })

        // Cancel all active subscriptions immediately
        for (const subscription of subscriptions.data) {
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            console.log('Canceling subscription:', subscription.id)
            await stripe.subscriptions.cancel(subscription.id)
          }
        }

        // Delete the Stripe customer (this also cancels all subscriptions)
        console.log('Deleting Stripe customer:', stripeCustomer.customer_id)
        await stripe.customers.del(stripeCustomer.customer_id)
        
        console.log('Stripe customer deleted successfully')
      } catch (stripeError) {
        console.error('Stripe cleanup error (non-fatal):', stripeError)
        // Continue with user deletion even if Stripe cleanup fails
      }
    } else {
      console.log('No Stripe customer found for user')
    }

    // Step 3: Delete user from Supabase Auth (this triggers CASCADE delete for all related data)
    console.log('Deleting user from Supabase Auth...')
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log('User and all related data deleted successfully')

    return new Response(
      JSON.stringify({ 
        message: 'Account deleted successfully',
        details: {
          user_deleted: true,
          stripe_cleaned: !!stripeCustomer?.customer_id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})