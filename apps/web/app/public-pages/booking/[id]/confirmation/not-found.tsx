import React from "react";

export default function ConfirmationNotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--color-text)" }}>
        Booking not found
      </p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", maxWidth: 320 }}>
        We couldn't find this booking. If you think this is an error, check the
        confirmation text or email you received.
      </p>
      <a
        href="/"
        style={{
          marginTop: 8,
          fontSize: "var(--text-sm)",
          color: "var(--color-accent)",
          textDecoration: "none",
        }}
      >
        ← Back to Suppr
      </a>
    </main>
  );
}
