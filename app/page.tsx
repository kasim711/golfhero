'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Heart, Trophy, Target, ArrowRight, Users, ChevronRight } from 'lucide-react'

const CHARITIES = [
  { name: 'Cancer Research UK', raised: '£2.4M', color: '#c8f55a' },
  { name: 'Children with Cancer', raised: '£1.1M', color: '#5b8af5' },
  { name: 'Macmillan Support', raised: '£890K', color: '#ff6b6b' },
  { name: 'British Heart Foundation', raised: '£640K', color: '#f5c842' },
]

export default function HomePage() {
  const [activeCharity, setActiveCharity] = useState(0)
  const [prizePool, setPrizePool] = useState(0)
  useEffect(() => { const i = setInterval(() => setActiveCharity(p => (p + 1) % 4), 3000); return () => clearInterval(i) }, [])
  useEffect(() => {
    let n = 0; const t = setInterval(() => { n += 750; if (n >= 48750) { setPrizePool(48750); clearInterval(t) } else setPrizePool(n) }, 16)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,245,90,0.06), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#0a0a0f', fontFamily: 'Playfair Display,serif' }}>G</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700 }}>GolfHero</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="btn-ghost" style={{ padding: '8px 18px', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '10px 22px', textDecoration: 'none', fontSize: '0.9rem' }}>Get Started</Link>
        </div>
      </nav>
      <section style={{ paddingTop: 140, paddingBottom: 100, maxWidth: 1100, margin: '0 auto', padding: '140px 32px 100px' }}>
        <div className="animate-fade-up" style={{ marginBottom: 16 }}>
          <span className="badge badge-active"><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />£{prizePool.toLocaleString()} Prize Pool This Month</span>
        </div>
        <h1 className="animate-fade-up delay-1" style={{ fontSize: 'clamp(3rem,7vw,6rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, maxWidth: 800 }}>
          Golf that<br /><span className="gradient-text">changes lives.</span>
        </h1>
        <p className="animate-fade-up delay-2" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
          Track your Stableford scores, enter monthly prize draws, and donate to causes that matter — built for golfers who give a damn.
        </p>
        <div className="animate-fade-up delay-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 64 }}>
          <Link href="/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>Start For Free <ArrowRight size={18} /></Link>
          <Link href="#how" className="btn-ghost" style={{ padding: '16px 32px', fontSize: '1rem', textDecoration: 'none' }}>See How It Works</Link>
        </div>
        <div className="animate-fade-up delay-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', maxWidth: 580 }}>
          {[{l:'Active Members',v:'2,847',I:Users},{l:'Total Given',v:'£142K',I:Heart},{l:'Avg Prize',v:'£340',I:Trophy}].map(({l,v,I})=>(
            <div key={l} style={{ background: 'var(--bg-card)', padding: '24px 20px' }}>
              <I size={18} color="var(--text-subtle)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Playfair Display,serif', marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Featured Impact</p>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', marginBottom: 20 }}>Your sub funds <span style={{ color: CHARITIES[activeCharity].color, transition: 'color 0.5s' }}>{CHARITIES[activeCharity].name}</span></h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>Min 10% of every subscription goes directly to your chosen charity. Increase it anytime.</p>
            <Link href="/charities" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Browse Charities <ChevronRight size={16} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {CHARITIES.map((c,i) => (
              <div key={c.name} onClick={() => setActiveCharity(i)} style={{ padding: 20, borderRadius: 'var(--radius)', border: `1px solid ${i===activeCharity?c.color:'var(--border)'}`, background: i===activeCharity?`${c.color}15`:'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.3s' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, marginBottom: 12 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 700 }}>{c.raised} raised</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="how" style={{ padding: '100px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', marginBottom: 12 }}>Three steps to <span className="gradient-text">win big & give back</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[{n:'01',t:'Subscribe',d:'Join for £19.99/month. A portion goes to your chosen charity automatically.',I:Heart},{n:'02',t:'Enter Scores',d:'Log your last 5 Stableford scores. One per date, rolling — always your latest 5.',I:Target},{n:'03',t:'Win Prizes',d:'Monthly draw matches your scores. 3, 4, or 5-number matches win from the prize pool.',I:Trophy}].map(({n,t,d,I})=>(
            <div key={n} className="glass" style={{ padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 20, fontSize: '4rem', fontFamily: 'Playfair Display,serif', fontWeight: 900, color: 'var(--bg-elevated)', lineHeight: 1 }}>{n}</div>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><I size={22} color="var(--accent)" /></div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{t}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: '80px 32px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 48 }}>Match more, <span className="gradient-text">win more</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {[{m:'5-Number Match',s:'40%',l:'Jackpot',c:'var(--gold)',r:true},{m:'4-Number Match',s:'35%',l:'Second Tier',c:'var(--accent)',r:false},{m:'3-Number Match',s:'25%',l:'Third Tier',c:'var(--blue)',r:false}].map(({m,s,l,c,r})=>(
              <div key={m} style={{ background: 'var(--bg-elevated)', padding: '36px 24px' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'Playfair Display,serif', color: c, marginBottom: 8 }}>{s}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{m}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: r?12:0 }}>{l}</div>
                {r&&<span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>Rolls Over</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: '100px 32px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', marginBottom: 16 }}>Ready to play with purpose?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.1rem' }}>Join 2,847 golfers already making every round count.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 560, margin: '0 auto 48px' }}>
          {[{plan:'Monthly',price:'£19.99',sub:'/month',h:false,id:'monthly'},{plan:'Yearly',price:'£199.99',sub:'/year — save 17%',h:true,id:'yearly'}].map(({plan,price,sub,h,id})=>(
            <div key={plan} style={{ padding: 32, borderRadius: 'var(--radius)', border: `1px solid ${h?'var(--accent)':'var(--border)'}`, background: h?'rgba(200,245,90,0.05)':'var(--bg-card)' }}>
              <div style={{ fontSize: '0.8rem', color: h?'var(--accent)':'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{plan}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Playfair Display,serif', marginBottom: 4 }}>{price}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>{sub}</div>
              <Link href={`/signup?plan=${id}`} className={h?'btn-primary':'btn-ghost'} style={{ display: 'block', textAlign: 'center', padding: '12px', textDecoration: 'none', fontWeight: 700, borderRadius: 8 }}>Get Started</Link>
            </div>
          ))}
        </div>
        <Link href="/signup" className="btn-primary" style={{ padding: '18px 48px', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Join GolfHero <ArrowRight size={20} />
        </Link>
      </section>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 32px', maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'Playfair Display,serif', color: 'var(--text-muted)' }}>GolfHero</span>
        <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>© 2025 GolfHero. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy','Terms','Contact'].map(l=><Link key={l} href="#" style={{ color: 'var(--text-subtle)', textDecoration: 'none', fontSize: '0.85rem' }}>{l}</Link>)}
        </div>
      </footer>
    </div>
  )
}
