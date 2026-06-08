-- Invite codes — admin-generated codes that grant priority/auto-eligible status
-- to chef applicants who include them in their application.
CREATE TABLE public.invite_codes (
  code          text PRIMARY KEY,
  created_by    uuid NOT NULL REFERENCES profiles(id),
  description   text,                          -- e.g. "Wave 1 SF chefs — June 2026"
  max_uses      integer NOT NULL DEFAULT 1,
  used_count    integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active', -- active | exhausted | revoked
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can read codes to validate on the apply form
CREATE POLICY "public_validate" ON invite_codes
  FOR SELECT USING (true);

-- Only admins create/update/revoke codes
CREATE POLICY "admin_manage" ON invite_codes
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────

-- Chef applications — public submit, admin review + approve flow.
-- Applications with a valid invite_code get priority_eligible=true automatically.
CREATE TABLE public.chef_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text NOT NULL,
  city             text NOT NULL,
  cuisine          text NOT NULL,
  experience       text NOT NULL,           -- "1-3" | "3-5" | "5-10" | "10+"
  social_handle    text,                    -- optional: Instagram / TikTok / site
  invite_code      text REFERENCES invite_codes(code),  -- nullable; links to code used
  about            text NOT NULL,           -- "Tell us about your cooking" long-form
  priority_eligible boolean NOT NULL DEFAULT false, -- true when a valid code was supplied
  status           text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by      uuid REFERENCES profiles(id),
  review_note      text,                    -- admin-internal rejection reason or note
  applied_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz
);

ALTER TABLE public.chef_applications ENABLE ROW LEVEL SECURITY;

-- Public can submit (no auth required — this is the chef application landing page)
CREATE POLICY "public_submit" ON chef_applications
  FOR INSERT WITH CHECK (true);

-- Admins read, update, approve, reject
CREATE POLICY "admin_all" ON chef_applications
  FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Indexes for admin triage views
CREATE INDEX idx_applications_status     ON chef_applications (status, applied_at DESC);
CREATE INDEX idx_applications_priority   ON chef_applications (priority_eligible, applied_at DESC)
  WHERE status = 'pending';
