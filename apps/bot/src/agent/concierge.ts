import OpenAI from "openai";
import { createApiClient } from "@suppr/contracts/client";

// Concierge runs on Azure AI Foundry (Llama 4 Maverick) — fast conversational tier.
// The openai SDK works against Foundry with the /models path + api-version + api-key header.
const llm = new OpenAI({
  apiKey: process.env.AZURE_API_KEY,
  baseURL: `${process.env.AZURE_ENDPOINT}/models`,
  defaultQuery: { "api-version": "2024-05-01-preview" },
  defaultHeaders: { "api-key": process.env.AZURE_API_KEY },
});

const MODEL = process.env.BOT_MODEL!;

const SYSTEM_PROMPT = `You are the Suppr concierge — a warm, discreet host for a curated marketplace of private culinary experiences. You help guests discover chefs cooking near them and book a seat, end to end, in this chat.

Rules:
- Never invent availability, prices, fees, or policies. Always call a tool to get them.
- Before taking payment, confirm: which event, party size, name, and per-guest dietary info (Big 9 allergens + Other + restrictions). Collect dietary every booking — never skip.
- Show the full line-item total (seat, required gratuity, optional tip, booking fee, tax) before sending the payment link.
- Never reveal an exact address before the event release rule allows it; tell the guest when the address will arrive.
- For cancellations/changes: call modify_booking and follow exactly what policy returns — never promise refunds the policy does not allow.
- If anything is outside policy, unclear, or sensitive: call escalate. Be brief, warm, and human.`;

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  { type: "function", function: { name: "search_events", description: "Find culinary events near a location", parameters: { type: "object", properties: { near: { type: "string" }, date: { type: "string" }, type: { type: "string" }, cuisine: { type: "string" } }, required: [] } } },
  { type: "function", function: { name: "get_event", description: "Get full event details", parameters: { type: "object", properties: { event_id: { type: "string" } }, required: ["event_id"] } } },
  { type: "function", function: { name: "hold_seats", description: "Hold seats for a booking", parameters: { type: "object", properties: { event_id: { type: "string" }, ticket_type_id: { type: "string" }, qty: { type: "number" } }, required: ["event_id","ticket_type_id","qty"] } } },
  { type: "function", function: { name: "quote", description: "Get line-item price quote", parameters: { type: "object", properties: { event_id: { type: "string" }, ticket_type_id: { type: "string" }, qty: { type: "number" }, extra_tip_cents: { type: "number" } }, required: ["event_id","ticket_type_id","qty"] } } },
  { type: "function", function: { name: "create_booking", description: "Create a booking and return payment link", parameters: { type: "object", properties: { hold_id: { type: "string" }, buyer_name: { type: "string" }, buyer_phone: { type: "string" }, guests: { type: "array" }, channel: { type: "string" } }, required: ["hold_id","buyer_name","guests"] } } },
  { type: "function", function: { name: "modify_booking", description: "Cancel, reschedule, transfer, or name-change a booking within policy", parameters: { type: "object", properties: { booking_id: { type: "string" }, action: { type: "string", enum: ["cancel","reschedule","transfer","name_change"] } }, required: ["booking_id","action"] } } },
  { type: "function", function: { name: "escalate", description: "Escalate to human support", parameters: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } } },
];

export type ConversationMessage = OpenAI.Chat.ChatCompletionMessageParam;

export async function runConcierge(
  messages: ConversationMessage[],
  apiToken: string
): Promise<{ reply: string; updatedMessages: ConversationMessage[] }> {
  const api = createApiClient({ baseUrl: process.env.API_URL!, serviceToken: process.env.SERVICE_TOKEN });
  const history: ConversationMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

  let response = await llm.chat.completions.create({ model: MODEL, messages: history, tools, tool_choice: "auto" });
  let msg = response.choices[0]?.message;

  // Agentic loop — keep calling tools until text reply
  while (msg?.tool_calls?.length) {
    history.push(msg);
    const toolResults: ConversationMessage[] = [];

    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      let result: unknown;
      try {
        switch (tc.function.name) {
          case "search_events": result = await api.events.list(args); break;
          case "get_event": result = await api.events.get(args.event_id); break;
          case "hold_seats": result = await api.bookings.hold(args); break;
          case "quote": result = await api.bookings.quote(args); break;
          case "create_booking": result = await api.bookings.create(args); break;
          case "modify_booking": result = await api.bookings.modify(args.booking_id, args); break;
          case "escalate": result = { escalated: true, reason: args.reason }; break;
          default: result = { error: "unknown tool" };
        }
      } catch (e: any) { result = { error: e.message }; }
      toolResults.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
    }

    history.push(...toolResults);
    response = await llm.chat.completions.create({ model: MODEL, messages: history, tools, tool_choice: "auto" });
    msg = response.choices[0]?.message;
  }

  const reply = msg?.content ?? "Sorry, I couldn't process that. Please try again.";
  history.push({ role: "assistant", content: reply });
  return { reply, updatedMessages: history.slice(1) }; // remove system prompt from client state
}
