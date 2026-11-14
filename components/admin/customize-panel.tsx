"use client";

import { act } from "@/components/admin/bits";
import { SKINS, useStaffSkin, useStaffTheme } from "@/components/theme-toggle";
import { personName } from "@/lib/admin/guard";
import { todayIso } from "@/lib/admin/helpers";
import { fmtDate } from "@/lib/format";
import { SEASONS, SEASON_IDS, applyLook, lookLabel, restoreSiteVersion } from "@/lib/ops/site";
import { useData, useSession } from "@/lib/store";
import type { SeasonId } from "@/lib/types";

/* Customize (Gregg, 14 Nov 2026): one clear page for how things look.
     1. The website's look: the everyday site and every seasonal look as a card. Preview opens the real site wearing
        it, without changing anything; "Use this look" puts it on for every visitor.
     2. This console: light or dark, and the background the cards sit on (solid page colours; photo-and-glass is one option).
     3. Versions: every change made here keeps the look it replaced, so an earlier version can be put back.
   The finer settings (dates, the greeting, the notice bar, the home page bands) stay in the Website studio. */

const EVERYDAY: [string, string][] = [["Raspberry", "#D92C66"], ["Leaf", "#1D6B35"], ["Sun", "#FFD21A"], ["Teal", "#2F918A"]];

export function CustomizePanel() {
  const d = useData();
  const s = useSession();
  const [theme, setTheme] = useStaffTheme();
  const [skin, setSkin] = useStaffSkin();
  const site = d.site;
  const wearing: SeasonId = site.season.mode === "off" ? "none" : site.season.id;
  const today = todayIso();
  const versions = d.siteVersions || [];

  const use = (id: SeasonId) => act(s, "site.customize", id === "none" ? "Everyday look" : SEASONS[id].name, () => applyLook(s, id, today), id === "none" ? "The website is back to its everyday look." : "The website is now wearing " + SEASONS[id].name + ".");

  const looks: { id: SeasonId; name: string; blurb: string; palette: [string, string][] }[] = [
    { id: "none", name: "Everyday", blurb: "The standard site: store-glass dividers, pink and green, no seasonal dressing.", palette: EVERYDAY },
    ...SEASON_IDS.map((id) => ({ id: id as SeasonId, name: SEASONS[id].name, blurb: SEASONS[id].blurb, palette: SEASONS[id].palette })),
  ];

  return (
    <div className="section-stack cz">
      <section className="panel cz-now" aria-label="What the website is wearing">
        <div>
          <p className="cz-eyebrow">The website is wearing</p>
          <h2>{lookLabel(site)}</h2>
        </div>
        <a className="btn btn-outline btn-sm" href="/" target="_blank" rel="noopener">
          Open the website<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </section>

      <section aria-labelledby="cz-looks">
        <h2 className="cz-h" id="cz-looks">
          1. The website’s look
        </h2>
        <p className="cz-sub">Preview shows the real site in that look without changing anything. “Use this look” puts it on for every visitor.</p>
        <div className="cz-grid">
          {looks.map((l) => {
            const on = l.id === wearing;
            return (
              <article key={l.id} className={"cz-card" + (on ? " is-on" : "")}>
                <div className="cz-swatches" aria-hidden="true">
                  {l.palette.map(([name, hex]) => (
                    <i key={name} style={{ background: hex }} />
                  ))}
                </div>
                <div className="cz-body">
                  <h3>
                    {l.name}
                    {on ? <span className="cz-badge">On now</span> : null}
                  </h3>
                  <p>{l.blurb}</p>
                  <ul className="cz-colours" aria-label={"Colours of " + l.name}>
                    {l.palette.map(([name, hex]) => (
                      <li key={name}>
                        <i style={{ background: hex }} />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="cz-acts">
                  <a className="btn btn-outline btn-sm" href={l.id === "none" ? "/?season=none" : "/?season=" + l.id + "&greeting=" + encodeURIComponent(SEASONS[l.id as Exclude<SeasonId, "none">].greeting)} target="_blank" rel="noopener">
                    Preview<span className="visually-hidden">{" " + l.name + " (opens in a new tab)"}</span>
                  </a>
                  <button className="btn btn-primary btn-sm" type="button" disabled={on} onClick={() => use(l.id)}>
                    {on ? "In use" : "Use this look"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="small muted">
          Dates, the greeting, the notice bar and the home page bands are in the <a href="/admin#studio">Website studio</a>.
        </p>
      </section>

      <section aria-labelledby="cz-console">
        <h2 className="cz-h" id="cz-console">
          2. This console
        </h2>
        <p className="cz-sub">How the staff side looks on this device: light or dark, and the background the cards sit on.</p>
        <div className="cz-themes">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" className={"cz-theme is-" + t + (theme === t ? " is-on" : "")} aria-pressed={theme === t} onClick={() => setTheme(t)}>
              <span className="cz-theme-art" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <b>{t === "light" ? "Light" : "Dark"}</b>
              <small>{t === "light" ? "Cream page, white panels" : "Deep green page, gold accents"}</small>
            </button>
          ))}
        </div>
        <h3 className="cz-h3">Background</h3>
        <div className="cz-skins" role="group" aria-label="Console background">
          {SKINS.map((k) => (
            <button key={k.id} type="button" className={"cz-skin" + (skin === k.id ? " is-on" : "") + (k.id === "glass" ? " is-glass" : "")} aria-pressed={skin === k.id} onClick={() => setSkin(k.id)}>
              <span className="cz-skin-art" aria-hidden="true" style={{ background: theme === "dark" ? k.dark : k.light }}>
                <i />
                <i />
              </span>
              <b>{k.name}</b>
              <small>{k.note}</small>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="cz-versions">
        <h2 className="cz-h" id="cz-versions">
          3. Versions
        </h2>
        <p className="cz-sub">Each change made on this page keeps the look it replaced. Restore puts that look back, and keeps today’s as a version too.</p>
        <div className="panel">
          {versions.length ? (
            <ol className="cz-versions">
              {versions.map((v) => (
                <li key={v.id}>
                  <div className="grow">
                    <strong>{v.label}</strong>
                    <span className="meta">{"Replaced on " + fmtDate(v.at.slice(0, 10)) + (v.by ? " by " + personName(d, v.by) : "")}</span>
                  </div>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => act(s, "site.customize", v.label, () => restoreSiteVersion(s, v.id), "Restored: " + v.label + ".")}>
                    Restore
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="panel-empty">No earlier versions yet. Choose a look above and the one it replaces is kept here.</p>
          )}
        </div>
      </section>
    </div>
  );
}
