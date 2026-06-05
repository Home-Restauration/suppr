CREATE TABLE public.waitlist (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id               uuid NOT NULL REFERENCES events(id),
  contact                text NOT NULL,
  channel                text NOT NULL,
  notified_at            timestamptz,
  converted_booking_id   uuid REFERENCES bookings(id),
  created_at             timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_reads_waitlist" ON waitlist FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE chef_profile_id IN
    (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())));
