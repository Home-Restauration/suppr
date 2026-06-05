import React from "react";
interface LineItem { label: string; amount_cents: number; muted?: boolean; }
interface PriceBreakdownProps { items: LineItem[]; total_cents: number; }
const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export function PriceBreakdown({ items, total_cents }: PriceBreakdownProps) {
  return (
    <div style={{ fontSize: 14 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-hairline)", color: item.muted ? "var(--color-text-muted)" : "var(--color-text)" }}>
          <span>{item.label}</span><span>{fmt(item.amount_cents)}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", fontWeight: 500, fontSize: 15 }}>
        <span>Total</span><span>{fmt(total_cents)}</span>
      </div>
    </div>
  );
}
