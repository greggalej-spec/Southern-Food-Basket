import { assertCan, can } from "@/lib/access";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { Area, BulkOrder, BulkStatus, ResourceDoc, Seed, Session, Task, Tone } from "@/lib/types";

/* The office's own tools: bulk orders (one order, shared between the five stores), tasks handed from one person to
   another, and the templates and guides the office keeps to hand. Every write checks access and is audited. */

/* ---------- bulk orders ---------- */

export const BULK_STAGE: Record<BulkStatus, { label: string; tone: Tone; next?: { to: BulkStatus; label: string; done: string } }> = {
  collecting: { label: "Collecting store numbers", tone: "warn", next: { to: "ordered", label: "Place the order", done: "Order placed" } },
  ordered: { label: "Ordered", tone: "info", next: { to: "received", label: "Mark as received", done: "Marked received" } },
  received: { label: "Received", tone: "info", next: { to: "shared", label: "Mark as shared to stores", done: "Marked shared" } },
  shared: { label: "Shared to the stores", tone: "ok" },
};

export const bulkTotal = (o: BulkOrder) => o.allocations.reduce((n, a) => n + (a.qty || 0), 0);
export const bulkCost = (o: BulkOrder) => bulkTotal(o) * o.unitCost;
/** Stores that have not given a number yet (only while the order is collecting). */
export const bulkWaiting = (o: BulkOrder) => (o.status === "collecting" ? o.allocations.filter((a) => !a.confirmedAt) : []);

/** The same item in an earlier season, for "last time": the newest one before this order. */
export function lastTime(d: Seed, o: BulkOrder) {
  return (
    (d.bulkOrders || [])
      .filter((x) => x.id !== o.id && x.item === o.item && x.orderBy < o.orderBy)
      .sort((a, b) => b.orderBy.localeCompare(a.orderBy))[0] || null
  );
}

export function seasons(d: Seed) {
  return Array.from(new Set((d.bulkOrders || []).slice().sort((a, b) => b.orderBy.localeCompare(a.orderBy)).map((o) => o.season)));
}

export type BulkForm = Pick<BulkOrder, "season" | "item" | "supplierName" | "unit" | "unitCost" | "orderBy" | "note">;

export function addBulkOrder(s: Session | null, form: BulkForm) {
  let id = "";
  update((d) => {
    assertCan(d, s, "bulk.manage");
    id = uid("bo");
    d.bulkOrders = [
      { id, ...form, status: "collecting", allocations: d.branches.map((b) => ({ branchId: b.id, qty: 0 })), createdBy: s?.userId || "", createdAt: nowIso(), log: [{ at: nowIso(), by: s?.userId || "", text: "Opened. Stores to give numbers by the closing day." }] },
      ...(d.bulkOrders || []),
    ];
    audit(d, s, "bulk.open", form.item + ", " + form.season, "Opened a bulk order");
  });
  return id;
}

/** A store's quantity. A store manager gives their own store's; the office can give any store's. Only while the
 *  order is still collecting. */
export function setBulkQty(s: Session | null, orderId: string, branchId: string, qty: number) {
  update((d) => {
    if (!can(d, s, "bulk.manage")) assertCan(d, s, "bulk.store", { branchId });
    const o = byId(d.bulkOrders, orderId);
    if (!o) throw new Error("That order is no longer there.");
    if (o.status !== "collecting") throw new Error("This order has been placed. Ask the office to change a quantity.");
    const a = o.allocations.find((x) => x.branchId === branchId);
    if (!a) return;
    a.qty = qty;
    a.confirmedBy = s?.userId || "";
    a.confirmedAt = nowIso();
    const store = byId(d.branches, branchId)?.name || "A store";
    o.log.push({ at: nowIso(), by: s?.userId || "", text: store + ": " + qty + " " + o.unit.replace(/ of .*/, "") + (qty === 1 ? "" : "s") + "." });
    audit(d, s, "bulk.qty", o.item + ", " + o.season, store + " asked for " + qty);
  });
}

export function advanceBulk(s: Session | null, orderId: string) {
  update((d) => {
    assertCan(d, s, "bulk.manage");
    const o = byId(d.bulkOrders, orderId);
    const next = o ? BULK_STAGE[o.status].next : undefined;
    if (!o || !next) return;
    o.status = next.to;
    if (next.to === "ordered") o.orderedAt = nowIso();
    if (next.to === "received") o.receivedAt = nowIso();
    const total = bulkTotal(o);
    o.log.push({ at: nowIso(), by: s?.userId || "", text: next.to === "ordered" ? "Ordered " + total + " from " + o.supplierName + "." : next.done + "." });
    audit(d, s, "bulk." + (next.to === "ordered" ? "order" : next.to), o.item + ", " + o.season, next.to === "ordered" ? "Ordered " + total : next.done);
  });
}

/* ---------- tasks ---------- */

export const AREA_LABEL: Record<Area, string> = { admin: "Administration", marketing: "Marketing", hr: "HR", website: "Website", owner: "Director’s office" };

export type TaskForm = Pick<Task, "title" | "detail" | "area" | "assignedTo" | "due">;

export function addTask(s: Session | null, form: TaskForm) {
  update((d) => {
    assertCan(d, s, "tasks.assign");
    d.tasks = [{ id: uid("tk"), ...form, assignedBy: s?.userId || "", status: "open", createdAt: nowIso() }, ...(d.tasks || [])];
    audit(d, s, "tasks.assign", form.title, "Given to " + (byId(d.employees, form.assignedTo)?.name || "someone") + ", due " + form.due);
  });
}

/** Whoever the task belongs to can tick it off; so can anyone who hands out tasks. */
export function setTaskDone(s: Session | null, id: string, done: boolean) {
  update((d) => {
    const t = byId(d.tasks, id);
    if (!t) return;
    if (t.assignedTo !== s?.userId) assertCan(d, s, "tasks.assign");
    else assertCan(d, s, "portal.self");
    t.status = done ? "done" : "open";
    t.doneAt = done ? nowIso() : undefined;
    audit(d, s, done ? "tasks.done" : "tasks.reopen", t.title, done ? "Ticked off" : "Reopened");
  });
}

/** The tasks a session should see: everyone's for someone who hands them out, otherwise their own. */
export function tasksFor(d: Seed, s: Session | null) {
  const all = d.tasks || [];
  return can(d, s, "tasks.assign") ? all : all.filter((t) => t.assignedTo === s?.userId);
}

/* ---------- resources ---------- */

export type ResourceForm = Pick<ResourceDoc, "area" | "kind" | "title" | "summary" | "body">;

export function saveResource(s: Session | null, id: string | null, form: ResourceForm) {
  update((d) => {
    assertCan(d, s, form.area === "hr" ? "hr.people" : "resources.edit");
    const cur = id ? byId(d.resources, id) : null;
    const today = nowIso().slice(0, 10);
    if (cur) Object.assign(cur, form, { updated: today });
    else d.resources = [{ id: uid("res"), ...form, updated: today }, ...(d.resources || [])];
    audit(d, s, "resources.save", form.title, cur ? "Changed the document" : "Added a document");
  });
}
