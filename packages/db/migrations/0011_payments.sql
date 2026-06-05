CREATE TABLE public.payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid NOT NULL UNIQUE REFERENCES bookings(id),
  provider              text NOT NULL DEFAULT 'stripe',
  provider_payment_id   text,
  subtotal_cents        integer NOT NULL DEFAULT 0,
  tax_cents             integer NOT NULL DEFAULT 0,
  gratuity_req_cents    integer NOT NULL DEFAULT 0,
  gratuity_extra_cents  integer NOT NULL DEFAULT 0,
  platform_fee_cents    integer NOT NULL DEFAULT 0,
  processor_fee_cents   integer NOT NULL DEFAULT 0,
  refund_cents          integer NOT NULL DEFAULT 0,
  payout_cents          integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'requires_payment',
  updated_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_reads_payments" ON payments FOR SELECT
  USING (booking_id IN (SELECT b.id FROM bookings b
    JOIN events e ON e.id = b.event_id
    JOIN chef_profiles cp ON cp.id = e.chef_profile_id
    WHERE cp.owner_user_id = auth.uid()));
