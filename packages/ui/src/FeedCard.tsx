import React from "react";
import { Avatar } from "./Avatar";
import { Chip } from "./Chip";
import { Skeleton } from "./Skeleton";

interface FeedCardMedia {
  url: string;
  type: "image" | "video";
  mux_playback_id?: string | undefined;
}

interface FeedCardChef {
  brand_name: string;
  city: string;
  avatar_url?: string | null | undefined;
}

interface FeedCardProps {
  id: string;
  caption?: string | null | undefined;
  media: FeedCardMedia[];
  chef?: FeedCardChef | undefined;
  published_at?: string | null | undefined;
  linked_event?: {
    id: string;
    title: string;
    available_seats: number;
    href?: string | undefined;
  } | null | undefined;
  className?: string | undefined;
}

const fmtRelative = (iso?: string | null): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export function FeedCard({ id, caption, media, chef, published_at, linked_event, className }: FeedCardProps) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const cdnBase = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? "") : "";
  const heroMedia = media[0];

  return (
    <article
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-hairline)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Full-width 16:9 media — media-first */}
      <div style={{ position: "relative", paddingTop: "56.25%", background: "var(--color-surface-2)" }}>
        {!imgLoaded && (
          <Skeleton style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 0 }} />
        )}
        {heroMedia && (
          <img
            src={`${cdnBase}${heroMedia.url}`}
            alt={caption ?? ""}
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
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Chef row */}
        {chef && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Avatar src={chef.avatar_url ?? null} name={chef.brand_name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)" }}>
                {chef.brand_name}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {chef.city} · {fmtRelative(published_at)}
              </div>
            </div>
          </div>
        )}

        {caption && (
          <p style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-base)", color: "var(--color-text-2)", marginBottom: linked_event ? 12 : 0 }}>
            {caption}
          </p>
        )}

        {/* Linked event CTA */}
        {linked_event && (
          <a
            href={linked_event.href ?? `/events/${linked_event.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "var(--color-surface-2)",
              border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {linked_event.title}
            </span>
            <Chip variant={linked_event.available_seats <= 5 ? "accent" : "paid"}>
              {linked_event.available_seats} seats
            </Chip>
          </a>
        )}
      </div>
    </article>
  );
}

export function FeedCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className} style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <Skeleton height={0} style={{ paddingTop: "56.25%", borderRadius: 0 }} />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Skeleton width={36} height={36} radius="50%" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            <Skeleton width={100} height={13} />
            <Skeleton width={70} height={11} />
          </div>
        </div>
        <Skeleton height={14} />
        <Skeleton height={14} width="80%" />
      </div>
    </div>
  );
}
