import React from "react";

export interface EventCardProps {
  id: string;
  title: string;
  chefName: string;
  city: string;
  dateLabel: string;
  seatsLabel: string;
  priceCents: number;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  className?: string;
}

function SeatsChip({ label }: { label: string }) {
  const isWaitlist = label.toLowerCase() === "waitlist";
  const isSoldOut = label.toLowerCase() === "sold out";
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 22,
    padding: "0 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.02em",
    background: isWaitlist || isSoldOut ? "var(--color-surface-2)" : "var(--color-accent-tint)",
    color: isWaitlist || isSoldOut ? "var(--color-text-muted)" : "var(--color-accent-deep)",
  };
  return <span style={style}>{label}</span>;
}

export function EventCard({
  title,
  chefName,
  city,
  dateLabel,
  seatsLabel,
  priceCents,
  imageUrl,
  imageAlt,
  href,
  className,
}: EventCardProps) {
  const price = `$${Math.round(priceCents / 100)}`;

  const inner = (
    <div
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-hairline)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: href ? "pointer" : "default",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        flexShrink: 0,
        width: 280,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(52,48,42,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt ?? title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <div style={{ width: "100%", height: "100%", background: "var(--color-surface-2)" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-tint) 60%, transparent), color-mix(in srgb, var(--color-surface-2) 80%, transparent))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", textAlign: "center", padding: "0 12px" }}>
                {title} · {chefName}
              </span>
            </div>
          </>
        )}
        {/* Date badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: "var(--color-canvas)", borderRadius: "var(--radius-sm)",
          padding: "3px 8px", fontSize: 11, fontWeight: 600,
          color: "var(--color-text)", fontFamily: "var(--font-sans)",
          boxShadow: "0 1px 4px rgba(52,48,42,0.1)",
        }}>
          {dateLabel}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}>
          {chefName} · {city}
        </p>
        <p style={{
          fontFamily: "var(--font-display)", fontSize: "var(--text-xl)",
          fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--lh-xl)",
        }}>
          {title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <SeatsChip label={seatsLabel} />
          <span style={{ marginLeft: "auto", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}>
            {price}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none", display: "contents" }}>
        {inner}
      </a>
    );
  }
  return inner;
}
