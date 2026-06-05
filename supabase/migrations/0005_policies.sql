CREATE TABLE public.policies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid REFERENCES chef_profiles(id),
  scope            text NOT NULL DEFAULT 'chef',
  cancellation     jsonb NOT NULL DEFAULT '[]',
  reschedule       jsonb NOT NULL DEFAULT '[]',
  transfer         jsonb NOT NULL DEFAULT '[]',
  name_change      jsonb NOT NULL DEFAULT '[]',
  dietary_window   jsonb NOT NULL DEFAULT '[]'
);
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_manages_policies" ON policies FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
CREATE POLICY "public_read" ON policies FOR SELECT USING (true);
