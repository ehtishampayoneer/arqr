/* Bump the ?v=N on every asset URL so browsers fetch replaced art.
   Run after changing anything in assets/:  node bump-assets.js  */
const fs = require('fs');
const file = 'index.html';
let s = fs.readFileSync(file, 'utf8');
const current = Number((s.match(/\?v=(\d+)/) || [, 0])[1]);
const next = current + 1;
const n = (s.match(/\?v=\d+/g) || []).length;
s = s.replace(/\?v=\d+/g, '?v=' + next);
fs.writeFileSync(file, s, 'utf8');
console.log('bumped ' + n + ' asset URLs: v=' + current + ' -> v=' + next);
