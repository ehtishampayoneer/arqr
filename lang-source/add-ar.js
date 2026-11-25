/* Merge lang-source/part5-ar.js into the hand-written lang/ar.js (adds or replaces keys in t). */
'use strict';
const fs = require('fs'), path = require('path');
const add = require('./part5-ar.js');
const p = path.join(__dirname, '..', 'lang', 'ar.js');
let s = fs.readFileSync(p, 'utf8');
const marker = '/* ---------------- part5: web store wording, Sales Engine, Custom plan ---------------- */';
const i = s.indexOf(marker); if (i > -1) { const j = s.indexOf('/* ---------------- end part5 */', i); s = s.slice(0, i) + s.slice(j + '/* ---------------- end part5 */'.length + 1); }
const lines = Object.keys(add).map(k => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(add[k]) + ',');
const at = s.indexOf('  t: {') + '  t: {'.length + 1;
s = s.slice(0, at) + '    ' + marker + '\n' + lines.join('\n') + '\n    /* ---------------- end part5 */\n' + s.slice(at);
fs.writeFileSync(p, s, 'utf8');
console.log('ar: merged', lines.length, 'strings');
