"use client";

import { MarketingFigure, OfficeFigure } from "@/components/admin/office-figure";
import { officeMeta } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { PERMISSIONS, activeGrant, type Permission } from "@/lib/access";
import { grantLine } from "@/lib/admin/access-admin";
import type { AdminTab } from "@/lib/admin/helpers";
import { useData, useSession } from "@/lib/store";

// The office console's section heading and its "no access" state.

export const SECTION: Record<AdminTab, { title: string; purpose: string }> = {
  today: { title: "Today", purpose: "What needs you now, worked out from your own access." },
  overview: { title: "Overview", purpose: "Every department on one page: what is waiting, what is moving, and what changed today." },
  suppliers: { title: "Supplier specials", purpose: "Each company’s specials for the round, in the columns the office already uses. Bring in what they send, add the case price, mark it checked." },
  sellout: { title: "Sell-out reports", purpose: "Which companies are owed a report for each round of specials, which are done, and which have gone out." },
  events: { title: "Events and flyers", purpose: "What customers see on the Events page, and the designer’s flyers that lead the Specials page." },
  feedback: { title: "Customer feedback", purpose: "Compliments, questions, suggestions and complaints sent from the website, each one answered and closed in one place." },
  requests: { title: "Partnerships and donations", purpose: "Every request from a school, charity, club or company in one list, from the day it arrives to the day it is done." },
  bulk: { title: "Bulk orders", purpose: "One order for all five stores: each store gives its number, the office places the order, and last time’s figures sit alongside." },
  tasks: { title: "Tasks and resources", purpose: "Work handed from one person to another, and the templates and checklists the office keeps to hand." },
  customize: { title: "Customize", purpose: "Choose the look the website wears, set this console to light or dark, and go back to an earlier version." },
  studio: { title: "Website studio", purpose: "The seasonal look, the notice bar, and what the home page leads with. Preview first, then put it live." },
  analytics: { title: "Marketing figures", purpose: "How the website and the social accounts are doing, and which posts earned it." },
  social: { title: "Social accounts", purpose: "Which accounts feed the figures, and how each one is connected." },
  plan: { title: "Content calendar", purpose: "What is going out, where and when, so posts, e-mails and website changes line up." },
  deals: { title: "Specials", purpose: "The deals on the public Specials page and the home page, newest first." },
  posts: { title: "Post maker", purpose: "Turn a deal into a 1080 × 1350 pixel picture for Instagram, with the logo and the price seal." },
  stores: { title: "Stores and hours", purpose: "Each store’s opening hours and phone number, as the site header and the Store locations page show them." },
  notices: { title: "Staff notices", purpose: "Notices on the employee portal home, for every store or for one store." },
  publish: { title: "Publish", purpose: "How your website changes reach the live site, and what the data file leaves out." },
  staffnews: { title: "Staff updates", purpose: "The internal newsletter: e-mailed to staff work addresses and kept in their portal. It never reaches the shoppers’ list." },
  promos: { title: "Promotions", purpose: "Members’ offers: draft them, send them for approval, and see where each one stands." },
  codes: { title: "Codes and redemptions", purpose: "How many codes each offer has given out and how many were used, store by store, and every check at the tills." },
  newsletter: { title: "Newsletter", purpose: "The weekly e-mail: write it, send a test to yourself, then schedule it." },
  list: { title: "Mailing list", purpose: "Who signed up for the e-mail, and the consent record behind each address." },
  access: { title: "Staff access", purpose: "Who can use which part of the console, for which stores, and until when." },
  audit: { title: "Audit log", purpose: "Every change and every refused attempt in the console and at the tills, newest first." },
};

/** A section's banner: its icon in a tile, the department above the title, one line saying what the section is for,
 *  and the section's own controls on the right. The banner takes its department's colour (styles/staff-theme.css),
 *  so a glance at the top of the screen says where you are. */
export function SectionHead({ id, children }: { id: AdminTab; children?: React.ReactNode }) {
  const sec = SECTION[id];
  const meta = officeMeta(id);
  const dept = meta?.group || "Office";
  // the orange office banners carry the office's own waving figure in their right corner, the yellow marketing banners
  // the two people on the marketing team, both in a little store front (components/admin/office-figure.tsx)
  const office = dept === "Office" || dept.startsWith("Owner");
  const marketing = dept === "Marketing";
  return (
    <header className={"section-head sec-band dept-" + dept.toLowerCase().replace(/[^a-z]+/g, "-") + (office || marketing ? " has-figure" : "") + (marketing ? " has-pair" : "")}>
      <span className="sec-icon" aria-hidden="true">
        <Icon name={meta?.icon || "grid"} />
      </span>
      <div className="grow">
        <p className="sec-dept">{dept}</p>
        <h1 id={"sec-" + id + "-h"} data-tour={"section-" + id}>
          {sec.title}
        </h1>
        <p>{sec.purpose}</p>
      </div>
      {children ? <div className="cluster">{children}</div> : null}
      {office ? <OfficeFigure /> : marketing ? <MarketingFigure /> : null}
    </header>
  );
}

/** What a section shows a session without the access it needs: what is missing, what they do have, and who to ask. */
export function NoAccess({ id, perms }: { id: AdminTab; perms: Permission[] }) {
  const d = useData();
  const s = useSession();
  const g = activeGrant(d, s);
  const needs = perms.map((p) => PERMISSIONS[p].charAt(0).toLowerCase() + PERMISSIONS[p].slice(1));
  return (
    <div className="no-access" role="status">
      <Icon name="shield" />
      <div>
        <h2>{"You do not have access to " + SECTION[id].title}</h2>
        <p>
          {"It needs permission to " + needs.join(", or to ") + "."}
          {g ? " Your access is " + grantLine(d, g) + "." : ""}
        </p>
        <p>Ask the owner’s office if you need it.</p>
      </div>
    </div>
  );
}
