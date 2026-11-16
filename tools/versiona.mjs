// Da lanciare ogni volta che cambia il codice dell'app (index.html, js/):
//   node tools/versiona.mjs 7        (numero di versione nuovo)
//   node tools/gen-scene.mjs "etichetta"
// Mette "?v=N" su tutti gli indirizzi dei moduli, cosi' il browser del visore non riusa i file vecchi in cache,
// e scrive la stessa versione nell'app (APPV) e nel generatore della scena (APP).
import fs from 'fs';
const v = process.argv[2];
if (!/^[\w.-]+$/.test(v || '')) { console.error('uso: node tools/versiona.mjs VERSIONE'); process.exit(1); }
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const u = new URL(f, root), a = fs.readFileSync(u, 'utf8'), b = fn(a); if (a === b) console.log('invariato', f); fs.writeFileSync(u, b); };
const mods = /(\.\/(?:js\/)?(?:app|builder|mats|house|catalog)\.js)(\?v=[\w.-]+)?(['"])/g;
for (const f of ['index.html', 'js/app.js', 'js/builder.js', 'js/mats.js', 'js/house.js', 'js/catalog.js']) edit(f, s => s.replace(mods, `$1?v=${v}$3`));
edit('js/app.js', s => s.replace(/const APPV = '[^']*'/, `const APPV = '${v}'`));
edit('tools/gen-scene.mjs', s => s.replace(/const APP = '[^']*'/, `const APP = '${v}'`));
console.log('versione app', v);
