import * as THREE from 'three'

/*
  One branch of the strap, from the module end (s0) to the bottom of the wrist loop.
  k = 0 → strap lies straight (released)   k = 1 → wrapped around a superellipse "wrist".
  Wrapping propagates outward from the module, like a band closing around a wrist.
  The other branch is the same geometry mirrored in y.
*/
export class StrapGeometry extends THREE.BufferGeometry {
  constructor({
    width = 0.8,
    thick = 0.085,
    corner = 0.034,
    s0 = 0.78,
    A = 1.22,
    B = 0.92,
    n = 2.7,
    topZ = -0.12,
    segs = 110,
    cs = 22,
  } = {}) {
    super()
    Object.assign(this, { width, thick, corner, s0, topZ, segs, cs })

    // superellipse, top-center → +y side → bottom-center, resampled by arc length
    const raw = []
    const zc = topZ - B
    const RN = 800
    for (let i = 0; i <= RN; i++) {
      const phi = Math.PI / 2 - (Math.PI * i) / RN
      const c = Math.cos(phi)
      const s = Math.sin(phi)
      raw.push([A * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), zc + B * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)])
    }
    const cum = [0]
    for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]))
    this.half = cum[cum.length - 1]
    const M = 600
    this.loop = new Float32Array((M + 1) * 2)
    let j = 0
    for (let i = 0; i <= M; i++) {
      const s = (this.half * i) / M
      while (j < cum.length - 2 && cum[j + 1] < s) j++
      const f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1)
      this.loop[i * 2] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f
      this.loop[i * 2 + 1] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f
    }
    this.M = M

    // rounded-rectangle cross-section (u across width, v across thickness) with normals
    const hw = width / 2
    const ht = thick / 2
    const r = Math.min(corner, ht)
    const sec = []
    const per = Math.max(2, Math.floor(cs / 4))
    const corners = [
      [hw - r, ht - r, 0],
      [-hw + r, ht - r, Math.PI / 2],
      [-hw + r, -ht + r, Math.PI],
      [hw - r, -ht + r, Math.PI * 1.5],
    ]
    for (const [cx, cy, a0] of corners) {
      for (let i = 0; i <= per; i++) {
        const a = a0 + (Math.PI / 2) * (i / per)
        sec.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)])
      }
    }
    this.sec = sec
    const ring = sec.length
    this.ring = ring

    const vCount = (segs + 1) * ring + 2
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vCount * 3), 3))
    this.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(vCount * 3), 3))
    const uv = new Float32Array(vCount * 2)
    for (let jj = 0; jj <= segs; jj++) for (let i = 0; i < ring; i++) {
      uv[(jj * ring + i) * 2] = i / ring
      uv[(jj * ring + i) * 2 + 1] = jj / segs
    }
    this.setAttribute('uv', new THREE.BufferAttribute(uv, 2))

    const idx = []
    for (let jj = 0; jj < segs; jj++) {
      for (let i = 0; i < ring; i++) {
        const a = jj * ring + i
        const b = (jj + 1) * ring + i
        const c = (jj + 1) * ring + ((i + 1) % ring)
        const d = jj * ring + ((i + 1) % ring)
        idx.push(a, d, b, b, d, c)
      }
    }
    // end caps
    const cA = (segs + 1) * ring
    const cB = cA + 1
    for (let i = 0; i < ring; i++) {
      idx.push(cA, (i + 1) % ring, i)
      idx.push(cB, segs * ring + i, segs * ring + ((i + 1) % ring))
    }
    this.setIndex(idx)
    this.center3 = new Float32Array((segs + 1) * 3)
    this._k = -1
    this.update(1)
    this.fixWinding()
  }

  loopAt(s, out) {
    const f = Math.min(Math.max(s / this.half, 0), 1) * this.M
    const i = Math.min(Math.floor(f), this.M - 1)
    const x = f - i
    out[0] = this.loop[i * 2] + (this.loop[i * 2 + 2] - this.loop[i * 2]) * x
    out[1] = this.loop[i * 2 + 1] + (this.loop[i * 2 + 3] - this.loop[i * 2 + 1]) * x
  }

  update(k) {
    if (Math.abs(k - this._k) < 1e-4) return
    this._k = k
    const { segs, s0, half, topZ, ring, sec } = this
    const C = this.center3
    const lp = [0, 0]
    for (let j = 0; j <= segs; j++) {
      const s = s0 + ((half - s0) * j) / segs
      const fr = (s - s0) / (half - s0)
      let kk = Math.min(Math.max(k * 1.7 - fr * 0.7, 0), 1)
      kk = kk * kk * (3 - 2 * kk)
      this.loopAt(s, lp)
      const sy = s
      const sz = topZ - 0.05 * (s - s0) * (s - s0)
      C[j * 3] = 0
      C[j * 3 + 1] = sy + (lp[0] - sy) * kk
      C[j * 3 + 2] = sz + (lp[1] - sz) * kk
    }
    const pos = this.attributes.position.array
    const nor = this.attributes.normal.array
    for (let j = 0; j <= segs; j++) {
      const jp = Math.min(j + 1, segs)
      const jm = Math.max(j - 1, 0)
      let ty = C[jp * 3 + 1] - C[jm * 3 + 1]
      let tz = C[jp * 3 + 2] - C[jm * 3 + 2]
      const l = Math.hypot(ty, tz) || 1
      ty /= l
      tz /= l
      // outward normal N = X × T
      const ny = -tz
      const nz = ty
      const cy = C[j * 3 + 1]
      const cz = C[j * 3 + 2]
      for (let i = 0; i < ring; i++) {
        const [u, v, nu, nv] = sec[i]
        const o = (j * ring + i) * 3
        pos[o] = u
        pos[o + 1] = cy + v * ny
        pos[o + 2] = cz + v * nz
        nor[o] = nu
        nor[o + 1] = nv * ny
        nor[o + 2] = nv * nz
      }
    }
    // caps
    const cA = (segs + 1) * ring * 3
    pos[cA] = 0
    pos[cA + 1] = C[1]
    pos[cA + 2] = C[2]
    const t0y = C[4] - C[1]
    const t0z = C[5] - C[2]
    const l0 = Math.hypot(t0y, t0z) || 1
    nor[cA] = 0
    nor[cA + 1] = -t0y / l0
    nor[cA + 2] = -t0z / l0
    const e = segs * 3
    pos[cA + 3] = 0
    pos[cA + 4] = C[e + 1]
    pos[cA + 5] = C[e + 2]
    const t1y = C[e + 1] - C[e - 2]
    const t1z = C[e + 2] - C[e - 1]
    const l1 = Math.hypot(t1y, t1z) || 1
    nor[cA + 3] = 0
    nor[cA + 4] = t1y / l1
    nor[cA + 5] = t1z / l1
    this.attributes.position.needsUpdate = true
    this.attributes.normal.needsUpdate = true
    this.computeBoundingSphere()
  }

  // make sure triangle winding agrees with our analytic outward normals
  fixWinding() {
    const p = this.attributes.position.array
    const n = this.attributes.normal.array
    const I = this.index.array
    const a = I[0] * 3
    const b = I[1] * 3
    const c = I[2] * 3
    const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]]
    const e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]]
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const d = cr[0] * n[a] + cr[1] * n[a + 1] + cr[2] * n[a + 2]
    if (d < 0) {
      for (let i = 0; i < I.length; i += 3) {
        const tmp = I[i + 1]
        I[i + 1] = I[i + 2]
        I[i + 2] = tmp
      }
      this.index.needsUpdate = true
    }
  }
}
