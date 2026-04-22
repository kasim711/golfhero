import { createBrowserClient as createBrowser, createServerClient as createServer } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side — works in browser
export function createBrowserClient() {
  return createBrowser(SUPABASE_URL, SUPABASE_ANON)
}

// Server-side — synchronous, pass cookies manually in API routes
export function createServerClient(cookieStore?: any) {
  if (cookieStore) {
    return createServer(SUPABASE_URL, SUPABASE_ANON, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove: (name: string, options: any) => { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    })
  }
  // Fallback — no auth (for use in server components that import cookies themselves)
  return createClient(SUPABASE_URL, SUPABASE_ANON)
}

// Admin client — service role, bypasses RLS
export function createAdminClient() {
  return createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
