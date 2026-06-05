CREATE TABLE public.guests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name           text NOT NULL,
  email          text,
  phone          text,
  allergens      text[] NOT NULL DEFAULT '{}',
  dietary        text[] NOT NULL DEFAULT '{}',
  notes          text,
  accommodation  text
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_kitchen_reads_guests" ON guests FOR SELECT
  USING (booking_id IN (SELECT b.id FROM bookings b
    JOIN events e ON e.id = b.event_id
    JOIN chef_profiles cp ON cp.id = e.chef_profile_id
    WHERE cp.owner_user_id = auth.uid()));
