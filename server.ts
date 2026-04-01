import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import OpenAI from "openai";

const OPENROUTER_API_KEY = "process.env.OPENROUTER_API_KEY";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://physiobrain.app",
    "X-OpenRouter-Title": "PhysioBrain",
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to support very long prompts and context windows
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route to proxy OpenRouter requests using the official SDK
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, temperature } = req.body;

      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages,
        temperature: temperature ?? 0.7,
      });

      res.json(completion);
    } catch (error: any) {
      console.error("OpenAI SDK Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from OpenRouter" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
