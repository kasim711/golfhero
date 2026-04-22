-- ============================================================
-- GolfHero Platform — Complete Supabase Schema
-- Run this in your Supabase SQL Editor (new project)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'lapsed');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'rejected');
CREATE TYPE draw_status AS ENUM ('pending', 'simulated', 'published');
CREATE TYPE draw_logic AS ENUM ('random', 'algorithmic');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  upcoming_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan subscription_plan NOT NULL,
  status subscription_status DEFAULT 'inactive',
  charity_id UUID REFERENCES charities(id),
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOLF SCORES
-- ============================================================
CREATE TABLE golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, score_date)  -- one score per date per user
);

-- Keep only 5 scores per user — trigger
CREATE OR REPLACE FUNCTION enforce_max_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM golf_scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM golf_scores
      WHERE user_id = NEW.user_id
      ORDER BY score_date DESC
      LIMIT 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_scores
AFTER INSERT ON golf_scores
FOR EACH ROW EXECUTE FUNCTION enforce_max_scores();

-- ============================================================
-- DRAWS
-- ============================================================
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status draw_status DEFAULT 'pending',
  logic draw_logic DEFAULT 'random',
  drawn_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_prize_pool NUMERIC(10,2) DEFAULT 0,
  jackpot_pool NUMERIC(10,2) DEFAULT 0,
  match4_pool NUMERIC(10,2) DEFAULT 0,
  match3_pool NUMERIC(10,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  simulation_data JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- ============================================================
-- DRAW ENTRIES (user participation)
-- ============================================================
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores_snapshot INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  prize_amount NUMERIC(10,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ============================================================
-- CHARITY CONTRIBUTIONS
-- ============================================================
CREATE TABLE charity_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount_cents INTEGER NOT NULL,
  contribution_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRIZE POOL AUDIT
-- ============================================================
CREATE TABLE prize_pool_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id),
  subscription_id UUID REFERENCES subscriptions(id),
  contribution_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Golf scores: users manage own
CREATE POLICY "Users can manage own scores" ON golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Subscriptions: users see own
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Draws: everyone can view published
CREATE POLICY "Anyone can view published draws" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage draws" ON draws FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Draw entries: users see own
CREATE POLICY "Users can view own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage entries" ON draw_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Charities: public read
CREATE POLICY "Anyone can view charities" ON charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage charities" ON charities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Charity contributions: users see own
CREATE POLICY "Users can view own contributions" ON charity_contributions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — Sample Charities
-- ============================================================
INSERT INTO charities (name, description, image_url, is_featured, upcoming_events) VALUES
('Cancer Research UK', 'Funding world-class research to beat cancer sooner.', 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800', TRUE, '[{"name": "Charity Golf Day", "date": "2025-07-15", "location": "St Andrews"}]'),
('Children with Cancer', 'Dedicated to the research and treatment of childhood cancer.', 'https://images.unsplash.com/photo-1488521787991-ed7bbafc2c47?w=800', FALSE, '[]'),
('Macmillan Cancer Support', 'Providing medical, emotional, practical and financial support.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800', FALSE, '[{"name": "Golf Fundraiser", "date": "2025-08-20", "location": "Royal Birkdale"}]'),
('British Heart Foundation', 'Fighting cardiovascular disease through research.', 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=800', FALSE, '[]');

-- ============================================================
-- FUNCTION: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Calculate prize pools for a draw
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_prize_pools(draw_id UUID)
RETURNS VOID AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT SUM(amount_cents) / 100.0 INTO total
  FROM prize_pool_audit WHERE prize_pool_audit.draw_id = $1;

  UPDATE draws SET
    total_prize_pool = total,
    jackpot_pool = total * 0.40,
    match4_pool = total * 0.35,
    match3_pool = total * 0.25
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql;
