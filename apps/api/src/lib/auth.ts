import type { FastifyRequest, FastifyReply } from "fastify";
import { createUserClient } from "./supabase.js";

export async function extractUser(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const { data, error } = await createUserClient(token).auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, token };
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const result = await extractUser(request);
  if (!result) {
    reply.status(401).send({ error: "Unauthorized" });
    return null;
  }
  return result;
}

/** Verify the caller is a chef and return their chef_profile_id. */
export async function requireChef(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUser(request, reply);
  if (!auth) return null;

  const db = createUserClient(auth.token);
  const { data, error } = await db
    .from("chef_profiles")
    .select("id, owner_user_id, tier, autopilot")
    .eq("owner_user_id", auth.user.id)
    .single();

  if (error || !data) {
    reply.status(403).send({ error: "No chef profile" });
    return null;
  }
  return { ...auth, chefProfileId: data.id as string, chef: data };
}

/** Verify the caller is an admin. */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUser(request, reply);
  if (!auth) return null;

  const db = createUserClient(auth.token);
  const { data, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (error || data?.role !== "admin") {
    reply.status(403).send({ error: "Admin only" });
    return null;
  }
  return auth;
}
