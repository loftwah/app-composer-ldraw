/* Set the first paint before any stylesheet or module runs. Same-origin and CSP-safe. */
(() => {
  var key = "ldraw:appearance";
  var stored = null;
  try {
    stored = localStorage.getItem(key);
  } catch {
    /* The default dark canvas still wins. */
  }
  var appearance =
    stored === "light" || stored === "system" || stored === "dark"
      ? stored
      : "dark";
  var dark =
    appearance === "dark" ||
    (appearance === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  var root = document.documentElement;
  root.dataset.appearance = appearance;
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
  root.style.backgroundColor = dark ? "#121212" : "#FAFAF9";
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#121212" : "#FAFAF9");
})();
