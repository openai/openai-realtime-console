import { motion } from "framer-motion";

// Small shared visual primitives used across every section renderer, kept
// in one place so the panel reads as one consistent system. Colors are
// Woyce's own brand accents (client/data/woyceBusinessData.json -> brand.colors)
// so the panel that describes the company visually looks like it belongs to it.
export const ACCENTS = {
  sky: "#79C0FF",
  leaf: "#7EE787",
  iris: "#D2A8FF",
  ember: "#FFA657",
};

const ACCENT_LIST = Object.values(ACCENTS);

// One fixed accent per section, shared between each section's heading and
// the panel's own "just updated" sync flash so the two stay visually tied
// together.
export const SECTION_ACCENT = {
  overview: ACCENTS.iris,
  team: ACCENTS.leaf,
  services: ACCENTS.sky,
  process: ACCENTS.ember,
  case_studies: ACCENTS.iris,
  testimonials: ACCENTS.ember,
  careers: ACCENTS.sky,
  partnerships: ACCENTS.iris,
  brand: ACCENTS.ember,
  contact: ACCENTS.leaf,
};

// Deterministic color pick (not random) so the same industry/name always
// gets the same accent across re-renders and filters.
export function accentFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENT_LIST[hash % ACCENT_LIST.length];
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// Wrap a list of cards with this to get a staggered fade/rise-in as the
// section mounts, instead of everything popping in at once.
export function StaggerList({ children, className = "" }) {
  return (
    <motion.div className={className} variants={listVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }) {
  return <motion.div variants={itemVariants}>{children}</motion.div>;
}

export function Card({ children, className = "", accent }) {
  return (
    <div
      className={`rounded-lg p-3 border border-white/8 bg-white/[0.04] backdrop-blur-sm ${className}`}
      style={accent ? { borderLeft: `2px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = ACCENTS.sky }) {
  return (
    <span
      className="inline-block text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium"
      style={{ color, backgroundColor: `${color}1f`, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}

export function StatTile({ label, value, accent = ACCENTS.sky }) {
  return (
    <div
      className="rounded-lg p-3 text-center border border-white/8 bg-white/[0.04]"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div className="text-xl font-bold leading-tight text-[#F0F6FC]">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/40 mt-1">{label}</div>
    </div>
  );
}

export function SectionHeading({ icon: Icon, title, filtered, query, accent = ACCENTS.sky }) {
  return (
    <div className="mb-3 flex items-start gap-2.5">
      {Icon && (
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          <Icon size={16} />
        </div>
      )}
      <div>
        <h2 className="text-base font-bold text-[#F0F6FC] leading-tight">{title}</h2>
        {filtered && query && (
          <p className="text-[11px] text-white/40 mt-0.5">
            Filtered by <span className="font-semibold text-white/60">&ldquo;{query}&rdquo;</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="text-white/40 text-sm">{children}</p>;
}
