import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createMinimaxCompletion } from "./src/lib/minimax";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Increase payload limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Simple API route - no retry logic
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, temperature, max_tokens } = req.body;

      const completion = await createMinimaxCompletion({
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 16000,
      });

      res.json(completion);
    } catch (error: any) {
      console.error("MiniMax API Error:", error.message);
      res.status(500).json({ error: error.message || "Failed" });
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
    const distPath = path.join(__dirname, 'dist');
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
