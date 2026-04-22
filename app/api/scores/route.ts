import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  const supabase = createAdminClient()
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data } = await supabase.auth.getUser(token)
    return { user: data.user, supabase }
  }
  return { user: null, supabase }
}

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const token = req.cookies.get('sb-access-token')?.value || req.headers.get('x-sb-token') || ''
  // Use admin client with user check via JWT - simplified for demo
  return NextResponse.json({ scores: [], message: 'Use authenticated client' })
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const authHeader = req.headers.get('cookie') || ''
  // Extract token from cookie
  const tokenMatch = authHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
  
  const { score, score_date, user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  if (!score || score < 1 || score > 45) return NextResponse.json({ error: 'Score must be 1–45' }, { status: 400 })
  if (!score_date) return NextResponse.json({ error: 'score_date required' }, { status: 400 })

  const { data: sub } = await admin.from('subscriptions').select('status').eq('user_id', user_id).eq('status','active').single()
  if (!sub) return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })

  const { data: existing } = await admin.from('golf_scores').select('id').eq('user_id', user_id).eq('score_date', score_date).single()
  if (existing) return NextResponse.json({ error: 'A score for this date already exists. Edit or delete it.' }, { status: 409 })

  const { data, error } = await admin.from('golf_scores').insert({ user_id, score, score_date }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ score: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = createAdminClient()
  const { id, score, score_date, user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  if (score && (score < 1 || score > 45)) return NextResponse.json({ error: 'Score must be 1–45' }, { status: 400 })
  const { data, error } = await admin.from('golf_scores').update({ score, score_date, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ score: data })
}

export async function DELETE(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const user_id = searchParams.get('user_id')
  if (!id || !user_id) return NextResponse.json({ error: 'id and user_id required' }, { status: 400 })
  const { error } = await admin.from('golf_scores').delete().eq('id', id).eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
