import dotenv from "dotenv";
import { getMinimaxClient, MINIMAX_MODEL } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const anthropic = getMinimaxClient();

async function writeEssayAboutLove() {
  console.log("=== Writing Essay About Love ===\n");

  try {
    const response = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: "Write a beautiful, heartfelt essay about love. Make it poetic and emotional. About 500 words."
        }
      ],
    });

    // Find text block
    const textBlock = response.content.find((b: any) => b.type === "text");
    if (!textBlock) {
      console.error("❌ No text block found!");
      return;
    }

    console.log("✅ SUCCESS! Essay:\n");
    console.log("=".repeat(50));
    console.log(textBlock.text);
    console.log("=".repeat(50));
    console.log(`\nTokens used: ${response.usage.output_tokens}`);

  } catch (error: any) {
    console.error("❌ FAILED:", error.message);
  }
}

writeEssayAboutLove();
