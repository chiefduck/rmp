import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.log(`Processing webhook event: ${event.type}`);
  
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    console.log('No data in webhook event');
    return;
  }

  if (!('customer' in stripeData)) {
    console.log('No customer in webhook event');
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    console.log('Skipping payment_intent.succeeded for one-time payment');
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else {
      const { mode, payment_status } = stripeData as Stripe.Checkout.Session;
      
      if (mode === 'payment' && payment_status === 'paid') {
        await handleOneTimePayment(stripeData as Stripe.Checkout.Session, customerId);
      }
    }
  }
}

async function handleOneTimePayment(session: Stripe.Checkout.Session, customerId: string) {
  try {
    // Extract the necessary information from the session
    const {
      id: checkout_session_id,
      payment_intent,
      amount_subtotal,
      amount_total,
      currency,
      payment_status,
    } = session;

    console.log(`Processing one-time payment for session: ${checkout_session_id}`);

    // Insert the order into the stripe_orders table
    const { error: orderError } = await supabase.from('stripe_orders').insert({
      checkout_session_id,
      payment_intent_id: payment_intent as string,
      customer_id: customerId,
      amount_subtotal: amount_subtotal || 0,
      amount_total: amount_total || 0,
      currency: currency || 'usd',
      payment_status: payment_status || 'paid',
      status: 'completed',
    });

    if (orderError) {
      console.error('Error inserting order:', orderError);
      return;
    }
    
    console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
  } catch (error) {
    console.error('Error processing one-time payment:', error);
  }
}

// Handle specific subscription events
async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncCustomerFromStripe(subscription.customer as string);
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoicePayment(invoice);
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          await handleFailedPayment(failedInvoice);
        }
        break;
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
  }
}

async function handleInvoicePayment(invoice: Stripe.Invoice) {
  try {
    // Find the user associated with this customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', invoice.customer as string)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found for invoice payment');
      return;
    }

    // Record the payment in billing history
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: customer.user_id,
        amount: invoice.amount_paid,
        status: 'paid',
        stripe_invoice_id: invoice.id,
        invoice_pdf: invoice.invoice_pdf,
      });

    if (billingError) {
      console.error('Error recording billing history:', billingError);
    }

    console.log(`Recorded successful payment for invoice: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    // Find the user associated with this customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', invoice.customer as string)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found for failed payment');
      return;
    }

    // Record the failed payment
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: customer.user_id,
        amount: invoice.amount_due,
        status: 'failed',
        stripe_invoice_id: invoice.id,
      });

    if (billingError) {
      console.error('Error recording failed payment:', billingError);
    }

    console.log(`Recorded failed payment for invoice: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Legacy one-time payment handling (keeping for compatibility)
async function handleLegacyOneTimePayment(stripeData: any, customerId: string) {
  const { mode, payment_status } = stripeData as Stripe.Checkout.Session;
  
  if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        console.log(`Processing legacy one-time payment for session: ${checkout_session_id}`);

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent as string,
          customer_id: customerId,
          amount_subtotal: amount_subtotal || 0,
          amount_total: amount_total || 0,
          currency: currency || 'usd',
          payment_status: payment_status || 'paid',
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started' as any,
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
          status: subscription.status as any,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}