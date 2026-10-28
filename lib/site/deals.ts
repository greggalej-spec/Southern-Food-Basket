import { byId } from "@/lib/store";
import type { Department, Seed, Special } from "@/lib/types";

// The shared pieces of site.js. Like the read helpers in lib/store.ts, they take the data as their first argument
// (pass what useData() returned).

/** A department, or a stand-in named after its id. */
export function dept(d: Seed, id: string): Pick<Department, "id" | "name" | "short"> {
  return byId(d.departments, id) || { id, name: id, short: id };
}

export function branchName(d: Seed, id: string) {
  const b = byId(d.branches, id);
  return b ? b.name : id;
}

export function newestFirst(list: Special[]) {
  return list.slice().sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0));
}

export function dealsIn(d: Seed, id: string) {
  return (d.specials || []).filter((sp) => sp.dept === id);
}

/** dollars(24.95) → "$24.95", the price as the posts print it. */
export function dollars(v: number) {
  return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
