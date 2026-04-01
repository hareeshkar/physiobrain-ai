import dotenv from "dotenv";
import { getMinimaxClient, MINIMAX_MODEL } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const anthropic = getMinimaxClient();

async function testExamJSON() {
  console.log("=== Testing Exam JSON Generation ===\n");

  try {
    const response = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Create a simple exam JSON with this exact structure:
{
  "caseStudy": "A short case study about a 45 year old with back pain",
  "questions": [
    {"id": "q1", "text": "What is the diagnosis?", "marks": 20, "expectedAnswer": "Lumbar strain"}
  ]
}

Return ONLY valid JSON, nothing else. No markdown formatting.`
        }
      ],
    });

    // Find text block
    const textBlock = response.content.find((b: any) => b.type === "text");
    if (!textBlock) {
      console.error("❌ No text block found!");
      return;
    }

    console.log("Text block content (first 500 chars):");
    console.log(textBlock.text.substring(0, 500));
    console.log("\n...");

    // Extract JSON
    const text = textBlock.text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    console.log(`\nFirst brace at: ${firstBrace}`);
    console.log(`Last brace at: ${lastBrace}`);

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("❌ No JSON braces found!");
      return;
    }

    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    console.log(`\nExtracted JSON length: ${jsonStr.length} chars`);

    console.log("\nTrying to parse...");
    try {
      const parsed = JSON.parse(jsonStr);
      console.log("✅ Parse SUCCESS!");
      console.log("Parsed object:", JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      console.error("❌ Parse FAILED:", e.message);
      console.log("\nJSON string around error:");
      const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || "0");
      const start = Math.max(0, errorPos - 50);
      const end = Math.min(jsonStr.length, errorPos + 50);
      console.log(jsonStr.substring(start, end));
      console.log("                    ^ error here");
    }

  } catch (error: any) {
    console.error("❌ Request FAILED:", error.message);
  }
}

testExamJSON();
