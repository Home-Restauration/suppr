import OpenAI from "openai";

let _azure: OpenAI | null = null;
let _nebius: OpenAI | null = null;

/** Azure AI Foundry client (Llama-4-Maverick) — primary, fast responses. */
export function getAzureClient(): OpenAI {
  return (_azure ??= new OpenAI({
    baseURL: `${process.env.AZURE_ENDPOINT}/models`,
    apiKey: process.env.AZURE_API_KEY!,
    defaultHeaders: { "api-key": process.env.AZURE_API_KEY! },
    defaultQuery: { "api-version": "2024-05-01-preview" },
  }));
}

/** Nebius client (DeepSeek-V3.2) — reasoning/structured generation. */
export function getNebiusClient(): OpenAI {
  return (_nebius ??= new OpenAI({
    baseURL: process.env.NEBIUS_API_URL!,
    apiKey: process.env.NEBIUS_API_KEY!,
  }));
}

export const AZURE_MODEL = process.env.BOT_MODEL ?? "Llama-4-Maverick-17B-128E-Instruct-FP8";
export const NEBIUS_MODEL = "deepseek-ai/DeepSeek-V3.2";
