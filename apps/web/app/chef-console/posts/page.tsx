"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createApiClient } from "@suppr/contracts/client";
import type { FeedPost } from "@suppr/contracts/schemas";

function getApi(token?: string | undefined) {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    ...(token ? { token } : {}),
  });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function PostCard({ post, onPublish, onDelete }: { post: FeedPost; onPublish: (id: string) => void; onDelete: (id: string) => void }) {
  const isDraft = post.status === "draft";
  const media = post.media[0];

  return (
    <div style={{ background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ aspectRatio: "4/3", background: "var(--color-surface-2)", position: "relative" }}>
        {media?.type === "image" && (
          <img src={media.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {media?.type === "video" && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="var(--color-text-muted)" strokeWidth="1" />
              <path d="M12 10l12 6-12 6V10z" fill="var(--color-text-muted)" />
            </svg>
          </div>
        )}
        {!media && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", fontSize: 13 }}>No media</div>}
        <span style={{
          position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 600, padding: "3px 8px",
          background: isDraft ? "var(--color-note-bg)" : "var(--color-paid-bg)",
          color: isDraft ? "var(--color-note)" : "var(--color-paid)", borderRadius: "var(--radius-sm)",
        }}>{isDraft ? "Draft" : "Published"}</span>
        {post.drafted_by_ai && (
          <span style={{
            position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 600, padding: "3px 8px",
            background: "var(--color-accent-tint)", color: "var(--color-accent-deep)", borderRadius: "var(--radius-sm)",
          }}>AI</span>
        )}
      </div>
      <div style={{ padding: "12px 14px" }}>
        {post.caption && <p style={{ fontSize: 13, color: "var(--color-text)", marginBottom: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.caption}</p>}
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 10 }}>
          {post.published_at ? relTime(post.published_at) : "Not published"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {isDraft && (
            <button onClick={() => onPublish(post.id)} style={{ flex: 1, height: 32, background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}>
              Publish
            </button>
          )}
          <button onClick={() => onDelete(post.id)} style={{ flex: isDraft ? 0 : 1, height: 32, padding: "0 12px", background: "var(--color-alert-bg)", border: "none", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, color: "var(--color-alert)", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function NewPostModal({ token, onClose, onCreated }: { token: string | undefined; onClose: () => void; onCreated: (post: FeedPost) => void }) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const api = getApi(token);
      const { upload_url, public_url } = await api.chef.media.signedUrl("suppr-media", file.name, file.type);
      await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setMediaUrl(public_url);
    } catch {
      // ignore upload errors
    } finally {
      setUploading(false);
    }
  }

  async function handleAiCaption() {
    if (!mediaUrl) return;
    setAiLoading(true);
    try {
      const api = getApi(token);
      const { caption: draft } = await api.chef.posts.aiCaption(mediaUrl);
      setCaption(draft);
    } catch {
      // ignore
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const api = getApi(token);
      const media = mediaUrl ? [{ url: mediaUrl, type: (mediaUrl.includes(".mp4") ? "video" : "image") as "image" | "video" }] : [];
      let post = await api.chef.posts.create({ caption: caption || null, media, linked_event_id: null });
      if (publishNow) post = await api.chef.posts.publish(post.id);
      onCreated(post);
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: 28, width: "100%", maxWidth: 520, border: "0.5px solid var(--color-hairline)", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>New post</h2>

        {/* Media upload */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            height: 180, background: "var(--color-surface-2)", border: "0.5px dashed var(--color-hairline)",
            borderRadius: "var(--radius-md)", cursor: "pointer", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden",
          }}
        >
          {mediaUrl ? (
            <img src={mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{uploading ? "Uploading…" : "Click to upload photo or video"}</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Caption</label>
            {mediaUrl && (
              <button onClick={handleAiCaption} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", background: "var(--color-accent-tint)", border: "0.5px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: 11, fontWeight: 600, color: "var(--color-accent-deep)", cursor: "pointer" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1l1.2 2.8L10 5.5l-3.3 1.7L5.5 10 4.3 7.2 1 5.5l3.3-1.7L5.5 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                {aiLoading ? "Drafting…" : "Draft with AI"}
              </button>
            )}
          </div>
          <textarea
            value={caption}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
            placeholder="Tell the story of this dish…"
            rows={4}
            style={{ width: "100%", padding: "10px 14px", background: "var(--color-canvas)", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-sans)", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
          <input type="checkbox" checked={publishNow} onChange={() => setPublishNow(p => !p)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }} />
          <span style={{ fontSize: 13, color: "var(--color-text)" }}>Publish immediately</span>
        </label>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", background: "transparent", border: "0.5px solid var(--color-hairline)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--color-text-2)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ height: 38, padding: "0 20px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : publishNow ? "Publish" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostsPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const t = session?.access_token;
      setToken(t);
      try {
        const result = await getApi(t).chef.posts.list();
        setPosts(result);
      } catch {
        // empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePublish(id: string) {
    try {
      const updated = await getApi(token).chef.posts.publish(id);
      setPosts(prev => prev.map(p => p.id === id ? updated : p));
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await getApi(token).chef.posts.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {}
  }

  const aiSuggested = posts.filter(p => p.drafted_by_ai && p.status === "draft");
  const myPosts = posts.filter(p => !(p.drafted_by_ai && p.status === "draft"));

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500 }}>Posts</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{ height: 40, padding: "0 18px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}
        >
          + New post
        </button>
      </div>

      {loading && <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</p>}

      {/* AI suggested posts */}
      {aiSuggested.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.5 3.5L12.5 7l-4 1.5L7 12.5 5.5 9 1.5 7l4-1.5L7 1.5z" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinejoin="round" /></svg>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-accent)" }}>AI suggested · {aiSuggested.length}</h2>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Drafted automatically after your events. Review and publish.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {aiSuggested.map(post => <PostCard key={post.id} post={post} onPublish={handlePublish} onDelete={handleDelete} />)}
          </div>
          <div style={{ height: "0.5px", background: "var(--color-hairline)", margin: "28px 0" }} />
        </div>
      )}

      {/* My posts */}
      {myPosts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {myPosts.map(post => <PostCard key={post.id} post={post} onPublish={handlePublish} onDelete={handleDelete} />)}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 12 }}>No posts yet. Share your first dish.</p>
          <button onClick={() => setShowModal(true)} style={{ height: 40, padding: "0 18px", background: "var(--color-text)", border: "none", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600, color: "var(--color-canvas)", cursor: "pointer" }}>Create post</button>
        </div>
      )}

      {showModal && <NewPostModal token={token} onClose={() => setShowModal(false)} onCreated={post => setPosts(prev => [post, ...prev])} />}
    </div>
  );
}
