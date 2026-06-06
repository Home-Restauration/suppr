import React from "react";
import { Chip } from "./Chip.js";
import { Avatar } from "./Avatar.js";
import { Skeleton } from "./Skeleton.js";

interface EventCardMedia {
  url: string;
  type: "image" | "video";
}

interface EventCardChef {
  brand_name: string;
  city: string;
  avatar_url?: string | null | undefined;
}

interface EventCardProps {
  id: string;
  title: string;
  starts_at: string;
  available_seats: number;
  price_cents: number;
  media: EventCardMedia[];
  chef?: EventCardChef | undefined;
  href?: string | undefined;
  className?: string | undefined;
}

const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export function EventCard({ id, title, starts_at, available_seats, price_cents, media, chef, href, className }: EventCardProps) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const cdnBase = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? "") : "";
  const heroMedia = media[0];
  const seatsVariant = available_seats <= 5 ? "accent" : "paid";

  const inner = (
    <>
      {/* 16:9 media */}
      <div style={{ position: "relative", paddingTop: "56.25%", background: "var(--color-surface-2)", overflow: "hidden" }}>
        {!imgLoaded && (
          <Skeleton style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 0 }} />
        )}
        {heroMedia && (
          <img
            src={`${cdnBase}${heroMedia.url}`}
            alt={title}
            onLoad={() => setImgLoaded(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 150ms ease",
            }}
          />
        )}
        {/* Seats chip floated top-right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Chip variant={seatsVariant}>{available_seats} seats left</Chip>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px 14px" }}>
        {chef && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar src={chef.avatar_url ?? null} name={chef.brand_name} size={28} />
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)", lineHeight: "var(--leading-sm)" }}>
                {chef.brand_name}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: "var(--leading-xs)" }}>
                {chef.city}
              </div>
            </div>
          </div>
        )}

        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", lineHeight: "var(--leading-lg)", color: "var(--color-text)", fontWeight: 500, marginBottom: 8 }}>
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
            {fmtDate(starts_at)}
          </span>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text)" }}>
            {fmt(price_cents)} / seat
          </span>
        </div>
      </div>
    </>
  );

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "0.5px solid var(--color-hairline)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    display: "block",
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 150ms ease",
  };

  if (href) {
    return (
      <a href={href} className={className} style={cardStyle}>
        {inner}
      </a>
    );
  }

  return (
    <div className={className} style={cardStyle}>
      {inner}
    </div>
  );
}

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className} style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <Skeleton height={0} style={{ paddingTop: "56.25%", borderRadius: 0 }} />
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Skeleton width={28} height={28} radius="50%" />
          <Skeleton width={100} height={14} />
        </div>
        <Skeleton height={20} width="75%" />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton width={80} height={13} />
          <Skeleton width={60} height={13} />
        </div>
      </div>
    </div>
  );
}
