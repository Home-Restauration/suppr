import React from "react";

interface AvatarProps {
  src?: string | null | undefined;
  name?: string | undefined;
  size?: number | undefined;
  className?: string | undefined;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: Math.round(size * 0.36),
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    overflow: "hidden",
  };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || ""}
        className={className}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        background: "var(--color-surface-2)",
        color: "var(--color-text-2)",
        letterSpacing: "0.02em",
      }}
    >
      {initials(name)}
    </div>
  );
}
