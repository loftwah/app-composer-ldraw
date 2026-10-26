/**
 * Pure library filtering, favourites and recent-item persistence.
 *
 * The component renders whatever these functions return; keeping the logic
 * here makes search/project/category behaviour testable without a browser.
 */
import {
  artworkCategories,
  artworkProjects,
  portfolioArtwork,
  portfolioCompositions,
  portfolioProjects,
  projectsByKey,
} from "./portfolio.mjs";

export const LIBRARY_FAVOURITES_KEY = "ldraw:library:favourites:v1";
export const LIBRARY_RECENT_KEY = "ldraw:library:recent:v1";
export const RECENT_LIMIT = 12;
export const SPECIAL_PROJECTS = [
  { key: "all", label: "All projects" },
  { key: "favourites", label: "Favourites" },
  { key: "recent", label: "Recently used" },
];

export function entryKey(entry) {
  const kind =
    entry.kind ??
    (entry.scene && entry.project
      ? "diagram"
      : entry.category && entry.file
        ? "artwork"
        : "block");
  return `${kind}:${entry.id}`;
}

function compositionEntry(composition) {
  const project = projectsByKey[composition.project] ?? {};
  return {
    ...composition,
    kind: "composition",
    category: "template",
    file: composition.preview,
    thumb: composition.preview,
    subtitle: composition.description,
    projectLabel: project.label ?? composition.project,
    accent: project.accent ?? "#FC5B05",
    tint: project.tint ?? "#FFE8D9",
    status: "documented",
    statusLabel: "Authored composition",
    credit: composition.credit ?? "LDraw · authored presentation composition",
    note:
      composition.note ??
      "A local native composition authored for LDraw. It contains editable vectors and text, not a screenshot.",
    tags: composition.tags ?? ["composition", "presentation", "template"],
    use:
      composition.use ??
      "Insert a complete 16:9 presentation stage, then add your own artwork and notes.",
  };
}

export const assetEntries = [
  ...portfolioArtwork.map((item) => ({ ...item, kind: "artwork" })),
  ...portfolioCompositions.map(compositionEntry),
];

function normalise(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function searchHaystack(entry) {
  return normalise(
    [
      entry.title,
      entry.subtitle,
      entry.project,
      entry.projectLabel,
      entry.category,
      entry.status,
      entry.statusLabel,
      entry.credit,
      entry.note,
      entry.use,
      ...(entry.tags ?? []),
      // Architecture entries use summary/facts instead of subtitle.
      entry.summary,
      ...(entry.facts ?? []),
      ...(entry.sources ?? []),
    ].join(" "),
  );
}

export function matchesQuery(entry, query) {
  const tokens = normalise(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;
  const haystack = searchHaystack(entry);
  return tokens.every((token) => haystack.includes(token));
}

export function filterEntries(
  entries,
  {
    project = "all",
    category = "all",
    query = "",
    favouriteIds = new Set(),
    recentIds = [],
  } = {},
) {
  let result = entries;
  if (project === "favourites")
    result = result.filter((entry) => favouriteIds.has(entryKey(entry)));
  else if (project === "recent") {
    const order = new Map(recentIds.map((key, index) => [key, index]));
    result = result
      .filter((entry) => order.has(entryKey(entry)))
      .sort((a, b) => order.get(entryKey(a)) - order.get(entryKey(b)));
  } else if (project !== "all") {
    result = result.filter((entry) => entry.project === project);
  }
  if (category !== "all")
    result = result.filter((entry) => entry.category === category);
  return result.filter((entry) => matchesQuery(entry, query));
}

export function categoriesFor(entries = assetEntries) {
  return artworkCategories
    .map((category) => ({
      ...category,
      count: entries.filter((entry) => entry.category === category.key).length,
    }))
    .filter((category) => category.count);
}

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStringArray(key) {
  const store = storage();
  if (!store) return [];
  try {
    const value = JSON.parse(store.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((entry) => typeof entry === "string").slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function writeStringArray(key, values) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(values.slice(0, RECENT_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

export function toggleFavourite(ids, key) {
  const next = new Set(ids);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function pushRecent(list, key) {
  return [key, ...list.filter((value) => value !== key)].slice(0, RECENT_LIMIT);
}

export function projectGroupsFor(entries = assetEntries) {
  const counts = new Map();
  for (const entry of entries)
    counts.set(entry.project, (counts.get(entry.project) ?? 0) + 1);
  return ["Apps", "Games", "Music", "Portfolio"].map((group) => ({
    group,
    projects: portfolioProjects
      .filter((project) => project.group === group)
      .map((project) => ({
        key: project.key,
        label: project.label,
        accent: project.accent,
        count: counts.get(project.key) ?? 0,
      })),
  }));
}

export function statusTone(status) {
  if (status === "approved") return "good";
  if (status === "qualified") return "qualified";
  if (status === "documented" || status === "current") return "documented";
  if (status === "candidate") return "candidate";
  return "sample";
}

export { artworkCategories, portfolioProjects };
