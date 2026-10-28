// Which legacy class names would Tailwind also generate as utilities?
//   node tools/port/tw-collisions.mjs .   (from the repo root)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const W = process.argv[2];
const { compile } = await import(pathToFileURL(path.join(W, "node_modules/@tailwindcss/node/dist/index.mjs")).href);

const names = new Set();
const walk = (dir, exts, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", ".claude", "public", "app", "components", "lib", "styles"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.includes(path.extname(e.name))) out.push(p);
  }
  return out;
};
// class selectors in the ported CSS
for (const f of fs.readdirSync(path.join(W, "styles"))) {
  const css = fs.readFileSync(path.join(W, "styles", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "");
  for (const m of css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) names.add(m[1]);
}
// class attributes and classList calls in the static HTML and JS
for (const f of walk(W, [".html", ".js"])) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g)) m[1].split(/\s+/).forEach((c) => /^[A-Za-z][\w-]*$/.test(c) && names.add(c));
  for (const m of src.matchAll(/classList\.(?:add|remove|toggle|contains)\(([^)]*)\)/g)) for (const s of m[1].matchAll(/["'`]([\w-]+)["'`]/g)) names.add(s[1]);
}

const compiler = await compile('@import "tailwindcss/theme"; @import "tailwindcss/utilities";', { base: W, onDependency() {} });
const out = compiler.build([...names]);
const hits = [...names].filter((n) => new RegExp(`\\.${n.replace(/[-]/g, "\\-")}(?=[\\s{:,.>\\[])`).test(out)).sort();
console.log(`${names.size} legacy class names; ${hits.length} are also Tailwind utilities:`);
console.log(hits.join(" "));
