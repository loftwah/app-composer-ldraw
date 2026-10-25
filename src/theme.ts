export const APPEARANCE_KEY = "ldraw:appearance";
export type Appearance = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export function normalizeAppearance(value: unknown): Appearance {
  return value === "light" || value === "system" || value === "dark"
    ? value
    : "dark";
}

export function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    if (stored) return normalizeAppearance(stored);
  } catch {
    // Private browsing or storage policy can refuse localStorage. The
    // pre-paint script still carries the default or a same-document choice.
  }
  return normalizeAppearance(document.documentElement.dataset.appearance);
}

export function resolveTheme(
  appearance: Appearance,
  prefersDark: boolean,
): ResolvedTheme {
  if (appearance === "system") return prefersDark ? "dark" : "light";
  return appearance;
}

export function applyTheme(appearance: Appearance, theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.appearance = appearance;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.style.backgroundColor = theme === "dark" ? "#121212" : "#FAFAF9";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#121212" : "#FAFAF9");
}

/** Pick readable scene text without changing an existing canvas colour. */
export function isDarkBackground(color: string | undefined): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(color ?? "");
  if (!match) return false;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
}

export function rememberAppearance(appearance: Appearance) {
  try {
    localStorage.setItem(APPEARANCE_KEY, appearance);
  } catch {
    // A session-only appearance is still correct; do not fail the editor.
  }
}
