-- pg_cron scheduled jobs
-- Enqueue address releases every 5 minutes
SELECT cron.schedule('release-addresses', '*/5 * * * *',
  $$SELECT pgmq.send('notifications',
    jsonb_build_object('type','release_address','event_id', id::text))
    FROM events
    WHERE address_rule = 'before_event'
      AND publish_status = 'published'
      AND starts_at - (address_release_hours || ' hours')::interval <= now()
      AND id NOT IN (SELECT DISTINCT related_event_id FROM notifications
        WHERE template = 'address_release' AND status != 'failed')
  $$);

-- Enqueue 24h reminders daily at 9am UTC
SELECT cron.schedule('event-reminders', '0 9 * * *',
  $$SELECT pgmq.send('notifications',
    jsonb_build_object('type','reminder','booking_id', b.id::text))
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    WHERE b.status = 'confirmed'
      AND e.starts_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
  $$);

-- Payout reconciliation daily at 2am UTC
SELECT cron.schedule('reconcile-payouts', '0 2 * * *',
  $$SELECT pgmq.send('agent_tasks',
    jsonb_build_object('type','reconcile_payout','date', now()::date::text))
  $$);
