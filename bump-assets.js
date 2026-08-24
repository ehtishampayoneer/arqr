/* Bump the ?v=N on every asset URL so browsers fetch replaced art.
   Run after changing anything in assets/:  node bump-assets.js  */
const fs = require('fs');
const files = ['index.html', 'catalog.html'];
let s = fs.readFileSync(files[0], 'utf8');
const current = Number((s.match(/\?v=(\d+)/) || [, 0])[1]);
const next = current + 1;
const n = (s.match(/\?v=\d+/g) || []).length;
let total = 0;
files.forEach(f => {
  let t = fs.readFileSync(f, 'utf8');
  total += (t.match(/\?v=\d+/g) || []).length;
  fs.writeFileSync(f, t.replace(/\?v=\d+/g, '?v=' + next), 'utf8');
});
console.log('bumped ' + total + ' asset URLs across ' + files.length + ' pages: v=' + current + ' -> v=' + next);
