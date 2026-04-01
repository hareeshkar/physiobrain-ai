export function getAIClient(): any {
  return {
    chats: {
      create: ({ config }: any) => {
        // MiniMax expects content as array of blocks: [{type: "text", text: "..."}]
        const history: any[] = [];
        if (config?.systemInstruction) {
          history.push({ role: 'system', content: config.systemInstruction });
        }

        return {
          sendMessage: async ({ message }: { message: string }) => {
            // Convert string content to MiniMax format
            history.push({ role: 'user', content: [{ type: "text", text: message }] });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600000); // 5 minutes for case generation

            try {
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: history,
                  temperature: config?.temperature ?? 0.1,
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} ${errData.error || errData.error?.message || response.statusText}`);
              }

              const data = await response.json();
              // Anthropic/MiniMax format: content array contains blocks with type "text" or "thinking"
              // For multi-turn continuity, append the FULL content blocks to history
              if (data.content) {
                history.push({ role: 'assistant', content: data.content });
              }

              // Find the text block for display
              let text = "";
              if (Array.isArray(data.content)) {
                const textBlock = data.content.find((block: any) => block.type === "text");
                text = textBlock?.text || "";
              } else {
                text = data.content?.text || "";
              }
              return { text };
            } catch (error: any) {
              clearTimeout(timeoutId);
              if (error.name === 'AbortError') {
                throw new Error("Request timed out after 5 minutes. The case generation is taking longer than expected.");
              }
              throw error;
            }
          }
        };
      }
    }
  };
}

export async function generateContent(prompt: string, systemInstruction?: string) {
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  // MiniMax expects content as array of blocks
  messages.push({ role: 'user', content: [{ type: "text", text: prompt }] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 5 minutes for content generation

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errData.error || errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Find text block from content array
    let text = "";
    if (Array.isArray(data.content)) {
      const textBlock = data.content.find((block: any) => block.type === "text");
      text = textBlock?.text || "";
    } else {
      text = data.content?.text || "";
    }
    return text;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out after 5 minutes. Please try again.");
    }
    throw error;
  }
}

export async function generateJson<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  // MiniMax expects content as array of blocks
  messages.push({ role: 'user', content: [{ type: "text", text: prompt + "\n\nIMPORTANT: You must return ONLY valid JSON. Do not include markdown formatting like ```json." }] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 5 minutes for JSON generation

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature: 0.1,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errData.error || errData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Anthropic/MiniMax format: content array contains blocks with type "text" or "thinking"
    // Find the text block (skip thinking blocks)
    let text = "";
    if (Array.isArray(data.content)) {
      const textBlock = data.content.find((block: any) => block.type === "text");
      text = textBlock?.text || "";
    } else {
      text = data.content?.text || data.content || "";
    }

    if (!text) {
      throw new Error("No text content in response");
    }

    // Try to extract JSON if it's wrapped in markdown or has leading/trailing text
    let jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try parsing as-is first
    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      // Continue to extraction logic
    }

    // Try to find and extract JSON object/array
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      // It's an object - try progressively longer substrings until parsing succeeds
      // or we reach the end. This handles nested braces in string values.
      for (let end = jsonStr.length; end > firstBrace; end--) {
        try {
          const candidate = jsonStr.substring(firstBrace, end);
          return JSON.parse(candidate) as T;
        } catch (e) {
          // Keep trying shorter
        }
      }
    } else if (firstBracket !== -1) {
      // It's an array
      for (let end = jsonStr.length; end > firstBracket; end--) {
        try {
          const candidate = jsonStr.substring(firstBracket, end);
          return JSON.parse(candidate) as T;
        } catch (e) {
          // Keep trying
        }
      }
    }

    console.error("Failed to parse JSON response:", text);
    throw new Error("Invalid JSON response from AI");
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out after 5 minutes. Please try again.");
    }
    throw error;
  }
}
