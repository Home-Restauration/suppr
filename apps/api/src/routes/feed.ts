import type { FastifyInstance } from "fastify";
import { createServiceClient } from "../lib/supabase.js";

export async function feedRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // GET /feed — public, paginated by cursor (last published_at)
  app.get("/feed", async (request, reply) => {
    const { cursor } = request.query as Record<string, string>;

    let query = db
      .from("feed_posts")
      .select(`
        id, chef_profile_id, media, caption, linked_event_id, drafted_by_ai,
        is_hero_featured, hero_order, status, published_at, created_at,
        chef_profiles(id, brand_name, bio, city, cuisines, gallery, brand_accent, social_links, visibility, professional)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20);

    if (cursor) query = query.lt("published_at", cursor);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    reply.send((data ?? []).map((p: any) => ({ ...p, chef: p.chef_profiles })));
  });

  // GET /feed/hero — public, curated hero reel ordered by hero_order ASC
  // Powered by feed_posts.is_hero_featured + hero_order (migration 0021)
  app.get("/feed/hero", async (_request, reply) => {
    // Get follower counts in one pass via a view or aggregate
    const { data, error } = await db
      .from("feed_posts")
      .select(`
        id, chef_profile_id, media, caption, hero_order, linked_event_id,
        chef_profiles(id, brand_name, city)
      `)
      .eq("is_hero_featured", true)
      .eq("status", "published")
      .order("hero_order", { ascending: true })
      .limit(10);

    if (error) return reply.status(500).send({ error: error.message });

    // Fetch follower counts for the chef profiles returned
    const chefIds = [...new Set((data ?? []).map((p: any) => p.chef_profile_id))];
    const { data: follows } = await db
      .from("follows")
      .select("chef_profile_id")
      .in("chef_profile_id", chefIds);

    const followerCounts = (follows ?? []).reduce((acc: Record<string, number>, f: any) => {
      acc[f.chef_profile_id] = (acc[f.chef_profile_id] ?? 0) + 1;
      return acc;
    }, {});

    const posts = (data ?? []).map((p: any) => {
      const muxPlaybackId =
        (p.media as any[])?.find((m: any) => m.type === "video" && m.mux_playback_id)?.mux_playback_id ?? null;
      const chef = p.chef_profiles as any;
      return {
        id: p.id,
        chef_profile_id: p.chef_profile_id,
        mux_playback_id: muxPlaybackId,
        caption: p.caption,
        hero_order: p.hero_order,
        chef_handle: chef?.brand_name?.toLowerCase().replace(/\s+/g, ".") ?? "",
        chef_name: chef?.brand_name ?? "",
        chef_city: chef?.city ?? "",
        follower_count: followerCounts[p.chef_profile_id] ?? 0,
        linked_event_id: p.linked_event_id,
      };
    });

    reply.send(posts);
  });
}
