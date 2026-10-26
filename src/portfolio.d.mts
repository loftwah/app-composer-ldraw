export type PortfolioArtwork = {
  id: string;
  project: string;
  projectLabel: string;
  title: string;
  subtitle: string;
  file: string;
  status: "approved" | "qualified" | "documented" | "agent-selected" | "current" | "sample";
  statusLabel: string;
  credit: string;
  note: string;
  width: number;
  height: number;
  accent: string;
  tint: string;
  source: string;
  sourceSha: string;
  derivativeSha: string;
};

export const portfolioArtwork: PortfolioArtwork[];
export const artworkProjects: { key: string; label: string }[];
