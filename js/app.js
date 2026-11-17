// Villa 3D — tour virtuale modificabile (three.js + WebXR, pensato per Meta Quest 3).
import * as THREE from 'three';
import { WALK, NOPICK } from './builder.js?v=7';
import { getMat, GROUPS, groupList, matName, matGroup, drawSwatch, setNight } from './mats.js?v=7';
import { buildStructure } from './house.js?v=7';
import { CAT, CATS, resolveObjects, buildObjects, buildLive } from './catalog.js?v=7';

const APPV = '7';   // versione del codice dell'app: la imposta tools/versiona.mjs insieme agli indirizzi dei moduli
const LS = 'villa3d.user.v1', DEG = Math.PI / 180, UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const r2 = v => Math.round(v * 100) / 100;

// ------------------------------------------------------------------ stato
let S = null, sceneText = '';
let U = loadUser();
const undo = [];
let feet = 0, yaw = 0, pitch = 0;
let menuOpen = false, sel = null, move = null, night = false, anchor = null, xrFrames = 0;
let col = [], walkMeshes = [], pickMeshes = [], structMeshes = [], objMeshes = [], objList = [];

function loadUser() {
  const base = { mats: {}, objs: {}, added: [], stairs: {} };
  try { const u = JSON.parse(localStorage.getItem(LS)); if (u && typeof u === 'object') return { ...base, ...u }; } catch (e) { }
  return base;
}
function saveUser() { try { localStorage.setItem(LS, JSON.stringify(U)); } catch (e) { } }
function snapshot() { undo.push(JSON.stringify(U)); if (undo.length > 40) undo.shift(); }

// ------------------------------------------------------------------ renderer e scena
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
$('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 500);
camera.rotation.order = 'YXZ';
const rig = new THREE.Group();
rig.add(camera); scene.add(rig);
camera.position.set(0, 1.65, 0);

const hemi = new THREE.HemisphereLight(0xffffff, 0xeeeeea, 2.8);
const sun = new THREE.DirectionalLight(0xfff4e2, 1.1);
sun.position.set(-30, 45, 38);
scene.add(hemi, sun);

const gStruct = new THREE.Group(), gObj = new THREE.Group(), gLive = new THREE.Group();
scene.add(gStruct, gObj, gLive);
const terrain = new THREE.Mesh(new THREE.CircleGeometry(260, 48).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd8d1c3 }));
terrain.position.y = -0.02; terrain.userData = { flags: WALK | NOPICK };
scene.add(terrain); terrain.updateMatrixWorld(true);

const hl = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x2f9bff, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
hl.visible = false; hl.renderOrder = 8; hl.frustumCulled = false; scene.add(hl);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x35b6ff, transparent: true, opacity: 0.9, depthTest: false }));
marker.visible = false; marker.renderOrder = 9; scene.add(marker);

function applyLight() {
  setNight(night);
  scene.background = new THREE.Color(night ? 0x0c1628 : 0x9fcdf0);
  hemi.color.set(night ? 0x9fb4e6 : 0xffffff); hemi.groundColor.set(night ? 0xffd9a6 : 0xeeeeea);
  hemi.intensity = night ? 1.25 : 2.8; sun.intensity = night ? 0.25 : 1.1; sun.color.set(night ? 0xa9c0ff : 0xfff4e2);
  terrain.material.color.set(night ? 0x5c5850 : 0xd8d1c3);
}

// ------------------------------------------------------------------ costruzione
function clearGroup(g) { for (const m of [...g.children]) { g.remove(m); m.geometry.dispose(); } }
function refreshLists() {
  const all = [...structMeshes, ...objMeshes];
  walkMeshes = all.filter(m => m.userData.flags & WALK); walkMeshes.push(terrain);
  pickMeshes = all.filter(m => !(m.userData.flags & NOPICK));
}
function rebuildStructure() {
  clearGroup(gStruct);
  const r = buildStructure(S, U);
  structMeshes = r.meshes; col = r.col;
  for (const m of r.meshes) gStruct.add(m);
  refreshLists();
}
function rebuildObjects() {
  clearGroup(gObj);
  objList = resolveObjects(S, U);
  const r = buildObjects(objList, move ? move.id : null);
  objMeshes = r.meshes;
  for (const m of r.meshes) gObj.add(m);
  refreshLists();
}
function rebuildAll() { rebuildStructure(); rebuildObjects(); updateHL(); }

let newApp = false;
async function loadScene(first) {
  try {
    let r = await fetch('scene.json?t=' + Date.now(), { cache: 'no-store' }).catch(() => null);
    if (!r || !r.ok) r = await fetch('scene.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('scene.json ' + r.status);
    const t = await r.text();
    if (t === sceneText) return;
    const ns = JSON.parse(t);
    // se la scena pubblicata e' fatta per una versione piu' nuova dell'app, questa pagina sta usando file vecchi (cache):
    // all'avvio si ricarica da sola su un indirizzo nuovo; a tour gia' avviato avvisa soltanto, per non far uscire dalla VR
    if (ns.app && ns.app !== APPV) {
      if (first && Q.get('v') !== ns.app) { const u = new URL(location.href); u.searchParams.set('v', ns.app); location.replace(u); return; }
      newApp = true;
    }
    sceneText = t; S = ns;
    if (move) endMove(false);
    rebuildAll();
    if (!first) { toast(newApp ? 'Tour aggiornato: ricarica la pagina per avere le novità' : 'Scena aggiornata (' + S.rev + ')', newApp ? 8000 : 3200); ui.draw(); }
  } catch (e) { if (first) { $('err').textContent = 'Errore nel caricamento della scena: ' + e.message; $('err').style.display = 'block'; } }
}

// ------------------------------------------------------------------ posa, movimento, collisioni
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _e = new THREE.Euler(), _m = new THREE.Matrix4();
const ray = new THREE.Raycaster(), downRay = new THREE.Raycaster();
downRay.far = 40;
const headPos = out => camera.getWorldPosition(out);
function headLocalYaw() { _e.setFromQuaternion(camera.quaternion, 'YXZ'); return _e.y; }

function goTo(v) {
  const xr = renderer.xr.isPresenting;
  yaw = (v.yaw || 0) * DEG - (xr ? headLocalYaw() : 0);
  rig.rotation.y = yaw;
  if (!xr) { pitch = (v.pitch || 0) * DEG; camera.rotation.set(pitch, 0, 0); }
  rig.position.set(v.p[0], v.p[1], v.p[2]);
  rig.updateMatrixWorld(true);
  const h = headPos(_v1);
  rig.position.x += v.p[0] - h.x; rig.position.z += v.p[2] - h.z;
  feet = v.p[1];
  rig.updateMatrixWorld(true);
}
function teleport(p) {
  const h = headPos(_v1);
  rig.position.x += p.x - h.x; rig.position.z += p.z - h.z; feet = p.y; rig.position.y = feet;
}
function snapTurn(a) {
  const h = headPos(_v1);
  _v2.copy(rig.position).sub(h).applyAxisAngle(UP, a);
  rig.position.x = h.x + _v2.x; rig.position.z = h.z + _v2.z;
  yaw += a; rig.rotation.y = yaw;
}
function tryMove(dx, dz) {
  const h = headPos(_v1), R = 0.22, y1 = feet + 0.3, y2 = feet + 1.6;
  let nx = h.x + dx, nz = h.z + dz;
  for (let it = 0; it < 2; it++) for (const c of col) {
    if (c.y2 < y1 || c.y1 > y2) continue;
    const cx = Math.max(c.x1, Math.min(nx, c.x2)), cz = Math.max(c.z1, Math.min(nz, c.z2));
    const ddx = nx - cx, ddz = nz - cz, d2 = ddx * ddx + ddz * ddz;
    if (d2 < R * R) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2); nx = cx + ddx / d * R; nz = cz + ddz / d * R; }
      else {       // dentro un muro: esci dal lato più vicino
        const ex = [nx - c.x1, c.x2 - nx, nz - c.z1, c.z2 - nz], k = ex.indexOf(Math.min(...ex));
        if (k === 0) nx = c.x1 - R; else if (k === 1) nx = c.x2 + R; else if (k === 2) nz = c.z1 - R; else nz = c.z2 + R;
      }
    }
  }
  rig.position.x += nx - h.x; rig.position.z += nz - h.z;
}
function floorAt(x, z, fromY) {
  downRay.set(_v3.set(x, fromY, z), DOWN);
  const hits = downRay.intersectObjects(walkMeshes, false);
  return hits.length ? hits[0].point.y : null;
}
function updateFeet(dt) {
  const h = headPos(_v1), y = floorAt(h.x, h.z, feet + 0.8);
  if (y != null) { feet += (y - feet) * Math.min(1, dt * 12); if (Math.abs(y - feet) < 0.003) feet = y; }
  rig.position.y = feet;
}

// ------------------------------------------------------------------ selezione e modifiche
function pick() {
  const hits = ray.intersectObjects(pickMeshes, false);
  for (const h of hits) {
    const ud = h.object.userData, ei = ud.ent[h.faceIndex], e = ud.ents[ei];
    if (e) return { e, point: h.point, flags: ud.flags, ny: h.face ? h.face.normal.y : 0 };
  }
  return null;
}
const entByKey = key => { const m = structMeshes[0]; return m ? m.userData.ents.find(e => e && e.key === key) : null; };
const getObj = id => objList.find(o => o.id === id);

function updateHL() {
  hl.visible = false;
  if (!sel || (move && sel.type === 'obj')) return;
  const meshes = sel.type === 'obj' ? objMeshes : structMeshes, pos = [];
  if (!meshes.length) return;
  const ents = meshes[0].userData.ents;
  const j = sel.type === 'obj' ? ents.findIndex(e => e && e.id === sel.id) : ents.findIndex(e => e && e.key === sel.key);
  if (j < 0) return;
  for (const m of meshes) {
    const en = m.userData.ent, ix = m.geometry.index.array, p = m.geometry.attributes.position.array;
    for (let t = 0; t < en.length; t++) if (en[t] === j) for (let k = 0; k < 3; k++) { const v = ix[t * 3 + k] * 3; pos.push(p[v], p[v + 1], p[v + 2]); }
  }
  if (!pos.length) return;
  hl.geometry.dispose();
  hl.geometry = new THREE.BufferGeometry();
  hl.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  hl.visible = true;
}
function select(p) {
  const e = p.e;
  if (e.k === 'obj') sel = { type: 'obj', id: e.id };
  else if (e.k === 'stairs') sel = { type: 'stairs', key: 'stairs' };
  else sel = { type: 'surf', key: e.key, scope: e.rkey ? 'all' : 'one' };
  updateHL();
  ui.stack = [{ name: 'home' }]; ui.nav(sel.type === 'obj' ? 'obj' : sel.type === 'stairs' ? 'stairs' : 'surf');
}
function setSurfMat(e, id) {
  snapshot();
  const all = sel.scope === 'all' && e.rkey;
  if (all) {
    const suf = e.rkey === 'ext' ? ':ext' : ':' + e.rkey.slice(3);
    for (const k of Object.keys(U.mats)) if (k.startsWith('w:') && k.endsWith(suf)) delete U.mats[k];
    if (id == null) delete U.mats[e.rkey]; else U.mats[e.rkey] = id;
  } else if (id == null) delete U.mats[e.key]; else U.mats[e.key] = id;
  saveUser(); rebuildStructure(); updateHL();
}
function setStairs(patch) { snapshot(); U.stairs = { ...(U.stairs || {}), ...patch }; saveUser(); rebuildStructure(); updateHL(); }
function patchObj(id, patch) {
  const a = U.added.find(o => o.id === id);
  if (a) Object.assign(a, patch); else U.objs[id] = { ...(U.objs[id] || {}), ...patch };
}
function editObj(id, patch) { snapshot(); patchObj(id, patch); saveUser(); rebuildObjects(); updateHL(); }
function delObj(id) {
  snapshot();
  const i = U.added.findIndex(o => o.id === id);
  if (i >= 0) U.added.splice(i, 1); else U.objs[id] = { del: true };
  saveUser(); sel = null; rebuildObjects(); updateHL(); ui.home();
}
function addObj(t, p, extra = {}) {
  snapshot();
  const o = { id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100), t, p: [r2(p.x), r2(p.y), r2(p.z)], r: 0, ...extra };
  U.added.push(o); saveUser(); rebuildObjects();
  return o;
}
function addAt(t) {
  const h = headPos(_v1); camera.getWorldDirection(_v2); _v2.y = 0; _v2.normalize();
  const x = h.x + _v2.x * 2.2, z = h.z + _v2.z * 2.2, y = floorAt(x, z, feet + 0.8) ?? feet;
  const o = addObj(t, { x, y, z }, t === 'zona' ? { layer: 6 } : {});
  sel = { type: 'obj', id: o.id };
  ui.stack = [{ name: 'home' }]; ui.nav('obj');
  startMove(o.id, true);
}
function startMove(id, fresh) {
  const o = getObj(id); if (!o) return;
  if (o.lock) return toast('Questo elemento è fisso');
  move = { id, o: { ...o, p: [...o.p] }, fresh };
  rebuildObjects();
  for (const m of buildLive(move.o)) gLive.add(m);
  gLive.position.set(o.p[0], o.p[1], o.p[2]); gLive.rotation.y = (o.r || 0) * DEG;
  updateHL(); ui.draw();
}
function endMove(commit) {
  if (!move) return;
  const m = move; move = null; clearGroup(gLive);
  if (commit) { if (!m.fresh) snapshot(); patchObj(m.id, { p: m.o.p.map(r2), r: m.o.r || 0 }); saveUser(); }
  else if (m.fresh) { const i = U.added.findIndex(o => o.id === m.id); if (i >= 0) U.added.splice(i, 1); saveUser(); sel = null; ui.stack = [{ name: 'home' }]; }
  rebuildObjects(); updateHL(); ui.draw();
}
function moveTo(pt) { const s = 0.05; move.o.p = [Math.round(pt.x / s) * s, pt.y, Math.round(pt.z / s) * s]; gLive.position.set(move.o.p[0], move.o.p[1], move.o.p[2]); }
function rotMove(deg) { move.o.r = ((move.o.r || 0) + deg + 360) % 360; gLive.rotation.y = move.o.r * DEG; }
function doUndo() {
  if (!undo.length) return toast('Niente da annullare');
  if (move) endMove(false);
  U = JSON.parse(undo.pop()); saveUser(); sel = null; rebuildAll(); ui.home(); toast('Modifica annullata');
}
function resetAll() { snapshot(); U = { mats: {}, objs: {}, added: [], stairs: {} }; saveUser(); sel = null; rebuildAll(); ui.home(); toast('Progetto ripristinato'); }

// azione principale (grilletto / clic): il raggio "ray" è già impostato
function action() {
  if (move) { const hit = ray.intersectObjects(walkMeshes, false)[0]; if (hit) moveTo(hit.point); endMove(true); return; }
  if (menuOpen) { const p = pick(); if (p) select(p); return; }
  const hits = ray.intersectObjects([...pickMeshes, terrain], false);
  const h = hits[0];
  if (h && (h.object.userData.flags & WALK) && h.face && h.face.normal.y > 0.5 && h.distance < 60) teleport(h.point);
}
function toggleMenu(force) {
  menuOpen = force ?? !menuOpen;
  if (!menuOpen) { if (move) endMove(false); sel = null; updateHL(); } else { ui.home(); placePanel(); }
  document.body.classList.toggle('menu', menuOpen);
  panel.visible = menuOpen && renderer.xr.isPresenting;
  marker.visible = false;
}
function switchFloor() {
  const up = feet < 2, v = S.views[S.floorViews[up ? 'p1' : 'pt']];
  goTo(v); toast(up ? 'Piano primo' : 'Piano terra');
}
function toggleNight() { night = !night; applyLight(); ui.draw(); }

// ------------------------------------------------------------------ pannello (canvas condiviso fra schermo e VR)
const ui = { cv: document.createElement('canvas'), items: [], stack: [{ name: 'home' }], hover: -1, grp: null, page: 0, W: 720, H: 1000 };
ui.cv.width = ui.W; ui.cv.height = ui.H;
const g = ui.cv.getContext('2d');
ui.tex = new THREE.CanvasTexture(ui.cv); ui.tex.colorSpace = THREE.SRGBColorSpace;
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
const C = { bg: '#161b22', card: '#252c36', hov: '#34404f', on: '#2f7de1', tx: '#f2f4f7', dim: '#9aa6b5', line: '#313a46', warn: '#b3403a' };

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function txt(s, x, y, size = 30, color = C.tx, align = 'left', weight = 500, maxW = 0) {
  g.font = `${weight} ${size}px ${FONT}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  if (maxW) { while (g.measureText(s).width > maxW && size > 16) { size -= 1; g.font = `${weight} ${size}px ${FONT}`; } }
  g.fillText(s, x, y);
}
function wrap(s, maxW, size, weight = 500) {
  g.font = `${weight} ${size}px ${FONT}`;
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function para(s, x, y, maxW, size = 26, color = C.dim, lh = 1.3) { const ls = wrap(s, maxW, size); ls.forEach((l, i) => txt(l, x, y + i * size * lh, size, color)); return y + ls.length * size * lh; }
function btn(x, y, w, h, label, act, o = {}) {
  const i = ui.items.length; ui.items.push({ x, y, w, h, act });
  rr(x, y, w, h, 14); g.fillStyle = o.on ? C.on : o.warn ? (ui.hover === i ? '#c9504a' : C.warn) : ui.hover === i ? C.hov : C.card; g.fill();
  let tx = x + w / 2, al = 'center', mw = w - 24;
  if (o.sw) { g.save(); rr(x + 10, y + 10, h - 20, h - 20, 8); g.clip(); drawSwatch(g, o.sw, x + 10, y + 10, h - 20, h - 20); g.restore(); tx = x + h + 6; al = 'left'; mw = w - h - 20; }
  const size = o.size || 30, ls = wrap(label, mw, size);
  if (o.sub) { txt(label, tx, y + h / 2 - 15, size, C.tx, al, 600, mw); txt(o.sub, tx, y + h / 2 + 19, 22, o.on ? '#dbe8fb' : C.dim, al, 400, mw); }
  else if (ls.length > 1) { txt(ls[0], tx, y + h / 2 - size * 0.58, size - 2, C.tx, al, 600, mw); txt(ls.slice(1).join(' '), tx, y + h / 2 + size * 0.58, size - 2, C.tx, al, 600, mw); }
  else txt(label, tx, y + h / 2, size, C.tx, al, 600, mw);
}
function header(title, sub) {
  g.fillStyle = C.bg; g.fillRect(0, 0, ui.W, ui.H);
  g.fillStyle = '#1f2630'; g.fillRect(0, 0, ui.W, 92);
  let x = 28;
  if (ui.stack.length > 1) { btn(14, 14, 64, 64, '‹', () => ui.back(), { size: 44 }); x = 96; }
  btn(ui.W - 78, 14, 64, 64, '×', () => toggleMenu(false), { size: 40 });
  txt(title, x, sub ? 34 : 46, 32, C.tx, 'left', 700, ui.W - x - 100);
  if (sub) txt(sub, x, 68, 22, C.dim, 'left', 400, ui.W - x - 100);
}
// selettore materiali: schede per gruppo + griglia di campioni
function picker(y, defGrp, cur, onPick) {
  if (!ui.grp) ui.grp = (cur && GROUPS[matGroup(cur)]) ? matGroup(cur) : defGrp;
  const gk = Object.keys(GROUPS), tw = 96;
  gk.forEach((k, i) => btn(20 + i * (tw + 2), y, tw, 54, GROUPS[k], () => { ui.grp = k; ui.page = 0; ui.draw(); }, { on: ui.grp === k, size: 19 }));
  y += 70;
  const list = groupList(ui.grp), per = 12, pages = Math.ceil(list.length / per);
  ui.page = Math.min(ui.page, pages - 1);
  list.slice(ui.page * per, ui.page * per + per).forEach((id, i) => {
    const cx = 20 + (i % 4) * 172, cy = y + Math.floor(i / 4) * 176, n = ui.items.length;
    ui.items.push({ x: cx, y: cy, w: 164, h: 168, act: () => onPick(id) });
    rr(cx, cy, 164, 168, 12); g.fillStyle = id === cur ? C.on : ui.hover === n ? C.hov : C.card; g.fill();
    g.save(); rr(cx + 8, cy + 8, 148, 104, 8); g.clip(); drawSwatch(g, id, cx + 8, cy + 8, 148, 104); g.restore();
    const ls = wrap(matName(id), 150, 20);
    ls.slice(0, 2).forEach((l, k) => txt(l, cx + 82, cy + 128 + k * 23 - (ls.length > 1 ? 4 : -8), 20, C.tx, 'center', 500, 152));
  });
  y += 3 * 176 + 6;
  if (pages > 1) {
    btn(20, y, 150, 56, '‹ Indietro', () => { ui.page = Math.max(0, ui.page - 1); ui.draw(); }, { size: 24 });
    txt(`${ui.page + 1} / ${pages}`, ui.W / 2, y + 28, 24, C.dim, 'center');
    btn(ui.W - 170, y, 150, 56, 'Avanti ›', () => { ui.page = Math.min(pages - 1, ui.page + 1); ui.draw(); }, { size: 24 });
  }
  return y + 66;
}
const SCREENS = {
  home() {
    header(S.title || 'Villa 3D', 'Modifica del progetto');
    let y = para('Punta una parete, un pavimento, la scala o un arredo e premi il grilletto (o tocca) per modificarlo.', 28, 132, 664, 26, C.tx);
    y += 14;
    const b = [['Aggiungi oggetto', () => ui.nav('cats')], ['Vai a…', () => ui.nav('goto')],
    [night ? 'Passa al giorno' : 'Passa alla notte', toggleNight], ['Cambia piano', switchFloor],
    ['Annulla ultima modifica', doUndo], ['Ripristina progetto', () => ui.nav('reset')]];
    b.forEach((q, i) => btn(20 + (i % 2) * 345, y + Math.floor(i / 2) * 124, 335, 110, q[0], q[1]));
    y += 3 * 124 + 26;
    txt('Comandi nel visore', 28, y, 26, C.tx, 'left', 700); y += 40;
    for (const l of ['Levetta sinistra: cammini', 'Levetta destra: ruoti a scatti', 'Grilletto: teletrasporto, oppure selezione con il menu aperto', 'A / X: apre e chiude questo menu', 'B / Y: cambia piano'])
      y = para('• ' + l, 28, y, 664, 23, C.dim, 1.35) + 4;
    txt('Scena ' + S.rev + '  ·  app ' + APPV + '  ·  le modifiche restano salvate su questo dispositivo', 28, ui.H - 30, 19, C.dim, 'left', 400, 664);
  },
  surf() {
    const e = entByKey(sel.key); if (!e) return SCREENS.home();
    header(e.name, 'Materiale: ' + matName(e.cur));
    let y = 110;
    if (e.rkey) {
      btn(20, y, 335, 64, 'Solo questa', () => { sel.scope = 'one'; ui.draw(); }, { on: sel.scope === 'one', size: 26 });
      btn(365, y, 335, 64, e.rname, () => { sel.scope = 'all'; ui.draw(); }, { on: sel.scope === 'all', size: 26 });
      y += 80;
    }
    y = picker(y, e.grp, e.cur, id => { setSurfMat(e, id); ui.draw(); });
    btn(20, ui.H - 84, 680, 60, 'Ripristina il materiale del progetto', () => { setSurfMat(e, null); ui.grp = null; ui.draw(); }, { size: 24 });
  },
  stairs() {
    const st = { ...S.stairs, ...(U.stairs || {}) };
    header('Scala', 'Tipologia, parapetto e materiali');
    let y = 120;
    txt('Tipologia', 28, y, 26, C.dim); y += 30;
    btn(20, y, 335, 96, 'Piena', () => { setStairs({ style: 'piena' }); ui.draw(); }, { on: st.style === 'piena', sub: 'in muratura, rivestita' });
    btn(365, y, 335, 96, 'Sospesa', () => { setStairs({ style: 'sbalzo' }); ui.draw(); }, { on: st.style === 'sbalzo', sub: 'gradini a sbalzo' });
    y += 126; txt('Parapetto', 28, y, 26, C.dim); y += 30;
    [['vetro', 'Vetro'], ['metallo', 'Ringhiera'], ['nessuna', 'Nessuno']].forEach((q, i) => btn(20 + i * 230, y, 220, 80, q[1], () => { setStairs({ rail: q[0] }); ui.draw(); }, { on: st.rail === q[0], size: 26 }));
    y += 110; txt('Materiali', 28, y, 26, C.dim); y += 30;
    btn(20, y, 680, 100, 'Gradini', () => { ui.grp = null; ui.nav('smat', 'tread'); }, { sw: st.tread, sub: matName(st.tread) }); y += 112;
    btn(20, y, 680, 100, 'Struttura e alzate', () => { ui.grp = null; ui.nav('smat', 'body'); }, { sw: st.body, sub: matName(st.body) });
    btn(20, ui.H - 84, 680, 60, 'Ripristina la scala del progetto', () => { snapshot(); U.stairs = {}; saveUser(); rebuildStructure(); updateHL(); ui.draw(); }, { size: 24 });
  },
  smat(arg) {
    const st = { ...S.stairs, ...(U.stairs || {}) };
    header(arg === 'tread' ? 'Scala · gradini' : 'Scala · struttura', 'Materiale: ' + matName(st[arg]));
    picker(110, arg === 'tread' ? 'legni' : 'muri', st[arg], id => { setStairs({ [arg]: id }); ui.draw(); });
  },
  obj() {
    const o = sel && getObj(sel.id) || (move && move.o); if (!o) return SCREENS.home();
    const d = CAT[o.t];
    header(o.n || d.name, CATS[d.cat]);
    let y = 116;
    if (move) {
      y = para('Punta il punto dove vuoi metterlo e premi il grilletto (o tocca) per confermare.', 28, y + 16, 664, 28, C.tx) + 20;
      btn(20, y, 335, 100, 'Ruota a sinistra', () => rotMove(15)); btn(365, y, 335, 100, 'Ruota a destra', () => rotMove(-15)); y += 116;
      btn(20, y, 680, 90, 'Annulla spostamento', () => endMove(false));
      para('Nel visore puoi ruotare anche con la levetta destra.', 28, y + 130, 664, 23);
      return;
    }
    if (o.lock) y = para('Elemento fisso del lotto: puoi cambiarne solo il materiale.', 28, y + 12, 664, 25) + 14;
    else {
      btn(20, y, 220, 100, 'Sposta', () => startMove(o.id, false), { on: false });
      btn(250, y, 220, 100, 'Ruota ⟲', () => { editObj(o.id, { r: ((o.r || 0) + 15) % 360 }); ui.draw(); });
      btn(480, y, 220, 100, 'Ruota ⟳', () => { editObj(o.id, { r: ((o.r || 0) + 345) % 360 }); ui.draw(); });
      y += 112;
      btn(20, y, 335, 84, 'Duplica', () => { const n = addObj(o.t, { x: o.p[0] + 0.6, y: o.p[1], z: o.p[2] + 0.6 }, { r: o.r || 0, w: o.w, d: o.d, m: o.m, m2: o.m2, layer: o.layer }); sel = { type: 'obj', id: n.id }; startMove(n.id, true); });
      btn(365, y, 335, 84, 'Elimina', () => delObj(o.id), { warn: true });
      y += 104;
    }
    const stepper = (lab, key, spec) => {
      const v = o[key] ?? spec[0];
      txt(`${lab}: ${v.toFixed(2).replace('.', ',')} m`, 28, y + 38, 28, C.tx);
      btn(430, y, 130, 76, '−', () => { editObj(o.id, { [key]: r2(Math.max(spec[1], v - spec[3])) }); ui.draw(); }, { size: 40 });
      btn(570, y, 130, 76, '+', () => { editObj(o.id, { [key]: r2(Math.min(spec[2], v + spec[3])) }); ui.draw(); }, { size: 40 });
      y += 88;
    };
    if (!o.lock && d.w) stepper('Larghezza', 'w', d.w);
    if (!o.lock && d.d) stepper('Profondità', 'd', d.d);
    if (d.m) { const c = o.m || d.m; btn(20, y, 680, 100, d.n1 || 'Materiale', () => { ui.grp = null; ui.nav('omat', 1); }, { sw: c, sub: matName(c) }); y += 112; }
    if (d.m2) { const c = o.m2 || d.m2; btn(20, y, 680, 100, d.n2 || 'Seconda finitura', () => { ui.grp = null; ui.nav('omat', 2); }, { sw: c, sub: matName(c) }); y += 112; }
  },
  omat(arg) {
    const o = getObj(sel.id); if (!o) return SCREENS.home();
    const d = CAT[o.t], k = arg === 1 ? 'm' : 'm2', cur = o[k] || d[k];
    header((o.n || d.name), (arg === 1 ? d.n1 || 'Materiale' : d.n2 || 'Seconda finitura') + ': ' + matName(cur));
    picker(110, (arg === 1 ? d.mg : d.m2g) || 'met', cur, id => { editObj(o.id, { [k]: id }); ui.draw(); });
  },
  cats() {
    header('Aggiungi oggetto', 'Scegli una categoria');
    Object.keys(CATS).forEach((k, i) => btn(20, 116 + i * 104, 680, 92, CATS[k], () => { ui.page = 0; ui.nav('items', k); }));
  },
  items(cat) {
    header(CATS[cat], 'Scegli cosa aggiungere: comparirà davanti a te');
    const list = Object.values(CAT).filter(d => d.cat === cat), per = 12, pages = Math.ceil(list.length / per);
    ui.page = Math.min(ui.page, pages - 1);
    list.slice(ui.page * per, ui.page * per + per).forEach((d, i) => btn(20 + (i % 2) * 345, 116 + Math.floor(i / 2) * 122, 335, 110, d.name, () => addAt(d.id), { size: 26 }));
    if (pages > 1) {
      btn(20, ui.H - 84, 200, 60, '‹ Indietro', () => { ui.page = Math.max(0, ui.page - 1); ui.draw(); }, { size: 24 });
      btn(ui.W - 220, ui.H - 84, 200, 60, 'Avanti ›', () => { ui.page = Math.min(pages - 1, ui.page + 1); ui.draw(); }, { size: 24 });
    }
  },
  goto() {
    header('Vai a…', 'Spostati direttamente in un punto della villa');
    S.views.forEach((v, i) => btn(20 + (i % 2) * 345, 116 + Math.floor(i / 2) * 118, 335, 106, v.n, () => { goTo(v); placePanel(); }, { size: 26 }));
  },
  reset() {
    header('Ripristina progetto');
    const y = para('Vuoi cancellare tutte le tue modifiche (materiali, oggetti aggiunti, spostati o tolti) e tornare al progetto di partenza?', 28, 150, 664, 28, C.tx);
    btn(20, y + 30, 335, 110, 'Sì, ripristina', resetAll, { warn: true }); btn(365, y + 30, 335, 110, 'No, torna indietro', () => ui.back());
  }
};
ui.draw = () => {
  if (!S) return;
  ui.items = [];
  const top = ui.stack[ui.stack.length - 1];
  SCREENS[top.name](top.arg);
  ui.tex.needsUpdate = true;
};
ui.nav = (name, arg) => { ui.stack.push({ name, arg }); ui.hover = -1; ui.draw(); };
ui.back = () => { if (ui.stack.length > 1) ui.stack.pop(); ui.hover = -1; ui.grp = null; ui.page = 0; if (ui.stack.length === 1) { sel = null; updateHL(); } ui.draw(); };
ui.home = () => { ui.stack = [{ name: 'home' }]; ui.hover = -1; ui.grp = null; ui.page = 0; ui.draw(); };
ui.hit = (x, y) => { for (let i = ui.items.length - 1; i >= 0; i--) { const it = ui.items[i]; if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return i; } return -1; };
ui.move = (x, y) => { const i = ui.hit(x, y); if (i !== ui.hover) { ui.hover = i; ui.draw(); } };
ui.click = (x, y) => { const i = ui.hit(x, y); if (i >= 0) { const a = ui.items[i].act; ui.hover = -1; a(); if (ui.items.length && ui.stack.length) ui.draw(); } };

// pannello su schermo (desktop / telefono)
$('panel').appendChild(ui.cv);
const cvXY = e => { const r = ui.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * ui.W, (e.clientY - r.top) / r.height * ui.H]; };
ui.cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') ui.move(...cvXY(e)); });
ui.cv.addEventListener('pointerleave', () => ui.move(-1, -1));
ui.cv.addEventListener('click', e => ui.click(...cvXY(e)));

// pannello nel visore: tenuto nella mano sinistra, oppure fisso davanti
const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4 * ui.H / ui.W), new THREE.MeshBasicMaterial({ map: ui.tex }));
panel.visible = false; panel.renderOrder = 10;
function placePanel() {
  if (!renderer.xr.isPresenting) return;
  const left = ctrl.find(c => c.userData.src && c.userData.src.handedness === 'left');
  if (left) { left.add(panel); panel.position.set(0, 0.24, 0.02); panel.rotation.set(-0.5, 0, 0); }
  else {
    rig.add(panel);
    _v1.set(0, 0, -1).applyQuaternion(camera.quaternion); _v1.y = 0; _v1.normalize();
    panel.position.copy(camera.position).addScaledVector(_v1, 0.75); panel.position.y -= 0.18;
    panel.rotation.set(0, Math.atan2(-_v1.x, -_v1.z), 0);
  }
}

// messaggi brevi
const tcv = document.createElement('canvas'); tcv.width = 1024; tcv.height = 128;
const ttex = new THREE.CanvasTexture(tcv); ttex.colorSpace = THREE.SRGBColorSpace;
const tmesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), new THREE.MeshBasicMaterial({ map: ttex, transparent: true, depthTest: false }));
tmesh.position.set(0, -0.32, -1.1); tmesh.visible = false; tmesh.renderOrder = 11; camera.add(tmesh);
let toastT = 0;
function toast(msg, ms = 3200) {
  const el = $('toast'); el.textContent = msg; el.classList.add('on');
  const c = tcv.getContext('2d'); c.clearRect(0, 0, 1024, 128);
  c.fillStyle = 'rgba(18,22,28,.88)'; c.beginPath(); c.roundRect(4, 4, 1016, 120, 28); c.fill();
  c.font = `600 44px ${FONT}`; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let s = 44; while (c.measureText(msg).width > 960 && s > 20) { s -= 2; c.font = `600 ${s}px ${FONT}`; }
  c.fillText(msg, 512, 66); ttex.needsUpdate = true; tmesh.visible = renderer.xr.isPresenting;
  clearTimeout(toastT); toastT = setTimeout(() => { el.classList.remove('on'); tmesh.visible = false; }, ms);
}

// ------------------------------------------------------------------ controller VR
const ctrl = [0, 1].map(i => {
  const c = renderer.xr.getController(i);
  rig.add(c);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  line.scale.z = 3; line.visible = false; c.add(line); c.userData.line = line;
  c.addEventListener('connected', e => { c.userData.src = e.data; c.userData.prev = { b: [], tx: 0 }; line.visible = e.data.targetRayMode === 'tracked-pointer'; if (menuOpen) placePanel(); });
  c.addEventListener('disconnected', () => { c.userData.src = null; line.visible = false; });
  c.addEventListener('selectstart', () => onTrigger(c));
  return c;
});
function rayFrom(c) {
  c.updateWorldMatrix(true, false);
  _m.identity().extractRotation(c.matrixWorld);
  ray.ray.origin.setFromMatrixPosition(c.matrixWorld);
  ray.ray.direction.set(0, 0, -1).applyMatrix4(_m).normalize();
}
function panelUV() { if (!panel.visible) return null; const h = ray.intersectObject(panel, false)[0]; return h ? [h.uv.x * ui.W, (1 - h.uv.y) * ui.H, h.distance] : null; }
function onTrigger(c) {
  rayFrom(c);
  const p = panelUV();
  if (p) { ui.click(p[0], p[1]); return; }
  if (panel.parent === c) return;          // la mano che regge il pannello non seleziona
  action();
}
function pointerCtrl() {
  const live = ctrl.filter(c => c.userData.src && c.userData.src.targetRayMode === 'tracked-pointer');
  return live.find(c => c.userData.src.handedness === 'right') || live.find(c => panel.parent !== c) || live[0];
}
function xrInput(dt) {
  let mx = 0, my = 0, hasLeft = false;
  for (const c of ctrl) {
    const src = c.userData.src; if (!src || !src.gamepad) continue;
    const gp = src.gamepad, P = c.userData.prev, n = gp.axes.length;
    const ax = n >= 4 ? gp.axes[2] : gp.axes[0] || 0, ay = n >= 4 ? gp.axes[3] : gp.axes[1] || 0;
    const down = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    if (src.handedness === 'left') { hasLeft = true; mx = ax; my = ay; }
    else {
      const t = ax > 0.6 ? 1 : ax < -0.6 ? -1 : 0;
      if (t !== P.tx) { P.tx = t; if (t) { if (move) rotMove(-t * 15); else snapTurn(-t * 30 * DEG); } }
      c.userData.ry = ay;
    }
    for (const i of [4, 5]) { const d = down(i); if (d && !P.b[i]) { if (i === 4) toggleMenu(); else switchFloor(); } P.b[i] = d; }
    const sq = down(1); if (sq && !P.b[1] && move) endMove(false); P.b[1] = sq;
  }
  if (!hasLeft) { const r = ctrl.find(c => c.userData.src && c.userData.ry != null); if (r) my = r.userData.ry; }
  if (Math.hypot(mx, my) > 0.15) {
    camera.getWorldDirection(_v2); _v2.y = 0; _v2.normalize();
    const sp = 2.3 * dt;
    tryMove((_v2.x * -my - _v2.z * mx) * sp, (_v2.z * -my + _v2.x * mx) * sp);
  }
  // puntatore: pannello, anteprima spostamento, segnaposto del teletrasporto
  const pc = pointerCtrl(); marker.visible = false;
  if (!pc) return;
  rayFrom(pc);
  const line = pc.userData.line; let len = 3;
  const p = panelUV();
  if (p) { ui.move(p[0], p[1]); len = p[2]; }
  else {
    if (ui.hover !== -1) ui.move(-1, -1);
    if (move || !menuOpen) {
      const h = ray.intersectObjects(walkMeshes, false)[0];
      if (h && h.face && h.face.normal.y > 0.5 && h.distance < 60) {
        len = h.distance;
        if (move) moveTo(h.point); else { marker.position.copy(h.point); marker.position.y += 0.02; marker.visible = true; }
      }
    } else len = 6;
  }
  line.scale.z = len;
}

// ------------------------------------------------------------------ schermo: tastiera, mouse, tocco
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyM') toggleMenu(); else if (e.code === 'KeyF') switchFloor(); else if (e.code === 'KeyN') toggleNight();
  else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) doUndo();
  if (move) { if (e.code === 'KeyQ') rotMove(15); if (e.code === 'KeyE') rotMove(-15); if (e.code === 'Escape') endMove(false); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
function deskInput(dt) {
  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
  if (keys.ArrowLeft) yaw += 1.6 * dt; if (keys.ArrowRight) yaw -= 1.6 * dt;
  if (!move) { if (keys.KeyQ) yaw += 1.6 * dt; if (keys.KeyE) yaw -= 1.6 * dt; }
  rig.rotation.y = yaw; camera.rotation.set(pitch, 0, 0);
  if (f || s) {
    const sp = (keys.ShiftLeft ? 5 : 2.6) * dt, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    tryMove((fx * f - fz * s) * sp, (fz * f + fx * s) * sp);
  }
}
const cvs = renderer.domElement; let drag = null;
const setMouseRay = e => { const r = cvs.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera); };
cvs.addEventListener('pointerdown', e => { if (renderer.xr.isPresenting) return; drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), id: e.pointerId }; cvs.setPointerCapture(e.pointerId); });
cvs.addEventListener('pointermove', e => {
  if (renderer.xr.isPresenting) return;
  if (drag && drag.id === e.pointerId) {
    yaw += (e.clientX - drag.x) * 0.0045; pitch = Math.max(-1.35, Math.min(1.35, pitch + (e.clientY - drag.y) * 0.0045));
    drag.x = e.clientX; drag.y = e.clientY;
  } else if (move && e.pointerType === 'mouse') { setMouseRay(e); const h = ray.intersectObjects(walkMeshes, false)[0]; if (h) moveTo(h.point); }
});
cvs.addEventListener('pointerup', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const still = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 7 && performance.now() - drag.t < 600;
  drag = null;
  if (still && S) { setMouseRay(e); action(); }
});
cvs.addEventListener('pointercancel', () => { drag = null; });
cvs.addEventListener('wheel', e => { if (!renderer.xr.isPresenting) { const d = -e.deltaY * 0.004; tryMove(-Math.sin(yaw) * d, -Math.cos(yaw) * d); e.preventDefault(); } }, { passive: false });
addEventListener('resize', () => { if (renderer.xr.isPresenting) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

$('bMenu').onclick = () => toggleMenu();
$('bFloor').onclick = () => switchFloor();
$('bNight').onclick = () => toggleNight();
$('bHelp').onclick = () => { $('start').style.display = 'flex'; };
$('goScreen').onclick = () => { $('start').style.display = 'none'; };

// ------------------------------------------------------------------ VR
async function enterVR() {
  try {
    const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    await renderer.xr.setSession(s);
  } catch (e) { toast('Impossibile avviare la VR: ' + e.message, 5000); }
}
$('goVR').onclick = enterVR; $('bVR').onclick = enterVR;
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then(ok => { document.body.classList.toggle('hasvr', !!ok); }).catch(() => { });
}
renderer.xr.addEventListener('sessionstart', () => {
  const h = headPos(_v1);
  anchor = { p: [h.x, feet, h.z], yaw: yaw / DEG }; xrFrames = 0;
  document.body.classList.add('xr'); $('start').style.display = 'none';
  panel.visible = menuOpen;
});
renderer.xr.addEventListener('sessionend', () => {
  const h = headPos(_v1).clone();
  document.body.classList.remove('xr'); panel.visible = false; marker.visible = false;
  camera.position.set(0, 1.65, 0); camera.quaternion.identity(); pitch = 0; camera.fov = 72;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  rig.position.x = h.x; rig.position.z = h.z;
});

// ------------------------------------------------------------------ ciclo
let last = 0;
renderer.setAnimationLoop(t => {
  const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  if (!S) return;
  if (renderer.xr.isPresenting) {
    if (anchor && ++xrFrames > 3) { goTo(anchor); anchor = null; placePanel(); toast('A = menu modifiche · B = cambia piano · grilletto = teletrasporto', 7000); }
    xrInput(dt);
  } else deskInput(dt);
  if (!Q.has('fly')) updateFeet(dt);
  renderer.render(scene, camera);
});

// ------------------------------------------------------------------ avvio
(async () => {
  applyLight();
  await loadScene(true);
  if (!S) return;
  const vi = Q.has('view') ? +Q.get('view') : 0;
  goTo(S.views[vi] || S.views[0]);
  if (Q.has('pose')) { const a = Q.get('pose').split(',').map(Number); goTo({ p: [a[0], a[1], a[2]], yaw: a[3] || 0, pitch: a[4] || 0 }); }
  if (Q.has('night')) { night = true; applyLight(); }
  if (Q.has('cut')) renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), +Q.get('cut'))];
  if (Q.has('shot')) { $('start').style.display = 'none'; document.body.classList.add('shot'); }
  if (Q.has('menu')) toggleMenu(true);
  ui.draw();
  document.body.classList.add('ready');
  setInterval(() => loadScene(false), 15000);
  window.V = { THREE, goTo, toggleMenu, select, ui, get S() { return S; }, get U() { return U; }, get feet() { return feet; }, get sel() { return sel; }, get move() { return move; }, get col() { return col; },
    scene, camera, rig, renderer, action, ray, pick, addAt, switchFloor, tryMove, updateFeet, headPos, floorAt, endMove, doUndo, resetAll, toggleNight, loadScene, info: () => renderer.info.render };
})();
