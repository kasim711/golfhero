'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowRight, Check } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createBrowserClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [plan, setPlan] = useState(params.get('plan') || 'monthly')
  const [charityId, setCharityId] = useState('')
  const [charityPct, setCharityPct] = useState(10)
  const [charities, setCharities] = useState<any[]>([])

  useEffect(() => {
    supabase.from('charities').select('id, name').eq('is_active', true).then(({ data }) => setCharities(data || []))
  }, [])

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async () => {
    if (!form.fullName || !form.email || !form.password) { toast.error('Fill all fields'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName } }
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.user) setUserId(data.user.id)
    setStep(2)
    setLoading(false)
  }

  const handleSubscribe = async () => {
    if (!charityId) { toast.error('Please select a charity'); return }
    if (!userId) { toast.error('Please sign up first'); setStep(1); return }
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

  return (
    <div style={{ width: '100%', maxWidth: 500 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#0a0a0f', fontFamily: 'Playfair Display,serif' }}>G</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>GolfHero</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s <= step ? 'var(--accent)' : 'var(--bg-elevated)', border: `1px solid ${s <= step ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: s <= step ? '#0a0a0f' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                {s < step ? <Check size={14} strokeWidth={3} /> : s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 2, background: s < step ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s' }} />}
            </div>
          ))}
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>{step === 1 ? 'Create your account' : 'Choose plan & charity'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{step === 1 ? 'Join GolfHero today' : 'Pick a plan and the cause you care about'}</p>
      </div>

      {step === 1 ? (
        <div className="glass" style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Full Name</label>
              <input value={form.fullName} onChange={set('fullName')} className="input-field" style={{ padding: '12px 16px' }} placeholder="John Smith" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" style={{ padding: '12px 16px' }} placeholder="john@example.com" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} className="input-field" style={{ padding: '12px 16px' }} placeholder="Min 8 characters" />
            </div>
            <button onClick={handleSignup} className="btn-primary" style={{ padding: 14, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account…' : <><span>Continue</span><ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      ) : (
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
      )}
      {step === 1 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 20 }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      )}
    </div>
  )
}

export default function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: '20%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,245,90,0.05), transparent 70%)', pointerEvents: 'none' }} />
      <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
