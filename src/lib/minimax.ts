import Anthropic from "@anthropic-ai/sdk";

export const MINIMAX_MODEL = "MiniMax-M2.7";
const MINIMAX_BASE_URL = "https://api.minimax.io/anthropic";

let anthropicClient: Anthropic | null = null;

export function getMinimaxClient() {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not set");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      baseURL: MINIMAX_BASE_URL,
      apiKey,
    });
  }

  return anthropicClient;
}

export async function createMinimaxCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 16000,
}: {
  messages: any[];
  temperature?: number;
  max_tokens?: number;
}) {
  return getMinimaxClient().messages.create({
    model: MINIMAX_MODEL,
    max_tokens,
    messages,
    temperature,
  });
}