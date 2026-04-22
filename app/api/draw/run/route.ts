import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateRandomDraw, generateAlgorithmicDraw, calculatePrizes } from '@/lib/draw-engine'
import { getCurrentMonthYear } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const { month, year, logic, publish, adminUserId } = await req.json()

  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', adminUserId).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const targetMonth = month || getCurrentMonthYear().month
  const targetYear = year || getCurrentMonthYear().year

  let { data: draw } = await admin.from('draws').select('*').eq('month', targetMonth).eq('year', targetYear).single()
  if (!draw) {
    const { data: newDraw, error } = await admin.from('draws').insert({ month: targetMonth, year: targetYear, logic: logic||'random' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    draw = newDraw
  }

  const { data: activeUsers } = await admin.from('subscriptions').select('user_id').eq('status','active')
  const userIds = (activeUsers||[]).map((u: any) => u.user_id)
  const entriesRaw: Array<{user_id:string;scores:number[]}> = []
  const allScores: number[] = []

  for (const userId of userIds) {
    const { data: scores } = await admin.from('golf_scores').select('score').eq('user_id', userId).order('score_date', { ascending: false }).limit(5)
    if (scores && scores.length > 0) {
      const nums = scores.map((s: any) => s.score)
      entriesRaw.push({ user_id: userId, scores: nums })
      allScores.push(...nums)
    }
  }

  const drawnNumbers = logic === 'algorithmic' ? generateAlgorithmicDraw(allScores) : generateRandomDraw()
  const prizePool = draw.total_prize_pool || (activeUsers?.length||0) * 12
  const { results, summary } = calculatePrizes(entriesRaw, drawnNumbers, { jackpot: prizePool*0.4, match4: prizePool*0.35, match3: prizePool*0.25 })

  if (publish) {
    for (const result of results) {
      if (result.matchCount >= 3) {
        await admin.from('draw_entries').upsert({ draw_id: draw.id, user_id: result.user_id, scores_snapshot: result.scores, match_count: result.matchCount, prize_amount: result.prizeAmount, payment_status: 'pending' }, { onConflict: 'draw_id,user_id' })
      }
    }
    await admin.from('draws').update({ status: 'published', drawn_numbers: drawnNumbers, jackpot_rolled_over: summary.jackpotRolledOver, simulation_data: { total_entries: entriesRaw.length, ...summary }, published_at: new Date().toISOString() }).eq('id', draw.id)
  } else {
    await admin.from('draws').update({ status: 'simulated', drawn_numbers: drawnNumbers, simulation_data: { total_entries: entriesRaw.length, ...summary } }).eq('id', draw.id)
  }

  return NextResponse.json({ drawnNumbers, simulation: { total_entries: entriesRaw.length, ...summary }, published: !!publish })
}
