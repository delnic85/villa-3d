// Catalogo degli oggetti (arredi interni, esterni, verde, recinzioni, pavimentazioni).
// Convenzione: origine a terra, fronte dell'oggetto verso +z, schiena verso -z.
import { Builder, WALK } from './builder.js';
import { getMat } from './mats.js';

export const CATS = {
  sogg: 'Soggiorno', cuc: 'Cucina e pranzo', notte: 'Camere e studio', bagno: 'Bagno e servizi',
  verde: 'Verde e luci', est: 'Arredo esterno', pav: 'Pavimentazioni e recinzioni'
};
export const CAT = {};
function def(id, name, cat, o, fn) { CAT[id] = { id, name, cat, ...o, fn }; }
const TS = { m: 'tessuto_grigio', mg: 'tess', n1: 'Rivestimento', n2: 'Piedini e struttura', m2g: 'met' };
const LG = { m: 'legno_rovere', mg: 'legni', n1: 'Finitura' };
const LB = { m: 'laccato_bianco', mg: 'legni', n1: 'Finitura' };

function sedia(B, x, z, ry, m, m2) {
  B.at(x, 0, z, ry);
  B.bx(0, 0.43, 0, 0.44, 0.04, 0.44, m); B.bx(0, 0.47, -0.2, 0.44, 0.4, 0.035, m);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(sx * 0.19, 0, sz * 0.19, 0.03, 0.43, 0.03, m2);
  B.pop();
}
function divano(B, w, m, m2, d = 0.88) {
  B.bx(0, 0.1, 0, w, 0.3, d, m); B.bx(0, 0.4, -d / 2 + 0.11, w, 0.38, 0.22, m);
  for (const s of [-1, 1]) { B.bx(s * (w / 2 - 0.1), 0.4, 0.06, 0.2, 0.2, d - 0.22, m); B.bx(s * (w / 2 - 0.08), 0, d / 2 - 0.1, 0.06, 0.1, 0.06, m2); B.bx(s * (w / 2 - 0.08), 0, -d / 2 + 0.1, 0.06, 0.1, 0.06, m2); }
  const n = Math.max(1, Math.round((w - 0.4) / 0.65)), cw = (w - 0.4) / n;
  for (let i = 0; i < n; i++) { const x = -w / 2 + 0.2 + cw * (i + 0.5); B.bx(x, 0.4, 0.1, cw - 0.03, 0.11, d - 0.34, m); B.bx(x, 0.51, -d / 2 + 0.27, cw - 0.05, 0.3, 0.12, m); }
}
function tavolo(B, w, d, m, m2, cm, cm2) {
  B.bx(0, 0.71, 0, w, 0.05, d, m);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1), 0.06, 0.71, 0.06, m2);
  const n = Math.max(1, Math.round(w / 0.6));
  for (let i = 0; i < n; i++) { const x = (-w / 2 + w * (i + 0.5) / n) * 0.92; sedia(B, x, -d / 2 - 0.1, 0, cm, cm2); sedia(B, x, d / 2 + 0.1, Math.PI, cm, cm2); }
}
function letto(B, w, m, m2) {
  const l = 2.05;
  B.bx(0, 0.08, 0.02, w, 0.22, l - 0.04, m2); B.bx(0, 0.3, 0.03, w - 0.04, 0.2, l - 0.1, 'tessuto_beige');
  B.bx(0, 0, -l / 2 + 0.04, w + 0.1, 1.0, 0.08, m);
  const np = w > 1.4 ? 2 : 1;
  for (let i = 0; i < np; i++) { const x = np === 2 ? (i ? 0.4 : -0.4) * w / 1.7 : 0; B.bx(x, 0.5, -l / 2 + 0.36, Math.min(0.62, w - 0.2), 0.1, 0.38, 'tessuto_grigio'); }
  B.bx(0, 0.5, 0.33, w - 0.02, 0.035, l * 0.62, m);
}
function ante(B, w, h, y0, zf, col = 'metallo_nero', step = 0.55) {
  const n = Math.max(1, Math.round(w / step));
  for (let i = 1; i < n; i++) B.bx(-w / 2 + w * i / n, y0, zf, 0.006, h, 0.004, col);
}

// ---------------- soggiorno ----------------
def('divano2', 'Divano 2 posti', 'sogg', { ...TS, m2: 'metallo_nero', w: [1.6, 1.2, 2.2, 0.1] }, (B, o, m, m2, w) => divano(B, w, m, m2));
def('divano3', 'Divano 3 posti', 'sogg', { ...TS, m2: 'metallo_nero', w: [2.3, 1.8, 3.4, 0.1] }, (B, o, m, m2, w) => divano(B, w, m, m2));
def('divano_ang', 'Divano angolare', 'sogg', { ...TS, m2: 'metallo_nero', w: [2.8, 2.2, 3.6, 0.1] }, (B, o, m, m2, w) => {
  divano(B, w, m, m2, 0.95); B.bx(-w / 2 + 0.5, 0.1, 1.2, 1.0, 0.3, 1.5, m); B.bx(-w / 2 + 0.5, 0.4, 1.2, 0.94, 0.11, 1.44, m);
});
def('poltrona', 'Poltrona', 'sogg', { ...TS, m2: 'metallo_nero' }, (B, o, m, m2) => divano(B, 0.95, m, m2));
def('tavolino', 'Tavolino', 'sogg', { ...LG, m2: 'metallo_nero', w: [0.8, 0.5, 1.4, 0.1], d: [1.2, 0.5, 1.6, 0.1] }, (B, o, m, m2, w, d) => {
  B.bx(0, 0.3, 0, w, 0.05, d, m);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), 0.03, 0.3, 0.03, m2);
});
def('tappeto', 'Tappeto', 'sogg', { m: 'tessuto_beige', mg: 'tess', n1: 'Colore', w: [2.0, 1, 4, 0.2], d: [3.0, 1, 5, 0.2] }, (B, o, m, m2, w, d) => B.bx(0, 0.004, 0, w, 0.012, d, m));
def('mobile_tv', 'Mobile TV con televisore', 'sogg', { ...LB, w: [2.4, 1.4, 4.6, 0.2] }, (B, o, m, m2, w) => {
  B.bx(0, 0.12, 0, w, 0.36, 0.45, m); ante(B, w, 0.32, 0.14, 0.227, 'metallo_nero', 0.8);
  B.bx(0, 0.78, -0.19, 1.45, 0.83, 0.035, 'schermo');
});
def('libreria', 'Libreria', 'sogg', { ...LG, w: [1.2, 0.6, 3, 0.2] }, (B, o, m, m2, w) => {
  B.bx(-w / 2 + 0.015, 0, 0, 0.03, 2.0, 0.34, m); B.bx(w / 2 - 0.015, 0, 0, 0.03, 2.0, 0.34, m); B.bx(0, 0, -0.165, w, 2.0, 0.012, m);
  for (let i = 0; i < 6; i++) B.bx(0, i * 0.394, 0, w - 0.06, 0.03, 0.34, m);
  const cols = ['tessuto_blu', 'tessuto_bordeaux', 'tessuto_senape', 'tessuto_verde', 'tessuto_chiaro'];
  for (let i = 0; i < 5; i++) for (let k = 0; k < Math.floor((w - 0.2) / 0.3); k++) B.bx(-w / 2 + 0.25 + k * 0.3, i * 0.394 + 0.03, 0.02, 0.16, 0.22 + ((i + k) % 3) * 0.04, 0.2, cols[(i * 2 + k) % 5]);
});
def('pianta', 'Pianta da interno', 'sogg', { m: 'cemento', mg: 'met', n1: 'Vaso' }, (B, o, m) => {
  B.cyl(0, 0, 0, 0.2, 0.4, m, 10, 0.24); B.cyl(0, 0.4, 0, 0.025, 0.5, 'tronco', 6);
  B.ball(0, 1.15, 0, 0.42, 0.45, 0.42, 'verde_foglia'); B.ball(0.18, 0.85, 0.1, 0.3, 0.28, 0.3, 'verde_scuro'); B.ball(-0.16, 0.95, -0.12, 0.28, 0.3, 0.28, 'verde_foglia');
});
def('lampada_terra', 'Lampada da terra', 'sogg', { m: 'metallo_nero', mg: 'met', n1: 'Stelo' }, (B, o, m) => {
  B.cyl(0, 0, 0, 0.15, 0.03, m, 12); B.cyl(0, 0.03, 0, 0.015, 1.45, m, 6); B.cyl(0, 1.4, 0, 0.2, 0.28, 'luce', 12, 0.14);
});
def('quadro', 'Quadro a parete', 'sogg', { m: 'tessuto_blu', mg: 'tess', n1: 'Colore', w: [1.2, 0.4, 2.4, 0.2] }, (B, o, m, m2, w) => {
  B.bx(0, 1.25, 0, w, 0.8, 0.03, 'metallo_nero'); B.bx(0, 1.29, 0.012, w - 0.08, 0.72, 0.012, m); B.bx(-w * 0.15, 1.45, 0.02, w * 0.3, 0.3, 0.004, 'tessuto_senape');
});
// ---------------- cucina e pranzo ----------------
def('tavolo_pranzo', 'Tavolo da pranzo con sedie', 'cuc', { ...LG, m2: 'metallo_nero', n2: 'Gambe', w: [1.6, 0.8, 3.2, 0.2], d: [0.8, 0.7, 1.2, 0.1] }, (B, o, m, m2, w, d) => tavolo(B, w, d, m, m2, 'tessuto_antracite', m2));
def('sedia', 'Sedia', 'cuc', { m: 'tessuto_antracite', mg: 'tess', n1: 'Seduta', m2: 'metallo_nero' }, (B, o, m, m2) => sedia(B, 0, 0, 0, m, m2));
def('sgabello', 'Sgabello', 'cuc', { m: 'tessuto_antracite', mg: 'tess', n1: 'Seduta', m2: 'metallo_nero' }, (B, o, m, m2) => {
  B.cyl(0, 0.62, 0, 0.18, 0.05, m, 12); B.cyl(0, 0.02, 0, 0.025, 0.6, m2, 6); B.cyl(0, 0, 0, 0.2, 0.02, m2, 12);
});
def('cucina_base', 'Cucina: basi con piano', 'cuc', { ...LB, m: 'laccato_grigio', m2: 'pietra_top', m2g: 'met', n2: 'Piano', w: [3.0, 0.6, 7, 0.3] }, (B, o, m, m2, w) => {
  B.bx(0, 0.1, 0, w, 0.78, 0.58, m); B.bx(0, 0, -0.03, w, 0.1, 0.5, 'metallo_nero'); B.bx(0, 0.88, 0.01, w, 0.04, 0.62, m2);
  ante(B, w, 0.74, 0.12, 0.291, 'metallo_nero', 0.6);
  if (o.sink != null) { B.bx(o.sink, 0.921, 0.02, 0.78, 0.004, 0.42, 'acciaio'); B.cyl(o.sink, 0.92, -0.22, 0.015, 0.28, 'acciaio', 6); }
  if (o.hob != null) B.bx(o.hob, 0.921, 0.02, 0.76, 0.005, 0.5, 'schermo');
});
def('cucina_colonne', 'Cucina: colonne', 'cuc', { ...LB, m: 'laccato_grigio', w: [1.8, 0.2, 4.8, 0.3] }, (B, o, m, m2, w) => {
  B.bx(0, 0.1, 0, w, 2.3, 0.58, m); B.bx(0, 0, -0.03, w, 0.1, 0.5, 'metallo_nero'); ante(B, w, 2.26, 0.12, 0.291, 'metallo_nero', 0.6);
  if (w >= 1.7) B.bx(-w / 2 + 0.9, 1.05, 0.292, 0.54, 0.44, 0.004, 'schermo');
});
def('anta_passaggio', 'Anta-porta della cucina', 'cuc', { ...LB, m: 'laccato_grigio', w: [0.81, 0.6, 1.0, 0.05] }, (B, o, m, m2, w) => {
  B.bx(0, 2.1, 0, w, 0.3, 0.58, m);
  B.rbx(-w / 2 + 0.01, 0.1, 0.29 + (w - 0.02) / 2, w - 0.02, 2.0, 0.02, Math.PI / 2 * 0.98, m);
});
def('isola', 'Isola con piano snack', 'cuc', { ...LB, m: 'laccato_grigio', m2: 'pietra_top', m2g: 'met', n2: 'Piano' }, (B, o, m, m2) => {
  B.bx(0, 0.1, 0, 2.0, 0.78, 0.6, m); B.bx(0, 0, 0, 1.9, 0.1, 0.5, 'metallo_nero'); B.bx(0, 0.88, 0, 2.04, 0.04, 0.64, m2);
  B.bx(-0.62, 0.921, 0, 0.5, 0.004, 0.42, 'acciaio'); B.cyl(-0.62, 0.92, -0.24, 0.015, 0.28, 'acciaio', 6); B.bx(0.35, 0.921, 0, 0.76, 0.005, 0.5, 'schermo');
  B.bx(0.1, 0.9, 0.56, 1.72, 0.05, 0.52, 'legno_rovere'); B.bx(-0.74, 0, 0.56, 0.04, 0.9, 0.5, 'legno_rovere');
});
def('frigo', 'Frigorifero', 'cuc', { m: 'acciaio', mg: 'met', n1: 'Finitura' }, (B, o, m) => { B.bx(0, 0, 0, 0.7, 2.0, 0.68, m); B.bx(0, 0.02, 0.341, 0.006, 1.96, 0.004, 'metallo_nero'); });
// ---------------- camere e studio ----------------
def('letto_matr', 'Letto matrimoniale', 'notte', { ...TS, m2: 'legno_rovere', m2g: 'legni', n1: 'Testata e copriletto', n2: 'Struttura' }, (B, o, m, m2) => letto(B, 1.72, m, m2));
def('letto_sing', 'Letto singolo / una piazza e mezza', 'notte', { ...TS, m: 'tessuto_blu', m2: 'legno_rovere', m2g: 'legni', n1: 'Testata e copriletto', n2: 'Struttura', w: [1.0, 0.9, 1.4, 0.1] }, (B, o, m, m2, w) => letto(B, w, m, m2));
def('comodino', 'Comodino', 'notte', LG, (B, o, m) => { B.bx(0, 0.1, 0, 0.45, 0.38, 0.4, m); B.bx(0, 0, 0, 0.36, 0.1, 0.3, 'metallo_nero'); B.bx(0, 0.28, 0.201, 0.43, 0.006, 0.004, 'metallo_nero'); });
def('armadio', 'Armadio', 'notte', { ...LB, w: [2.4, 0.6, 6, 0.2] }, (B, o, m, m2, w) => { B.bx(0, 0, 0, w, 2.55, 0.6, m); ante(B, w, 2.51, 0.02, 0.301, 'laccato_grigio', 0.52); });
def('cassettiera', 'Cassettiera', 'notte', { ...LB, w: [1.2, 0.6, 3, 0.2] }, (B, o, m, m2, w) => {
  B.bx(0, 0, 0, w, 0.9, 0.5, m); for (let i = 1; i < 4; i++) B.bx(0, i * 0.225, 0.251, w - 0.02, 0.006, 0.004, 'laccato_grigio');
});
def('scrivania', 'Scrivania', 'notte', { ...LG, m2: 'metallo_nero', n2: 'Gambe', w: [1.4, 0.8, 2.4, 0.1] }, (B, o, m, m2, w) => {
  B.bx(0, 0.72, 0, w, 0.04, 0.7, m); for (const s of [-1, 1]) { B.bx(s * (w / 2 - 0.05), 0, 0.3, 0.05, 0.72, 0.05, m2); B.bx(s * (w / 2 - 0.05), 0, -0.3, 0.05, 0.72, 0.05, m2); }
  B.bx(0, 0.76, 0.12, 0.6, 0.38, 0.03, 'schermo'); B.bx(0, 0.76, 0.1, 0.2, 0.02, 0.14, 'metallo_nero');
});
def('sedia_ufficio', 'Sedia da ufficio', 'notte', { m: 'tessuto_antracite', mg: 'tess', n1: 'Seduta' }, (B, o, m) => {
  B.cyl(0, 0, 0, 0.28, 0.04, 'metallo_nero', 10); B.cyl(0, 0.04, 0, 0.03, 0.4, 'metallo_nero', 6); B.bx(0, 0.44, 0, 0.48, 0.07, 0.46, m); B.bx(0, 0.55, -0.22, 0.44, 0.5, 0.05, m);
});
def('scaffale', 'Scaffale', 'notte', { ...LB, w: [1.6, 0.6, 3, 0.2] }, (B, o, m, m2, w) => {
  for (const s of [-1, 1]) B.bx(s * (w / 2 - 0.015), 0, 0, 0.03, 2.0, 0.4, m);
  for (let i = 0; i < 6; i++) B.bx(0, 0.05 + i * 0.385, 0, w - 0.06, 0.03, 0.4, m);
});
// ---------------- bagno e servizi ----------------
def('wc', 'WC sospeso', 'bagno', {}, B => { B.bx(0, 0.2, 0.02, 0.36, 0.22, 0.52, 'ceramica'); B.bx(0, 0.42, 0.02, 0.37, 0.025, 0.53, 'ceramica'); B.bx(0, 0.95, -0.265, 0.24, 0.16, 0.012, 'acciaio'); });
def('bidet', 'Bidet sospeso', 'bagno', {}, B => { B.bx(0, 0.2, 0.02, 0.36, 0.2, 0.52, 'ceramica'); B.cyl(0, 0.4, -0.15, 0.015, 0.1, 'acciaio', 6); });
def('lavabo', 'Mobile lavabo con specchio', 'bagno', { ...LG, w: [0.9, 0.6, 2.0, 0.1] }, (B, o, m, m2, w) => {
  B.bx(0, 0.45, 0, w, 0.38, 0.46, m); B.bx(0, 0.83, 0.005, w + 0.02, 0.05, 0.48, 'ceramica'); B.bx(0, 0.885, 0.02, Math.min(0.5, w - 0.2), 0.003, 0.3, 'acciaio');
  B.cyl(0, 0.88, -0.17, 0.014, 0.16, 'acciaio', 6); B.bx(0, 1.15, -0.225, w, 0.8, 0.02, 'specchio');
});
def('doccia', 'Doccia', 'bagno', { w: [1.2, 0.8, 2.0, 0.1], d: [0.9, 0.7, 1.4, 0.1] }, (B, o, m, m2, w, d) => {
  B.bx(0, 0, 0, w, 0.04, d, 'ceramica'); B.bx(0, 0.04, d / 2 - 0.01, w, 2.0, 0.012, 'vetro'); B.bx(w / 2 - 0.01, 0.04, 0, 0.012, 2.0, d, 'vetro');
  B.cyl(-w / 2 + 0.15, 2.05, -d / 2 + 0.15, 0.11, 0.015, 'acciaio', 10); B.bx(-w / 2 + 0.15, 1.0, -d / 2 + 0.03, 0.03, 1.07, 0.03, 'acciaio');
});
def('vasca', 'Vasca da bagno', 'bagno', {}, B => { B.bx(0, 0, 0, 1.7, 0.56, 0.78, 'ceramica'); B.bx(0, 0.561, 0, 1.52, 0.004, 0.6, 'specchio'); B.cyl(0.7, 0.56, -0.3, 0.015, 0.14, 'acciaio', 6); });
def('lavatrice', 'Lavatrice / asciugatrice', 'bagno', {}, B => { B.bx(0, 0, 0, 0.6, 0.85, 0.6, 'acciaio'); B.bx(0, 0.25, 0.301, 0.34, 0.34, 0.004, 'schermo'); B.bx(0, 0.72, 0.301, 0.5, 0.08, 0.004, 'laccato_antracite'); });
def('caldaia', 'Caldaia a parete', 'bagno', {}, B => { B.bx(0, 1.2, 0, 0.5, 0.8, 0.35, 'laccato_grigio'); B.cyl(-0.12, 0.6, 0, 0.02, 0.6, 'acciaio', 6); B.cyl(0.12, 0.6, 0, 0.02, 0.6, 'acciaio', 6); });
def('accumulo', 'Accumulo / pompa di calore', 'bagno', {}, B => { B.cyl(0, 0, 0, 0.3, 1.7, 'laccato_grigio', 14); B.cyl(0, 1.7, 0, 0.3, 0.06, 'metallo_nero', 14); });
// ---------------- verde e luci ----------------
def('fioriera', 'Fioriera con piante', 'verde', { m: 'cemento', mg: 'met', n1: 'Vasca', w: [2.0, 0.8, 5, 0.2] }, (B, o, m, m2, w) => {
  B.bx(0, 0, 0, w, 0.5, 0.7, m); B.bx(0, 0.5, 0, w - 0.1, 0.02, 0.6, 'terra_vaso');
  const n = Math.max(1, Math.round(w / 0.62));
  for (let i = 0; i < n; i++) { const x = -w / 2 + w * (i + 0.5) / n; B.ball(x, 0.78, (i % 2 ? 0.06 : -0.06), 0.34, 0.3 + (i % 3) * 0.05, 0.3, i % 2 ? 'verde_scuro' : 'verde_foglia'); }
  if (o.cactus) { B.cyl(0.25, 0.5, 0, 0.09, 1.05, 'verde_oliva', 8); B.cyl(0.43, 0.9, 0, 0.05, 0.4, 'verde_oliva', 6); B.bx(0.36, 0.86, 0, 0.12, 0.08, 0.08, 'verde_oliva'); B.cyl(0.08, 1.0, 0, 0.05, 0.3, 'verde_oliva', 6); B.bx(0.15, 0.96, 0, 0.12, 0.08, 0.08, 'verde_oliva'); }
});
def('albero', 'Albero', 'verde', {}, B => {
  B.cyl(0, 0, 0, 0.13, 2.3, 'tronco', 8, 0.09); B.ball(0, 3.2, 0, 1.35, 1.15, 1.35, 'verde_foglia'); B.ball(0.75, 2.7, 0.3, 0.85, 0.75, 0.85, 'verde_scuro'); B.ball(-0.7, 2.8, -0.35, 0.9, 0.75, 0.9, 'verde_foglia');
});
def('olivo', 'Olivo', 'verde', {}, B => {
  B.cyl(0, 0, 0, 0.16, 1.3, 'tronco', 8, 0.1); B.ball(0, 2.0, 0, 1.05, 0.8, 1.05, 'verde_oliva'); B.ball(0.5, 1.75, 0.3, 0.65, 0.5, 0.65, 'verde_oliva');
});
def('cespuglio', 'Cespuglio', 'verde', {}, B => { B.ball(0, 0.4, 0, 0.55, 0.45, 0.55, 'verde_foglia'); B.ball(0.4, 0.3, 0.15, 0.4, 0.33, 0.4, 'verde_scuro'); B.ball(-0.35, 0.28, -0.1, 0.36, 0.3, 0.36, 'verde_scuro'); });
def('siepe', 'Siepe', 'verde', { w: [3.0, 1, 20, 0.5] }, (B, o, m, m2, w) => { B.bx(0, 0, 0, w, 1.4, 0.6, 'verde_scuro'); });
def('cactus', 'Cactus', 'verde', {}, B => { B.cyl(0, 0, 0, 0.11, 1.3, 'verde_oliva', 8); B.cyl(0.24, 0.55, 0, 0.06, 0.5, 'verde_oliva', 6); B.bx(0.14, 0.5, 0, 0.16, 0.1, 0.1, 'verde_oliva'); });
def('lampioncino', 'Lampioncino da giardino', 'verde', {}, B => { B.cyl(0, 0, 0, 0.03, 0.55, 'acciaio', 6); B.cyl(0, 0.55, 0, 0.1, 0.035, 'acciaio', 10); B.cyl(0, 0.52, 0, 0.06, 0.03, 'luce', 8); });
def('pietre_passo', 'Camminamento a lastre', 'verde', { m: 'cemento_chiaro', mg: 'terra', n1: 'Lastre', w: [4.0, 1, 20, 0.5] }, (B, o, m, m2, w) => {
  const n = Math.max(1, Math.round(w / 0.75));
  for (let i = 0; i < n; i++) B.bx(-w / 2 + w * (i + 0.5) / n, 0.02, 0, 0.55, 0.035, 0.95, m);
});
// ---------------- arredo esterno ----------------
def('pergola', 'Pergola', 'est', { m: 'laccato_bianco', mg: 'legni', n1: 'Struttura', m2: 'legno_noce', m2g: 'legni', n2: 'Listelli copertura', w: [4.2, 2, 9, 0.2], d: [6.4, 2, 12, 0.2] }, (B, o, m, m2, w, d) => {
  const h = 2.6, p = 0.16, xs = [-w / 2 + p / 2, w / 2 - p / 2], zs = [-d / 2 + p / 2, 0, d / 2 - p / 2];
  for (const x of xs) for (const z of zs) B.bx(x, 0, z, p, h, p, m);
  for (const x of xs) B.bx(x, h, 0, p, 0.22, d, m);
  for (const z of zs) B.bx(0, h, z, w - 2 * p, 0.22, p, m);
  const n = Math.floor(d / 0.17);
  for (let i = 0; i < n; i++) { const z = -d / 2 + 0.14 + i * (d - 0.28) / (n - 1); if (Math.abs(z) > 0.12) B.bx(0, h + 0.06, z, w - 2 * p, 0.1, 0.045, m2); }
  for (let k = 0; k < 12; k++) { const y = 0.3 + k * 0.185; B.bx(-w / 2 + p / 2, y, d / 4, 0.04, 0.09, d / 2 - p, m); B.bx(0, y, d / 2 - p / 2, w - 2 * p, 0.09, 0.04, m); }
});
def('gazebo', 'Gazebo', 'est', { m: 'laccato_antracite', mg: 'legni', n1: 'Struttura', m2: 'tessuto_chiaro', m2g: 'tess', n2: 'Telo', w: [3.0, 2, 6, 0.5], d: [3.0, 2, 6, 0.5] }, (B, o, m, m2, w, d) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.bx(sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), 0.1, 2.4, 0.1, m);
  B.bx(0, 2.4, 0, w, 0.1, d, m); B.bx(0, 2.5, 0, w + 0.3, 0.05, d + 0.3, m2); B.bx(0, 2.55, 0, w * 0.55, 0.22, d * 0.55, m2);
});
def('divano_est_ang', 'Salotto angolare da esterno', 'est', { m: 'tessuto_chiaro', mg: 'tess', n1: 'Cuscini', m2: 'legno_noce', m2g: 'legni', n2: 'Struttura' }, (B, o, m, m2) => {
  // angolo in (-x,-z): un lato lungo lo schienale -z, l'altro lungo -x
  B.bx(0, 0.06, -0.9, 2.6, 0.22, 0.8, m2); B.bx(-0.9, 0.06, 0.4, 0.8, 0.22, 1.8, m2);
  for (let i = 0; i < 3; i++) { B.bx(-0.86 + i * 0.86, 0.28, -0.88, 0.82, 0.16, 0.76, m); B.bx(-0.86 + i * 0.86, 0.44, -1.2, 0.74, 0.34, 0.16, m); }
  for (let i = 0; i < 2; i++) { B.bx(-0.9, 0.28, 0 + i * 0.86, 0.76, 0.16, 0.82, m); B.bx(-1.22, 0.44, 0 + i * 0.86, 0.16, 0.34, 0.74, m); }
  B.bx(0.35, 0.06, 0.35, 0.8, 0.26, 0.8, m2); B.bx(0.35, 0.32, 0.35, 0.76, 0.12, 0.76, m);
});
def('tavolo_est', 'Tavolo da esterno con sedie', 'est', { m: 'legno_noce', mg: 'legni', n1: 'Piano', m2: 'metallo_nero', w: [2.4, 1.2, 3.6, 0.2], d: [1.0, 0.8, 1.2, 0.1] }, (B, o, m, m2, w, d) => tavolo(B, w, d, m, m2, m, m2));
def('lettino', 'Lettino prendisole', 'est', { m: 'tessuto_chiaro', mg: 'tess', n1: 'Cuscino', m2: 'legno_noce', m2g: 'legni', n2: 'Struttura' }, (B, o, m, m2) => {
  B.bx(0, 0.1, 0, 0.75, 0.18, 2.0, m2); B.bx(0, 0.28, 0.28, 0.7, 0.12, 1.4, m); B.bx(0, 0.36, -0.7, 0.7, 0.14, 0.56, m);
});
def('ombrellone', 'Ombrellone', 'est', { m: 'tessuto_chiaro', mg: 'tess', n1: 'Telo' }, (B, o, m) => { B.cyl(0, 0, 0, 0.25, 0.06, 'cemento', 10); B.cyl(0, 0.06, 0, 0.025, 2.4, 'acciaio', 6); B.cyl(0, 2.1, 0, 1.5, 0.45, m, 8, 0.05); });
def('panca', 'Panca', 'est', { m: 'cemento', mg: 'met', n1: 'Materiale' }, (B, o, m) => { B.bx(0, 0.36, 0, 1.9, 0.1, 0.45, m); B.bx(-0.8, 0, 0, 0.12, 0.36, 0.45, m); B.bx(0.8, 0, 0, 0.12, 0.36, 0.45, m); });
def('barbecue', 'Barbecue in muratura', 'est', { m: 'pietra_chiara', mg: 'est', n1: 'Rivestimento' }, (B, o, m) => {
  B.bx(0, 0, 0, 1.6, 0.85, 0.7, m); B.bx(0, 0.85, 0, 1.7, 0.06, 0.76, 'cemento'); B.bx(-0.35, 0.911, 0, 0.7, 0.01, 0.5, 'schermo'); B.bx(-0.35, 0.91, -0.3, 0.8, 0.9, 0.1, m);
});
def('piscina', 'Piscina', 'est', { m: 'pietra_chiara', mg: 'est', n1: 'Bordo', w: [8, 3, 14, 0.5], d: [4, 2, 7, 0.5] }, (B, o, m, m2, w, d) => {
  B.bx(0, 0.02, -d / 2 + 0.2, w, 0.07, 0.4, m); B.bx(0, 0.02, d / 2 - 0.2, w, 0.07, 0.4, m); B.bx(-w / 2 + 0.2, 0.02, 0, 0.4, 0.07, d - 0.8, m); B.bx(w / 2 - 0.2, 0.02, 0, 0.4, 0.07, d - 0.8, m);
  B.bx(0, 0.02, 0, w - 0.8, 0.02, d - 0.8, 'fondo_piscina'); B.face('y+', -w / 2 + 0.4, 0, -d / 2 + 0.4, w / 2 - 0.4, 0.07, d / 2 - 0.4, 'acqua');
});
def('auto', 'Automobile', 'est', { m: 'carrozzeria_nera', mg: 'met', n1: 'Carrozzeria' }, (B, o, m) => {
  B.bx(0, 0.28, 0, 1.85, 0.55, 4.5, m); B.bx(0, 0.83, -0.2, 1.62, 0.5, 2.4, m);
  for (const s of [-1, 1]) { B.bx(s * 0.812, 0.9, -0.2, 0.008, 0.36, 2.1, 'schermo'); for (const z of [-1.45, 1.45]) B.bx(s * 0.84, 0, z, 0.24, 0.66, 0.66, 'gomma'); B.bx(s * 0.62, 0.58, 2.252, 0.42, 0.12, 0.008, 'luce'); B.bx(s * 0.62, 0.62, -2.252, 0.42, 0.1, 0.008, 'fanale'); }
  B.bx(0, 0.9, 1.002, 1.42, 0.36, 0.008, 'schermo'); B.bx(0, 0.9, -1.402, 1.42, 0.36, 0.008, 'schermo');
});
// ---------------- pavimentazioni e recinzioni ----------------
def('zona', 'Superficie a terra (prato, pavimento, ghiaia...)', 'pav', { m: 'prato', mg: 'terra', n1: 'Materiale', w: [3, 0.5, 60, 0.5], d: [3, 0.5, 60, 0.5] }, (B, o, m, m2, w, d) => {
  const y = 0.012 + 0.006 * (o.layer ?? 6); B.face('y+', -w / 2, y - 0.01, -d / 2, w / 2, y, d / 2, m);
});
def('muro_cinta', 'Muro di cinta a pannelli', 'pav', { m: 'intonaco_bianco', mg: 'est', n1: 'Muro', m2: 'antracite_est', m2g: 'est', n2: 'Pannelli', w: [4.2, 2, 40, 0.5] }, (B, o, m, m2, w) => {
  const n = Math.max(1, Math.round(w / 4.3)), mod = w / n;
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + mod * (i + 0.5), pl = mod - 0.9;
    B.bx(cx, 0, 0, mod, 1.15, 0.25, m); B.bx(cx - pl / 2 + 0.2, 0, 0, 0.4, 1.95, 0.3, m); B.bx(cx + pl / 2 - 0.2, 0, 0, 0.4, 1.95, 0.3, m); B.bx(cx, 1.65, 0, pl, 0.3, 0.3, m);
    B.bx(cx, 0.25, 0, pl - 0.8, 1.4, 0.14, m2);
  }
});
def('recinzione', 'Muretto con ringhiera', 'pav', { m: 'intonaco_grigio', mg: 'est', n1: 'Muretto', m2: 'laccato_antracite', m2g: 'legni', n2: 'Ringhiera', w: [4, 1, 40, 0.5] }, (B, o, m, m2, w) => {
  B.bx(0, 0, 0, w, 0.85, 0.22, m);
  const n = Math.max(1, Math.round(w / 2.2));
  for (let i = 0; i <= n; i++) B.bx(-w / 2 + 0.03 + (w - 0.06) * i / n, 0.85, 0, 0.06, 1.0, 0.06, m2);
  for (let k = 0; k < 5; k++) B.bx(0, 0.95 + k * 0.19, 0, w, 0.1, 0.025, m2);
});
def('cancello_ped', 'Cancello pedonale con pensilina', 'pav', { m: 'intonaco_bianco', mg: 'est', n1: 'Portale', m2: 'laccato_grigio', m2g: 'legni', n2: 'Anta' }, (B, o, m, m2) => {
  for (const s of [-1, 1]) B.bx(s * 1.05, 0, 0, 0.5, 2.45, 0.5, m);
  B.bx(0, 2.45, 0.15, 2.6, 0.22, 1.3, m); B.rbx(-0.78, 0.05, -0.6, 1.2, 2.0, 0.05, Math.PI / 2, m2); B.bx(0.6, 0.05, 0, 0.4, 2.0, 0.05, m2);
  B.bx(-0.3, 2.44, 0.4, 0.1, 0.012, 0.1, 'luce'); B.bx(0.3, 2.44, 0.4, 0.1, 0.012, 0.1, 'luce');
});
def('cancello_car', 'Cancello carraio', 'pav', { m: 'intonaco_bianco', mg: 'est', n1: 'Pilastri', m2: 'antracite_est', m2g: 'est', n2: 'Pannello', w: [5.8, 3, 8, 0.2] }, (B, o, m, m2, w) => {
  for (const s of [-1, 1]) B.bx(s * (w / 2 - 0.2), 0, 0, 0.4, 1.95, 0.4, m);
  B.bx(0, 0.1, 0, w - 0.8, 1.7, 0.08, m2);
});

// ---------------- costruzione ----------------
export function resolveObjects(S, U) {
  const out = [], mods = U.objs || {};
  for (const o of S.objects) { const m = mods[o.id]; if (m && m.del) continue; out.push(m ? { ...o, ...m } : o); }
  for (const o of (U.added || [])) out.push(o);
  return out;
}
function emit(B, o, local) {
  const d = CAT[o.t]; if (!d) return;
  const w = o.w ?? (d.w ? d.w[0] : 0), dd = o.d ?? (d.d ? d.d[0] : 0);
  if (!local) B.at(o.p[0], o.p[1], o.p[2], (o.r || 0) * Math.PI / 180);
  d.fn(B, o, o.m || d.m, o.m2 || d.m2, w, dd);
  if (!local) B.pop();
}
export function buildObjects(list, skipId) {
  const B = new Builder(), ents = [null];
  for (const o of list) {
    if (o.id === skipId) continue;
    ents.push({ k: 'obj', id: o.id }); B.ent = ents.length - 1; B.flags = o.t === 'zona' ? WALK : 0;
    emit(B, o, false);
  }
  B.flags = 0;
  return { meshes: B.build(getMat, 'o', ents), ents };
}
// oggetto "vivo" (in fase di spostamento): costruito attorno all'origine
export function buildLive(o) {
  const B = new Builder(), ents = [null, { k: 'obj', id: o.id }];
  B.ent = 1; emit(B, o, true);
  return B.build(getMat, 'o', ents);
}
