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
  mergeLibraryItems,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { INK, librarySpecs } from "./diagrams.mjs";
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
  centerElements,
  fitSize,
  maxArtworkSize,
  placeNearViewport,
  sceneElementsForAdd,
} from "./insertion.mjs";
import { LibraryDialog } from "./LibraryDialog";
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
type Preview = { url: string; blob: Blob; kind: ExportKind; padding: number };
export type LocalAPI = {
  readScene: () => { revision: string; scene: NativeScene };
  readViewport: () => {
    scrollX: number;
    scrollY: number;
    zoom: number;
    width: number;
    height: number;
  };
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
const PERSONAL_LIBRARY_KEY = "ldraw:personal-library:v1";
function readPersonalLibrary(): any[] | null {
  try {
    const value = JSON.parse(localStorage.getItem(PERSONAL_LIBRARY_KEY) ?? "null");
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
function rememberPersonalLibrary(items: readonly any[]) {
  try {
    localStorage.setItem(PERSONAL_LIBRARY_KEY, JSON.stringify(items));
  } catch {
    // A full quota must not break drawing or the native library in this tab.
  }
}
const composerReturn = new URL("https://composer.loftwah.com/");
for (const key of ["analytics", "qa"]) {
  const value = new URLSearchParams(window.location.search).get(key);
  if (value !== null) composerReturn.searchParams.set(key, value);
}

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The local artwork could not be read."));
    reader.readAsDataURL(blob);
  });
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
  const [notice, setNotice] = useState("");
  const [presenting, setPresenting] = useState(false);
  const theme: ResolvedTheme = resolveTheme(appearance, prefersDark);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const workspace = useRef<HTMLElement>(null);
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
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent) =>
      setPrefersDark(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const initialData = useMemo(() => {
    const builtIns = makeLibraryItems();
    const stored = readPersonalLibrary();
    return {
      appState: {
        // Excalidraw's dark theme inverts the rendered canvas. A white scene
        // background is therefore the readable dark canvas, and keeps the
        // saved scene portable between both appearances.
        viewBackgroundColor: "#ffffff",
        theme: themeRef.current,
      },
      // Loading items through initialData avoids the startup race where a
      // later empty storage read can overwrite an earlier updateLibrary merge.
      libraryItems: stored ? mergeLibraryItems(stored, builtIns) : builtIns,
    };
  }, []);

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
      const presentation = elements.some(
        (element) => (element.customData as any)?.ldrawPresentation === true,
      );
      const padding = presentation ? 0 : 24;
      const options = {
        elements,
        files: api.getFiles(),
        appState: {
          ...api.getAppState(),
          exportBackground: backgroundRef.current,
          exportEmbedScene: false,
        },
        exportPadding: padding,
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
    if (!ready || !api) return;
    const local: LocalAPI = {
      readScene: capture,
      readViewport: () => {
        const state = api.getAppState();
        return {
          scrollX: state.scrollX,
          scrollY: state.scrollY,
          zoom: state.zoom.value,
          width: state.width,
          height: state.height,
        };
      },
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
    document.body.classList.toggle("presenting", presenting);
    if (presenting) {
      const timer = setTimeout(
        () => api?.scrollToContent(undefined, { fitToContent: true }),
        120,
      );
      return () => clearTimeout(timer);
    }
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    document.body.classList.remove("presenting");
  }, [presenting, api]);

  useEffect(() => {
    const fullscreen = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select, [contenteditable=true]") &&
        !(event.metaKey || event.ctrlKey)
      )
        return;
      if (event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setLibraryOpen(true);
      }
      if (event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPresenting((current) => !current);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveEditable();
      }
      if (event.key === "Escape") setPresenting(false);
    };
    document.addEventListener("fullscreenchange", fullscreen);
    document.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreen);
      document.removeEventListener("keydown", shortcut);
    };
  }, [presenting, api, ready]);

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
      const presentation = api
        ?.getSceneElements()
        .some(
          (element) => (element.customData as any)?.ldrawPresentation === true,
        );
      setPreview({
        blob,
        kind,
        padding: presentation ? 0 : 24,
        url: URL.createObjectURL(blob),
      });
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
      const ink = isDarkBackground(api.getAppState().viewBackgroundColor)
        ? "#F4F4F5"
        : INK;
      const inserted = placeNearViewport(
        makePreset(preset, project, 0, ink),
        api.getAppState(),
        existing,
      );
      api.updateScene({
        elements: [...existing, ...inserted],
        appState: {
          selectedElementIds: Object.fromEntries(
            inserted.map((element: any) => [element.id, true]),
          ),
        },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      fitIfNeeded(inserted);
      setNotice(`Inserted the ${presets[preset].label} example`);
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

  function fitIfNeeded(elements: any[]) {
    if (!api || !elements.length) return;
    const state = api.getAppState();
    const zoom = state.zoom.value || 1;
    const left = Math.min(...elements.map((element) => element.x));
    const top = Math.min(...elements.map((element) => element.y));
    const right = Math.max(
      ...elements.map((element) => element.x + element.width),
    );
    const bottom = Math.max(
      ...elements.map((element) => element.y + element.height),
    );
    const viewportWidth = state.width / zoom;
    const viewportHeight = state.height / zoom;
    if (right - left > viewportWidth * 0.86 || bottom - top > viewportHeight * 0.86)
      api.scrollToContent(elements, { fitToContent: true });
  }

  function commitInserted(
    inserted: any[],
    label: string,
    options: { fit?: boolean } = {},
  ) {
    if (!api || !inserted.length) return;
    const existing = api.getSceneElementsIncludingDeleted();
    api.updateScene({
      elements: [...existing, ...inserted],
      appState: {
        selectedElementIds: Object.fromEntries(
          inserted.map((element: any) => [element.id, true]),
        ),
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    if (options.fit) fitIfNeeded(inserted);
    setNotice(`Inserted ${label}`);
    setLibraryOpen(false);
  }

  async function insertBlock(item: any) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      const inserted = placeNearViewport(
        convertToExcalidrawElements(item.elements),
        api.getAppState(),
        api.getSceneElementsIncludingDeleted(),
      );
      commitInserted(inserted, item.name, { fit: true });
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

  function artworkCustomData(item: any) {
    return {
      ldrawArtworkId: item.id,
      ldrawProject: item.project,
      ldrawCategory: item.category,
      ldrawStatus: item.status,
      ldrawStatusLabel: item.statusLabel,
      ldrawSource: item.source,
      ldrawSourceSha256: item.sourceSha,
      ldrawDerivativeSha256: item.derivativeSha,
      ldrawUse: item.use,
    };
  }

  async function insertArtwork(
    item: any,
    mode: "artwork" | "card" = "artwork",
  ) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      const response = await fetch(item.file);
      if (!response.ok)
        throw new Error(
          "The local artwork is unavailable. Your drawing is unchanged.",
        );
      const blob = await response.blob();
      const dataURL = await readDataUrl(blob);
      const fileId = crypto.randomUUID();
      api.addFiles([
        {
          id: fileId as any,
          dataURL,
          mimeType: blob.type || "image/webp",
          created: Date.now(),
          lastRetrieved: Date.now(),
          version: 1,
        } as any,
      ]);
      const limits = maxArtworkSize(item.category);
      const image = fitSize(
        item.width,
        item.height,
        limits.width,
        limits.height,
      );
      let inserted: any[];
      if (mode === "card") {
        const groupId = crypto.randomUUID();
        const imageWidth = Math.min(image.width, 380);
        const imageHeight = imageWidth * (item.height / item.width);
        const width = Math.max(320, imageWidth + 48);
        const height = imageHeight + 122;
        inserted = convertToExcalidrawElements([
          {
            type: "rectangle",
            x: 0,
            y: 0,
            width,
            height,
            strokeColor: item.accent,
            backgroundColor: item.tint,
            fillStyle: "solid",
            strokeWidth: 2,
            roundness: { type: 3 },
            roughness: 0,
            groupIds: [groupId],
            customData: artworkCustomData(item),
          },
          {
            type: "image",
            x: 24,
            y: 24,
            width: imageWidth,
            height: imageHeight,
            fileId: fileId as any,
            status: "saved",
            scale: [1, 1],
            crop: null,
            groupIds: [groupId],
            customData: artworkCustomData(item),
          },
          {
            type: "text",
            x: 24,
            y: imageHeight + 40,
            text: item.title,
            fontSize: 20,
            fontFamily: 5,
            strokeColor: INK,
            groupIds: [groupId],
          },
          {
            type: "text",
            x: 24,
            y: imageHeight + 68,
            text: item.subtitle,
            fontSize: 12,
            fontFamily: 5,
            strokeColor: "#6B645C",
            groupIds: [groupId],
          },
          {
            type: "text",
            x: 24,
            y: height - 24,
            text: `${item.projectLabel} · ${item.statusLabel}`,
            fontSize: 9,
            fontFamily: 5,
            strokeColor: item.accent,
            groupIds: [groupId],
          },
        ]);
      } else {
        inserted = convertToExcalidrawElements([
          {
            type: "image",
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
            fileId: fileId as any,
            status: "saved",
            scale: [1, 1],
            crop: null,
            customData: artworkCustomData(item),
          },
        ]);
      }
      const placed = placeNearViewport(
        inserted,
        api.getAppState(),
        api.getSceneElementsIncludingDeleted(),
      );
      commitInserted(placed, item.title, {
        fit: mode === "card" || item.category === "background",
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The artwork could not be inserted. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function insertComposition(item: any) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      const response = await fetch(item.scene);
      if (!response.ok)
        throw new Error(
          "The local composition is unavailable. Your drawing is unchanged.",
        );
      const scene = validateScene(await response.text());
      const copy = sceneElementsForAdd(
        scene,
        api.getAppState(),
        `composition-${crypto.randomUUID().slice(0, 8)}-`,
      );
      if (Object.keys(copy.files ?? {}).length)
        api.addFiles(Object.values(copy.files));
      commitInserted(copy.elements, item.title, { fit: true });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The composition could not be inserted. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openDiagram(entry: any) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      const current = api.getSceneElements().filter((element) => !element.isDeleted);
      if (
        current.length &&
        !window.confirm(
          "Open this architecture diagram in place of the current drawing? Download an editable copy first if you want to keep both.",
        )
      )
        return;
      const response = await fetch(entry.scene);
      if (!response.ok)
        throw new Error(
          "The local diagram is unavailable. Your drawing is unchanged.",
        );
      const scene = validateScene(await response.text());
      await replace(scene, capture().revision);
      setError("");
      setNotice(`Opened ${entry.title} architecture`);
      setLibraryOpen(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The diagram could not be opened. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addDiagram(entry: any) {
    if (!api || !ready || busy) return;
    setBusy(true);
    try {
      const response = await fetch(entry.scene);
      if (!response.ok)
        throw new Error(
          "The local diagram is unavailable. Your drawing is unchanged.",
        );
      const scene = validateScene(await response.text());
      const copy = sceneElementsForAdd(
        scene,
        api.getAppState(),
        `diagram-${crypto.randomUUID().slice(0, 8)}-`,
      );
      if (Object.keys(copy.files ?? {}).length)
        api.addFiles(Object.values(copy.files));
      commitInserted(copy.elements, entry.title, { fit: true });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The diagram could not be added. Your drawing is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }

  function saveEditable() {
    try {
      if (!api) throw new Error("The editor is still opening.");
      download(
        new Blob(
          [
            serializeAsJSON(
              api.getSceneElementsIncludingDeleted(),
              api.getAppState(),
              api.getFiles(),
              "local",
            ),
          ],
          { type: "application/json" },
        ),
        "drawing.excalidraw",
      );
      setNotice("Saved an editable .excalidraw download");
    } catch (failure) {
      setError(String(failure));
    }
  }

  async function newDrawing() {
    if (!api || !ready) return;
    if (
      !window.confirm(
        "Start a new drawing? Download an editable copy first if you want to keep this one.",
      )
    )
      return;
    setBusy(true);
    try {
      await replace(
        {
          type: "excalidraw",
          version: 2,
          source: "local",
          elements: [],
          appState: { viewBackgroundColor: "#ffffff" },
          files: {},
        },
        capture().revision,
      );
      api.history.clear();
      setError("");
      setNotice("Started a new local drawing");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The new drawing could not be started.",
      );
    } finally {
      setBusy(false);
    }
  }

  function present() {
    if (!ready) return;
    setPresenting((current) => {
      const next = !current;
      if (next)
        void workspace.current?.requestFullscreen?.().catch(() => {
          // Presentation still works in-page when fullscreen is refused.
        });
      return next;
    });
  }

  function fitView() {
    api?.scrollToContent(undefined, { fitToContent: true });
  }

  function openPersonalLibrary() {
    setLibraryOpen(false);
    setTimeout(() => api?.toggleSidebar({ name: "default", tab: "library", force: true }), 80);
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
    <main className={`workspace ${presenting ? "presenting" : ""}`} ref={workspace}>
      <header className="toolbar" aria-label="LDraw drawing actions">
        <div className="toolbar-identity">
          <a
            className="composer-return"
            href={composerReturn.href}
            aria-label="Return to App Composer"
            title="Return to App Composer"
          >
            <img src="/brand/composer-mark.svg" alt="" width="28" height="28" />
          </a>
          <div className="identity">
            <strong>
              <img src="/brand/ldraw-mark.svg" alt="" width="24" height="24" />
              LDraw
            </strong>
            <span>portfolio workspace</span>
          </div>
        </div>
        <div className="toolbar-group primary-actions">
          <button
            className="primary"
            onClick={() => setLibraryOpen(true)}
            disabled={!ready || busy}
            title="Portfolio artwork, architecture and blocks (Shift+L)"
            aria-haspopup="dialog"
            aria-keyshortcuts="Shift+L"
          >
            Portfolio
          </button>
          <button
            onClick={present}
            disabled={!ready}
            title="Clean presentation view (Shift+P)"
            aria-keyshortcuts="Shift+P"
          >
            {presenting ? "Exit present" : "Present"}
          </button>
        </div>
        <div className="toolbar-group file-actions">
          <button onClick={() => void newDrawing()} disabled={!ready || busy}>
            New
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={!ready || busy}
          >
            Open
          </button>
          <button
            onClick={saveEditable}
            disabled={!ready}
            title="Download an editable .excalidraw file (Cmd/Ctrl+S)"
            aria-keyshortcuts="Meta+S Control+S"
          >
            Save editable
          </button>
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
        </div>
        <div className="toolbar-group start-actions">
          <label>
            Colour
            <select
              aria-label="New content"
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
        </div>
        <div className="toolbar-group export-actions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={background}
              onChange={(event) => setBackground(event.target.checked)}
            />
            Background
          </label>
          <label>
            PNG
            <select
              aria-label="PNG scale"
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
            >
              <option value={1}>1× · 1080p</option>
              <option value={2}>2× · retina</option>
              <option value={3}>3× · print</option>
            </select>
          </label>
          <button
            onClick={() => void previewExport("png")}
            disabled={!ready || busy}
          >
            Export PNG
          </button>
          <button
            onClick={() => void previewExport("svg")}
            disabled={!ready || busy}
          >
            Export SVG
          </button>
        </div>
        <div className="toolbar-group appearance-actions">
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
      {notice ? (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      ) : null}
      <section className="canvas" aria-label="Drawing canvas">
        <Excalidraw
          theme={presenting ? "light" : theme}
          initialData={initialData}
          viewModeEnabled={presenting || !ready}
          zenModeEnabled={presenting}
          excalidrawAPI={setApi}
          onChange={(elements, appState, files) => {
            if (initialized.current && ready)
              observe(serializeAsJSON(elements, appState, files, "local"));
          }}
          onLibraryChange={rememberPersonalLibrary}
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
        {presenting ? (
          <div className="present-hud" role="status">
            <span>
              <b>LDraw</b> · present
            </span>
            <span className="present-hint">
              Scroll to pan · pinch or Ctrl/⌘ scroll to zoom
            </span>
            <div>
              <button onClick={fitView}>Fit</button>
              <button onClick={present}>Exit present</button>
            </div>
          </div>
        ) : null}
      </section>
      <LibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        busy={busy}
        blocks={librarySpecs.filter((item: any) => item.native !== false && !item.composition)}
        onInsertArtwork={insertArtwork}
        onInsertComposition={insertComposition}
        onOpenDiagram={openDiagram}
        onAddDiagram={addDiagram}
        onInsertBlock={insertBlock}
        onOpenPersonalLibrary={openPersonalLibrary}
      />
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
            {preview.padding} px padding ·{" "}
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
