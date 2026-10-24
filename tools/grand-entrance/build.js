// Rebuilds the home page: regenerates the store-front scene, then inlines it into index.template.html at <!--SCENE-->.
// Run from the repo root: node tools/grand-entrance/build.js
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const here = __dirname, root = path.join(here, '..', '..');
const scene = path.join(here, 'scene.svg');
execFileSync(process.execPath, [path.join(here, 'make-scene.js'), scene], { stdio: 'inherit' });
const t = fs.readFileSync(path.join(here, 'index.template.html'), 'utf8');
if (!t.includes('<!--SCENE-->')) throw new Error('index.template.html has no <!--SCENE--> marker');
fs.writeFileSync(path.join(root, 'index.html'), t.replace('<!--SCENE-->', fs.readFileSync(scene, 'utf8')));
console.log('index.html rebuilt');
