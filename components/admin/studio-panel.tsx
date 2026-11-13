"use client";

import { useState } from "react";
import { Seg, act } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { fmtDate } from "@/lib/format";
import { BANDS, SEASONS, SEASON_IDS, SEASON_SHEETS, activeSeason, saveSite, seasonState } from "@/lib/ops/site";
import { ART, ART_NAMES, artUri } from "@/lib/season-art";
import { useData, useSession } from "@/lib/store";
import type { SeasonId, SiteConfig } from "@/lib/types";

/* The website studio: the changes the team should be able to make without a developer. A seasonal look is a layer
   of colour and ornament over the everyday site (styles/season.css): choose one, see it on the real pages, then put
   it on now or between two dates. Below it, the notice bar and the home page's bands. Every change is logged. */

const PAGES = [
  { id: "/", label: "Home" },
  { id: "/specials", label: "Specials" },
  { id: "/locations", label: "Stores" },
  { id: "/careers", label: "Careers" },
];

export function StudioPanel() {
  const d = useData();
  const s = useSession();
  const site = d.site;
  const [now] = useState(() => Date.now());
  const wearing = activeSeason(site, now);
  const state = seasonState(site, now);
  const [pick, setPick] = useState<SeasonId>(site.season.id === "none" ? "christmas" : site.season.id);
  const [from, setFrom] = useState(site.season.from);
  const [to, setTo] = useState(site.season.to);
  const [lights, setLights] = useState(site.season.lights);
  const [greeting, setGreeting] = useState(site.season.greeting);
  const [device, setDevice] = useState<"phone" | "desktop">("desktop");
  const [page, setPage] = useState("/");
  const [notice, setNotice] = useState(site.notice);
  const [tick, setTick] = useState(0);

  function choose(id: SeasonId) {
    setPick(id);
    if (id !== "none") setGreeting(SEASONS[id].greeting);
  }
  function commit(mode: SiteConfig["season"]["mode"], what: string, done: string) {
    if (mode === "dates" && (!from || !to || to < from)) return act(s, "site.customize", "Website", () => { throw new Error("Choose the first and last day, in that order."); });
    const next: SiteConfig = { ...site, season: { id: pick, mode: pick === "none" ? "off" : mode, from, to, lights, greeting: greeting.trim() } };
    if (act(s, "site.customize", "Website", () => saveSite(s, next, what), done)) setTick((t) => t + 1);
  }
  function saveNotice(e: React.FormEvent) {
    e.preventDefault();
    const n = { ...notice, text: notice.text.trim(), linkLabel: notice.linkLabel.trim() };
    if (act(s, "site.customize", "Website", () => saveSite(s, { ...site, notice: n }, n.on && n.text ? "Notice bar: “" + n.text + "”" : "Notice bar switched off"), n.on && n.text ? "The notice is on every public page." : "Notice bar is off.")) setTick((t) => t + 1);
  }
  function toggleBand(id: string, show: boolean) {
    const hidden = show ? site.hiddenBands.filter((x) => x !== id) : [...site.hiddenBands, id];
    const label = BANDS.find((b) => b.id === id)?.label || id;
    if (act(s, "site.customize", "Website", () => saveSite(s, { ...site, hiddenBands: hidden }, (show ? "Showing" : "Hiding") + " the home page’s " + label.toLowerCase()), show ? label + " is back on the home page." : label + " is off the home page.")) setTick((t) => t + 1);
  }

  const src = page + "?season=" + pick + (lights ? "" : "&lights=0") + "&greeting=" + encodeURIComponent(greeting) + "&v=" + tick;
  const sameAsLive = pick === site.season.id && site.season.mode !== "off";

  return (
    <div className="section-stack">
      <Flow id="studio" />

      <section className="panel studio-now" aria-labelledby="st-now-h">
        <div className="panel-body">
          <h2 id="st-now-h" className="admin-h2">
            {wearing === "none" ? "The website is in its everyday look" : "The website is wearing " + SEASONS[wearing].name}
          </h2>
          <p className="muted">
            {state === "waiting"
              ? SEASONS[site.season.id as Exclude<SeasonId, "none">].name + " starts by itself on " + fmtDate(site.season.from) + " and ends on " + fmtDate(site.season.to) + "."
              : state === "on" && site.season.mode === "dates"
                ? "It comes off by itself after " + fmtDate(site.season.to) + "."
                : state === "on"
                  ? "It stays on until someone takes it off."
                  : state === "over"
                    ? "The dates set for the last season have passed."
                    : "No season is set."}
          </p>
          {state === "on" ? <Badge variant="ok">Live now</Badge> : state === "waiting" ? <Badge variant="info">Scheduled</Badge> : <Badge>Everyday</Badge>}
        </div>
      </section>

      <div className="studio">
        <section className="panel" aria-labelledby="st-look-h">
          <div className="panel-head">
            <h2 id="st-look-h">Seasonal look</h2>
          </div>
          <div className="panel-body">
            <div className="look-cards" role="radiogroup" aria-label="Look" data-tour="studio-looks">
              <button type="button" role="radio" aria-checked={pick === "none"} className="look-card" onClick={() => choose("none")}>
                <span className="look-swatches">
                  {["#E3336F", "#1D6B35", "#FFD21A", "#FBF6EC"].map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </span>
                <strong>Everyday</strong>
                <span className="look-blurb">The store’s own pink and green, as it is all year.</span>
              </button>
              {SEASON_IDS.map((id) => (
                <button key={id} type="button" role="radio" aria-checked={pick === id} className="look-card" onClick={() => choose(id)} data-tour={"look-" + id}>
                  <span className="look-swatches">
                    {SEASONS[id].palette.map(([name, c]) => (
                      <span key={name} style={{ background: c }} title={name} />
                    ))}
                  </span>
                  <strong>{SEASONS[id].name}</strong>
                  <span className="look-blurb">{SEASONS[id].blurb}</span>
                </button>
              ))}
            </div>

            {pick !== "none" ? (
              <>
                <div className="field">
                  <label htmlFor="st-greet">Greeting across the top</label>
                  <input id="st-greet" type="text" maxLength={80} value={greeting} onChange={(e) => setGreeting(e.target.value)} aria-describedby="st-greet-h" />
                  <p className="hint" id="st-greet-h">
                    Leave it empty to show no greeting.
                  </p>
                </div>
                <label className="check">
                  <input type="checkbox" checked={lights} onChange={(e) => setLights(e.target.checked)} />
                  <span>{pick === "divali" ? "A row of deyas under the header" : pick === "carnival" ? "Falling confetti, and flags under the header" : pick === "easter" ? "Drifting petals, and a garland of eggs under the header" : "Falling snow, and a string of lights under the header"}</span>
                </label>
                <div className="form-row cols-2 studio-dates">
                  <div className="field">
                    <label htmlFor="st-from">First day</label>
                    <input id="st-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="st-to">Last day</label>
                    <input id="st-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </>
            ) : null}

            <div className="cluster studio-actions">
              {pick === "none" ? (
                <button className="btn btn-primary" type="button" disabled={site.season.mode === "off"} onClick={() => commit("off", "Took the seasonal look off", "The website is back to its everyday look.")}>
                  Take the season off
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" type="button" data-tour="studio-on" onClick={() => commit("on", "Put the " + SEASONS[pick].name + " look on", SEASONS[pick].name + " is live on every public page.")}>
                    Put it on now
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => commit("dates", "Scheduled the " + SEASONS[pick].name + " look, " + from + " to " + to, SEASONS[pick].name + " will run " + fmtDate(from, { year: false }) + " to " + fmtDate(to) + ".")}>
                    Run it between the dates
                  </button>
                  {site.season.mode !== "off" ? (
                    <button className="btn btn-ghost" type="button" onClick={() => { const next: SiteConfig = { ...site, season: { ...site.season, mode: "off" } }; if (act(s, "site.customize", "Website", () => saveSite(s, next, "Took the seasonal look off"), "The website is back to its everyday look.")) setTick((t) => t + 1); }}>
                      Take it off
                    </button>
                  ) : null}
                </>
              )}
            </div>
            {sameAsLive ? null : <p className="small muted">The preview shows your choice. Nothing changes for shoppers until you press a button above.</p>}
          </div>
        </section>

        <section className="panel studio-preview" aria-labelledby="st-prev-h">
          <div className="panel-head">
            <h2 id="st-prev-h">Preview</h2>
            <div className="cluster">
              <Seg label="Page" value={page} onChange={setPage} options={PAGES} />
              <Seg label="Screen" value={device} onChange={setDevice} options={[{ id: "desktop", label: "Computer" }, { id: "phone", label: "Phone" }]} />
            </div>
          </div>
          <div className={"preview-stage is-" + device} data-tour="studio-preview">
            <div className="preview-frame">
              <iframe key={src + device} src={src} title={"Preview of the " + (PAGES.find((p) => p.id === page)?.label || "page") + " page"} loading="lazy" />
            </div>
          </div>
          <p className="preview-foot small muted">
            <a href={src} target="_blank" rel="noreferrer">
              Open the preview in a new tab
            </a>
          </p>
        </section>
      </div>

      <section className="panel" aria-labelledby="st-sheets-h">
        <div className="panel-head">
          <h2 id="st-sheets-h">Seasons and their artwork</h2>
          <span className="small muted">Every piece is drawn for this site</span>
        </div>
        <div className="season-sheets" data-tour="studio-sheets">
          {SEASON_SHEETS.map((sh) => (
            <article className="season-sheet" key={sh.id}>
              <header>
                <h3>{sh.name}</h3>
                <Badge variant={sh.status === "Ready" ? "ok" : "info"}>{sh.status}</Badge>
              </header>
              <p className="small muted">{sh.when}</p>
              <ul className="art-row">
                {Object.entries(ART[sh.id])
                  .filter(([k]) => k !== "sleigh" && k !== "flake")
                  .map(([k, v]) => (
                    <li key={k} title={ART_NAMES[k]}>
                      <img src={artUri(v)} alt={ART_NAMES[k]} width="52" height="52" />
                    </li>
                  ))}
              </ul>
              <span className="look-swatches">
                {sh.palette.map(([name, c]) => (
                  <span key={name} style={{ background: c }} title={name} />
                ))}
              </span>
              <p className="small">{sh.note}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-col studio-lower">
        <section className="panel" aria-labelledby="st-notice-h">
          <div className="panel-head">
            <h2 id="st-notice-h">Notice bar</h2>
            {site.notice.on && site.notice.text ? <Badge variant="ok">Showing</Badge> : <Badge>Off</Badge>}
          </div>
          <div className="panel-body">
            <p className="muted small">One line above the header on every public page: a holiday closing time, a late opening, a sale.</p>
            <form onSubmit={saveNotice}>
              <div className="field">
                <label htmlFor="st-ntext">The notice</label>
                <input id="st-ntext" type="text" maxLength={120} value={notice.text} onChange={(e) => setNotice({ ...notice, text: e.target.value })} placeholder="All stores close at 6:00 pm on Christmas Eve" data-tour="studio-notice" />
              </div>
              <div className="form-row cols-2">
                <div className="field">
                  <label htmlFor="st-nlabel">Link words</label>
                  <input id="st-nlabel" type="text" maxLength={30} value={notice.linkLabel} onChange={(e) => setNotice({ ...notice, linkLabel: e.target.value })} placeholder="See store hours" />
                </div>
                <div className="field">
                  <label htmlFor="st-nhref">Link goes to</label>
                  <select id="st-nhref" value={notice.href} onChange={(e) => setNotice({ ...notice, href: e.target.value })}>
                    <option value="">No link</option>
                    <option value="/locations">Store locations</option>
                    <option value="/specials">Specials</option>
                    <option value="/offers">Members’ offers</option>
                    <option value="/careers">Careers</option>
                    <option value="/community">Community and partnerships</option>
                  </select>
                </div>
              </div>
              <label className="check">
                <input type="checkbox" checked={notice.on} onChange={(e) => setNotice({ ...notice, on: e.target.checked })} />
                <span>Show the notice</span>
              </label>
              <div className="drawer-actions">
                <button className="btn btn-primary btn-sm" type="submit">
                  Save notice
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="panel" aria-labelledby="st-bands-h">
          <div className="panel-head">
            <h2 id="st-bands-h">Home page</h2>
          </div>
          <div className="panel-body">
            <p className="muted small">Switch a band of the home page off and on. The store front, the stores and the family’s memorial card always show.</p>
            <ul className="band-list">
              {BANDS.map((b) => (
                <li key={b.id}>
                  <label className="check">
                    <input type="checkbox" checked={!site.hiddenBands.includes(b.id)} onChange={(e) => toggleBand(b.id, e.target.checked)} />
                    <span>
                      <strong>{b.label}</strong>
                      <small className="muted">{b.what}</small>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
