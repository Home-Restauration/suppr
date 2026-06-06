"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        color: active ? "var(--color-text)" : "var(--color-text-2)",
        background: active ? "var(--color-surface-2)" : "transparent",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        transition: "background 0.12s, color 0.12s",
      }}
    >
      <span style={{ fontSize: 16, color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
