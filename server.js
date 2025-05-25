import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-realtime-preview-2024-12-17";

// プロンプトファイルを読み込む関数
function loadSystemPrompts() {
  try {
    console.log(`プロンプトファイルを読み込み中: ./prompts.json`);
    const promptsData = fs.readFileSync('./prompts.json', 'utf-8');
    return JSON.parse(promptsData);
  } catch (error) {
    console.error('プロンプトファイルの読み込みに失敗しました:', error);
    return {
      default: "あなたは親切で丁寧なAIアシスタントです。ユーザーの質問に対して分かりやすく回答してください。"
    };
  }
}

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const prompts = loadSystemPrompts();
    const promptType = req.query.prompt || 'default';
    const instructions = prompts[promptType] || prompts.default; 

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          voice: "verse",
          instructions: instructions,
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
