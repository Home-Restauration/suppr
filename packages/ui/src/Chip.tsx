import React from "react";
type ChipVariant = "paid" | "note" | "alert" | "trust" | "accent" | "default";
interface ChipProps { variant?: ChipVariant; children: React.ReactNode; className?: string; }
const chipStyles: Record<ChipVariant, React.CSSProperties> = {
  paid:    { background: "var(--color-paid-bg)",    color: "var(--color-paid)" },
  note:    { background: "var(--color-note-bg)",    color: "var(--color-note)" },
  alert:   { background: "var(--color-alert-bg)",   color: "var(--color-alert)" },
  trust:   { background: "var(--color-trust-bg)",   color: "var(--color-trust)" },
  accent:  { background: "var(--color-accent-tint)",color: "var(--color-accent-deep)" },
  default: { background: "var(--color-surface-2)",  color: "var(--color-text-2)" },
};
export function Chip({ variant = "default", children }: ChipProps) {
  return (
    <span style={{ ...chipStyles[variant], display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: "var(--radius-md)", fontWeight: 500 }}>
      {children}
    </span>
  );
}
