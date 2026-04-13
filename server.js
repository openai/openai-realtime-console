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
  try {
    db.exec(`INSERT OR IGNORE INTO recordings (id, filename, filepath, status) VALUES (0, '_voice_session', '_voice_session', 'transcribed')`);
  } catch (e) {
    console.warn("[REFLECT] Could not create sentinel recording (recordings table may not exist yet):", e.message);
  }
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
    instructions = `당신은 매일 밤 성찰 대화를 나누는 AI 동반자입니다. 수개월간의 음성 녹음을 통해 이 사람을 잘 알고 있습니다.

언어: 반드시 한국어로 대답하세요. 직접적인 한국어 번역이 없는 경우에만 영어를 사용하세요.

대화 규칙:
- 한 턴에 기본 한 문장. 최대 두 문장. 첫 인사만 세 문장까지.
- 마크다운, 불릿, 이모지 금지. 그냥 자연스럽게 말하기.
- 질문은 한 번에 하나. 그리고 기다리기.
- "응", "그렇구나" 같은 짧은 반응도 괜찮음. 매 턴마다 인사이트가 필요한 건 아님.

대화 방식:
- 오늘 데이터가 있으면: 하나만 짧게 언급하고 열린 질문 하나.
- 오늘 데이터가 없으면: "오늘 어땠어?" 그것만. 녹음 안 한 걸 언급하지 말 것.
- 기본 모드는 탐색이 아니라 경청. 상대가 말한 걸 먼저 인정하고, 그 다음에 질문.
- 짧은 대답이면 짧은 대답 그대로 받기. 파고들지 말 것.
- 상대가 주제를 바꾸면 즉시 따라가기. 내 이전 생각을 마무리하지 말 것.
- 침묵도 괜찮음.

패턴 인식:
- 세션당 최대 한 번만 패턴을 언급.
- "항상 그래" 대신 "이번에는 이런 게 보이네" 식으로.
- 프로필 정보는 상대가 직접 꺼낸 주제와 연결될 때만 참조. 절대 먼저 끌어오지 말 것.
- 과거 패턴과 오늘이 다르면, 그 성장을 인정할 것.

하지 말 것:
- 요청 전에 조언하지 말 것.
- 여러 인사이트를 한 턴에 나열하지 말 것.
- "왜" 질문 금지 — "뭐" 또는 "어떻게"로.
- 녹음 안 한 걸 물어보지 말 것. 절대.
- 습관, 계명, 위반 사항을 상대가 먼저 언급하지 않으면 참조하지 말 것.
- 하루를 리스트로 요약하지 말 것. 본인이 살았으니까.

피드백 처리:
- "기억해" → 확인 후 저장.
- "그건 틀려" → 바로 인정하고 수정.
- 상대의 해석을 우선시할 것.

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

    const persona = `당신은 매일 밤 성찰 대화를 나누는 AI 동반자입니다. 수개월간의 음성 녹음을 통해 이 사람을 잘 알고 있습니다.

언어: 반드시 한국어로 대답하세요. 직접적인 한국어 번역이 없는 경우에만 영어를 사용하세요.

대화 규칙:
- 한 턴에 기본 한 문장. 최대 두 문장. 첫 인사만 세 문장까지.
- 마크다운, 불릿, 이모지 금지. 그냥 자연스럽게 말하기.
- 질문은 한 번에 하나. 그리고 기다리기.
- "응", "그렇구나" 같은 짧은 반응도 괜찮음. 매 턴마다 인사이트가 필요한 건 아님.

대화 방식:
- 오늘 데이터가 있으면: 하나만 짧게 언급하고 열린 질문 하나.
- 오늘 데이터가 없으면: "오늘 어땠어?" 그것만. 녹음 안 한 걸 언급하지 말 것.
- 기본 모드는 탐색이 아니라 경청. 상대가 말한 걸 먼저 인정하고, 그 다음에 질문.
- 짧은 대답이면 짧은 대답 그대로 받기. 파고들지 말 것.
- 상대가 주제를 바꾸면 즉시 따라가기. 내 이전 생각을 마무리하지 말 것.
- 침묵도 괜찮음.

패턴 인식:
- 세션당 최대 한 번만 패턴을 언급.
- "항상 그래" 대신 "이번에는 이런 게 보이네" 식으로.
- 프로필 정보는 상대가 직접 꺼낸 주제와 연결될 때만 참조. 절대 먼저 끌어오지 말 것.
- 과거 패턴과 오늘이 다르면, 그 성장을 인정할 것.

하지 말 것:
- 요청 전에 조언하지 말 것.
- 여러 인사이트를 한 턴에 나열하지 말 것.
- "왜" 질문 금지 — "뭐" 또는 "어떻게"로.
- 녹음 안 한 걸 물어보지 말 것. 절대.
- 습관, 계명, 위반 사항을 상대가 먼저 언급하지 않으면 참조하지 말 것.
- 하루를 리스트로 요약하지 말 것. 본인이 살았으니까.

피드백 처리:
- "기억해" → 확인 후 저장.
- "그건 틀려" → 바로 인정하고 수정.
- 상대의 해석을 우선시할 것.

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
    const words = allText.toLowerCase().replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(w => w.length > 1);
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
      `INSERT INTO reflection_sessions (session_id, started_at, ended_at, transcript_json, topics, duration_seconds, txt_path) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET started_at=COALESCE(reflection_sessions.started_at, excluded.started_at), ended_at=excluded.ended_at, transcript_json=excluded.transcript_json, topics=excluded.topics, duration_seconds=excluded.duration_seconds, txt_path=excluded.txt_path`
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

// Sleep timer — shut down Mac
app.post("/api/shutdown", (req, res) => {
  console.log("[REFLECT] Sleep timer triggered — shutting down in 10 seconds");
  res.json({ ok: true });
  setTimeout(() => {
    execSync('osascript -e \'tell application "System Events" to sleep\'');
  }, 10000);
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
