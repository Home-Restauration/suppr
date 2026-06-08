import { getNebiusClient, NEBIUS_MODEL } from "../lib/llm.js";
import type { ProfileImportRequest, ProfileImportResponse } from "@suppr/contracts/schemas";

/**
 * Generate a draft ChefProfile from chef-supplied text using Nebius DeepSeek-V3.2.
 *
 * The chef reviews and confirms the output before it is persisted. Nothing is
 * written to the database here — the caller (POST /chef/onboard/profile-import)
 * returns the draft for review.
 *
 * TODO (Instagram OAuth path):
 *   When the chef connects their Instagram Business/Creator account, call this
 *   same function with bio/caption text extracted from the Graph API response.
 *   Wire as: GET /chef/onboard/instagram/callback → fetch IG Graph API → call
 *   generateChefProfile(). The LLM layer is identical; only the content source
 *   differs. Ref: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api
 */
export async function generateChefProfile(
  input: ProfileImportRequest
): Promise<ProfileImportResponse> {
  const llm = getNebiusClient();

  const dishList = input.dishes
    .map((d) => `- ${d.name}${d.description ? `: ${d.description}` : ""}`)
    .join("\n");

  const prompt = `You are a culinary brand strategist. Based on the chef's self-description below,
generate a structured draft profile for their page on a premium dining platform.

Bio:
${input.bio_text}

Cuisine style:
${input.cuisine_description}

Signature dishes:
${dishList}

${input.past_venues?.length ? `Past venues: ${input.past_venues.join(", ")}` : ""}
${input.years_experience != null ? `Years of experience: ${input.years_experience}` : ""}
${input.awards?.length ? `Awards: ${input.awards.join(", ")}` : ""}
${input.press_mentions?.length ? `Press mentions (raw): ${input.press_mentions.join("; ")}` : ""}

Return a single valid JSON object with exactly these keys:
{
  "brand_name": "string — chef's display name for the platform (≤40 chars)",
  "bio": "string — polished 2–3 sentence platform bio",
  "cuisines": ["string array of 2–4 cuisine tags, e.g. 'Omakase', 'Japanese', 'Seasonal'"],
  "professional": {
    "years_experience": number or null,
    "background": "string — training + career narrative, 2–4 sentences",
    "past_venues": ["array of venue names"],
    "certifications": ["array or empty"],
    "awards": ["array of award strings or empty"],
    "press": [{ "publication": "str", "headline": "str", "url": null, "year": null }],
    "cookbooks": []
  },
  "sample_posts": [
    { "caption": "string — 1–2 sentence Instagram-style caption for a future post" },
    { "caption": "..." },
    { "caption": "..." }
  ],
  "confidence": 0.0–1.0
}

Return ONLY the JSON object. No markdown, no commentary.`;

  const completion = await llm.chat.completions.create({
    model: NEBIUS_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message.content?.trim() ?? "";

  // Strip any accidental markdown fences
  const json = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();

  let parsed: ProfileImportResponse;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`LLM returned non-JSON: ${raw.slice(0, 200)}`);
  }

  // Ensure required fields are present
  if (!parsed.brand_name || !parsed.bio || !parsed.cuisines) {
    throw new Error("LLM draft missing required fields");
  }

  return {
    brand_name: parsed.brand_name,
    bio: parsed.bio,
    cuisines: parsed.cuisines ?? [],
    professional: parsed.professional ?? {},
    sample_posts: parsed.sample_posts ?? [],
    confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7,
  };
}
