import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync, execFileSync } from "child_process";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import "dotenv/config";

const UNIFIED_ROOT = "/Users/minjaekwon1/Projects/Active/voice-system-unified";
const DB_PATH = `${UNIFIED_ROOT}/database/transcriptions.db`;

{
  const db = new Database(DB_PATH);
  db.exec(`CREATE TABLE IF NOT EXISTS reflection_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    started_at DATETIME,
    ended_at DATETIME,
    transcript_json TEXT NOT NULL,
    topics TEXT,
    duration_seconds INTEGER,
    txt_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.close();
}

const app = express();
app.use(express.json());
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
      tools: [
        {
          type: "function",
          name: "save_annotation",
          description: "Save a note, correction, or observation the user wants remembered. Call this when the user says things like 'remember this', 'note that', 'that's wrong', 'actually...', or asks you to keep track of something.",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["noticeable", "correction", "context", "learned", "remember", "comment"],
                description: "Category: 'correction' when fixing something wrong, 'remember' for explicit requests to remember, 'learned' for new info about the user, 'context' for situational background, 'noticeable' for patterns worth tracking, 'comment' for general remarks",
              },
              content: {
                type: "string",
                description: "The annotation content to save",
              },
              section_ref: {
                type: "string",
                description: "Optional reference to the section of the daily context this relates to",
              },
            },
            required: ["type", "content"],
          },
        },
        {
          type: "function",
          name: "search_memory",
          description: "Search across all past voice memo transcripts and analyses. Call this when the user asks about past conversations, patterns, or mentions of a topic.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query — keywords or phrases to find in past recordings",
              },
            },
            required: ["query"],
          },
        },
      ],
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

// --- Write-back tool endpoints ---

const ALLOWED_ANNOTATION_TYPES = ["noticeable", "correction", "context", "learned", "remember", "comment"];

app.post("/api/annotations", (req, res) => {
  try {
    const { type, content, section_ref } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: "type and content are required" });
    }
    if (!ALLOWED_ANNOTATION_TYPES.includes(type)) {
      return res.status(400).json({ error: "invalid annotation type" });
    }

    const db = new Database(DB_PATH);
    db.prepare(
      `INSERT INTO annotations (recording_id, annotation_type, content, section_ref, feed_to_prompt, review_status) VALUES (0, ?, ?, ?, 0, 'pending')`
    ).run(type, content, section_ref || null);
    db.close();

    console.log(`[REFLECT] Saved annotation: [${type}] ${content.substring(0, 80)}`);
    res.json({ ok: true, message: `Noted: ${content.substring(0, 60)}` });
  } catch (e) {
    console.error("[REFLECT] Failed to save annotation:", e.message);
    res.status(500).json({ error: "Failed to save annotation" });
  }
});

app.get("/api/search-memory", (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "query parameter q is required" });
    }

    const result = execFileSync(
      "python3",
      ["scripts/memory_search.py", query],
      { cwd: UNIFIED_ROOT, timeout: 15000, encoding: "utf-8" }
    );
    console.log(`[REFLECT] Memory search for "${query}": ${result.length} chars`);
    res.json({ ok: true, results: result });
  } catch (e) {
    console.error("[REFLECT] Memory search failed:", e.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.post("/api/sessions/save", (req, res) => {
  try {
    const { session_id, started_at, ended_at, transcript } = req.body;
    if (!transcript || !transcript.length) {
      return res.status(400).json({ error: "transcript is required" });
    }

    const sessionId = session_id || crypto.randomUUID();
    const startDate = started_at ? new Date(started_at) : new Date();
    const endDate = ended_at ? new Date(ended_at) : new Date();
    const durationSeconds = Math.round((endDate - startDate) / 1000);

    const allText = transcript
      .filter(t => t.text)
      .map(t => t.text)
      .join(" ");
    const words = allText.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(w => w.length > 3);
    const freq = {};
    const stopWords = new Set(["that", "this", "with", "have", "from", "they", "been", "were", "will", "would", "could", "should", "about", "their", "there", "what", "when", "your", "just", "like", "know", "think", "really", "going", "something", "actually"]);
    for (const w of words) {
      if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    const topics = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w)
      .join(", ");

    const dateLabel = startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const durationMin = Math.round(durationSeconds / 60);
    const lines = [`REFLECTION SESSION — ${dateLabel}`, `Duration: ${durationMin} minute${durationMin !== 1 ? "s" : ""}`, ""];
    for (const turn of transcript) {
      const ts = new Date(turn.ts);
      const timeLabel = ts.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      if (turn.role === "user") {
        lines.push(`[${timeLabel}] You: ${turn.text}`);
      } else if (turn.role === "assistant") {
        lines.push(`[${timeLabel}] AI: ${turn.text}`);
      } else if (turn.role === "tool_call") {
        lines.push(`[${timeLabel}] Tool: ${turn.name}(${turn.args})`);
      }
    }

    const reflectionsDir = path.join(UNIFIED_ROOT, "output", "reflections");
    fs.mkdirSync(reflectionsDir, { recursive: true });
    const fileTs = startDate.toISOString().replace(/[-:]/g, "").replace("T", "_").substring(0, 15);
    const txtFilename = `reflection_${fileTs}.txt`;
    const txtPath = path.join(reflectionsDir, txtFilename);

    const db = new Database(DB_PATH);
    const result = db.prepare(
      `INSERT OR IGNORE INTO reflection_sessions (session_id, started_at, ended_at, transcript_json, topics, duration_seconds, txt_path) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(sessionId, started_at, ended_at, JSON.stringify(transcript), topics, durationSeconds, txtPath);
    db.close();

    if (result.changes > 0) {
      fs.writeFileSync(txtPath, lines.join("\n"), "utf-8");
      console.log(`[REFLECT] Session saved: ${sessionId} (${durationMin}min, ${transcript.length} turns) → ${txtFilename}`);
    } else {
      console.log(`[REFLECT] Duplicate session ${sessionId}, skipped file write`);
    }
    res.json({ ok: true, session_id: sessionId, txt_path: txtPath });
  } catch (e) {
    console.error("[REFLECT] Failed to save session:", e.message);
    res.status(500).json({ error: "Failed to save session" });
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
