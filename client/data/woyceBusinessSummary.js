import data from "./woyceBusinessData.json";

// Condensed, plain-text digest of woyceBusinessData.json for the Realtime
// session's system instructions. Built from the same JSON (not hand
// duplicated) so the assistant's spoken answers stay grounded in the real
// scraped facts instead of drifting from what the panel actually shows.
function buildSummary() {
  const {
    company,
    contact,
    services,
    process,
    team,
    case_studies: caseStudies,
    testimonials,
    careers,
    partnerships,
    brand,
  } = data;

  const lines = [
    `Company: ${company.legal_name}. "${company.tagline}"`,
    `Founded ${company.founded}. Offices: ${company.locations.map((l) => l.office).join(" and ")}.`,
    `Serves clients in: ${company.serves_clients_in.join(", ")}.`,
    `Pricing: ${company.pricing_model}`,
    `Contact: ${contact.email}, ${contact.phone} (WhatsApp available), replies ${contact.response_commitment}.`,
    `Services: ${services.high_level_areas.join("; ")}.`,
    `Process (${process.total_timeline}): ${process.steps.map((s) => `${s.name} (${s.duration})`).join(" -> ")}.`,
    `Team (${team.members.length} listed): ${team.members.map((m) => `${m.name} - ${m.role}`).join("; ")}.`,
    `Case studies: ${caseStudies.map((c) => `${c.name} [${c.industry}] - ${c.result}`).join("; ")}.`,
    `Testimonials from: ${testimonials.map((t) => `${t.name} (${t.title})`).join(", ")}.`,
    `Open roles: ${careers.open_positions.map((p) => `${p.title} (${p.location})`).join(", ")}.`,
    `Partnership tracks: ${partnerships.models.map((p) => `${p.type} - ${p.for}`).join("; ")}.`,
    `Brand colors: ${brand.colors.map((c) => `${c.name} ${c.hex}`).join(", ")}.`,
  ];

  return lines.join("\n");
}

export const businessSummary = buildSummary();
export default data;
