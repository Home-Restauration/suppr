"use client";
import React from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant | undefined;
  onDismiss?: (() => void) | undefined;
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

const variantStyles: Record<ToastVariant, React.CSSProperties> = {
  success: { background: "var(--color-paid-bg)", color: "var(--color-paid)", border: "0.5px solid var(--color-paid)" },
  error:   { background: "var(--color-alert-bg)", color: "var(--color-alert)", border: "0.5px solid var(--color-alert)" },
  info:    { background: "var(--color-surface)", color: "var(--color-text)", border: "0.5px solid var(--color-hairline)" },
};

export function Toast({ message, variant = "info", onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-sm)",
        lineHeight: "var(--leading-sm)",
        fontFamily: "var(--font-sans)",
        minHeight: 44,
        animation: "suppr-fade 150ms ease",
        ...variantStyles[variant],
      }}
    >
      <span style={{ flexShrink: 0 }}>{icons[variant]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "currentColor",
            opacity: 0.6,
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Toast container for stacking ── */
interface ToastItem { id: string; message: string; variant?: ToastVariant | undefined; }

interface ToastContainerProps { toasts: ToastItem[]; onDismiss: (id: string) => void; }

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        pointerEvents: toasts.length ? "auto" : "none",
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
