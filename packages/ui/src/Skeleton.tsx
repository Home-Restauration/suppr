import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = "var(--radius-sm)", className, style }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: radius,
        background: "var(--color-surface-2)",
        animation: "suppr-pulse 1.6s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
