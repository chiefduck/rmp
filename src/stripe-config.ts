// Stripe product configuration
// Update the priceId with your actual Stripe Price ID from your Stripe Dashboard

export interface Product {
  priceId: string
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  mode: 'subscription' | 'payment'
}

export const products: Product[] = [
  {
    priceId: 'price_1Qu4FhEsyVlivUjUdAVTbpv4', // Your real test price ID
    name: 'Rate Monitor Pro',
    description: 'Professional mortgage rate monitoring for brokers. Real-time rate tracking, automated client notifications, CRM integration, and portfolio management dashboard.',
    price: 97.00,
    interval: 'month',
    mode: 'subscription'
  }
]