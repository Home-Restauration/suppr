CREATE TABLE public.notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient           text NOT NULL,
  channel             text NOT NULL,
  template            text NOT NULL,
  payload             jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'queued',
  related_booking_id  uuid REFERENCES bookings(id),
  related_event_id    uuid REFERENCES events(id),
  sent_at             timestamptz
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'queued';
