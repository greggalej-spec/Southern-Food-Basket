"use client";

import { Icon } from "@/components/icon";
import { PERMISSIONS, activeGrant, type Permission } from "@/lib/access";
import { grantLine } from "@/lib/admin/access-admin";
import type { AdminTab } from "@/lib/admin/helpers";
import { useData, useSession } from "@/lib/store";

// The office console's section heading and its "no access" state.

export const SECTION: Record<AdminTab, { title: string; purpose: string }> = {
  today: { title: "Today", purpose: "What needs you now, worked out from your own access." },
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

export function SectionHead({ id, children }: { id: AdminTab; children?: React.ReactNode }) {
  const sec = SECTION[id];
  return (
    <header className="section-head">
      <div className="grow">
        <h1 id={"sec-" + id + "-h"} data-tour={"section-" + id}>
          {sec.title}
        </h1>
        <p>{sec.purpose}</p>
      </div>
      {children ? <div className="cluster">{children}</div> : null}
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
