CREATE TABLE public.ticket_types (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name             text NOT NULL,
  quantity         integer NOT NULL,
  price_cents      integer NOT NULL,
  sale_start       timestamptz,
  sale_end         timestamptz,
  is_deposit       boolean NOT NULL DEFAULT false,
  max_per_booking  integer NOT NULL DEFAULT 8
);
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON ticket_types FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE publish_status = 'published'));
CREATE POLICY "chef_manages" ON ticket_types FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE chef_profile_id IN
    (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())));
