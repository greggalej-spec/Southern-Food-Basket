import "@/styles/skeleton.css";

// Skeleton loaders (2026-11-16). Every signed-in page waits for hydration and the session before it can draw
// (lib/store.ts useRequireRole), and so do the pages that read the query string. Until then they show these shapes
// instead of an empty box. Each one copies the layout it stands in for, so nothing jumps when the real content
// arrives. Styles: styles/skeleton.css. The shapes are hidden from screen readers; the wrapper says "Loading".

type Size = { w?: string; h?: string };

function size({ w, h }: Size) {
  const s: Record<string, string> = {};
  if (w) s["--w"] = w;
  if (h) s["--h"] = h;
  return s as React.CSSProperties;
}

/** One grey shape. `line` is a line of text, `title` a heading, `block` a picture or chart, `round` an avatar,
 *  `pill` a button. */
export function Skel({ kind = "line", w, h, className }: Size & { kind?: "line" | "title" | "block" | "round" | "pill"; className?: string }) {
  return <span className={"skel skel-" + kind + (className ? " " + className : "")} style={size({ w, h })} aria-hidden="true" />;
}

/** The wrapper every skeleton sits in: marks the region busy and gives screen readers one word. */
export function SkelGroup({ label = "Loading", className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={"skel-group" + (className ? " " + className : "")} aria-busy="true" role="status">
      <span className="visually-hidden">{label}…</span>
      {children}
    </div>
  );
}

/** Lines of a paragraph, the last one short. */
function Lines({ n = 3 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Skel key={i} w={i === n - 1 ? "62%" : i % 2 ? "88%" : "96%"} />
      ))}
    </>
  );
}

/** Stat tiles, to drop straight into an existing `.stats` grid (the HR console keeps its own). */
export function SkelTiles({ n = 4 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div className="skel-tile" key={i} aria-hidden="true">
          <Skel w="54%" />
          <Skel kind="title" w="38%" h="1.9rem" />
          <Skel w="72%" />
        </div>
      ))}
    </>
  );
}

/** One list row: avatar, two lines, a button. */
function Row({ i }: { i: number }) {
  return (
    <div className="skel-row" aria-hidden="true">
      <Skel kind="round" />
      <div className="skel-stack">
        <Skel w={i % 2 ? "58%" : "74%"} />
        <Skel w={i % 2 ? "34%" : "46%"} />
      </div>
      <Skel kind="pill" w="64px" />
    </div>
  );
}

/** Rows for a panel body or list that is still waiting for its data. */
export function SkelRows({ rows = 3 }: { rows?: number }) {
  return (
    <SkelGroup className="skel-rows">
      {Array.from({ length: rows }, (_, i) => (
        <Row key={i} i={i} />
      ))}
    </SkelGroup>
  );
}

/** Rows for a <tbody> that is still waiting: one cell across the table, so the header keeps its columns. */
export function SkelTableRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr className="skel-tr" key={i} aria-hidden="true">
          <td colSpan={cols}>
            <Row i={i} />
          </td>
        </tr>
      ))}
    </>
  );
}

/** The HR applicant board's columns, each with a heading and two cards. */
export function BoardSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: cols }, (_, i) => (
        <section className="board-col skel-board-col" key={i} aria-hidden="true">
          <div className="board-col-head">
            <Skel w="48%" />
          </div>
          {Array.from({ length: i % 3 === 2 ? 1 : 2 }, (_, j) => (
            <div className="board-card skel-stack" key={j}>
              <Skel w="70%" />
              <Skel w="44%" />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

/** A panel: its header strip and a few rows, like the console's tables and lists. */
function SkelPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skel-panel" aria-hidden="true">
      <div className="skel-panel-head">
        <Skel kind="title" w="42%" />
      </div>
      <div className="skel-panel-body">
        {Array.from({ length: rows }, (_, i) => (
          <Row key={i} i={i} />
        ))}
      </div>
    </div>
  );
}

/** A staff page body: optionally its coloured page banner, a row of stat tiles, then panels two to a row.
 *  The office console draws its banner itself, so it asks for `head={false}`. */
export function AppSkeleton({ head = true, tiles = 4, panels = 2 }: { head?: boolean; tiles?: number; panels?: number }) {
  return (
    <SkelGroup className="skel-app">
      {head && (
        <div className="skel-band" aria-hidden="true">
          <Skel w="22%" />
          <Skel kind="title" w="46%" h="2rem" />
          <Skel w="64%" />
        </div>
      )}
      {tiles > 0 && (
        <div className="skel-tiles">
          <SkelTiles n={tiles} />
        </div>
      )}
      <div className="skel-panels">
        {Array.from({ length: panels }, (_, i) => (
          <SkelPanel key={i} rows={i ? 3 : 4} />
        ))}
      </div>
    </SkelGroup>
  );
}

/** A public page that waits for the session (the shopper's account): the page opening, then cards. The hero is the
 *  real `.page-hero`, so its colour, glass light and transom edge are there from the first frame. */
export function PublicSkeleton({ className }: { className?: string }) {
  return (
    <SkelGroup className={"skel-public" + (className ? " " + className : "")}>
      <div className="page-hero" aria-hidden="true">
        <div className="container skel-stack-lg">
          <Skel w="14%" />
          <Skel kind="title" w="min(100%, 520px)" h="2.75rem" />
          <Skel w="min(100%, 640px)" />
          <Skel w="min(80%, 420px)" />
        </div>
      </div>
      <div className="container section skel-public-body" aria-hidden="true">
        <div className="skel-tiles">
          <SkelTiles n={3} />
        </div>
        <SkelPanel rows={3} />
      </div>
    </SkelGroup>
  );
}

/** A form card: a title, a lede and fields. Sign-in, the outbox, the newsletter pages and the verify page. */
export function FormSkeleton({ fields = 2, className = "card" }: { fields?: number; className?: string }) {
  return (
    <SkelGroup className={"skel-form " + className}>
      <Skel kind="title" w="48%" />
      <Lines n={2} />
      {Array.from({ length: fields }, (_, i) => (
        <div className="skel-field" key={i} aria-hidden="true">
          <Skel w="30%" />
          <Skel kind="block" h="48px" className="skel-input" />
        </div>
      ))}
      <Skel kind="pill" w="148px" h="48px" />
    </SkelGroup>
  );
}

/** A careers role or its application form: the facts row, then the description in a card. */
export function JobSkeleton() {
  return (
    <SkelGroup className="skel-job">
      <div className="skel-chips" aria-hidden="true">
        <Skel kind="pill" w="120px" />
        <Skel kind="pill" w="96px" />
        <Skel kind="pill" w="132px" />
      </div>
      <div className="card skel-stack-lg">
        <Skel kind="title" w="40%" />
        <Lines n={4} />
        <Skel kind="title" w="32%" />
        <Lines n={3} />
      </div>
    </SkelGroup>
  );
}
