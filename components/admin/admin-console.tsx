"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { DealsPanel } from "@/components/admin/deals-panel";
import { NoticesPanel } from "@/components/admin/notices-panel";
import { PostMaker } from "@/components/admin/post-maker";
import { PublishPanel } from "@/components/admin/publish-panel";
import { StoresPanel } from "@/components/admin/stores-panel";
import { TABS, goToTab, tabOf, type AdminTab } from "@/lib/admin/helpers";
import { useData, useRequireRole } from "@/lib/store";
import type { Seed } from "@/lib/types";

// The store admin, ported from admin/index.html and assets/js/admin.js: stats and the five hash tabs (#deals, #posts,
// #stores, #notices, #publish). Role: admin. The headings, tabs and section intros render on the server, as the
// static HTML did; each tab's content fills in once the session is known.

const TAB_LABEL: Record<AdminTab, string> = { deals: "Specials", posts: "Post maker", stores: "Stores and hours", notices: "Staff notices", publish: "Publish" };
const INTRO: Record<AdminTab, string> = {
  deals: "These are the deals on the public Specials page and the home page, newest first.",
  posts: "Turn a deal into a 1080 × 1350 pixel picture for Instagram, with the logo and the price seal.",
  stores: "Opening hours and phone numbers for each store. The site header, the home page store cards and the Store locations page read these.",
  notices: "Notices show on the home page of the employee portal, for every store or for one store.",
  publish: "How your changes reach the website.",
};

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const currentTab = () => tabOf(location.hash);
const serverTab = (): AdminTab => "deals";

/* the off-canvas sidebar links point at these tabs: close it so the section is not left hidden behind it */
function closeSidebar() {
  const shell = document.querySelector(".app.sidebar-open");
  if (!shell) return false;
  shell.querySelector<HTMLElement>(".app-menu-btn")?.click();
  document.getElementById("panel-" + currentTab())?.focus({ preventScroll: true });
  return true;
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{String(value)}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function AdminStats({ d }: { d: Seed }) {
  const sp = d.specials || [];
  return (
    <>
      <Stat label="Live deals" value={sp.length} sub="on the Specials page" />
      <Stat label="Tagged Couva" value={sp.filter((x) => x.couva).length} sub="deals with the Couva pin" />
      <Stat label="Stores" value={(d.branches || []).length} sub="hours and phone numbers" />
      <Stat label="Staff notices" value={(d.announcements || []).length} sub="on the employee portal" />
    </>
  );
}

export function AdminConsole() {
  const s = useRequireRole(["admin"]);
  const d = useData();
  const tab = useSyncExternalStore(subscribeHash, currentTab, serverTab);
  const ready = !!s;
  const tabsRef = useRef<HTMLDivElement>(null);
  // showTick re-runs showTab for the tab already showing (a click on it, or "Make an Instagram post of it").
  const [showTick, setShowTick] = useState(0);
  const [hashSeq, setHashSeq] = useState(0);
  const [postChoice, setPostChoice] = useState<string | null>(null);

  /* on a phone the tab strip scrolls sideways: bring the selected tab into view */
  useEffect(() => {
    const tabsEl = tabsRef.current, sel = document.getElementById("tab-" + tab);
    if (!sel || !tabsEl || tabsEl.scrollWidth <= tabsEl.clientWidth) return;
    const br = sel.getBoundingClientRect(), tr = tabsEl.getBoundingClientRect();
    if (br.left < tr.left) tabsEl.scrollLeft -= tr.left - br.left + 16;
    else if (br.right > tr.right) tabsEl.scrollLeft += br.right - tr.right + 16;
  }, [tab, showTick]);

  useEffect(() => {
    const onHash = () => setHashSeq((n) => n + 1);
    window.addEventListener("hashchange", onHash);
    /* a sidebar link to the tab already showing fires no hashchange, so close the sidebar here */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.(".app-nav a");
      if (!a) return;
      const h = (a.getAttribute("href") || "").split("#")[1];
      if (h && (TABS as readonly string[]).includes(h) && location.hash === "#" + h) closeSidebar();
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // After a hash change has shown its tab: close the sidebar and bring the tabs back into view.
  useEffect(() => {
    if (!hashSeq) return;
    closeSidebar();
    const top = tabsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 64) window.scrollTo({ top: Math.max(0, window.scrollY + top - 80) });
  }, [hashSeq]);

  function goTab(id: AdminTab) {
    if (currentTab() === id) setShowTick((n) => n + 1);
    else goToTab(id);
  }

  function makePost(id: string) {
    setPostChoice(id);
    goTab("posts");
  }

  function panel(id: AdminTab, content: React.ReactNode) {
    return (
      <section id={"panel-" + id} role="tabpanel" aria-labelledby={"tab-" + id} tabIndex={-1} hidden={tab !== id}>
        <div className="section-intro">
          <h2 className="admin-h2">{TAB_LABEL[id]}</h2>
          <p className="muted">{INTRO[id]}</p>
        </div>
        {ready ? content : null}
      </section>
    );
  }

  return (
    <AppShell app="admin" active={tab} title="Store admin" css={["app", "admin"]}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Store admin</p>
          <h1>Run the website</h1>
          <p className="muted">Post specials, make the Instagram post, and keep store hours and staff notices up to date.</p>
        </div>
      </div>

      <div className="stats" id="admin-stats">
        {ready ? <AdminStats d={d} /> : null}
      </div>

      <div
        className="tabs"
        role="tablist"
        aria-label="Admin sections"
        id="admin-tabs"
        ref={tabsRef}
        onKeyDown={(e) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const i = TABS.indexOf(currentTab());
          const n = e.key === "Home" ? TABS[0] : e.key === "End" ? TABS[TABS.length - 1] : TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
          goToTab(n);
          document.getElementById("tab-" + n)?.focus();
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={"tab-" + t}
            data-tab={t}
            aria-selected={t === tab}
            aria-controls={"panel-" + t}
            tabIndex={t === tab ? 0 : -1}
            onClick={() => goTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {panel("deals", <DealsPanel onMakePost={makePost} />)}
      {panel("posts", <PostMaker active={tab === "posts"} showTick={showTick} choice={postChoice} onChoose={setPostChoice} />)}
      {panel("stores", <StoresPanel />)}
      {panel("notices", <NoticesPanel />)}
      {panel("publish", <PublishPanel />)}
    </AppShell>
  );
}
