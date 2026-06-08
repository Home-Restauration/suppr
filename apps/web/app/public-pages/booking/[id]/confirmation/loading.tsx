import React from "react";

export default function ConfirmationLoading() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "2.5px solid var(--color-hairline)",
          borderTopColor: "var(--color-accent)",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          color: "var(--color-text)",
        }}
      >
        Confirming your booking…
      </p>
    </main>
  );
}
