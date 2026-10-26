export type PortfolioArtworkStatus =
  | "approved"
  | "qualified"
  | "documented"
  | "agent-selected"
  | "current"
  | "candidate"
  | "sample";

export type PortfolioArtwork = {
  id: string;
  kind?: "artwork" | "composition";
  project: string;
  projectLabel: string;
  category:
    | "logo"
    | "icon"
    | "character"
    | "mascot"
    | "screenshot"
    | "ui"
    | "background"
    | "diagram"
    | "component"
    | "illustration"
    | "template";
  title: string;
  subtitle: string;
  file: string;
  thumb: string;
  status: PortfolioArtworkStatus;
  statusLabel: string;
  credit: string;
  note: string;
  use: string;
  tags: string[];
  width: number;
  height: number;
  accent: string;
  tint: string;
  source: string;
  sourceKind: string;
  sourceSha: string;
  derivativeSha: string;
};

export type PortfolioProject = {
  key: string;
  label: string;
  tagline: string;
  description: string;
  group: "Apps" | "Games" | "Music" | "Portfolio";
  accent: string;
  tint: string;
  brand: string;
  site: string;
  repo: string;
  featured: boolean;
};

export type ArchitectureEntry = {
  id: string;
  project: string;
  title: string;
  summary: string;
  coverage: string;
  reviewedAt: string;
  sourceRevision: string;
  primarySourceRepo: string;
  sourceFiles: string[];
  sources: string[];
  facts: string[];
  scene: string;
  preview: string;
  sceneSha256: string;
  previewSha256: string;
  previewWidth: number;
  previewHeight: number;
  elements: number;
  renderer: string;
  render: Record<string, unknown>;
  humanReview: string;
  status?: string;
  statusLabel?: string;
};

export type CompositionEntry = {
  id: string;
  kind?: "composition";
  project: string;
  projectLabel: string;
  category?: string;
  title: string;
  subtitle: string;
  description: string;
  scene: string;
  preview: string;
  credit: string;
  note: string;
  tags: string[];
  use: string;
  status: PortfolioArtworkStatus;
  statusLabel: string;
  width: number;
  height: number;
  accent: string;
  tint: string;
};

export const portfolioProjects: PortfolioProject[];
export const portfolioArtwork: PortfolioArtwork[];
export const artworkProjects: Array<{
  key: string;
  label: string;
  group: string;
  accent: string;
  tint: string;
  count: number;
  architecture: boolean;
}>;
export const artworkCategories: Array<{
  key: string;
  label: string;
  count: number;
}>;
export const portfolioCompositions: CompositionEntry[];
export const architectureCatalogue: ArchitectureEntry[];
export const libraryStats: {
  projects: number;
  assets: number;
  compositions: number;
  architecture: number;
  categories: number;
};
export const projectsByKey: Record<string, PortfolioProject>;
export const artworkByProject: Record<string, PortfolioArtwork[]>;
export function projectFor(key: string): PortfolioProject | null;
