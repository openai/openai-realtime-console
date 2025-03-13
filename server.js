import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import pkg from 'twilio';
const { twiml: Twiml } = pkg;
import { WebSocketServer } from 'ws';


const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

app.post('/twilio/voice', express.urlencoded({ extended: false }), (req, res) => {
  const voiceResponse = new Twiml.VoiceResponse();

  // Hier nutzen wir Twilio Media Streams, um den Audio-Stream an Deinen Server weiterzuleiten
  // Die URL muss auf einen WebSocket-Endpunkt zeigen, den Du einrichten musst
  voiceResponse.start().stream({
    url: 'wss://dein-server.de/twilio/audio-stream'
  });

  // Optional: Weiterleitung oder weitere TwiML-Verben, z.B. <Say>, <Dial>, etc.
  res.type('text/xml');
  res.send(voiceResponse.toString());
});


const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('Twilio Audio Stream verbunden.');

  ws.on('message', (message) => {
    // Hier verarbeitest Du die Audio-Daten von Twilio
    // und leitest sie an Deine WebRTC-Session weiter
    console.log('Audio-Daten empfangen:', message);
  });

  ws.on('close', () => {
    console.log('Twilio Audio Stream getrennt.');
  });
});

// API route for token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "shimmer",
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
