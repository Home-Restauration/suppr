import Mux from "@mux/mux-node";

let _mux: Mux | null = null;
function getMux() {
  return (_mux ??= new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
  }));
}

export interface MuxUploadResult {
  uploadId: string;
  uploadUrl: string;
}

/** Create a direct upload URL. Client uploads the video file directly to this URL. */
export async function createMuxUpload(
  corsOrigin: string = process.env.APP_URL ?? "*"
): Promise<MuxUploadResult> {
  const upload = await getMux().video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["public"],
      mp4_support: "capped-1080p",
    },
  });
  return { uploadId: upload.id, uploadUrl: upload.url ?? "" };
}

/** Get the public playback ID for an asset (first public policy entry). */
export async function getMuxPlaybackId(assetId: string): Promise<string | null> {
  const asset = await getMux().video.assets.retrieve(assetId);
  const policy = asset.playback_ids?.find((p) => p.policy === "public");
  return policy?.id ?? null;
}

/** Verify a Mux webhook signature and return the parsed event, or throw on invalid sig. */
export async function verifyMuxWebhook(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>
): Promise<ReturnType<typeof JSON.parse>> {
  const secret = process.env.MUX_WEBHOOK_SECRET!;
  return getMux().webhooks.unwrap(rawBody.toString("utf8"), headers as any, secret);
}
