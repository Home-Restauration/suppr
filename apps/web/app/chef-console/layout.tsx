import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NavLink } from "./NavLink";

const navItems = [
  {
    href: "/chef-console/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
  },
  {
    href: "/chef-console/events",
    label: "Events",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.25" />
        <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/chef-console/reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3.5-4 3 2.5L12 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5h2M12 5v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/chef-console/team",
    label: "Team",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="12" cy="5" r="1.75" stroke="currentColor" strokeWidth="1.25" />
        <path d="M14.5 13c0-1.93-1.12-3.6-2.75-4.43" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/chef-console/posts",
    label: "Posts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M4.5 8h7M4.5 5.5h7M4.5 10.5h4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function ChefConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login?next=/chef-console/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-canvas)" }}>
      {/* Sidebar */}
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: "0.5px solid var(--color-hairline)",
          background: "var(--color-surface)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 12px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "4px 12px 20px",
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--color-accent)",
            letterSpacing: "-0.02em",
          }}
        >
          Suppr
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </div>

        <div
          style={{
            paddingTop: 16,
            borderTop: "0.5px solid var(--color-hairline)",
            marginTop: 8,
          }}
        >
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "0 12px", lineHeight: 1.5 }}>
            {session.user.email}
          </p>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}
