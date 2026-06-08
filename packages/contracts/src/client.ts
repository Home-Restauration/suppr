import type {
  EventCard, EventSchema, ChefProfilePublic, FeedPost, HeroFeedPost,
  QuoteRequest, LineItems, HoldRequest, HoldResponse,
  CreateBookingRequest, CreateBookingResponse,
  Booking, ModifyBookingRequest, ModifyBookingResponse,
  WaitlistRequestSchema, DashboardSnapshot, AgentTask,
  TeamMember, TeamPermissions, ReportSummary,
  ChefApplication, ChefApplicationSubmit, AdminStats,
  InviteCode, ProfileImportRequest, ProfileImportResponse,
} from "./schemas.js";
import { z } from "zod";

export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
  serviceToken?: string;
}

export class SupprApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API error ${status}`);
  }
}

async function req<T>(
  config: ApiClientConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.token) headers["Authorization"] = `Bearer ${config.token}`;
  if (config.serviceToken) headers["X-Service-Token"] = config.serviceToken;

  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers,
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new SupprApiError(res.status, err);
  }
  return res.json() as Promise<T>;
}

export function createApiClient(config: ApiClientConfig) {
  const r = <T>(method: string, path: string, body?: unknown) =>
    req<T>(config, method, path, body);

  return {
    events: {
      list: (params: { lat?: number; lng?: number; date?: string; type?: string; cuisine?: string; q?: string; cursor?: string; chef_id?: string }) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
        return r<EventCard[]>("GET", `/events?${qs}`);
      },
      get: (id: string) => r<z.infer<typeof EventSchema>>("GET", `/events/${id}`),
    },
    chefs: {
      get: (handle: string) => r<ChefProfilePublic>("GET", `/chefs/${handle}`),
    },
    feed: {
      list: (params: { lat?: number; lng?: number; cursor?: string; chef_id?: string }) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
        return r<FeedPost[]>("GET", `/feed?${qs}`);
      },
      // Public, unauthenticated — returns curated hero reel ordered by hero_order ASC.
      // Powered by feed_posts.is_hero_featured + hero_order (migration 0021).
      hero: () => r<HeroFeedPost[]>("GET", "/feed/hero"),
    },
    // Public submission — no auth required. Valid invite_code → priority_eligible=true.
    chefApplications: {
      submit: (body: ChefApplicationSubmit) => r<{ ok: boolean; application_id: string }>("POST", "/chef-applications", body),
    },
    bookings: {
      quote: (body: QuoteRequest) => r<LineItems>("POST", "/bookings/quote", body),
      hold: (body: HoldRequest) => r<HoldResponse>("POST", "/bookings/hold", body),
      create: (body: CreateBookingRequest) => r<CreateBookingResponse>("POST", "/bookings", body),
      get: (id: string) => r<Booking>("GET", `/bookings/${id}`),
      modify: (id: string, body: ModifyBookingRequest) =>
        r<ModifyBookingResponse>("POST", `/bookings/${id}/modify`, body),
    },
    waitlist: {
      join: (body: z.infer<typeof WaitlistRequestSchema>) => r<{ ok: boolean }>("POST", "/waitlist", body),
    },
    chef: {
      profile: {
        get: () => r<import("./schemas.js").ChefProfile>("GET", "/chef/profile"),
        update: (body: Partial<import("./schemas.js").ChefProfile>) =>
          r<import("./schemas.js").ChefProfile>("PATCH", "/chef/profile", body),
      },
      dashboard: (date?: string) => r<DashboardSnapshot[]>("GET", `/chef/dashboard${date ? `?date=${date}` : ""}`),
      agentTasks: {
        list: () => r<AgentTask[]>("GET", "/chef/agent/tasks"),
        approve: (id: string) => r<AgentTask>("POST", `/chef/agent/tasks/${id}/approve`),
        reject: (id: string) => r<AgentTask>("POST", `/chef/agent/tasks/${id}/reject`),
      },
      events: {
        bookings: (eventId: string) => r<Booking[]>("GET", `/chef/events/${eventId}/bookings`),
        list: () => r<z.infer<typeof EventSchema>[]>("GET", "/chef/events"),
        get: (id: string) => r<z.infer<typeof EventSchema>>("GET", `/chef/events/${id}`),
        create: (body: Record<string, unknown>) => r<z.infer<typeof EventSchema>>("POST", "/chef/events", body),
        update: (id: string, body: Record<string, unknown>) => r<z.infer<typeof EventSchema>>("PATCH", `/chef/events/${id}`, body),
        publish: (id: string) => r<z.infer<typeof EventSchema>>("POST", `/chef/events/${id}/publish`),
        unpublish: (id: string) => r<z.infer<typeof EventSchema>>("POST", `/chef/events/${id}/unpublish`),
        autofill: (prompt: string) => r<{ title: string; description: string; menu: Array<{ course: string; description: string }> }>("POST", "/chef/events/autofill", { prompt }),
        saveTemplate: (id: string, name: string) => r<{ ok: boolean }>("POST", `/chef/events/${id}/save-template`, { name }),
        duplicate: (id: string) => r<z.infer<typeof EventSchema>>("POST", `/chef/events/${id}/duplicate`),
      },
      reports: {
        summary: (from: string, to: string) => r<ReportSummary>("GET", `/chef/reports?from=${from}&to=${to}`),
      },
      team: {
        list: () => r<TeamMember[]>("GET", "/chef/team"),
        invite: (body: { email: string; permissions: TeamPermissions }) => r<{ ok: boolean }>("POST", "/chef/team/invite", body),
        updatePermissions: (id: string, permissions: TeamPermissions) => r<TeamMember>("PATCH", `/chef/team/${id}`, { permissions }),
        remove: (id: string) => r<{ ok: boolean }>("DELETE", `/chef/team/${id}`),
      },
      posts: {
        list: () => r<FeedPost[]>("GET", "/chef/posts"),
        create: (body: Record<string, unknown>) => r<FeedPost>("POST", "/chef/posts", body),
        update: (id: string, body: Record<string, unknown>) => r<FeedPost>("PATCH", `/chef/posts/${id}`, body),
        publish: (id: string) => r<FeedPost>("POST", `/chef/posts/${id}/publish`),
        delete: (id: string) => r<{ ok: boolean }>("DELETE", `/chef/posts/${id}`),
        aiCaption: (mediaUrl: string) => r<{ caption: string }>("POST", "/chef/posts/ai-caption", { media_url: mediaUrl }),
      },
      media: {
        signedUrl: (bucket: string, filename: string, contentType: string) =>
          r<{ upload_url: string; public_url: string }>("POST", "/media/signed-url", { bucket, filename, content_type: contentType }),
      },
      stripe: {
        connectUrl: () => r<{ url: string }>("GET", "/chef/stripe/connect-url"),
      },
      onboard: {
        // Accepts chef-provided content → Azure/Nebius LLM → returns draft ChefProfile fields.
        // Chef reviews and confirms the draft before it is saved.
        profileImport: (body: ProfileImportRequest) =>
          r<ProfileImportResponse>("POST", "/chef/onboard/profile-import", body),
      },
    },
    admin: {
      applications: {
        list: (params?: { status?: string; priority?: boolean; cursor?: string }) => {
          const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]) : "";
          return r<ChefApplication[]>("GET", `/admin/applications?${qs}`);
        },
        get: (id: string) => r<ChefApplication>("GET", `/admin/applications/${id}`),
        approve: (id: string, note?: string) => r<{ ok: boolean }>("POST", `/admin/applications/${id}/approve`, { note }),
        reject: (id: string, note?: string) => r<{ ok: boolean }>("POST", `/admin/applications/${id}/reject`, { note }),
      },
      inviteCodes: {
        list: () => r<InviteCode[]>("GET", "/admin/invite-codes"),
        create: (body: { code: string; description?: string; max_uses?: number; expires_at?: string }) =>
          r<InviteCode>("POST", "/admin/invite-codes", body),
        revoke: (code: string) => r<{ ok: boolean }>("POST", `/admin/invite-codes/${code}/revoke`),
      },
      events: {
        list: (params?: { cursor?: string }) => {
          const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]) : "";
          return r<EventCard[]>("GET", `/admin/events?${qs}`);
        },
        unpublish: (id: string) => r<{ ok: boolean }>("POST", `/admin/events/${id}/unpublish`),
      },
      stats: () => r<AdminStats>("GET", "/admin/stats"),
    },
  };
}

export type SupprApiClient = ReturnType<typeof createApiClient>;
