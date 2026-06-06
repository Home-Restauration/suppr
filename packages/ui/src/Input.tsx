import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  helperText?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
}

export function Input({ label, helperText, error, className, id, style, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--text-sm)",
            lineHeight: "var(--leading-sm)",
            fontWeight: 500,
            color: "var(--color-text)",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          height: 44,
          padding: "0 12px",
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-base)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-text)",
          background: "var(--color-surface)",
          border: error
            ? "0.5px solid var(--color-alert)"
            : "0.5px solid var(--color-hairline)",
          borderRadius: "var(--radius-md)",
          outline: "none",
          width: "100%",
          transition: "border-color 150ms ease",
          ...style,
        }}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = error
            ? "var(--color-alert)"
            : "var(--color-text-2)";
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = error
            ? "var(--color-alert)"
            : "var(--color-hairline)";
        }}
        {...props}
      />
      {(helperText || error) && (
        <span
          style={{
            fontSize: "var(--text-xs)",
            lineHeight: "var(--leading-xs)",
            color: error ? "var(--color-alert)" : "var(--color-text-muted)",
          }}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
}
