CREATE TABLE public.team_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions      jsonb NOT NULL DEFAULT '{"profile_events":false,"communication":false,"finance":false,"kitchen_guest_data":false,"refunds_comps":false}',
  invited_by       uuid REFERENCES profiles(id),
  accepted_at      timestamptz,
  UNIQUE(chef_profile_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_owner_manages_team" ON team_members FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
CREATE POLICY "member_reads_own" ON team_members FOR SELECT
  USING (user_id = auth.uid());
