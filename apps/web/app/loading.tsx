import { FeedCardSkeleton, EventCardSkeleton, Skeleton } from "@suppr/ui";

export default function FeedLoading() {
  return (
    <div
      data-theme="dark"
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "0.5px solid var(--color-hairline)" }}>
        <Skeleton height={28} width={72} style={{ borderRadius: "var(--radius-sm)" }} />
        <Skeleton height={24} width={100} style={{ borderRadius: 99 }} />
      </header>

      {/* Tonight rail */}
      <div style={{ paddingTop: 24, paddingInline: 20, marginBottom: 32 }}>
        <Skeleton height={11} width={140} style={{ marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 14, overflow: "hidden" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ minWidth: 260, flexShrink: 0 }}>
              <EventCardSkeleton />
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingInline: 20 }}>
        {[1, 2, 3].map((i) => <FeedCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
