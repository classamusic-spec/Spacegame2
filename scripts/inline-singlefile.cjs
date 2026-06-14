// Bundles the production build into a single, self-contained HTML file
// (space-explorer-academy.html) that runs by just opening it in a browser —
// no server, no external files. Run after `vite build` (see `npm run single`).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// Inline the stylesheet.
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/, (_m, href) => {
  const css = fs.readFileSync(path.join(dist, href.replace(/^\.?\//, '')), 'utf8');
  return `<style>\n${css}\n</style>`;
});

// Inline the JS module (already contains Three.js + all curriculum data).
html = html.replace(/<script type="module"[^>]*src="([^"]+\.js)"[^>]*><\/script>/, (_m, src) => {
  const js = fs.readFileSync(path.join(dist, src.replace(/^\.?\//, '')), 'utf8');
  const safe = js.replace(/<\/script>/g, '<\\/script>');
  return `<script type="module">\n${safe}\n</script>`;
});

const out = path.join(root, 'space-explorer-academy.html');
fs.writeFileSync(out, html);
const remaining = (html.match(/assets\//g) || []).length;
const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Wrote ${path.basename(out)} (${kb} KB), external asset refs: ${remaining}`);
