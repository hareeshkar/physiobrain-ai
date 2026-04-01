import dotenv from "dotenv";
import { getMinimaxClient, MINIMAX_MODEL } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const anthropic = getMinimaxClient();

async function testAI() {
  console.log("Testing MiniMax AI connection...\n");

  try {
    const response = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: "Say 'Hello! AI is working!' in exactly those words."
        }
      ],
    });

    console.log("Response received:");
    console.log("Status:", response.stop_reason);
    console.log("Content blocks:", response.content.length);

    // Find the text block
    const textBlock = response.content.find((block: any) => block.type === "text") as any;
    console.log("\nAI Response:", textBlock?.text || "No text found");

    console.log("\n✅ AI Connection TEST PASSED!");
  } catch (error: any) {
    console.error("\n❌ AI Connection TEST FAILED!");
    console.error("Error:", error.message);
    console.error("Status:", error.status);
  }
}

testAI();
