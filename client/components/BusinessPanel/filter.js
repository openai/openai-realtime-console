// Filters a list by a free-text query across the given keys. Falls back to
// the full, unfiltered list when the query is empty or matches nothing —
// a spoken query is often loose ("healthcare stuff", "the finance one"), so
// showing everything beats showing a blank panel.
export function filterList(items, query, keys) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return { items, filtered: false };

  const matches = items.filter((item) =>
    keys.some((key) => String(item[key] ?? "").toLowerCase().includes(q)),
  );

  return matches.length > 0 ? { items: matches, filtered: true } : { items, filtered: false };
}
