import type { FastifyInstance } from "fastify";
import { createServiceClient } from "../lib/supabase.js";

export async function eventsRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // GET /events — public discovery, no auth required
  app.get("/events", async (request, reply) => {
    const { lat, lng, date, type, cuisine, q, cursor } = request.query as Record<string, string>;

    let query = db
      .from("events")
      .select(`
        id, chef_profile_id, type, title, description, starts_at, capacity,
        approx_location, publish_status, visibility, dietary_policy, created_at,
        ticket_types(id, name, quantity, price_cents, sale_start, sale_end, is_deposit, max_per_booking),
        chef_profiles(id, brand_name, bio, city, cuisines, gallery, brand_accent, social_links, visibility, professional)
      `)
      .eq("publish_status", "published")
      .eq("visibility", "public")
      .order("starts_at", { ascending: true });

    if (date) query = query.gte("starts_at", date);
    if (type) query = query.eq("type", type);
    if (cuisine) query = query.contains("chef_profiles.cuisines", [cuisine]);
    if (q) query = query.ilike("title", `%${q}%`);
    if (cursor) query = query.gt("starts_at", cursor);
    query = query.limit(20);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    // Compute available seats per event
    const eventIds = (data ?? []).map((e: any) => e.id);
    const { data: bookings } = await db
      .from("bookings")
      .select("event_id, guest_count")
      .in("event_id", eventIds)
      .in("status", ["pending", "confirmed"]);

    const seatsTaken = (bookings ?? []).reduce((acc: Record<string, number>, b: any) => {
      acc[b.event_id] = (acc[b.event_id] ?? 0) + b.guest_count;
      return acc;
    }, {});

    const events = (data ?? []).map((e: any) => ({
      ...e,
      chef: e.chef_profiles,
      available_seats: Math.max(0, e.capacity - (seatsTaken[e.id] ?? 0)),
    }));

    reply.send(events);
  });

  // GET /events/:id — public
  app.get<{ Params: { id: string } }>("/events/:id", async (request, reply) => {
    const { data, error } = await db
      .from("events")
      .select(`
        *,
        ticket_types(*),
        chef_profiles(id, brand_name, bio, city, cuisines, gallery, brand_accent, social_links, visibility, professional)
      `)
      .eq("id", request.params.id)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    if (data.publish_status !== "published" && data.visibility !== "public") {
      return reply.status(404).send({ error: "Not found" });
    }

    const { count } = await db
      .from("bookings")
      .select("guest_count", { count: "exact" })
      .eq("event_id", data.id)
      .in("status", ["pending", "confirmed"]);

    reply.send({
      ...data,
      chef: data.chef_profiles,
      available_seats: Math.max(0, data.capacity - (count ?? 0)),
    });
  });
}
