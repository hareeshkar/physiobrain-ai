import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from "@anthropic-ai/sdk";

const MINIMAX_MODEL = "MiniMax-M2.7";
const MINIMAX_BASE_URL = "https://api.minimax.io/anthropic";

let anthropicClient: Anthropic | null = null;

function getMinimaxClient() {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "MINIMAX_API_KEY is NOT configured in environment variables.\n" +
      "Steps to fix:\n" +
      "1. Go to Vercel Dashboard > Project Settings > Environment Variables\n" +
      "2. Add 'MINIMAX_API_KEY' with your actual API key value\n" +
      "3. Redeploy the project (git push or manual redeploy)\n" +
      "4. Visit /api/debug to verify it's set"
    );
    console.error("[MINIMAX] Configuration Error:", error.message);
    throw error;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      baseURL: MINIMAX_BASE_URL,
      apiKey,
    });
  }

  return anthropicClient;
}

async function createMinimaxCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 16000,
}: {
  messages: any[];
  temperature?: number;
  max_tokens?: number;
}) {
  const client = getMinimaxClient();
  return client.messages.create({
    model: MINIMAX_MODEL,
    max_tokens,
    messages,
    temperature,
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<any>,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { messages, temperature, max_tokens } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: "Missing or invalid 'messages' field. Expected array." 
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({ 
        error: "Messages array cannot be empty" 
      });
    }

    console.log(`[API] Processing ${messages.length} messages with MiniMax`);

    const completion = await createMinimaxCompletion({
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 16000,
    });

    console.log(`[API] Response received from MiniMax`);
    return res.status(200).json(completion);
    
  } catch (error: any) {
    console.error("[API] Error Details:", {
      message: error?.message,
      status: error?.status,
      type: error?.type,
      code: error?.code,
      stack: error?.stack,
    });

    // Check if it's a configuration issue
    if (error?.message?.includes("MINIMAX_API_KEY")) {
      return res.status(500).json({
        error: "API Configuration Error",
        message: error.message,
        hint: "Visit /api/debug to check environment variables",
      });
    }

    // Check if it's an authentication issue
    if (error?.status === 401 || error?.message?.includes("unauthorized")) {
      return res.status(401).json({
        error: "Authentication Failed",
        message: "MINIMAX_API_KEY is invalid or expired",
        hint: "Check Vercel environment variables and verify the API key is correct",
      });
    }

    // Generic error response
    const statusCode = error?.status || 500;
    const errorMessage = error?.message || "Failed to process request";

    return res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      debug_hint: "Visit /api/debug to check configuration",
    });
  }
}