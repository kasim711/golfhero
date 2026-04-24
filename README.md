# GolfHero — Play. Give. Win. 🏌️

A subscription-driven web platform combining **golf performance tracking**, **monthly prize draws**, and **charity fundraising** — built with Next.js, Supabase, and Stripe.

> Built as part of the Digital Heroes Full-Stack Development Trainee Selection Process.

---

## 🌐 Live Demo

**Production URL:** https://golfhero-xi.vercel.app

| Role | Email | Password |
|------|-------|----------|
| Admin | *(set via Supabase)* | *(your password)* |
| User | *(sign up on site)* | *(your password)* |

---

## ✨ Features

### User Features
- 🔐 **Auth** — Signup, login, session management via Supabase Auth
- 💳 **Subscriptions** — Monthly (£19.99) and Yearly (£199.99) plans via Stripe
- ⛳ **Score Management** — Enter up to 5 Stableford scores (1–45), rolling latest 5, one per date
- 🎯 **Monthly Draws** — Scores automatically entered into monthly prize draws
- 💚 **Charity** — Choose a charity at signup, set contribution % (min 10%)
- 📊 **Dashboard** — Overview, scores, draw history, charity impact

### Admin Features
- 👥 **User Management** — View all users, subscriptions, scores
- 🎰 **Draw Engine** — Configure random or algorithmic draws, simulate, publish
- 🏆 **Winners Management** — View winners, verify proof uploads, mark payouts
- 💝 **Charity Management** — Add/edit/delete charities, manage featured spotlights
- 📈 **Analytics** — Total users, prize pools, charity contributions, draw stats

### Technical Highlights
- Rolling 5-score system enforced via Supabase database trigger
- Duplicate date prevention at database level
- Prize pool split: 40% jackpot (rolls over), 35% 4-match, 25% 3-match
- Algorithmic draw weighted by most frequent user scores
- Stripe webhook for real-time subscription activation
- Row Level Security (RLS) on all Supabase tables
- Fully responsive, mobile-first design

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom CSS Variables |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe (Subscriptions + Webhooks) |
| Deployment | Vercel |
| Fonts | Playfair Display + DM Sans |

---

## 📁 Project Structure

```
golfhero/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # 2-step signup (account + plan/charity)
│   ├── admin/              # Full admin panel
│   ├── api/
│   │   ├── draw/run/       # Draw engine API
│   │   ├── scores/         # Golf scores CRUD
│   │   └── stripe/
│   │       ├── create-checkout/   # Stripe checkout session
│   │       └── webhook/           # Stripe webhook handler
│   ├── dashboard/          # User dashboard
│   ├── subscribe/          # Subscribe page (for existing users)
│   └── page.tsx            # Landing page
├── lib/
│   ├── draw-engine.ts      # Draw algorithm logic
│   ├── stripe.ts           # Stripe client
│   ├── supabase.ts         # Supabase clients
│   └── utils.ts            # Utility functions
├── supabase/
│   └── schema.sql          # Complete DB schema + RLS + triggers + seed data
└── types/
    └── index.ts            # TypeScript types
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/golfhero.git
cd golfhero
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
- Go to Supabase → SQL Editor
- Run the entire contents of `supabase/schema.sql`

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Local Stripe Webhooks
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `subscriptions` | Stripe subscription records |
| `golf_scores` | User golf scores (max 5, rolling) |
| `charities` | Charity listings |
| `charity_contributions` | Per-payment charity donations |
| `draws` | Monthly draw records |
| `draw_entries` | User participation in draws |
| `prize_pool_audit` | Prize pool contribution tracking |

### Key Database Rules
- **One score per date per user** — enforced via `UNIQUE(user_id, score_date)`
- **Max 5 scores** — enforced via `enforce_max_scores` trigger
- **Auto profile creation** — `handle_new_user` trigger on `auth.users`
- **RLS enabled** on all tables

---

## 🎰 Draw Engine

Two modes available:

**Random** — Standard lottery, 5 unique numbers from 1–45

**Algorithmic** — Weighted by most frequent user scores across all active subscribers — more likely to produce winners, more exciting!

### Prize Distribution
| Match | Pool Share | Rollover |
|-------|-----------|---------|
| 5-Number Match | 40% | ✅ Yes (Jackpot) |
| 4-Number Match | 35% | ❌ No |
| 3-Number Match | 25% | ❌ No |

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

Add all environment variables in Vercel → Settings → Environment Variables.

### Stripe Webhook (Production)
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-app.vercel.app/api/stripe/webhook`
3. Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`
4. Copy signing secret → add to Vercel env as `STRIPE_WEBHOOK_SECRET`

---

## 📋 PRD Compliance Checklist

- ✅ Subscription engine (Monthly + Yearly via Stripe)
- ✅ Score entry (Stableford, 1–45, rolling 5, one per date)
- ✅ Draw engine (Random + Algorithmic, simulation + publish)
- ✅ Prize pool logic (40/35/25 split, jackpot rollover)
- ✅ Charity system (min 10%, adjustable %, independent donations structure)
- ✅ Winner verification (proof upload, approve/reject, payment tracking)
- ✅ User dashboard (all 5 modules)
- ✅ Admin dashboard (users, draws, charities, winners, analytics)
- ✅ Mobile-first responsive design
- ✅ Emotion-driven UI (not traditional golf aesthetics)
- ✅ Supabase backend with proper schema
- ✅ Deployed on Vercel

---

## 👨‍💻 Author

Built by **Kasim Nalawala**  
Full-Stack Developer | React Native + Next.js + Supabase

---

*This project was built as a sample assignment submission for Digital Heroes Full-Stack Development Trainee selection.*
