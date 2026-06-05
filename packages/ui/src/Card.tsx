import React from "react";
interface CardProps extends React.HTMLAttributes<HTMLDivElement> { elevated?: boolean; }
export function Card({ elevated, children, style, ...props }: CardProps) {
  return (
    <div style={{ background: "var(--color-surface)", border: `0.5px solid var(--color-hairline)`, borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", ...style }} {...props}>
      {children}
    </div>
  );
}
