import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;

if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Rate Monitor Pro',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { price_id, success_url, cancel_url } = await req.json();

    if (!price_id || !success_url || !cancel_url) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    console.log('Creating checkout for user:', user.id);

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
      console.log('Using existing customer:', customerId);
    } else {
      // Create new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });

      console.log('Created Stripe customer:', newCustomer.id);

      // Save customer to database
      const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

      if (insertError) {
        console.error('Failed to save customer:', insertError);
        // Clean up Stripe customer
        await stripe.customers.del(newCustomer.id);
        return corsResponse({ error: 'Failed to create customer record' }, 500);
      }

      // Create initial subscription record with 'not_started' status
      const { error: subError } = await supabase
        .from('stripe_subscriptions')
        .insert({
          customer_id: newCustomer.id,
          status: 'not_started',
        });

      if (subError) {
        console.error('Failed to create subscription record:', subError);
        return corsResponse({ error: 'Failed to create subscription record' }, 500);
      }

      customerId = newCustomer.id;
    }

    // Create Stripe Checkout Session with 14-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
        },
      },
      success_url,
      cancel_url,
    });

    console.log('Created checkout session:', session.id);

    return corsResponse({ 
      sessionId: session.id, 
      url: session.url 
    });

  } catch (error: any) {
    console.error('Checkout error:', error.message);
    return corsResponse({ error: error.message }, 500);
  }
});