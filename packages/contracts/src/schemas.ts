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
  id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  brand_name: z.string(),
  bio: z.string().nullable(),
  city: z.string(),
  cuisines: z.array(z.string()),
  gallery: z.array(z.object({ url: z.string(), alt: z.string().optional() })),
  brand_accent: z.string().nullable(),
  social_links: z.record(z.string()),
  approval_status: z.enum(["pending","approved","suspended"]),
  payment_acct_id: z.string().nullable(),
  visibility: z.enum(["public","private"]),
  tier: Tier,
  autopilot: z.boolean(),
  created_at: z.string().datetime(),
});

export const ChefProfilePublicSchema = ChefProfileSchema.pick({
  id: true, brand_name: true, bio: true, city: true, cuisines: true,
  gallery: true, brand_accent: true, social_links: true, visibility: true,
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

// ── Type exports ──────────────────────────────────────────────────────────────
export type Profile = z.infer<typeof ProfileSchema>;
export type ChefProfile = z.infer<typeof ChefProfileSchema>;
export type ChefProfilePublic = z.infer<typeof ChefProfilePublicSchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventCard = z.infer<typeof EventCardSchema>;
export type TicketType = z.infer<typeof TicketTypeSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type GuestInput = z.infer<typeof GuestInputSchema>;
export type LineItems = z.infer<typeof LineItemsSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type FeedPost = z.infer<typeof FeedPostSchema>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type HoldRequest = z.infer<typeof HoldRequestSchema>;
export type HoldResponse = z.infer<typeof HoldResponseSchema>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;
export type ModifyBookingRequest = z.infer<typeof ModifyBookingRequestSchema>;
export type ModifyBookingResponse = z.infer<typeof ModifyBookingResponseSchema>;
export type DashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>;
