import type {
  EventCard, EventSchema, ChefProfilePublic, FeedPost,
  QuoteRequest, LineItems, HoldRequest, HoldResponse,
  CreateBookingRequest, CreateBookingResponse,
  Booking, ModifyBookingRequest, ModifyBookingResponse,
  WaitlistRequestSchema, DashboardSnapshot, AgentTask,
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
      list: (params: { lat?: number; lng?: number; date?: string; type?: string; cuisine?: string; q?: string; cursor?: string }) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
        return r<EventCard[]>("GET", `/events?${qs}`);
      },
      get: (id: string) => r<z.infer<typeof EventSchema>>("GET", `/events/${id}`),
    },
    chefs: {
      get: (handle: string) => r<ChefProfilePublic>("GET", `/chefs/${handle}`),
    },
    feed: {
      list: (params: { lat?: number; lng?: number; cursor?: string }) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
        return r<FeedPost[]>("GET", `/feed?${qs}`);
      },
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
        update: (body: Partial<Pick<import("./schemas.js").ChefProfile, "autopilot" | "brand_name" | "bio">>) =>
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
      },
    },
  };
}

export type SupprApiClient = ReturnType<typeof createApiClient>;
