# Contract changelog

Every change to `packages/contracts` or `packages/db` is logged here.

| Date | Change | Author |
|---|---|---|
| 2025-01-01 | Initial schemas: all entities, zod types, typed client | scaffold |
| 2025-01-01 | Initial SQL migrations 0001–0020 | scaffold |
| 2026-06-05 | chef.profile.get + chef.profile.update — needed for autopilot toggle and console header | Claude Code |
| 2026-06-05 | chef.events.bookings(eventId) — GET /chef/events/:id/bookings → Booking[] for guest list table | Claude Code |
