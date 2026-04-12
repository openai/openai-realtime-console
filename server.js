import express from "express";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
app.use(express.text());
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;
const azureKey = process.env.AZURE_OPENAI_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const useAzure = true;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

function getSessionConfig() {
  let instructions = "You are a helpful voice assistant.";
  try {
    const context = execSync(
      'cd /Users/minjaekwon1/Projects/Active/voice-system-unified && python3 -c "import sys; sys.path.insert(0, \'scripts\'); from daily_context import gather, format_for_prompt; print(format_for_prompt(gather()))"',
      { timeout: 15000, encoding: "utf-8" }
    );
    instructions = `You are a personal AI companion having a nightly voice reflection conversation. You deeply know this person's behavioral patterns from months of voice recordings. Be direct, conversational, and short — you are SPEAKING, not writing. One idea per response, max 3 sentences. Surface patterns they can't see. Connect today to the past. Ask ONE question at a time. Never use markdown or formatting — just speak naturally. Start the conversation by briefly noting what you know about their day and asking one question.

${context}`;
    console.log("[REFLECT] Loaded reflection context:", instructions.length, "chars");
  } catch (e) {
    console.error("[REFLECT] Failed to load context:", e.message);
  }

  const model = useAzure ? azureDeployment : "gpt-4o-realtime-preview";
  return JSON.stringify({
    session: {
      type: "realtime",
      model: model,
      instructions: instructions,
    },
  });
}

// Regenerate config per request so context is always fresh
let sessionConfig = getSessionConfig();
console.log("[REFLECT] Initial session config loaded. Instructions length:", JSON.parse(sessionConfig).session.instructions?.length || 0);

// All-in-one SDP request (experimental)
app.post("/session", async (req, res) => {
  const fd = new FormData();
  console.log(req.body);
  fd.set("sdp", req.body);
  fd.set("session", sessionConfig);

  const r = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      "OpenAI-Beta": "realtime=v1",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: fd,
  });
  const sdp = await r.text();
  console.log(sdp);

  // Send back the SDP we received from the OpenAI REST API
  res.send(sdp);
});

// API route for ephemeral token generation
app.get("/token", async (req, res) => {
  try {
    // Regenerate config fresh each request
    sessionConfig = getSessionConfig();
    let response;
    if (useAzure) {
      const url = `${azureEndpoint.replace('cognitiveservices', 'openai')}/openai/v1/realtime/client_secrets`;
      console.log("[REFLECT] Azure token URL:", url);
      response = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": azureKey,
          "Content-Type": "application/json",
        },
        body: sessionConfig,
      });
    } else {
      response = await fetch(
        "https://api.openai.com/v1/realtime/client_secrets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: sessionConfig,
        },
      );
    }

    console.log("[REFLECT] Token response status:", response.status);
    const data = await response.json();
    if (!response.ok) {
      console.error("[REFLECT] Token error:", JSON.stringify(data).substring(0, 500));
    }
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Serve client config (Azure vs OpenAI)
app.get("/config", (req, res) => {
  if (useAzure) {
    res.json({
      baseUrl: `${azureEndpoint.replace('cognitiveservices', 'openai')}/openai/v1/realtime/calls`,
      model: azureDeployment,
      useAzure: true,
    });
  } else {
    res.json({
      baseUrl: "https://api.openai.com/v1/realtime/calls",
      model: "gpt-4o-realtime-preview",
      useAzure: false,
    });
  }
});

// Serve daily reflection context
app.get("/reflection-context", async (req, res) => {
  try {
    const { execSync } = await import("child_process");
    const context = execSync(
      'cd /Users/minjaekwon1/Projects/Active/voice-system-unified && python3 -c "import sys; sys.path.insert(0, \'scripts\'); from daily_context import gather, format_for_prompt; print(format_for_prompt(gather()))"',
      { timeout: 15000, encoding: "utf-8" }
    );

    const persona = `You are a personal AI companion having a nightly voice reflection conversation. You deeply know this person's behavioral patterns from months of voice recordings. Be direct, conversational, and short — you are SPEAKING, not writing. One idea per response. Surface patterns they can't see. Connect today to the past. When they correct you, acknowledge it. When they say "remember this", confirm you'll note it.

IMPORTANT: You are having a VOICE conversation. Keep responses under 3 sentences. Ask ONE question at a time. Never use markdown, bullets, or formatting — just speak naturally.

${context}`;

    res.json({ instructions: persona });
  } catch (e) {
    console.error("Failed to load reflection context:", e.message);
    res.json({ instructions: "You are a helpful voice assistant for daily reflection. Ask the user about their day." });
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
