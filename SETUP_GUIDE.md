# GolfHero — Setup & Deployment Guide
## ⏱️ Est. time: 45–60 minutes

---

## STEP 1 — Supabase Setup (10 min)

1. Go to **https://supabase.com** → Sign up / Log in
2. Click **"New Project"**
   - Name: `golfhero`
   - Database Password: (save this somewhere!)
   - Region: pick closest to you
   - Click **"Create new project"** (takes ~2 min)

3. Once created, go to **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Open the file `supabase/schema.sql` from this project
6. Copy ALL the content → Paste into the SQL editor → Click **"Run"**
7. You should see "Success. No rows returned"

### Get your Supabase keys:
- Go to **Settings → API** (left sidebar)
- Copy these 3 values:
  - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Make yourself admin:
- Go to **Authentication → Users** 
- Sign up once on your deployed site first (or do it locally)
- Then go to **Table Editor → profiles**
- Find your user row → click it → set `is_admin` to `true` → Save

---

## STEP 2 — Stripe Setup (15 min)

1. Go to **https://stripe.com** → Sign up / Log in
2. You'll land on the Dashboard. Make sure you're in **Test Mode** (toggle top right)

### Get your API keys:
- Go to **Developers → API Keys** (left sidebar)
- Copy:
  - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
  - `Secret key` → `STRIPE_SECRET_KEY` (starts with `sk_test_`) — click "Reveal"

### Create subscription products & prices:
1. Go to **Products** (top nav) → **"Add product"**
2. **Product 1 — Monthly:**
   - Name: `GolfHero Monthly`
   - Click **"Add pricing"**
   - Pricing model: `Standard pricing`
   - Price: `19.99`
   - Currency: `GBP`
   - Billing period: `Monthly`
   - Click **"Save product"**
   - On the product page, click the price → copy the **Price ID** (starts with `price_`)
   - This is your `STRIPE_MONTHLY_PRICE_ID`

3. **Product 2 — Yearly:**
   - Click **"Add product"** again
   - Name: `GolfHero Yearly`
   - Price: `199.99` GBP, Billing: `Yearly`
   - Save → copy Price ID → `STRIPE_YEARLY_PRICE_ID`

### Set up Webhook (after deploying to Vercel):
1. Go to **Developers → Webhooks** → **"Add endpoint"**
2. Endpoint URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Click **"Add endpoint"**
5. Click on the webhook → **"Reveal"** the Signing secret
6. This is your `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

---

## STEP 3 — Local Setup (5 min)

```bash
# 1. Copy the example env file
cp .env.local.example .env.local

# 2. Fill in your values in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_SECRET_KEY=sk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
STRIPE_MONTHLY_PRICE_ID=price_xxx...
STRIPE_YEARLY_PRICE_ID=price_xxx...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. Install and run
npm install
npm run dev

# Open http://localhost:3000
```

---

## STEP 4 — Deploy to Vercel (10 min)

### Option A — Vercel CLI (fastest):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project folder
vercel

# Follow prompts:
# - Create new project? Yes
# - Project name: golfhero
# - Framework: Next.js (auto-detected)
```

### Option B — GitHub + Vercel Dashboard:
1. Push this project to a new GitHub repo
2. Go to **https://vercel.com** → **"Add New Project"**
3. Import your GitHub repo
4. Click **"Environment Variables"** → Add ALL the values from your `.env.local`
5. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://golfhero.vercel.app`)
6. Click **"Deploy"**

### After deploying:
- Go back to Stripe → Update webhook URL to your real Vercel URL
- Test signup → checkout → dashboard flow
- Sign up → go to Supabase → set `is_admin = true` → visit `/admin`

---

## STEP 5 — Test Checklist

Use Stripe test card: **4242 4242 4242 4242** (any exp/CVV)

- [ ] Homepage loads
- [ ] Sign up → Step 2 → Stripe checkout
- [ ] After payment → redirect to `/dashboard`
- [ ] Subscription status shows "active"
- [ ] Add score → appears in list
- [ ] Edit/delete score
- [ ] `/admin` → Dashboard stats
- [ ] Admin → Draw Engine → Simulate
- [ ] Admin → Draw Engine → Publish
- [ ] Admin → Winners → Approve payment
- [ ] Admin → Users → see all subscribers

---

## Test Credentials (set these up yourself)

After setup, create:
- **User:** sign up normally via `/signup`
- **Admin:** sign up → go to Supabase Table Editor → `profiles` → set `is_admin = true`

---

## Troubleshooting

**Stripe webhook not working locally?**
Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
Then: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Supabase RLS blocking queries?**
Make sure you ran the full `schema.sql` including the RLS policies section.

**Build error about Stripe API key?**
The build error during `npm run build` locally is expected if `.env.local` isn't filled.
On Vercel it will work fine with env vars set.
