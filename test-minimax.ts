import dotenv from "dotenv";
import { getMinimaxClient, MINIMAX_MODEL } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const anthropic = getMinimaxClient();

async function test() {
  console.log("=== MiniMax AI Test ===\n");

  try {
    const response = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Create a very simple JSON response with just one field:
{"greeting": "Hello from MiniMax!"}

Return ONLY valid JSON, nothing else.`
        }
      ],
    });

    console.log("Raw response object:");
    console.log(JSON.stringify(response, null, 2));

    console.log("\n\nContent array:");
    if (Array.isArray(response.content)) {
      response.content.forEach((block: any, i: number) => {
        console.log(`Block ${i}: type="${block.type}"`);
        if (block.type === "text") {
          console.log(`Text content: ${block.text}`);
          console.log("Trying to parse...");
          try {
            const parsed = JSON.parse(block.text);
            console.log("✅ Parse SUCCESS:", parsed);
          } catch (e: any) {
            console.log("❌ Parse FAILED:", e.message);
          }
        }
      });
    }

    console.log("\n✅ TEST COMPLETE");
  } catch (error: any) {
    console.error("❌ TEST FAILED:", error.message);
  }
}

test();
