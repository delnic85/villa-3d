// Libreria materiali: colori e texture generate al volo (nessun file esterno da scaricare).
import * as THREE from 'three';

export const GROUPS = { pav: 'Pavimenti', muri: 'Pareti', est: 'Facciate', terra: 'Esterno', legni: 'Legni', tess: 'Tessuti', met: 'Altro' };

// id: [nome, gruppo, colore, tipo texture, opzioni]   (s = metri coperti da una ripetizione)
export const LIB = {
  // pavimenti interni
  parquet_rovere: ['Parquet rovere', 'pav', '#c9a678', 'planks', { s: 2.4, rows: 16 }],
  parquet_naturale: ['Parquet chiaro', 'pav', '#dcc097', 'planks', { s: 2.4, rows: 16 }],
  parquet_sbiancato: ['Parquet sbiancato', 'pav', '#e2d8c6', 'planks', { s: 2.4, rows: 12 }],
  parquet_noce: ['Parquet noce', 'pav', '#8b5d3c', 'planks', { s: 2.4, rows: 16 }],
  parquet_scuro: ['Parquet wengé', 'pav', '#4b372a', 'planks', { s: 2.4, rows: 16 }],
  gres_grigio: ['Gres grigio 60x60', 'pav', '#a8aaab', 'tiles', { s: 1.2, n: 2 }],
  gres_antracite: ['Gres antracite 60x60', 'pav', '#505357', 'tiles', { s: 1.2, n: 2 }],
  gres_beige: ['Gres beige 60x60', 'pav', '#d5c8b2', 'tiles', { s: 1.2, n: 2 }],
  gres_bianco: ['Gres bianco 60x60', 'pav', '#ebe9e4', 'tiles', { s: 1.2, n: 2 }],
  gres_grande: ['Gres grande 120x120', 'pav', '#b9b7b2', 'tiles', { s: 2.4, n: 2 }],
  marmo_bianco: ['Marmo bianco', 'pav', '#eeece8', 'marble', { s: 2.4, vein: '#9aa0a6' }],
  marmo_nero: ['Marmo nero', 'pav', '#2a2b2e', 'marble', { s: 2.4, vein: '#c9c2b0' }],
  resina_grigia: ['Resina grigia', 'pav', '#b3b1ac', 'noise', { s: 3, amp: 0.05 }],
  resina_tortora: ['Resina tortora', 'pav', '#b7a996', 'noise', { s: 3, amp: 0.05 }],
  cotto: ['Cotto', 'pav', '#b8693f', 'tiles', { s: 0.9, n: 3, jit: 0.12 }],
  // pareti
  pittura_bianca: ['Bianco', 'muri', '#f4f2ee'],
  soffitto_bianco: ['Bianco soffitto', 'muri', '#f8f7f4'],
  avorio: ['Avorio', 'muri', '#efe6d3'],
  grigio_perla: ['Grigio perla', 'muri', '#d4d5d5'],
  tortora: ['Tortora', 'muri', '#b9aa9a'],
  salvia: ['Verde salvia', 'muri', '#b2c0a5'],
  azzurro_polvere: ['Azzurro polvere', 'muri', '#a9bfd0'],
  blu_notte: ['Blu notte', 'muri', '#2f4058'],
  antracite: ['Antracite', 'muri', '#3e4144'],
  terracotta: ['Terracotta', 'muri', '#c57c5b'],
  senape: ['Senape', 'muri', '#d3a840'],
  rosa_cipria: ['Rosa cipria', 'muri', '#e2c5be'],
  verde_bosco: ['Verde bosco', 'muri', '#40594a'],
  riv_bianco: ['Piastrelle bianche', 'muri', '#f0efec', 'tiles', { s: 1.2, n: 2, ny: 4, grout: '#cfcfcc' }],
  riv_grigio: ['Piastrelle grigie', 'muri', '#a3a6a8', 'tiles', { s: 1.2, n: 2, ny: 4 }],
  riv_verde: ['Piastrelle verdi', 'muri', '#8fae9c', 'tiles', { s: 0.6, n: 4, ny: 8, grout: '#e8e8e4' }],
  boiserie: ['Boiserie a listelli', 'muri', '#b88d5e', 'slats', { s: 0.6, n: 8 }],
  mattone: ['Mattone a vista', 'muri', '#a9604a', 'tiles', { s: 0.75, n: 3, ny: 10, grout: '#d9d2c6', jit: 0.14, brick: 1 }],
  // facciate
  intonaco_bianco: ['Intonaco bianco', 'est', '#f5f4f1'],
  intonaco_grigio: ['Intonaco grigio', 'est', '#bcbdbe'],
  intonaco_tortora: ['Intonaco tortora', 'est', '#c2b4a3'],
  antracite_est: ['Grigio antracite', 'est', '#4c4f54'],
  grigio_colonne: ['Grigio medio', 'est', '#8a8f98'],
  gres_rivestimento: ['Lastre grigie a fasce', 'est', '#7c8086', 'tiles', { s: 2.4, n: 1, ny: 4, grout: '#c9cbcd' }],
  pietra_chiara: ['Pietra chiara', 'est', '#d6d1c6', 'tiles', { s: 1.6, n: 2, ny: 4, jit: 0.07, brick: 1 }],
  tetto: ['Copertura', 'est', '#c8c8c5'],
  // esterno a terra
  prato: ['Prato', 'terra', '#5f9a3f', 'grass', { s: 2 }],
  prato_secco: ['Prato rustico', 'terra', '#8c9a52', 'grass', { s: 2 }],
  ghiaia: ['Ghiaia', 'terra', '#c9bfae', 'gravel', { s: 1.2 }],
  ghiaia_bianca: ['Ghiaia bianca', 'terra', '#e6e3dc', 'gravel', { s: 1.2 }],
  gres_est_grigio: ['Gres esterno grigio', 'terra', '#a6a9ac', 'tiles', { s: 1.6, n: 2, jit: 0.03, speck: 1 }],
  gres_est_scuro: ['Gres esterno scuro', 'terra', '#53575e', 'tiles', { s: 1.6, n: 2, jit: 0.03, speck: 1 }],
  cemento_lastre: ['Lastre in cemento', 'terra', '#cfcfcc', 'tiles', { s: 2.4, n: 2, grout: '#8f918f', gw: 5 }],
  cemento_chiaro: ['Cemento chiaro', 'terra', '#c9c9c6', 'noise', { s: 3, amp: 0.04 }],
  porfido: ['Porfido', 'terra', '#8b7068', 'tiles', { s: 0.8, n: 5, jit: 0.15, grout: '#5c4e49' }],
  deck_legno: ['Deck in legno', 'terra', '#9d7551', 'planks', { s: 2.4, rows: 18 }],
  asfalto: ['Asfalto', 'terra', '#4a4b4d', 'noise', { s: 2, amp: 0.08 }],
  terra: ['Terra', 'terra', '#7a5d44', 'noise', { s: 2, amp: 0.1 }],
  sabbia: ['Sabbia', 'terra', '#d9c9a3', 'noise', { s: 2, amp: 0.05 }],
  acqua: ['Acqua', 'terra', '#3fa6c9'],
  fondo_piscina: ['Mosaico piscina', 'terra', '#4fb0d0', 'tiles', { s: 0.6, n: 6, jit: 0.08, grout: '#d7eef5' }],
  // legni e laccati
  legno_rovere: ['Rovere', 'legni', '#c9a678', 'planks', { s: 1.6, rows: 6 }],
  legno_noce: ['Noce', 'legni', '#7c5437', 'planks', { s: 1.6, rows: 6 }],
  legno_scuro: ['Wengé', 'legni', '#3e2d23', 'planks', { s: 1.6, rows: 6 }],
  laccato_bianco: ['Laccato bianco', 'legni', '#f3f3f1'],
  laccato_grigio: ['Laccato grigio', 'legni', '#8e9297'],
  laccato_antracite: ['Laccato antracite', 'legni', '#3b3e42'],
  laccato_nero: ['Laccato nero', 'legni', '#1e1f21'],
  laccato_salvia: ['Laccato salvia', 'legni', '#9fb09a'],
  laccato_blu: ['Laccato blu', 'legni', '#3c5169'],
  laccato_tortora: ['Laccato tortora', 'legni', '#b3a595'],
  // tessuti
  tessuto_grigio: ['Tessuto grigio', 'tess', '#9b9d9f'],
  tessuto_chiaro: ['Tessuto chiaro', 'tess', '#ebe7df'],
  tessuto_antracite: ['Tessuto antracite', 'tess', '#4b4d51'],
  tessuto_beige: ['Tessuto beige', 'tess', '#cebfa7'],
  tessuto_blu: ['Tessuto blu', 'tess', '#45617f'],
  tessuto_verde: ['Tessuto verde', 'tess', '#607b63'],
  tessuto_senape: ['Tessuto senape', 'tess', '#c89b3b'],
  tessuto_bordeaux: ['Tessuto bordeaux', 'tess', '#7b2f3b'],
  pelle_marrone: ['Pelle marrone', 'tess', '#6c4732'],
  // metalli e altro
  metallo_nero: ['Metallo nero', 'met', '#1d1e20'],
  acciaio: ['Acciaio', 'met', '#b9bdc1'],
  ottone: ['Ottone', 'met', '#b18e4b'],
  ceramica: ['Ceramica bianca', 'met', '#f8f8f6'],
  pietra_top: ['Quarzo chiaro', 'met', '#dedbd4', 'noise', { s: 1.5, amp: 0.03 }],
  top_nero: ['Granito nero', 'met', '#26272a', 'noise', { s: 1.5, amp: 0.06 }],
  cemento: ['Cemento', 'met', '#bcbcb8', 'noise', { s: 2, amp: 0.05 }],
  carrozzeria_nera: ['Vernice nera', 'met', '#17191c'],
  carrozzeria_grigia: ['Vernice grigia', 'met', '#7d8186'],
  carrozzeria_bianca: ['Vernice bianca', 'met', '#eeeeee'],
  carrozzeria_rossa: ['Vernice rossa', 'met', '#a3262a'],
  // tecnici (non in elenco)
  specchio: ['Specchio', '', '#cfe2ea'], schermo: ['Schermo', '', '#101317'], gomma: ['Gomma', '', '#161616'],
  verde_foglia: ['Verde', '', '#4f8a3c'], verde_scuro: ['Verde scuro', '', '#2f5d2e'], verde_oliva: ['Verde oliva', '', '#7e9060'],
  tronco: ['Tronco', '', '#6b4a2f'], terra_vaso: ['Terriccio', '', '#4a3a2c'], fanale: ['Fanale', '', '#c0201c'],
  vetro: ['Vetro', '', '#a8cbdc'], luce: ['Luce', '', '#fff1c4']
};

const cache = new Map(), canv = new Map();
let night = false;

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function tone(c, f) { return `rgb(${Math.min(255, c[0] * f) | 0},${Math.min(255, c[1] * f) | 0},${Math.min(255, c[2] * f) | 0})`; }
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h; }

function makeCanvas(id) {
  const d = LIB[id]; if (!d || !d[3]) return null;
  let cv = canv.get(id); if (cv) return cv;
  const type = d[3], o = d[4] || {}, c = rgb(d[2]), R = rng(hash(id));
  const N = type === 'planks' || type === 'marble' ? 512 : 256;
  cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  g.fillStyle = d[2]; g.fillRect(0, 0, N, N);
  if (type === 'planks') {
    const rows = o.rows || 16, h = N / rows;
    for (let r = 0; r < rows; r++) {
      let x = -R() * N * 0.5;
      while (x < N) {
        const w = N * (0.35 + R() * 0.4);
        g.fillStyle = tone(c, 0.93 + R() * 0.14); g.fillRect(x, r * h, w, h);
        g.globalAlpha = 0.07;
        for (let k = 0; k < 5; k++) { g.fillStyle = R() > 0.5 ? '#000' : '#fff'; g.fillRect(x, r * h + R() * h, w, 1); }
        g.globalAlpha = 1; g.fillStyle = tone(c, 0.62); g.fillRect(x, r * h, 1.5, h);
        x += w;
      }
      g.fillStyle = tone(c, 0.66); g.fillRect(0, r * h, N, 1.2);
    }
  } else if (type === 'tiles') {
    const nx = o.n || 2, ny = o.ny || nx, tw = N / nx, th = N / ny, gw = o.gw || 2, jit = o.jit ?? 0.04;
    for (let j = 0; j < ny; j++) for (let i = -1; i < nx; i++) {
      const off = o.brick && (j & 1) ? tw / 2 : 0;
      g.fillStyle = tone(c, 1 - jit + R() * jit * 2); g.fillRect(i * tw + off, j * th, tw, th);
    }
    if (o.speck) { for (let k = 0; k < 1800; k++) { g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'; g.fillRect(R() * N, R() * N, 1.5, 1.5); } }
    g.fillStyle = o.grout || tone(c, 0.7);
    for (let j = 0; j < ny; j++) {
      g.fillRect(0, j * th, N, gw);
      const off = o.brick && (j & 1) ? tw / 2 : 0;
      for (let i = 0; i <= nx; i++) g.fillRect(i * tw + off - (i === nx && !off ? gw : 0), j * th, gw, th);
    }
  } else if (type === 'noise') {
    const amp = o.amp || 0.04;
    for (let k = 0; k < 9000; k++) { const a = R() * amp * 2; g.fillStyle = R() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; const s = 1 + R() * 1.5; g.fillRect(R() * N, R() * N, s, s); }
  } else if (type === 'grass') {
    for (let k = 0; k < 5000; k++) {
      g.strokeStyle = tone(c, 0.7 + R() * 0.6); g.lineWidth = 1 + R();
      const x = R() * N, y = R() * N; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 5, y - 3 - R() * 6); g.stroke();
    }
  } else if (type === 'gravel') {
    for (let k = 0; k < 1500; k++) { g.fillStyle = tone(c, 0.72 + R() * 0.5); g.beginPath(); g.arc(R() * N, R() * N, 2 + R() * 4, 0, 7); g.fill(); }
  } else if (type === 'marble') {
    g.strokeStyle = o.vein || '#999'; g.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      g.globalAlpha = 0.15 + R() * 0.3; g.lineWidth = 0.6 + R() * 2.4; g.beginPath();
      let x = R() * N, y = -10; g.moveTo(x, y);
      while (y < N + 10) { x += (R() - 0.5) * 90; y += 30 + R() * 50; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  } else if (type === 'slats') {
    const n = o.n || 8, w = N / n;
    for (let i = 0; i < n; i++) { g.fillStyle = tone(c, 0.92 + R() * 0.16); g.fillRect(i * w, 0, w, N); g.fillStyle = tone(c, 0.35); g.fillRect(i * w, 0, w * 0.22, N); }
  }
  canv.set(id, cv);
  return cv;
}

export function matName(id) { return (LIB[id] || LIB.pittura_bianca)[0]; }
export function matGroup(id) { return (LIB[id] || [])[1] || 'met'; }
export function groupList(g) { return Object.keys(LIB).filter(k => LIB[k][1] === g); }

export function getMat(id) {
  let m = cache.get(id); if (m) return m;
  const d = LIB[id] || LIB.pittura_bianca;
  if (id === 'vetro') m = new THREE.MeshLambertMaterial({ color: 0xa8cbdc, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide });
  else if (id === 'acqua') m = new THREE.MeshLambertMaterial({ color: 0x3fa6c9, transparent: true, opacity: 0.72, depthWrite: false });
  else if (id === 'luce') m = new THREE.MeshBasicMaterial({ color: 0xfff1c4 });
  else if (id === 'fanale') m = new THREE.MeshBasicMaterial({ color: 0xc0201c });
  else {
    const cv = makeCanvas(id);
    if (cv) {
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const s = (d[4] && d[4].s) || 1; t.repeat.set(1 / s, 1 / s);
      m = new THREE.MeshLambertMaterial({ map: t });
    } else m = new THREE.MeshLambertMaterial({ color: new THREE.Color(d[2]) });
  }
  m.name = id;
  cache.set(id, m);
  return m;
}

// disegna il campione di un materiale nel pannello
export function drawSwatch(g, id, x, y, w, h) {
  const d = LIB[id] || LIB.pittura_bianca, cv = makeCanvas(id);
  if (cv) { const s = Math.min(cv.width, cv.width * 0.6); g.drawImage(cv, 0, 0, s, s * h / w, x, y, w, h); }
  else { g.fillStyle = d[2]; g.fillRect(x, y, w, h); }
}

export function setNight(n) {
  night = n;
  const l = cache.get('luce'); if (l) l.color.set(n ? 0xffe9a8 : 0xfff6dc);
}
