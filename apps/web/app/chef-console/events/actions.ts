"use server";

import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@suppr/contracts/client";

async function getApi() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  return createApiClient({ baseUrl: process.env.API_URL!, token: session.access_token });
}

export async function saveEventDraft(body: Record<string, unknown>, eventId: string | null) {
  const api = await getApi();
  if (eventId) return api.chef.events.update(eventId, body);
  return api.chef.events.create(body);
}

export async function publishEvent(eventId: string) {
  const api = await getApi();
  return api.chef.events.publish(eventId);
}

export async function saveEventTemplate(eventId: string, name: string) {
  const api = await getApi();
  return api.chef.events.saveTemplate(eventId, name);
}

export async function autofillEvent(prompt: string) {
  const api = await getApi();
  return api.chef.events.autofill(prompt);
}

export async function getSignedUploadUrl(bucket: string, filename: string, contentType: string) {
  const api = await getApi();
  return api.chef.media.signedUrl(bucket, filename, contentType);
}
