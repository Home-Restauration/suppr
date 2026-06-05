# CLAUDE.md — Claude Code conventions for Suppr

Read this at the start of every task. Also read `AGENTS.md` for shared rules.
Your ownership: `apps/web`, `packages/ui`, `packages/tokens`.

---

## 1. What you own

```
apps/web/           Next.js 14 App Router — guest, chef console, admin, public pages, PWA, in-app concierge chat UI
packages/ui/        Component library (Button, Card, Chip, Field, PriceBreakdown, EventCard, FeedCard, ...)
packages/tokens/    Design tokens (CSS vars + Tailwind theme extension)
```

You consume `packages/contracts` (typed API client) and call `apps/api` through it. You do **not** write backend logic, migrations, or bot code. If you need a new API endpoint or schema field, open a `contract/` PR.

---

## 2. Design system — always use tokens, never hardcode

The full token set is in `packages/tokens/tokens.css` and re-exported as a Tailwind theme in `packages/tokens/tailwind.ts`.

**Canonical colors:**
```
--color-canvas        #FDFCFA   Porcelain   primary bg
--color-surface       #F7F4EE   Alabaster   card bg
--color-surface-2     #EFEAE0   Oat         raised element
--color-hairline      #EAE4D9   border
--color-text          #34302A   Graphite    primary text
--color-text-2        #6B6458   Slate       secondary text
--color-text-muted    #9A9384   Mist        muted
--color-accent        #C77B5C   Clay        brand accent — ration to <5% of surface
--color-accent-tint   #F3E4DB   Clay tint
--color-accent-deep   #9C5538   Clay deep (text on tint bg)
--color-brass         #B79A5E   Brass       luxe details only — hairlines, marks
--color-paid          #4E7A5E / --color-paid-bg    #EAF1EA   Sage
--color-note          #9A7636 / --color-note-bg    #F6EFDD   Honey
--color-alert         #B5564A / --color-alert-bg   #F6E6E2   Rose
--color-trust         #4A7387 / --color-trust-bg   #E8F0F2   Harbor
```

Dark mode (data-theme="dark") tokens are defined — always use CSS variables so dark mode works. Never write literal hex values in component code. Use `bg-[var(--color-canvas)]` in Tailwind or `style={{ background: 'var(--color-canvas)' }}` inline.

**Typography:**
- `--font-display` (Fraunces, serif) — editorial/display headings only (event titles, chef names on profile hero). Use sparingly.
- `--font-sans` (Inter, system-ui) — everything else.
- Primary action button: `bg-[var(--color-text)] text-[var(--color-canvas)]` (graphite on light, bone on dark)
- Clay accent: chips, "seats left" urgency, active tab indicators, brand logo. Rarely a button.
- Brass: thin horizontal rules, verified-host mark, premium micro-details only.

---

## 3. Component library (`packages/ui`)

Build components in this order (unblock checkout first):
1. `Button` (primary / secondary / ghost / danger sizes: sm, md, lg)
2. `Card` (surface, hairline border, radius-lg)
3. `Chip` / `Badge` (with color variant: paid, note, alert, trust, accent)
4. `Field` + `Label` + `HelperText` (controlled inputs)
5. `PriceBreakdown` (line-item list: label + amount, total row)
6. `AllergenSelector` (Big 9 checkboxes + Other + dietary restrictions)
7. `EventCard` (feed card: media placeholder, chef row, title, seats chip, CTA)
8. `FeedCard` (same as EventCard but for the feed — media-first)
9. `PhoneFrame` (wrapper for concierge mockup in Storybook/docs)

Rules:
- Every component is TypeScript with explicit prop types.
- Every component accepts `className` for Tailwind overrides.
- No inline styles except for dynamic CSS variables (e.g. `style={{ '--brand': chefAccent }}`).
- Components must work in both light and dark themes without passing a theme prop — use CSS vars.
- No external UI library (no shadcn, no MUI). Build from scratch against the token set.

---

## 4. Next.js conventions

**App Router file structure:**
```
apps/web/app/
  (public)/              # discovery, event pages, chef profiles — no auth required
    page.tsx             # landing / feed
    events/[id]/page.tsx
    chefs/[handle]/page.tsx
  (guest)/               # checkout, waitlist, booking confirmation
    checkout/[holdId]/page.tsx
    booking/[id]/page.tsx
  (chef)/                # chef console — authenticated
    console/
      dashboard/page.tsx
      events/page.tsx
      events/[id]/page.tsx
      reports/page.tsx
      team/page.tsx
      posts/page.tsx
  (admin)/               # admin console — admin role only
    admin/
      applications/page.tsx
      events/page.tsx
  concierge/page.tsx     # in-app concierge chat
  layout.tsx
  providers.tsx          # Supabase, theme, etc.
```

**Server vs client components:**
- Use React Server Components (RSC) for data-fetching pages (event page, chef profile, dashboard snapshot).
- Use `'use client'` only when you need interactivity (checkout form, concierge chat, feed infinite scroll, allergen selector).
- Never fetch from the API in a client component on first load — prefetch in RSC, pass as props.

---

## 5. Supabase client in Next.js

Use `@supabase/ssr` for both server and client components. Never use the anon key on the server for sensitive data — use the service role via `createServiceClient()` only in trusted server contexts (route handlers, server actions).

```typescript
// packages/ui/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, ... } }
  )
}

// For client components: @supabase/ssr createBrowserClient with anon key only
```

RLS handles access control — the anon key is safe for public data when RLS is correctly configured.

---

## 6. Calling the API

Always use the typed client from `packages/contracts`. Never write raw `fetch` calls to `apps/api`.

```typescript
import { createApiClient } from '@suppr/contracts/client'

const api = createApiClient({ baseUrl: process.env.API_URL!, token: session?.access_token })
const events = await api.events.list({ lat: 37.8, lng: -122.2, date: 'tonight' })
```

The client is generated from the OpenAPI spec in `packages/contracts/openapi.json`. If you need a new endpoint, open a `contract/` PR — don't write the fetch yourself.

---

## 7. PWA + feed

The web app is an installable PWA. Config in `apps/web/public/manifest.json` and `next.config.js` (via `next-pwa` / Workbox).

Feed infinite scroll:
- Use **Supabase Realtime** for live new-post updates: `supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, handler).subscribe()`
- Paginate with cursor (`?cursor=<last_published_at>`) via the API.
- Intersection Observer for scroll-triggered loading — no third-party infinite-scroll library.

Web Push:
- Subscribe users in the PWA using the VAPID public key (`WEB_PUSH_VAPID_PUBLIC`).
- Push subscription endpoint sent to `apps/api` for storage against the user/chef profile.
- Notifications sent server-side from `apps/api` job (not from the client).

---

## 8. Auth (Supabase)

Guests transact without an account. After a successful booking, offer (don't force) account creation to save history.

For chef/admin authenticated routes:
- Middleware in `apps/web/middleware.ts` checks session and redirects unauthenticated requests to `/login`.
- Magic link and OTP flows via Supabase Auth UI or custom form calling `supabase.auth.signInWithOtp()`.
- The chef console layout (`(chef)/layout.tsx`) fetches the chef profile and team permissions server-side — pass as context.

---

## 9. Checkout flow (critical path — build first)

```
/checkout/[holdId]
  ↓ RSC: load hold + event + line items from API (quote endpoint)
  ↓ Client: GuestDetailsForm (buyer name, email/phone)
  ↓ Client: per-guest AllergenSelector × guestCount  ← never skip
  ↓ Client: PriceBreakdown (all line items visible)
  ↓ Client: PolicyAcknowledgement checkboxes
  ↓ Submit → POST /bookings → get checkoutUrl → redirect to Stripe Checkout
  ↓ Stripe redirects to /booking/[id]/confirmation
```

The hold expires (API enforces it). Show a countdown timer and expire gracefully back to the event page.

---

## 10. Chef console design principles

Every chef console screen follows the zero-admin principle: **the AI has already done the work; the chef reviews and taps approve/reject.** Design the UI to reflect this:
- The AI activity rail (right column on desktop) shows `agent_tasks` with approve/reject for `draft-approve` mode, or a read-only log for `autopilot` mode.
- Event-day dashboard: metric cards (covers, allergies flagged, sales, tips) → guest table with dietary chips → AI rail.
- Event builder: all required fields guided with inline help. Templates pre-fill everything. AI autofill button drafts from a text prompt.

---

## 11. Media & images

- All images served via `AZURE_CDN_ENDPOINT` as base URL, not directly from Supabase Storage.
- Use Next.js `<Image>` with the CDN domain in `next.config.js` `images.remotePatterns`.
- Upload flow: client → signed URL from API → direct upload to Supabase Storage → CDN serves.
- Feed video: upload to Mux via API → store `mux_playback_id` → render with Mux Player or `<video>` with HLS.

---

## 12. Things you must never do

- Never hardcode credentials, API keys, or base URLs (read from `process.env`).
- Never disable RLS or use `supabase.rpc('disable_rls', ...)`.
- Never return `exact_address` in any client-facing component or API call — this comes through a controlled release endpoint only.
- Never write payment calculation logic in the web app — call `packages/core` via the API.
- Never create a new Tailwind color class that isn't in `packages/tokens/tailwind.ts`.
- Never install a UI component library (shadcn, MUI, Chakra, etc.). Build against the token set.
- Never make `fetch` calls to `apps/api` outside the typed client from `packages/contracts`.
- Never call Modal endpoints directly from the web app. Modal is a server-side batch runner called by `apps/api` or Render workers — never from the browser.
- Never call Nebius directly from the web app or any client component. LLM inference goes through `apps/api`.
- Never put the Supabase service role key in a client component or browser bundle.

---

## 13. How to request new contracts or schema fields

1. Draft the proposed change as a comment on the task or a `contract/` branch.
2. Describe: what endpoint/field, why, what it returns, what it changes.
3. Tag Codex (or the human lead) for review before writing the web UI code against it.
4. Once merged and `packages/contracts` is updated, regenerate the typed client: `pnpm --filter packages/contracts build`.

---

## 14. Local dev setup (ask human for credentials first — see AGENTS.md §3)

```bash
pnpm install                    # install all workspace deps
supabase start                  # local Supabase stack (Docker required)
supabase db reset               # apply all migrations fresh

# Terminal 1 — API
pnpm --filter apps/api dev

# Terminal 2 — Web
pnpm --filter apps/web dev

# Open http://localhost:3000
```

The web app mocks `apps/api` responses via `packages/contracts/mock-server.ts` until the real API is ready — use the mock for frontend development.

---
*If anything here conflicts with `SUPPR_BUILD_PLAN.md` or `AGENTS.md`, those documents win.*
