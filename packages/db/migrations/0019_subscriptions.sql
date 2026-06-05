CREATE TABLE public.subscriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL UNIQUE REFERENCES chef_profiles(id),
  tier             text NOT NULL DEFAULT 'basic',
  stripe_sub_id    text,
  credit_balance   integer NOT NULL DEFAULT 0,
  renews_at        timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_manages_subscription" ON subscriptions FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
