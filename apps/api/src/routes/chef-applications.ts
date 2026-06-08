import type { FastifyInstance } from "fastify";
import { createServiceClient } from "../lib/supabase.js";
import { ChefApplicationSubmitSchema } from "@suppr/contracts/schemas";

export async function chefApplicationsRoute(app: FastifyInstance) {
  const db = createServiceClient();

  // POST /chef-applications — public submission, no auth required
  app.post("/chef-applications", async (request, reply) => {
    const body = ChefApplicationSubmitSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { invite_code, ...fields } = body.data;
    let priority_eligible = false;

    if (invite_code) {
      // Validate the invite code: must be active, not exhausted, not expired
      const { data: code } = await db
        .from("invite_codes")
        .select("status, max_uses, used_count, expires_at")
        .eq("code", invite_code)
        .single();

      if (
        code &&
        code.status === "active" &&
        code.used_count < code.max_uses &&
        (!code.expires_at || new Date(code.expires_at) > new Date())
      ) {
        priority_eligible = true;
        // Increment used_count atomically
        await db
          .from("invite_codes")
          .update({ used_count: code.used_count + 1 })
          .eq("code", invite_code);
      }
    }

    const { data: application, error } = await db
      .from("chef_applications")
      .insert({ ...fields, invite_code: invite_code ?? null, priority_eligible })
      .select("id")
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    reply.status(201).send({ ok: true, application_id: application.id });
  });
}
