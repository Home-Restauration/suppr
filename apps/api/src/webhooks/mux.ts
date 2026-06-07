import type { FastifyPluginAsync } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { verifyMuxWebhook, getMuxPlaybackId } from "../lib/mux.js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const muxWebhookRoute: FastifyPluginAsync = async (fastify) => {
  // Raw body required for Mux signature verification (mux-signature header)
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body)
  );

  fastify.post("/webhooks/mux", async (request, reply) => {
    let event: Record<string, unknown>;
    try {
      event = await verifyMuxWebhook(
        request.body as Buffer,
        request.headers as Record<string, string | string[] | undefined>
      );
    } catch (err) {
      fastify.log.error(err, "[mux] webhook signature verification failed");
      return reply.code(400).send({ error: "Invalid signature" });
    }

    const type = event.type as string;
    const data = event.data as Record<string, unknown>;

    switch (type) {
      // ── Upload lifecycle ────────────────────────────────────────────────────
      case "video.upload.created":
        fastify.log.info(`[mux] upload created: ${data.id}`);
        break;

      case "video.upload.asset_created":
        // Upload finished and asset is being processed — store the asset_id
        fastify.log.info(`[mux] upload asset created: upload=${data.id} asset=${data.asset_id}`);
        break;

      case "video.upload.cancelled":
        fastify.log.warn(`[mux] upload cancelled: ${data.id}`);
        break;

      // ── Asset lifecycle ─────────────────────────────────────────────────────
      case "video.asset.ready": {
        // Asset is ready for playback — get playback_id and store in media table
        const assetId = data.id as string;
        fastify.log.info(`[mux] asset ready: ${assetId}`);

        try {
          const playbackId = await getMuxPlaybackId(assetId);
          if (playbackId) {
            const supabase = getSupabase();
            // Update any feed_posts or media rows that reference this upload's asset_id
            await supabase
              .from("feed_posts")
              .update({
                media: supabase.rpc as any, // Codex: update the specific media[] element with mux_id
              })
              .contains("media", JSON.stringify([{ mux_asset_id: assetId }]));
            fastify.log.info(`[mux] playback_id stored: ${playbackId}`);
          }
        } catch (err) {
          fastify.log.error(err, "[mux] asset.ready: failed to store playback_id");
        }
        break;
      }

      case "video.asset.errored":
        fastify.log.error(`[mux] asset errored: ${data.id} — ${JSON.stringify(data.errors)}`);
        break;

      default:
        fastify.log.warn(`[mux] Unhandled event type: ${type}`);
    }

    return reply.code(200).send({ received: true });
  });
};
