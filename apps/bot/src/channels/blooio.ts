import crypto from "crypto";

export interface BlooioInboundEvent {
  event: string;
  message_id: string;
  sender: string;
  text: string;
  attachments: string[];
  protocol: "imessage" | "sms" | "rcs" | "non-imessage";
  timestamp: number;
  is_group: boolean;
  external_id?: string;
  group_id?: string;
  group_name?: string;
}

// HMAC-SHA256 over raw body; key is hex-decoded suffix of the whsec_ secret.
export function verifyBlooioSignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.BLOOIO_WEBHOOK_SECRET ?? "";
  const hexKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = Buffer.from(hexKey, "hex");
  const computed = crypto.createHmac("sha256", key).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Send an iMessage/SMS via Blooio.
export async function sendBlooioMessage(to: string, text: string): Promise<void> {
  const base = process.env.BLOOIO_BASE_URL!;
  const key = process.env.BLOOIO_API_KEY!;
  const url = `${base}/chats/${encodeURIComponent(to)}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Blooio send failed ${res.status}: ${detail}`);
  }
}
