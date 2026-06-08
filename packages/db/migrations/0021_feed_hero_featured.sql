-- Hero/curated feed flag on feed_posts.
-- is_hero_featured: admin-toggled; surfaces the post in GET /feed/hero
-- hero_order: ascending sort order (lower = first); NULL = not in hero reel
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS is_hero_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_order       smallint;

-- Partial index for fast hero-reel query
CREATE INDEX IF NOT EXISTS idx_feed_hero
  ON public.feed_posts (hero_order ASC NULLS LAST)
  WHERE is_hero_featured = true AND status = 'published';

-- Admins can toggle hero features via API (handled by service role in API layer)
-- No additional RLS needed: existing policies cover public SELECT and chef management
