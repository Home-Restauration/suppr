import { createClient } from "@/lib/supabase/server";
import { createApiClient } from "@suppr/contracts/client";
import type { FeedPost } from "@suppr/contracts/schemas";

export default async function FeedPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const api = createApiClient({
    baseUrl: process.env.API_URL!,
    ...(session?.access_token ? { token: session.access_token } : {}),
  });

  let posts: FeedPost[] = [];
  try { posts = await api.feed.list({}); } catch { /* show empty state */ }

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500 }}>Suppr</h1>
        <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>Discover · Book · Eat</span>
      </header>
      {posts.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: 15 }}>
          No events near you yet — check back soon.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post: any) => (
          <div key={post.id} style={{
            background: "var(--color-surface)", border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)", overflow: "hidden",
          }}>
            <div style={{ height: 200, background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              {post.media?.[0] ? <img src={post.media[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📸"}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>{post.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
