import { byId, uid, update } from "@/lib/store";
import type { Announcement, Special } from "@/lib/types";
import type { DealRecord } from "./helpers";

// The store admin's writes from admin.js, each one S.update() call. They return what the page needs next.

/** Saves the drawer's deal: edits editId in place, or adds a new deal at the top. Returns the saved deal's id. */
export function saveDeal(editId: string | null, r: DealRecord) {
  const rec = { name: r.name, dept: r.dept, price: Math.round(r.price * 100) / 100, img: r.img, posted: r.posted, alt: r.alt };
  let savedId = "";
  update((dd) => {
    dd.specials = dd.specials || [];
    const cur = editId ? byId(dd.specials, editId) : null;
    if (cur) {
      Object.assign(cur, rec);
      if (r.isNew) cur.isNew = true;
      else delete cur.isNew;
      if (r.couva) cur.couva = true;
      else delete cur.couva;
      savedId = cur.id;
    } else {
      let nid: string;
      do nid = uid("sp");
      while (byId(dd.specials, nid));
      const add: Special = Object.assign({ id: nid }, rec);
      if (r.isNew) add.isNew = true;
      if (r.couva) add.couva = true;
      dd.specials.unshift(add);
      savedId = nid;
    }
  });
  return savedId;
}

export function removeDeal(id: string) {
  update((dd) => {
    dd.specials = (dd.specials || []).filter((x) => x.id !== id);
  });
}

/** Saves one store's hours and phone. Returns the store's name, or "" when it is no longer listed. */
export function saveStore(id: string, ms: string, sun: string, ph: string) {
  let name = "";
  update((d) => {
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
  });
  return name;
}

export function postNotice(rec: Omit<Announcement, "id">) {
  update((d) => {
    d.announcements = d.announcements || [];
    let nid: string;
    do nid = uid("an");
    while (byId(d.announcements, nid));
    d.announcements.unshift(Object.assign({ id: nid }, rec));
  });
}

export function removeNotice(id: string) {
  update((dd) => {
    dd.announcements = (dd.announcements || []).filter((x) => x.id !== id);
  });
}
