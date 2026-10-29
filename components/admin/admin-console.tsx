"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { AccessPanel } from "@/components/admin/access-panel";
import { AuditPanel } from "@/components/admin/audit-panel";
import { CodesPanel } from "@/components/admin/codes-panel";
import { DealsPanel } from "@/components/admin/deals-panel";
import { ListPanel } from "@/components/admin/list-panel";
import { NewsletterPanel } from "@/components/admin/newsletter-panel";
import { NoticesPanel } from "@/components/admin/notices-panel";
import { PostMaker } from "@/components/admin/post-maker";
import { PromosPanel } from "@/components/admin/promos-panel";
import { PublishPanel } from "@/components/admin/publish-panel";
import { NoAccess, SectionHead } from "@/components/admin/section";
import { StaffUpdatesPanel } from "@/components/admin/staff-updates-panel";
import { StoresPanel } from "@/components/admin/stores-panel";
import { TodayPanel } from "@/components/admin/today-panel";
import { can } from "@/lib/access";
import { TABS, TAB_PERMS, goToTab, itemOf, tabOf, type AdminTab } from "@/lib/admin/helpers";
import { useData, useRequireRole } from "@/lib/store";

// The office console: one page for the store admin, marketing and the owner's office. The sidebar (AppShell) is the
// navigation; the URL hash picks the section (#today, #promos, ... see TABS), and "#promos/<id>" opens one item in
// it. Only the current section renders. Each one checks access itself: a hidden menu item is not access control, so
// a hash for a section this session cannot use shows what is missing, never the content.

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const readHash = () => location.hash;
const serverHash = () => "";

/* On a phone the sidebar is off-canvas: a link in it must close it, or the section stays hidden behind it. */
function closeSidebar(tab: AdminTab) {
  const shell = document.querySelector(".app.sidebar-open");
  if (!shell) return;
  shell.querySelector<HTMLElement>(".app-menu-btn")?.click();
  document.getElementById("sec-" + tab)?.focus({ preventScroll: true });
}

export function AdminConsole() {
  const s = useRequireRole(["admin", "marketing", "owner"]);
  const d = useData();
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const tab = tabOf(hash);
  const item = itemOf(hash);
  // The post maker's chosen deal, and a tick that re-runs it when "Make an Instagram post" picks a deal again.
  const [postChoice, setPostChoice] = useState<string | null>(null);
  const [showTick, setShowTick] = useState(0);

  // A new section closes the phone sidebar and starts at the top; a new item inside the same section ("#promos/<id>")
  // leaves the page where it is.
  useEffect(() => {
    closeSidebar(tab);
    window.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    /* a sidebar link to the section already showing fires no hashchange, so close the sidebar here */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.(".app-nav a");
      if (!a) return;
      const h = (a.getAttribute("href") || "").split("#")[1];
      if (h && (TABS as readonly string[]).includes(h) && tabOf(location.hash) === h) closeSidebar(h as AdminTab);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function makePost(id: string) {
    setPostChoice(id);
    setShowTick((n) => n + 1);
    goToTab("posts");
  }

  const perms = TAB_PERMS[tab];
  const allowed = !!s && (!perms.length || perms.some((p) => can(d, s, p)));

  function content() {
    switch (tab) {
      case "today":
        return <TodayPanel />;
      case "deals":
        return <DealsPanel onMakePost={makePost} />;
      case "posts":
        return <PostMaker active showTick={showTick} choice={postChoice} onChoose={setPostChoice} />;
      case "stores":
        return <StoresPanel />;
      case "notices":
        return <NoticesPanel />;
      case "publish":
        return <PublishPanel />;
      case "staffnews":
        return <StaffUpdatesPanel heading={false} />;
      case "promos":
        return <PromosPanel item={item} />;
      case "codes":
        return <CodesPanel />;
      case "newsletter":
        return <NewsletterPanel item={item} />;
      case "list":
        return <ListPanel item={item} />;
      case "access":
        return <AccessPanel item={item} />;
      case "audit":
        return <AuditPanel item={item} />;
    }
  }

  return (
    <AppShell app="admin" active={tab} title="Office console" css={["app", "admin"]}>
      <section id={"sec-" + tab} className="admin-section" tabIndex={-1} aria-labelledby={"sec-" + tab + "-h"}>
        <SectionHead id={tab} />
        {!s ? null : allowed ? content() : <NoAccess id={tab} perms={perms} />}
      </section>
    </AppShell>
  );
}
