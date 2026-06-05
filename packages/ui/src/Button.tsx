import React from "react";
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
}
const styles: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--color-text)", color: "var(--color-canvas)", border: "none" },
  secondary: { background: "var(--color-surface)", color: "var(--color-text)", border: "0.5px solid var(--color-hairline)" },
  ghost: { background: "transparent", color: "var(--color-text)", border: "0.5px solid var(--color-hairline)" },
  danger: { background: "var(--color-alert-bg)", color: "var(--color-alert)", border: "0.5px solid var(--color-alert)" },
};
const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: 12 },
  md: { padding: "10px 18px", fontSize: 14 },
  lg: { padding: "13px 24px", fontSize: 15 },
};
export function Button({ variant = "primary", size = "md", loading, children, style, ...props }: ButtonProps) {
  return (
    <button style={{ ...styles[variant], ...sizes[size], borderRadius: "var(--radius-md)", fontWeight: 500, cursor: "pointer", opacity: loading ? 0.7 : 1, ...style }} {...props}>
      {loading ? "…" : children}
    </button>
  );
}
