#!/usr/bin/env node
/* The wiring audit. It reads the app's source with the TypeScript compiler (no regex guessing for code) and writes an
   inventory of every screen, every write, every permission check, every data collection and every outside connection,
   then checks the wiring rules and compares the result with the committed registry so nothing changes unnoticed.

     node flows-and-wiring/tools/wiring-audit.mjs            regenerate flows-and-wiring/generated/, print a summary
     node flows-and-wiring/tools/wiring-audit.mjs --check    the same, then exit 1 on a new finding or on drift
     node flows-and-wiring/tools/wiring-audit.mjs --update   accept the current wiring: rewrite registry.json

   Findings already accepted (with a reason) live in flows-and-wiring/known-gaps.json. Drift means the code now has a
   route, section, write, collection, permission, outside host or browser-storage key that registry.json does not: read
   the generated docs, update the hand-written ones where the change matters, then run --update. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HERE = path.join(ROOT, "flows-and-wiring");
const GEN = path.join(HERE, "generated");
const args = new Set(process.argv.slice(2));
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

/* ---------------------------------------------------------------- files and imports */

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}
const FILES = ["app", "components", "lib"].flatMap((d) => walk(path.join(ROOT, d)));
const SRC = new Map();
for (const f of FILES) {
  const text = fs.readFileSync(f, "utf8");
  SRC.set(f, { text, sf: ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS) });
}

function resolveImport(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base, base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (SRC.has(c)) return c;
  }
  return null;
}

const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
const str = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null);
/** Every string a permission argument can be: a literal, or each branch of `cond ? "a" : "b"`. */
function strs(n) {
  if (!n) return [];
  if (str(n) != null) return [str(n)];
  if (ts.isConditionalExpression(n)) return [...strs(n.whenTrue), ...strs(n.whenFalse)];
  if (ts.isParenthesizedExpression(n)) return strs(n.expression);
  return [];
}

/* Per file: what each local name imported resolves to, and the file's top-level functions (declarations and
   const arrows). */
const FILE = new Map();
for (const [f, { sf }] of SRC) {
  const imports = new Map(); // local -> { file, name }
  const sideImports = [];
  const fns = new Map(); // name -> fn record
  const consts = new Map(); // name -> string literal value
  const reexports = new Map(); // exported name -> { file, name }
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && st.moduleSpecifier && st.exportClause && ts.isNamedExports(st.exportClause) && !st.isTypeOnly) {
      const target = resolveImport(f, st.moduleSpecifier.text);
      if (target) for (const el of st.exportClause.elements) reexports.set(el.name.text, { file: target, name: (el.propertyName || el.name).text });
    }
    if (ts.isImportDeclaration(st)) {
      const target = resolveImport(f, st.moduleSpecifier.text);
      const cl = st.importClause;
      if (!cl) {
        if (target) sideImports.push(target);
        continue;
      }
      if (cl.isTypeOnly || !target) continue;
      if (cl.name) imports.set(cl.name.text, { file: target, name: "default" });
      const nb = cl.namedBindings;
      if (nb && ts.isNamedImports(nb)) {
        for (const el of nb.elements) {
          if (el.isTypeOnly) continue;
          imports.set(el.name.text, { file: target, name: (el.propertyName || el.name).text });
        }
      }
    }
    const exported = !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isFunctionDeclaration(st) && st.name) {
      fns.set(st.name.text, { name: st.name.text, file: f, line: lineOf(sf, st), exported, node: st });
      if (isDefault) fns.set("default", fns.get(st.name.text));
    }
    if (ts.isFunctionDeclaration(st) && !st.name && isDefault) fns.set("default", { name: "default", file: f, line: lineOf(sf, st), exported: true, node: st });
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        const init = d.initializer;
        if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          fns.set(d.name.text, { name: d.name.text, file: f, line: lineOf(sf, st), exported, node: init });
        } else if (str(init) != null) consts.set(d.name.text, str(init));
      }
    }
  }
  FILE.set(f, { imports, sideImports, fns, consts, reexports });
}

/** The function a name refers to from inside a file: one of its own, or one it imports (following re-exports one level). */
function resolveFn(file, name, depth = 0) {
  const fi = FILE.get(file);
  if (!fi || depth > 4) return null;
  if (fi.fns.has(name)) return fi.fns.get(name);
  const imp = fi.imports.get(name);
  if (imp) return exported(imp.file, imp.name, depth + 1);
  return null;
}
/** A file's export by name, following `export { x } from "./y"`. */
function exported(file, name, depth = 0) {
  const fi = FILE.get(file);
  if (!fi || depth > 4) return null;
  if (fi.fns.has(name)) return fi.fns.get(name);
  const re = fi.reexports.get(name);
  return re ? exported(re.file, re.name, depth + 1) : null;
}
const fnId = (fn) => rel(fn.file) + "#" + fn.name;

/* ---------------------------------------------------------------- the data model (lib/types.ts) */

const TYPES = [...SRC.keys()].find((f) => rel(f) === "lib/types.ts");
const IFACES = new Map(); // name -> [{ field, type }]
const ALIASES = new Map();
for (const st of SRC.get(TYPES).sf.statements) {
  if (ts.isInterfaceDeclaration(st)) {
    IFACES.set(st.name.text, st.members.filter((m) => m.name && ts.isPropertySignature(m)).map((m) => ({ field: m.name.getText(), type: m.type ? m.type.getText() : "?" })));
  }
  if (ts.isTypeAliasDeclaration(st)) ALIASES.set(st.name.text, st.type.getText());
}
const SEED_FIELDS = IFACES.get("Seed").map((m) => m.field).filter((f) => !f.startsWith("_") && f !== "version");
const PII = /email|phone|address|bank|emergency|dob|birth|nis|bir|passport|salary|pay\b|wage|masked|national|idNumber|notes|hrFile|reason/i;
function elementType(t) {
  const m = t.match(/^(\w+)\[\]$/) || t.match(/^Array<(\w+)>$/);
  return m ? m[1] : t;
}
function piiFields(iface, seen = new Set()) {
  if (!IFACES.has(iface) || seen.has(iface)) return [];
  seen.add(iface);
  const out = [];
  for (const { field, type } of IFACES.get(iface)) {
    if (PII.test(field)) out.push(field);
    const inner = elementType(type.replace(/\s*\|\s*(null|undefined)/g, "").trim());
    for (const sub of piiFields(inner, seen)) out.push(field + "." + sub);
  }
  return out;
}

/* ---------------------------------------------------------------- what a change reads and what it writes */

const MUTATORS = new Set(["push", "unshift", "splice", "pop", "shift", "sort", "reverse", "fill"]);
/** The identifier an expression hangs off, and the property chain after it: d.events[0].title -> d, [events, [], title]. */
function rootOf(e) {
  const chain = [];
  for (;;) {
    if (ts.isPropertyAccessExpression(e)) {
      chain.unshift(e.name.text);
      e = e.expression;
    } else if (ts.isElementAccessExpression(e)) {
      chain.unshift("[]");
      e = e.expression;
    } else if (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e)) e = e.expression;
    else break;
  }
  if (ts.isCallExpression(e)) return { call: e, chain };
  return ts.isIdentifier(e) ? { id: e.text, chain } : null;
}
/** Inside a function body where `p` is the whole data set: which collections it reads and which it changes. A row
 *  looked up from a collection (byId(d.jobs, id), d.events.find(...), a forEach parameter) is followed, so changing
 *  the row counts as changing its collection; so are lib helpers given the data set or a row. */
function seedEffects(body, p, file, pre = []) {
  const alias = new Map(pre);
  const reads = new Set();
  const writes = new Set();
  const returns = new Set();
  const calls = []; // [name, firstArgAlias] for callbacks invoked here
  const colOf = (expr) => {
    const r = rootOf(expr);
    if (!r) return null;
    if (r.call) return r.chain.length ? callCol(r.call) : null;
    if (r.id === p && r.chain[0] && SEED_FIELDS.includes(r.chain[0])) return r.chain[0];
    return alias.get(r.id) || null;
  };
  /** The collection a call returns a row of: byId(d.x, id), d.x.find(...), or a lib helper that returns one. */
  const callCol = (call) => {
    const ce = call.expression;
    if (ts.isIdentifier(ce)) {
      const h = resolveFn(file, ce.text);
      if (h && h.node.parameters) {
        const eff = helperEffects(h);
        for (let i = 0; i < call.arguments.length; i++) {
          const a = call.arguments[i];
          if (ts.isIdentifier(a) && a.text === p && eff.returnsCol[i]) return eff.returnsCol[i];
        }
      }
    }
    return firstCol(call);
  };
  const firstCol = (expr) => {
    let c = null;
    const f = (m) => {
      if (c) return;
      if (ts.isPropertyAccessExpression(m) && ts.isIdentifier(m.expression) && m.expression.text === p && SEED_FIELDS.includes(m.name.text)) c = m.name.text;
      else if (ts.isIdentifier(m) && alias.has(m.text)) c = alias.get(m.text);
      else ts.forEachChild(m, f);
    };
    f(expr);
    return c;
  };
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isIdentifier(n.name)) {
      const c = ts.isCallExpression(n.initializer) ? callCol(n.initializer) : firstCol(n.initializer);
      if (c) alias.set(n.name.text, c);
    }
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectBindingPattern(n.name)) {
      const c = ts.isCallExpression(n.initializer) ? callCol(n.initializer) : firstCol(n.initializer);
      if (c) for (const el of n.name.elements) if (ts.isIdentifier(el.name)) alias.set(el.name.text, c);
    }
    if (ts.isReturnStatement(n) && n.expression) {
      const c = ts.isCallExpression(n.expression) ? callCol(n.expression) : colOf(n.expression) || firstCol(n.expression);
      if (c) returns.add(c);
    }
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ["forEach", "map", "filter", "find", "some", "every", "flatMap"].includes(n.expression.name.text)) {
      const c = colOf(n.expression.expression) || firstCol(n.expression.expression);
      const cb = n.arguments[0];
      if (c && cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.parameters[0] && ts.isIdentifier(cb.parameters[0].name)) alias.set(cb.parameters[0].name.text, c);
    }
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === p && SEED_FIELDS.includes(n.name.text)) reads.add(n.name.text);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      const c = colOf(n.left);
      if (c) writes.add(c);
    }
    if ((ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) && (n.operator === ts.SyntaxKind.PlusPlusToken || n.operator === ts.SyntaxKind.MinusMinusToken)) {
      const c = colOf(n.operand);
      if (c) writes.add(c);
    }
    if (ts.isDeleteExpression(n)) {
      const c = colOf(n.expression);
      if (c) writes.add(c);
    }
    if (ts.isCallExpression(n)) {
      const ce = n.expression;
      if (ts.isPropertyAccessExpression(ce) && MUTATORS.has(ce.name.text)) {
        const c = colOf(ce.expression);
        if (c) writes.add(c);
      }
      if (ts.isPropertyAccessExpression(ce) && ts.isIdentifier(ce.expression) && ce.expression.text === "Object" && ce.name.text === "assign" && n.arguments[0]) {
        const c = colOf(n.arguments[0]);
        if (c) writes.add(c);
      }
      if (ts.isIdentifier(ce) && n.arguments[0]) {
        const c0 = colOf(n.arguments[0]) || (ts.isIdentifier(n.arguments[0]) && alias.get(n.arguments[0].text)) || null;
        if (c0) calls.push([ce.text, c0]);
      }
      if (ts.isIdentifier(ce)) {
        const h = resolveFn(file, ce.text);
        if (h && rel(h.file).startsWith("lib/") && h.node.parameters) {
          const eff = helperEffects(h);
          n.arguments.forEach((arg, i) => {
            if ((ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) && eff.cbCol[i] && arg.parameters[0] && ts.isIdentifier(arg.parameters[0].name)) {
              const inner = seedEffects(arg.body, p, file, [...alias, [arg.parameters[0].name.text, eff.cbCol[i]]]);
              inner.writes.forEach((c) => writes.add(c));
              return;
            }
            if (ts.isIdentifier(arg) && arg.text === p) {
              (eff.seedWrites[i] || []).forEach((c) => writes.add(c));
              (eff.seedReads[i] || []).forEach((c) => reads.add(c));
            } else {
              const c = colOf(arg);
              if (c && eff.paramMut[i]) writes.add(c);
            }
          });
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  if (body) visit(body);
  return { reads, writes, returns, calls };
}
/** For a lib helper: per parameter, what it changes when given the data set, or whether it changes the row it is given. */
function helperEffects(fn) {
  if (fn.eff) return fn.eff;
  fn.eff = { seedWrites: [], seedReads: [], paramMut: [], returnsCol: [], cbCol: [] };
  // the update() callbacks inside it, where a row is looked up and handed to a callback parameter
  const inUpdate = [];
  const scan = (m) => {
    if (ts.isCallExpression(m) && ts.isIdentifier(m.expression) && m.expression.text === "update" && m.arguments[0] && (ts.isArrowFunction(m.arguments[0]) || ts.isFunctionExpression(m.arguments[0])) && m.arguments[0].parameters[0]) {
      inUpdate.push(seedEffects(m.arguments[0].body, m.arguments[0].parameters[0].name.getText(), fn.file));
    }
    ts.forEachChild(m, scan);
  };
  if (fn.node.body) scan(fn.node.body);
  (fn.node.parameters || []).forEach((pm, i) => {
    if (!ts.isIdentifier(pm.name)) return;
    const name = pm.name.text;
    if (pm.type && /=>/.test(pm.type.getText())) {
      for (const e of inUpdate) for (const [callee, col] of e.calls) if (callee === name) fn.eff.cbCol[i] = col;
      return;
    }
    if (pm.type && /\bSeed\b/.test(pm.type.getText())) {
      const e = seedEffects(fn.node.body, name, fn.file);
      fn.eff.seedWrites[i] = [...e.writes];
      fn.eff.seedReads[i] = [...e.reads];
      fn.eff.returnsCol[i] = [...e.returns][0] || null;
    } else {
      const e = seedEffects(fn.node.body, "\u0000", fn.file, [[name, "__param"]]);
      fn.eff.paramMut[i] = e.writes.has("__param");
    }
  });
  return fn.eff;
}


/* ---------------------------------------------------------------- relationships: fields that point at other rows */

const PEOPLE_FIELDS = /^(by|createdBy|approvedBy|assignedTo|assignedBy|grantedBy|revokedBy|connectedBy|actor|decidedBy|sentBy|owner|author|reviewedBy|checkedBy|loggedBy)$/;
const TARGET_OVERRIDES = { place: "outside: a Google Maps place id", recipient: "employees", doc: "kycDocs", branch: "branches", user: "employees | applicants | customers (by role)", staffUpdate: "staffUpdates", book: "specialsBooks", sheet: "supplierSheets", order: "bulkOrders", promo: "promotions", request: "requests", subscriber: "subscribers", campaign: "campaigns", customer: "customers", entitlement: "entitlements", supplier: "suppliers", job: "jobs", applicant: "applicants", employee: "employees", event: "events", flyer: "flyers", task: "tasks", resource: "resources", post: "socialPosts", account: "socialAccounts", grant: "grants", special: "specials", page: "sitePages", ticket: "feedback", stage: "stages", department: "departments", dept: "departments" };
function targetOf(field, iface) {
  if (field === "author" || field === "owner" || (field === "from" && /Message|Note|Thread|Reply/.test(iface))) return "a person's name stored as text (should become a staff or applicant id)";
  if (/^(branch|branches|preferredBranch|stores?)$/.test(field)) return "branches";
  const m = field.match(/^(\w+?)Ids?$/);
  if (!m) return PEOPLE_FIELDS.test(field) ? "employees (a staff user id)" : null;
  const base = m[1];
  if (TARGET_OVERRIDES[base]) return TARGET_OVERRIDES[base];
  if (SEED_FIELDS.includes(base + "s")) return base + "s";
  if (SEED_FIELDS.includes(base)) return base;
  return "? (" + base + ")";
}
const RELS = [];
function relsOf(collection, iface, prefix, seen) {
  if (!IFACES.has(iface) || seen.has(iface)) return;
  seen.add(iface);
  for (const { field, type } of IFACES.get(iface)) {
    const name = field.replace(/[?"']/g, "");
    const t = targetOf(name, iface);
    if (t) RELS.push({ collection, field: prefix + name, target: t, many: /\[\]/.test(type) || /Ids$/.test(name) });
    const inner = elementType(type.replace(/\s*\|\s*(null|undefined)/g, "").replace(/\?/g, "").trim());
    if (IFACES.has(inner)) relsOf(collection, inner, prefix + name + ".", new Set(seen));
  }
}
for (const c of SEED_FIELDS) {
  const t = (IFACES.get("Seed").find((m) => m.field === c) || {}).type || "";
  relsOf(c, elementType(t.replace(/\?/g, "").trim()), "", new Set());
}

/* ---------------------------------------------------------------- per-function facts */

const STORE = (f) => rel(f) === "lib/store.ts";
function analyse(fn) {
  if (fn.facts) return fn.facts;
  const sf = SRC.get(fn.file).sf;
  const facts = { writes: 0, touched: new Set(), perms: new Set(), canPerms: new Set(), scoped: false, audits: new Set(), uiActions: new Set(), collections: new Set(), reads: new Set(), refs: new Set(), roles: new Set(), hrefs: new Set(), storage: new Set(), hosts: new Set(), fetches: 0, fileInputs: 0, forms: 0 };
  fn.facts = facts;
  const isComp = rel(fn.file).startsWith("components/") || rel(fn.file).startsWith("app/");
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const name = ts.isIdentifier(callee) ? callee.text : null;
      const a = n.arguments;
      if (name) {
        const target = resolveFn(fn.file, name);
        const fromStore = target ? STORE(target.file) : false;
        if ((name === "update" || name === "save") && (fromStore || STORE(fn.file))) {
          facts.writes++;
          const cb = a[0];
          if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.parameters[0] && ts.isIdentifier(cb.parameters[0].name)) {
            const e = seedEffects(cb.body, cb.parameters[0].name.text, fn.file);
            e.writes.forEach((c) => facts.collections.add(c));
            e.reads.forEach((c) => facts.touched.add(c));
          }
        }
        if (target && target.node.parameters && rel(target.file).startsWith("lib/") && !(name === "update" || name === "save")) {
          const eff = helperEffects(target);
          a.forEach((arg, i) => {
            if ((ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) && eff.cbCol[i] && arg.parameters[0] && ts.isIdentifier(arg.parameters[0].name)) {
              const inner = seedEffects(arg.body, "\u0000", fn.file, [[arg.parameters[0].name.text, eff.cbCol[i]]]);
              inner.writes.forEach((c) => facts.collections.add(c));
            }
          });
        }
        if (name === "assertCan" || name === "can") {
          for (const p of strs(a[2])) (name === "assertCan" ? facts.perms : facts.canPerms).add(p);
          if (a[2] && !strs(a[2]).length) (name === "assertCan" ? facts.perms : facts.canPerms).add("<" + a[2].getText(sf).slice(0, 40) + ">");
        }
        if (name === "assertInScope") facts.scoped = true;
        if (name === "audit" && a[2]) {
          const acts = strs(a[2]);
          if (acts.length) acts.forEach((x) => facts.audits.add(x));
          else facts.audits.add(a[2].getText(sf).replace(/\s+/g, " ").slice(0, 60));
        }
        if ((name === "act" || name === "attempt") && str(a[1])) facts.uiActions.add(str(a[1]));
        if (name === "useRequireRole" && a[0]) {
          if (ts.isArrayLiteralExpression(a[0])) a[0].elements.forEach((e) => str(e) && facts.roles.add(str(e)));
          else facts.roles.add("<" + a[0].getText(sf) + ">");
        }
        if (name === "fetch") facts.fetches++;
        if (target) facts.refs.add(target);
      }
      // localStorage.setItem(KEY, ...) and friends
      if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && /^(localStorage|sessionStorage)$/.test(callee.expression.text) && a[0]) {
        const k = a[0];
        let key = str(k);
        if (key == null && ts.isIdentifier(k)) key = FILE.get(fn.file).consts.get(k.text) ?? resolveConst(fn.file, k.text) ?? "<" + k.text + ">";
        if (key == null && ts.isBinaryExpression(k) && ts.isIdentifier(k.left)) key = (FILE.get(fn.file).consts.get(k.left.text) ?? resolveConst(fn.file, k.left.text) ?? k.left.text) + "*";
        if (key == null) key = "<" + k.getText(sf).slice(0, 40) + ">";
        facts.storage.add(callee.expression.text + ":" + key);
      }
      if (ts.isPropertyAccessExpression(callee) && ["push", "replace"].includes(callee.name.text) && /router/i.test(callee.expression.getText(sf)) && a[0]) {
        const h = str(a[0]) ?? (ts.isTemplateExpression(a[0]) ? a[0].head.text + "…" : null);
        if (h && h.startsWith("/")) facts.hrefs.add(h);
      }
    }
    if (ts.isIdentifier(n) && !ts.isPropertyAccessExpression(n.parent)) {
      const t = resolveFn(fn.file, n.text);
      if (t && t !== fn) facts.refs.add(t);
    }
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n))) {
      const tag = n.tagName.getText(sf);
      if (/^[A-Z]/.test(tag)) {
        const t = resolveFn(fn.file, tag.split(".")[0]);
        if (t) facts.refs.add(t);
      }
      if (tag === "form") facts.forms++;
      for (const at of n.attributes.properties) {
        if (!ts.isJsxAttribute(at) || !at.initializer) continue;
        const an = at.name.getText(sf);
        const v = ts.isStringLiteral(at.initializer) ? at.initializer.text : ts.isJsxExpression(at.initializer) && at.initializer.expression ? str(at.initializer.expression) : null;
        if (an === "href" && v && v.startsWith("/")) facts.hrefs.add(v.split("?")[0]);
        if (an === "type" && v === "file") facts.fileInputs++;
      }
    }
    if (isComp && ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && /^(d|data)$/.test(n.expression.text) && SEED_FIELDS.includes(n.name.text)) facts.reads.add(n.name.text);
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      for (const m of n.text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) facts.hosts.add(m[1].toLowerCase());
    }
    ts.forEachChild(n, visit);
  };
  visit(fn.node);
  return facts;
}
function resolveConst(file, name) {
  const imp = FILE.get(file)?.imports.get(name);
  return imp ? FILE.get(imp.file)?.consts.get(imp.name) ?? null : null;
}

const ALL_FNS = [...FILE.values()].flatMap((fi) => [...new Set(fi.fns.values())]);
ALL_FNS.forEach(analyse);

/* transitive: does calling this function write, which permissions guard it, which audit lines and collections */
function closure(fn, pick, seen = new Set()) {
  if (seen.has(fn)) return new Set();
  seen.add(fn);
  const out = new Set(pick(fn.facts));
  for (const r of fn.facts.refs) for (const x of closure(r, pick, seen)) out.add(x);
  return out;
}
const writesT = new Map();
function isWrite(fn, seen = new Set()) {
  if (writesT.has(fn)) return writesT.get(fn);
  if (seen.has(fn)) return false;
  seen.add(fn);
  const libRefs = [...fn.facts.refs].filter((r) => rel(r.file).startsWith("lib/"));
  const v = fn.facts.writes > 0 || libRefs.some((r) => isWrite(r, seen));
  writesT.set(fn, v);
  return v;
}
// Only lib functions count as the write layer; components that call them are screens.
const LIB_WRITES = ALL_FNS.filter((fn) => rel(fn.file).startsWith("lib/") && isWrite(fn) && fn.name !== "default");
const libOnly = (fn) => [...fn.facts.refs].filter((r) => rel(r.file).startsWith("lib/"));
function libClosure(fn, pick, seen = new Set()) {
  if (seen.has(fn)) return new Set();
  seen.add(fn);
  const out = new Set(pick(fn.facts));
  for (const r of libOnly(fn)) for (const x of libClosure(r, pick, seen)) out.add(x);
  return out;
}
const PLUMBING = new Set(["lib/store.ts#registerTier", "lib/store.ts#update", "lib/store.ts#save", "lib/store.ts#audit", "lib/store.ts#load", "lib/store.ts#reset", "lib/admin/guard.ts#attempt"]);
const WRITES = LIB_WRITES.filter((fn) => !PLUMBING.has(fnId(fn))).map((fn) => ({
  id: fnId(fn),
  fn,
  name: fn.name,
  file: rel(fn.file),
  line: fn.line,
  exported: fn.exported,
  perms: [...libClosure(fn, (f) => (f === fn ? f.perms : [...f.perms, ...f.canPerms]))].filter((x) => !x.startsWith("<")).sort(),
  scoped: [...libClosure(fn, (f) => (f.scoped ? ["y"] : []))].length > 0,
  audits: [...libClosure(fn, (f) => f.audits)].sort(),
  collections: [...libClosure(fn, (f) => f.collections)].sort(),
  readsInChange: [...libClosure(fn, (f) => f.touched)].filter((c) => !libClosure(fn, (f) => f.collections).has(c)).sort(),
  direct: fn.facts.writes > 0,
  callers: [],
}));
const WRITE_BY_FN = new Map(WRITES.map((w) => [w.fn, w]));

/* ---------------------------------------------------------------- screens */

function routeOf(file) {
  let r = rel(file).replace(/^app\//, "").replace(/(^|\/)page\.tsx$/, "").split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/");
  return "/" + r;
}
const PAGES = FILES.filter((f) => /\/page\.tsx$/.test(rel(f))).sort();

/** Everything a screen reaches: its component functions (in components/ and app/), and the lib writes they call. */
function screenOf(roots) {
  const comps = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (!f || comps.has(f)) continue;
    comps.add(f);
    for (const r of f.facts.refs) if (!rel(r.file).startsWith("lib/")) stack.push(r);
  }
  const s = { comps: [...comps], roles: new Set(), canPerms: new Set(), reads: new Set(), writes: new Set(), hrefs: new Set(), storage: new Set(), hosts: new Set(), uiActions: new Set(), fileInputs: 0, forms: 0, fetches: 0, directWrites: [] };
  for (const c of comps) {
    const x = c.facts;
    x.roles.forEach((v) => s.roles.add(v));
    x.canPerms.forEach((v) => s.canPerms.add(v));
    x.reads.forEach((v) => s.reads.add(v));
    x.hrefs.forEach((v) => s.hrefs.add(v));
    x.storage.forEach((v) => s.storage.add(v));
    x.hosts.forEach((v) => s.hosts.add(v));
    x.uiActions.forEach((v) => s.uiActions.add(v));
    s.fileInputs += x.fileInputs;
    s.forms += x.forms;
    s.fetches += x.fetches;
    if (x.writes) s.directWrites.push(fnId(c));
    for (const r of x.refs) {
      const w = WRITE_BY_FN.get(r);
      if (w) s.writes.add(w);
      // a lib helper used for reading may itself read collections: count them as reads
      if (rel(r.file).startsWith("lib/") && !w) libClosure(r, (f) => f.reads).forEach((v) => s.reads.add(v));
    }
  }
  return s;
}

const SCREENS = [];
for (const p of PAGES) {
  const fi = FILE.get(p);
  const page = fi.fns.get("default") || [...fi.fns.values()][0];
  if (!page) continue;
  const s = screenOf([page]);
  SCREENS.push({ kind: "route", id: routeOf(p), file: rel(p), ...s });
}

for (const p of FILES.filter((f) => /\/layout\.tsx$/.test(rel(f))).sort()) {
  const fi = FILE.get(p);
  const lay = fi.fns.get("default") || [...fi.fns.values()][0];
  if (lay) SCREENS.push({ kind: "layout", id: "layout " + (routeOf(p.replace(/layout\.tsx$/, "page.tsx")) || "/"), file: rel(p), ...screenOf([lay]) });
}

// Office console sections: the switch in components/admin/admin-console.tsx, gated by TAB_PERMS (lib/admin/helpers.ts).
const ADMIN = FILES.find((f) => rel(f) === "components/admin/admin-console.tsx");
const HELPERS = FILES.find((f) => rel(f) === "lib/admin/helpers.ts");
const TAB_PERMS = {};
(function readTabPerms() {
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === "TAB_PERMS" && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
      for (const pr of n.initializer.properties) {
        if (ts.isPropertyAssignment(pr) && ts.isArrayLiteralExpression(pr.initializer)) TAB_PERMS[pr.name.getText().replace(/"/g, "")] = pr.initializer.elements.map(str).filter(Boolean);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(SRC.get(HELPERS).sf);
})();
(function adminSections() {
  const { sf } = SRC.get(ADMIN);
  const visit = (n) => {
    if (ts.isCaseClause(n) && str(n.expression)) {
      const tab = str(n.expression);
      const tags = [];
      const t = (m) => {
        if ((ts.isJsxSelfClosingElement(m) || ts.isJsxOpeningElement(m)) && /^[A-Z]/.test(m.tagName.getText(sf))) tags.push(m.tagName.getText(sf));
        ts.forEachChild(m, t);
      };
      n.statements.forEach(t);
      const roots = tags.map((tg) => resolveFn(ADMIN, tg)).filter(Boolean);
      SCREENS.push({ kind: "office", id: "/admin#" + tab, file: rel(ADMIN), gatePerms: TAB_PERMS[tab] || [], ...screenOf(roots) });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
})();
// HR console tabs: each <section id="…"> in components/hr/hr-console.tsx and the components inside it.
(function hrSections() {
  const HR = FILES.find((f) => rel(f) === "components/hr/hr-console.tsx");
  const { sf } = SRC.get(HR);
  const visit = (n) => {
    if (ts.isJsxElement(n) && n.openingElement.tagName.getText(sf) === "section") {
      const idAttr = n.openingElement.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === "id");
      const id = idAttr && idAttr.initializer && ts.isStringLiteral(idAttr.initializer) ? idAttr.initializer.text : null;
      if (id) {
        const tags = [];
        const t = (m) => {
          if ((ts.isJsxSelfClosingElement(m) || ts.isJsxOpeningElement(m)) && /^[A-Z]/.test(m.tagName.getText(sf))) tags.push(m.tagName.getText(sf));
          ts.forEachChild(m, t);
        };
        n.children.forEach(t);
        const roots = tags.map((tg) => resolveFn(HR, tg)).filter(Boolean);
        SCREENS.push({ kind: "hr", id: "/hr#" + id, file: rel(HR), ...screenOf(roots) });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
})();

for (const s of SCREENS) for (const w of s.writes) w.callers.push(s.id);
const REACHED = new Set();
(function reach() {
  const stack = SCREENS.flatMap((s) => [...s.writes].map((w) => w.fn));
  while (stack.length) {
    const f = stack.pop();
    if (REACHED.has(f)) continue;
    REACHED.add(f);
    libOnly(f).forEach((r) => stack.push(r));
  }
})();

/* ---------------------------------------------------------------- permissions, outside connections, storage */

async function loadAccess() {
  const src = SRC.get(FILES.find((f) => rel(f) === "lib/access.ts")).text;
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
}
const ACCESS = await loadAccess();
const PERMS = Object.keys(ACCESS.PERMISSIONS);
const ROLES = Object.keys(ACCESS.ROLE_PERMS);
const permChecked = new Map(PERMS.map((p) => [p, new Set()]));
for (const fn of ALL_FNS) for (const p of [...fn.facts.perms, ...fn.facts.canPerms]) (permChecked.get(p) || permChecked.set(p, new Set()).get(p)).add(rel(fn.file));
// nav items: perm on each item in components/app-shell.tsx
const NAV = [];
(function readNav() {
  const f = FILES.find((x) => rel(x) === "components/app-shell.tsx");
  const visit = (n) => {
    if (ts.isObjectLiteralExpression(n)) {
      const get = (k) => n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === k)?.initializer;
      const href = str(get("href"));
      const id = str(get("id"));
      if (href && id) {
        const pv = get("perm");
        const perms = pv ? (ts.isArrayLiteralExpression(pv) ? pv.elements.map(str).filter(Boolean) : [str(pv)].filter(Boolean)) : [];
        NAV.push({ id, href, perms });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(SRC.get(f).sf);
})();

const HOSTS = new Map();
const STORAGE = new Map();
for (const fn of ALL_FNS) {
  for (const h of fn.facts.hosts) (HOSTS.get(h) || HOSTS.set(h, new Set()).get(h)).add(rel(fn.file));
  for (const k of fn.facts.storage) (STORAGE.get(k) || STORAGE.set(k, new Set()).get(k)).add(rel(fn.file));
}
// hosts in files outside any function (top-level constants)
for (const [f, { text }] of SRC) for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) (HOSTS.get(m[1].toLowerCase()) || HOSTS.set(m[1].toLowerCase(), new Set()).get(m[1].toLowerCase())).add(rel(f));

/* ---------------------------------------------------------------- findings */

const findings = [];
const add = (id, severity, text, where) => findings.push({ id, severity, text, where });
// Writes reachable without a sign-in by design (shoppers, applicants, the sign-in itself). Anything else unguarded is a finding.
const PUBLIC = JSON.parse(fs.readFileSync(path.join(HERE, "public-writes.json"), "utf8"));
for (const w of WRITES) {
  const usedByScreen = REACHED.has(w.fn) || !w.exported;
  if (!w.perms.length && !PUBLIC[w.id] && w.exported) add("unguarded-write:" + w.id, "high", "Writes " + (w.collections.join(", ") || "data") + " with no permission check, and it is not listed as a public write.", w.file + ":" + w.line);
  if (w.exported && !w.audits.length && !(PUBLIC[w.id] && /^(public|system)/.test(PUBLIC[w.id]))) add("unaudited-write:" + w.id, "medium", "Changes " + (w.collections.join(", ") || "data") + " without writing an audit line.", w.file + ":" + w.line);
  if (!usedByScreen) add("unused-write:" + w.id, "low", "Exported write that no screen calls.", w.file + ":" + w.line);
}
for (const s of SCREENS) for (const dw of s.directWrites) add("screen-writes-directly:" + dw, "medium", "A screen component calls update() itself instead of a lib write; the backend move has to find it.", dw);
for (const p of PERMS) {
  if (!ROLES.some((r) => ACCESS.ROLE_PERMS[r].includes(p))) add("perm-unassigned:" + p, "low", "Permission no role holds (only a grant's extra permissions could give it).", "lib/access.ts");
  if (!permChecked.get(p)?.size && !NAV.some((n) => n.perms.includes(p)) && !Object.values(TAB_PERMS).flat().includes(p)) add("perm-unchecked:" + p, "medium", "Permission defined but never checked anywhere.", "lib/access.ts");
}
for (const [p, files] of permChecked) if (!PERMS.includes(p) && !p.startsWith("<")) add("perm-undefined:" + p, "high", "Checked but not defined in PERMISSIONS.", [...files].join(", "));
for (const n of NAV) {
  if (!n.href.startsWith("/admin#")) continue;
  const tab = n.href.split("#")[1];
  const gate = (TAB_PERMS[tab] || []).slice().sort().join(",");
  if (gate !== n.perms.slice().sort().join(",")) add("nav-gate-mismatch:" + tab, "medium", "The sidebar shows it for [" + n.perms.join(", ") + "] but the section opens for [" + (TAB_PERMS[tab] || []).join(", ") + "].", "components/app-shell.tsx / lib/admin/helpers.ts");
}
for (const s of SCREENS) {
  if (s.kind !== "route") continue;
  if (s.writes.size && !s.roles.size && [...s.writes].some((w) => w.perms.length)) add("route-ungated-staff-writes:" + s.id, "medium", "The page has no sign-in gate but offers writes that need a staff permission (they refuse at the write, but the screen shows).", s.file);
}
// secrets: values that look like live keys in source
const SECRET = /(sk_live_[0-9a-zA-Z]{8,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abp]-[0-9a-zA-Z-]{10,}|ghp_[0-9a-zA-Z]{20,}|eyJhbGciOi[0-9a-zA-Z._-]{40,})/;
for (const [f, { text }] of SRC) {
  text.split("\n").forEach((l, i) => {
    if (SECRET.test(l)) add("secret:" + rel(f) + ":" + (i + 1), "critical", "Looks like a live credential in source.", rel(f) + ":" + (i + 1));
  });
}
for (const f of ["lib/seed-specials.ts"]) {
  /* supplier sheets must stay out of the public repo except what is already approved there; nothing to scan here */
}

/* ---------------------------------------------------------------- registry, drift */

const registry = {
  routes: SCREENS.filter((s) => s.kind === "route").map((s) => s.id).sort(),
  sections: SCREENS.filter((s) => s.kind === "office" || s.kind === "hr").map((s) => s.id).sort(),
  writes: Object.fromEntries(WRITES.filter((w) => w.exported).sort((a, b) => a.id.localeCompare(b.id)).map((w) => [w.id, { perms: w.perms, audits: w.audits, collections: w.collections }])),
  collections: SEED_FIELDS.slice().sort(),
  permissions: PERMS.slice().sort(),
  roles: Object.fromEntries(ROLES.map((r) => [r, ACCESS.ROLE_PERMS[r].slice().sort()])),
  hosts: [...HOSTS.keys()].sort(),
  storage: [...STORAGE.keys()].sort(),
};
const REG_FILE = path.join(HERE, "registry.json");
const old = fs.existsSync(REG_FILE) ? JSON.parse(fs.readFileSync(REG_FILE, "utf8")) : null;
const drift = [];
if (old) {
  const listDiff = (k) => {
    const a = new Set(old[k] || []), b = new Set(registry[k]);
    for (const x of b) if (!a.has(x)) drift.push("+ " + k + ": " + x);
    for (const x of a) if (!b.has(x)) drift.push("- " + k + ": " + x);
  };
  ["routes", "sections", "collections", "permissions", "hosts", "storage"].forEach(listDiff);
  const ow = old.writes || {};
  for (const [id, v] of Object.entries(registry.writes)) {
    if (!ow[id]) drift.push("+ write: " + id + " [" + v.perms.join(", ") + "]");
    else if (JSON.stringify(ow[id]) !== JSON.stringify(v)) drift.push("~ write: " + id + " (permissions, audit lines or collections changed)");
  }
  for (const id of Object.keys(ow)) if (!registry.writes[id]) drift.push("- write: " + id);
  for (const r of ROLES) if (JSON.stringify((old.roles || {})[r]) !== JSON.stringify(registry.roles[r])) drift.push("~ role: " + r + " permissions changed");
}

const known = JSON.parse(fs.readFileSync(path.join(HERE, "known-gaps.json"), "utf8"));
const accepted = new Set(Object.keys(known));
const fresh = findings.filter((f) => !accepted.has(f.id));
const stale = [...accepted].filter((id) => !findings.some((f) => f.id === id));

/* ---------------------------------------------------------------- the generated documents */

fs.mkdirSync(GEN, { recursive: true });
const HEAD = (title, what) => "# " + title + "\n\nGenerated by `node flows-and-wiring/tools/wiring-audit.mjs` from the source. Do not edit by hand; " + what + "\n\n";
const list = (xs) => (xs.length ? xs.map((x) => "`" + x + "`").join(", ") : "none");
const roleOf = (s) => (s.kind === "layout" ? "every page under it" : s.kind === "office" ? "office staff with " + (s.gatePerms.length ? s.gatePerms.map((p) => "`" + p + "`").join(" or ") : "any office role") : s.kind === "hr" ? "HR (`hr` role)" : s.roles.size ? [...s.roles].map((r) => "`" + r + "`").join(", ") : "anyone (public)");

let md = HEAD("Screens", "the hand-written walk-throughs are in ../02-screens-and-flows.md.");
md += "Every page (route) and every section of the two consoles. For each: who can open it, what it reads, what it can change (the lib write, the permission that write checks and the audit line it leaves), where it links, and what it keeps in the browser.\n\n";
md += "| Screen | Who | Reads | Changes | Links to |\n|---|---|---|---|---|\n";
for (const s of SCREENS) md += "| `" + s.id + "` | " + roleOf(s) + " | " + [...s.reads].sort().join(", ") + " | " + ([...s.writes].map((w) => w.name).sort().join(", ") || "nothing") + " | " + [...s.hrefs].sort().join(" ") + " |\n";
md += "\n## Detail\n\n";
for (const s of SCREENS) {
  md += "### `" + s.id + "`\n\n- Source: `" + s.file + "`; components: " + s.comps.filter((c) => /^[A-Z]/.test(c.name) || c.name === "default").map((c) => "`" + c.name + "`").join(", ") + "\n";
  md += "- Who can open it: " + roleOf(s) + (s.canPerms.size ? "; parts shown only with " + list([...s.canPerms].sort()) : "") + "\n";
  md += "- Reads: " + list([...s.reads].sort()) + "\n";
  if (s.writes.size) {
    md += "- Changes:\n";
    for (const w of [...s.writes].sort((a, b) => a.name.localeCompare(b.name))) md += "  - `" + w.name + "` (`" + w.file + ":" + w.line + "`): checks " + (w.perms.length ? list(w.perms) : PUBLIC[w.id] ? PUBLIC[w.id].split(":")[0] + " (no permission)" : "**nothing**") + (w.scoped ? " and the store scope" : "") + "; audit " + list(w.audits) + "; changes " + list(w.collections) + (w.readsInChange.length ? "; reads " + list(w.readsInChange) : "") + "\n";
  } else md += "- Changes: nothing\n";
  if (s.uiActions.size) md += "- Console actions logged on refusal: " + list([...s.uiActions].sort()) + "\n";
  if (s.hrefs.size) md += "- Links to: " + [...s.hrefs].sort().join(", ") + "\n";
  if (s.storage.size) md += "- Browser storage: " + list([...s.storage].sort()) + "\n";
  if (s.fileInputs) md += "- File pickers: " + s.fileInputs + " (file contents are not kept: name, size and type only)\n";
  if (s.directWrites.length) md += "- Writes directly from the screen: " + list(s.directWrites) + "\n";
  md += "\n";
}
fs.writeFileSync(path.join(GEN, "screens.md"), md);

md = HEAD("Writes (the future API)", "the plan for turning these into endpoints is ../04-backend-wiring-plan.md.");
md += "Every function in `lib/` that changes data. Each one is a future server endpoint or database function: the permission it checks becomes the server-side check (row-level security or an API guard), the audit line becomes a server-written audit row, and the collections are the tables it touches in one transaction.\n\n";
md += "| Write | Source | Permission | Store scope | Audit line | Changes | Also reads | Called from |\n|---|---|---|---|---|---|---|---|\n";
for (const w of WRITES.filter((x) => x.exported).sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name))) {
  md += "| `" + w.name + "` | `" + w.file + ":" + w.line + "` | " + (w.perms.length ? w.perms.map((p) => "`" + p + "`").join(" ") : PUBLIC[w.id] ? PUBLIC[w.id] : "**none**") + " | " + (w.scoped ? "yes" : "") + " | " + w.audits.map((a) => "`" + a + "`").join(" ") + " | " + w.collections.join(", ") + " | " + w.readsInChange.join(", ") + " | " + [...new Set(w.callers)].join(" ") + " |\n";
}
fs.writeFileSync(path.join(GEN, "writes.md"), md);

md = HEAD("Data model", "the table design is in ../04-backend-wiring-plan.md.");
md += "Every collection in the demo data (`Seed` in `lib/types.ts`). Each becomes a table. Personal fields are found by name; treat them as personal data (encrypt or restrict, never in logs).\n\n";
md += "| Collection | Row type | Changed by | Read on | Personal fields |\n|---|---|---|---|---|\n";
for (const c of SEED_FIELDS) {
  const t = (IFACES.get("Seed").find((m) => m.field === c) || {}).type || "?";
  const el = elementType(t.replace(/\?/g, ""));
  const by = WRITES.filter((w) => w.exported && w.collections.includes(c)).map((w) => w.name);
  const on = SCREENS.filter((s) => s.reads.has(c)).map((s) => s.id);
  md += "| `" + c + "` | `" + t.replace(/\|/g, "\\|") + "` | " + (by.join(", ") || "seed only") + " | " + (on.join(" ") || "") + " | " + [...new Set(piiFields(el))].join(", ") + " |\n";
}
/** Lists nested inside a row (applicant.timeline, employee.leaveRequests): each becomes a child table. */
function childLists(iface, prefix = "", seen = new Set()) {
  if (!IFACES.has(iface) || seen.has(iface)) return [];
  seen.add(iface);
  const out = [];
  for (const { field, type } of IFACES.get(iface)) {
    const name = field.replace(/[?"']/g, "");
    const clean = type.replace(/\s*\|\s*(null|undefined)/g, "").trim();
    const el = elementType(clean);
    const rec = clean.match(/^(Partial<)?Record<\s*string\s*,\s*(\w+)\s*>>?$/);
    if (/\[\]$|^Array</.test(clean) && IFACES.has(el)) {
      out.push(prefix + name + " (" + el + ")");
      out.push(...childLists(el, prefix + name + ".", new Set(seen)));
    } else if (/^\{[\s\S]*\}\[\]$/.test(clean)) out.push(prefix + name + " (inline rows)");
    else if (rec && IFACES.has(rec[2])) out.push(prefix + name + " (" + rec[2] + " by key)");
    else if (IFACES.has(clean)) out.push(...childLists(clean, prefix + name + ".", new Set(seen)));
  }
  return out;
}
md += "\n## Child tables\n\nLists kept inside a row today. Each becomes its own table with a key back to the row.\n\n| Collection | Nested lists |\n|---|---|\n";
for (const c of SEED_FIELDS) {
  const t = (IFACES.get("Seed").find((m) => m.field === c) || {}).type || "";
  const kids = childLists(elementType(t.replace(/\?/g, "").trim()));
  if (kids.length) md += "| `" + c + "` | " + kids.map((k) => "`" + k + "`").join(", ") + " |\n";
}
fs.writeFileSync(path.join(GEN, "data-model.md"), md);

md = HEAD("Permissions", "the access design is in ../01-auth-and-access.md.");
md += "| Permission | Meaning | " + ROLES.join(" | ") + " | Checked in |\n|---|---|" + ROLES.map(() => "---").join("|") + "|---|\n";
for (const p of PERMS) md += "| `" + p + "` | " + ACCESS.PERMISSIONS[p] + " | " + ROLES.map((r) => (ACCESS.ROLE_PERMS[r].includes(p) ? "yes" : "")).join(" | ") + " | " + [...(permChecked.get(p) || [])].sort().join(", ") + " |\n";
md += "\n## Sidebar items and section gates\n\n| Item | Link | Shown with | Section opens with |\n|---|---|---|---|\n";
for (const n of NAV) md += "| " + n.id + " | `" + n.href + "` | " + list(n.perms) + " | " + (n.href.startsWith("/admin#") ? list(TAB_PERMS[n.href.split("#")[1]] || []) : "") + " |\n";
fs.writeFileSync(path.join(GEN, "permissions.md"), md);

md = HEAD("Outside connections and browser storage", "the integration plan is in ../03-integrations.md.");
md += "## Outside hosts named in the source\n\n| Host | Where |\n|---|---|\n";
for (const [h, fs_] of [...HOSTS].sort()) md += "| " + h + " | " + [...fs_].sort().join(", ") + " |\n";
md += "\n## Browser storage keys\n\n| Key | Where |\n|---|---|\n";
for (const [k, fs_] of [...STORAGE].sort()) md += "| `" + k + "` | " + [...fs_].sort().join(", ") + " |\n";
md += "\n## Network calls\n\n`fetch()` calls in the app: " + ALL_FNS.reduce((n, f) => n + f.facts.fetches, 0) + ". Everything else happens in the browser against `lib/store.ts`.\n";
fs.writeFileSync(path.join(GEN, "externals.md"), md);


md = HEAD("Relationships", "the table design is in ../04-backend-wiring-plan.md.");
md += "Every field that points at a row in another collection, read from the types in `lib/types.ts`. Each is a future foreign key (or, for user ids that can mean a staff member, an applicant or a shopper, a reference that needs the role beside it). Deleting or renaming the target breaks everything listed against it.\n\n";
md += "| Collection | Field | Points at | Many |\n|---|---|---|---|\n";
for (const r of RELS) md += "| `" + r.collection + "` | `" + r.field + "` | " + r.target + " | " + (r.many ? "yes" : "") + " |\n";
const byTarget = new Map();
for (const r of RELS) for (const t of r.target.split(/ \| | \(/)[0].split(" ")) if (SEED_FIELDS.includes(t)) (byTarget.get(t) || byTarget.set(t, []).get(t)).push(r.collection + "." + r.field);
md += "\n## What depends on each collection\n\n| Collection | Referenced by |\n|---|---|\n";
for (const [t, xs] of [...byTarget].sort((a, b) => b[1].length - a[1].length)) md += "| `" + t + "` | " + xs.map((x) => "`" + x + "`").join(", ") + " |\n";
fs.writeFileSync(path.join(GEN, "relationships.md"), md);

// The process flows (lib/flows.ts), loaded as-is: Node runs it (it imports types only).
let flowsMd = HEAD("Process flows", "the wiring notes for each flow are in ../02-screens-and-flows.md.");
try {
  const { FLOWS } = await import(pathToFileURL(path.join(ROOT, "lib/flows.ts")).href);
  for (const f of Object.values(FLOWS)) {
    flowsMd += "## " + (f.title || f.id) + "\n\n" + (f.dept ? "Department: " + f.dept + ". " : "") + (f.lede || f.summary || "") + "\n\n";
    (f.stages || []).forEach((s, i) => (flowsMd += i + 1 + ". **" + s.label + "** (" + s.who + "): " + s.text + "\n"));
    flowsMd += "\n";
  }
} catch (e) {
  flowsMd += "Could not load lib/flows.ts: " + e.message + "\n";
}
fs.writeFileSync(path.join(GEN, "flows.md"), flowsMd);

const report = {
  generatedAt: new Date().toISOString(),
  counts: { files: FILES.length, routes: registry.routes.length, sections: registry.sections.length, writes: Object.keys(registry.writes).length, collections: registry.collections.length, permissions: PERMS.length, hosts: registry.hosts.length, storageKeys: registry.storage.length },
  findings: findings.map((f) => ({ ...f, accepted: accepted.has(f.id) ? known[f.id] : undefined })),
  newFindings: fresh,
  staleAcceptedFindings: stale,
  drift,
};
fs.writeFileSync(path.join(GEN, "report.json"), JSON.stringify(report, null, 2) + "\n");

md = HEAD("Audit report", "the recommendations are in ../05-gaps-and-recommendations.md.");
md += "Counts: " + Object.entries(report.counts).map(([k, v]) => k + " " + v).join(", ") + ".\n\n";
md += "## New findings (" + fresh.length + ")\n\n" + (fresh.length ? fresh.map((f) => "- **" + f.severity + "** `" + f.id + "`: " + f.text + " (" + f.where + ")").join("\n") : "None.") + "\n\n";
md += "## Accepted findings (" + (findings.length - fresh.length) + ")\n\n" + findings.filter((f) => accepted.has(f.id)).map((f) => "- " + f.severity + " `" + f.id + "`: " + known[f.id]).join("\n") + "\n\n";
md += "## Drift from registry.json (" + drift.length + ")\n\n" + (drift.length ? drift.map((d) => "- " + d).join("\n") : "None.") + "\n";
if (stale.length) md += "\n## Accepted findings that no longer occur (" + stale.length + ")\n\nRemove them from known-gaps.json: " + list(stale) + "\n";
fs.writeFileSync(path.join(GEN, "report.md"), md);

/* ---------------------------------------------------------------- summary and exit */

if (args.has("--update") || !old) fs.writeFileSync(REG_FILE, JSON.stringify(registry, null, 2) + "\n");
const sev = (s) => findings.filter((f) => f.severity === s && !accepted.has(f.id)).length;
console.log("wiring: " + Object.entries(report.counts).map(([k, v]) => v + " " + k).join(", "));
console.log("findings: " + findings.length + " (" + fresh.length + " new: " + ["critical", "high", "medium", "low"].map((s) => sev(s) + " " + s).join(", ") + ")");
if (fresh.length) fresh.slice(0, 40).forEach((f) => console.log("  NEW " + f.severity.padEnd(8) + f.id + "  " + f.where));
if (drift.length && !args.has("--update")) {
  console.log("drift from registry.json: " + drift.length);
  drift.slice(0, 40).forEach((d) => console.log("  " + d));
}
if (stale.length) console.log("accepted findings that no longer occur (tidy known-gaps.json): " + stale.join(", "));
console.log("docs: flows-and-wiring/generated/ (screens, writes, data-model, relationships, permissions, externals, flows, report)");
if (args.has("--check") && (fresh.length || (drift.length && !args.has("--update")))) {
  console.log("FAIL: review the new findings or drift above, document them, then accept with --update or add to known-gaps.json.");
  process.exit(1);
}
