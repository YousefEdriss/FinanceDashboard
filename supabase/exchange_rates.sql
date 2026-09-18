-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the exchange_rates table that the GitHub Action writes to daily.

CREATE TABLE IF NOT EXISTS exchange_rates (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  usd_to_egp       DECIMAL(10, 4) NOT NULL,
  gold_egp_per_gram DECIMAL(10, 2) NOT NULL,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at whenever a row is changed
CREATE OR REPLACE FUNCTION update_exchange_rates_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exchange_rates_ts ON exchange_rates;
CREATE TRIGGER trg_exchange_rates_ts
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_exchange_rates_ts();

-- Enable Row Level Security
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated) to read rates
CREATE POLICY "Public read exchange rates"
  ON exchange_rates FOR SELECT USING (true);

-- Seed the first row so the app can read it immediately
INSERT INTO exchange_rates (id, usd_to_egp, gold_egp_per_gram)
VALUES (1, 50.0, 7800.0)
ON CONFLICT (id) DO NOTHING;
