import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

export type DiagramCollection = {
  id: string;
  label: string;
  description: string;
};
export type DiagramApp = {
  key: string;
  title: string;
  subtitle: string;
  accent: string;
  tint: string;
};
export type DiagramLibraryItem = {
  id: string;
  name: string;
  description: string;
  collection: string;
  width: number;
  height: number;
  elements: ExcalidrawElementSkeleton[];
};
export type PresetName =
  "portfolio" | "journey" | "architecture" | "game" | "release" | "beforeAfter";
export type ProjectName =
  "composer" | "infrastructure" | "game" | "music" | "general";

export const INK: string;
export const MUTED: string;
export const PAPER: string;
export const LINE: string;
export const ORANGE: string;
export const ORANGE_TINT: string;
export const BLUE: string;
export const BLUE_TINT: string;
export const VIOLET: string;
export const VIOLET_TINT: string;
export const GREEN: string;
export const GREEN_TINT: string;
export const LIME: string;
export const LIME_TINT: string;
export const collections: DiagramCollection[];
export const apps: DiagramApp[];
export const brandStatus: Record<string, { status: string; note: string }>;
export const unresolvedBrandIdentities: string[];
export const projectBrand: Record<string, { status: string; note: string }>;
export const projects: {
  composer: { label: string; stroke: string; fill: string; topic: string };
  infrastructure: {
    label: string;
    stroke: string;
    fill: string;
    topic: string;
  };
  game: { label: string; stroke: string; fill: string; topic: string };
  music: { label: string; stroke: string; fill: string; topic: string };
  general: { label: string; stroke: string; fill: string; topic: string };
};
export const presetCatalog: Record<
  PresetName,
  { label: string; notes: string }
>;
export const librarySpecs: DiagramLibraryItem[];
export const presetBuilders: Record<PresetName, unknown>;
export function appCard(
  id: string,
  x: number,
  y: number,
  app: DiagramApp,
  options?: Record<string, unknown>,
): ExcalidrawElementSkeleton[];
export function buildPreset(
  name: PresetName,
  project?: ProjectName,
  ink?: string,
): ExcalidrawElementSkeleton[];
export function libraryItemNames(): string[];
