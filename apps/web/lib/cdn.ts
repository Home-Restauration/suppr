const CDN = process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? process.env.AZURE_CDN_ENDPOINT ?? "";

/**
 * Convert a Supabase Storage public path to a CDN URL.
 *
 * Usage:
 *   cdnUrl("suppr-media/events/abc123/hero.jpg")
 *   → "https://suppr-a8ajd8fzgxdfgbdp.z02.azurefd.net/suppr-media/events/abc123/hero.jpg"
 *
 * Falls back to the raw Supabase Storage URL when CDN is not configured.
 */
export function cdnUrl(storagePath: string): string {
  const path = storagePath.startsWith("/") ? storagePath.slice(1) : storagePath;
  if (CDN) return `${CDN}/${path}`;
  // Fallback: construct Supabase Storage public URL directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
}

/**
 * Convert a full Supabase Storage URL to a CDN URL.
 * Handles URLs like https://<project>.supabase.co/storage/v1/object/public/bucket/path
 */
export function supabaseUrlToCdn(supabasePublicUrl: string): string {
  if (!CDN) return supabasePublicUrl;
  const marker = "/storage/v1/object/public/";
  const idx = supabasePublicUrl.indexOf(marker);
  if (idx === -1) return supabasePublicUrl;
  const storagePath = supabasePublicUrl.slice(idx + marker.length);
  return `${CDN}/${storagePath}`;
}
