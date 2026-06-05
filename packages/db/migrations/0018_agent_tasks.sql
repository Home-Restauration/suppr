CREATE TABLE public.agent_tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id),
  kind             text NOT NULL,
  status           text NOT NULL DEFAULT 'proposed',
  summary          text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  credits_used     integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_manages_agent_tasks" ON agent_tasks FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
