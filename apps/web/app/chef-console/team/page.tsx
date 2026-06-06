"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createApiClient } from "@suppr/contracts/client";
import type { TeamMember, TeamPermissions } from "@suppr/contracts/schemas";

const PERM_LABELS: { key: keyof TeamPermissions; label: string; description: string }[] = [
  { key: "profile_events",  label: "Profile & events",    description: "Edit chef profile and manage events" },
  { key: "communication",   label: "Communication",        description: "Message guests on behalf of chef" },
  { key: "finance",         label: "Finance",              description: "View reports and payout details" },
  { key: "kitchen_guests",  label: "Kitchen & guest data", description: "View guest list, allergies, dietary" },
  { key: "refunds_comps",   label: "Refunds & comps",      description: "Issue refunds and comp tickets" },
];

const DEFAULT_PERMS: TeamPermissions = {
  profile_events: false,
  communication: true,
  finance: false,
  kitchen_guests: true,
  refunds_comps: false,
};

function getApi(token?: string | undefined) {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    ...(token ? { token } : {}),
  });
}

function PermBadge({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-trust-bg)", color: "var(--color-trust)" }}>
      {label}
    </span>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | undefined>(undefined);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState<TeamPermissions>(DEFAULT_PERMS);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<TeamPermissions>(DEFAULT_PERMS);

  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token;
      setToken(t);
      try {
        const result = await getApi(t).chef.team.list();
        setMembers(result);
      } catch {
        setError("Could not load team members.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      await getApi(token).chef.team.invite({ email: inviteEmail.trim(), permissions: invitePerms });
      setInviteEmail("");
      setInvitePerms(DEFAULT_PERMS);
      const result = await getApi(token).chef.team.list();
      setMembers(result);
    } catch {
      setInviteError("Could not send invite. Check the email and try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleSavePerms(memberId: string) {
    try {
      const updated = await getApi(token).chef.team.updatePermissions(memberId, editPerms);
      setMembers(prev => prev.map(m => m.id === memberId ? updated : m));
      setEditingId(null);
    } catch {
      // ignore
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await getApi(token).chef.team.remove(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setRemovingId(null);
    } catch {
      // ignore
    }
  }

  const pending = members.filter(m => !m.accepted_at);
  const accepted = members.filter(m => m.accepted_at);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, marginBottom: 28 }}>Team</h1>

      {/* Invite form */}
      <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Invite a team member</h2>
        <input
          type="email"
          value={inviteEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
          placeholder="colleague@email.com"
          style={{ width: "100%", height: 44, padding: "0 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", marginBottom: 16 }}
        />

        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-2)", marginBottom: 12 }}>Permissions</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {PERM_LABELS.map(({ key, label, description }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--color-hairline)", cursor: "pointer" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{label}</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{description}</p>
              </div>
              <input
                type="checkbox"
                checked={invitePerms[key]}
                onChange={() => setInvitePerms(p => ({ ...p, [key]: !p[key] }))}
                style={{ width: 16, height: 16, accentColor: "var(--color-accent)", flexShrink: 0 }}
              />
            </label>
          ))}
        </div>

        {inviteError && <p style={{ fontSize: 12, color: "var(--color-alert)", marginTop: 10 }}>{inviteError}</p>}

        <button
          onClick={handleInvite}
          disabled={inviting || !inviteEmail.trim()}
          style={{
            marginTop: 16, height: 40, padding: "0 24px",
            background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)",
            fontSize: 13, fontWeight: 600, color: "var(--color-canvas)",
            cursor: inviting || !inviteEmail.trim() ? "not-allowed" : "pointer",
            opacity: inviteEmail.trim() ? 1 : 0.5,
          }}
        >
          {inviting ? "Sending…" : "Send invite"}
        </button>
      </div>

      {error && <p style={{ color: "var(--color-alert)", fontSize: 14, marginBottom: 20 }}>{error}</p>}

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</p>}

      {/* Active members */}
      {accepted.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Active · {accepted.length}</h2>
          <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {accepted.map((member, i) => (
              <div key={member.id}>
                <div style={{ padding: "16px 20px", borderBottom: i < accepted.length - 1 || editingId === member.id ? "0.5px solid var(--color-hairline)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{member.name ?? member.email}</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{member.email} · {member.role}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {PERM_LABELS.filter(p => member.permissions[p.key]).map(p => <PermBadge key={p.key} label={p.label} />)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingId(editingId === member.id ? null : member.id); setEditPerms(member.permissions); }}
                        style={{ height: 32, padding: "0 12px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, color: "var(--color-text-2)", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setRemovingId(member.id)}
                        style={{ height: 32, padding: "0 12px", background: "var(--color-alert-bg)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, color: "var(--color-alert)", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {editingId === member.id && (
                  <div style={{ padding: "14px 20px 18px", background: "var(--color-surface-2)", borderBottom: "0.5px solid var(--color-hairline)" }}>
                    {PERM_LABELS.map(({ key, label }) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "0.5px solid var(--color-hairline)", cursor: "pointer" }}>
                        <span style={{ fontSize: 13, color: "var(--color-text)" }}>{label}</span>
                        <input
                          type="checkbox"
                          checked={editPerms[key]}
                          onChange={() => setEditPerms(p => ({ ...p, [key]: !p[key] }))}
                          style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                        />
                      </label>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => handleSavePerms(member.id)} style={{ height: 34, padding: "0 16px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ height: 34, padding: "0 14px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--color-text-2)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invites */}
      {pending.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Pending invites · {pending.length}</h2>
          <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {pending.map((member, i) => (
              <div key={member.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < pending.length - 1 ? "0.5px solid var(--color-hairline)" : "none" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{member.email}</p>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Invited {new Date(member.invited_at).toLocaleDateString()}</p>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", background: "var(--color-note-bg)", color: "var(--color-note)", borderRadius: "var(--radius-sm)", fontWeight: 500 }}>Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove confirm modal */}
      {removingId && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setRemovingId(null); }} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: 28, maxWidth: 380, width: "100%", border: "0.5px solid var(--color-hairline)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Remove team member?</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 20 }}>They will lose access immediately. You can re-invite them later.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setRemovingId(null)} style={{ height: 38, padding: "0 16px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text-2)", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleRemove(removingId)} style={{ height: 38, padding: "0 16px", background: "var(--color-alert)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
