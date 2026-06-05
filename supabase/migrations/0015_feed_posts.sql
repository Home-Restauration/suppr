CREATE TABLE public.feed_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id),
  media            jsonb NOT NULL DEFAULT '[]',
  caption          text,
  linked_event_id  uuid REFERENCES events(id),
  drafted_by_ai    boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'draft',
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published_posts_public" ON feed_posts FOR SELECT USING (status = 'published');
CREATE POLICY "chef_manages_posts" ON feed_posts FOR ALL
  USING (chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()));
CREATE INDEX idx_feed_posts_published ON feed_posts(published_at DESC) WHERE status = 'published';
