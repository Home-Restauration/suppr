import { Skeleton } from "@suppr/ui";

export default function ChefProfileLoading() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      {/* Hero skeleton */}
      <div style={{ position: "relative", width: "100%", minHeight: 320, background: "var(--color-surface-2)" }}>
        <div style={{ position: "absolute", bottom: 32, left: 24, right: 24 }}>
          <Skeleton height={42} width="55%" style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton height={22} width={80} />
            <Skeleton height={22} width={70} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <Skeleton height={44} width={110} style={{ borderRadius: "var(--radius-md)" }} />
          <Skeleton height={44} width={190} style={{ borderRadius: "var(--radius-md)" }} />
        </div>

        {/* Bio */}
        <Skeleton height={22} style={{ marginBottom: 10 }} />
        <Skeleton height={22} width="85%" style={{ marginBottom: 10 }} />
        <Skeleton height={22} width="70%" style={{ marginBottom: 40 }} />

        {/* Divider */}
        <div style={{ height: "0.5px", background: "var(--color-hairline)", marginBottom: 32 }} />

        {/* Section label */}
        <Skeleton height={11} width={160} style={{ marginBottom: 16 }} />

        {/* Event card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <Skeleton height={180} style={{ borderRadius: 0 }} />
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton height={20} width="75%" />
                <Skeleton height={14} width="50%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
