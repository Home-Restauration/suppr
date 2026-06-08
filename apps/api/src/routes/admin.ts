import type { FastifyInstance } from "fastify";
import { createServiceClient } from "../lib/supabase.js";
import { requireAdmin } from "../lib/auth.js";

export async function adminRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // GET /admin/stats
  app.get("/admin/stats", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const [{ count: totalBookings }, { count: activeChefs }, { count: eventsThisWeek }, { count: bookingsThisWeek }] =
      await Promise.all([
        db.from("bookings").select("*", { count: "exact", head: true }),
        db.from("chef_profiles").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
        db.from("events").select("*", { count: "exact", head: true })
          .gte("starts_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        db.from("bookings").select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);

    const { data: payments } = await db.from("payments").select("subtotal_cents");
    const totalRevenue = (payments ?? []).reduce((s: number, p: any) => s + p.subtotal_cents, 0);

    reply.send({
      total_bookings: totalBookings ?? 0,
      total_revenue_cents: totalRevenue,
      active_chefs: activeChefs ?? 0,
      events_this_week: eventsThisWeek ?? 0,
      bookings_this_week: bookingsThisWeek ?? 0,
    });
  });

  // GET /admin/applications
  app.get("/admin/applications", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { status, priority, cursor } = request.query as Record<string, string>;

    let query = db
      .from("chef_applications")
      .select("*")
      .order("applied_at", { ascending: false })
      .limit(50);

    if (status) query = query.eq("status", status);
    if (priority === "true") query = query.eq("priority_eligible", true);
    if (cursor) query = query.lt("applied_at", cursor);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // GET /admin/applications/:id
  app.get<{ Params: { id: string } }>("/admin/applications/:id", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("chef_applications")
      .select("*")
      .eq("id", request.params.id)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /admin/applications/:id/approve
  app.post<{ Params: { id: string } }>("/admin/applications/:id/approve", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;
    const { note } = (request.body ?? {}) as { note?: string };

    const { error } = await db
      .from("chef_applications")
      .update({
        status: "approved",
        reviewed_by: auth.user.id,
        review_note: note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.params.id);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send({ ok: true });
  });

  // POST /admin/applications/:id/reject
  app.post<{ Params: { id: string } }>("/admin/applications/:id/reject", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;
    const { note } = (request.body ?? {}) as { note?: string };

    const { error } = await db
      .from("chef_applications")
      .update({
        status: "rejected",
        reviewed_by: auth.user.id,
        review_note: note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.params.id);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send({ ok: true });
  });

  // GET /admin/invite-codes
  app.get("/admin/invite-codes", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("invite_codes")
      .select("code, description, max_uses, used_count, status, expires_at, created_at")
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // POST /admin/invite-codes
  app.post("/admin/invite-codes", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { code, description, max_uses = 1, expires_at } = request.body as any;
    if (!code) return reply.status(400).send({ error: "code required" });

    const { data, error } = await db
      .from("invite_codes")
      .insert({
        code: code.toUpperCase(),
        created_by: auth.user.id,
        description: description ?? null,
        max_uses,
        expires_at: expires_at ?? null,
      })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    reply.status(201).send(data);
  });

  // POST /admin/invite-codes/:code/revoke
  app.post<{ Params: { code: string } }>("/admin/invite-codes/:code/revoke", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { error } = await db
      .from("invite_codes")
      .update({ status: "revoked" })
      .eq("code", request.params.code);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send({ ok: true });
  });

  // GET /admin/events
  app.get("/admin/events", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;
    const { cursor } = request.query as Record<string, string>;

    let query = db
      .from("events")
      .select(`
        id, chef_profile_id, type, title, starts_at, capacity, publish_status, visibility,
        approx_location, dietary_policy, created_at,
        ticket_types(id, name, price_cents, quantity),
        chef_profiles(id, brand_name, city, cuisines, gallery, brand_accent, social_links, visibility, professional)
      `)
      .order("starts_at", { ascending: false })
      .limit(50);

    if (cursor) query = query.lt("starts_at", cursor);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    reply.send((data ?? []).map((e: any) => ({ ...e, chef: e.chef_profiles })));
  });

  // POST /admin/events/:id/unpublish
  app.post<{ Params: { id: string } }>("/admin/events/:id/unpublish", async (request, reply) => {
    const auth = await requireAdmin(request, reply);
    if (!auth) return;

    const { error } = await db
      .from("events")
      .update({ publish_status: "unpublished" })
      .eq("id", request.params.id);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send({ ok: true });
  });
}
