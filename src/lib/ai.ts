export function getAIClient(): any {
  return {
    chats: {
      create: ({ config }: any) => {
        const history: any[] = [];
        if (config?.systemInstruction) {
          history.push({ role: 'system', content: config.systemInstruction });
        }
        
        return {
          sendMessage: async ({ message }: { message: string }) => {
            history.push({ role: 'user', content: message });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for case generation

            try {
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: history,
                  temperature: config?.temperature ?? 0.7,
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} ${errData.error || response.statusText}`);
              }

              const data = await response.json();
              const text = data.choices[0].message.content;
              history.push({ role: 'assistant', content: text });
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
  messages.push({ role: 'user', content: prompt });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for content generation

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
      throw new Error(`API Error: ${response.status} ${errData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
  messages.push({ role: 'user', content: prompt + "\n\nIMPORTANT: You must return ONLY valid JSON. Do not include markdown formatting like ```json." });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for JSON generation

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errData.error || response.statusText}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content || "{}";

    // Try to extract JSON if it's wrapped in markdown or has leading/trailing text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let jsonStr = text;
    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      jsonStr = text.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      jsonStr = text.substring(firstBracket, lastBracket + 1);
    } else {
      // Fallback to regex stripping
      jsonStr = text.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '').trim();
    }

    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("Invalid JSON response from AI");
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out after 5 minutes. Please try again.");
    }
    throw error;
  }
}
