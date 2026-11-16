// Costruisce la struttura della villa dal file di scena: stanze, muri con aperture, infissi,
// solai, balconi, parapetti, attico e scala. Ogni superficie ha una "entità" per poterla selezionare.
import { Builder, WALK, NOPICK } from './builder.js?v=6';
import { getMat } from './mats.js?v=6';

export function buildStructure(S, U) {
  const B = new Builder();
  const ents = [null], eix = new Map(), col = [];
  const um = U.mats || {};
  const E = (key, info) => {
    let i = eix.get(key);
    if (i == null) { i = ents.length; ents.push({ key, ...info }); eix.set(key, i); }
    B.ent = i; return ents[i];
  };
  const lv = S.levels;
  const rooms = S.rooms.map(r => ({ ...r, y0: lv[r.lv].y, y1: lv[r.lv].y + (r.ch || lv[r.lv].h), all: r.rects.concat(r.crects || []) }));
  const roomAt = (x, z, y) => {
    for (const r of rooms) {
      if (y < r.y0 - 0.02 || y > r.y1 + 0.02) continue;
      for (const q of r.all) if (x > q[0] && x < q[2] && z > q[1] && z < q[3]) return r;
    }
    return null;
  };

  // ---------- pavimenti e soffitti ----------
  for (const r of rooms) {
    const fk = 'f:' + r.id, fm = um[fk] || r.floor;
    E(fk, { k: 'surf', name: 'Pavimento · ' + r.name, def: r.floor, grp: 'pav', cur: fm });
    B.flags = WALK;
    for (const q of r.rects) B.face('y+', q[0], r.y0 - 0.1, q[1], q[2], r.y0, q[3], fm);
    B.flags = 0;
    const ck = 'c:' + r.id, cd = r.ceil || 'soffitto_bianco', cm = um[ck] || cd;
    E(ck, { k: 'surf', name: 'Soffitto · ' + r.name, def: cd, grp: 'muri', cur: cm });
    for (const q of (r.crects || r.rects)) B.face('y-', q[0], r.y1, q[1], q[2], r.y1 + 0.1, q[3], cm);
  }

  // ---------- muri ----------
  const trimM = um['trim'] || 'pittura_bianca';
  const frM = um['fr'] || 'metallo_nero';
  const doorMat = { int: 'laccato_bianco', ing: 'legno_rovere', serv: 'laccato_grigio' };
  const doorName = { int: 'Porte interne (tutte)', ing: 'Portoncino d\'ingresso', serv: 'Porte di servizio (tutte)' };
  const sideEnt = (w, side, x, z, y) => {
    const room = roomAt(x, z, y);
    if (room) {
      const key = `w:${w.id}:${side}:${room.id}`, def = room.walls || 'pittura_bianca', rk = 'rw:' + room.id;
      const cur = um[key] || um[rk] || def;
      E(key, { k: 'surf', name: 'Parete · ' + room.name, def, grp: 'muri', cur, rkey: rk, rname: 'Tutta la stanza' });
      return cur;
    }
    const key = `w:${w.id}:${side}:ext`, def = w.ext || 'intonaco_bianco';
    const cur = um[key] || um['ext'] || def;
    E(key, { k: 'surf', name: 'Facciata', def, grp: 'est', cur, rkey: 'ext', rname: 'Tutte le facciate' });
    return cur;
  };

  for (const w of S.walls) {
    const isX = w.ax === 'x', L = lv[w.lv].y;
    const [x1, z1, x2, z2] = w.r;
    const u0 = isX ? x1 : z1, u1 = isX ? x2 : z2, t0 = isX ? z1 : x1, t1 = isX ? z2 : x2;
    const ops = (w.op || []).slice().sort((a, b) => a.a - b.a);
    const cuts = new Set([u0, u1, ...(w.cuts || [])]);
    for (const o of ops) { cuts.add(o.a); cuts.add(o.b); }
    const us = [...cuts].filter(u => u >= u0 - 1e-6 && u <= u1 + 1e-6).sort((a, b) => a - b);
    const opAt = u => ops.find(o => u > o.a - 1e-6 && u < o.b + 1e-6);
    // un pezzo di muro: a,b lungo l'asse; ya,yb in altezza
    const piece = (a, b, ya, yb, endA, endB) => {
      if (b - a < 1e-4 || yb - ya < 1e-4) return;
      const um_ = (a + b) / 2, ys = Math.min(Math.max((ya + yb) / 2, L + 0.3), L + 2.7);
      const bx1 = isX ? a : t0, bx2 = isX ? b : t1, bz1 = isX ? t0 : a, bz2 = isX ? t1 : b;
      // lato A (t0) e lato B (t1)
      const ma = sideEnt(w, 'a', isX ? um_ : t0 - 0.12, isX ? t0 - 0.12 : um_, ys);
      B.face(isX ? 'z-' : 'x-', bx1, ya, bz1, bx2, yb, bz2, ma);
      const mb = sideEnt(w, 'b', isX ? um_ : t1 + 0.12, isX ? t1 + 0.12 : um_, ys);
      B.face(isX ? 'z+' : 'x+', bx1, ya, bz1, bx2, yb, bz2, mb);
      E('trim', { k: 'surf', name: 'Spallette, davanzali e teste dei muri', def: 'pittura_bianca', grp: 'muri', cur: trimM });
      B.face('y+', bx1, ya, bz1, bx2, yb, bz2, trimM);
      if (ya > w.y + 0.01) B.face('y-', bx1, ya, bz1, bx2, yb, bz2, trimM);
      if (endA) B.face(isX ? 'x-' : 'z-', bx1, ya, bz1, bx2, yb, bz2, trimM);
      if (endB) B.face(isX ? 'x+' : 'z+', bx1, ya, bz1, bx2, yb, bz2, trimM);
      col.push({ x1: bx1, x2: bx2, z1: bz1, z2: bz2, y1: ya, y2: yb });
    };
    for (let i = 0; i < us.length - 1; i++) {
      const a = us[i], b = us[i + 1], mid = (a + b) / 2, o = opAt(mid);
      if (!o) {
        const pa = i === 0 || !!opAt((us[i - 1] + a) / 2), pb = i === us.length - 2 || !!opAt((b + us[i + 2]) / 2);
        piece(a, b, w.y, w.top, pa, pb);
      } else {
        const ys = L + (o.s || 0), ye = L + o.e;
        piece(a, b, w.y, o.s ? ys : ys - 0.004, false, false);
        piece(a, b, ye, w.top, false, false);
      }
    }
    // ----- aperture: soglie, infissi, vetri, ante -----
    const tc = (t0 + t1) / 2, th = t1 - t0;
    for (const o of ops) {
      const ys = L + (o.s || 0), ye = L + o.e, a = o.a, b = o.b;
      const P = (u, y, t) => isX ? [u, y, t] : [t, y, u];           // punto dal sistema del muro
      const ubox = (ua, ub, ya, yb, ta, tb, mat) => isX ? B.box(ua, ya, ta, ub, yb, tb, mat) : B.box(ta, ya, ua, tb, yb, ub, mat);
      if (!o.s) {       // soglia a filo pavimento
        const ext = !roomAt(isX ? (a + b) / 2 : t0 - 0.12, isX ? t0 - 0.12 : (a + b) / 2, L + 1) || !roomAt(isX ? (a + b) / 2 : t1 + 0.12, isX ? t1 + 0.12 : (a + b) / 2, L + 1);
        let sm;
        if (ext || th > 0.3) { sm = um['soglia'] || 'gres_est_scuro'; E('soglia', { k: 'surf', name: 'Soglie esterne', def: 'gres_est_scuro', grp: 'terra', cur: sm }); }
        else {
          const r = roomAt(isX ? (a + b) / 2 : t0 - 0.12, isX ? t0 - 0.12 : (a + b) / 2, L + 1);
          const fk = 'f:' + r.id; sm = um[fk] || r.floor; E(fk, {});
        }
        B.flags = WALK;
        if (isX) B.face('y+', a, L - 0.1, t0, b, L, t1, sm); else B.face('y+', t0, L - 0.1, a, t1, L, b, sm);
        B.flags = 0;
      }
      if (o.t === 'win' || o.t === 'glass') {
        E('fr', { k: 'surf', name: 'Infissi (tutti)', def: 'metallo_nero', grp: 'met', cur: frM });
        const f = 0.055, d = 0.07;
        ubox(a, b, ys, ys + f, tc - d / 2, tc + d / 2, frM); ubox(a, b, ye - f, ye, tc - d / 2, tc + d / 2, frM);
        ubox(a, a + f, ys, ye, tc - d / 2, tc + d / 2, frM); ubox(b - f, b, ys, ye, tc - d / 2, tc + d / 2, frM);
        const cols = o.g ? o.g[0] : (o.mv != null ? o.mv + 1 : Math.max(1, Math.round((b - a) / 1.1)));
        const rows = o.g ? o.g[1] : 1;
        for (let k = 1; k < cols; k++) { const u = a + (b - a) * k / cols; ubox(u - f / 2, u + f / 2, ys, ye, tc - d / 2, tc + d / 2, frM); }
        for (let k = 1; k < rows; k++) { const y = ys + (ye - ys) * k / rows; ubox(a, b, y - f / 2, y + f / 2, tc - d / 2, tc + d / 2, frM); }
        B.ent = 0; B.flags = NOPICK;
        B.quad(P(a, ys, tc), P(b, ys, tc), P(b, ye, tc), P(a, ye, tc), 'vetro');
        B.flags = 0;
      } else if (o.t === 'door') {
        const k = o.k || 'int', dk = 'dr:' + k, dm = um[dk] || doorMat[k];
        E(dk, { k: 'surf', name: doorName[k], def: doorMat[k], grp: 'legni', cur: dm });
        // telaio
        const f = 0.05;
        ubox(a - 0.001, a + f, ys, ye, t0 - 0.01, t1 + 0.01, dm); ubox(b - f, b + 0.001, ys, ye, t0 - 0.01, t1 + 0.01, dm);
        ubox(a, b, ye - f, ye + 0.001, t0 - 0.01, t1 + 0.01, dm);
        // anta aperta
        const wdt = b - a - 2 * f, hinge = o.hinge === 'b' ? b - f : a + f, cdir = o.hinge === 'b' ? -1 : 1;
        const sw = o.sw === 'a' ? -1 : 1, ang = (o.open ?? 88) * Math.PI / 180;
        const tface = sw < 0 ? t0 : t1;
        // direzione dell'anta nel piano (u,t)
        const du = Math.cos(ang) * cdir, dt = Math.sin(ang) * sw;
        const cu = hinge + du * wdt / 2, ct = tface + dt * wdt / 2 + sw * 0.02;
        const dx = isX ? du : dt, dz = isX ? dt : du;
        const cx = isX ? cu : ct, cz = isX ? ct : cu;
        B.rbx(cx, ys + 0.01, cz, wdt, ye - ys - f - 0.02, 0.045, Math.atan2(-dz, dx), dm);
        E('fr', { k: 'surf', name: 'Infissi (tutti)', def: 'metallo_nero', grp: 'met', cur: frM });
        B.rbx(cx + dx * (wdt / 2 - 0.09), ys + 1.0, cz + dz * (wdt / 2 - 0.09), 0.14, 0.03, 0.09, Math.atan2(-dz, dx), k === 'int' ? 'acciaio' : frM);
      }
    }
  }

  // ---------- box generici (solai, balconi, pensilina...) ----------
  for (const b of S.boxes || []) {
    const key = 'b:' + (b.key || b.id), cur = um[key] || b.m;
    if (b.np) { B.ent = 0; B.flags = NOPICK; }
    else { E(key, { k: 'surf', name: b.name, def: b.m, grp: b.grp || 'muri', cur }); B.flags = b.walk ? WALK : 0; }
    const q = b.b;
    if (b.walk) {
      B.face('y+', q[0], q[1], q[2], q[3], q[4], q[5], cur); B.flags = 0;
      const wk = 'b:sbalzi', wc = um[wk] || 'intonaco_bianco';
      E(wk, { k: 'surf', name: 'Intradossi e bordi dei balconi', def: 'intonaco_bianco', grp: 'est', cur: wc });
      for (const f of ['x+', 'x-', 'y-', 'z+', 'z-']) B.face(f, q[0], q[1], q[2], q[3], q[4], q[5], wc);
    } else B.box(q[0], q[1], q[2], q[3], q[4], q[5], cur);
    B.flags = 0;
    if (b.col) col.push({ x1: q[0], x2: q[3], z1: q[2], z2: q[5], y1: q[1], y2: q[4] });
  }
  for (const c of S.cyls || []) {
    const key = 'b:' + (c.key || c.id), cur = um[key] || c.m;
    E(key, { k: 'surf', name: c.name, def: c.m, grp: 'est', cur });
    B.cyl(c.c[0], c.y[0], c.c[1], c.r, c.y[1] - c.y[0], cur, 16);
    col.push({ x1: c.c[0] - c.r, x2: c.c[0] + c.r, z1: c.c[1] - c.r, z2: c.c[1] + c.r, y1: c.y[0], y2: c.y[1] });
  }

  // ---------- attico con sommità inclinata ----------
  if (S.attic) {
    const A = S.attic, hh = (x, z) => A.h[0] + A.h[1] * x + A.h[2] * z, n = A.poly.length;
    const em = um['ext'] || 'intonaco_bianco';
    E('w:attico:a:ext', { k: 'surf', name: 'Facciata · attico', def: 'intonaco_bianco', grp: 'est', cur: um['w:attico:a:ext'] || em, rkey: 'ext', rname: 'Tutte le facciate' });
    const am = um['w:attico:a:ext'] || em;
    let ar = 0; for (let i = 0; i < n; i++) { const p = A.poly[i], q = A.poly[(i + 1) % n]; ar += p[0] * q[1] - q[0] * p[1]; }
    for (let i = 0; i < n; i++) {
      const p = ar > 0 ? A.poly[(i + 1) % n] : A.poly[i], q = ar > 0 ? A.poly[i] : A.poly[(i + 1) % n];
      B.quad([p[0], A.y0, p[1]], [q[0], A.y0, q[1]], [q[0], hh(q[0], q[1]), q[1]], [p[0], hh(p[0], p[1]), p[1]], am);
    }
    const rk = 'b:tetto', rm = um[rk] || A.roof;
    E(rk, { k: 'surf', name: 'Copertura', def: A.roof, grp: 'est', cur: rm });
    // la copertura è un piano: si triangola il poligono e si alza ogni vertice
    const tmp = new Builder(); tmp.prism(A.poly, 0, 1, 'x', true, false);
    const tb = tmp.bk.values().next().value;
    for (let i = 0; i < tb.idx.length; i += 3) {
      const v = k => { const j = tb.idx[i + k] * 3; return [tb.pos[j], tb.pos[j + 1], tb.pos[j + 2]]; };
      const a = v(0), b = v(1), c = v(2);
      if (a[1] < 0.5 || b[1] < 0.5 || c[1] < 0.5) continue;      // solo la faccia superiore
      const up = p => [p[0], hh(p[0], p[2]), p[2]];
      B.tri(up(a), up(b), up(c), rm);
    }
  }

  // ---------- parapetti in vetro ----------
  E('fr', { k: 'surf', name: 'Infissi (tutti)', def: 'metallo_nero', grp: 'met', cur: frM });
  for (const r of S.rails || []) {
    const [ax, az] = r.a, [bx, bz] = r.b, y = r.y, h = r.h;
    B.ent = 0; B.flags = NOPICK;
    B.quad([ax, y, az], [bx, y, bz], [bx, y + h, bz], [ax, y + h, az], 'vetro');
    B.flags = 0; B.ent = eix.get('fr');
    B.beam([ax, y + h, az], [bx, y + h, bz], 0.04, 0.03, 'acciaio');
    if (r.col) col.push({ x1: Math.min(ax, bx) - 0.06, x2: Math.max(ax, bx) + 0.06, z1: Math.min(az, bz) - 0.06, z2: Math.max(az, bz) + 0.06, y1: y, y2: y + h });
  }

  // ---------- scala ----------
  if (S.stairs) {
    const st = { ...S.stairs, ...(U.stairs || {}) }, n = st.treads.length, rise = (st.top - st.base) / (n + 1);
    E('stairs', { k: 'stairs', name: 'Scala' });
    st.treads.forEach((poly, i) => {
      const ty = st.base + (i + 1) * rise;
      B.flags = WALK;
      if (st.style === 'sbalzo') B.prism(poly, ty - 0.07, ty, st.tread);
      else {
        B.prism(poly, ty - 0.04, ty, st.tread);
        B.flags = 0;
        B.prism(poly, Math.max(st.base, ty - rise - 0.2), ty - 0.04, st.body, false, true);
      }
      B.flags = 0;
    });
    if (st.rail !== 'nessuna') {
      for (const s of st.rails) {
        const y1 = st.base + s[2] * rise, y2 = st.base + s[5] * rise, a = [s[0], y1, s[1]], b = [s[3], y2, s[4]];
        if (st.rail === 'vetro') {
          B.ent = 0; B.flags = NOPICK;
          B.quad([a[0], y1 + 0.06, a[2]], [b[0], y2 + 0.06, b[2]], [b[0], y2 + 1.0, b[2]], [a[0], y1 + 1.0, a[2]], 'vetro');
          B.flags = 0; B.ent = eix.get('stairs');
          B.beam([a[0], y1 + 1.0, a[2]], [b[0], y2 + 1.0, b[2]], 0.04, 0.03, 'acciaio');
        } else {
          B.ent = eix.get('stairs');
          for (const hgt of [1.0, 0.7, 0.4, 0.1]) B.beam([a[0], y1 + hgt, a[2]], [b[0], y2 + hgt, b[2]], hgt === 1.0 ? 0.05 : 0.02, hgt === 1.0 ? 0.04 : 0.02, 'metallo_nero');
          B.box(a[0] - 0.02, y1, a[2] - 0.02, a[0] + 0.02, y1 + 1.0, a[2] + 0.02, 'metallo_nero');
          B.box(b[0] - 0.02, y2, b[2] - 0.02, b[0] + 0.02, y2 + 1.0, b[2] + 0.02, 'metallo_nero');
        }
      }
    }
  }

  const meshes = B.build(getMat, 's', ents);
  return { meshes, ents, col };
}
