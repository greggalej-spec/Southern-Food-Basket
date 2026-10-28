// One-time port of the static site's CSS into the Next.js app.
//   node scope-css.mjs home <in.css> <out.css>          scope under .ge-root (the home page's <body>)
//   node scope-css.mjs scope:<name> <in.css> <out.css>  scope under :where([data-css~="<name>"]) (zero specificity)
//   node scope-css.mjs copy <in.css> <out.css>          no scoping
// Every mode rewrites url(../img/…) to url(/assets/img/…) and the three font families to the next/font variables.
import fs from "node:fs";
const [, , mode, inPath, outPath] = process.argv;
let src = fs.readFileSync(inPath, "utf8");

function skipComment(s, i) { const e = s.indexOf("*/", i + 2); return e < 0 ? s.length : e + 2; }
function skipString(s, i) { const q = s[i]; i++; while (i < s.length && s[i] !== q) { if (s[i] === "\\") i++; i++; } return i + 1; }
/* split a block body into top-level items: {kind:'rule', prelude, body} | {kind:'text', text} */
function parse(s) {
  const out = []; let i = 0, start = 0;
  while (i < s.length) {
    if (s.startsWith("/*", i)) { i = skipComment(s, i); continue; }
    if (s[i] === '"' || s[i] === "'") { i = skipString(s, i); continue; }
    if (s[i] === "{") {
      const prelude = s.slice(start, i); let depth = 1, j = i + 1;
      while (j < s.length && depth) {
        if (s.startsWith("/*", j)) { j = skipComment(s, j); continue; }
        if (s[j] === '"' || s[j] === "'") { j = skipString(s, j); continue; }
        if (s[j] === "{") depth++; else if (s[j] === "}") depth--;
        j++;
      }
      out.push({ kind: "rule", prelude, body: s.slice(i + 1, j - 1) });
      i = j; start = j; continue;
    }
    i++;
  }
  if (start < s.length) out.push({ kind: "text", text: s.slice(start) });
  return out;
}
function splitSelectors(p) {
  const parts = []; let depth = 0, cur = "";
  for (const c of p) { if (c === "(") depth++; if (c === ")") depth--; if (c === "," && !depth) { parts.push(cur); cur = ""; } else cur += c; }
  parts.push(cur); return parts;
}

// home: the page's own document; html-level context classes (.js, .lv, html:not(.js)) stay in front of the scope
const ROOTCTX = /^((?:html(?::not\(\.js\)|\.[\w-]+)*|\.js|\.lv)(?:\s*(?:\.js|\.lv))*)(\s+|$)/;
function scopeHome(raw) {
  const lead = raw.match(/^\s*/)[0], s = raw.trim();
  if (s === ":root" || s === "body") return lead + ".ge-root";
  if (s.startsWith(":root")) return raw;                 // view-transition pseudos live on <html>
  if (s === "html") return raw;
  const m = s.match(ROOTCTX);
  if (m) return lead + m[1] + " .ge-root" + (m[2] ? " " + s.slice(m[0].length) : "");
  return lead + ".ge-root " + s;
}
// page stylesheets: the wrapper <div data-css="…"> stands in for <body>
function scopePage(name) {
  const w = `:where([data-css~="${name}"])`;
  return raw => {
    const lead = raw.match(/^\s*/)[0], s = raw.trim();
    const b = s.match(/^(?:body|:root|html)(?=$|[\s\[.:#>+~])/);
    if (b) return lead + w + s.slice(b[0].length);
    return lead + w + " " + s;
  };
}
const scopeSel = mode === "home" ? scopeHome : mode.startsWith("scope:") ? scopePage(mode.slice(6)) : null;

function emit(items) {
  return items.map(it => {
    if (it.kind === "text") return it.text;
    const pre = it.prelude.replace(/\/\*[\s\S]*?\*\//g, "").trim();   // comments may precede an at-rule
    if (/^@(keyframes|font-face|property)/.test(pre)) return it.prelude + "{" + it.body + "}";
    if (/^@(media|supports|container|layer)/.test(pre)) return it.prelude + "{" + emit(parse(it.body)) + "}";
    const cm = it.prelude.match(/^([\s\S]*\*\/)?(\s*)([\s\S]*)$/);   // comments may precede the selector
    return (cm[1] || "") + cm[2] + splitSelectors(cm[3]).map(scopeSel).join(",") + "{" + it.body + "}";
  }).join("");
}

src = src.replace(/url\((["']?)\.\.\/img\//g, "url($1/assets/img/")
  .replace(/"Caprasimo"/g, 'var(--font-caprasimo), "Caprasimo"')
  .replace(/"Atkinson Hyperlegible Next"/g, 'var(--font-atkinson), "Atkinson Hyperlegible Next"')
  .replace(/"Alfa Slab One"/g, 'var(--font-alfa), "Alfa Slab One"');
const head = `/* Ported from assets/css/${inPath.split("/").pop()} by tools/port/scope-css.mjs (${mode}). Edit here; the static file is retired. */\n`;
fs.writeFileSync(outPath, head + (scopeSel ? emit(parse(src)) : src));
console.log(mode.padEnd(14), inPath, "->", outPath);
