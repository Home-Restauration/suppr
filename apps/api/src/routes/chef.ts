import type { FastifyInstance } from "fastify";
import { createServiceClient, createUserClient } from "../lib/supabase.js";
import { requireChef } from "../lib/auth.js";
import { createMuxUpload } from "../lib/mux.js";
import { generateChefProfile } from "./chef-onboard.js";
import { ProfileImportRequestSchema } from "@suppr/contracts/schemas";

export async function chefRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // GET /chef/profile
  app.get("/chef/profile", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("chef_profiles")
      .select("*")
      .eq("id", auth.chefProfileId)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // PATCH /chef/profile
  app.patch("/chef/profile", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const ALLOWED = ["brand_name", "bio", "city", "cuisines", "gallery", "brand_accent",
      "social_links", "professional", "autopilot", "visibility"];
    const updates = Object.fromEntries(
      Object.entries(request.body as Record<string, unknown>).filter(([k]) => ALLOWED.includes(k))
    );

    const { data, error } = await db
      .from("chef_profiles")
      .update(updates)
      .eq("id", auth.chefProfileId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data);
  });

  // GET /chef/dashboard
  app.get("/chef/dashboard", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { date } = request.query as Record<string, string>;

    let query = db
      .from("events")
      .select("id, title, starts_at, capacity")
      .eq("chef_profile_id", auth.chefProfileId)
      .order("starts_at", { ascending: true });

    if (date) {
      const day = new Date(date);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      query = query.gte("starts_at", day.toISOString()).lt("starts_at", next.toISOString());
    }

    const { data: events, error } = await query.limit(10);
    if (error) return reply.status(500).send({ error: error.message });

    const snapshots = await Promise.all(
      (events ?? []).map(async (event: any) => {
        const { data: bookings } = await db
          .from("bookings")
          .select("guest_count, status, booking_guests(allergens)")
          .eq("event_id", event.id)
          .in("status", ["pending", "confirmed"]);

        const totalCovers = (bookings ?? []).reduce((s: number, b: any) => s + b.guest_count, 0);
        const allergiesFlagged = (bookings ?? []).reduce((s: number, b: any) => {
          return s + (b.booking_guests as any[]).filter((g: any) => g.allergens?.length > 0).length;
        }, 0);

        const { data: payments } = await db
          .from("payments")
          .select("subtotal_cents, gratuity_req_cents, gratuity_extra_cents, tax_cents, refund_cents, status")
          .in("booking_id", (bookings ?? []).map((b: any) => b.id));

        const sales = (payments ?? []).reduce((s: number, p: any) => s + p.subtotal_cents, 0);
        const tips = (payments ?? []).reduce((s: number, p: any) => s + p.gratuity_req_cents + p.gratuity_extra_cents, 0);
        const taxes = (payments ?? []).reduce((s: number, p: any) => s + p.tax_cents, 0);
        const pendingCount = (payments ?? []).filter((p: any) => p.status === "requires_payment").length;

        return {
          event_id: event.id,
          title: event.title,
          starts_at: event.starts_at,
          total_covers: totalCovers,
          seats_remaining: Math.max(0, event.capacity - totalCovers),
          allergies_flagged: allergiesFlagged,
          sales_cents: sales,
          tips_cents: tips,
          taxes_cents: taxes,
          payment_pending_count: pendingCount,
        };
      })
    );

    reply.send(snapshots);
  });

  // GET /chef/agent/tasks
  app.get("/chef/agent/tasks", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("agent_tasks")
      .select("*")
      .eq("chef_profile_id", auth.chefProfileId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // POST /chef/agent/tasks/:id/approve
  app.post<{ Params: { id: string } }>("/chef/agent/tasks/:id/approve", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("agent_tasks")
      .update({ status: "approved" })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "Task not found" });
    reply.send(data);
  });

  // POST /chef/agent/tasks/:id/reject
  app.post<{ Params: { id: string } }>("/chef/agent/tasks/:id/reject", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("agent_tasks")
      .update({ status: "rejected" })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "Task not found" });
    reply.send(data);
  });

  // GET /chef/events
  app.get("/chef/events", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("events")
      .select("*, ticket_types(*)")
      .eq("chef_profile_id", auth.chefProfileId)
      .order("starts_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // GET /chef/events/:id
  app.get<{ Params: { id: string } }>("/chef/events/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("events")
      .select("*, ticket_types(*)")
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /chef/events
  app.post("/chef/events", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const body = { ...(request.body as Record<string, unknown>), chef_profile_id: auth.chefProfileId };

    const { data, error } = await db.from("events").insert(body).select("*, ticket_types(*)").single();
    if (error) return reply.status(400).send({ error: error.message });
    reply.status(201).send(data);
  });

  // PATCH /chef/events/:id
  app.patch<{ Params: { id: string } }>("/chef/events/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("events")
      .update(request.body as Record<string, unknown>)
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select("*, ticket_types(*)")
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /chef/events/:id/publish
  app.post<{ Params: { id: string } }>("/chef/events/:id/publish", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("events")
      .update({ publish_status: "published" })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select("*, ticket_types(*)")
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /chef/events/:id/unpublish
  app.post<{ Params: { id: string } }>("/chef/events/:id/unpublish", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("events")
      .update({ publish_status: "unpublished" })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select("*, ticket_types(*)")
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /chef/events/autofill
  app.post("/chef/events/autofill", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { prompt } = request.body as { prompt: string };
    if (!prompt) return reply.status(400).send({ error: "prompt required" });

    const { getAzureClient, AZURE_MODEL } = await import("../lib/llm.js");
    const llm = getAzureClient();
    const completion = await llm.chat.completions.create({
      model: AZURE_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a culinary copywriter. Given a chef's event concept, return valid JSON with keys:
title (string ≤80 chars), description (2–3 sentences), menu (array of {course, description}).
Return only the JSON object with no markdown wrapper.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    try {
      const draft = JSON.parse(completion.choices[0]?.message.content ?? "{}");
      reply.send(draft);
    } catch {
      reply.status(500).send({ error: "LLM returned non-JSON response" });
    }
  });

  // GET /chef/events/:id/bookings
  app.get<{ Params: { id: string } }>("/chef/events/:id/bookings", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    // Confirm the event belongs to this chef
    const { data: event } = await db
      .from("events")
      .select("id")
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .single();
    if (!event) return reply.status(404).send({ error: "Not found" });

    const { data, error } = await db
      .from("bookings")
      .select("*, booking_guests(*)")
      .eq("event_id", request.params.id)
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // GET /chef/reports
  app.get("/chef/reports", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { from, to } = request.query as Record<string, string>;

    const { data: events } = await db
      .from("events")
      .select("id, title, starts_at")
      .eq("chef_profile_id", auth.chefProfileId)
      .gte("starts_at", from)
      .lte("starts_at", to);

    const eventIds = (events ?? []).map((e: any) => e.id);

    const { data: bookings } = await db
      .from("bookings")
      .select("id, event_id, guest_count")
      .in("event_id", eventIds)
      .in("status", ["confirmed"]);

    const { data: payments } = await db
      .from("payments")
      .select("booking_id, subtotal_cents, gratuity_req_cents, gratuity_extra_cents, tax_cents, platform_fee_cents, refund_cents, payout_cents")
      .in("booking_id", (bookings ?? []).map((b: any) => b.id));

    const bookingById = (bookings ?? []).reduce((acc: any, b: any) => { acc[b.id] = b; return acc; }, {});
    const paymentsByEventId = (payments ?? []).reduce((acc: any, p: any) => {
      const booking = bookingById[p.booking_id];
      if (!booking) return acc;
      acc[booking.event_id] = acc[booking.event_id] ?? [];
      acc[booking.event_id].push(p);
      return acc;
    }, {});

    const eventRows = (events ?? []).map((e: any) => {
      const ps = paymentsByEventId[e.id] ?? [];
      const bs = (bookings ?? []).filter((b: any) => b.event_id === e.id);
      return {
        event_id: e.id,
        title: e.title,
        starts_at: e.starts_at,
        bookings: bs.length,
        sales_cents: ps.reduce((s: number, p: any) => s + p.subtotal_cents, 0),
        tips_cents: ps.reduce((s: number, p: any) => s + p.gratuity_req_cents + p.gratuity_extra_cents, 0),
        taxes_cents: ps.reduce((s: number, p: any) => s + p.tax_cents, 0),
        platform_fee_cents: ps.reduce((s: number, p: any) => s + p.platform_fee_cents, 0),
        refunds_cents: ps.reduce((s: number, p: any) => s + p.refund_cents, 0),
        net_cents: ps.reduce((s: number, p: any) => s + p.payout_cents, 0),
      };
    });

    const totals = eventRows.reduce((acc: any, row: any) => ({
      total_sales_cents: acc.total_sales_cents + row.sales_cents,
      tips_cents: acc.tips_cents + row.tips_cents,
      taxes_cents: acc.taxes_cents + row.taxes_cents,
      platform_fees_cents: acc.platform_fees_cents + row.platform_fee_cents,
      refunds_cents: acc.refunds_cents + row.refunds_cents,
      net_payout_cents: acc.net_payout_cents + row.net_cents,
    }), { total_sales_cents: 0, tips_cents: 0, taxes_cents: 0, platform_fees_cents: 0, refunds_cents: 0, net_payout_cents: 0 });

    reply.send({ ...totals, series: [], events: eventRows });
  });

  // GET /chef/team
  app.get("/chef/team", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("chef_team_members")
      .select("*")
      .eq("chef_profile_id", auth.chefProfileId);

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // POST /chef/team/invite
  app.post("/chef/team/invite", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { email, permissions } = request.body as any;

    const { error } = await db.from("chef_team_members").insert({
      chef_profile_id: auth.chefProfileId,
      email, permissions,
      role: "staff",
    });
    if (error) return reply.status(400).send({ error: error.message });
    reply.send({ ok: true });
  });

  // PATCH /chef/team/:id
  app.patch<{ Params: { id: string } }>("/chef/team/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { permissions } = request.body as any;

    const { data, error } = await db
      .from("chef_team_members")
      .update({ permissions })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // DELETE /chef/team/:id
  app.delete<{ Params: { id: string } }>("/chef/team/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    await db
      .from("chef_team_members")
      .delete()
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId);

    reply.send({ ok: true });
  });

  // GET /chef/posts
  app.get("/chef/posts", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("feed_posts")
      .select("*")
      .eq("chef_profile_id", auth.chefProfileId)
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    reply.send(data ?? []);
  });

  // POST /chef/posts
  app.post("/chef/posts", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("feed_posts")
      .insert({ ...(request.body as any), chef_profile_id: auth.chefProfileId, drafted_by_ai: false })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    reply.status(201).send(data);
  });

  // PATCH /chef/posts/:id
  app.patch<{ Params: { id: string } }>("/chef/posts/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("feed_posts")
      .update(request.body as any)
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /chef/posts/:id/publish
  app.post<{ Params: { id: string } }>("/chef/posts/:id/publish", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const { data, error } = await db
      .from("feed_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // DELETE /chef/posts/:id
  app.delete<{ Params: { id: string } }>("/chef/posts/:id", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    await db
      .from("feed_posts")
      .delete()
      .eq("id", request.params.id)
      .eq("chef_profile_id", auth.chefProfileId);

    reply.send({ ok: true });
  });

  // POST /chef/posts/ai-caption
  app.post("/chef/posts/ai-caption", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { media_url } = request.body as { media_url: string };

    const { getAzureClient, AZURE_MODEL } = await import("../lib/llm.js");
    const llm = getAzureClient();
    const completion = await llm.chat.completions.create({
      model: AZURE_MODEL,
      messages: [
        {
          role: "system",
          content: "You write Instagram-style captions for chef posts. 1–3 sentences. No hashtags. Warm, inviting, professional.",
        },
        { role: "user", content: `Write a caption for this dish image: ${media_url}` },
      ],
      temperature: 0.8,
    });
    reply.send({ caption: completion.choices[0]?.message.content?.trim() ?? "" });
  });

  // POST /media/signed-url
  app.post("/media/signed-url", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;
    const { bucket, filename, content_type } = request.body as any;

    const path = `${auth.chefProfileId}/${Date.now()}-${filename}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error) return reply.status(500).send({ error: error.message });

    const publicUrl = `${process.env.AZURE_CDN_ENDPOINT}/${bucket}/${path}`;
    reply.send({ upload_url: data.signedUrl, public_url: publicUrl });
  });

  // GET /chef/stripe/connect-url
  app.get("/chef/stripe/connect-url", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

    const { data: chef } = await db
      .from("chef_profiles")
      .select("payment_acct_id")
      .eq("id", auth.chefProfileId)
      .single();

    let accountId: string = chef?.payment_acct_id;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;
      await db
        .from("chef_profiles")
        .update({ payment_acct_id: accountId })
        .eq("id", auth.chefProfileId);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/chef-console/settings?stripe=refresh`,
      return_url: `${process.env.APP_URL}/chef-console/settings?stripe=complete`,
      type: "account_onboarding",
    });

    reply.send({ url: link.url });
  });

  // POST /chef/onboard/profile-import — AI profile draft from bio text
  app.post("/chef/onboard/profile-import", async (request, reply) => {
    const auth = await requireChef(request, reply);
    if (!auth) return;

    const body = ProfileImportRequestSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    try {
      const draft = await generateChefProfile(body.data);
      reply.send(draft);
    } catch (err: any) {
      reply.status(500).send({ error: err.message ?? "LLM generation failed" });
    }
  });
}
