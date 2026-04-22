'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, Trophy, Heart, DollarSign, Play, Eye, CheckCircle, XCircle, LogOut, Settings, BarChart3, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate, getMonthName, getCurrentMonthYear } from '@/lib/utils'
import { AdminStats, Draw, DrawEntry, Profile, Charity } from '@/types'

type Tab = 'dashboard'|'users'|'draws'|'charities'|'winners'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<AdminStats>({ total_users:0, active_subscribers:0, total_prize_pool:0, total_charity_contributed:0, current_month_entries:0 })
  const [users, setUsers] = useState<any[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [winners, setWinners] = useState<DrawEntry[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [drawLogic, setDrawLogic] = useState<'random'|'algorithmic'>('random')
  const [simResult, setSimResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) { router.push('/dashboard'); return }
    loadAll()
  }

  const loadAll = async () => {
    const [{ data: allUsers }, { data: subs }, { data: drawsData }, { data: winnersData }, { data: charitiesData }, { data: contribs }] = await Promise.all([
      supabase.from('profiles').select('*, subscriptions(status,plan,charity_percentage,amount_cents,charity:charities(name))'),
      supabase.from('subscriptions').select('*').eq('status','active'),
      supabase.from('draws').select('*').order('year',{ascending:false}).order('month',{ascending:false}),
      supabase.from('draw_entries').select('*, profile:profiles(full_name,email), draw:draws(month,year)').gte('match_count',3).order('created_at',{ascending:false}),
      supabase.from('charities').select('*').eq('is_active',true),
      supabase.from('charity_contributions').select('amount_cents'),
    ])
    setUsers(allUsers || [])
    setDraws(drawsData || [])
    setWinners(winnersData || [])
    setCharities(charitiesData || [])
    const totalCharity = (contribs || []).reduce((s: number, c: any) => s + c.amount_cents, 0)
    setStats({
      total_users: (allUsers||[]).length,
      active_subscribers: (subs||[]).length,
      total_prize_pool: (subs||[]).length * 12,
      total_charity_contributed: totalCharity / 100,
      current_month_entries: 0,
    })
    setLoading(false)
  }

  const runDraw = async (publish: boolean) => {
    setRunning(true)
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    const { month, year } = getCurrentMonthYear()
    const res = await fetch('/api/draw/run', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ month, year, logic: drawLogic, publish, adminUserId: adminUser?.id }) })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setRunning(false); return }
    setSimResult(data)
    toast.success(publish ? '🎉 Draw published!' : '🔍 Simulation complete')
    if (publish) loadAll()
    setRunning(false)
  }

  const updatePayment = async (entryId: string, status: 'paid'|'rejected') => {
    const { error } = await supabase.from('draw_entries').update({ payment_status: status }).eq('id', entryId)
    if (error) { toast.error('Failed to update'); return }
    toast.success(`Payment marked as ${status}`)
    loadAll()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const NavItem = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button onClick={() => setTab(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: tab===id?'var(--accent-dim)':'transparent', color: tab===id?'var(--accent)':'var(--text-muted)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem', fontWeight: tab===id?600:400, marginBottom: 4, transition: 'all 0.2s' }}>
      <Icon size={17} />{label}
    </button>
  )

  if (loading) return <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><div style={{ width:40,height:40,borderRadius:'50%',border:'2px solid var(--border)',borderTopColor:'var(--accent)',animation:'spin 0.8s linear infinite' }} /></div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', left:0, top:0, bottom:0, width:240, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:50 }}>
        <div style={{ padding:'24px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:13, fontWeight:900, color:'#0a0a0f', fontFamily:'Playfair Display,serif' }}>G</span>
            </div>
            <span style={{ fontFamily:'Playfair Display,serif', fontWeight:700 }}>GolfHero</span>
          </div>
          <span className="badge badge-pending" style={{ fontSize:'0.65rem' }}>Admin Panel</span>
        </div>
        <div style={{ padding:'20px 12px', flex:1 }}>
          <NavItem id="dashboard" label="Dashboard" icon={BarChart3} />
          <NavItem id="users" label="Users" icon={Users} />
          <NavItem id="draws" label="Draw Engine" icon={Trophy} />
          <NavItem id="charities" label="Charities" icon={Heart} />
          <NavItem id="winners" label="Winners" icon={CheckCircle} />
        </div>
        <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'0.9rem' }}>
            <LogOut size={17} />Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft:240, padding:'40px', width:'100%' }}>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:8 }}>Admin Dashboard</h1>
            <p style={{ color:'var(--text-muted)', marginBottom:32 }}>Platform overview and key metrics.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:32 }}>
              {[
                { l:'Total Users', v:stats.total_users, c:'var(--text)', I:Users },
                { l:'Active Subs', v:stats.active_subscribers, c:'var(--accent)', I:TrendingUp },
                { l:'Prize Pool Est.', v:`£${stats.total_prize_pool.toFixed(0)}`, c:'var(--gold)', I:DollarSign },
                { l:'Charity Total', v:`£${stats.total_charity_contributed.toFixed(0)}`, c:'var(--coral)', I:Heart },
                { l:'Total Draws', v:draws.length, c:'var(--blue)', I:Trophy },
              ].map(({l,v,c,I})=>(
                <div key={l} className="glass" style={{ padding:20 }}>
                  <I size={16} color="var(--text-subtle)" style={{ marginBottom:10 }} />
                  <div style={{ fontSize:'1.8rem', fontFamily:'Playfair Display,serif', fontWeight:700, color:c, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div className="glass" style={{ padding:24 }}>
                <h3 style={{ marginBottom:16 }}>Recent Draws</h3>
                {draws.slice(0,4).map(d => (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontWeight:500 }}>{getMonthName(d.month)} {d.year}</span>
                    <span className={`badge ${d.status==='published'?'badge-active':d.status==='simulated'?'badge-pending':'badge-inactive'}`}>{d.status}</span>
                  </div>
                ))}
              </div>
              <div className="glass" style={{ padding:24 }}>
                <h3 style={{ marginBottom:16 }}>Recent Winners</h3>
                {winners.slice(0,4).map(w => (
                  <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontWeight:500 }}>{(w.profile as any)?.full_name}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ color:'var(--gold)', fontWeight:700 }}>£{w.prize_amount.toFixed(2)}</span>
                      <span className={`badge ${w.payment_status==='paid'?'badge-active':'badge-pending'}`}>{w.payment_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:28 }}>User Management</h1>
            <div className="glass" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Name','Email','Plan','Status','Charity %'].map(h=>(
                      <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const sub = u.subscriptions?.[0]
                    return (
                      <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'14px 20px', fontWeight:500 }}>{u.full_name}</td>
                        <td style={{ padding:'14px 20px', color:'var(--text-muted)', fontSize:'0.9rem' }}>{u.email}</td>
                        <td style={{ padding:'14px 20px', fontSize:'0.85rem' }}>{sub?.plan||'—'}</td>
                        <td style={{ padding:'14px 20px' }}>
                          <span className={`badge ${sub?.status==='active'?'badge-active':'badge-inactive'}`} style={{ fontSize:'0.7rem' }}>{sub?.status||'no sub'}</span>
                        </td>
                        <td style={{ padding:'14px 20px', color:'var(--accent)', fontWeight:600 }}>{sub?.charity_percentage||0}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {tab === 'draws' && (
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:8 }}>Draw Engine</h1>
            <p style={{ color:'var(--text-muted)', marginBottom:28 }}>Configure, simulate, and publish monthly draws.</p>

            <div className="glass" style={{ padding:28, marginBottom:24 }}>
              <h3 style={{ marginBottom:20 }}>Run {getMonthName(getCurrentMonthYear().month)} {getCurrentMonthYear().year} Draw</h3>
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:12 }}>Draw Logic:</p>
                <div style={{ display:'flex', gap:12 }}>
                  {(['random','algorithmic'] as const).map(l => (
                    <button key={l} onClick={() => setDrawLogic(l)} style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${drawLogic===l?'var(--accent)':'var(--border)'}`, background:drawLogic===l?'var(--accent-dim)':'var(--bg-elevated)', color:drawLogic===l?'var(--accent)':'var(--text-muted)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:drawLogic===l?600:400, fontSize:'0.9rem', transition:'all 0.2s', textTransform:'capitalize' }}>
                      {l}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize:'0.8rem', color:'var(--text-subtle)', marginTop:8 }}>
                  {drawLogic==='random' ? 'Standard lottery — 5 random numbers from 1–45' : 'Weighted by most frequent user scores — more exciting!'}
                </p>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => runDraw(false)} className="btn-ghost" style={{ padding:'12px 24px', display:'flex', alignItems:'center', gap:8 }} disabled={running}>
                  <Eye size={16} />{running ? 'Running…' : 'Simulate (Preview)'}
                </button>
                <button onClick={() => runDraw(true)} className="btn-primary" style={{ padding:'12px 24px', display:'flex', alignItems:'center', gap:8 }} disabled={running}>
                  <Play size={16} />{running ? 'Publishing…' : 'Publish Draw'}
                </button>
              </div>
            </div>

            {simResult && (
              <div className="glass-elevated" style={{ padding:28, marginBottom:24, border:'1px solid var(--accent)' }}>
                <h3 style={{ marginBottom:16, color:'var(--accent)' }}>
                  {simResult.published ? '🎉 Draw Published!' : '🔍 Simulation Result'}
                </h3>
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:10 }}>Drawn Numbers:</p>
                  <div style={{ display:'flex', gap:12 }}>
                    {simResult.drawnNumbers.map((n: number) => (
                      <div key={n} className="draw-ball">{n}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                  {[
                    { l:'Total Entries', v:simResult.simulation.total_entries },
                    { l:'5-Match Winners', v:simResult.simulation.match5Winners },
                    { l:'4-Match Winners', v:simResult.simulation.match4Winners },
                    { l:'3-Match Winners', v:simResult.simulation.match3Winners },
                  ].map(({l,v}) => (
                    <div key={l} style={{ background:'var(--bg-card)', padding:16, borderRadius:10, textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontFamily:'Playfair Display,serif', fontWeight:700, marginBottom:4 }}>{v}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {simResult.simulation.jackpotRolledOver && (
                  <div style={{ marginTop:16, padding:'10px 16px', background:'var(--gold-dim)', border:'1px solid rgba(245,200,66,0.3)', borderRadius:10, color:'var(--gold)', fontSize:'0.9rem' }}>
                    ⚡ Jackpot rolls over — no 5-match winner this month
                  </div>
                )}
              </div>
            )}

            <div className="glass" style={{ overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                <h3>Draw History</h3>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Month','Status','Numbers','Prize Pool','Jackpot Rollover'].map(h=>(
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {draws.map(d => (
                    <tr key={d.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'12px 20px', fontWeight:500 }}>{getMonthName(d.month)} {d.year}</td>
                      <td style={{ padding:'12px 20px' }}><span className={`badge ${d.status==='published'?'badge-active':d.status==='simulated'?'badge-pending':'badge-inactive'}`}>{d.status}</span></td>
                      <td style={{ padding:'12px 20px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          {d.drawn_numbers.map(n => (
                            <span key={n} style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent-dim)', border:'1px solid var(--accent)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color:'var(--accent)' }}>{n}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding:'12px 20px', color:'var(--gold)', fontWeight:600 }}>£{d.total_prize_pool?.toFixed(2)||'0.00'}</td>
                      <td style={{ padding:'12px 20px', color:d.jackpot_rolled_over?'var(--gold)':'var(--text-subtle)' }}>{d.jackpot_rolled_over?'Yes':'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHARITIES TAB */}
        {tab === 'charities' && (
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:28 }}>Charity Management</h1>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
              {charities.map(c => (
                <div key={c.id} className="glass" style={{ padding:24 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    {c.image_url && <img src={c.image_url} alt="" style={{ width:60, height:60, borderRadius:10, objectFit:'cover' }} />}
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                        <h3 style={{ fontSize:'1rem' }}>{c.name}</h3>
                        {c.is_featured && <span className="badge badge-active" style={{ fontSize:'0.6rem' }}>Featured</span>}
                      </div>
                      <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.5 }}>{c.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WINNERS TAB */}
        {tab === 'winners' && (
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:28 }}>Winners Management</h1>
            <div className="glass" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Winner','Draw','Match','Prize','Proof','Payment'].map(h=>(
                    <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {winners.map(w => (
                    <tr key={w.id} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'14px 20px' }}>
                        <div style={{ fontWeight:500 }}>{(w.profile as any)?.full_name}</div>
                        <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{(w.profile as any)?.email}</div>
                      </td>
                      <td style={{ padding:'14px 20px', fontSize:'0.9rem' }}>{(w.draw as any) ? `${getMonthName((w.draw as any).month)} ${(w.draw as any).year}` : '—'}</td>
                      <td style={{ padding:'14px 20px' }}>
                        <span style={{ background:'var(--blue-dim)', color:'var(--blue)', padding:'3px 10px', borderRadius:100, fontSize:'0.8rem', fontWeight:600 }}>{w.match_count} match</span>
                      </td>
                      <td style={{ padding:'14px 20px', color:'var(--gold)', fontWeight:700 }}>£{w.prize_amount.toFixed(2)}</td>
                      <td style={{ padding:'14px 20px' }}>
                        {w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" style={{ color:'var(--accent)', fontSize:'0.85rem' }}>View</a> : <span style={{ color:'var(--text-subtle)', fontSize:'0.85rem' }}>Pending upload</span>}
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        {w.payment_status === 'pending' ? (
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => updatePayment(w.id, 'paid')} style={{ background:'var(--accent-dim)', border:'1px solid var(--accent)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--accent)', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                              <CheckCircle size={13} />Approve
                            </button>
                            <button onClick={() => updatePayment(w.id, 'rejected')} style={{ background:'var(--coral-dim)', border:'1px solid var(--coral)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--coral)', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
                              <XCircle size={13} />Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${w.payment_status==='paid'?'badge-active':'badge-inactive'}`}>{w.payment_status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {winners.length === 0 && (
                    <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>No winners yet. Run a draw first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
