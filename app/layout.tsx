import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'GolfHero — Play. Give. Win.',
  description: 'Golf performance tracking, monthly prize draws, and charity fundraising.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster theme="dark" toastOptions={{ style: { background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' } }} />
      </body>
    </html>
  )
}
