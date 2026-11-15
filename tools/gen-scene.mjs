// Genera scene.json: tutta la geometria della villa in metri.
// Coordinate "casa" (hx,hz) lette dalle piante dell'architetto (scala 1:60),
// origine = spigolo esterno in alto a sinistra della pianta; z cresce verso la strada.
// Uso: node tools/gen-scene.mjs
import fs from 'fs';

const REV = process.argv[2] || new Date().toISOString().slice(0, 16).replace('T', ' ');
// Lotto 710 mq: lati ricavati dalla mappa catastale (rettangolo equivalente 31,4 x 22,6 m, lato lungo sulla strada).
// La casa resta ferma nelle coordinate mondo (HX, HZ): a spostarsi e' l'origine del lotto (x0, z0),
// cosi' le modifiche gia' salvate dall'utente nel visore restano al loro posto.
const HX = 10.4, HZ = 4.0;             // spigolo della casa nelle coordinate mondo
const LOT = { w: 31.4, d: 22.6, x0: 3.0, z0: -1.0 };   // casa a 7,4 m dal confine sinistro e 5,0 m dal confine sul retro
const LL = LOT.x0, LR = LOT.x0 + LOT.w, LB = LOT.z0, LF = LOT.z0 + LOT.d;   // sinistra, destra, retro, fronte strada
const PK = LR - 6.6;                   // bordo sinistro dell'area parcheggio
const Y0 = 0.15, Y1 = 3.45, ROOF = 6.75, H = 3.0;
const r3 = v => +v.toFixed(3);
const X = x => r3(x + HX), Z = z => r3(z + HZ);

// pavimenti scelti dall'utente: piano terra tutto in gres grigio chiaro 100x100, piano primo tutto in parquet chiaro
const FLOOR = { pt: 'gres_chiaro_100', p1: 'parquet_naturale' };
const walls = [], rooms = [], boxes = [], cyls = [], rails = [], objects = [];
const cnt = {};

// ---------- helper ----------
function W(id, lv, x1, z1, x2, z2, o = {}) {
  const ax = o.ax || ((x2 - x1) >= (z2 - z1) ? 'x' : 'z');
  const off = ax === 'x' ? HX : HZ;
  const ext = !!o.ext;
  const y = lv === 'pt' ? (ext ? 0 : Y0) : Y1;
  const top = lv === 'pt' ? (ext ? Y1 : Y0 + H) : (ext ? ROOF : Y1 + H);
  const w = { id, lv, ax, r: [X(x1), Z(z1), X(x2), Z(z2)], y, top };
  if (o.m) w.ext = o.m;
  if (o.op) w.op = o.op.map(p => ({ ...p, a: r3(p.a + off), b: r3(p.b + off) }));
  if (o.cuts) w.cuts = o.cuts.map(c => r3(c + off));
  walls.push(w);
}
function R(id, name, lv, rects, o = {}) {
  const c = v => v.map(q => [X(q[0]), Z(q[1]), X(q[2]), Z(q[3])]);
  const r = { id, name, lv, rects: c(rects), floor: o.floor || FLOOR[lv] };
  if (o.walls) r.walls = o.walls;
  if (o.ch) r.ch = o.ch;
  if (o.crects) r.crects = c(o.crects);
  rooms.push(r);
}
// box in coordinate casa
function BX(id, name, x1, z1, x2, z2, y1, y2, m, o = {}) {
  boxes.push({ id, name, b: [X(x1), y1, Z(z1), X(x2), y2, Z(z2)], m, ...o });
}
function RL(a, b, y, h, o = {}) { rails.push({ a: [X(a[0]), Z(a[1])], b: [X(b[0]), Z(b[1])], y, h, ...o }); }
// oggetto in coordinate casa (lv) oppure mondo (lv = null)
function O(t, x, z, r = 0, o = {}, lv = 'pt') {
  cnt[t] = (cnt[t] || 0) + 1;
  const y = lv === 'pt' ? Y0 : lv === 'p1' ? Y1 : 0;
  const p = lv ? [X(x), y, Z(z)] : [r3(x), 0, r3(z)];
  objects.push({ id: t + '_' + cnt[t], t, p, r, ...o });
}
const OW = (t, x, z, r = 0, o = {}) => O(t, x, z, r, o, null);

// ================= PIANO TERRA: muri esterni (spessore 50 cm) =================
const win = (a, b, s, e, o = {}) => ({ t: 'win', a, b, s, e, ...o });
const gls = (a, b, e = 2.4, o = {}) => ({ t: 'glass', a, b, s: 0, e, ...o });
// porte interne: solo il vano, senza telaio ne' anta (richiesta dell'utente: nel tour danno fastidio).
// Restano il portoncino d'ingresso (k: 'ing') e le porte di servizio verso l'esterno (k: 'serv').
const door = (a, b, o = {}) => o.k ? ({ t: 'door', a, b, s: 0, e: 2.1, ...o }) : ({ t: 'open', a, b, s: 0, e: o.e || 2.1 });
const open = (a, b, e = 2.1) => ({ t: 'open', a, b, s: 0, e });

W('e_rear_k', 'pt', 1.0, 0, 6.55, 0.49, { ext: 1, op: [win(2.95, 4.45, 1.05, 2.4)] });
W('e_rear_l', 'pt', 6.55, 0, 9.89, 0.49, { ext: 1, op: [door(7.25, 8.15, { e: 2.2, k: 'serv', sw: 'b', hinge: 'a' })] });
W('e_step', 'pt', 9.39, 0.49, 9.89, 1.34, { ext: 1, ax: 'z' });
W('e_rear_t', 'pt', 9.89, 0.84, 14.69, 1.34, { ext: 1, op: [door(11.58, 12.48, { e: 2.2, k: 'serv', sw: 'b', hinge: 'a' })] });
W('e_right', 'pt', 14.19, 1.34, 14.69, 11.04, { ext: 1, cuts: [3.19, 5.29, 7.39],
  op: [win(1.98, 2.48, 1.5, 2.1), win(4.28, 4.78, 1.0, 2.3), door(5.64, 6.54, { e: 2.2, k: 'serv', sw: 'a', hinge: 'a' }),
       win(8.69, 9.19, 0.2, 2.4), win(9.59, 10.08, 0.2, 2.4)] });
W('e_front_s', 'pt', 9.69, 11.04, 14.69, 11.53, { ext: 1, op: [gls(10.99, 12.79, 2.4, { mv: 1 })] });
W('e_blk', 'pt', 9.69, 10.54, 10.19, 11.04, { ext: 1, ax: 'z' });
W('e_front_l', 'pt', 0, 10.03, 10.19, 10.54, { ext: 1, cuts: [4.15],
  op: [gls(1.25, 3.8, 2.7, { mv: 1 }), gls(4.4, 6.4, 2.7, { mv: 1 }), gls(6.8, 7.29, 2.4, { mv: 0 }),
       door(7.29, 8.69, { e: 2.4, k: 'ing', sw: 'a', hinge: 'a', open: 80 }), gls(8.69, 9.2, 2.4, { mv: 0 })] });
W('e_left_low', 'pt', 0, 3.14, 0.5, 10.03, { ext: 1, op: [win(3.85, 4.35, 0.2, 2.4), win(4.75, 5.25, 0.2, 2.4)] });
W('e_left_step', 'pt', 0.5, 3.14, 1.5, 3.64, { ext: 1 });
W('e_left_up', 'pt', 1.0, 0.49, 1.5, 3.14, { ext: 1, op: [gls(1.24, 3.04, 2.4, { mv: 1 })] });

// ----- tramezzi piano terra (10 cm) -----
W('i_kl', 'pt', 6.5, 0.49, 6.6, 3.94, { op: [open(1.33, 2.14)] });      // passaggio cucina -> lavanderia (dietro l'anta)
W('i_lt', 'pt', 9.39, 1.34, 9.49, 3.94);
W('i_back', 'pt', 5.9, 3.94, 10.19, 4.04, { cuts: [6.55, 9.44] });
W('i_hall_t', 'pt', 10.09, 4.04, 10.19, 5.34);
W('i_tec_b', 'pt', 10.19, 4.64, 11.79, 4.74);
W('i_bath_l', 'pt', 11.79, 3.14, 11.89, 5.34, { cuts: [4.69] });
W('i_bath_t', 'pt', 11.89, 3.14, 14.19, 3.24);
W('i_bath_b', 'pt', 11.89, 5.24, 14.19, 5.34, { op: [door(13.21, 13.96, { sw: 'a', hinge: 'b' })] });
W('i_hall_s', 'pt', 10.09, 6.74, 10.19, 10.03, { cuts: [7.39, 7.73], op: [door(9.06, 9.9, { sw: 'b', hinge: 'b' })] });
W('i_studio_t', 'pt', 10.19, 7.34, 14.19, 7.44);

// ----- stanze piano terra -----
R('cucina', 'Cucina', 'pt', [[1.5, 0.49, 6.5, 3.64], [5.9, 3.64, 6.5, 3.94]]);
R('soggiorno', 'Soggiorno e pranzo', 'pt', [[0.5, 3.64, 5.9, 7.73], [5.9, 4.04, 10.09, 7.73], [0.5, 7.73, 4.15, 10.03]],
  { crects: [[0.5, 3.64, 5.9, 7.73], [0.5, 7.73, 4.15, 10.03], [5.9, 6.51, 10.09, 7.73], [7.61, 5.13, 10.09, 6.51], [8.99, 4.04, 10.09, 5.13]] });  // soffitto forato dal vano scala
R('ingresso', 'Ingresso a doppia altezza', 'pt', [[4.15, 7.73, 10.09, 10.03]], { ch: 6.3, crects: [[4.15, 7.73, 10.19, 10.03]] });
R('lavanderia', 'Lavanderia', 'pt', [[6.6, 0.49, 9.39, 3.94]]);
R('tecnico', 'Locale tecnico', 'pt', [[9.49, 1.34, 14.19, 3.14], [9.49, 3.14, 11.79, 3.94], [10.19, 3.94, 11.79, 4.64]]);
R('bagno_pt', 'Bagno piano terra', 'pt', [[11.89, 3.24, 14.19, 5.24]], { walls: 'riv_bianco' });
R('corridoio', 'Disimpegno', 'pt', [[10.09, 5.34, 14.19, 7.34], [10.19, 4.74, 11.79, 5.34]]);
R('studio', 'Studio', 'pt', [[10.19, 7.44, 14.19, 11.04]]);

// ================= PIANO PRIMO =================
W('f_rear', 'p1', 1.0, 0, 14.69, 0.49, { ext: 1, cuts: [5.05, 9.04, 10.24],
  op: [win(2.85, 3.65, 1.0, 2.4), win(6.15, 7.95, 1.0, 2.4, { g: [2, 1] }), win(11.04, 12.84, 1.0, 2.4, { g: [2, 1] })] });
W('f_right', 'p1', 14.19, 0.49, 14.69, 10.03, { ext: 1, cuts: [3.99, 5.99], op: [win(4.58, 5.38, 1.0, 2.4)] });
W('f_front_r', 'p1', 10.29, 9.53, 14.19, 10.03, { ext: 1, op: [gls(10.99, 12.79, 2.4, { mv: 1 })] });
W('f_front', 'p1', 0, 10.03, 10.69, 10.53, { ext: 1, cuts: [4.1],
  op: [win(1.0, 3.5, 0.25, 2.5, { g: [2, 2] }), win(6.9, 8.7, 0.25, 2.5, { g: [2, 2] })] });
W('f_left_low', 'p1', 0, 3.14, 0.5, 10.03, { ext: 1, cuts: [5.99], op: [win(5.05, 5.85, 1.2, 2.2), gls(6.94, 8.74, 2.4, { mv: 1 })] });
W('f_left_step', 'p1', 0.5, 3.14, 1.5, 3.64, { ext: 1 });
W('f_left_up', 'p1', 1.0, 0.49, 1.5, 3.14, { ext: 1 });

W('p_cab_r', 'p1', 5.0, 0.49, 5.11, 3.14);
W('p_cab_b', 'p1', 1.5, 3.14, 5.9, 3.24, { cuts: [5.05], op: [open(2.95, 4.05)] });
W('p_mbath_r', 'p1', 2.85, 3.24, 2.95, 6.04, { op: [door(4.39, 5.14, { sw: 'a', hinge: 'a' })] });
W('p_mbath_b', 'p1', 0.5, 5.94, 2.85, 6.04);
W('p_m_r', 'p1', 4.05, 3.24, 4.15, 10.03, { cuts: [4.99, 7.73], op: [door(5.14, 6.04, { sw: 'b', hinge: 'b' })] });
W('p_rip_r', 'p1', 5.8, 3.24, 5.9, 5.04);
W('p_rip_b', 'p1', 4.15, 4.94, 5.8, 5.04, { op: [door(4.25, 5.0, { sw: 'b', hinge: 'a' })] });
W('p_stair_t', 'p1', 5.9, 3.94, 8.99, 4.04);
W('p_b2_r1', 'p1', 8.99, 0.49, 9.09, 6.14, { cuts: [1.99, 3.99], op: [door(2.14, 2.99, { sw: 'a', hinge: 'a' })] });
W('p_b2_r2', 'p1', 8.99, 6.99, 9.09, 7.73);
W('p_nic', 'p1', 9.09, 1.94, 10.19, 2.04, { op: [door(9.23, 10.08, { sw: 'b', hinge: 'a', open: 25 })] });
W('p_b3_l', 'p1', 10.19, 0.49, 10.29, 10.03, { cuts: [1.99, 3.99, 5.99, 7.69],
  op: [door(2.14, 2.99, { sw: 'b', hinge: 'a' }), door(4.14, 4.94, { sw: 'b', hinge: 'a' }), door(6.14, 6.99, { sw: 'b', hinge: 'a' })] });
W('p_bath2_t', 'p1', 10.29, 3.94, 14.19, 4.04);
W('p_bath2_b', 'p1', 10.29, 5.94, 14.19, 6.04);
W('p_bath2_div', 'p1', 11.49, 4.04, 11.59, 5.94, { op: [open(4.14, 4.94)] });
W('p_nicS', 'p1', 9.09, 7.64, 10.19, 7.73);

R('cabina', 'Cabina armadio', 'p1', [[1.5, 0.49, 5.0, 3.14]]);
R('bagno_m', 'Bagno padronale', 'p1', [[0.5, 3.64, 2.85, 5.94], [1.5, 3.24, 2.85, 3.64]], { walls: 'riv_bianco' });
R('camera_m', 'Camera matrimoniale', 'p1', [[0.5, 6.04, 4.05, 10.03], [2.95, 3.24, 4.05, 6.04]]);
R('ripostiglio', 'Ripostiglio', 'p1', [[4.15, 3.24, 5.8, 4.94]]);
R('camera2', 'Camera 2', 'p1', [[5.11, 0.49, 8.99, 3.14], [5.9, 3.14, 8.99, 3.94]]);
R('nicchia', 'Ripostiglio corridoio', 'p1', [[9.09, 0.49, 10.19, 1.94]]);
R('camera3', 'Camera 3', 'p1', [[10.29, 0.49, 14.19, 3.94]]);
R('bagno2', 'Bagno piano primo', 'p1', [[10.29, 4.04, 14.19, 5.94]], { walls: 'riv_bianco' });
R('camera4', 'Camera 4', 'p1', [[10.29, 6.04, 14.19, 9.53]]);
const BAL = [[4.15, 5.04, 5.9, 7.73], [5.9, 6.51, 8.99, 7.73], [7.61, 5.13, 8.99, 6.51], [9.09, 2.04, 10.19, 7.64], [8.99, 6.14, 9.09, 6.99]];
R('ballatoio', 'Ballatoio e corridoio', 'p1', BAL, { crects: BAL.concat([[5.9, 4.04, 8.99, 5.13], [5.9, 5.13, 7.61, 6.51]]) });

// ----- solaio del primo piano (visibile sui bordi dei vuoti) -----
const SL = [[1.0, 0, 14.69, 3.14], [0, 3.14, 14.69, 4.04], [0, 4.04, 5.9, 5.13], [8.99, 4.04, 14.69, 5.13],
  [0, 5.13, 5.9, 6.51], [7.61, 5.13, 14.69, 6.51], [0, 6.51, 14.69, 7.73], [0, 7.73, 4.15, 10.03], [10.19, 7.73, 14.69, 10.03]];
SL.forEach((q, i) => BX('solaio' + i, 'Solaio', q[0], q[1], q[2], q[3], Y1 - 0.29, Y1 - 0.01, 'pittura_bianca', { key: 'solaio' }));
BX('sbalzo_retro', 'Intradosso sbalzo', 9.89, 0, 14.69, 0.84, Y1 - 0.3, Y1, 'intonaco_bianco', { key: 'sbalzi' });

// ----- parapetti interni in vetro (piano primo) -----
RL([4.15, 7.70], [8.99, 7.70], Y1, 1.0, { col: 1 });           // ballatoio sul vuoto dell'ingresso
RL([5.9, 6.57], [7.61, 6.57], Y1, 1.0, { col: 1 });            // bordo vano scala verso il ballatoio
RL([5.84, 5.04], [5.84, 6.57], Y1, 1.0, { col: 1 });
RL([7.61, 5.13], [8.99, 5.13], Y1, 1.0, { col: 1 });
RL([7.61, 5.13], [7.61, 5.43], Y1, 1.0, { col: 1 });

// ================= SCALA (20 alzate, 19 pedate, tre ventagli) =================
const T = (...p) => p.map(q => [X(q[0]), Z(q[1])]);
const treads = [];
for (let i = 0; i < 4; i++) treads.push(T([7.9, 6.33 - 0.3 * i], [8.99, 6.33 - 0.3 * i], [8.99, 6.03 - 0.3 * i], [7.9, 6.03 - 0.3 * i]));
treads.push(T([7.9, 5.13], [8.99, 5.13], [8.99, 4.55]));
treads.push(T([7.9, 5.13], [8.99, 4.55], [8.99, 4.04], [8.59, 4.04]));
treads.push(T([7.9, 5.13], [8.59, 4.04], [7.9, 4.04]));
for (let i = 0; i < 3; i++) treads.push(T([7.9 - 0.3 * i, 5.13], [7.9 - 0.3 * i, 4.04], [7.6 - 0.3 * i, 4.04], [7.6 - 0.3 * i, 5.13]));
treads.push(T([7.0, 5.13], [7.0, 4.04], [6.34, 4.04]));
treads.push(T([7.0, 5.13], [6.34, 4.04], [5.9, 4.04], [5.9, 4.55]));
treads.push(T([7.0, 5.13], [5.9, 4.55], [5.9, 5.13]));
treads.push(T([5.9, 5.13], [7.0, 5.13], [7.0, 5.43], [5.9, 5.43]));
treads.push(T([7.0, 5.43], [5.9, 5.43], [5.9, 6.04]));
treads.push(T([7.0, 5.43], [5.9, 6.04], [5.9, 6.51], [6.31, 6.51]));
treads.push(T([7.0, 5.43], [6.31, 6.51], [7.0, 6.51]));
treads.push(T([7.0, 5.43], [7.3, 5.43], [7.3, 6.51], [7.0, 6.51]));
treads.push(T([7.3, 5.43], [7.61, 5.43], [7.61, 6.51], [7.3, 6.51]));
const SR = (x1, z1, k1, x2, z2, k2) => [X(x1), Z(z1), k1, X(x2), Z(z2), k2];
const stairs = {
  base: Y0, top: Y1, treads, style: 'piena', tread: 'legno_rovere', body: 'laccato_antracite', rail: 'vetro',
  rails: [
    SR(8.97, 6.33, 0, 8.97, 5.13, 4), SR(8.97, 5.13, 4, 8.97, 4.06, 7),
    SR(7.9, 6.33, 0, 7.9, 5.13, 4), SR(7.9, 5.13, 7, 7.0, 5.13, 10), SR(7.0, 5.13, 13, 7.0, 5.43, 14), SR(7.0, 5.43, 17, 7.61, 5.43, 20),
    SR(5.92, 4.06, 12, 5.92, 5.13, 13), SR(5.92, 5.13, 13, 5.92, 6.49, 16), SR(5.92, 6.49, 16, 7.61, 6.49, 20)
  ]
};

// ================= ESTERNO DELLA CASA =================
const GR = 'antracite_est', WH = 'intonaco_bianco';
// pensilina frontale + lama scura a destra + setto bianco a sinistra
BX('pensilina', 'Pensilina frontale', 0, 10.53, 15.8, 12.2, 6.45, 6.85, GR, { grp: 'est' });
BX('lama_dx', 'Lama laterale destra', 15.5, 9.6, 15.8, 12.2, 0, 6.45, GR, { grp: 'est', key: 'pensilina' });
[[0, 10.54, 0.32, 10.95, 0, 6.45], [0, 11.85, 0.32, 12.2, 0, 6.45], [0, 10.95, 0.32, 11.85, 0, 1.0], [0, 10.95, 0.32, 11.85, 5.5, 6.45],
 [0.32, 11.88, 1.2, 12.2, 0, 1.0], [0.32, 11.88, 1.2, 12.2, 5.5, 6.45], [0.85, 11.88, 1.2, 12.2, 1.0, 5.5]]
  .forEach((q, i) => BX('setto_sx' + i, 'Setto bianco con asola', q[0], q[1], q[2], q[3], q[4], q[5], WH, { grp: 'est', key: 'setto_sx' }));
cyls.push({ id: 'col1', key: 'colonne', name: 'Colonne', c: [X(4.09), Z(11.3)], r: 0.14, y: [0, 6.45], m: 'grigio_colonne' });
cyls.push({ id: 'col2', key: 'colonne', name: 'Colonne', c: [X(4.09), Z(11.95)], r: 0.14, y: [0, 6.45], m: 'grigio_colonne' });
// faretti sotto la pensilina
for (let i = 0; i < 12; i++) BX('far' + i, 'Faretti', 0.9 + i * 1.25, 11.3, 1.02 + i * 1.25, 11.42, 6.435, 6.45, 'luce', { key: 'faretti', np: 1 });

// balcone frontale (sopra ingresso e studio)
BX('balc_f1', 'Balcone frontale', 6.39, 10.53, 15.5, 12.01, 3.1, Y1, 'gres_est_grigio', { walk: 1, key: 'balc_pav', grp: 'terra' });
BX('balc_f2', 'Balcone frontale', 10.69, 10.03, 15.5, 10.53, 3.1, Y1, 'gres_est_grigio', { walk: 1, key: 'balc_pav', grp: 'terra' });
BX('balc_fp1', 'Parapetto balcone', 6.39, 11.86, 15.5, 12.03, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
BX('balc_fp2', 'Parapetto balcone', 6.37, 10.54, 6.54, 11.86, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
BX('balc_fp3', 'Parapetto balcone', 14.69, 10.01, 15.5, 10.16, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
RL([6.46, 11.94], [15.5, 11.94], 4.15, 0.4);
RL([6.46, 10.6], [6.46, 11.94], 4.15, 0.4);
for (let i = 0; i < 4; i++) BX('farb' + i, 'Faretti', 7.4 + i * 2.2, 11.2, 7.52 + i * 2.2, 11.32, 3.085, 3.1, 'luce', { key: 'faretti', np: 1 });

// balcone laterale della camera matrimoniale, con tettoia e lamelle
BX('balc_l', 'Balcone laterale', -1.64, 6.03, 0, 9.63, 3.1, Y1, 'gres_est_grigio', { walk: 1, key: 'balc_pav', grp: 'terra' });
BX('balc_lp1', 'Parapetto balcone', -1.66, 6.03, -1.5, 9.63, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
BX('balc_lp2', 'Parapetto balcone', -1.5, 6.01, 0, 6.17, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
BX('balc_lp3', 'Parapetto balcone', -1.5, 9.49, 0, 9.65, 3.08, 4.15, WH, { col: 1, key: 'balc_par', grp: 'est' });
RL([-1.58, 6.1], [-1.58, 9.56], 4.15, 0.4);
RL([-1.58, 6.1], [0, 6.1], 4.15, 0.4);
BX('tett_l', 'Tettoia balcone laterale', -1.9, 5.8, 0, 9.9, 6.45, 6.75, WH, { grp: 'est', key: 'tett_l' });
for (let i = 0; i < 8; i++) BX('lam' + i, 'Lamelle frangisole', -1.56 + i * 0.2, 9.5, -1.5 + i * 0.2, 9.64, 4.15, 6.45, 'grigio_colonne', { key: 'lamelle', grp: 'est' });

// fascia scura tra vetrata del soggiorno e finestra della camera, rivestimento grigio dell'ingresso
BX('fascia', 'Fascia scura tra i piani', 1.0, 10.54, 3.8, 10.6, 2.85, 3.7, 'laccato_nero', { key: 'fascia', grp: 'est' });
[[6.4, 10.54, 6.8, 10.6], [9.2, 10.54, 9.69, 10.6], [9.63, 10.54, 9.69, 11.59], [9.63, 11.53, 10.99, 11.59]]
  .forEach((q, i) => BX('riv' + i, 'Rivestimento ingresso', q[0], q[1], q[2], q[3], 0, 3.1, 'gres_rivestimento', { key: 'riv_ingresso', grp: 'est' }));

// attico con sommità inclinata (come nei render)
const attic = {
  poly: [[1.0, 0], [14.69, 0], [14.69, 10.03], [10.69, 10.03], [10.69, 10.53], [0, 10.53], [0, 3.14], [1.0, 3.14]].map(p => [X(p[0]), Z(p[1])]),
  y0: ROOF, h: [7.25 - 0.05 * HX - 0.045 * HZ, 0.05, 0.045], roof: 'tetto'
};

// ================= ARREDI INTERNI DA PIANTA =================
// --- cucina ---
O('cucina_base', 4.0, 0.79, 0, { w: 5.0, sink: -0.3, m: 'laccato_antracite', m2: 'top_nero' });
O('cucina_colonne', 6.2, 3.04, -90, { w: 1.8, m: 'laccato_antracite' });
O('cucina_colonne', 6.2, 1.21, -90, { w: 0.24, m: 'laccato_antracite' });
O('anta_passaggio', 6.2, 1.735, -90, { w: 0.81, m: 'laccato_antracite' });
O('isola', 3.7, 2.34, 0, { m: 'legno_rovere', m2: 'top_nero' });
const SG = { m: 'pelle_marrone' };
O('sgabello', 3.25, 3.4, 0, SG); O('sgabello', 3.8, 3.4, 0, SG); O('sgabello', 4.35, 3.4, 0, SG);
// --- pranzo e soggiorno ---
O('tavolo_pranzo', 3.76, 4.55, 0, { w: 1.6, m: 'legno_noce' });
O('divano2', 2.93, 6.48, 0, { m: 'tessuto_antracite' });
O('divano3', 4.54, 8.1, -90, { m: 'tessuto_blu' });
O('tavolino', 2.98, 7.98, 0, { m: 'legno_noce' });
O('mobile_tv', 0.74, 8.4, 90, { w: 3.2, m: 'legno_noce' });
O('pianta', 6.58, 8.54); O('pianta', 9.3, 8.54);
// --- studio, disimpegno, bagno, lavanderia, tecnico ---
O('scrivania', 11.75, 9.24, 0, { w: 1.2 });
O('sedia_ufficio', 11.75, 8.6, 180);
O('divano2', 13.72, 9.37, -90, { m: 'tessuto_verde' });
O('armadio', 12.19, 7.04, 180, { w: 3.98, m: 'laccato_tortora' });
O('armadio', 10.99, 5.04, 0, { w: 1.58, m: 'laccato_tortora' });
O('lavabo', 13.42, 3.48, 0, { m: 'legno_noce' });
O('wc', 12.17, 4.23, 90); O('bidet', 12.17, 4.85, 90);
O('cucina_base', 7.7, 3.64, 180, { w: 2.2, m: 'laccato_tortora', m2: 'top_nero', sink: 0.5 });
O('lavatrice', 9.08, 1.4, -90); O('lavatrice', 9.08, 2.05, -90);
O('caldaia', 13.0, 1.52, 0); O('accumulo', 9.95, 1.85, 0);
// --- piano primo ---
const P = (t, x, z, r, o) => O(t, x, z, r, o, 'p1');
P('letto_matr', 3.0, 8.43, -90, { m: 'tessuto_antracite', m2: 'legno_noce' });
const CM = { m: 'legno_noce' };
P('comodino', 3.8, 7.33, -90, CM); P('comodino', 3.8, 9.53, -90, CM);
P('mobile_tv', 1.62, 6.28, 0, { w: 2.2, m: 'legno_noce' });
P('doccia', 2.16, 3.72, 0, { w: 1.3, d: 0.9 });
P('lavabo', 0.74, 4.65, 90, CM); P('wc', 2.31, 5.66, 180); P('bidet', 1.75, 5.66, 180);
P('armadio', 1.8, 1.815, 90, { w: 2.63, m: 'laccato_tortora' }); P('armadio', 4.7, 1.815, -90, { w: 2.63, m: 'laccato_tortora' });
P('cassettiera', 3.25, 0.75, 0, { w: 2.2, m: 'legno_noce' });
P('scaffale', 4.97, 3.45, 0, { w: 1.6, m: 'laccato_antracite' });
P('letto_sing', 7.22, 2.9, 180, { m: 'tessuto_blu', m2: 'legno_noce' }); P('comodino', 6.32, 3.72, 180, CM); P('armadio', 5.41, 1.81, 90, { w: 2.62, m: 'laccato_tortora' });
P('letto_sing', 11.98, 2.9, 180, { w: 1.2, m: 'tessuto_verde', m2: 'legno_noce' }); P('comodino', 11.07, 3.72, 180, CM); P('armadio', 13.89, 2.21, -90, { w: 3.43, m: 'laccato_salvia' });
P('lavabo', 10.89, 5.7, 180, CM); P('doccia', 12.11, 5.44, 0, { w: 0.97, d: 0.95 });
P('wc', 13.74, 5.66, 180); P('bidet', 13.19, 5.66, 180); P('lavabo', 13.63, 4.28, 0, CM);
P('letto_sing', 11.32, 8.08, 90, { w: 1.2, m: 'tessuto_senape', m2: 'legno_noce' }); P('comodino', 10.52, 8.95, 90, CM); P('armadio', 13.89, 7.78, -90, { w: 3.48, m: 'laccato_grigio' });

// ================= LOTTO, RECINZIONE, GIARDINO (coordinate mondo) =================
const zona = (id, x1, z1, x2, z2, m, layer, o = {}) =>
  objects.push({ id, t: 'zona', p: [r3((x1 + x2) / 2), 0, r3((z1 + z2) / 2)], r: 0, w: r3(x2 - x1), d: r3(z2 - z1), m, layer, ...o });
zona('z_lotto', LL, LB, LR, LF, 'prato', 0, { lock: 1, n: 'Prato del lotto' });
zona('z_marciapiede', LL - 12, LF, LR + 12, LF + 1.5, 'cemento_chiaro', 1, { lock: 1, n: 'Marciapiede' });
zona('z_strada', LL - 12, LF + 1.5, LR + 12, LF + 8, 'asfalto', 1, { lock: 1, n: 'Strada' });
zona('z_terrazzo', X(-0.5), Z(10.3), X(16.0), Z(13.2), 'gres_est_grigio', 3, { n: 'Terrazzo frontale' });
zona('z_vialetto', X(7.1), Z(13.2), X(8.9), LF, 'gres_est_grigio', 3, { n: 'Vialetto d\'ingresso' });
zona('z_pergola', X(-4.9), Z(-0.3), X(1.0), Z(7.0), 'gres_est_scuro', 4, { n: 'Pavimento pergola' });
zona('z_retro', X(-0.5), LB + 0.4, PK, Z(1.0), 'gres_est_scuro', 3, { n: 'Pavimentazione retro' });
zona('z_lato_dx', X(14.69), Z(0.9), X(16.0), Z(10.3), 'gres_est_scuro', 2, { n: 'Camminamento laterale' });
zona('z_lato_sx', X(-0.9), Z(7.0), X(0), Z(10.3), 'gres_est_scuro', 2, { n: 'Camminamento laterale' });
zona('z_parcheggio', PK, LB + 0.4, LR - 0.3, LF, 'cemento_lastre', 3, { n: 'Area parcheggio' });
zona('z_ghiaia', 5.6, LB + 0.6, 9.4, 3.5, 'ghiaia', 2, { n: 'Ghiaia solarium' });

// recinzione: muro a pannelli su strada e lato sinistro, muretto con ringhiera su retro e lato destro
const gateX = X(8.0);
const GAPX = r3((X(16.0) + PK) / 2);   // asse della striscia tra camminamento laterale e parcheggio
OW('muro_cinta', (LL + gateX - 1.3) / 2, LF - 0.15, 0, { w: r3(gateX - 1.3 - LL) });
OW('cancello_ped', gateX, LF - 0.15, 0);
OW('muro_cinta', (gateX + 1.3 + PK + 0.3) / 2, LF - 0.15, 0, { w: r3(PK + 0.3 - gateX - 1.3) });
OW('cancello_car', PK + 3.2, LF - 0.15, 0, { w: 5.8 });
OW('muro_cinta', LL + 0.15, (LB + LF) / 2, 90, { w: LOT.d });
OW('recinzione', (LL + LR) / 2, LB + 0.12, 0, { w: LOT.w });
OW('recinzione', LR - 0.12, (LB + LF) / 2, 90, { w: LOT.d });

// pergola con salotto e tavolo, lettini
OW('pergola', X(-2.45), Z(3.35), 0, { w: 4.2, d: 6.4 });
OW('divano_est_ang', X(-3.05), Z(5.1), 90, { m: 'tessuto_antracite' });
OW('tavolo_est', X(-2.4), Z(1.75), 0);
OW('lettino', 6.6, 2.1, 0, { m: 'tessuto_beige' }); OW('lettino', 7.7, 2.1, 0, { m: 'tessuto_beige' });
// verde e arredo del giardino frontale
OW('fioriera', X(5.2), Z(13.75), 0, { w: 2.4, cactus: 1 });
OW('panca', X(5.6), Z(14.75), 0);
OW('fioriera', GAPX, Z(13.6), 90, { w: 2.0 });
OW('fioriera', X(-0.2), Z(14.0), 90, { w: 1.8 });
OW('cespuglio', LL + 1.4, LF - 2.2); OW('cespuglio', LL + 0.9, 13.0);
OW('pietre_passo', 7.8, Z(10.6), 90, { w: 5.2 });
OW('pietre_passo', GAPX, Z(6.1), 0, { w: r3(PK - X(16.0)) });
[[12.6, LF - 1.2], [15.0, LF - 1.2], [21.6, LF - 1.2], [24.4, LF - 1.2], [GAPX, LF - 1.4], [GAPX, 15.2], [GAPX, 12.2], [GAPX, 8.4], [GAPX, 9.4], [GAPX, 10.9],
 [6.6, 16.8], [8.9, 16.8], [4.4, 11.8], [4.4, 14.2], [LL + 1.2, 5.0]].forEach(p => OW('lampioncino', p[0], p[1]));
OW('auto', PK + 3.1, 8.2, 180, { m: 'carrozzeria_grigia' });
OW('auto', PK + 3.3, 14.2, 180);

// ================= PUNTI DI VISTA =================
const views = [
  { n: 'Cancello d\'ingresso', p: [gateX, 0, LF + 3.6], yaw: 0 },
  { n: 'Davanti alla porta', p: [X(8.0), 0.03, Z(12.4)], yaw: 0 },
  { n: 'Ingresso (doppia altezza)', p: [X(8.0), Y0, Z(9.2)], yaw: 0 },
  { n: 'Soggiorno', p: [X(6.4), Y0, Z(7.2)], yaw: 80 },
  { n: 'Cucina', p: [X(5.2), Y0, Z(3.6)], yaw: 50 },
  { n: 'Studio', p: [X(10.8), Y0, Z(8.0)], yaw: -130 },
  { n: 'Piano primo: ballatoio', p: [X(8.3), Y1, Z(7.1)], yaw: 150 },
  { n: 'Camera matrimoniale', p: [X(3.5), Y1, Z(6.6)], yaw: 150 },
  { n: 'Pergola', p: [X(-2.4), 0.05, Z(3.3)], yaw: 180 },
  { n: 'Giardino sul retro', p: [X(-3.2), 0.03, 1.4], yaw: -140 },
  { n: 'Parcheggio', p: [r3(PK + 3.1), 0.03, r3(LF - 2.2)], yaw: 20 },
  { n: 'Vista dalla strada', p: [X(7.3), 0, LF + 6.5], yaw: 0 }
];

const scene = {
  rev: REV, title: 'Villa 3D', lot: LOT, house: [HX, HZ],
  levels: { pt: { y: Y0, h: H, n: 'Piano terra' }, p1: { y: Y1, h: H, n: 'Piano primo' } },
  floorViews: { pt: 2, p1: 6 },
  rooms, walls, boxes, cyls, rails, attic, stairs, objects, views
};
fs.writeFileSync(new URL('../scene.json', import.meta.url), JSON.stringify(scene));
console.log('scene.json', REV, 'walls', walls.length, 'rooms', rooms.length, 'boxes', boxes.length, 'objects', objects.length);
