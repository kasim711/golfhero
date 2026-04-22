import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Lazy initialize — only when actually called, not at build time
let _stripe: Stripe | null = null

export function getStripeServer(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

// Keep named export for webhook route
export const stripe = {
  webhooks: {
    constructEvent: (body: string, sig: string, secret: string) =>
      getStripeServer().webhooks.constructEvent(body, sig, secret)
  },
  checkout: {
    sessions: {
      create: (params: any) => getStripeServer().checkout.sessions.create(params)
    }
  },
  subscriptions: {
    retrieve: (id: string) => getStripeServer().subscriptions.retrieve(id)
  }
}

// Client-side Stripe
let stripePromise: ReturnType<typeof loadStripe>
export const getStripe = () => {
  if (!stripePromise) stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  return stripePromise
}

export const PLANS = {
  monthly: {
    name: 'Monthly',
    price: 1999,
    get priceId() { return process.env.STRIPE_MONTHLY_PRICE_ID! },
    interval: 'month' as const,
  },
  yearly: {
    name: 'Yearly',
    price: 19999,
    get priceId() { return process.env.STRIPE_YEARLY_PRICE_ID! },
    interval: 'year' as const,
    savings: '17%',
  },
}
