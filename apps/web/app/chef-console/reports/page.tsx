"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createApiClient } from "@suppr/contracts/client";
import type { ReportSummary, ReportEventRow } from "@suppr/contracts/schemas";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Preset = "today" | "week" | "month" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This week" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

function presetRange(key: Preset): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  if (key === "today") return { from: to, to };
  if (key === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: isoDate(d), to };
  }
  const d = new Date(now);
  d.setDate(1);
  return { from: isoDate(d), to };
}

function exportCsv(data: ReportSummary) {
  const headers = ["Event", "Date", "Bookings", "Sales", "Tips", "Taxes", "Platform fee", "Refunds", "Net"];
  const rows = data.events.map(e => [
    e.title,
    new Date(e.starts_at).toLocaleDateString(),
    String(e.bookings),
    String(e.sales_cents / 100),
    String(e.tips_cents / 100),
    String(e.taxes_cents / 100),
    String(e.platform_fee_cents / 100),
    String(e.refunds_cents / 100),
    String(e.net_cents / 100),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "suppr-revenue-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, colorVar }: { label: string; value: string; sub?: string | undefined; colorVar?: string | undefined }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "18px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 600, color: colorVar ?? "var(--color-text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function EventRow({ event }: { event: ReportEventRow }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 72px 88px 88px 88px 88px 88px 88px 28px", gap: 0, alignItems: "center", padding: "12px 20px", borderBottom: "0.5px solid var(--color-hairline)", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{event.title}</p>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{new Date(event.starts_at).toLocaleDateString()}</p>
        </div>
        {[event.bookings, fmt(event.sales_cents), fmt(event.tips_cents), fmt(event.taxes_cents), fmt(event.platform_fee_cents), fmt(event.refunds_cents), fmt(event.net_cents)].map((v, i) => (
          <span key={i} style={{ fontSize: 13, color: i === 6 ? "var(--color-paid)" : "var(--color-text-2)", fontVariantNumeric: "tabular-nums" }}>{v}</span>
        ))}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", color: "var(--color-text-muted)" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {expanded && (
        <div style={{ padding: "12px 20px 16px 40px", background: "var(--color-surface-2)", borderBottom: "0.5px solid var(--color-hairline)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Gross sales", value: fmt(event.sales_cents) },
              { label: "Tips", value: fmt(event.tips_cents) },
              { label: "Taxes collected", value: fmt(event.taxes_cents) },
              { label: "Platform fee (5%)", value: fmt(event.platform_fee_cents) },
              { label: "Refunds issued", value: fmt(event.refunds_cents) },
              { label: "Net payout", value: fmt(event.net_cents), color: "var(--color-paid)" },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 3 }}>{item.label}</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: item.color ?? "var(--color-text)" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = preset === "custom"
    ? { from: customFrom, to: customTo }
    : presetRange(preset);

  useEffect(() => {
    if (!range.from || !range.to) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const api = createApiClient({
          baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
          ...(session?.access_token ? { token: session.access_token } : {}),
        });
        const result = await api.chef.reports.summary(range.from, range.to);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setError("Could not load report data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  const chartData = (data?.series ?? []).map(s => ({
    date: s.date,
    revenue: s.revenue_cents / 100,
  }));

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 16 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500 }}>Reports</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {data && (
            <>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>CSV formatted for QuickBooks import</p>
              <button
                onClick={() => data && exportCsv(data)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px",
                  background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)",
                  fontSize: 13, fontWeight: 500, color: "var(--color-canvas)", cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.5 10v1.5a1 1 0 001 1h9a1 1 0 001-1V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date range */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            style={{
              height: 34, padding: "0 14px",
              background: preset === p.key ? "var(--color-text)" : "var(--color-surface)",
              border: `0.5px solid ${preset === p.key ? "var(--color-text)" : "var(--color-hairline)"}`,
              borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: preset === p.key ? 600 : 400,
              color: preset === p.key ? "var(--color-canvas)" : "var(--color-text-2)", cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}

        {preset === "custom" && (
          <>
            <input
              type="date" value={customFrom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomFrom(e.target.value)}
              style={{ height: 34, padding: "0 12px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none" }}
            />
            <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>–</span>
            <input
              type="date" value={customTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTo(e.target.value)}
              style={{ height: 34, padding: "0 12px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none" }}
            />
          </>
        )}
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 90, background: "var(--color-surface-2)", borderRadius: "var(--radius-lg)", animation: "suppr-pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {error && <p style={{ color: "var(--color-alert)", fontSize: 14, marginBottom: 24 }}>{error}</p>}

      {data && (
        <>
          {/* Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
            <MetricCard label="Total sales" value={fmt(data.total_sales_cents)} colorVar="var(--color-paid)" />
            <MetricCard label="Tips" value={fmt(data.tips_cents)} colorVar="var(--color-note)" />
            <MetricCard label="Taxes" value={fmt(data.taxes_cents)} />
            <MetricCard label="Platform fees" value={fmt(data.platform_fees_cents)} />
            <MetricCard label="Refunds" value={fmt(data.refunds_cents)} colorVar="var(--color-alert)" />
            <MetricCard label="Net payout" value={fmt(data.net_payout_cents)} colorVar="var(--color-paid)" sub="After fees and refunds" />
          </div>

          {/* Revenue chart */}
          {chartData.length > 0 && (
            <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "20px 20px 8px", marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Revenue over time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 12 }}
                    formatter={(v: unknown) => [`$${typeof v === "number" ? v.toFixed(0) : v}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Events breakdown */}
          {data.events.length > 0 && (
            <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--color-hairline)", background: "var(--color-surface-2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 88px 88px 88px 88px 88px 88px 28px", gap: 0 }}>
                  {["Event", "Covers", "Sales", "Tips", "Taxes", "Fees", "Refunds", "Net", ""].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                  ))}
                </div>
              </div>
              {data.events.map(e => <EventRow key={e.event_id} event={e} />)}
            </div>
          )}

          {data.events.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)" }}>
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No events in this period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
