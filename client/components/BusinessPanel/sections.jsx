import { Award, Briefcase, Compass, Feather, Layers, Mail, MessageSquare, TrendingUp, Users } from "react-feather";
import businessData from "../../data/woyceBusinessData.json";
import { filterList } from "./filter";
import {
  ACCENTS,
  Badge,
  Card,
  EmptyState,
  SECTION_ACCENT,
  SectionHeading,
  StaggerItem,
  StaggerList,
  StatTile,
  accentFor,
} from "./ui";

export function OverviewSection() {
  const { company } = businessData;
  const stats = company.stats.from_about_page;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading icon={Award} title="Woyce Technologies" accent={SECTION_ACCENT.overview} />
      <p className="text-sm text-white/70 italic border-l-2 border-white/10 pl-3">
        &ldquo;{company.tagline}&rdquo;
      </p>

      <StaggerList className="grid grid-cols-2 gap-2">
        <StaggerItem>
          <StatTile label="Founded" value={company.founded.split(",")[0]} accent={ACCENTS.sky} />
        </StaggerItem>
        <StaggerItem>
          <StatTile label="Team size" value={stats.team_size} accent={ACCENTS.leaf} />
        </StaggerItem>
        <StaggerItem>
          <StatTile label="Projects shipped" value={stats.projects_shipped} accent={ACCENTS.iris} />
        </StaggerItem>
        <StaggerItem>
          <StatTile label="Offices" value={company.locations.length} accent={ACCENTS.ember} />
        </StaggerItem>
      </StaggerList>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">Milestones</h3>
        <div className="flex flex-col gap-1.5">
          {company.milestones.map((m) => (
            <div key={m.year} className="flex gap-2 text-xs">
              <span className="font-mono text-white/30 shrink-0">{m.year}</span>
              <span className="text-white/70">{m.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">How they operate</h3>
        <ul className="text-xs text-white/70 flex flex-col gap-1.5">
          {company.operating_principles.map((p) => (
            <li key={p} className="flex gap-2">
              <span style={{ color: ACCENTS.leaf }}>&bull;</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TeamSection({ query }) {
  const { items, filtered } = filterList(businessData.team.members, query, [
    "name",
    "role",
    "skills",
  ]);

  return (
    <div>
      <SectionHeading
        icon={Users}
        title={`Team (${businessData.team.members.length})`}
        filtered={filtered}
        query={query}
        accent={SECTION_ACCENT.team}
      />
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.map((member) => {
          const accent = accentFor(member.name);
          return (
            <StaggerItem key={member.name}>
              <Card accent={accent} className="flex gap-3 items-start">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: `${accent}25`, color: accent }}
                >
                  {member.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#F0F6FC]">{member.name}</div>
                  <div className="text-xs text-white/50 mb-1">{member.role}</div>
                  <div className="text-[11px] text-white/30">{member.skills}</div>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </div>
  );
}

export function ServicesSection({ query }) {
  const { items, filtered } = filterList(businessData.services.detailed_categories, query, [
    "name",
    "description",
  ]);

  return (
    <div>
      <SectionHeading title="Services" icon={Layers} filtered={filtered} query={query} accent={SECTION_ACCENT.services} />
      <div className="flex flex-wrap gap-1.5 mb-3">
        {businessData.services.high_level_areas.map((area) => (
          <Badge key={area} color={accentFor(area)}>
            {area.split(" (")[0]}
          </Badge>
        ))}
      </div>
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.map((service) => (
          <StaggerItem key={service.name}>
            <Card accent={accentFor(service.name)}>
              <div className="font-semibold text-sm text-[#F0F6FC] mb-1">{service.name}</div>
              <div className="text-xs text-white/50">{service.description}</div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}

export function ProcessSection() {
  const { process } = businessData;
  const stepAccents = [ACCENTS.sky, ACCENTS.leaf, ACCENTS.iris, ACCENTS.ember];

  return (
    <div>
      <SectionHeading title={`Process (${process.total_timeline})`} icon={Compass} accent={SECTION_ACCENT.process} />
      <div className="flex flex-col">
        {process.steps.map((step, i) => {
          const accent = stepAccents[i % stepAccents.length];
          return (
            <div key={step.name} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${accent}25`, color: accent, border: `1px solid ${accent}60` }}
                >
                  {i + 1}
                </div>
                {i < process.steps.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
                )}
              </div>
              <div className="pb-4">
                <div className="font-semibold text-sm text-[#F0F6FC]">
                  {step.name} <span className="text-white/30 font-normal">&middot; {step.duration}</span>
                </div>
                <div className="text-xs text-white/50 mt-0.5">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CaseStudiesSection({ query }) {
  const { items, filtered } = filterList(businessData.case_studies, query, [
    "name",
    "industry",
    "description",
    "result",
  ]);

  return (
    <div>
      <SectionHeading
        title={`Case Studies (${businessData.case_studies.length})`}
        icon={TrendingUp}
        filtered={filtered}
        query={query}
        accent={SECTION_ACCENT.case_studies}
      />
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.length === 0 ? (
          <EmptyState>No case studies match that.</EmptyState>
        ) : (
          items.map((cs) => {
            const accent = accentFor(cs.industry);
            return (
              <StaggerItem key={cs.name}>
                <Card accent={accent}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#F0F6FC]">{cs.name}</span>
                    <Badge color={accent}>{cs.industry}</Badge>
                  </div>
                  <div className="text-xs text-white/50 mb-2">{cs.description}</div>
                  <div className="text-sm font-bold" style={{ color: ACCENTS.leaf }}>
                    {cs.result}
                  </div>
                </Card>
              </StaggerItem>
            );
          })
        )}
      </StaggerList>
    </div>
  );
}

export function TestimonialsSection({ query }) {
  const { items, filtered } = filterList(businessData.testimonials, query, [
    "name",
    "title",
    "quote",
  ]);

  return (
    <div>
      <SectionHeading
        title={`Testimonials (${businessData.testimonials.length})`}
        icon={MessageSquare}
        filtered={filtered}
        query={query}
        accent={SECTION_ACCENT.testimonials}
      />
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.map((t) => (
          <StaggerItem key={t.name}>
            <Card accent={accentFor(t.name)}>
              <p className="text-xs text-white/70 italic mb-2 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="text-xs font-semibold text-[#F0F6FC]">{t.name}</div>
              <div className="text-[11px] text-white/40">{t.title}</div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}

export function CareersSection({ query }) {
  const { items, filtered } = filterList(businessData.careers.open_positions, query, [
    "title",
    "department",
    "location",
  ]);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Careers" icon={Briefcase} filtered={filtered} query={query} accent={SECTION_ACCENT.careers} />
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.map((role) => {
          const accent = accentFor(role.department);
          return (
            <StaggerItem key={role.title}>
              <Card accent={accent}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[#F0F6FC]">{role.title}</span>
                  <Badge color={accent}>{role.department}</Badge>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {role.location} &middot; {role.requirement}
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerList>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-1.5">Culture & benefits</h3>
        <div className="flex flex-wrap gap-1.5">
          {businessData.careers.benefits.map((b) => (
            <Badge key={b} color={accentFor(b)}>
              {b}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PartnershipsSection({ query }) {
  const { items, filtered } = filterList(businessData.partnerships.models, query, [
    "type",
    "for",
    "terms",
  ]);

  return (
    <div>
      <SectionHeading title="Partnerships" icon={Users} filtered={filtered} query={query} accent={SECTION_ACCENT.partnerships} />
      <StaggerList className="grid grid-cols-1 gap-2">
        {items.map((p) => (
          <StaggerItem key={p.type}>
            <Card accent={accentFor(p.type)}>
              <div className="font-semibold text-sm text-[#F0F6FC] mb-1">{p.type}</div>
              <div className="text-xs text-white/50 mb-1">For: {p.for}</div>
              <div className="text-[11px] text-white/30">{p.terms}</div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}

export function BrandSection() {
  const { brand } = businessData;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Brand" icon={Feather} accent={SECTION_ACCENT.brand} />
      <p className="text-xs text-white/50 italic border-l-2 border-white/10 pl-3">&ldquo;{brand.brand_voice}&rdquo;</p>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">Colors</h3>
        <StaggerList className="grid grid-cols-3 gap-2">
          {brand.colors.map((c) => (
            <StaggerItem key={c.hex}>
              <div className="text-center">
                <div
                  className="w-full h-10 rounded-md border border-white/10"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="text-[10px] text-white/40 mt-1 font-mono">{c.hex}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">Typography</h3>
        {brand.typography.map((f) => (
          <div key={f.font} className="text-xs text-white/60">
            <span className="font-semibold text-[#F0F6FC]">{f.font}</span> &mdash; {f.use}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactSection() {
  const { contact, company } = businessData;

  return (
    <div className="flex flex-col gap-2">
      <SectionHeading title="Contact" icon={Mail} accent={SECTION_ACCENT.contact} />
      <Card accent={ACCENTS.sky}>
        <div className="text-[10px] uppercase tracking-wide text-white/40">Email</div>
        <div className="text-sm font-semibold text-[#F0F6FC]">{contact.email}</div>
      </Card>
      <Card accent={ACCENTS.leaf}>
        <div className="text-[10px] uppercase tracking-wide text-white/40">Phone / WhatsApp</div>
        <div className="text-sm font-semibold text-[#F0F6FC]">{contact.phone}</div>
      </Card>
      {company.locations.map((loc) => (
        <Card key={loc.office} accent={ACCENTS.iris}>
          <div className="text-[10px] uppercase tracking-wide text-white/40">{loc.office}</div>
          <div className="text-xs text-white/70 mt-1">{loc.address}</div>
          <div className="text-[11px] text-white/30 mt-1">{loc.hours}</div>
        </Card>
      ))}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {contact.social_media.map((s) => (
          <Badge key={s} color={accentFor(s)}>
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}
