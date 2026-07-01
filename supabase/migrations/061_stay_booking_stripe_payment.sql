-- Store Stripe PaymentIntent id on confirmed stay bookings
ALTER TABLE stay_bookings
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stay_bookings_stripe_payment_intent
  ON stay_bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
