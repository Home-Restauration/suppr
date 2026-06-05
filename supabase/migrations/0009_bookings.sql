CREATE TABLE public.bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id),
  buyer_name       text NOT NULL,
  buyer_email      text,
  buyer_phone      text,
  guest_count      integer NOT NULL,
  status           text NOT NULL DEFAULT 'pending',
  channel          text NOT NULL DEFAULT 'web',
  address_sent_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_reads_bookings" ON bookings FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE chef_profile_id IN
    (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())));
CREATE POLICY "buyer_reads_own" ON bookings FOR SELECT
  USING (buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings(status);
