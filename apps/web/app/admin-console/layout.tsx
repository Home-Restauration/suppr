import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NavLink } from "../chef-console/NavLink";

const navItems = [
  {
    href: "/admin-console/admin",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
  },
];

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login?next=/admin-console/admin");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-canvas)" }}>
      <nav style={{ width: 220, flexShrink: 0, borderRight: "0.5px solid var(--color-hairline)", background: "var(--color-surface)", display: "flex", flexDirection: "column", padding: "20px 12px", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "4px 12px 20px", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--color-accent)" }}>
          Admin
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>
        <div style={{ paddingTop: 16, borderTop: "0.5px solid var(--color-hairline)" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "0 12px" }}>{session.user.email}</p>
        </div>
      </nav>
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>{children}</div>
    </div>
  );
}
