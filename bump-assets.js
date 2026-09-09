/* Bump the ?v=N on every asset URL so browsers fetch replaced art.
   Run after changing anything in assets/:  node bump-assets.js

   The lookahead is load-bearing. seo.js stamps the share cards and the
   schema logo with eight characters of their own hash, and a hash can
   begin with digits: ?v=99450dfe would otherwise match as far as 99450
   and be rewritten to ?v=77dfe, which is a URL for nothing. Only a run
   of digits with no letter or digit after it is this file's to move. */
const fs = require('fs');
const files = ['index.html', 'catalog.html', 'store.html',
               'terms.html', 'privacy.html', 'refund.html'];
let s = fs.readFileSync(files[0], 'utf8');
const current = Number((s.match(/\?v=(\d+)(?![0-9a-zA-Z])/) || [, 0])[1]);
const next = current + 1;
const n = (s.match(/\?v=\d+(?![0-9a-zA-Z])/g) || []).length;
let total = 0;
files.forEach(f => {
  let t = fs.readFileSync(f, 'utf8');
  total += (t.match(/\?v=\d+(?![0-9a-zA-Z])/g) || []).length;
  fs.writeFileSync(f, t.replace(/\?v=\d+(?![0-9a-zA-Z])/g, '?v=' + next), 'utf8');
});
console.log('bumped ' + total + ' asset URLs across ' + files.length + ' pages: v=' + current + ' -> v=' + next);
