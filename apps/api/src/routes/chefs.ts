import type { FastifyInstance } from "fastify";
import { createServiceClient } from "../lib/supabase.js";

export async function chefsRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // GET /chefs/:handle — public, by brand_name slug
  app.get<{ Params: { handle: string } }>("/chefs/:handle", async (request, reply) => {
    // handle is brand_name lowercased with spaces replaced by dots, as set on sign-up
    // We do a case-insensitive match on brand_name for now
    const handle = request.params.handle.replace(/\./g, " ");

    const { data, error } = await db
      .from("chef_profiles")
      .select("id, brand_name, bio, city, cuisines, gallery, brand_accent, social_links, visibility, professional")
      .ilike("brand_name", handle)
      .eq("visibility", "public")
      .eq("approval_status", "approved")
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });
}
