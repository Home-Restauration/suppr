# AGENTS.md — Suppr repo conventions for all AI coding agents

Read this at the start of every task. It applies to **Claude Code** and **Codex** equally.
For Claude Code–specific rules see `CLAUDE.md`. For Codex-specific rules see inline notes below.

---

## 1. What you're building

Suppr — a curated culinary-experience marketplace. Web app (Next.js PWA) + concierge bot (WhatsApp / iMessage / SMS) deliver the complete Phase 1 experience. Native mobile app is Phase 3 (last). Full spec in `SUPPR_BUILD_PLAN.md`.

---

## 2. Ownership — never cross the line without a handshake

| Surface | Owner |
|---|---|
| `apps/web` + `packages/ui` + `packages/tokens` | **Claude Code** |
| `apps/api` + `apps/bot` + `packages/core` + `infra/` | **Codex** |
| `packages/contracts` | **Shared — handshake required** |
| `packages/db` (SQL migrations) | **Shared — Codex leads, Claude Code opens PRs** |

**Handshake rule:** any change to `packages/contracts` or `packages/db` must:
1. Branch with prefix `contract/` or `schema/`
2. Add one line to `CONTRACT_CHANGELOG.md` (date · what changed · who)
3. Get a green build of both `apps/web` and `apps/api` before merge

When in doubt, stay in your own surface. Ask via a PR comment rather than editing across ownership lines.

---

## 3. Credentials — always ask, never hardcode

**Before any step that requires a new external service:**
1. Stop and tell the human: *"For this step I need the following env vars — please add them to `.env`:"*
2. List the exact variable names (see `infra/env.example` or §5 of the build plan)
3. Wait for confirmation before writing any code that calls that service
4. Read from `process.env.<VAR>` — never inline a key in source

Never commit `.env`, `.env.local`, or any file containing real credentials. `.gitignore` must include `*.env*` and `infra/secrets/`.

---

## 4. CLI-first development

Always prefer CLI over dashboard for setup, so every step is repeatable and auditable.

```bash
# Core tools (install once)
pnpm          # package manager
supabase      # DB, auth, storage, migrations
stripe        # payments + webhook testing
twilio        # SMS/WhatsApp testing
render        # deployment
az            # Azure (optional)
```

Run commands in the repo root unless noted. Use `pnpm --filter apps/web <cmd>` for workspace-scoped commands.

---

## 5. Tech stack at a glance

- **Web:** Next.js 14 App Router · TypeScript · Tailwind (from `packages/tokens`) · `@supabase/ssr`
- **API:** Fastify · zod · OpenAPI via `fastify-swagger`
- **DB:** Supabase (Postgres + RLS + Auth + Storage + Realtime). Migrations in SQL (`packages/db/migrations/`). Run via `supabase db push`.
- **Jobs — three-layer split:**
  - ~80% Supabase pg_cron + pgmq + Edge Functions (reminders, releases, triggers) — ~$0
  - ~15% Render background worker — always-on pgmq consumer dispatching SMS/email — ~$7/mo
  - ~5% Modal — Python web endpoints for burst AI batches (bulk loyalty, bulk autofill) — zero idle cost, $30/mo free tier; called via HTTP + SERVICE_TOKEN from Node
  - Nebius = inference endpoint only, called from whichever layer runs the AI job
- **LLM (two providers, both OpenAI-compatible):**
  - **Azure AI Foundry** — primary fast-conversational tier (concierge bot, event autofill, guest comms). Model `Llama-4-Maverick-17B-128E-Instruct-FP8` via the `openai` package: `baseURL = ${AZURE_ENDPOINT}/models`, `defaultQuery {"api-version":"2024-05-01-preview"}`, `defaultHeaders {"api-key": AZURE_API_KEY}`. Env: `AZURE_ENDPOINT`, `AZURE_API_KEY`, `BOT_MODEL`.
  - **Nebius token factory** (`https://api.tokenfactory.nebius.com/v1`) — available for overflow/batch; `deepseek-ai/DeepSeek-V3.2` available for high-stakes reasoning (refund calc, reconciliation) if needed. Env: `NEBIUS_API_KEY`, `NEBIUS_API_URL`, `DEEPSEEK_MODEL`.
- **Deploy:** Render (web, api, bot services). Deploy order: api → web → bot.
- **Payments:** Stripe Connect hybrid (destination charges, app-owned ledger)
- **Messaging:** Twilio SMS + WhatsApp. iMessage via SendBlue (or Apple MfB later).
- **Media:** Supabase Storage (images) + Mux (video) + Azure CDN (global delivery)

---

## 5b. Jobs — who owns what

| Layer | Owner | What runs here |
|---|---|---|
| Supabase pg_cron | Codex | Schedule SQL functions: enqueue reminders, address releases, payout recon jobs into pgmq |
| Supabase pgmq | Codex | Durable queues: `notifications`, `agent_tasks` |
| Supabase Edge Functions | Codex | Lightweight serverless: Stripe/Twilio webhook handlers, event-triggered tasks |
| Render background worker | Codex | `apps/api/workers/queue-consumer.ts` — dequeues `notifications`, calls Twilio + Resend |
| Modal Python functions | Codex | `infra/modal/` — bulk loyalty, bulk autofill; exposed as web endpoints, called via HTTP |
| Nebius token factory | Codex | LLM inference for all AI tasks; called from Render worker or Modal, never from client |

**The Render worker is the only service that sends actual SMS/email.** pg_cron enqueues; the worker dispatches.

**Modal functions must:**
1. Verify `Authorization: Bearer $SERVICE_TOKEN` before executing
2. Call `apps/api` (not Supabase directly) for all data reads/writes
3. Call Nebius for LLM inference
4. Be stateless — Supabase is the source of truth

---

## 6. Money rules — non-negotiable

- All money is **integer cents** internally. Never floats. Never strings like `"$9.50"`.
- All payment logic lives in `packages/core/pricing.ts` — unit-tested, no side effects.
- Every payment event writes an append-only row to `ledger_entries` — never update or delete ledger rows.
- Line items: `subtotal | tax | gratuity_required | gratuity_extra | platform_fee | processor_fee | refund | payout`.
- Gratuity is excluded from tax base by default (`gratuity_before_tax = false`). Do not change this default without a contract change.
- Never store guest/event/dietary data in Stripe custom fields — it lives in Supabase.

---

## 7. Privacy & security rules — non-negotiable

- `exact_address` is encrypted at rest via `pgcrypto.pgp_sym_encrypt`. Never return it in any public API response. Decrypt server-side only when the release rule allows it.
- Dietary/allergy data is sensitive. Only expose to requests with `kitchen_guest_data` permission. Honor the retention policy (purge 18 months post-event via pg_cron job).
- PCI: never touch raw card numbers. Stripe-hosted Checkout and payment links only.
- Verify webhook signatures: Stripe (`stripe.webhooks.constructEvent`), Twilio (`validateRequest`), iMessage provider (provider-specific).
- Rate-limit all public-facing endpoints and bot inbound channels.
- RLS must be enabled on every Supabase table. Never disable it. Never use the service role key client-side.

---

## 8. Dietary — always collect per booking

- Big 9 allergens: `milk | eggs | fish | shellfish | tree_nuts | peanuts | wheat | soy | sesame | other`
- Plus free-form `dietary[]`: `vegetarian | vegan | halal | kosher | gluten_free | dairy_free | nut_free | ...`
- Collect **every booking, every guest**. Never reuse saved dietary profiles from a previous booking.
- The concierge bot must collect dietary before generating a payment link.

---

## 9. Testing standards

Every module in `packages/core` ships with unit tests (Vitest). Minimum coverage for:
- Pricing engine: all line-item combinations including tax/gratuity ordering
- Policy engine: every cancellation/reschedule/transfer/name-change scenario (in-window, out-window, edge)
- Address-release engine: all three `address_rule` values + scheduling logic

Integration tests live in `apps/api/tests/`. At minimum: booking happy path, Stripe webhook → confirmation, address release scheduling.

Run all tests before opening any PR:
```bash
pnpm test           # all packages
pnpm --filter packages/core test   # core only
```

---

## 10. Branch & PR conventions

| Prefix | Owner | Example |
|---|---|---|
| `web/` | Claude Code | `web/feat-checkout-flow` |
| `api/` | Codex | `api/feat-booking-engine` |
| `bot/` | Codex | `bot/feat-whatsapp-adapter` |
| `contract/` | Either (handshake) | `contract/add-invoice-schema` |
| `schema/` | Either (handshake) | `schema/add-subscriptions-table` |
| `fix/` | Either | `fix/address-release-race` |

PR title format: `[prefix] short description` e.g. `[web] checkout dietary per-guest fields`.
Every PR needs a green build + at least one passing test before merge.

---

## 11. The concierge bot (Codex — `apps/bot`)

The bot is a **single marketplace concierge**, not per-chef. It handles discovery, booking, dietary capture, payment links, and post-booking changes in one thread.

Key rules:
- The agent must **never invent** availability, prices, fees, or policies. Always call a tool.
- Collect Big 9 dietary **per guest** before payment. If the user hasn't provided it, ask.
- Show full line-item total before sending the payment link.
- For changes/cancellations: call `modify_booking` → follow what the policy engine returns. Never promise a refund the policy doesn't allow.
- If anything is outside policy or ambiguous: call `escalate`. Do not improvise.
- The agent uses the Nebius LLM client (`openai` package, Nebius base URL). The system prompt is in `apps/bot/src/prompts/concierge.ts`.
- Channel adapters normalize to `{ channel, fromContact, text, attachments? }` — the agent core is channel-agnostic.
- iMessage (SendBlue) + WhatsApp ship first. Slot in Apple Messages for Business later via the same adapter interface.

---

## 12. Feed & realtime

- Use **Supabase Realtime** for live feed updates in the web app (subscribe to `feed_posts` INSERT events).
- Feed images → Supabase Storage. Feed video → Mux (upload via signed URL → get playback URL → store `mux_playback_id` in `media` JSONB).
- Azure CDN sits in front for global delivery. Use `AZURE_CDN_ENDPOINT` as the base URL for all media served to clients.

---

## 13. Supabase migration workflow

```bash
# Create a new migration
supabase migration new <descriptive-name>
# Edit supabase/migrations/<timestamp>_<name>.sql  (also in packages/db/migrations/ as canonical source)

# Apply to local dev
supabase db reset     # wipes local, re-runs all migrations (safe in dev)

# Apply to production (after PR merge)
supabase db push --linked

# Never manually edit a migration that has already been pushed to production.
# Create a new migration for any correction.
```

---

## 14. Deployment (Render)

```bash
# Push env vars to a service
render envs set --service suppr-api --env-file .env.production

# Manual deploy
render deploys create suppr-api   # then suppr-web, then suppr-bot

# Check logs
render logs suppr-bot --tail
```

Deploy order is always: **api → web → bot**. The api runs database migrations on startup (`supabase db push` or a migration runner); web and bot depend on it.

---

## 15. What Phase 1 is done means

A chef can apply → be approved → onboard → publish an event from a template.
A guest can, **via web OR WhatsApp/SMS**, discover, book, pay, submit per-guest dietary, accept policies, and receive SMS + email confirmation.
Exact address stays hidden until the chef's rule fires.
The chef sees headcount / guests / dietary / payments / tips / taxes and exports a CSV.
Self-service cancel/reschedule/transfer/name-change works within policy.
The AI activity rail shows real tasks; the ledger records every line item.
Admin runs a 5–10 chef pilot with no manual DB edits.

---
*If anything in this file conflicts with `SUPPR_BUILD_PLAN.md`, the build plan wins.*
