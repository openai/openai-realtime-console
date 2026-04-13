const HANGUL_RE = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
const GPS_COORD_RE = /\-?\d+\.\d{3,}[^.\d]{0,50}\-?\d+\.\d{3,}/;
const GPS_KEYWORD_RE = /GPS|위도|경도/;
const MAX_WORDS = 40;
const MIN_DURATION_S = 60;
const MAX_DURATION_S = 45 * 60;

export function reviewSession(transcript, { durationSeconds, topics, sessionId }) {
  const checks = [];
  const assistantTurns = transcript.filter(t => t.role === "assistant" && t.text);
  const userTurns = transcript.filter(t => t.role === "user");

  const firstAssistant = assistantTurns[0];
  const koreanStart = firstAssistant && HANGUL_RE.test(firstAssistant.text.charAt(0));
  checks.push({
    name: "korean_start",
    pass: koreanStart === true,
    detail: koreanStart ? "First turn starts in Korean" : firstAssistant ? "AI started in English" : "No assistant turns found",
  });

  const gpsLeaks = assistantTurns.filter(t => GPS_COORD_RE.test(t.text) || GPS_KEYWORD_RE.test(t.text));
  checks.push({
    name: "gps_leak",
    pass: gpsLeaks.length === 0,
    detail: gpsLeaks.length === 0 ? "No GPS leaks" : `GPS data found in ${gpsLeaks.length} turn(s)`,
  });

  const verboseTurns = assistantTurns.filter(t => {
    const isKorean = /[\uAC00-\uD7A3]/.test(t.text);
    return isKorean ? t.text.length > 150 : t.text.split(/\s+/).length > MAX_WORDS;
  });
  checks.push({
    name: "verbosity",
    pass: verboseTurns.length === 0,
    detail: verboseTurns.length === 0 ? "All turns concise" : `${verboseTurns.length} turn(s) exceeded ${MAX_WORDS} words`,
  });

  const userCount = userTurns.length;
  checks.push({
    name: "user_speech",
    pass: userCount > 0,
    detail: userCount === 0 ? "0 user turns (known Azure STT limitation)" : `${userCount} user turn(s)`,
  });

  const durationOk = durationSeconds >= MIN_DURATION_S && durationSeconds <= MAX_DURATION_S;
  checks.push({
    name: "duration",
    pass: durationOk,
    detail: durationOk
      ? `${Math.round(durationSeconds / 60)}min — normal`
      : durationSeconds < MIN_DURATION_S ? `${durationSeconds}s — too short` : `${Math.round(durationSeconds / 60)}min — too long`,
  });

  const topicList = (topics || "").split(",").map(t => t.trim()).filter(Boolean);
  const trivialTopics = topicList.length <= 1;
  checks.push({
    name: "topics",
    pass: !trivialTopics,
    detail: trivialTopics ? `Only ${topicList.length} topic(s) detected` : `${topicList.length} topics: ${topics}`,
  });

  const issues = checks.filter(c => !c.pass).map(c => c.detail);
  return { checks, issues, sessionId };
}
