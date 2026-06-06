import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@suppr/contracts/client";
import { redirect, notFound } from "next/navigation";
import { EventBuilderClient } from "../../EventBuilderClient";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login?next=/chef-console/events");

  const api = createApiClient({ baseUrl: process.env.API_URL!, token: session.access_token });

  let event;
  try {
    event = await api.chef.events.get(params.id);
  } catch {
    notFound();
  }

  return <EventBuilderClient initialEvent={event} eventId={params.id} />;
}
