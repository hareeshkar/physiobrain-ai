import dotenv from "dotenv";
import { getMinimaxClient, MINIMAX_MODEL } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const anthropic = getMinimaxClient();

async function testExamPrompt() {
  console.log("=== Testing Exam Prompt (Same as Frontend) ===\n");

  const messages = [
    { role: 'system', content: 'You are an expert physiotherapy professor writing an exam.' },
    { role: 'user', content: `You are an expert Physiotherapy Professor creating a comprehensive written examination.

PARAMETERS:
- Module/Specialty: Musculoskeletal (Spine)
- Patient Age Group: Middle-Aged (36-64 years)
- Condition Severity: Sub-acute / Moderate Irritability
- Case Complexity: Standard (Single Pathology)
- Question Focus: Comprehensive Exam (Mixed)
- Terminology Level: Intermediate
- Scoring Parameters: Standard (5 questions, 20 marks each)

TASK:
Create a detailed, realistic clinical case study and dynamically generate exam questions.

REQUIREMENTS:
1. "caseStudy": Write a rich, multi-paragraph clinical case study with patient demographics, mechanism of injury, subjective history, objective examination findings.
2. "questions": Dynamically generate 5 questions. The total marks across ALL questions MUST sum to exactly 100.
3. "expectedAnswer": Provide a rubric for each question.

Return ONLY a JSON object matching EXACTLY this structure:
{
  "caseStudy": "string (markdown formatted)",
  "questions": [
    {
      "id": "string",
      "text": "string",
      "marks": number,
      "expectedAnswer": "string"
    }
  ]
}` }
  ];

  try {
    console.log("Sending request...");
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 16000,
      messages,
      temperature: 0.2,
    });

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`Response received in ${elapsed.toFixed(1)}s`);

    // Find text block
    const textBlock = response.content.find((b: any) => b.type === "text");
    if (!textBlock) {
      console.error("❌ No text block found!");
      return;
    }

    console.log(`\nThinking block: ${response.content[0].thinking?.length || 0} chars`);
    console.log(`Text block: ${textBlock.text.length} chars`);

    // Try to parse JSON
    const text = textBlock.text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(jsonStr);
      console.log("\n✅ JSON Parse SUCCESS!");
      console.log("Case study length:", parsed.caseStudy?.length || 0);
      console.log("Questions count:", parsed.questions?.length || 0);
      console.log("Total marks:", parsed.questions?.reduce((s: number, q: any) => s + (q.marks || 0), 0) || 0);
    } catch (e: any) {
      console.error("\n❌ JSON Parse FAILED:", e.message);
      console.log("Text preview:", textBlock.text.substring(0, 300));
    }

  } catch (error: any) {
    console.error("❌ REQUEST FAILED:", error.message);
    console.error("Status:", error.status);
  }
}

testExamPrompt();
