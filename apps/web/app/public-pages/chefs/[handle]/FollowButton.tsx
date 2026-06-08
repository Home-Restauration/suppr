"use client";
import React from "react";
interface FollowButtonProps {
  chefId: string;
  initialFollowing?: boolean;
}

export function FollowButton({ chefId, initialFollowing = false }: FollowButtonProps) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [loading, setLoading] = React.useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      // TODO: swap for typed client once POST /follow/:chefId + DELETE /follow/:chefId
      // are added to packages/contracts. Contract PR needed.
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/follow/${chefId}`, {
        method: following ? "DELETE" : "POST",
        credentials: "include",
      });
      setFollowing((f) => !f);
    } catch {
      // unauthenticated — redirect to login handled by middleware
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 20px",
        borderRadius: "var(--radius-md)",
        border: following ? "none" : "0.5px solid var(--color-hairline)",
        background: following ? "var(--color-text)" : "transparent",
        color: following ? "var(--color-canvas)" : "var(--color-text)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        fontFamily: "var(--font-sans)",
        cursor: loading ? "default" : "pointer",
        minHeight: 44,
        opacity: loading ? 0.7 : 1,
        transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
      }}
    >
      {following ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Following
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Follow
        </>
      )}
    </button>
  );
}
