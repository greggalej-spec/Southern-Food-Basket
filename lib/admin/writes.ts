import { assertCan } from "@/lib/access";
import { audit, byId, uid, update } from "@/lib/store";
import type { Announcement, Session, Special } from "@/lib/types";
import { assertInScope } from "./guard";
import type { DealRecord } from "./helpers";

// The store admin's writes from admin.js, each one update() call that checks access first, so a refused write
// changes nothing. Each is audited. They return what the page needs next.

/** Saves the drawer's deal: edits editId in place, or adds a new deal at the top. Returns the saved deal's id. */
export function saveDeal(s: Session | null, editId: string | null, r: DealRecord) {
  const rec = { name: r.name, dept: r.dept, price: Math.round(r.price * 100) / 100, img: r.img, posted: r.posted, alt: r.alt };
  let savedId = "";
  update((dd) => {
    assertCan(dd, s, "specials.edit");
    dd.specials = dd.specials || [];
    const cur = editId ? byId(dd.specials, editId) : null;
    if (cur) {
      Object.assign(cur, rec);
      if (r.isNew) cur.isNew = true;
      else delete cur.isNew;
      if (r.couva) cur.couva = true;
      else delete cur.couva;
      if (r.to) cur.to = r.to;
      else delete cur.to;
      savedId = cur.id;
      audit(dd, s, "specials.edit", cur.name, "Edited the special");
    } else {
      let nid: string;
      do nid = uid("sp");
      while (byId(dd.specials, nid));
      const add: Special = Object.assign({ id: nid }, rec);
      if (r.isNew) add.isNew = true;
      if (r.couva) add.couva = true;
      if (r.to) add.to = r.to;
      dd.specials.unshift(add);
      savedId = nid;
      audit(dd, s, "specials.add", add.name, "Added a special");
    }
  });
  return savedId;
}

export function removeDeal(s: Session | null, id: string) {
  update((dd) => {
    assertCan(dd, s, "specials.edit");
    const sp = byId(dd.specials, id);
    dd.specials = (dd.specials || []).filter((x) => x.id !== id);
    if (sp) audit(dd, s, "specials.remove", sp.name, "Removed the special");
  });
}

/** Saves one store's hours and phone. Returns the store's name, or "" when it is no longer listed. */
export function saveStore(s: Session | null, id: string, ms: string, sun: string, ph: string) {
  let name = "";
  update((d) => {
    assertCan(d, s, "stores.edit", { branchId: id });
    const b = byId(d.branches, id);
    if (!b) return;
    const rows = b.hours || [];
    b.hours = [
      [(rows[0] && rows[0][0]) || "Mon – Sat", ms],
      [(rows[1] && rows[1][0]) || "Sunday", sun],
      ...rows.slice(2),
    ];
    b.phone = ph;
    name = b.name;
    audit(d, s, "stores.edit", b.name, "Changed hours or phone");
  });
  return name;
}

export function postNotice(s: Session | null, rec: Omit<Announcement, "id">) {
  update((d) => {
    assertCan(d, s, "notices.post", { branchId: rec.branchId });
    assertInScope(d, s, rec.branchId, "A notice for every store is outside it.");
    d.announcements = d.announcements || [];
    let nid: string;
    do nid = uid("an");
    while (byId(d.announcements, nid));
    d.announcements.unshift(Object.assign({ id: nid }, rec));
    audit(d, s, "notices.post", rec.title, rec.branchId ? "Posted for " + (byId(d.branches, rec.branchId)?.name || "one store") : "Posted for every store");
  });
}

export function removeNotice(s: Session | null, id: string) {
  update((dd) => {
    const a = byId(dd.announcements, id);
    assertCan(dd, s, "notices.post", { branchId: a?.branchId });
    if (!a) return;
    assertInScope(dd, s, a.branchId, "Notices for other stores are outside it.");
    dd.announcements = (dd.announcements || []).filter((x) => x.id !== id);
    audit(dd, s, "notices.remove", a.title, "Removed the notice");
  });
}
