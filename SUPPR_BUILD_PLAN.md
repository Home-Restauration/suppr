# Suppr — Build Plan & Technical Spec

**Version:** 1.0 (build kickoff)
**Audience:** Claude Code + Codex (collaborating coding agents) and the human engineering lead
**Working name:** Suppr *(pending final trademark + domain + app-store availability check — keep it isolated to one constant `BRAND` so it can be swapped)*
**Source of truth:** This document supersedes earlier planning docs where they conflict. Notable reversal: **web app + iMessage/WhatsApp bot ship first and deliver the complete experience; the native mobile app ships last.**

---

## 0. How to read this document

This is the canonical spec. Two agents build in parallel:

- **Claude Code** owns the **web app** (`apps/web`) and the **design system** (`packages/ui`, `packages/tokens`).
- **Codex** owns the **backend services** (`apps/api`), the **concierge bot** (`apps/bot`), and **integrations** (Stripe, Twilio/WhatsApp/iMessage, email, queue).
- Both depend on **`packages/contracts`** (zod schemas + generated OpenAPI + shared TS types) and **`packages/db`** (Supabase SQL migrations). These two packages are the only co-edited surfaces and changes to them require the handshake described in §3.

Build order is phased in §12. The non-negotiable target for Phase 1: **a guest can discover, book, pay, submit dietary info, and get confirmations entirely through the web app OR through iMessage/WhatsApp, and a chef can run an entire event without manual admin.**

---

## 1. Product in one page

Suppr is a curated marketplace for **culinary experiences** — ticketed supper clubs, chef dinners, private dinners, cooking workshops, tastings, and chef-led food/beverage events. It is *food-only Airbnb Experiences* with the operational power of a chef booking platform, and a privacy-first posture for intimate dining.

**Three doors into the same booking:**
1. **Web app** (responsive, installable PWA) — discovery feed, chef profiles, event pages, checkout, bookings, account-optional.
2. **Concierge bot** (one marketplace bot on WhatsApp + iMessage + SMS + in-app web chat) — "any home dining near me tonight?" → finds nearby chefs → books → sends payment link → handles changes within policy.
3. **Shareable web event links** — every event has a public URL that opens in any browser (link-in-bio, SMS, the bot's payment link). No download required, ever.

**First principles (hold the line on these):**
- **Chefs cook; the AI runs everything else.** Every workflow must remove manual follow-up, dietary collection, cancellation/refund handling, messaging, reporting, or address sharing. The chef console should trend toward an approve/decline inbox or full auto-pilot.
- **Low friction for guests.** No forced account to browse, waitlist, or book.
- **Privacy is a feature.** Exact address is chef-controlled and released by rule. No public attendee lists in V1.
- **Curation is a feature.** Chefs apply and are approved before public hosting.
- **We hold the rails.** Line-item payment ledger from day one; we are the trusted middle for payments and settlement.
- **Transparent pricing.** Every fee is a visible line item. Never a black-box total.

**Two chef tiers:**
- **Basic Chef — free.** Full manual product (profile, events, dashboard, dietary intake, address release, SMS/email confirmations, team permissions, policy-based self-service refunds). Platform earns on the diner booking fee.
- **Chef + AI — $20/mo + metered AI credits.** Unlocks the concierge taking bookings, AI guest comms, event autofill from templates, marketing/feed drafting, loyalty/birthday outreach, private-inquiry → quote, and AI customer service. This replaces a chef's admin staff, which is what retains successful chefs.

---

## 2. Scope

### 2.1 Phase 1 must-deliver (web + bot = complete experience)

- Public landing + discovery pages + **scrollable feed (PWA, installable, web-push)**
- Chef application & admin approval
- Approved chef public profiles (brand, story, gallery, social links, city, cuisine, event list, follow, one optional brand-accent color)
- Event builder with **templates + AI autofill**, images/gallery, capacity, ticket types, tax toggle, required + optional gratuity, dietary policy, address privacy + release rule
- Public event pages (photo-forward, transparent line-item pricing, dietary policy, approximate location, policy disclosures)
- Booking checkout: guest-by-guest details, **Big 9 allergens + Other + dietary restrictions per guest per booking**, acknowledgements, payment
- **Payment orchestration** (Stripe Connect hybrid): ticketed checkout, private quotes/invoices, deposits + balances, refunds, line-item ledger, payouts
- **Notifications**: SMS-first + email confirmations, reminders, address release, updates, cancellations
- **Address privacy + release engine**
- **Policy engine** with guest self-service (cancel/reschedule/transfer/name-change within policy)
- **Waitlist** (phone/email, drop notifications, convert to booking)
- **Private bookings** (inquiry → AI-drafted quote → deposit/balance/payment link)
- **Chef console (web, desktop-first)**: event-day snapshot, guest list, dietary/allergy summary, payment status, tips, taxes, financial summary, CSV export, **AI activity rail + auto-pilot/approve toggle**
- **Team permissions** (granular: profile/events, communication, finance, kitchen/guest data, refunds/comps)
- **Admin console**: approvals, moderation, support view, curation/featuring, account pause
- **The concierge bot** on WhatsApp + iMessage + SMS + in-app web chat: discovery, booking, dietary capture, payment link, post-booking changes within policy, escalation
- **Billing**: tier management + metered AI credit accounting
- **Feed authoring + AI marketing drafting** (chef posts dishes/drops; AI drafts posts from event photos)
- **Loyalty agent** (birthday notes, "your chef just dropped" re-engagement) — Chef+AI tier

### 2.2 Explicit non-goals for Phase 1

- **No native iOS/Android app at launch** (it is the *last* phase). The PWA carries mobile.
- No forced guest social profile; no public guest-list/RSVP visibility.
- No auto-cancellation of entire events on minimum-ticket thresholds.
- No platform regulation of permits/alcohol/venue legality beyond terms, attestations, and disclosures.
- No deep kitchen/menu costing software (start with guest lists, dietary lists, prep summaries).
- Full QuickBooks **sync** is later; Phase 1 ships **QuickBooks-ready CSV export** and a clean line-item ledger.

---

## 3. Agent collaboration protocol (Claude Code × Codex)

The goal is **parallel work with zero merge collisions.** Achieve it with contract-first development and strict ownership.

### 3.1 Ownership map

| Surface | Owner | Notes |
|---|---|---|
| `packages/contracts` | **Shared** | Co-edited only via the handshake below. The integration seam. |
| `packages/db` (Prisma) | **Shared** | Codex leads schema; Claude Code proposes UI-driven fields via PR. |
| `packages/tokens` | Claude Code | Design tokens (CSS vars + Tailwind theme). |
| `packages/ui` | Claude Code | Component library. |
| `apps/web` | Claude Code | Next.js: guest, chef console, admin, public pages, PWA, in-app concierge chat UI. |
| `apps/api` | Codex | Service layer, all domain logic, REST endpoints, webhooks, jobs. |
| `apps/bot` | Codex | Concierge agent + WhatsApp/iMessage/SMS channel adapters. |
| `packages/core` | Codex | Pure domain logic: pricing engine, policy engine, address-release rules, ledger. Importable + unit-tested. |
| `infra/` | Codex | Deploy config, queue, env templating. |

### 3.2 Contract-first handshake (do this before parallel work begins)

1. Both agents agree on `packages/contracts`: zod schemas for every entity and every request/response, exported as TS types, plus a generated `openapi.json`.
2. `apps/web` calls `apps/api` **only** through a generated, typed client built from `packages/contracts`. No ad-hoc fetch shapes.
3. `apps/bot` calls `apps/api` through the same typed client (service-to-service token auth).
4. **Any change to `packages/contracts` or `packages/db` requires:** a PR titled `contract:` or `schema:`, a one-line summary in `CONTRACT_CHANGELOG.md`, and a green build of both apps before merge. Treat these like API versioning.

### 3.3 Conventions

- Monorepo: **pnpm workspaces + Turborepo**. TypeScript everywhere. Node 20+.
- Branch naming: `web/...` (Claude Code), `api/...` `bot/...` (Codex), `contract/...` `schema/...` (either, via handshake).
- Every domain rule in `packages/core` ships with unit tests (pricing, refunds, address release, gratuity-vs-tax). These are the highest-risk areas.
- Mock seams: `apps/web` ships against a `contracts`-conformant mock server so Claude Code is never blocked by `apps/api`. `apps/bot` likewise. Integration happens at the checkpoints in §12.
- Definition of done per task: typed, tested (core logic), conforms to `contracts`, passes lint, and is exercised by at least one happy-path + one policy-edge test.

---

## 4. Architecture

```
                         ┌──────────────────────────────┐
   WhatsApp / iMessage /  │  apps/bot  (Codex)           │
   SMS  ───────────────▶  │  channel adapters +          │
                          │  concierge LLM agent (tools) │
                          └───────────────┬──────────────┘
                                          │ typed client (contracts)
   Browser / PWA ──────▶ ┌───────────────▼──────────────┐
   (guest, chef, admin)   │  apps/api  (Codex)           │
        ▲                 │  REST + zod, webhooks, jobs  │
        │ typed client    │  uses packages/core + db     │
   ┌────┴───────────┐     └───────────────┬──────────────┘
   │ apps/web        │                    │
   │ (Claude Code)   │        ┌───────────┴───────────┐
   │ Next.js + PWA   │        │ Postgres (Prisma)      │
   │ packages/ui     │        │ Redis + BullMQ (jobs)  │
   │ packages/tokens │        │ Object storage (media) │
   └─────────────────┘        └────────────────────────┘
        external: Stripe Connect · Twilio (SMS+WhatsApp) · iMessage provider · Resend (email) · Mux/CF Stream (feed video) · Nebius LLM (agent) · Web Push · Azure CDN
```

### 4.1 Stack

- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind (themed from `packages/tokens`) + React Server Components. PWA via `next-pwa` / Workbox + Web Push API.
- **API:** Fastify + zod — standalone Node service (`apps/api`) so both web and bot share one backend. Generates OpenAPI from zod schemas.
- **Database & auth:** **Supabase** — Postgres, Row Level Security, Supabase Auth (passwordless: magic link + OTP), Supabase Storage (images), Supabase Realtime (feed live updates). No Prisma. Migrations in plain SQL (`packages/db/migrations/`). Supabase client: `@supabase/supabase-js` + `@supabase/ssr` for Next.js server components.
- **Jobs / scheduling — three-layer split (no Redis, no BullMQ):**
  - **~80% → Supabase pg_cron + pgmq + Edge Functions.** Reminders, address release, drop alerts, payout reconciliation, webhook triggers. Runs inside Supabase at effectively $0.
  - **~15% → Render background worker.** One always-on 512 MB worker (~$7/mo) consumes the `notifications` pgmq queue and dispatches Twilio (SMS/WhatsApp) + Resend (email). Node.js native. Low latency, predictable cost.
  - **~5% → Modal.** Burst AI batch jobs only: bulk loyalty outreach, mass event autofill for many chefs, any GPU-intensive future workload. Modal is Python-native — expose batch functions as Modal web endpoints (`@app.function` + `@modal.web_endpoint`), call via HTTP from Node with a `SERVICE_TOKEN`. Zero idle cost; $30/mo free tier covers early scale.
  - **LLM = inference endpoint only.** Not a job runner. Every AI job above calls the LLM (Azure AI Foundry primary; Nebius for reasoning/overflow) regardless of which layer orchestrates it.
- **LLM / AI (two providers, both OpenAI-compatible):**
  - **Azure AI Foundry** — primary fast-conversational tier. Model `Llama-4-Maverick-17B-128E-Instruct-FP8` via the `openai` package (`baseURL = ${AZURE_ENDPOINT}/models`, `api-version` query param, `api-key` header). Powers the concierge agent, event autofill, and guest comms; supports tool-calling.
  - **Nebius AI token factory** (`https://api.tokenfactory.nebius.com/v1`) — available for overflow/batch; its `deepseek-ai/DeepSeek-V3.2` model is available for high-stakes reasoning (refund calc, reconciliation) when stronger reasoning is needed.
- **Deployment:** **Render** — web services for `apps/web`, `apps/api`, `apps/bot`; one Render background worker for the pgmq notification consumer. Render cron available as a secondary scheduler if needed. Modal runs separately as burst Python functions (see jobs split above).
- **Payments:** Stripe Connect hybrid (see §9.6).
- **Messaging:** Twilio — SMS + WhatsApp Business API. **iMessage:** see §10.1 (Apple Messages for Business or SendBlue; SMS is the universal fallback).
- **Email:** Resend.
- **Media:** Supabase Storage for images (up to 50MB per file); **Mux** for feed video (upload API + playback URL). **Azure CDN** fronts both for global low-latency delivery; Azure Blob Storage available as overflow/backup.
- **Azure:** **Azure AI Foundry** is the primary LLM inference layer (see LLM / AI above). Azure CDN fronts Supabase Storage + Mux for global delivery; Azure Blob Storage is overflow media backup. Other Azure services (e.g. Azure Maps) are available but not primary.

### 4.2 Monorepo layout

```
suppr/
├─ apps/
│  ├─ web/        # Next.js — Claude Code
│  ├─ api/        # Fastify service — Codex
│  └─ bot/        # concierge agent + channel adapters — Codex
├─ packages/
│  ├─ contracts/  # zod schemas, OpenAPI, typed client — SHARED
│  ├─ db/         # Supabase SQL migrations — SHARED (Codex leads)
│  ├─ core/       # pricing, policy, address-release, ledger — Codex
│  ├─ tokens/     # design tokens — Claude Code
│  └─ ui/         # component library — Claude Code
├─ infra/         # deploy, queue, env — Codex
│  ├─ modal/       # Python Modal batch functions (loyalty, bulk autofill) — Codex
├─ CONTRACT_CHANGELOG.md
└─ turbo.json / pnpm-workspace.yaml
```

---

## 5. Environment & services

All credentials go in `.env` (templated as `infra/env.example`). **Agents must never hardcode credentials — always read from `process.env`.** At each setup step (see §15) the agent will ask the human for the specific keys needed before proceeding.

```bash
# ── Brand ────────────────────────────────────────────────────────────────────
BRAND=Suppr

# ── App ──────────────────────────────────────────────────────────────────────
APP_URL=                         # e.g. https://suppr.co
API_URL=                         # e.g. https://api.suppr.co
SERVICE_TOKEN=                   # shared secret: api <-> bot auth

# ── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL=                    # https://<project>.supabase.co
SUPABASE_ANON_KEY=               # public anon key (safe in browser)
SUPABASE_SERVICE_ROLE_KEY=       # secret — server-side only, never in browser
SUPABASE_DB_URL=                 # postgres://... direct connection for migrations
SUPABASE_STORAGE_BUCKET_IMAGES=  # e.g. suppr-media
SUPABASE_STORAGE_BUCKET_VIDEO=   # e.g. suppr-video (pre-upload before Mux)

# ── AI / LLM ──────────────────────────────────────────────────────────────────
# Fast conversational (concierge bot, event autofill, comms) → Azure AI Foundry · Llama 4 Maverick
AZURE_ENDPOINT=                  # https://<resource>.services.ai.azure.com
AZURE_API_KEY=
BOT_MODEL=Llama-4-Maverick-17B-128E-Instruct-FP8
# High-stakes reasoning / overflow batch → Nebius token factory · DeepSeek V3.2
NEBIUS_API_KEY=                  # token factory key
NEBIUS_API_URL=https://api.tokenfactory.nebius.com/v1
DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3.2

# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=           # from: stripe listen --forward-to ...
STRIPE_CONNECT_CLIENT_ID=        # platform Connect app client ID
STRIPE_PUBLISHABLE_KEY=          # safe in browser

# ── Twilio ───────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=                 # +1... E.164
TWILIO_WHATSAPP_FROM=            # whatsapp:+1...

# ── iMessage ─────────────────────────────────────────────────────────────────
IMESSAGE_PROVIDER=               # sendblue | apple_mbfb
IMESSAGE_PROVIDER_KEY=           # provider API key

# ── Resend (email) ────────────────────────────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM=                     # e.g. hello@suppr.co

# ── Mux (video) ──────────────────────────────────────────────────────────────
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# ── Azure ────────────────────────────────────────────────────────────────────
AZURE_CDN_ENDPOINT=              # e.g. https://suppr.azureedge.net
AZURE_STORAGE_CONNECTION_STRING= # for blob backup (optional at launch)

# ── Web Push ─────────────────────────────────────────────────────────────────
WEB_PUSH_VAPID_PUBLIC=
WEB_PUSH_VAPID_PRIVATE=
WEB_PUSH_CONTACT=                # mailto:team@suppr.co

# ── Modal (burst AI batch jobs) ───────────────────────────────────────────────
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
MODAL_APP_BULK_LOYALTY_URL=      # web endpoint: POST /run with SERVICE_TOKEN
MODAL_APP_BULK_AUTOFILL_URL=     # web endpoint: POST /run with SERVICE_TOKEN

# ── Render ───────────────────────────────────────────────────────────────────
RENDER_API_KEY=                  # for CLI deploys
```

---

## 6. Design system (canonical tokens)

Premium-but-light. Porcelain canvas, hairline borders, softened graphite text, dusty clay accent, brass for luxe detailing, earthy/desaturated semantics. Editorial serif for display headings; clean sans for UI. Photo-forward — the canvas recedes so chef imagery leads. Feed has a soft warm-charcoal dark mode.

`packages/tokens/tokens.css`:

```css
:root {
  /* neutrals — porcelain canvas */
  --color-canvas:        #FDFCFA;  /* Porcelain — primary bg */
  --color-surface:       #F7F4EE;  /* Alabaster — cards */
  --color-surface-2:     #EFEAE0;  /* Oat — raised */
  --color-hairline:      #EAE4D9;  /* hairline borders */
  --color-text:          #34302A;  /* Graphite — primary text */
  --color-text-2:        #6B6458;  /* Slate — secondary */
  --color-text-muted:    #9A9384;  /* Mist — muted */

  /* accent */
  --color-accent:        #C77B5C;  /* Clay */
  --color-accent-tint:   #F3E4DB;
  --color-accent-deep:   #9C5538;
  --color-brass:         #B79A5E;  /* luxe detailing, <2% of surface */

  /* earthy semantics */
  --color-paid:          #4E7A5E;  --color-paid-bg:  #EAF1EA;  /* Sage */
  --color-note:          #9A7636;  --color-note-bg:  #F6EFDD;  /* Honey */
  --color-alert:         #B5564A;  --color-alert-bg: #F6E6E2;  /* Rose */
  --color-trust:         #4A7387;  --color-trust-bg: #E8F0F2;  /* Harbor */

  /* shape / type */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 18px;
  --font-display: "Fraunces", Georgia, serif;     /* editorial serif */
  --font-sans: "Inter", system-ui, sans-serif;    /* UI */
}

[data-theme="dark"] {  /* soft warm-charcoal, feed-first */
  --color-canvas:   #2A2620;
  --color-surface:  #332E27;
  --color-surface-2:#3A352D;
  --color-hairline: #3A352D;
  --color-text:     #F3EFE7;
  --color-text-2:   #C7BFB1;
  --color-text-muted:#9A9384;
  --color-accent:   #E0A07F;  --color-accent-tint:#3E2E25; --color-accent-deep:#E0A07F;
  --color-paid:#85B795; --color-paid-bg:#26302A;
  --color-note:#D7B36B; --color-note-bg:#352B1C;
  --color-alert:#DD9087; --color-alert-bg:#382722;
  --color-trust:#8FB6C6; --color-trust-bg:#22303A;
}
```

Component rules: primary action = Graphite button on light / Porcelain button on dark; Clay is rationed to brand, active states, "seats left" urgency; Brass only for thin rules and verified-host marks. Generous spacing and hairlines carry the premium feel — color stays quiet. (Optional lighter variant: a **ghost primary** — hairline border + Clay text — if the human lead wants to remove the last dark block.)

---

## 7. Data model (Supabase SQL)

`packages/db/migrations/` — plain SQL files run via `supabase db push`. Codex owns migrations; Claude Code opens a PR for any UI-driven field additions. RLS is **required on every table**. All money stored as `integer` (cents). Addresses encrypted via `pgcrypto` before insert.

Enable required extensions first:
```sql
-- 0001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT pgmq.create('notifications');   -- Supabase Queues
SELECT pgmq.create('agent_tasks');
```

```sql
-- 0002_profiles.sql
-- Extends Supabase auth.users. One row per authenticated user.
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text,
  phone        text UNIQUE,
  role         text NOT NULL DEFAULT 'guest',  -- guest | chef | team | admin
  notif_prefs  jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 0003_chef_profiles.sql
CREATE TABLE public.chef_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid NOT NULL UNIQUE REFERENCES profiles(id),
  brand_name       text NOT NULL,
  bio              text,
  city             text NOT NULL,
  cuisines         text[] NOT NULL DEFAULT '{}',
  gallery          jsonb NOT NULL DEFAULT '[]',
  brand_accent     text,              -- optional CSS color string
  social_links     jsonb NOT NULL DEFAULT '{}',
  approval_status  text NOT NULL DEFAULT 'pending',   -- pending|approved|suspended
  payment_acct_id  text,              -- Stripe Connect account id
  visibility       text NOT NULL DEFAULT 'private',
  tier             text NOT NULL DEFAULT 'basic',     -- basic|chef_ai
  autopilot        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles viewable" ON chef_profiles FOR SELECT USING (approval_status = 'approved' AND visibility = 'public');
CREATE POLICY "Owner manages profile" ON chef_profiles FOR ALL USING (owner_user_id = auth.uid());
CREATE POLICY "Admin full access" ON chef_profiles FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 0004_team_members.sql
CREATE TABLE public.team_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions      jsonb NOT NULL DEFAULT '{}',  -- {profile_events,communication,finance,kitchen_guest_data,refunds_comps}
  invited_by       uuid REFERENCES profiles(id),
  accepted_at      timestamptz,
  UNIQUE(chef_profile_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef owner manages team" ON team_members FOR ALL USING (
  chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())
);

-- 0005_policies.sql
CREATE TABLE public.policies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid REFERENCES chef_profiles(id),
  scope            text NOT NULL DEFAULT 'chef',    -- chef | event
  cancellation     jsonb NOT NULL DEFAULT '{}',     -- [{hours_before, refund_pct}]
  reschedule       jsonb NOT NULL DEFAULT '{}',
  transfer         jsonb NOT NULL DEFAULT '{}',
  name_change      jsonb NOT NULL DEFAULT '{}',
  dietary_window   jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef manages own policies" ON policies FOR ALL USING (
  chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())
);

-- 0006_events.sql
CREATE TABLE public.events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id       uuid NOT NULL REFERENCES chef_profiles(id),
  type                  text NOT NULL,   -- supper_club|chef_dinner|private|workshop|tasting|series|other
  title                 text NOT NULL,
  description           text,
  menu                  jsonb NOT NULL DEFAULT '[]',
  starts_at             timestamptz NOT NULL,
  capacity              integer NOT NULL,
  publish_status        text NOT NULL DEFAULT 'draft',   -- draft|published|unpublished
  visibility            text NOT NULL DEFAULT 'public',
  exact_address         text,            -- pgcrypto encrypted: pgp_sym_encrypt(addr, key)
  approx_location       text NOT NULL,   -- zip/neighbourhood — public
  address_rule          text NOT NULL DEFAULT 'on_confirmation', -- always|on_confirmation|before_event
  address_release_hours integer,
  dietary_policy        jsonb NOT NULL DEFAULT '{}',
  tax_enabled           boolean NOT NULL DEFAULT false,
  gratuity_required_pct numeric(5,2),
  gratuity_optional     boolean NOT NULL DEFAULT true,
  gratuity_before_tax   boolean NOT NULL DEFAULT false,
  policy_id             uuid REFERENCES policies(id),
  template_id           uuid,            -- source event if cloned
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events viewable" ON events FOR SELECT USING (publish_status = 'published' AND visibility = 'public');
CREATE POLICY "Chef manages own events" ON events FOR ALL USING (
  chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())
);

-- 0007_ticket_types.sql
CREATE TABLE public.ticket_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name           text NOT NULL,
  quantity       integer NOT NULL,
  price_cents    integer NOT NULL,   -- always cents
  sale_start     timestamptz,
  sale_end       timestamptz,
  is_deposit     boolean NOT NULL DEFAULT false,
  max_per_booking integer NOT NULL DEFAULT 8
);
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads ticket types for public events" ON ticket_types FOR SELECT USING (
  event_id IN (SELECT id FROM events WHERE publish_status = 'published')
);

-- 0008_bookings.sql
CREATE TABLE public.bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id),
  buyer_name       text NOT NULL,
  buyer_email      text,
  buyer_phone      text,
  guest_count      integer NOT NULL,
  status           text NOT NULL DEFAULT 'pending',  -- pending|confirmed|cancelled|transferred
  channel          text NOT NULL,   -- web|whatsapp|imessage|sms|concierge_web
  address_sent_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef reads bookings for own events" ON bookings FOR SELECT USING (
  event_id IN (SELECT id FROM events WHERE chef_profile_id IN (
    SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid()
  ))
);
CREATE POLICY "Buyer reads own booking" ON bookings FOR SELECT USING (
  buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 0009_guests.sql   (dietary per guest per booking — never reuse old data)
CREATE TABLE public.guests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name           text NOT NULL,
  email          text,
  phone          text,
  allergens      text[] NOT NULL DEFAULT '{}',   -- milk|eggs|fish|shellfish|tree_nuts|peanuts|wheat|soy|sesame|other
  dietary        text[] NOT NULL DEFAULT '{}',   -- vegetarian|vegan|halal|kosher|gluten_free|...
  notes          text,
  accommodation  text   -- chef-set: accommodated|not_accommodated|partial
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef with kitchen access reads guests" ON guests FOR SELECT USING (
  booking_id IN (
    SELECT b.id FROM bookings b
    JOIN events e ON e.id = b.event_id
    JOIN chef_profiles cp ON cp.id = e.chef_profile_id
    WHERE cp.owner_user_id = auth.uid()
  )
);

-- 0010_payments.sql
CREATE TABLE public.payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL UNIQUE REFERENCES bookings(id),
  provider            text NOT NULL DEFAULT 'stripe',
  provider_payment_id text,
  subtotal_cents      integer NOT NULL DEFAULT 0,
  tax_cents           integer NOT NULL DEFAULT 0,
  gratuity_req_cents  integer NOT NULL DEFAULT 0,
  gratuity_extra_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents  integer NOT NULL DEFAULT 0,
  processor_fee_cents integer NOT NULL DEFAULT 0,
  refund_cents        integer NOT NULL DEFAULT 0,
  payout_cents        integer NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'requires_payment', -- requires_payment|paid|partially_refunded|refunded|failed
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 0011_ledger_entries.sql  (append-only, never update or delete)
CREATE TABLE public.ledger_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid REFERENCES events(id),
  booking_id   uuid REFERENCES bookings(id),
  type         text NOT NULL,  -- sale|tax|gratuity_required|gratuity_extra|platform_fee|processor_fee|refund|payout
  amount_cents integer NOT NULL,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 0012_invoices.sql  (private event quotes)
CREATE TABLE public.invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id),
  client_info      jsonb NOT NULL DEFAULT '{}',
  details          jsonb NOT NULL DEFAULT '{}',
  total_cents      integer NOT NULL DEFAULT 0,
  deposit_cents    integer NOT NULL DEFAULT 0,
  balance_due_cents integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'draft',  -- draft|sent|deposit_paid|paid
  pay_link         text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 0013_waitlist.sql
CREATE TABLE public.waitlist (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              uuid NOT NULL REFERENCES events(id),
  contact               text NOT NULL,
  channel               text NOT NULL,
  notified_at           timestamptz,
  converted_booking_id  uuid REFERENCES bookings(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 0014_feed_posts.sql
CREATE TABLE public.feed_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id),
  media            jsonb NOT NULL DEFAULT '[]',  -- [{url, type: image|video, mux_id?}]
  caption          text,
  linked_event_id  uuid REFERENCES events(id),
  drafted_by_ai    boolean NOT NULL DEFAULT false,
  status           text NOT NULL DEFAULT 'draft',
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts viewable" ON feed_posts FOR SELECT USING (status = 'published');

-- 0015_follows.sql
CREATE TABLE public.follows (
  follower_user_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chef_profile_id   uuid NOT NULL REFERENCES chef_profiles(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, chef_profile_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own follows" ON follows FOR ALL USING (follower_user_id = auth.uid());

-- 0016_notifications.sql
CREATE TABLE public.notifications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient          text NOT NULL,
  channel            text NOT NULL,   -- sms|whatsapp|imessage|email|webpush
  template           text NOT NULL,
  payload            jsonb NOT NULL DEFAULT '{}',
  status             text NOT NULL DEFAULT 'queued',  -- queued|sent|delivered|failed
  related_booking_id uuid REFERENCES bookings(id),
  related_event_id   uuid REFERENCES events(id),
  sent_at            timestamptz
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 0017_agent_tasks.sql  (AI activity rail + audit + credit metering)
CREATE TABLE public.agent_tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL REFERENCES chef_profiles(id),
  kind             text NOT NULL,  -- book|remind|release_address|draft_post|draft_quote|refund|loyalty|support
  status           text NOT NULL DEFAULT 'proposed',  -- proposed|approved|executed|rejected|auto
  summary          text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  credits_used     integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- 0018_subscriptions.sql
CREATE TABLE public.subscriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_profile_id  uuid NOT NULL UNIQUE REFERENCES chef_profiles(id),
  tier             text NOT NULL DEFAULT 'basic',
  stripe_sub_id    text,
  credit_balance   integer NOT NULL DEFAULT 0,
  renews_at        timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chef manages own subscription" ON subscriptions FOR ALL USING (
  chef_profile_id IN (SELECT id FROM chef_profiles WHERE owner_user_id = auth.uid())
);

-- 0019_scheduled_jobs.sql  (pg_cron + pgmq consumer note)
-- NOTE: the 'notifications' and 'agent_tasks' pgmq queues are consumed by the
-- Render background worker (apps/api/workers/queue-consumer.ts), not pg_cron.
-- pg_cron *enqueues* jobs; the Render worker *dequeues and executes* them.
-- Address release: every 5 minutes check events whose release window has arrived
SELECT cron.schedule('release-addresses', '*/5 * * * *',
  $$SELECT release_addresses_due()$$);   -- function implemented in packages/core SQL

-- Reminders: daily at 9am UTC
SELECT cron.schedule('send-event-reminders', '0 9 * * *',
  $$SELECT enqueue_event_reminders()$$);

-- Payout reconciliation: daily at 2am UTC
SELECT cron.schedule('reconcile-payouts', '0 2 * * *',
  $$SELECT reconcile_stripe_payouts()$$);
```

---

## 8. API contract (the seam)

REST + zod, OpenAPI-generated, typed client in `packages/contracts`. Auth: guest endpoints are public or session-token; chef/admin use passwordless session; bot uses `SERVICE_TOKEN`. Representative surface (Codex implements, Claude Code + bot consume):

```
# discovery / public
GET  /events?lat&lng&date&type&cuisine&q       -> EventCard[]
GET  /events/:id                                -> EventDetail
GET  /chefs/:handle                             -> ChefProfilePublic
GET  /feed?lat&lng&cursor                        -> FeedPost[]
POST /follow/:chefId

# booking
POST /bookings/quote        { eventId, ticketTypeId, qty, extraTip? } -> LineItems  (uses packages/core pricing)
POST /bookings/hold         { eventId, ticketTypeId, qty } -> { holdId, expiresAt }  (inventory lock)
POST /bookings              { holdId, buyer, guests[], acks[] } -> { bookingId, checkoutUrl }
GET  /bookings/:id          -> Booking
POST /bookings/:id/cancel   -> { allowed, refund }  (policy engine)
POST /bookings/:id/reschedule | /transfer | /name-change

# waitlist / private
POST /waitlist             { eventId, contact, channel }
POST /inquiries            { chefId, details } -> draft quote (AI)
POST /invoices/:id/send | /pay-link

# chef
POST /chef/apply
POST /chef/events          (create/from-template)  GET/PUT/DELETE /chef/events/:id
POST /chef/events/:id/publish | /unpublish | /duplicate
GET  /chef/dashboard?date  -> snapshot (covers, allergies, payments, tips, taxes, seats)
GET  /chef/reports?from&to -> LedgerReport (CSV export)
POST /chef/messages        (SMS/email to waitlist/confirmed)
POST /chef/team            (invite, set permissions)
POST /chef/posts           (feed; AI draft via ?draft=ai)
GET  /chef/agent/tasks     | POST /chef/agent/tasks/:id/approve | /reject
PUT  /chef/settings/autopilot

# payments / webhooks
POST /webhooks/stripe
POST /webhooks/twilio
POST /webhooks/imessage

# admin
GET  /admin/applications | POST /admin/applications/:id/approve|reject
GET  /admin/events | POST /admin/events/:id/feature
POST /admin/accounts/:id/suspend
```

---

## 9. Core modules

### 9.1 Auth
Passwordless: magic link (email) + OTP (SMS). Guests transact with no account (contact captured on booking; account is optional and offered post-booking to save history). Chef/team/admin authenticated. Sessions via httpOnly cookies; bot uses service token.

### 9.2 Chef profiles & onboarding
Application captures identity, brand, city, event history, sample menus/photos, links, typical event type, venue style. After admin approval, chef must complete **required onboarding before publishing**: refund policy, address/privacy default, dietary policy defaults, payment/payout (Stripe Connect onboarding), communication sender info, tax/gratuity settings. Onboarding cannot be skipped for those five.

### 9.3 Event engine + templates/autofill
Create/edit/publish/unpublish/duplicate. **Templates:** save any past event as a template; "new event from template" pre-fills everything. **AI autofill (Chef+AI):** chef gives a few lines + photos → agent drafts title, description, menu, dietary policy text, and a feed post; chef approves. Sets ticket types, capacity, tax toggle, gratuity rules, dietary policy, address + release rule. Guest-facing preview before publish.

### 9.4 Booking engine
Inventory holds (prevent oversell), guest-by-guest data, **Big 9 allergens (milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame) + Other + dietary restrictions per guest per booking** (never reuse stale saved dietary profiles — collect every booking), acknowledgements, booking states. Works identically whether the booking originates from web checkout or the bot.

### 9.5 Pricing & fee engine (`packages/core`, unit-tested)
Computes line items: `subtotal = price × qty`; `tax` if enabled (gratuity excluded from tax base when `gratuityBeforeTax=false` and legally appropriate); `gratuityRequired`; `gratuityExtra` (guest-entered); `platformFee` (diner booking fee — see §13); `processorFee`; `total`. Output is the canonical shape for checkout display, the bot, and the ledger. **All money is integer cents internally.**

### 9.6 Payment orchestration — Stripe Connect hybrid
App owns the booking/guest/dietary ledger; Stripe handles money movement. Checkout for guest UX, **Connect (destination charges / transfers)** for chef payouts and application fees. Persist every Stripe object → `Payment` + append `LedgerEntry` rows. Webhooks reconcile status. Private quotes/invoices use payment links with deposit + balance. Refunds run through the policy engine (§9.8) with manual override + audit trail. **Do not store event/guest/dietary data in Stripe custom fields** — it lives in our DB.

### 9.7 Address privacy & release engine
`exactAddress` encrypted at rest, never in public payloads. Public sees `approxLocation`. Release per `addressRule`: `ALWAYS` | `ON_CONFIRMATION` | `BEFORE_EVENT` (with `addressReleaseHours`, default recommendation hidden + released 24–48h before). Release is a scheduled job that fires the notification and stamps `addressSentAt`; every release is logged.

### 9.8 Policy engine (`packages/core`, unit-tested)
Chef-level defaults + event-level overrides for cancellation/refund/reschedule/transfer/name-change with time windows and refund percentages. Powers guest **self-service**: a guest action is auto-approved (and auto-refunded) only if inside policy; otherwise it routes to the chef/concierge. Chef cancellation → full refund by default. No whole-event auto-cancel in V1.

### 9.9 Notifications (SMS-first + email + web push)
Templated, queued, logged. Confirmations, reminders, address release, updates, cancellations. SMS is primary for operational guest comms; email for receipts/records; web push for feed drops + reminders (PWA). All sends recorded in `Notification` for audit and dedupe.

### 9.10 Waitlist
Collect phone/email with minimal friction; notify on drop/seat-open; one-tap convert to booking (link or via concierge).

### 9.11 Private bookings
Inquiry form (or via concierge) → **AI-drafted quote** (Chef+AI) → chef approves → invoice with deposit + balance + payment link → state tracked to paid.

### 9.12 Feed & follows (PWA)
Scrollable discovery feed of chef drops (image/video), "tonight near you" rail, follow chefs, drop alerts via web push. **No public attendee lists.** This is the retention engine — chefs shine before any booking. AI marketing assistant drafts posts from event photos and nudges chefs to capture media during service.

### 9.13 Reporting & ledger
Append-only `LedgerEntry` powers event-level and date-range reports split by sale / tax / required gratuity / extra gratuity / platform fee / processor fee / refund / payout. CSV export with QuickBooks-ready categories now; full QB sync later.

### 9.14 Admin & curation
Approve/reject applications, moderate events, support view (payments/refunds read), feature chefs/events/collections, pause/investigate accounts, manage categories and curated surfaces. Support a 5–10 chef pilot **without manual DB edits.**

### 9.15 AI layer — zero-admin chef (Chef+AI tier)
Each maps to an `AgentTask` kind, shown in the chef activity rail, gated by `autopilot` (full auto) vs draft-approve:
- **Concierge booking** (cross-channel) · **Guest comms** (reminders, confirmations, day-of address) · **AI customer service** (cancellations/refunds/issues within policy) · **Event autofill** · **Marketing/feed drafting** · **Loyalty** (birthday + "your chef dropped") · **Private-inquiry → quote**.
Metering: each task records `creditsUsed`, decremented from `Subscription.creditBalance`.

### 9.16 Team permissions
Granular flags: `profile_events`, `communication`, `finance`, `kitchen_guest_data`, `refunds_comps`. Finance data hidden unless `finance` granted. Comps/refunds/custom payment links gated by `refunds_comps`.

---

## 10. The concierge bot (Codex, `apps/bot`)

**One marketplace bot** (not per-chef). Same agent serves WhatsApp, iMessage, SMS, and the in-app web chat. It discovers, books, captures dietary info, sends payment links, and handles post-booking changes within policy — end to end in the thread.

### 10.1 Channels & real-world constraints
- **WhatsApp Business API via Twilio** — primary, global, supports rich messages + templates. Build first.
- **SMS via Twilio** — universal fallback for any phone.
- **iMessage** — Apple does not allow arbitrary iMessage bots. Two legitimate routes: **Apple Messages for Business** (apply for a Messages for Business account; supports rich/interactive but requires approval and a CSP/partner) or a provider such as **SendBlue** (faster integration). Treat iMessage as a channel **adapter** behind a common interface so the agent core is channel-agnostic; ship WhatsApp + SMS first, slot iMessage in when the provider is approved.
- **In-app web chat** — the "Concierge" tab in the PWA hits the same agent over WebSocket/SSE.

All adapters normalize to `{ channel, fromContact, text, attachments }` and post agent replies back through the same interface.

### 10.2 Agent design (Nebius token factory, tool-calling)
The agent never invents prices, availability, or policy — it always calls tools. Tools (thin wrappers over `apps/api`):
- `search_events({ lat?, lng?, near?, date?, type?, cuisine? })`
- `get_event({ eventId })` · `get_availability({ eventId })`
- `hold_seats({ eventId, ticketTypeId, qty })`
- `quote({ eventId, ticketTypeId, qty, extraTip? })`
- `create_booking({ holdId, buyer, guests[] })` → returns `{ bookingId, payLink }`
- `get_policy({ eventId })`
- `modify_booking({ bookingId, action })` (cancel/reschedule/transfer/name-change → policy engine decides)
- `get_booking({ bookingId })`
- `escalate({ reason })` (hand to chef/human support)

Geolocation: from the channel (WhatsApp location share), an asked-for city/zip, or a saved guest. Always capture **Big 9 + Other dietary per guest** before payment. Confirm party size, name, dietary, and total before generating the pay link. Communicate address-release expectation. Never expose exact address before the rule allows.

### 10.3 Agent system prompt (sketch — Codex finalizes & tests)
```
You are the Suppr concierge — a warm, discreet host for a curated marketplace of
private culinary experiences. You help guests discover chefs cooking near them and
book a seat, end to end, in this chat.

Rules:
- Never invent availability, prices, fees, or policies. Always call a tool to get them.
- Before taking payment, confirm: which event, party size, name, and per-guest dietary
  info (Big 9 allergens + Other + restrictions). Collect dietary every booking.
- Show the full line-item total (seat, required gratuity, optional tip, booking fee, tax)
  before sending the payment link.
- Never reveal an exact address before the event's release rule allows it; tell the guest
  when the address will arrive.
- For cancellations/changes, call modify_booking and follow exactly what policy returns —
  do not promise refunds the policy does not allow.
- If anything is outside policy, unclear, or sensitive, call escalate and tell the guest a
  host will follow up. Be brief, warm, and human.
```

### 10.4 Payment-in-thread flow
`create_booking` returns a Stripe Checkout / payment link. The bot sends it as a tappable card; the Stripe webhook (`/webhooks/stripe`) confirms payment → booking `confirmed` → confirmation + (scheduled) address release fire via notifications. Closed loop, no app needed.

---

## 11. Security, privacy, compliance

- Encrypt `exactAddress` at rest; exclude from all public/serializable payloads; log every release.
- Dietary/allergy data is sensitive operational data — visible only to chef/team with `kitchen_guest_data` permission; define a **retention policy** (open decision, §13) and honor deletion.
- PCI: never touch raw card data — Stripe-hosted checkout/links only.
- Webhook signature verification for Stripe + Twilio + iMessage provider.
- Rate-limit public discovery + bot endpoints; abuse/spam protection on waitlist + inquiries.
- Legal hooks (counsel reviews copy before launch): host responsibility, food safety, alcohol/beverage disclaimers, allergy disclaimers, refund rules, private-residence disclosures, guest acknowledgements at checkout. Platform advertises/brokers/processes/communicates; it does **not** certify venue legality or permits.

---

## 12. Phased plan & acceptance criteria

**Phase 1 — Web app + concierge bot (the complete experience).**
- *Contract-first handshake* (§3.2): lock `packages/contracts` + `packages/db`. Both agents green against mocks.
- *Workstream A (Claude Code):* tokens → `ui` → public discovery + feed (PWA) → event pages → checkout → chef console (dashboard, event builder, reports, team, posts, agent rail) → admin console → in-app concierge chat UI.
- *Workstream B (Codex):* `core` (pricing/policy/address/ledger) → `api` (auth, events, bookings, payments, notifications, waitlist, private, admin) → Stripe Connect + webhooks → notifications (SMS/email/web push) → `bot` (agent + WhatsApp + SMS adapters; iMessage adapter when provider ready) → billing/credits.
- *Integration checkpoints:* (1) booking quote+hold+create end-to-end against real `api`; (2) Stripe payment + webhook → confirmation + address release; (3) bot books a real event and the same booking appears in the chef console.

**Phase 1 done when:** a chef can apply → be approved → onboard → publish an event from a template; a guest can, **via web OR via WhatsApp/SMS**, discover it, book, pay, submit per-guest dietary, accept policies, and receive SMS+email confirmation; exact address stays hidden until the chef's rule; the chef sees headcount/guests/dietary/payments/tips/taxes and exports a CSV; self-service cancel/reschedule/transfer/name-change works within policy; the AI activity rail shows real tasks; the ledger records every line item; admin runs a 5–10 chef pilot with no manual DB edits.

**Phase 2 — Depth.** Full QuickBooks sync; richer reporting; advanced prep sheets/kitchen counts/CRM notes; curated city pages; deeper discovery filters; loyalty refinements; iMessage GA (if approval lagged).

**Phase 3 — Native mobile app (LAST).** React Native/Expo consumer app reusing the same `api` + `contracts`, only once event density supports daily/weekly discovery usage. Operator/PWA tooling first; consumer native after.

---

## 13. Open decisions — defaults set so the build is not blocked

These ship with the default below unless the human lead overrides; each is isolated so it can change without a rewrite.

| Decision | Default for build | Change isolated in |
|---|---|---|
| Final name | `Suppr` | `BRAND` constant |
| Fee model | Diner-paid flat booking fee only at launch; chef % is a config flag, off | `core` fee config |
| Merchant of record / chargebacks | Platform as MoR via destination charges; revisit with counsel | Stripe Connect config |
| Auto-pilot default | **Draft-and-approve** by default; chef opts into full auto | `ChefProfile.autopilot` |
| Tax handling | Chef manual toggle per event in V1; evaluate Stripe Tax in Phase 2 | event tax config |
| Gratuity vs tax base | Gratuity excluded from tax base by default | `core` pricing |
| Waitlist & private quotes | **In Phase 1** (both) | feature flags |
| Dietary/address retention | 18 months post-event, then purge dietary; addresses purged 30 days post-event | retention job |
| iMessage route | WhatsApp+SMS first; iMessage via provider when approved | channel adapter |
| Launch city + pilot chefs | TBD by human lead before pilot | seed/config |

---

## 14. First tasks (so both agents can start today)

1. **Both:** scaffold monorepo (pnpm + Turborepo), stand up `packages/contracts` with the entities in §7–§8 as zod schemas, generate OpenAPI + typed client, commit `CONTRACT_CHANGELOG.md`.
2. **Codex:** Supabase project init + first SQL migrations (`packages/db`); `packages/core` pricing + policy + address-release with unit tests; `apps/api` auth + events + bookings + `/bookings/quote`. Run `supabase db push` to apply.
3. **Claude Code:** `packages/tokens` from §6; `packages/ui` primitives (Button, Card, Chip, Field, PriceBreakdown, EventCard, FeedCard); `apps/web` discovery + event page + checkout against the mock server.
4. **Integration checkpoint 1** on the booking happy path.

---

## 15. CLI setup & credential collection

The agents use CLI tools at every setup step. **At each numbered step below the agent will pause and ask the human for the required credentials before proceeding.** Never proceed without the env vars for a step being populated.

Install once:
```bash
npm install -g pnpm turbo
npm install -g supabase         # Supabase CLI
npm install -g @render-cli/cli  # Render CLI (render)
npm install -g stripe           # Stripe CLI
npm install -g twilio-cli       # Twilio CLI
npx install-perf webpush        # web-push key generator
```

---

### Step 1 — Supabase

**Ask human for:** Supabase project ref (create at supabase.com → New project).

```bash
supabase login                         # opens browser OAuth
supabase init                          # creates supabase/ folder in repo root
supabase link --project-ref <REF>      # links local to cloud project

# Get keys from: supabase.com → project → Settings → API
# Populate:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   SUPABASE_DB_URL  (Settings → Database → Connection string → URI)

supabase db push                       # applies all migrations in packages/db/migrations/
supabase status                        # verify local dev stack
```

Create storage buckets:
```bash
# Via Supabase dashboard → Storage → New bucket, or:
supabase storage create suppr-media --public
supabase storage create suppr-video
# Populate SUPABASE_STORAGE_BUCKET_IMAGES and SUPABASE_STORAGE_BUCKET_VIDEO
```

---

### Step 2 — Nebius AI (LLM)

**Ask human for:** Nebius AI Studio account (studio.nebius.ai) + API key.

```bash
# No CLI needed — HTTP API only
# 1. Create account at studio.nebius.ai
# 2. Create API key in Settings → API Keys
# Populate: NEBIUS_API_KEY
# NEBIUS_API_BASE=https://api.studio.nebius.ai/v1 (pre-set in env template)
# NEBIUS_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-fast (or model of choice)

# Verify:
curl https://api.studio.nebius.ai/v1/models   -H "Authorization: Bearer $NEBIUS_API_KEY" | jq '.data[].id'
```

---

### Step 3 — Stripe Connect

**Ask human for:** Stripe account access + whether they want test or live mode.

```bash
stripe login                           # opens browser OAuth

# Create Connect application:
# Stripe Dashboard → Connect → Get started → Platform or marketplace
# Populate: STRIPE_CONNECT_CLIENT_ID

stripe apikey list                     # get secret key
# Populate: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY

# Set up webhook (local dev):
stripe listen --forward-to localhost:3001/webhooks/stripe
# Copy the signing secret → Populate: STRIPE_WEBHOOK_SECRET

# Register production webhook:
stripe webhooks create   --url https://api.suppr.co/webhooks/stripe   --events checkout.session.completed,payment_intent.succeeded,payment_intent.payment_failed,transfer.created,payout.paid,charge.refunded
```

---

### Step 4 — Twilio (SMS + WhatsApp)

**Ask human for:** Twilio account SID + auth token (console.twilio.com).

```bash
twilio login
twilio phone-numbers:list              # find or buy a number for SMS
# Populate: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM

# WhatsApp Business API — sandbox (dev):
twilio api:messaging:v1:whatsapp:sandbox:update   --callback-url https://bot.suppr.co/webhooks/twilio/whatsapp

# WhatsApp production: apply at twilio.com/whatsapp/request-access
# Populate: TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155552671)
```

---

### Step 5 — iMessage (SendBlue — fast path)

**Ask human for:** SendBlue account (sendblue.co) — faster than Apple Messages for Business.

```bash
# 1. Sign up at sendblue.co
# 2. API Keys → Create key
# Populate: IMESSAGE_PROVIDER=sendblue, IMESSAGE_PROVIDER_KEY

# Verify:
curl https://api.sendblue.co/api/send-message   -H "sb-api-key-id: $IMESSAGE_PROVIDER_KEY"   -H "Content-Type: application/json"   -d '{"number":"+1TEST","content":"ping"}'
```

*(Apple Messages for Business is the long-term route — apply separately once the product is live.)*

---

### Step 6 — Resend (email)

**Ask human for:** Resend account (resend.com) + verified domain.

```bash
# 1. resend.com → API Keys → Create
# Populate: RESEND_API_KEY
# 2. Add and verify sending domain (resend.com → Domains)
# Populate: RESEND_FROM=hello@suppr.co
```

---

### Step 7 — Mux (video)

**Ask human for:** Mux account (mux.com).

```bash
# mux.com → Settings → Access Tokens → Generate
# Populate: MUX_TOKEN_ID, MUX_TOKEN_SECRET

# Verify:
curl https://api.mux.com/video/v1/assets   -u "$MUX_TOKEN_ID:$MUX_TOKEN_SECRET" | jq
```

---

### Step 8 — Azure CDN + Storage (optional at launch)

**Ask human for:** Azure subscription ID + resource group.

```bash
az login
az account set --subscription <SUBSCRIPTION_ID>

# Create storage account:
az storage account create   --name supprmedia   --resource-group suppr-rg   --sku Standard_LRS   --kind StorageV2

# Get connection string:
az storage account show-connection-string   --name supprmedia --resource-group suppr-rg
# Populate: AZURE_STORAGE_CONNECTION_STRING

# Create CDN profile + endpoint:
az cdn profile create --name suppr-cdn --resource-group suppr-rg --sku Standard_Microsoft
az cdn endpoint create   --name suppr   --profile-name suppr-cdn   --resource-group suppr-rg   --origin <SUPABASE_STORAGE_HOSTNAME>
# Populate: AZURE_CDN_ENDPOINT
```

---

### Step 9 — Web Push VAPID keys

```bash
# Generate once; store in env — never regenerate (invalidates all push subscriptions)
npx web-push generate-vapid-keys
# Populate: WEB_PUSH_VAPID_PUBLIC, WEB_PUSH_VAPID_PRIVATE
# WEB_PUSH_CONTACT=mailto:team@suppr.co
```

---

### Step 9b — Modal (burst AI batch jobs)

**Ask human for:** Modal account (modal.com) + token.

```bash
pip install modal                      # Python required for Modal CLI
modal token new                        # opens browser OAuth → writes ~/.modal.toml
# Populate: MODAL_TOKEN_ID, MODAL_TOKEN_SECRET  (modal token show)

# Modal functions live in infra/modal/ as Python files.
# Each batch function is exposed as a web endpoint called via HTTP from Node.
# Example: infra/modal/bulk_loyalty.py

# Deploy a Modal app:
cd infra/modal
modal deploy bulk_loyalty.py           # deploys + prints web endpoint URL
# Populate: MODAL_APP_BULK_LOYALTY_URL

modal deploy bulk_autofill.py
# Populate: MODAL_APP_BULK_AUTOFILL_URL

# Test locally:
modal run bulk_loyalty.py::run --chef-id test-123

# All Modal functions must verify SERVICE_TOKEN from the Authorization header
# before executing — see infra/modal/README.md for the pattern.
```

Modal functions call Nebius for LLM inference and call `apps/api` (with SERVICE_TOKEN)
to read/write Supabase data. They are stateless and ephemeral — Supabase is the source of truth.

---

### Step 10 — Render (deployment)

**Ask human for:** Render account (render.com) + API key.

```bash
render login                           # browser OAuth

# Create services (or use render.yaml in infra/):
render services create web   --name suppr-web   --repo https://github.com/your-org/suppr   --branch main   --root-dir apps/web   --build-command "pnpm build"   --start-command "pnpm start"

# Repeat for suppr-api (apps/api) and suppr-bot (apps/bot)
# Populate RENDER_API_KEY for CLI deploys from CI

render envs set \                      # push env vars to a service
  --service suppr-web   --env-file .env.production

render deploys create suppr-web        # manual deploy trigger
```

Deploy order: `suppr-api` first (database migrations + health check), then `suppr-web`, then `suppr-bot`.

---

### Step 11 — Generate SERVICE_TOKEN (api ↔ bot shared secret)

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Populate: SERVICE_TOKEN  (set on both suppr-api and suppr-bot Render services)
```

---
*End of build plan. Keep `packages/contracts` and `packages/db` honest and everything else composes around them.*
