'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'

function SubscribeForm() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState('monthly')
  const [charityId, setCharityId] = useState('')
  const [charityPct, setCharityPct] = useState(10)
  const [charities, setCharities] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('charities').select('id, name').eq('is_active', true)
      setCharities(data || [])
      setChecking(false)
    }
    init()
  }, [])

  const handleSubscribe = async () => {
    if (!charityId) { toast.error('Please select a charity'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, charityId, charityPercentage: charityPct, userId })
      })
      const { url, error } = await res.json()
      if (error) { toast.error(error); setLoading(false); return }
      window.location.href = url
    } catch { toast.error('Something went wrong'); setLoading(false) }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: '20%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,245,90,0.05), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#0a0a0f', fontFamily: 'Playfair Display,serif' }}>G</span>
            </div>
            <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>GolfHero</span>
          </Link>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>Choose your plan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pick a plan and the cause you care about</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass" style={{ padding: 24 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Choose Plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ id: 'monthly', name: 'Monthly', price: '£19.99/mo' }, { id: 'yearly', name: 'Yearly', price: '£199.99/yr', badge: 'Save 17%' }].map(p => (
                <div key={p.id} onClick={() => setPlan(p.id)} style={{ padding: 16, borderRadius: 12, border: `1px solid ${plan === p.id ? 'var(--accent)' : 'var(--border)'}`, background: plan === p.id ? 'rgba(200,245,90,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                  {(p as any).badge && <span style={{ position: 'absolute', top: -8, right: 8, background: 'var(--accent)', color: '#0a0a0f', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{(p as any).badge}</span>}
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: plan === p.id ? 'var(--accent)' : 'var(--text-muted)' }}>{p.price}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass" style={{ padding: 24 }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Choose Charity</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {charities.map(c => (
                <div key={c.id} onClick={() => setCharityId(c.id)} style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${charityId === c.id ? 'var(--accent)' : 'var(--border)'}`, background: charityId === c.id ? 'rgba(200,245,90,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: charityId === c.id ? 600 : 400 }}>{c.name}</span>
                  {charityId === c.id && <Check size={16} color="var(--accent)" strokeWidth={3} />}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Charity %</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>{charityPct}%</span>
              </div>
              <input type="range" min={10} max={100} value={charityPct} onChange={e => setCharityPct(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: 4 }}>
                <span>10% minimum</span><span>100%</span>
              </div>
            </div>
          </div>
          <button onClick={handleSubscribe} className="btn-primary" style={{ padding: 16, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading || !charityId}>
            {loading ? 'Redirecting to payment…' : <><span>Continue to Payment</span><ArrowRight size={18} /></>}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Secure payment via Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SubscribeForm />
    </Suspense>
  )
}
