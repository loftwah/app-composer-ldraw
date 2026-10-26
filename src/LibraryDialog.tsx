import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { collections, type DiagramLibraryItem } from "./diagrams.mjs";
import {
  architectureCatalogue,
  portfolioProjects,
} from "./portfolio.mjs";
import { BlockPreview } from "./BlockPreview";
import {
  assetEntries,
  categoriesFor,
  entryKey,
  filterEntries,
  LIBRARY_FAVOURITES_KEY,
  LIBRARY_RECENT_KEY,
  pushRecent,
  readStringArray,
  statusTone,
  toggleFavourite,
  writeStringArray,
} from "./library.mjs";

type LibraryTab = "artwork" | "architecture" | "blocks";
type ArtworkEntry = (typeof assetEntries)[number];
type DiagramEntry = (typeof architectureCatalogue)[number];

type Props = {
  open: boolean;
  onClose: () => void;
  busy: boolean;
  blocks: DiagramLibraryItem[];
  onInsertArtwork: (
    item: ArtworkEntry,
    mode: "artwork" | "card",
  ) => Promise<void>;
  onInsertComposition: (item: ArtworkEntry) => Promise<void>;
  onOpenDiagram: (entry: DiagramEntry) => Promise<void>;
  onAddDiagram: (entry: DiagramEntry) => Promise<void>;
  onInsertBlock: (item: DiagramLibraryItem) => Promise<void>;
  onOpenPersonalLibrary: () => void;
};

const tabs: Array<{ key: LibraryTab; label: string }> = [
  { key: "artwork", label: "Artwork" },
  { key: "architecture", label: "Architecture" },
  { key: "blocks", label: "Blocks" },
];

const categoryEmoji: Record<string, string> = {
  logo: "◆",
  icon: "▣",
  character: "☺",
  mascot: "✦",
  screenshot: "▤",
  ui: "▥",
  background: "▧",
  diagram: "⌗",
  component: "◈",
  illustration: "✎",
  template: "▭",
};

function Status({ entry }: { entry: any }) {
  return (
    <em
      className={`status-badge status-${statusTone(entry.status)}`}
      title={entry.note}
    >
      {entry.statusLabel ?? entry.status}
    </em>
  );
}

function ProjectRail({
  entries,
  project,
  setProject,
  favourites,
  recent,
}: {
  entries: any[];
  project: string;
  setProject: (value: string) => void;
  favourites: Set<string>;
  recent: string[];
}) {
  const counts = new Map<string, number>();
  for (const entry of entries)
    counts.set(entry.project, (counts.get(entry.project) ?? 0) + 1);
  const groups = ["Apps", "Games", "Music", "Portfolio"];
  return (
    <nav className="project-rail" aria-label="Projects">
      <button
        className={project === "all" ? "active" : ""}
        aria-pressed={project === "all"}
        onClick={() => setProject("all")}
      >
        <span>All projects</span>
        <b>{entries.length}</b>
      </button>
      <button
        className={project === "favourites" ? "active" : ""}
        aria-pressed={project === "favourites"}
        onClick={() => setProject("favourites")}
      >
        <span>Favourites</span>
        <b>
          {
            entries.filter((entry) => favourites.has(entryKey(entry))).length
          }
        </b>
      </button>
      <button
        className={project === "recent" ? "active" : ""}
        aria-pressed={project === "recent"}
        onClick={() => setProject("recent")}
      >
        <span>Recently used</span>
        <b>{recent.length}</b>
      </button>
      {groups.map((group) => {
        const projects = portfolioProjects.filter(
          (item) => item.group === group,
        );
        return (
          <div className="project-group" key={group}>
            <span className="rail-heading">{group}</span>
            {projects.map((item) => {
              const count = counts.get(item.key) ?? 0;
              return (
                <button
                  key={item.key}
                  className={project === item.key ? "active" : ""}
                  aria-pressed={project === item.key}
                  onClick={() => setProject(item.key)}
                  title={
                    count
                      ? `${count} item${count === 1 ? "" : "s"}`
                      : "No cleared artwork in this tab; open Architecture"
                  }
                  style={{ "--rail-accent": item.accent } as CSSProperties}
                >
                  <span className="rail-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                  <b>{count}</b>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function LibraryDialog({
  open,
  onClose,
  busy,
  blocks,
  onInsertArtwork,
  onInsertComposition,
  onOpenDiagram,
  onAddDiagram,
  onInsertBlock,
  onOpenPersonalLibrary,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<LibraryTab>("artwork");
  const [project, setProject] = useState("all");
  const [category, setCategory] = useState("all");
  const [collection, setCollection] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [favourites, setFavourites] = useState<Set<string>>(
    () => new Set(readStringArray(LIBRARY_FAVOURITES_KEY)),
  );
  const [recent, setRecent] = useState<string[]>(() =>
    readStringArray(LIBRARY_RECENT_KEY),
  );

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
    if (open) setTimeout(() => search.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    writeStringArray(LIBRARY_FAVOURITES_KEY, [...favourites]);
  }, [favourites]);
  useEffect(() => {
    writeStringArray(LIBRARY_RECENT_KEY, recent);
  }, [recent]);

  const visibleArtwork = useMemo(
    () =>
      filterEntries(assetEntries, {
        project,
        category,
        query,
        favouriteIds: favourites,
        recentIds: recent,
      }),
    [project, category, query, favourites, recent],
  );

  const visibleDiagrams = useMemo(
    () =>
      filterEntries(architectureCatalogue, {
        project,
        category: "all",
        query,
        favouriteIds: favourites,
        recentIds: recent,
      }),
    [project, query, favourites, recent],
  );

  const visibleBlocks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return blocks.filter(
      (item) =>
        (collection === "all" || item.collection === collection) &&
        (!needle ||
          `${item.name} ${item.description} ${item.collection}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [blocks, collection, query]);

  const currentList =
    tab === "artwork"
      ? visibleArtwork
      : tab === "architecture"
        ? visibleDiagrams
        : visibleBlocks;

  useEffect(() => {
    const keys = new Set(currentList.map((entry: any) => entryKey(entry)));
    if (selectedKey && keys.has(selectedKey)) return;
    setSelectedKey(currentList.length ? entryKey(currentList[0] as any) : "");
  }, [currentList, selectedKey]);

  const selected: any =
    tab === "artwork"
      ? visibleArtwork.find((entry) => entryKey(entry) === selectedKey)
      : tab === "architecture"
        ? visibleDiagrams.find((entry) => entryKey(entry) === selectedKey)
        : visibleBlocks.find((entry) => entryKey(entry) === selectedKey);

  const remember = (entry: any) => {
    const key = entryKey(entry);
    setRecent((current) => pushRecent(current, key));
  };

  const insertArtwork = async (entry: ArtworkEntry, mode: "artwork" | "card") => {
    remember(entry);
    await onInsertArtwork(entry, mode);
  };

  const insertComposition = async (entry: ArtworkEntry) => {
    remember(entry);
    await onInsertComposition(entry);
  };

  const openDiagram = async (entry: DiagramEntry) => {
    remember(entry);
    await onOpenDiagram(entry);
  };

  const addDiagram = async (entry: DiagramEntry) => {
    remember(entry);
    await onAddDiagram(entry);
  };

  const insertBlock = async (entry: DiagramLibraryItem) => {
    remember(entry);
    await onInsertBlock(entry);
  };

  const toggleFav = (entry: any) => {
    setFavourites((current) => toggleFavourite(current, entryKey(entry)));
  };

  const blockCollections = useMemo(
    () => [...new Set(blocks.map((item) => item.collection))],
    [blocks],
  );
  const categories = categoriesFor(assetEntries);
  const count = currentList.length;

  return (
    <dialog
      ref={dialog}
      className="library-dialog"
      aria-label="LDraw portfolio library"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="library-shell">
        <header className="library-head">
          <div>
            <p className="library-kicker">YOUR COLLECTION, READY TO USE</p>
            <h2>Portfolio library</h2>
            <p>
              {assetEntries.length} real artwork and illustration assets ·{" "}
              {architectureCatalogue.length} source-verified architecture
              scenes · {blocks.length} editable blocks. Insert images
              standalone, as a card, as a composition or open a native diagram.
            </p>
          </div>
          <button
            className="library-close"
            onClick={onClose}
            aria-label="Close library"
          >
            ×
          </button>
        </header>

        <div className="library-controls">
          <label className="library-search">
            <span>Search</span>
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Project, character, logo, screenshot, use…"
            />
          </label>
          <div className="library-tabs" role="tablist" aria-label="Library type">
            {tabs.map((item) => (
              <button
                key={item.key}
                role="tab"
                aria-selected={tab === item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => {
                  setTab(item.key);
                  setProject("all");
                  setCategory("all");
                }}
              >
                {item.label}
                <span>
                  {item.key === "artwork"
                    ? assetEntries.length
                    : item.key === "architecture"
                      ? architectureCatalogue.length
                      : blocks.length}
                </span>
              </button>
            ))}
          </div>
          <span className="library-count" role="status">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="library-body">
          {tab === "blocks" ? (
            <nav className="project-rail" aria-label="Block collections">
              <button
                className={collection === "all" ? "active" : ""}
                aria-pressed={collection === "all"}
                onClick={() => setCollection("all")}
              >
                <span>All blocks</span>
                <b>{blocks.length}</b>
              </button>
              {blockCollections.map((key) => {
                const label =
                  collections.find((item) => item.id === key)?.label ?? key;
                return (
                  <button
                    key={key}
                    className={collection === key ? "active" : ""}
                    aria-pressed={collection === key}
                    onClick={() => setCollection(key)}
                  >
                    <span>{label}</span>
                    <b>
                      {blocks.filter((item) => item.collection === key).length}
                    </b>
                  </button>
                );
              })}
            </nav>
          ) : (
            <ProjectRail
              entries={tab === "artwork" ? assetEntries : architectureCatalogue}
              project={project}
              setProject={setProject}
              favourites={favourites}
              recent={recent}
            />
          )}

          <section className="library-results" aria-label="Library results">
            {tab === "artwork" ? (
              <div className="category-chips" aria-label="Filter by category">
                <button
                  className={category === "all" ? "active" : ""}
                  aria-pressed={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  All types
                </button>
                {categories.map((item) => (
                  <button
                    key={item.key}
                    className={category === item.key ? "active" : ""}
                    aria-pressed={category === item.key}
                    onClick={() => setCategory(item.key)}
                  >
                    <span aria-hidden="true">
                      {categoryEmoji[item.key] ?? "·"}
                    </span>
                    {item.label}
                    <b>{item.count}</b>
                  </button>
                ))}
              </div>
            ) : null}

            {tab === "artwork" && visibleArtwork.length ? (
              <div className="artwork-grid">
                {visibleArtwork.map((item) => (
                  <article
                    className={`asset-card ${selectedKey === entryKey(item) ? "selected" : ""}`}
                    key={entryKey(item)}
                    data-category={item.category}
                    style={
                      {
                        "--item-accent": item.accent,
                        "--item-tint": item.tint,
                      } as CSSProperties
                    }
                  >
                    <button
                      className="asset-select"
                      onClick={() => setSelectedKey(entryKey(item))}
                      onDoubleClick={() => void insertArtwork(item, "artwork")}
                      aria-label={`Preview ${item.title}, ${item.projectLabel}`}
                      title="Select to preview · double-click to insert artwork"
                    >
                      <span className="asset-thumb">
                        <img
                          src={item.thumb ?? item.file}
                          alt=""
                          loading="lazy"
                          width={item.width}
                          height={item.height}
                        />
                        {item.kind === "composition" ? (
                          <span className="asset-kind">16:9 composition</span>
                        ) : null}
                      </span>
                      <span className="asset-copy">
                        <strong>{item.title}</strong>
                        <span>
                          {item.projectLabel} · {item.subtitle}
                        </span>
                        <span className="asset-meta">
                          <Status entry={item} />
                          <span className="asset-category">
                            {categoryEmoji[item.category]}{" "}
                            {categories.find((c) => c.key === item.category)
                              ?.label ?? item.category}
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      className={`asset-favourite ${favourites.has(entryKey(item)) ? "active" : ""}`}
                      onClick={() => toggleFav(item)}
                      aria-label={
                        favourites.has(entryKey(item))
                          ? `Remove ${item.title} from favourites`
                          : `Add ${item.title} to favourites`
                      }
                      title="Favourite"
                    >
                      {favourites.has(entryKey(item)) ? "★" : "☆"}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === "architecture" && visibleDiagrams.length ? (
              <div className="diagram-grid">
                {visibleDiagrams.map((item) => (
                  <article
                    className={`diagram-card ${selectedKey === entryKey(item) ? "selected" : ""}`}
                    key={entryKey(item)}
                  >
                    <button
                      className="asset-select"
                      onClick={() => setSelectedKey(entryKey(item))}
                      onDoubleClick={() => void openDiagram(item)}
                      aria-label={`Preview ${item.title} architecture`}
                      title="Select to inspect · double-click to open"
                    >
                      <span className="diagram-thumb">
                        <img src={item.preview} alt="" loading="lazy" />
                      </span>
                      <span className="asset-copy">
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                        <span className="asset-meta">
                          <em className="status-badge status-good">
                            Source-verified
                          </em>
                          <span className="asset-category">
                            {item.elements} elements · {item.reviewedAt}
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      className={`asset-favourite ${favourites.has(entryKey(item)) ? "active" : ""}`}
                      onClick={() => toggleFav(item)}
                      aria-label={`Favourite ${item.title} architecture`}
                      title="Favourite"
                    >
                      {favourites.has(entryKey(item)) ? "★" : "☆"}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === "blocks" && visibleBlocks.length ? (
              <div className="block-grid">
                {visibleBlocks.map((item) => (
                  <article
                    className={`block-card ${selectedKey === entryKey(item) ? "selected" : ""}`}
                    key={entryKey(item)}
                  >
                    <button
                      className="asset-select"
                      onClick={() => setSelectedKey(entryKey(item))}
                      onDoubleClick={() => void insertBlock(item)}
                      aria-label={`Preview ${item.name} block`}
                    >
                      <BlockPreview item={item} />
                      <span className="asset-copy">
                        <strong>{item.name}</strong>
                        <span>{item.description}</span>
                      </span>
                    </button>
                    <button
                      className={`asset-favourite ${favourites.has(entryKey(item)) ? "active" : ""}`}
                      onClick={() => toggleFav(item)}
                      aria-label={`Favourite ${item.name} block`}
                      title="Favourite"
                    >
                      {favourites.has(entryKey(item)) ? "★" : "☆"}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {!currentList.length ? (
              <div className="library-empty">
                {project === "favourites" ? (
                  <>
                    <strong>No favourites yet.</strong>
                    <p>Star an asset, diagram or block to keep it here.</p>
                  </>
                ) : project === "recent" ? (
                  <>
                    <strong>Nothing used yet.</strong>
                    <p>Inserted assets appear here for a quick return.</p>
                  </>
                ) : project === "pirates" && tab === "artwork" ? (
                  <>
                    <strong>No cleared artwork.</strong>
                    <p>
                      Pirates depends on third-party source art that is not
                      cleared for reuse. Open Architecture for its
                      source-verified system model.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>No match for “{query}”.</strong>
                    <p>Try another project, category or search term.</p>
                  </>
                )}
              </div>
            ) : null}
          </section>

          <aside className="library-preview" aria-live="polite">
            {selected ? (
              <>
                <div className="preview-media">
                  {tab === "blocks" ? (
                    <BlockPreview item={selected} />
                  ) : (
                    <img
                      src={
                        tab === "architecture"
                          ? selected.preview
                          : (selected.file ?? selected.preview)
                      }
                      alt=""
                    />
                  )}
                </div>
                <div className="preview-copy">
                  <div className="preview-title">
                    <span>
                      {tab === "architecture"
                        ? "Architecture"
                        : selected.projectLabel ?? "Block"}
                    </span>
                    <button
                      className={`asset-favourite ${favourites.has(entryKey(selected)) ? "active" : ""}`}
                      onClick={() => toggleFav(selected)}
                      aria-label="Toggle favourite"
                      title="Favourite"
                    >
                      {favourites.has(entryKey(selected)) ? "★" : "☆"}
                    </button>
                  </div>
                  <h3>{selected.title ?? selected.name}</h3>
                  <p className="preview-subtitle">
                    {selected.subtitle ?? selected.summary ?? selected.description}
                  </p>
                  {tab !== "blocks" ? <Status entry={selected} /> : null}
                  {tab === "artwork" ? (
                    <p className="preview-use">{selected.use}</p>
                  ) : null}
                  {tab === "architecture" ? (
                    <>
                      <dl className="preview-facts">
                        <div>
                          <dt>Reviewed</dt>
                          <dd>{selected.reviewedAt}</dd>
                        </div>
                        <div>
                          <dt>Coverage</dt>
                          <dd>{selected.coverage}</dd>
                        </div>
                        <div>
                          <dt>Elements</dt>
                          <dd>{selected.elements}</dd>
                        </div>
                        <div>
                          <dt>Source</dt>
                          <dd>
                            <code>{selected.primarySourceRepo}</code> at{" "}
                            <code>{selected.sourceRevision.slice(0, 8)}</code>
                          </dd>
                        </div>
                      </dl>
                      <ul className="preview-facts-list">
                        {selected.facts.map((fact: string) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  <div className="preview-actions">
                    {tab === "artwork" && selected.kind === "composition" ? (
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() => void insertComposition(selected)}
                      >
                        Insert composition
                      </button>
                    ) : tab === "artwork" ? (
                      <>
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={() => void insertArtwork(selected, "artwork")}
                        >
                          Insert artwork
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void insertArtwork(selected, "card")}
                        >
                          Insert as card
                        </button>
                      </>
                    ) : tab === "architecture" ? (
                      <>
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={() => void openDiagram(selected)}
                        >
                          Open diagram
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void addDiagram(selected)}
                        >
                          Add to canvas
                        </button>
                      </>
                    ) : (
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() => void insertBlock(selected)}
                      >
                        Insert block
                      </button>
                    )}
                  </div>

                  {tab === "architecture" ? (
                    <p className="preview-note">
                      Opening replaces the current canvas after confirmation.
                      Add to canvas copies the scene with fresh IDs at your
                      current viewport. Save an editable copy first if you want
                      both.
                    </p>
                  ) : null}

                  {tab !== "blocks" ? (
                    <details className="preview-provenance">
                      <summary>Provenance and status</summary>
                      <p>{selected.note ?? selected.summary}</p>
                      <dl>
                        <div>
                          <dt>Credit</dt>
                          <dd>{selected.credit}</dd>
                        </div>
                        {selected.source ? (
                          <div>
                            <dt>Source</dt>
                            <dd>
                              <code>{selected.source}</code>
                            </dd>
                          </div>
                        ) : null}
                        {selected.sourceSha ? (
                          <div>
                            <dt>Source SHA-256</dt>
                            <dd>
                              <code>{selected.sourceSha}</code>
                            </dd>
                          </div>
                        ) : null}
                        {selected.derivativeSha ? (
                          <div>
                            <dt>Local bytes SHA-256</dt>
                            <dd>
                              <code>{selected.derivativeSha}</code>
                            </dd>
                          </div>
                        ) : null}
                        {selected.scene ? (
                          <div>
                            <dt>Native scene</dt>
                            <dd>
                              <code>{selected.scene}</code>
                            </dd>
                          </div>
                        ) : null}
                        {selected.sceneSha256 ? (
                          <div>
                            <dt>Scene SHA-256</dt>
                            <dd>
                              <code>{selected.sceneSha256}</code>
                            </dd>
                          </div>
                        ) : null}
                        {selected.sources ? (
                          <div>
                            <dt>Verified from</dt>
                            <dd>
                              <ul>
                                {selected.sources.map((source: string) => (
                                  <li key={source}>
                                    <code>{source}</code>
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        ) : null}
                        {selected.humanReview ? (
                          <div>
                            <dt>Human review</dt>
                            <dd>{selected.humanReview}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </details>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="library-empty preview-empty">
                <strong>Pick something to preview.</strong>
                <p>
                  Every asset states its project, intended use and honest
                  approval status before it reaches the canvas.
                </p>
              </div>
            )}
          </aside>
        </div>

        <footer className="library-foot">
          <span>
            Images are embedded locally. Nothing is uploaded or fetched from a
            remote service.
          </span>
          <span className="foot-actions">
            <button onClick={onOpenPersonalLibrary}>
              Personal library
            </button>
            <span>
              <kbd>Shift</kbd> + <kbd>L</kbd> opens this library ·{" "}
              <kbd>Esc</kbd> closes
            </span>
          </span>
        </footer>
      </div>
    </dialog>
  );
}
