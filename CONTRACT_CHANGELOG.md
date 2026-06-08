# Contract changelog

Every change to `packages/contracts` or `packages/db` is logged here.

| Date | Change | Author |
|---|---|---|
| 2025-01-01 | Initial schemas: all entities, zod types, typed client | scaffold |
| 2025-01-01 | Initial SQL migrations 0001–0020 | scaffold |
| 2026-06-05 | chef.profile.get + chef.profile.update — needed for autopilot toggle and console header | Claude Code |
| 2026-06-05 | chef.events.bookings(eventId) — GET /chef/events/:id/bookings → Booking[] for guest list table | Claude Code |
| 2026-06-07 | migration 0021: feed_posts.is_hero_featured + hero_order — hero/curated reel flag | Claude Code |
| 2026-06-07 | migration 0022: chef_applications + invite_codes tables — invite-only onboarding flow | Claude Code |
| 2026-06-07 | migration 0023: chef_profiles.professional jsonb — resume/portfolio fields | Claude Code |
| 2026-06-07 | contract: HeroFeedPostSchema + GET /feed/hero — curated hero reel endpoint (public) | Claude Code |
| 2026-06-07 | contract: ChefApplicationSchema expanded + POST /chef-applications + POST /admin/invite-codes | Claude Code |
| 2026-06-07 | contract: ChefProfileSchema + ChefProfilePublicSchema extended with professional jsonb | Claude Code |
| 2026-06-07 | contract: ProfileImportRequestSchema + POST /chef/onboard/profile-import — AI profile generation | Claude Code |
