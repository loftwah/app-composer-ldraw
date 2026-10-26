import type { PortfolioArtwork } from "./portfolio.mjs";

export type LibraryEntry =
  | PortfolioArtwork
  | {
      id: string;
      kind: "composition";
      project: string;
      title: string;
      subtitle: string;
      file?: string;
      thumb?: string;
      preview: string;
      scene: string;
      category: string;
      status: string;
      statusLabel: string;
      credit: string;
      note: string;
      use: string;
      tags: string[];
      width: number;
      height: number;
      accent: string;
      tint: string;
      projectLabel: string;
    };

export const LIBRARY_FAVOURITES_KEY: string;
export const LIBRARY_RECENT_KEY: string;
export const RECENT_LIMIT: number;
export const SPECIAL_PROJECTS: Array<{ key: string; label: string }>;
export const assetEntries: LibraryEntry[];
export const libraryProjects: Array<Record<string, unknown>>;
export function entryKey(entry: any): string;
export function countForProject(projectKey: string, entries?: any[]): number | null;
export function searchHaystack(entry: any): string;
export function matchesQuery(entry: any, query: string): boolean;
export function filterEntries(
  entries: any[],
  options?: {
    project?: string;
    category?: string;
    query?: string;
    favouriteIds?: Set<string>;
    recentIds?: string[];
  },
): any[];
export function categoriesFor(entries?: any[]): Array<{
  key: string;
  label: string;
  count: number;
}>;
export function readStringArray(key: string): string[];
export function writeStringArray(key: string, values: string[]): boolean;
export function toggleFavourite(ids: Set<string>, key: string): Set<string>;
export function pushRecent(list: string[], key: string): string[];
export function projectGroupsFor(entries?: any[]): Array<{
  group: string;
  projects: Array<{ key: string; label: string; accent: string; count: number }>;
}>;
export function statusTone(status: string): string;
export { artworkCategories, portfolioProjects };
