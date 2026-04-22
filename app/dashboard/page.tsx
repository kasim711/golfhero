'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, LogOut, Trophy, Heart, Target, Calendar, TrendingUp, X, Check } from 'lucide-react'
import { GolfScore, Subscription, DrawEntry } from '@/types'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [scores, setScores] = useState<GolfScore[]>([])
  const [entries, setEntries] = useState<DrawEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddScore, setShowAddScore] = useState(false)
  const [editScore, setEditScore] = useState<GolfScore | null>(null)
  const [newScore, setNewScore] = useState({ score: '', score_date: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'draws' | 'charity'>('overview')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const [{ data: prof }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subscriptions').select('*, charity:charities(*)').eq('user_id', user.id).single(),
    ])
    setProfile(prof)
    setSubscription(sub)
    const { data: sc } = await supabase.from('golf_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(5)
    setScores(sc || [])
    const { data: en } = await supabase.from('draw_entries').select('*, draw:draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    setEntries(en || [])
    setLoading(false)
  }

  const handleAddScore = async () => {
    if (!newScore.score || !newScore.score_date) { toast.error('Fill both fields'); return }
    setSaving(true)
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: +newScore.score, score_date: newScore.score_date, user_id: user?.id })
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSaving(false); return }
    toast.success('Score added!')
    setShowAddScore(false)
    setNewScore({ score: '', score_date: '' })
    loadData()
    setSaving(false)
  }

  const handleEditScore = async () => {
    if (!editScore) return
    setSaving(true)
    const res = await fetch('/api/scores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editScore.id, score: editScore.score, score_date: editScore.score_date, user_id: user?.id })
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSaving(false); return }
    toast.success('Score updated!')
    setEditScore(null)
    loadData()
    setSaving(false)
  }

  const handleDeleteScore = async (id: string) => {
    const res = await fetch(`/api/scores?id=${id}&user_id=${user?.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to delete'); return }
    toast.success('Score deleted')
    loadData()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const isActive = subscription?.status === 'active'
  const totalWon = entries.reduce((s, e) => s + (e.prize_amount || 0), 0)

  const NavBtn = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button onClick={() => setActiveTab(id as any)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: activeTab === id ? 'var(--accent-dim)' : 'transparent', color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem', fontWeight: activeTab === id ? 600 : 400, marginBottom: 4, transition: 'all 0.2s' }}>
      <Icon size={17} />{label}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#0a0a0f', fontFamily: 'Playfair Display,serif' }}>G</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700 }}>GolfHero</span>
        </div>
        <div style={{ padding: '20px 12px', flex: 1 }}>
          <NavBtn id="overview" label="Overview" icon={TrendingUp} />
          <NavBtn id="scores" label="My Scores" icon={Target} />
          <NavBtn id="draws" label="Draws" icon={Trophy} />
          <NavBtn id="charity" label="My Charity" icon={Heart} />
        </div>
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{profile?.full_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem' }}>
            <LogOut size={17} />Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, padding: '40px' }}>
        {!isActive && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--coral)', fontSize: '0.9rem' }}>⚠️ No active subscription — score entry is disabled</span>
            <a href="/subscribe" style={{ background: 'var(--coral)', color: '#fff', padding: '6px 16px', borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Subscribe Now</a>
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Good to see you, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'there'}</span></h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Here's everything at a glance.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Subscription', value: subscription?.status || 'inactive', color: isActive ? 'var(--accent)' : 'var(--coral)' },
                { label: 'Scores Logged', value: `${scores.length}/5`, color: 'var(--text)' },
                { label: 'Draws Entered', value: String(entries.length), color: 'var(--blue)' },
                { label: 'Total Winnings', value: `£${totalWon.toFixed(2)}`, color: 'var(--gold)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass" style={{ padding: 24 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
                  <div style={{ fontSize: '1.6rem', fontFamily: 'Playfair Display,serif', fontWeight: 700, color, textTransform: 'capitalize' }}>{value}</div>
                </div>
              ))}
            </div>
            {subscription && (
              <div className="glass" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current Plan</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>{subscription.status}</span>
                      <span style={{ fontWeight: 600 }}>{subscription.plan === 'monthly' ? '£19.99/month' : '£199.99/year'}</span>
                    </div>
                  </div>
                  {subscription.current_period_end && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Renews</p>
                      <p style={{ fontWeight: 600 }}>{formatDate(subscription.current_period_end)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCORES */}
        {activeTab === 'scores' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>My Scores</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your latest 5 Stableford scores. One per date.</p>
              </div>
              {isActive && (
                <button onClick={() => setShowAddScore(true)} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} />Add Score
                </button>
              )}
            </div>
            {showAddScore && (
              <div className="glass-elevated" style={{ padding: 20, marginBottom: 16, border: '1px solid var(--accent)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Score (1–45)</label>
                    <input type="number" min={1} max={45} value={newScore.score} onChange={e => setNewScore(s => ({ ...s, score: e.target.value }))} className="input-field" style={{ padding: '10px 14px' }} placeholder="e.g. 34" />
                  </div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date Played</label>
                    <input type="date" value={newScore.score_date} onChange={e => setNewScore(s => ({ ...s, score_date: e.target.value }))} className="input-field" style={{ padding: '10px 14px' }} />
                  </div>
                  <button onClick={handleAddScore} className="btn-primary" style={{ padding: '10px 20px' }} disabled={saving}><Check size={18} /></button>
                  <button onClick={() => setShowAddScore(false)} className="btn-ghost" style={{ padding: '10px 14px' }}><X size={18} /></button>
                </div>
              </div>
            )}
            {scores.length === 0 ? (
              <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
                <Target size={40} color="var(--text-subtle)" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No scores yet. Add your first round!</p>
                {isActive && <button onClick={() => setShowAddScore(true)} className="btn-primary" style={{ padding: '10px 24px' }}>Add First Score</button>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scores.map((s, i) => (
                  <div key={s.id} className="glass" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>#{i + 1}</div>
                    {editScore?.id === s.id ? (
                      <>
                        <input type="number" min={1} max={45} value={editScore.score} onChange={e => setEditScore(es => es ? { ...es, score: +e.target.value } : null)} className="input-field" style={{ padding: '8px 12px', width: 80 }} />
                        <input type="date" value={editScore.score_date} onChange={e => setEditScore(es => es ? { ...es, score_date: e.target.value } : null)} className="input-field" style={{ padding: '8px 12px', flex: 1 }} />
                        <button onClick={handleEditScore} className="btn-primary" style={{ padding: '8px 16px' }} disabled={saving}><Check size={16} /></button>
                        <button onClick={() => setEditScore(null)} className="btn-ghost" style={{ padding: '8px 12px' }}><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '2rem', fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{s.score}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stableford pts</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <Calendar size={14} />{formatDate(s.score_date)}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditScore(s)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteScore(s.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--coral)', transition: 'all 0.2s' }}><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', marginTop: 12 }}>Rolling latest 5 — newest score auto-replaces oldest. One score per date only.</p>
          </div>
        )}

        {/* DRAWS */}
        {activeTab === 'draws' && (
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>My Draws</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Your monthly draw participation and prize history.</p>
            {entries.length === 0 ? (
              <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
                <Trophy size={40} color="var(--text-subtle)" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>No draws yet. Keep logging scores — you'll be entered automatically!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entries.map(e => (
                  <div key={e.id} className="glass" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>
                        {(e.draw as any) ? `${new Date(0, (e.draw as any).month - 1).toLocaleString('en', { month: 'long' })} ${(e.draw as any).year}` : 'Draw'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scores:</span>
                        {e.scores_snapshot.map((s, i) => (
                          <span key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {e.match_count >= 3 ? (
                        <>
                          <div style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--gold)' }}>£{e.prize_amount.toFixed(2)}</div>
                          <span className={`badge ${e.payment_status === 'paid' ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>{e.payment_status}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{e.match_count} match{e.match_count !== 1 ? 'es' : ''}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHARITY */}
        {activeTab === 'charity' && (
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>My Charity</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Your charitable impact from every subscription payment.</p>
            {subscription?.charity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="glass" style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(subscription.charity as any).image_url && (
                    <img src={(subscription.charity as any).image_url} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
                  )}
                  <div>
                    <span className="badge badge-active" style={{ marginBottom: 10, display: 'inline-block' }}>Your Chosen Charity</span>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>{(subscription.charity as any).name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 500 }}>{(subscription.charity as any).description}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="glass" style={{ padding: 24 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Contribution</p>
                    <p style={{ fontSize: '2.4rem', fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--accent)' }}>{subscription.charity_percentage}%</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>of your subscription</p>
                  </div>
                  <div className="glass" style={{ padding: 24 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Per Payment</p>
                    <p style={{ fontSize: '2.4rem', fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--gold)' }}>
                      £{((subscription.amount_cents * subscription.charity_percentage / 100) / 100).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>donated each cycle</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
                <Heart size={40} color="var(--text-subtle)" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>No charity linked yet. Subscribe to choose your cause.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
