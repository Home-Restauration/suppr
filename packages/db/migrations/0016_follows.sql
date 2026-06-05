CREATE TABLE public.follows (
  follower_user_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chef_profile_id   uuid NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, chef_profile_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_follows" ON follows FOR ALL USING (follower_user_id = auth.uid());
CREATE POLICY "chef_reads_followers" ON follows FOR SELECT
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
