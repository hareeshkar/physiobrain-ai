import { createMinimaxCompletion } from "../src/lib/minimax";

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            Allow: "POST",
          },
        },
      );
    }

    try {
      const { messages, temperature, max_tokens } = await request.json();

      const completion = await createMinimaxCompletion({
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 16000,
      });

      return Response.json(completion);
    } catch (error: any) {
      console.error("MiniMax API Error:", error?.message || error);
      return Response.json(
        { error: error?.message || "Failed" },
        { status: 500 },
      );
    }
  },
};