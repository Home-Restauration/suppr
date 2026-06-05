CREATE TABLE public.seat_holds (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id),
  ticket_type_id   uuid NOT NULL REFERENCES ticket_types(id),
  qty              integer NOT NULL,
  expires_at       timestamptz NOT NULL,
  redeemed         boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_holds_event_expires ON seat_holds(event_id, expires_at) WHERE NOT redeemed;
