import { Skeleton } from "@suppr/ui";

export default function CheckoutLoading() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
        {/* Countdown placeholder */}
        <Skeleton height={44} style={{ borderRadius: "var(--radius-md)", marginBottom: 32 }} />

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
              <Skeleton width={28} height={28} radius="50%" />
              {i < 2 && <div style={{ flex: 1, height: 1, background: "var(--color-hairline)" }} />}
            </div>
          ))}
        </div>

        {/* Form fields */}
        <Skeleton height={28} width={180} style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Skeleton height={14} width={80} style={{ marginBottom: 6 }} />
            <Skeleton height={44} style={{ borderRadius: "var(--radius-md)" }} />
          </div>
        ))}
        <Skeleton height={48} style={{ borderRadius: "var(--radius-md)", marginTop: 32 }} />
      </div>
    </main>
  );
}
