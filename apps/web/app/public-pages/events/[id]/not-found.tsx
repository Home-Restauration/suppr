export default function EventNotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            color: "var(--color-text)",
            marginBottom: 8,
          }}
        >
          Event not found
        </p>
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-2)", marginBottom: 24 }}>
          This event may have ended or been removed.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "var(--color-text)",
            color: "var(--color-canvas)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          ← Back to feed
        </a>
      </div>
    </main>
  );
}
