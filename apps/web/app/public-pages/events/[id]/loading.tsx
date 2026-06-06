import { Skeleton } from "@suppr/ui";

export default function EventPageLoading() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: "1fr 400px", gap: "48px", alignItems: "start" }}>
        {/* Content */}
        <div>
          <Skeleton height={0} style={{ paddingTop: "56.25%", borderRadius: "var(--radius-lg)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, paddingBottom: 20 }}>
            <Skeleton width={40} height={40} radius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton height={16} width={140} />
              <Skeleton height={12} width={80} style={{ marginTop: 4 }} />
            </div>
          </div>
          <Skeleton height={32} width="70%" style={{ marginTop: 8 }} />
          <Skeleton height={32} width="50%" style={{ marginTop: 8 }} />
          <Skeleton height={15} style={{ marginTop: 20 }} />
          <Skeleton height={15} style={{ marginTop: 8 }} />
          <Skeleton height={15} width="85%" style={{ marginTop: 8 }} />
        </div>

        {/* Booking card */}
        <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: 24 }}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={14} width="40%" style={{ marginTop: 6 }} />
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={15} />
            ))}
          </div>
          <Skeleton height={48} style={{ marginTop: 20, borderRadius: "var(--radius-md)" }} />
        </div>
      </div>
    </main>
  );
}
