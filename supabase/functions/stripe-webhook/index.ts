import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Rate Monitor Pro',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }

    console.log(`Received webhook: ${event.type}`);

    // Handle the event asynchronously
    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  try {
    // Only handle subscription events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await syncSubscriptionById(invoice.subscription as string);
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Only handle subscription checkouts
  if (session.mode !== 'subscription') {
    return;
  }

  const customerId = session.customer as string;
  console.log(`Checkout completed for customer: ${customerId}`);

  // Sync the subscription from Stripe
  if (session.subscription) {
    await syncSubscriptionById(session.subscription as string);
  }
}

async function syncSubscriptionById(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });
  
  await syncSubscription(subscription);
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  console.log(`Syncing subscription ${subscription.id} for customer ${customerId}`);
  console.log(`Status: ${subscription.status}, Trial end: ${subscription.trial_end}`);

  // Get payment method details if available
  let paymentMethodBrand = null;
  let paymentMethodLast4 = null;
  
  if (subscription.default_payment_method && 
      typeof subscription.default_payment_method !== 'string') {
    paymentMethodBrand = subscription.default_payment_method.card?.brand ?? null;
    paymentMethodLast4 = subscription.default_payment_method.card?.last4 ?? null;
  }

  // Update subscription in database - use 'status' column (not subscription_status)
  const { error } = await supabase
    .from('stripe_subscriptions')
    .upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
        status: subscription.status, // THIS IS THE KEY FIX
      },
      {
        onConflict: 'customer_id',
      }
    );

  if (error) {
    console.error('Error syncing subscription:', error);
    throw new Error(`Failed to sync subscription: ${error.message}`);
  }

  console.log(`✅ Successfully synced subscription for customer ${customerId}`);
}