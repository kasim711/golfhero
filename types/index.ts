export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type PaymentStatus = 'pending' | 'paid' | 'rejected'
export type DrawStatus = 'pending' | 'simulated' | 'published'
export type DrawLogic = 'random' | 'algorithmic'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  description: string
  image_url: string
  website_url?: string
  is_featured: boolean
  is_active: boolean
  upcoming_events: CharityEvent[]
  created_at: string
}

export interface CharityEvent {
  name: string
  date: string
  location: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  charity_id?: string
  charity_percentage: number
  current_period_start?: string
  current_period_end?: string
  amount_cents: number
  created_at: string
  updated_at: string
  charity?: Charity
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  score_date: string
  created_at: string
  updated_at: string
}

export interface Draw {
  id: string
  month: number
  year: number
  status: DrawStatus
  logic: DrawLogic
  drawn_numbers: number[]
  total_prize_pool: number
  jackpot_pool: number
  match4_pool: number
  match3_pool: number
  jackpot_rolled_over: boolean
  simulation_data?: SimulationData
  published_at?: string
  created_at: string
}

export interface SimulationData {
  total_entries: number
  match5_winners: number
  match4_winners: number
  match3_winners: number
  payout_per_match5: number
  payout_per_match4: number
  payout_per_match3: number
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  scores_snapshot: number[]
  match_count: number
  prize_amount: number
  payment_status: PaymentStatus
  proof_url?: string
  created_at: string
  profile?: Profile
  draw?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  subscription_id?: string
  amount_cents: number
  contribution_date: string
  charity?: Charity
}

// Stripe types
export interface CheckoutSessionRequest {
  plan: SubscriptionPlan
  charityId: string
  charityPercentage: number
}

// Dashboard stats
export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_contributed: number
  current_month_entries: number
}
