import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
  Excalidraw,
  exportToBlob,
  exportToSvg,
  loadFromBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  BLUE,
  collections,
  GREEN,
  INK,
  librarySpecs,
  ORANGE,
  VIOLET,
  type DiagramLibraryItem,
} from "./diagrams.mjs";
import {
  makeLibraryItems,
  makePreset,
  preparePresetFont,
  PRESET_FONT_ERROR,
  presets,
  projects,
  type Preset,
  type Project,
} from "./presets";
import { MAX_SCENE_BYTES, validateScene } from "./scene.mjs";
import { readDraft, writeDraft } from "./storage";
import {
  applyTheme,
  isDarkBackground,
  readAppearance,
  rememberAppearance,
  resolveTheme,
  type Appearance,
  type ResolvedTheme,
} from "./theme";

type NativeScene = ReturnType<typeof validateScene>;
type ExportKind = "png" | "svg";
type Preview = { url: string; blob: Blob; kind: ExportKind };
export type LocalAPI = {
  readScene: () => { revision: string; scene: NativeScene };
  replaceScene: (
    scene: unknown,
    options: { expectedRevision: string },
  ) => Promise<{ revision: string; scene: NativeScene }>;
  exportBlob: (kind: ExportKind) => Promise<Blob>;
};
declare global {
  interface Window {
    ldraw?: LocalAPI;
  }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement("a"), {
    href: url,
    download: name,
  });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const afterPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const collectionAccents: Record<string, string> = {
  apps: ORANGE,
  composer: ORANGE,
  infrastructure: BLUE,
  games: VIOLET,
  music: GREEN,
  general: INK,
};
const composerReturn = new URL("https://composer.loftwah.com/");
for (const key of ["analytics", "qa"]) {
  const value = new URLSearchParams(window.location.search).get(key);
  if (value !== null) composerReturn.searchParams.set(key, value);
}

export function App() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI>();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Opening local drawing…");
  const [error, setError] = useState("");
  const [fontError, setFontError] = useState("");
  const [project, setProject] = useState<Project>("composer");
  const [preset, setPreset] = useState<Preset>("journey");
  const [background, setBackground] = useState(true);
  const [scale, setScale] = useState(2);
  const [preview, setPreview] = useState<Preview>();
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [appearance, setAppearance] = useState<Appearance>(() =>
    readAppearance(),
  );
  const [prefersDark, setPrefersDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryReady, setLibraryReady] = useState(false);
  const theme: ResolvedTheme = resolveTheme(appearance, prefersDark);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const libraryDialog = useRef<HTMLDialogElement>(null);
  const initialized = useRef(false);
  const enabled = useRef(false);
  const pending = useRef("");
  const saving = useRef(false);
  const lastObserved = useRef("");
  const storageRevision = useRef(0);
  const session = useRef(crypto.randomUUID());
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queue = useRef(Promise.resolve());
  const backgroundRef = useRef(background);
  const scaleRef = useRef(scale);
  const themeRef = useRef(theme);
  backgroundRef.current = background;
  scaleRef.current = scale;
  themeRef.current = theme;

  useEffect(() => {
    applyTheme(appearance, theme);
    rememberAppearance(appearance);
  }, [appearance, theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent) =>
      setPrefersDark(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const initialData = useMemo(
    () => ({
      appState: {
        // Excalidraw's dark theme inverts the rendered canvas. A white scene
        // background is therefore the readable dark canvas, and keeps the
        // saved scene portable between both appearances.
        viewBackgroundColor: "#ffffff",
        theme: themeRef.current,
      },
    }),
    [],
  );

  const persist = useCallback(() => {
    queue.current = queue.current.then(async () => {
      if (!enabled.current || !pending.current) return;
      const raw = pending.current;
      pending.current = "";
      saving.current = true;
      try {
        storageRevision.current = await writeDraft(
          raw,
          storageRevision.current,
        );
        setStatus("Saved on this browser");
      } catch (failure) {
        enabled.current = false;
        setError(
          failure instanceof Error
            ? failure.message
            : "Local save failed. Download an editable copy.",
        );
        setStatus("Drawing in memory · download to keep");
      } finally {
        saving.current = false;
      }
    });
  }, []);

  const observe = useCallback(
    (raw: string) => {
      if (lastObserved.current === raw) return;
      lastObserved.current = raw;
      revision.current += 1;
      if (!enabled.current) return;
      pending.current = raw;
      setStatus("Saving on this browser…");
      clearTimeout(timer.current);
      timer.current = setTimeout(persist, 500);
    },
    [persist],
  );

  useEffect(() => {
    if (!api || initialized.current) return;
    initialized.current = true;
    let disposed = false;
    void (async () => {
      let shouldSave = true;
      try {
        const draft = await readDraft();
        if (disposed) return;
        storageRevision.current = draft.revision;
        if (draft.scene) {
          shouldSave = draft.recovered;
          const restored = await loadFromBlob(
            new Blob([JSON.stringify(draft.scene)]),
            null,
            null,
          );
          api.addFiles(Object.values(restored.files ?? {}));
          api.updateScene({
            elements: restored.elements,
            appState: { ...restored.appState, theme: themeRef.current },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          setStatus(
            draft.recovered
              ? "Recovered previous local save"
              : "Restored from this browser",
          );
          if (draft.recovered)
            setError(
              "The latest local save was damaged. The previous save was recovered; download a copy.",
            );
        } else {
          let generated: ReturnType<typeof makePreset> = [];
          try {
            await preparePresetFont();
            if (disposed) return;
            setFontError("");
            generated = makePreset("journey", "composer", 0, INK);
          } catch (failure) {
            if (disposed) return;
            setFontError(
              failure instanceof Error ? failure.message : PRESET_FONT_ERROR,
            );
          }
          api.updateScene({
            elements: generated,
            appState: { viewBackgroundColor: "#ffffff" },
            captureUpdate: CaptureUpdateAction.NEVER,
          });
        }
        enabled.current = true;
        let libraryInstalled = false;
        try {
          libraryInstalled =
            localStorage.getItem("ldraw:library:20261025") === "1";
        } catch {
          // Fall through and install for this session.
        }
        try {
          if (!libraryInstalled) {
            await api.updateLibrary({
              libraryItems: makeLibraryItems(),
              merge: true,
              openLibraryMenu: false,
            });
            try {
              localStorage.setItem("ldraw:library:20261025", "1");
            } catch {
              // The native panel is still usable for this session.
            }
          }
          if (!disposed) setLibraryReady(true);
        } catch (failure) {
          if (!disposed)
            setError(
              failure instanceof Error
                ? failure.message
                : "The built-in library could not be opened. Your drawing is unchanged.",
            );
        }
      } catch (failure) {
        if (disposed) return;
        setError(
          failure instanceof Error
            ? failure.message
            : "Local draft unavailable. Download your drawing to keep it.",
        );
        setStatus("Drawing in memory · download to keep");
      }
      if (disposed) return;
      await afterPaint();
      api.scrollToContent(undefined, { fitToContent: true });
      api.history.clear();
      setReady(true);
      const raw = serializeAsJSON(
        api.getSceneElementsIncludingDeleted(),
        api.getAppState(),
        api.getFiles(),
        "local",
      );
      if (shouldSave) observe(raw);
      else {
        lastObserved.current = raw;
        revision.current += 1;
      }
    })();
    return () => {
      disposed = true;
    };
  }, [api, observe]);

  useEffect(() => {
    const flush = () => {
      clearTimeout(timer.current);
      persist();
    };
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (
        pending.current ||
        saving.current ||
        (!enabled.current && lastObserved.current)
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", preventLoss);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", preventLoss);
    };
  }, [persist]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
    const controller = new AbortController();
    const listen = (event: MessageEvent) => {
      if (event.data?.type === "LDRAW_OFFLINE_READY") setOffline(true);
    };
    navigator.serviceWorker.addEventListener("message", listen, {
      signal: controller.signal,
    });
    void navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        const worker =
          registration.active ??
          registration.installing ??
          registration.waiting;
        worker?.postMessage({ type: "LDRAW_CHECK_READY" });
      })
      .catch(() => setOffline(false));
    return () => controller.abort();
  }, []);

  const capture = useCallback(() => {
    if (!api || !ready) throw new Error("The editor is still opening.");
    const raw = serializeAsJSON(
      api.getSceneElementsIncludingDeleted(),
      api.getAppState(),
      api.getFiles(),
      "local",
    );
    observe(raw);
    return {
      revision: `${session.current}:${revision.current}`,
      scene: validateScene(raw),
    };
  }, [api, ready, observe]);

  const replace = useCallback(
    async (scene: unknown, expectedRevision: string) => {
      if (!api) throw new Error("The editor is still opening.");
      if (capture().revision !== expectedRevision)
        throw new Error(
          "The drawing changed. Read the current revision before replacing it.",
        );
      const checked = validateScene(scene);
      const restored = await loadFromBlob(
        new Blob([JSON.stringify(checked)]),
        null,
        null,
      );
      // Recheck after asynchronous restore so a human edit cannot be overwritten.
      if (capture().revision !== expectedRevision)
        throw new Error(
          "The drawing changed during import. Your edits were preserved.",
        );
      api.addFiles(Object.values(restored.files ?? {}));
      api.updateScene({
        elements: restored.elements,
        appState: { ...restored.appState, theme: themeRef.current },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      api.scrollToContent(restored.elements, { fitToContent: true });
      await afterPaint();
      return capture();
    },
    [api, capture],
  );

  const exportBlob = useCallback(
    async (kind: ExportKind) => {
      if (!api || !ready) throw new Error("The editor is still opening.");
      const elements = api
        .getSceneElements()
        .filter((element) => !element.isDeleted);
      if (!elements.length)
        throw new Error("Add something to the drawing before exporting.");
      const options = {
        elements,
        files: api.getFiles(),
        appState: {
          ...api.getAppState(),
          exportBackground: backgroundRef.current,
          exportEmbedScene: false,
        },
        exportPadding: 24,
      };
      if (kind === "svg") {
        const svg = await exportToSvg(options);
        return new Blob([new XMLSerializer().serializeToString(svg)], {
          type: "image/svg+xml",
        });
      }
      if (kind !== "png") throw new Error("Choose PNG or SVG.");
      return exportToBlob({
        ...options,
        mimeType: "image/png",
        getDimensions: (width: number, height: number) => {
          const scale = scaleRef.current;
          if (
            width * scale > 8192 ||
            height * scale > 8192 ||
            width * height * scale * scale > 32_000_000
          )
            throw new Error(
              "PNG is too large at this scale. Choose a lower scale or export SVG.",
            );
          return { width: width * scale, height: height * scale, scale };
        },
      });
    },
    [api, ready],
  );

  useEffect(() => {
    if (!ready) return;
    const local: LocalAPI = {
      readScene: capture,
      replaceScene: (scene, options) =>
        replace(scene, options.expectedRevision),
      exportBlob,
    };
    window.ldraw = local;
    return () => {
      if (window.ldraw === local) delete window.ldraw;
    };
  }, [ready, capture, replace, exportBlob]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  useEffect(() => {
    if (preview && !previewDialog.current?.open)
      previewDialog.current?.showModal();
  }, [preview]);
  useEffect(() => {
    if (libraryOpen && !libraryDialog.current?.open)
      libraryDialog.current?.showModal();
    if (!libraryOpen && libraryDialog.current?.open)
      libraryDialog.current.close();
  }, [libraryOpen]);

  async function openFile(file: File) {
    setBusy(true);
    try {
      if (file.size > MAX_SCENE_BYTES)
        throw new Error("Choose an editable drawing smaller than 20 MB.");
      const expected = capture().revision;
      const scene = validateScene(await file.text());
      if (
        !window.confirm(
          "Open this file in place of the current drawing? Download an editable copy first if you want to keep both.",
        )
      )
        return;
      await replace(scene, expected);
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The file could not be opened. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function previewExport(kind: ExportKind) {
    setBusy(true);
    try {
      const blob = await exportBlob(kind);
      setPreview({ blob, kind, url: URL.createObjectURL(blob) });
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Export failed. Your drawing remains editable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function insertPreset() {
    if (!api || !ready || busy || fontError) return;
    setBusy(true);
    try {
      try {
        await preparePresetFont();
        setFontError("");
      } catch (failure) {
        setFontError(
          failure instanceof Error ? failure.message : PRESET_FONT_ERROR,
        );
        return;
      }
      // Read after the wait so concurrent human edits remain in the scene.
      const existing = api.getSceneElementsIncludingDeleted();
      const bottom = Math.max(
        0,
        ...existing.filter((e) => !e.isDeleted).map((e) => e.y + e.height),
      );
      const ink = isDarkBackground(api.getAppState().viewBackgroundColor)
        ? "#F4F4F5"
        : INK;
      const inserted = makePreset(
        preset,
        project,
        existing.length ? bottom + 70 : 0,
        ink,
      );
      api.updateScene({
        elements: [...existing, ...inserted],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      api.scrollToContent(inserted, { fitToContent: true });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The example could not be inserted. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function insertBlock(item: DiagramLibraryItem) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      // Read after the guard so a concurrent human edit remains in the scene.
      const existing = api.getSceneElementsIncludingDeleted();
      const bottom = Math.max(
        0,
        ...existing
          .filter((element) => !element.isDeleted)
          .map((element) => element.y + element.height),
      );
      const inserted = convertToExcalidrawElements(item.elements).map(
        (element) => ({
          ...element,
          y: element.y + (existing.length ? bottom + 70 : 0),
        }),
      );
      api.updateScene({
        elements: [...existing, ...inserted],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      api.scrollToContent(inserted, { fitToContent: true });
      setLibraryOpen(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The block could not be inserted. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  function selectProject(value: Project) {
    setProject(value);
    api?.updateScene({
      appState: {
        currentItemStrokeColor: projects[value].stroke,
        currentItemBackgroundColor: projects[value].fill,
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }
  return (
    <main className="workspace">
      <header className="toolbar" aria-label="LDraw drawing actions">
        <a
          className="composer-return"
          href={composerReturn.href}
          aria-label="Return to App Composer"
        >
          <img src="/brand/composer-mark.svg" alt="" width="28" height="28" />
        </a>
        <div className="identity">
          <strong>LDraw</strong>
          <span>powered by Excalidraw</span>
        </div>
        <label>
          Appearance
          <select
            aria-label="Appearance"
            value={appearance}
            onChange={(event) =>
              setAppearance(event.target.value as Appearance)
            }
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>
        <label>
          New content
          <select
            value={project}
            onChange={(event) => selectProject(event.target.value as Project)}
          >
            {Object.entries(projects).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Example
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value as Preset)}
          >
            {Object.entries(presets).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={insertPreset}
          disabled={!ready || busy || Boolean(fontError)}
        >
          Insert example
        </button>
        <button
          onClick={() => setLibraryOpen(true)}
          disabled={!ready || busy || !libraryReady}
          title="Reusable, editable blocks"
        >
          Library
        </button>
        <div className="file-actions">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={!ready || busy}
          >
            Open
          </button>
          <button
            onClick={() => {
              try {
                download(
                  new Blob(
                    [
                      serializeAsJSON(
                        api!.getSceneElementsIncludingDeleted(),
                        api!.getAppState(),
                        api!.getFiles(),
                        "local",
                      ),
                    ],
                    {
                      type: "application/json",
                    },
                  ),
                  "drawing.excalidraw",
                );
              } catch (failure) {
                setError(String(failure));
              }
            }}
            disabled={!ready}
          >
            Save editable
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".excalidraw,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void openFile(file);
          }}
        />
        <div className="export-actions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={background}
              onChange={(event) => setBackground(event.target.checked)}
            />
            Background
          </label>
          <label>
            PNG scale
            <select
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={3}>3×</option>
            </select>
          </label>
          <button
            onClick={() => void previewExport("png")}
            disabled={!ready || busy}
          >
            PNG
          </button>
          <button
            onClick={() => void previewExport("svg")}
            disabled={!ready || busy}
          >
            SVG
          </button>
        </div>
      </header>
      <div className="save-status">
        <span role="status">
          {fontError ? "Example font unavailable · " : ""}
          {status}
        </span>
        <span>
          {offline
            ? "Offline workspace cached · new fonts may need a connection"
            : "Local browser storage · keep an editable download"}
        </span>
      </div>
      {fontError ? (
        <div className="error" role="alert" aria-label="Example font">
          {fontError}
        </div>
      ) : null}
      {error ? (
        <div className="error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      ) : null}
      <section className="canvas" aria-label="Drawing canvas">
        <Excalidraw
          theme={theme}
          initialData={initialData}
          viewModeEnabled={!ready}
          excalidrawAPI={setApi}
          onChange={(elements, appState, files) => {
            if (initialized.current && ready)
              observe(serializeAsJSON(elements, appState, files, "local"));
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveAsImage: false,
              toggleTheme: false,
            },
          }}
          validateEmbeddable={false}
        />
      </section>
      {libraryOpen ? (
        <dialog
          ref={libraryDialog}
          className="library-dialog"
          aria-label="LDraw library"
          onCancel={() => setLibraryOpen(false)}
          onClose={() => setLibraryOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLibraryOpen(false);
          }}
        >
          <div className="library-shell">
            <div className="library-head">
              <div>
                <h2>LDraw library</h2>
                <p>
                  Reusable, editable blocks for the portfolio. Inserting appends
                  below your drawing and keeps your existing elements unchanged.
                  Undo is available.
                </p>
              </div>
              <button
                onClick={() => setLibraryOpen(false)}
                aria-label="Close library"
              >
                ×
              </button>
            </div>
            <div className="library-groups">
              {collections.map((collection) => (
                <section className="library-group" key={collection.id}>
                  <h3>{collection.label}</h3>
                  <p>{collection.description}</p>
                  <div className="library-items">
                    {librarySpecs
                      .filter((item) => item.collection === collection.id)
                      .map((item) => (
                        <button
                          className="library-item"
                          key={item.id}
                          style={
                            {
                              "--item-accent":
                                collectionAccents[collection.id] ?? ORANGE,
                            } as CSSProperties
                          }
                          onClick={() => void insertBlock(item)}
                          disabled={busy}
                        >
                          <strong>{item.name}</strong>
                          <span>{item.description}</span>
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </dialog>
      ) : null}
      {preview ? (
        <dialog
          ref={previewDialog}
          onCancel={() => setPreview(undefined)}
          className="preview"
          aria-label={`${preview.kind.toUpperCase()} export preview`}
        >
          <div className="preview-heading">
            <strong>{preview.kind.toUpperCase()} preview</strong>
            <button
              onClick={() => setPreview(undefined)}
              aria-label="Close export preview"
            >
              ×
            </button>
          </div>
          <p>
            24 px padding ·{" "}
            {background ? "drawing background" : "transparent background"}
            {preview.kind === "png"
              ? ` · ${scale}× resolution`
              : " · vector with embedded fonts and images"}
          </p>
          <div className="preview-image">
            <img src={preview.url} alt="Your drawing export" />
          </div>
          <button
            className="primary"
            onClick={() => download(preview.blob, `drawing.${preview.kind}`)}
          >
            Download {preview.kind.toUpperCase()}
          </button>
        </dialog>
      ) : null}
    </main>
  );
}
