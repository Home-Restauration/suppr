CREATE TABLE public.invoices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id    uuid NOT NULL REFERENCES chef_profiles(id),
  client_info        jsonb NOT NULL DEFAULT '{}',
  details            jsonb NOT NULL DEFAULT '{}',
  total_cents        integer NOT NULL DEFAULT 0,
  deposit_cents      integer NOT NULL DEFAULT 0,
  balance_due_cents  integer NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'draft',
  pay_link           text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_manages_invoices" ON invoices FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
