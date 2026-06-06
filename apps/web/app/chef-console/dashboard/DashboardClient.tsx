"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DashboardSnapshot, AgentTask, Booking } from "@suppr/contracts/schemas";
import { approveTask, rejectTask, toggleAutopilot } from "./actions";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function exportCsv(bookings: Booking[], title: string) {
  const headers = ["Name", "Email", "Phone", "Guests", "Status", "Allergens", "Dietary", "Notes"];
  const rows = bookings.map((b) => [
    b.buyer_name,
    b.buyer_email ?? "",
    b.buyer_phone ?? "",
    String(b.guest_count),
    b.status,
    (b.guests ?? []).flatMap((g) => g.allergens).join("; "),
    (b.guests ?? []).flatMap((g) => g.dietary).join("; "),
    (b.guests ?? []).map((g) => g.notes ?? "").filter(Boolean).join("; "),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-guests.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Style maps ─────────────────────────────────────────────────────────────────

const bookingStatusStyle: Record<string, React.CSSProperties> = {
  confirmed:   { background: "var(--color-paid-bg)",  color: "var(--color-paid)" },
  pending:     { background: "var(--color-note-bg)",  color: "var(--color-note)" },
  cancelled:   { background: "var(--color-alert-bg)", color: "var(--color-alert)" },
  transferred: { background: "var(--color-trust-bg)", color: "var(--color-trust)" },
};

const channelStyle: Record<string, React.CSSProperties> = {
  web:           { background: "var(--color-trust-bg)",  color: "var(--color-trust)" },
  whatsapp:      { background: "var(--color-paid-bg)",   color: "var(--color-paid)" },
  imessage:      { background: "var(--color-accent-tint)", color: "var(--color-accent-deep)" },
  sms:           { background: "var(--color-surface-2)", color: "var(--color-text-2)" },
  concierge_web: { background: "var(--color-note-bg)",   color: "var(--color-note)" },
};

const taskStatusStyle: Record<string, React.CSSProperties> = {
  proposed: { background: "var(--color-accent-tint)",  color: "var(--color-accent-deep)" },
  approved: { background: "var(--color-paid-bg)",      color: "var(--color-paid)" },
  executed: { background: "var(--color-paid-bg)",      color: "var(--color-paid)" },
  rejected: { background: "var(--color-alert-bg)",     color: "var(--color-alert)" },
  auto:     { background: "var(--color-trust-bg)",     color: "var(--color-trust)" },
};

const kindLabel: Record<string, string> = {
  book: "Book", remind: "Remind", release_address: "Release address",
  draft_post: "Draft post", draft_quote: "Draft quote",
  refund: "Refund", loyalty: "Loyalty", support: "Support",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Chip({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties | undefined;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  chipStyle,
}: {
  label: string;
  value: string;
  chipStyle?: React.CSSProperties | undefined;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: chipStyle?.color ?? "var(--color-text)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  snapshots: DashboardSnapshot[];
  agentTasks: AgentTask[];
  bookings: Booking[];
  selectedEventId: string | null;
  autopilot: boolean;
}

export function DashboardClient({
  snapshots,
  agentTasks,
  bookings,
  selectedEventId,
  autopilot: initialAutopilot,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [tasks, setTasks] = useState<AgentTask[]>(agentTasks);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [autopilotOn, setAutopilotOn] = useState(initialAutopilot);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");

  const snapshot = snapshots.find((s) => s.event_id === selectedEventId) ?? snapshots[0] ?? null;

  function selectEvent(eventId: string) {
    startTransition(() => { router.push(`/chef-console/dashboard?eventId=${eventId}`); });
  }

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleApprove(id: string) {
    setPendingIds((p) => new Set([...p, id]));
    try {
      const updated = await approveTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      // keep current state on error
    } finally {
      setPendingIds((p) => { const s = new Set(p); s.delete(id); return s; });
    }
  }

  async function handleReject(id: string) {
    setPendingIds((p) => new Set([...p, id]));
    try {
      const updated = await rejectTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      // keep current state on error
    } finally {
      setPendingIds((p) => { const s = new Set(p); s.delete(id); return s; });
    }
  }

  async function handleAutopilotToggle() {
    const next = !autopilotOn;
    setAutopilotOn(next);
    try {
      await toggleAutopilot(next);
    } catch {
      setAutopilotOn(!next);
    }
  }

  const proposed = tasks.filter((t) => t.status === "proposed");
  const logEntries = tasks.filter((t) => t.status !== "proposed");
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1380, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, lineHeight: 1.2, color: "var(--color-text)" }}>
            Dashboard
          </h1>
          {snapshot && (
            <p style={{ fontSize: 14, color: "var(--color-text-2)", marginTop: 4 }}>
              {snapshot.title} · {fmtDate(snapshot.starts_at)} at {fmtTime(snapshot.starts_at)}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => snapshot && exportCsv(bookings, snapshot.title)}
            disabled={bookings.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 16px",
              background: "transparent", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
              color: "var(--color-text-2)", cursor: bookings.length === 0 ? "not-allowed" : "pointer",
              opacity: bookings.length === 0 ? 0.5 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1.5 10v1.5a1 1 0 001 1h9a1 1 0 001-1V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            Export CSV
          </button>

          <button
            onClick={() => setShowMessageModal(true)}
            disabled={confirmedCount === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 38, padding: "0 16px",
              background: "var(--color-text)", border: "none",
              borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
              color: "var(--color-canvas)", cursor: confirmedCount === 0 ? "not-allowed" : "pointer",
              opacity: confirmedCount === 0 ? 0.5 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 2.5h11a1 1 0 011 1v6a1 1 0 01-1 1H4.5l-3 2v-9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            </svg>
            Message guests {confirmedCount > 0 && `(${confirmedCount})`}
          </button>
        </div>
      </div>

      {/* Event date tabs */}
      {snapshots.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {snapshots.map((s) => {
            const active = s.event_id === (selectedEventId ?? snapshots[0]?.event_id);
            return (
              <button
                key={s.event_id}
                onClick={() => selectEvent(s.event_id)}
                style={{
                  flexShrink: 0,
                  height: 36, padding: "0 14px",
                  background: active ? "var(--color-text)" : "var(--color-surface)",
                  border: `0.5px solid ${active ? "var(--color-text)" : "var(--color-hairline)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "var(--color-canvas)" : "var(--color-text-2)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {fmtDate(s.starts_at)} · {s.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

        {/* ── LEFT column ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

          {/* Metric cards */}
          {snapshot ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              <MetricCard label="Covers" value={String(snapshot.total_covers)} />
              <MetricCard
                label="Seats left"
                value={String(snapshot.seats_remaining)}
                chipStyle={snapshot.seats_remaining <= 3 ? { color: "var(--color-accent)" } : undefined}
              />
              <MetricCard
                label="Allergies"
                value={String(snapshot.allergies_flagged)}
                chipStyle={snapshot.allergies_flagged > 0 ? { color: "var(--color-alert)" } : undefined}
              />
              <MetricCard
                label="Sales"
                value={fmtCents(snapshot.sales_cents)}
                chipStyle={{ color: "var(--color-paid)" }}
              />
              <MetricCard
                label="Tips"
                value={fmtCents(snapshot.tips_cents)}
                chipStyle={{ color: "var(--color-note)" }}
              />
              {snapshot.payment_pending_count > 0 && (
                <MetricCard
                  label="Pending payment"
                  value={String(snapshot.payment_pending_count)}
                  chipStyle={{ color: "var(--color-alert)" }}
                />
              )}
            </div>
          ) : (
            <div style={{
              background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-lg)", padding: "40px 24px", textAlign: "center",
            }}>
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No events today.</p>
            </div>
          )}

          {/* Guest list table */}
          <div style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "0.5px solid var(--color-hairline)",
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                Guests{bookings.length > 0 && ` · ${bookings.length}`}
              </h2>
              {snapshot !== null && snapshot.allergies_flagged > 0 && (
                <Chip style={{ background: "var(--color-alert-bg)", color: "var(--color-alert)" }}>
                  {snapshot.allergies_flagged} allergy flag{snapshot.allergies_flagged !== 1 ? "s" : ""}
                </Chip>
              )}
            </div>

            {bookings.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No bookings yet.</p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 64px 1fr 96px 88px 28px",
                  padding: "8px 20px",
                  borderBottom: "0.5px solid var(--color-hairline)",
                  background: "var(--color-surface-2)",
                }}>
                  {["Name", "Party", "Dietary", "Status", "Channel", ""].map((h) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {/* Table rows */}
                {bookings.map((booking) => {
                  const isExpanded = expanded.has(booking.id);
                  const allergens = (booking.guests ?? []).flatMap((g) => g.allergens);
                  const dietary = (booking.guests ?? []).flatMap((g) => g.dietary);
                  const hasGuestData = (booking.guests ?? []).length > 0;

                  return (
                    <div key={booking.id}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 64px 1fr 96px 88px 28px",
                          padding: "14px 20px",
                          borderBottom: "0.5px solid var(--color-hairline)",
                          alignItems: "center",
                          cursor: hasGuestData ? "pointer" : "default",
                          background: isExpanded ? "var(--color-surface-2)" : "transparent",
                          transition: "background 0.1s",
                        }}
                        onClick={() => hasGuestData && toggleRow(booking.id)}
                      >
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
                            {booking.buyer_name}
                          </p>
                          {(booking.buyer_email || booking.buyer_phone) && (
                            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                              {booking.buyer_email ?? booking.buyer_phone}
                            </p>
                          )}
                        </div>

                        <span style={{ fontSize: 14, color: "var(--color-text-2)", fontVariantNumeric: "tabular-nums" }}>
                          {booking.guest_count}
                        </span>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {allergens.slice(0, 3).map((a) => (
                            <Chip key={a} style={{ background: "var(--color-alert-bg)", color: "var(--color-alert)", fontSize: 10 }}>
                              {a}
                            </Chip>
                          ))}
                          {allergens.length > 3 && (
                            <Chip style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", fontSize: 10 }}>
                              +{allergens.length - 3}
                            </Chip>
                          )}
                          {dietary.slice(0, 2).map((d) => (
                            <Chip key={d} style={{ background: "var(--color-trust-bg)", color: "var(--color-trust)", fontSize: 10 }}>
                              {d.replace("_", " ")}
                            </Chip>
                          ))}
                        </div>

                        <Chip style={bookingStatusStyle[booking.status] ?? bookingStatusStyle.pending}>
                          {booking.status}
                        </Chip>

                        <Chip style={channelStyle[booking.channel] ?? channelStyle.web}>
                          {booking.channel.replace("_", " ")}
                        </Chip>

                        {hasGuestData && (
                          <svg
                            width="14" height="14" viewBox="0 0 14 14" fill="none"
                            style={{ color: "var(--color-text-muted)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                          >
                            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Expanded per-guest detail */}
                      {isExpanded && booking.guests && booking.guests.length > 0 && (
                        <div style={{
                          padding: "12px 20px 16px 40px",
                          background: "var(--color-surface-2)",
                          borderBottom: "0.5px solid var(--color-hairline)",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                            Per-guest details
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {booking.guests.map((guest, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex", alignItems: "flex-start", gap: 12,
                                  padding: "10px 14px",
                                  background: "var(--color-surface)",
                                  borderRadius: "var(--radius-md)",
                                  border: "0.5px solid var(--color-hairline)",
                                }}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-2)" }}>
                                    {guest.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{guest.name}</p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                    {guest.allergens.map((a) => (
                                      <Chip key={a} style={{ background: "var(--color-alert-bg)", color: "var(--color-alert)", fontSize: 10 }}>
                                        {a}
                                      </Chip>
                                    ))}
                                    {guest.dietary.map((d) => (
                                      <Chip key={d} style={{ background: "var(--color-trust-bg)", color: "var(--color-trust)", fontSize: 10 }}>
                                        {d.replace("_", " ")}
                                      </Chip>
                                    ))}
                                    {guest.allergens.length === 0 && guest.dietary.length === 0 && (
                                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No restrictions</span>
                                    )}
                                  </div>
                                  {guest.notes && (
                                    <p style={{ fontSize: 12, color: "var(--color-text-2)", marginTop: 4, fontStyle: "italic" }}>
                                      "{guest.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT column — AI rail ────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            position: "sticky",
            top: 24,
          }}
        >
          {/* Rail header + autopilot toggle */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: "0.5px solid var(--color-hairline)",
          }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>AI activity</h2>
              {proposed.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--color-accent)", marginTop: 2 }}>
                  {proposed.length} waiting for review
                </p>
              )}
            </div>

            {/* Autopilot toggle */}
            <button
              onClick={handleAutopilotToggle}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px",
                background: autopilotOn ? "var(--color-accent-tint)" : "var(--color-surface-2)",
                border: `0.5px solid ${autopilotOn ? "var(--color-accent)" : "var(--color-hairline)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: 12, fontWeight: 600,
                color: autopilotOn ? "var(--color-accent-deep)" : "var(--color-text-2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 10 }}>{autopilotOn ? "●" : "○"}</span>
              {autopilotOn ? "Autopilot" : "Manual"}
            </button>
          </div>

          <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            {tasks.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  No AI activity yet.
                </p>
              </div>
            ) : (
              <div>
                {/* Proposed tasks — need review */}
                {proposed.length > 0 && (
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {proposed.map((task) => {
                      const pending = pendingIds.has(task.id);
                      return (
                        <div
                          key={task.id}
                          style={{
                            background: "var(--color-canvas)",
                            border: "0.5px solid var(--color-hairline)",
                            borderRadius: "var(--radius-md)",
                            padding: 14,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <Chip style={{ background: "var(--color-surface-2)", color: "var(--color-text-2)", fontSize: 10 }}>
                              {kindLabel[task.kind] ?? task.kind}
                            </Chip>
                            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                              {relTime(task.created_at)}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.5, marginBottom: 12 }}>
                            {task.summary}
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleApprove(task.id)}
                              disabled={pending}
                              style={{
                                flex: 1, height: 34,
                                background: pending ? "var(--color-surface-2)" : "var(--color-paid-bg)",
                                border: "none", borderRadius: "var(--radius-md)",
                                fontSize: 12, fontWeight: 600,
                                color: pending ? "var(--color-text-muted)" : "var(--color-paid)",
                                cursor: pending ? "not-allowed" : "pointer",
                                transition: "all 0.12s",
                              }}
                            >
                              {pending ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(task.id)}
                              disabled={pending}
                              style={{
                                flex: 1, height: 34,
                                background: pending ? "var(--color-surface-2)" : "var(--color-alert-bg)",
                                border: "none", borderRadius: "var(--radius-md)",
                                fontSize: 12, fontWeight: 600,
                                color: pending ? "var(--color-text-muted)" : "var(--color-alert)",
                                cursor: pending ? "not-allowed" : "pointer",
                                transition: "all 0.12s",
                              }}
                            >
                              {pending ? "…" : "Reject"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Divider between proposed and log */}
                {proposed.length > 0 && logEntries.length > 0 && (
                  <div style={{ padding: "4px 16px" }}>
                    <div style={{ height: "0.5px", background: "var(--color-hairline)" }} />
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 10, marginBottom: 4, paddingLeft: 4 }}>
                      Log
                    </p>
                  </div>
                )}

                {/* Log entries — read-only */}
                {logEntries.length > 0 && (
                  <div style={{ padding: proposed.length > 0 ? "0 16px 12px" : "12px 16px", display: "flex", flexDirection: "column", gap: 1 }}>
                    {logEntries.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <Chip style={{ background: "var(--color-surface-2)", color: "var(--color-text-2)", fontSize: 10 }}>
                              {kindLabel[task.kind] ?? task.kind}
                            </Chip>
                            <Chip style={taskStatusStyle[task.status] ?? taskStatusStyle.auto}>
                              {task.status}
                            </Chip>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--color-text-2)", lineHeight: 1.4 }}>
                            {task.summary}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {relTime(task.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message modal */}
      {showMessageModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowMessageModal(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div style={{
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
            padding: 28, width: "100%", maxWidth: 480,
            border: "0.5px solid var(--color-hairline)",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Message all guests
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 20 }}>
              Sends via the channel each guest booked through ({confirmedCount} confirmed).
            </p>
            <textarea
              value={messageText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageText(e.target.value)}
              placeholder="Write your message…"
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                background: "var(--color-canvas)",
                border: "0.5px solid var(--color-hairline)",
                borderRadius: "var(--radius-md)",
                fontSize: 14, color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  height: 38, padding: "0 16px",
                  background: "transparent", border: "0.5px solid var(--color-hairline)",
                  borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
                  color: "var(--color-text-2)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={messageText.trim().length === 0}
                style={{
                  height: 38, padding: "0 20px",
                  background: "var(--color-text)", border: "none",
                  borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                  color: "var(--color-canvas)", cursor: messageText.trim().length === 0 ? "not-allowed" : "pointer",
                  opacity: messageText.trim().length === 0 ? 0.5 : 1,
                }}
                onClick={() => {
                  // TODO: wire to POST /chef/events/:id/message-guests once contract PR merged
                  setShowMessageModal(false);
                  setMessageText("");
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
