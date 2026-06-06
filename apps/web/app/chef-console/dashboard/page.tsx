import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@suppr/contracts/client";
import { redirect } from "next/navigation";
import type { Booking } from "@suppr/contracts/schemas";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { eventId?: string | undefined; date?: string | undefined };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login?next=/chef-console/dashboard");

  const api = createApiClient({ baseUrl: process.env.API_URL!, token: session.access_token });

  const [snapshotsResult, tasksResult, profileResult] = await Promise.allSettled([
    api.chef.dashboard(searchParams.date),
    api.chef.agentTasks.list(),
    api.chef.profile.get(),
  ]);

  const snapshots = snapshotsResult.status === "fulfilled" ? snapshotsResult.value : [];
  const agentTasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
  const profile = profileResult.status === "fulfilled" ? profileResult.value : null;

  const selectedEventId = searchParams.eventId ?? snapshots[0]?.event_id ?? null;

  let bookings: Booking[] = [];
  if (selectedEventId) {
    try {
      bookings = await api.chef.events.bookings(selectedEventId);
    } catch {
      // show empty guest list
    }
  }

  return (
    <DashboardClient
      snapshots={snapshots}
      agentTasks={agentTasks}
      bookings={bookings}
      selectedEventId={selectedEventId}
      autopilot={profile?.autopilot ?? false}
    />
  );
}
