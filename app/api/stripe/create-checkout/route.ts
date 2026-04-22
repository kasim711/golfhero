import { NextRequest, NextResponse } from 'next/server'
import { PLANS } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { getStripeServer } = await import('@/lib/stripe')
    const stripe = getStripeServer()
    const { plan, charityId, charityPercentage, userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    if (charityPercentage < 10 || charityPercentage > 100) return NextResponse.json({ error: 'Invalid charity %' }, { status: 400 })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://golfhero.vercel.app'
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/signup?cancelled=true`,
      client_reference_id: userId,
      metadata: { user_id: userId, plan, charity_id: charityId, charity_percentage: charityPercentage.toString() },
      subscription_data: { metadata: { user_id: userId, plan, charity_id: charityId, charity_percentage: charityPercentage.toString() } },
    })
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
