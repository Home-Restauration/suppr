-- Append-only. Never UPDATE or DELETE rows.
CREATE TABLE public.ledger_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid REFERENCES events(id),
  booking_id   uuid REFERENCES bookings(id),
  type         text NOT NULL,
  amount_cents integer NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_reads_ledger" ON ledger_entries FOR SELECT
  USING (event_id IN (SELECT id FROM events WHERE chef_profile_id IN
    (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())));
CREATE INDEX idx_ledger_event ON ledger_entries(event_id);
CREATE INDEX idx_ledger_occurred ON ledger_entries(occurred_at);
