-- Create plans table for VIP memberships
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'silver', 'gold', 'diamond'
  display_name TEXT NOT NULL, -- 'Silver Member', 'Gold Member', 'Diamond Member'
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0, -- For future pricing
  features JSONB DEFAULT '[]'::jsonb, -- Array of features/benefits
  badge_color TEXT NOT NULL, -- Color for UI badges (#C0C0C0, #FFD700, #B9F2FF)
  sort_order INTEGER NOT NULL DEFAULT 0, -- Display order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS plans_name_idx ON plans(name);
CREATE INDEX IF NOT EXISTS plans_sort_order_idx ON plans(sort_order);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active plans
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Insert default plans
INSERT INTO plans (name, display_name, description, price, features, badge_color, sort_order) VALUES
(
  'silver',
  'Silver Member',
  'Join the Silver tier and enjoy exclusive benefits',
  0,
  '[
    "Special Silver badge on profile",
    "Priority support",
    "Ad-free experience",
    "Custom profile themes"
  ]'::jsonb,
  '#C0C0C0',
  1
),
(
  'gold',
  'Gold Member',
  'Unlock premium features with Gold membership',
  0,
  '[
    "Everything in Silver",
    "Exclusive Gold badge",
    "Extended chat history",
    "Custom emoji reactions",
    "Premium voice filters"
  ]'::jsonb,
  '#FFD700',
  2
),
(
  'diamond',
  'Diamond Member',
  'Experience the ultimate VIP treatment',
  0,
  '[
    "Everything in Gold",
    "Exclusive Diamond badge",
    "Early access to new features",
    "VIP customer support",
    "Custom profile animations",
    "Unlimited recording storage"
  ]'::jsonb,
  '#B9F2FF',
  3
);
