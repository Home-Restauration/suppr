"use server";

import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@suppr/contracts/client";

async function getApi() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");
  return createApiClient({ baseUrl: process.env.API_URL!, token: session.access_token });
}

export async function approveTask(id: string) {
  const api = await getApi();
  return api.chef.agentTasks.approve(id);
}

export async function rejectTask(id: string) {
  const api = await getApi();
  return api.chef.agentTasks.reject(id);
}

export async function toggleAutopilot(enabled: boolean) {
  const api = await getApi();
  return api.chef.profile.update({ autopilot: enabled });
}
