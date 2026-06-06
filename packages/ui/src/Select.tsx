import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({ label, helperText, error, options, placeholder, className, id, style, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          htmlFor={selectId}
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
      <div style={{ position: "relative" }}>
        <select
          id={selectId}
          style={{
            height: 44,
            padding: "0 36px 0 12px",
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
            appearance: "none",
            cursor: "pointer",
            ...style,
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--color-text-muted)",
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
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
