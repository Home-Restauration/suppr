"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createApiClient } from "@suppr/contracts/client";
import type { ChefApplication, EventCard, AdminStats } from "@suppr/contracts/schemas";

function getApi(token?: string | undefined) {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    ...(token ? { token } : {}),
  });
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type Tab = "applications" | "events" | "stats";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const [token, setToken] = useState<string | undefined>(undefined);

  const [apps, setApps] = useState<ChefApplication[]>([]);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token;
      setToken(t);
      const api = getApi(t);
      await Promise.allSettled([
        api.admin.applications.list().then(r => setApps(r)),
        api.admin.events.list().then(r => setEvents(r)),
        api.admin.stats().then(r => setStats(r)),
      ]);
      setLoading(false);
    })();
  }, []);

  async function handleApprove(id: string) {
    setProcessingId(id);
    try {
      await getApi(token).admin.applications.approve(id);
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a));
    } catch {} finally { setProcessingId(null); }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    try {
      await getApi(token).admin.applications.reject(id, rejectReason[id]);
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a));
    } catch {} finally { setProcessingId(null); }
  }

  async function handleUnpublish(id: string) {
    if (!confirm("Unpublish this event?")) return;
    setProcessingId(id);
    try {
      await getApi(token).admin.events.unpublish(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {} finally { setProcessingId(null); }
  }

  const pendingApps = apps.filter(a => a.status === "pending");

  return (
    <div style={{ padding: "28px 32px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, marginBottom: 28 }}>Admin console</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "0.5px solid var(--color-hairline)" }}>
        {([
          { key: "applications" as Tab, label: `Applications${pendingApps.length > 0 ? ` (${pendingApps.length})` : ""}` },
          { key: "events" as Tab, label: "Live events" },
          { key: "stats" as Tab, label: "Platform stats" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              height: 38, padding: "0 16px", background: "transparent", border: "none",
              borderBottom: `2px solid ${tab === t.key ? "var(--color-accent)" : "transparent"}`,
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--color-text)" : "var(--color-text-2)", cursor: "pointer",
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>}

      {/* Applications tab */}
      {tab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {apps.length === 0 && !loading && <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No applications.</p>}
          {apps.map(app => (
            <div key={app.id} style={{ background: "var(--color-surface)", border: `0.5px solid ${app.status === "pending" ? "var(--color-note)" : "var(--color-hairline)"}`, borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)" }}>{app.brand_name}</p>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--radius-sm)", fontWeight: 600, background: app.status === "pending" ? "var(--color-note-bg)" : app.status === "approved" ? "var(--color-paid-bg)" : "var(--color-alert-bg)", color: app.status === "pending" ? "var(--color-note)" : app.status === "approved" ? "var(--color-paid)" : "var(--color-alert)" }}>
                      {app.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--color-text-2)" }}>{app.city} · {app.cuisines.join(", ")}</p>
                  {app.bio && <p style={{ fontSize: 13, color: "var(--color-text-2)", marginTop: 8, lineHeight: 1.5 }}>{app.bio}</p>}
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>

                {app.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleApprove(app.id)} disabled={processingId === app.id} style={{ height: 36, padding: "0 16px", background: "var(--color-paid-bg)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, color: "var(--color-paid)", cursor: "pointer" }}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(app.id)} disabled={processingId === app.id} style={{ height: 36, padding: "0 16px", background: "var(--color-alert-bg)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, color: "var(--color-alert)", cursor: "pointer" }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {app.status === "pending" && (
                <input
                  value={rejectReason[app.id] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(prev => ({ ...prev, [app.id]: e.target.value }))}
                  placeholder="Rejection reason (optional)"
                  style={{ width: "100%", height: 36, padding: "0 12px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Events tab */}
      {tab === "events" && (
        <div>
          {events.length === 0 && !loading && <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No published events.</p>}
          <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {events.map((event, i) => (
              <div key={event.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < events.length - 1 ? "0.5px solid var(--color-hairline)" : "none", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{event.title}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {new Date(event.starts_at).toLocaleDateString()} · {event.available_seats} seats{event.ticket_types?.[0] ? ` · $${(event.ticket_types[0].price_cents / 100).toFixed(0)}/seat` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleUnpublish(event.id)}
                  disabled={processingId === event.id}
                  style={{ flexShrink: 0, height: 32, padding: "0 12px", background: "var(--color-alert-bg)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, color: "var(--color-alert)", cursor: "pointer" }}
                >
                  Unpublish
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          <StatCard label="Total bookings" value={stats.total_bookings.toLocaleString()} />
          <StatCard label="Total revenue" value={fmt(stats.total_revenue_cents)} />
          <StatCard label="Active chefs" value={stats.active_chefs} />
          <StatCard label="Events this week" value={stats.events_this_week} />
          <StatCard label="Bookings this week" value={stats.bookings_this_week} />
        </div>
      )}
    </div>
  );
}
