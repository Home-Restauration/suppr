import { z } from "zod";

// ── Enums ──────────────────────────────────────────────────────────────────
export const EventType = z.enum([
  "supper_club","chef_dinner","private","workshop","tasting","series","other"
]);
export const AddressRule = z.enum(["always","on_confirmation","before_event"]);
export const BookingStatus = z.enum(["pending","confirmed","cancelled","transferred"]);
export const Channel = z.enum(["web","whatsapp","imessage","sms","concierge_web"]);
export const PaymentStatus = z.enum([
  "requires_payment","paid","partially_refunded","refunded","failed"
]);
export const AgentTaskKind = z.enum([
  "book","remind","release_address","draft_post","draft_quote","refund","loyalty","support"
]);
export const AgentTaskStatus = z.enum(["proposed","approved","executed","rejected","auto"]);
export const Tier = z.enum(["basic","chef_ai"]);
export const NotificationChannel = z.enum(["sms","whatsapp","imessage","email","webpush"]);

// Big 9 allergens
export const Allergen = z.enum([
  "milk","eggs","fish","shellfish","tree_nuts","peanuts","wheat","soy","sesame","other"
]);
export const Dietary = z.enum([
  "vegetarian","vegan","halal","kosher","gluten_free","dairy_free","nut_free","other"
]);

// ── Professional profile (public-facing resume side) ────────────────────────
// Stored as chef_profiles.professional JSONB (migration 0023).
export const PressItemSchema = z.object({
  publication: z.string(),
  headline:    z.string(),
  url:         z.string().url().optional(),
  year:        z.number().int().optional(),
});

export const CookbookSchema = z.object({
  title:     z.string(),
  year:      z.number().int().optional(),
  publisher: z.string().optional(),
  cover_url: z.string().url().optional(),
});

export const ProfessionalSchema = z.object({
  years_experience: z.number().int().nonnegative().optional(),
  background:       z.string().optional(),           // training, career narrative
  past_venues:      z.array(z.string()).optional(),  // "Atelier Crenn", "Noma", …
  certifications:   z.array(z.string()).optional(),  // "CIA graduate", "ACF CEC", …
  awards:           z.array(z.string()).optional(),  // "Best New Chef — F&W 2020"
  press:            z.array(PressItemSchema).optional(),
  cookbooks:        z.array(CookbookSchema).optional(),
});

// ── Core entity schemas ─────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.enum(["guest","chef","team","admin"]),
  notif_prefs: z.record(z.unknown()),
  created_at: z.string().datetime(),
});

export const ChefProfileSchema = z.object({
  id:               z.string().uuid(),
  owner_user_id:    z.string().uuid(),
  brand_name:       z.string(),
  bio:              z.string().nullable(),
  city:             z.string(),
  cuisines:         z.array(z.string()),
  gallery:          z.array(z.object({ url: z.string(), alt: z.string().optional() })),
  brand_accent:     z.string().nullable(),
  social_links:     z.record(z.string()),
  professional:     ProfessionalSchema,              // ← new (migration 0023)
  approval_status:  z.enum(["pending","approved","suspended"]),
  payment_acct_id:  z.string().nullable(),
  visibility:       z.enum(["public","private"]),
  tier:             Tier,
  autopilot:        z.boolean(),
  created_at:       z.string().datetime(),
});

// Public-safe subset — includes professional (it's the chef's public resume)
export const ChefProfilePublicSchema = ChefProfileSchema.pick({
  id: true, brand_name: true, bio: true, city: true, cuisines: true,
  gallery: true, brand_accent: true, social_links: true, visibility: true,
  professional: true,                                // ← added
});

export const PolicyWindowSchema = z.object({
  hours_before: z.number(),
  refund_pct: z.number().min(0).max(100),
});

export const PolicySchema = z.object({
  id: z.string().uuid(),
  chef_profile_id: z.string().uuid().nullable(),
  scope: z.enum(["chef","event"]),
  cancellation: z.array(PolicyWindowSchema),
  reschedule: z.array(PolicyWindowSchema),
  transfer: z.array(PolicyWindowSchema),
  name_change: z.array(PolicyWindowSchema),
  dietary_window: z.array(PolicyWindowSchema),
});

export const TicketTypeSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price_cents: z.number().int().nonnegative(),
  sale_start: z.string().datetime().nullable(),
  sale_end: z.string().datetime().nullable(),
  is_deposit: z.boolean(),
  max_per_booking: z.number().int().positive(),
});

export const DietaryPolicySchema = z.object({
  intake_required: z.boolean(),
  modifications_allowed: z.boolean(),
  cannot_accommodate: z.array(z.string()),
  upcharge_cents: z.number().int().nonnegative().optional(),
});

export const EventSchema = z.object({
  id: z.string().uuid(),
  chef_profile_id: z.string().uuid(),
  type: EventType,
  title: z.string().min(3).max(120),
  description: z.string().nullable(),
  menu: z.array(z.object({ course: z.string(), description: z.string() })),
  starts_at: z.string().datetime(),
  capacity: z.number().int().positive(),
  publish_status: z.enum(["draft","published","unpublished"]),
  visibility: z.enum(["public","private"]),
  approx_location: z.string(),
  address_rule: AddressRule,
  address_release_hours: z.number().int().nullable(),
  dietary_policy: DietaryPolicySchema,
  tax_enabled: z.boolean(),
  gratuity_required_pct: z.number().min(0).max(100).nullable(),
  gratuity_optional: z.boolean(),
  gratuity_before_tax: z.boolean(),
  policy_id: z.string().uuid().nullable(),
  template_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  ticket_types: z.array(TicketTypeSchema).optional(),
});

// Public-safe version (no exact_address)
export const EventCardSchema = EventSchema.omit({ template_id: true }).extend({
  chef: ChefProfilePublicSchema.optional(),
  available_seats: z.number().int().nonnegative(),
});

// ── Hero feed ────────────────────────────────────────────────────────────────
// Returned by GET /feed/hero (public, unauthenticated).
// Curated via feed_posts.is_hero_featured + hero_order (migration 0021).
export const HeroFeedPostSchema = z.object({
  id:              z.string().uuid(),
  chef_profile_id: z.string().uuid(),
  mux_playback_id: z.string().nullable(), // from media[0].mux_playback_id
  caption:         z.string().nullable(),
  hero_order:      z.number().int().nullable(),
  // chef fields joined in the query
  chef_handle:     z.string(),            // derived from chef brand_name (slugified)
  chef_name:       z.string(),            // brand_name
  chef_city:       z.string(),
  follower_count:  z.number().int(),      // COUNT of follows.chef_profile_id
  linked_event_id: z.string().uuid().nullable(),
});

export const GuestInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  allergens: z.array(Allergen),
  dietary: z.array(Dietary),
  notes: z.string().optional(),
});

export const BookingSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  buyer_name: z.string(),
  buyer_email: z.string().email().nullable(),
  buyer_phone: z.string().nullable(),
  guest_count: z.number().int().positive(),
  status: BookingStatus,
  channel: Channel,
  address_sent_at: z.string().datetime().nullable(),
  // Set by fulfillCheckoutSession from session.amount_total — the Stripe-
  // authoritative total. NULL on bookings created before migration 0024.
  total_cents: z.number().int().nonnegative().nullable().optional(),
  created_at: z.string().datetime(),
  guests: z.array(GuestInputSchema).optional(),
});

export const LineItemsSchema = z.object({
  subtotal_cents: z.number().int(),
  tax_cents: z.number().int(),
  gratuity_required_cents: z.number().int(),
  gratuity_extra_cents: z.number().int(),
  platform_fee_cents: z.number().int(),
  processor_fee_cents: z.number().int(),
  total_cents: z.number().int(),
  breakdown: z.array(z.object({
    label: z.string(),
    amount_cents: z.number().int(),
    type: z.enum(["seat","tax","gratuity_required","gratuity_extra","platform_fee","processor_fee"]),
  })),
});

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  provider: z.string(),
  provider_payment_id: z.string().nullable(),
  subtotal_cents: z.number().int(),
  tax_cents: z.number().int(),
  gratuity_req_cents: z.number().int(),
  gratuity_extra_cents: z.number().int(),
  platform_fee_cents: z.number().int(),
  processor_fee_cents: z.number().int(),
  refund_cents: z.number().int(),
  payout_cents: z.number().int(),
  status: PaymentStatus,
});

export const FeedPostSchema = z.object({
  id: z.string().uuid(),
  chef_profile_id: z.string().uuid(),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(["image","video"]),
    mux_playback_id: z.string().optional(),
  })),
  caption: z.string().nullable(),
  linked_event_id: z.string().uuid().nullable(),
  drafted_by_ai: z.boolean(),
  is_hero_featured: z.boolean(),                      // ← new (migration 0021)
  hero_order: z.number().int().nullable(),             // ← new (migration 0021)
  status: z.enum(["draft","published"]),
  published_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  chef: ChefProfilePublicSchema.optional(),
});

export const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  chef_profile_id: z.string().uuid(),
  kind: AgentTaskKind,
  status: AgentTaskStatus,
  summary: z.string(),
  payload: z.record(z.unknown()),
  credits_used: z.number().int(),
  created_at: z.string().datetime(),
});

// ── Request / Response schemas ───────────────────────────────────────────────
export const QuoteRequestSchema = z.object({
  event_id: z.string().uuid(),
  ticket_type_id: z.string().uuid(),
  qty: z.number().int().positive().max(20),
  extra_tip_cents: z.number().int().nonnegative().optional(),
});

export const HoldRequestSchema = z.object({
  event_id: z.string().uuid(),
  ticket_type_id: z.string().uuid(),
  qty: z.number().int().positive().max(20),
});

export const HoldResponseSchema = z.object({
  hold_id: z.string().uuid(),
  expires_at: z.string().datetime(),
  seats_held: z.number().int(),
});

export const CreateBookingRequestSchema = z.object({
  hold_id: z.string().uuid(),
  buyer_name: z.string().min(1),
  buyer_email: z.string().email().optional(),
  buyer_phone: z.string().optional(),
  guests: z.array(GuestInputSchema).min(1),
  extra_tip_cents: z.number().int().nonnegative().optional(),
  acknowledgements: z.array(z.string()),
  channel: Channel.default("web"),
});

export const CreateBookingResponseSchema = z.object({
  booking_id: z.string().uuid(),
  checkout_url: z.string().url(),
  expires_at: z.string().datetime(),
});

export const ModifyBookingRequestSchema = z.object({
  action: z.enum(["cancel","reschedule","transfer","name_change"]),
  payload: z.record(z.unknown()).optional(),
});

export const ModifyBookingResponseSchema = z.object({
  allowed: z.boolean(),
  refund_cents: z.number().int(),
  message: z.string(),
});

export const WaitlistRequestSchema = z.object({
  event_id: z.string().uuid(),
  contact: z.string(),
  channel: NotificationChannel,
});

export const DashboardSnapshotSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string(),
  starts_at: z.string().datetime(),
  total_covers: z.number().int(),
  seats_remaining: z.number().int(),
  allergies_flagged: z.number().int(),
  sales_cents: z.number().int(),
  tips_cents: z.number().int(),
  taxes_cents: z.number().int(),
  payment_pending_count: z.number().int(),
});

// ── Team ──────────────────────────────────────────────────────────────────────
export const TeamPermissionsSchema = z.object({
  profile_events:  z.boolean(),
  communication:   z.boolean(),
  finance:         z.boolean(),
  kitchen_guests:  z.boolean(),
  refunds_comps:   z.boolean(),
});

export const TeamMemberSchema = z.object({
  id:          z.string().uuid(),
  user_id:     z.string().uuid().nullable(),
  name:        z.string().nullable(),
  email:       z.string().email(),
  role:        z.enum(["owner","manager","staff"]),
  permissions: TeamPermissionsSchema,
  invited_at:  z.string().datetime(),
  accepted_at: z.string().datetime().nullable(),
});

// ── Reports ────────────────────────────────────────────────────────────────────
export const ReportEventRowSchema = z.object({
  event_id:           z.string().uuid(),
  title:              z.string(),
  starts_at:          z.string().datetime(),
  bookings:           z.number().int(),
  sales_cents:        z.number().int(),
  tips_cents:         z.number().int(),
  taxes_cents:        z.number().int(),
  platform_fee_cents: z.number().int(),
  refunds_cents:      z.number().int(),
  net_cents:          z.number().int(),
});

export const ReportSummarySchema = z.object({
  total_sales_cents:   z.number().int(),
  tips_cents:          z.number().int(),
  taxes_cents:         z.number().int(),
  platform_fees_cents: z.number().int(),
  refunds_cents:       z.number().int(),
  net_payout_cents:    z.number().int(),
  series: z.array(z.object({ date: z.string(), revenue_cents: z.number().int() })),
  events: z.array(ReportEventRowSchema),
});

// ── Chef applications + invite codes ──────────────────────────────────────────
// Tables created in migration 0022.

export const InviteCodeSchema = z.object({
  code:        z.string(),
  description: z.string().nullable(),
  max_uses:    z.number().int(),
  used_count:  z.number().int(),
  status:      z.enum(["active","exhausted","revoked"]),
  expires_at:  z.string().datetime().nullable(),
  created_at:  z.string().datetime(),
});

// Full application schema (admin view — includes priority_eligible, review fields)
export const ChefApplicationSchema = z.object({
  id:                z.string().uuid(),
  first_name:        z.string(),
  last_name:         z.string(),
  email:             z.string().email(),
  city:              z.string(),
  cuisine:           z.string(),
  experience:        z.string(),
  social_handle:     z.string().nullable(),
  invite_code:       z.string().nullable(),
  about:             z.string(),
  priority_eligible: z.boolean(),
  status:            z.enum(["pending","approved","rejected"]),
  reviewed_by:       z.string().uuid().nullable(),
  review_note:       z.string().nullable(),
  applied_at:        z.string().datetime(),
  reviewed_at:       z.string().datetime().nullable(),
});

// Public submission schema (what the apply form POSTs — no admin-only fields)
export const ChefApplicationSubmitSchema = z.object({
  first_name:    z.string().min(1),
  last_name:     z.string().min(1),
  email:         z.string().email(),
  city:          z.string().min(1),
  cuisine:       z.string().min(1),
  experience:    z.enum(["1-3","3-5","5-10","10+"]),
  social_handle: z.string().optional(),
  invite_code:   z.string().optional(),
  about:         z.string().min(20),
});

// ── AI profile import ─────────────────────────────────────────────────────────
// POST /chef/onboard/profile-import
// Accepts chef-provided content → Azure LLM → returns draft ChefProfile fields.
//
// TODO (Instagram Graph API path — decision pending):
//   When the chef connects their Instagram Business/Creator account via OAuth,
//   the same generator receives the bio, recent posts, and highlights from the
//   Graph API response. The LLM layer is identical; only the content source
//   differs. Wire as: GET /chef/onboard/instagram/callback → fetch Graph API
//   content → call the same generateChefProfile() function below.
//   Ref: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api

export const ProfileImportRequestSchema = z.object({
  bio_text:             z.string().min(10).max(2000),
  cuisine_description:  z.string().min(5).max(500),
  dishes: z.array(z.object({
    name:        z.string(),
    description: z.string().optional(),
  })).max(20),
  // Optional — populated by Instagram Graph API callback later:
  past_venues:    z.array(z.string()).optional(),
  years_experience: z.number().int().nonnegative().optional(),
  awards:         z.array(z.string()).optional(),
  press_mentions: z.array(z.string()).optional(), // raw text → LLM structures into PressItem[]
});

export const ProfileImportResponseSchema = z.object({
  // Generated draft fields — chef reviews and confirms before saving
  brand_name:   z.string(),
  bio:          z.string(),
  cuisines:     z.array(z.string()),
  professional: ProfessionalSchema,
  // Suggested sample posts (caption text only — chef attaches own media)
  sample_posts: z.array(z.object({ caption: z.string() })),
  // Confidence score 0–1 from LLM self-assessment
  confidence:   z.number().min(0).max(1),
});

// ── Admin ──────────────────────────────────────────────────────────────────────
export const AdminStatsSchema = z.object({
  total_bookings:       z.number().int(),
  total_revenue_cents:  z.number().int(),
  active_chefs:         z.number().int(),
  events_this_week:     z.number().int(),
  bookings_this_week:   z.number().int(),
});

// ── Type exports ──────────────────────────────────────────────────────────────
export type Profile = z.infer<typeof ProfileSchema>;
export type ChefProfile = z.infer<typeof ChefProfileSchema>;
export type ChefProfilePublic = z.infer<typeof ChefProfilePublicSchema>;
export type Professional = z.infer<typeof ProfessionalSchema>;
export type PressItem = z.infer<typeof PressItemSchema>;
export type Cookbook = z.infer<typeof CookbookSchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventCard = z.infer<typeof EventCardSchema>;
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type GuestInput = z.infer<typeof GuestInputSchema>;
export type LineItems = z.infer<typeof LineItemsSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type FeedPost = z.infer<typeof FeedPostSchema>;
export type HeroFeedPost = z.infer<typeof HeroFeedPostSchema>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type HoldRequest = z.infer<typeof HoldRequestSchema>;
export type HoldResponse = z.infer<typeof HoldResponseSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type ModifyBookingRequest = z.infer<typeof ModifyBookingRequestSchema>;
export type ModifyBookingResponse = z.infer<typeof ModifyBookingResponseSchema>;
export type DashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>;
export type TeamPermissions = z.infer<typeof TeamPermissionsSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type ReportEventRow = z.infer<typeof ReportEventRowSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type ChefApplication = z.infer<typeof ChefApplicationSchema>;
export type ChefApplicationSubmit = z.infer<typeof ChefApplicationSubmitSchema>;
export type ProfileImportRequest = z.infer<typeof ProfileImportRequestSchema>;
export type ProfileImportResponse = z.infer<typeof ProfileImportResponseSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
