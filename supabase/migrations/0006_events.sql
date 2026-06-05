CREATE TABLE public.events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id       uuid NOT NULL REFERENCES chef_profiles(id),
  type                  text NOT NULL,
  title                 text NOT NULL,
  description           text,
  menu                  jsonb NOT NULL DEFAULT '[]',
  starts_at             timestamptz NOT NULL,
  capacity              integer NOT NULL,
  publish_status        text NOT NULL DEFAULT 'draft',
  visibility            text NOT NULL DEFAULT 'public',
  exact_address         text,
  approx_location       text NOT NULL,
  address_rule          text NOT NULL DEFAULT 'on_confirmation',
  address_release_hours integer,
  dietary_policy        jsonb NOT NULL DEFAULT '{"intake_required":false,"modifications_allowed":true,"cannot_accommodate":[],"upcharge_cents":0}',
  tax_enabled           boolean NOT NULL DEFAULT false,
  gratuity_required_pct numeric(5,2),
  gratuity_optional     boolean NOT NULL DEFAULT true,
  gratuity_before_tax   boolean NOT NULL DEFAULT false,
  policy_id             uuid REFERENCES policies(id),
  template_id           uuid,
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_events" ON events FOR SELECT
  USING (publish_status = 'published' AND visibility = 'public');
CREATE POLICY "chef_manages_events" ON events FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
CREATE INDEX idx_events_starts_at ON events(starts_at);
CREATE INDEX idx_events_chef ON events(chef_profile_id);
CREATE INDEX idx_events_status ON events(publish_status);
