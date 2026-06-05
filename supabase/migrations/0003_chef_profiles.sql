CREATE TABLE public.chef_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid NOT NULL UNIQUE REFERENCES profiles(id),
  brand_name       text NOT NULL,
  bio              text,
  city             text NOT NULL,
  cuisines         text[] NOT NULL DEFAULT '{}',
  gallery          jsonb NOT NULL DEFAULT '[]',
  brand_accent     text,
  social_links     jsonb NOT NULL DEFAULT '{}',
  approval_status  text NOT NULL DEFAULT 'pending',
  payment_acct_id  text,
  visibility       text NOT NULL DEFAULT 'private',
  tier             text NOT NULL DEFAULT 'basic',
  autopilot        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_profiles" ON chef_profiles FOR SELECT
  USING (approval_status = 'approved' AND visibility = 'public');
CREATE POLICY "owner_all" ON chef_profiles FOR ALL
  USING (owner_user_id = auth.uid());
CREATE POLICY "admin_all" ON chef_profiles FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
