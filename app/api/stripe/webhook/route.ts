import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const toISO = (val: any) => (val && !isNaN(val)) ? new Date(val * 1000).toISOString() : null

export async function POST(req: NextRequest) {
  const { getStripeServer } = await import('@/lib/stripe')
  const stripe = getStripeServer()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  console.log('Webhook event type:', event.type)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { user_id, plan, charity_id, charity_percentage } = session.metadata || {}
      
      console.log('checkout.session.completed metadata:', { user_id, plan, charity_id, charity_percentage })
      
      if (!user_id) {
        console.error('No user_id in metadata!')
        return NextResponse.json({ error: 'No user_id in metadata' }, { status: 400 })
      }

      const stripeSub = await stripe.subscriptions.retrieve(session.subscription) as any
      
      const upsertData = {
        user_id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: stripeSub.id,
        plan,
        status: 'active',
        charity_id: charity_id || null,
        charity_percentage: parseInt(charity_percentage || '10'),
        current_period_start: toISO(stripeSub.current_period_start),
        current_period_end: toISO(stripeSub.current_period_end),
        amount_cents: stripeSub.items?.data?.[0]?.price?.unit_amount ?? 1999,
        updated_at: new Date().toISOString(),
      }
      
      console.log('Upserting subscription:', upsertData)
      
      const { error } = await supabase.from('subscriptions').upsert(upsertData, { onConflict: 'stripe_subscription_id' })
      if (error) console.error('Supabase upsert error:', error)
      else console.log('Subscription upserted successfully!')
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any
      if (!invoice.subscription) return NextResponse.json({ received: true })
      const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription) as any
      await supabase.from('subscriptions').update({
        status: 'active',
        current_period_start: toISO(stripeSub.current_period_start),
        current_period_end: toISO(stripeSub.current_period_end),
        updated_at: new Date().toISOString()
      }).eq('stripe_subscription_id', invoice.subscription)

      const { data: sub } = await supabase.from('subscriptions').select('*').eq('stripe_subscription_id', invoice.subscription).single()
      if (sub?.charity_id) {
        await supabase.from('charity_contributions').insert({
          user_id: sub.user_id, charity_id: sub.charity_id, subscription_id: sub.id,
          amount_cents: Math.floor((invoice.amount_paid * sub.charity_percentage) / 100)
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      await supabase.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', event.data.object.id)
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as any
      await supabase.from('subscriptions').update({
        status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'lapsed' : 'inactive',
        current_period_end: toISO(sub.current_period_end),
        updated_at: new Date().toISOString()
      }).eq('stripe_subscription_id', sub.id)
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
