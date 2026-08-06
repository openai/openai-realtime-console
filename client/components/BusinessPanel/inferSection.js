// Fallback for when the model answers a company question but forgets to
// call display_business_info (LLM tool-calling isn't 100% reliable turn to
// turn even with strong instructions). Scans the AI's own spoken transcript
// - which we already receive via response.output_audio_transcript.delta -
// for section keywords, so the panel still syncs with what was actually
// said instead of staying stuck on a stale section.
// Each keyword carries a weight. Distinctive words that basically only
// show up when that section is genuinely being discussed (e.g.
// "testimonial") are weighted heavily; generic words that can leak in
// from unrelated context (e.g. a client's job title mentioning
// "Engineering" inside a testimonial quote) are weighted low, so they
// can't outweigh a real, specific signal for a different section.
const SECTION_KEYWORDS = {
  team: [
    ["team", 2],
    ["staff", 2],
    ["employee", 2],
    ["team member", 3],
    ["developer", 1],
    ["designer", 1],
  ],
  case_studies: [
    ["case stud", 3],
    ["shipped", 2],
    ["built for", 2],
    ["delivered for", 2],
    ["project", 1],
  ],
  testimonials: [
    ["testimonial", 3],
    ["client said", 3],
    ["feedback", 2],
    ["praise", 2],
    ["review", 1],
  ],
  careers: [
    ["career", 2],
    ["hiring", 3],
    ["job opening", 3],
    ["open position", 3],
    ["recruit", 2],
  ],
  partnerships: [
    ["partnership", 3],
    ["referral", 2],
    ["agency partner", 3],
    ["collaborat", 1],
  ],
  brand: [
    ["brand", 2],
    ["logo", 3],
    ["typography", 3],
    ["color palette", 3],
    ["font", 1],
  ],
  contact: [
    ["contact", 2],
    ["email", 2],
    ["phone", 2],
    ["reach us", 3],
    ["get in touch", 3],
    ["our office", 2],
  ],
  process: [
    ["our process", 3],
    ["methodology", 3],
    ["design phase", 2],
    ["how we work", 3],
    ["sprint", 2],
    ["timeline", 1],
  ],
  services: [
    ["service", 2],
    ["we offer", 2],
    ["we build", 1],
    ["capabilit", 1],
  ],
  overview: [
    ["founded", 3],
    ["about the company", 3],
    ["who we are", 3],
    ["our studio", 2],
    ["milestone", 2],
  ],
};

export function inferSectionFromText(text) {
  const lower = (text || "").toLowerCase();
  if (!lower.trim()) return null;

  let bestSection = null;
  let bestScore = 0;
  let tiedWithBest = false;

  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    const score = keywords.reduce((sum, [kw, weight]) => (lower.includes(kw) ? sum + weight : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSection = section;
      tiedWithBest = false;
    } else if (score === bestScore && score > 0) {
      tiedWithBest = true;
    }
  }

  // Two sections scored equally - better to leave the panel as-is than
  // confidently show the wrong one.
  if (tiedWithBest) return null;

  return bestSection;
}
