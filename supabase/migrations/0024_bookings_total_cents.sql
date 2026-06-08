-- Store the true Stripe-charged total on the booking row so the confirmation
-- page can display the real amount without re-deriving it from ticket prices.
-- Set by fulfillCheckoutSession when checkout.session.completed fires.
-- NULL on pre-existing bookings (backfill from payments table if needed).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_cents integer;
