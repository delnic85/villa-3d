// Accumula geometria per materiale e produce poche mesh unite (poche draw call per il visore).
import * as THREE from 'three';

export const WALK = 1, NOPICK = 2;
const _v = new THREE.Vector3(), _n = new THREE.Vector3();
let ICO = null;

export class Builder {
  constructor() {
    this.bk = new Map();
    this.m = new THREE.Matrix4();
    this.nm = new THREE.Matrix3();
    this.stack = [];
    this.ent = 0;
    this.flags = 0;
  }
  push(m) { this.stack.push(this.m.clone()); this.m.multiply(m); this.nm.getNormalMatrix(this.m); }
  pop() { this.m.copy(this.stack.pop()); this.nm.getNormalMatrix(this.m); }
  at(x, y, z, ry = 0) { const m = new THREE.Matrix4().makeRotationY(ry); m.setPosition(x, y, z); this.push(m); }
  _b(mat) {
    const k = mat + '|' + this.flags;
    let b = this.bk.get(k);
    if (!b) { b = { mat, flags: this.flags, pos: [], nor: [], idx: [], ent: [] }; this.bk.set(k, b); }
    return b;
  }
  _vt(b, p, nx, ny, nz) {
    _v.set(p[0], p[1], p[2]).applyMatrix4(this.m);
    _n.set(nx, ny, nz).applyMatrix3(this.nm).normalize();
    b.pos.push(_v.x, _v.y, _v.z); b.nor.push(_n.x, _n.y, _n.z);
    return b.pos.length / 3 - 1;
  }
  tri(a, b, c, mat) {
    const bk = this._b(mat);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    bk.idx.push(this._vt(bk, a, nx, ny, nz), this._vt(bk, b, nx, ny, nz), this._vt(bk, c, nx, ny, nz));
    bk.ent.push(this.ent);
  }
  // quadrilatero a,b,c,d in senso antiorario visto dal lato frontale
  quad(a, b, c, d, mat) {
    const bk = this._b(mat);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this._vt(bk, a, nx, ny, nz), i1 = this._vt(bk, b, nx, ny, nz), i2 = this._vt(bk, c, nx, ny, nz), i3 = this._vt(bk, d, nx, ny, nz);
    bk.idx.push(i0, i1, i2, i0, i2, i3); bk.ent.push(this.ent, this.ent);
  }
  face(f, x1, y1, z1, x2, y2, z2, mat) {
    switch (f) {
      case 'x+': return this.quad([x2, y1, z2], [x2, y1, z1], [x2, y2, z1], [x2, y2, z2], mat);
      case 'x-': return this.quad([x1, y1, z1], [x1, y1, z2], [x1, y2, z2], [x1, y2, z1], mat);
      case 'y+': return this.quad([x1, y2, z2], [x2, y2, z2], [x2, y2, z1], [x1, y2, z1], mat);
      case 'y-': return this.quad([x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2], mat);
      case 'z+': return this.quad([x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2], mat);
      case 'z-': return this.quad([x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1], mat);
    }
  }
  box(x1, y1, z1, x2, y2, z2, mat) {
    for (const f of ['x+', 'x-', 'y+', 'y-', 'z+', 'z-']) this.face(f, x1, y1, z1, x2, y2, z2, mat);
  }
  // scatola centrata in x,z con base a y0
  bx(cx, y0, cz, w, h, d, mat) { this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, mat); }
  // scatola ruotata attorno all'asse verticale
  rbx(cx, y0, cz, w, h, d, ry, mat) { this.at(cx, y0, cz, ry); this.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, mat); this.pop(); }
  // trave fra due punti 3D
  beam(a, b, w, h, mat) {
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = dir.length(); if (L < 1e-4) return;
    dir.normalize();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const m = new THREE.Matrix4().makeBasis(dir, up, side); m.setPosition(a[0], a[1], a[2]);
    this.push(m); this.box(0, -h / 2, -w / 2, L, h / 2, w / 2, mat); this.pop();
  }
  cyl(cx, y0, cz, r, h, mat, seg = 10, r2 = r) {
    const y1 = y0 + h, P = (a, rad, y) => [cx + rad * Math.cos(a), y, cz + rad * Math.sin(a)];
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      this.quad(P(a1, r, y0), P(a0, r, y0), P(a0, r2, y1), P(a1, r2, y1), mat);
      if (r2 > 0.001) this.tri([cx, y1, cz], P(a1, r2, y1), P(a0, r2, y1), mat);
      this.tri([cx, y0, cz], P(a0, r, y0), P(a1, r, y0), mat);
    }
  }
  ball(cx, cy, cz, rx, ry, rz, mat) {
    if (!ICO) ICO = new THREE.IcosahedronGeometry(1, 1).attributes.position.array;
    for (let i = 0; i < ICO.length; i += 9) {
      const p = k => [cx + ICO[i + k] * rx, cy + ICO[i + k + 1] * ry, cz + ICO[i + k + 2] * rz];
      this.tri(p(0), p(3), p(6), mat);
    }
  }
  // prisma verticale da un poligono in pianta [[x,z],...]
  prism(poly, y0, y1, mat, top = true, bot = true) {
    let A = 0; const n = poly.length;
    for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
    for (let i = 0; i < n; i++) {
      const p = A > 0 ? poly[(i + 1) % n] : poly[i], q = A > 0 ? poly[i] : poly[(i + 1) % n];
      this.quad([p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], mat);
    }
    const tris = THREE.ShapeUtils.triangulateShape(poly.map(p => new THREE.Vector2(p[0], p[1])), []);
    for (const t of tris) {
      let a = poly[t[0]], b = poly[t[1]], c = poly[t[2]];
      const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (cr > 0) { const s = b; b = c; c = s; }           // ora normale +y
      if (top) this.tri([a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], mat);
      if (bot) this.tri([a[0], y0, a[1]], [c[0], y0, c[1]], [b[0], y0, b[1]], mat);
    }
  }
  // crea le mesh: una per materiale/flag. Le UV sono in metri (proiezione sul piano dominante).
  build(matFn, batch, ents) {
    const out = [];
    for (const b of this.bk.values()) {
      if (!b.idx.length) continue;
      const nv = b.pos.length / 3, pos = new Float32Array(b.pos), nor = new Float32Array(b.nor), uv = new Float32Array(nv * 2);
      for (let i = 0; i < nv; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        const ax = Math.abs(nor[i * 3]), ay = Math.abs(nor[i * 3 + 1]), az = Math.abs(nor[i * 3 + 2]);
        if (ay >= ax && ay >= az) { uv[i * 2] = x; uv[i * 2 + 1] = z; }
        else if (ax >= az) { uv[i * 2] = z; uv[i * 2 + 1] = y; }
        else { uv[i * 2] = x; uv[i * 2 + 1] = y; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(b.idx) : new Uint16Array(b.idx), 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, matFn(b.mat));
      mesh.userData = { ent: Uint16Array.from(b.ent), flags: b.flags, mat: b.mat, batch, ents };
      mesh.matrixAutoUpdate = false;
      if (mesh.material.transparent) mesh.renderOrder = 5;
      out.push(mesh);
    }
    return out;
  }
}
