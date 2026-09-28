import * as THREE from 'three'

/*
  A stylised human figure sampled as a point cloud, built from ellipsoids and tapered capsules.
  Group ids: -1 base · 0 chest · 1 back · 2 shoulders · 3 biceps · 4 triceps · 5 core
             6 quads · 7 hamstrings · 8 glutes · 9 calves
  Units ≈ 3.6 tall, facing +z, centred on the origin.
*/

const base = []
const muscle = []
const E = (c, r, g = -1) => ({ type: 'e', c, r, g })
const Cap = (p0, p1, r0, r1, g = -1) => ({ type: 'c', p0, p1, r0, r1, g })
const both = (fn) => [fn(1), fn(-1)]

base.push(
  E([0, 1.58, 0.01], [0.16, 0.2, 0.18]),
  Cap([0, 1.26, 0], [0, 1.4, 0.01], 0.085, 0.075),
  E([0, 0.98, 0], [0.4, 0.34, 0.21]),
  E([0, 0.5, 0.0], [0.31, 0.33, 0.17]),
  E([0, 0.1, 0], [0.33, 0.19, 0.18]),
  ...both((s) => Cap([0.47 * s, 1.14, 0], [0.58 * s, 0.56, 0.02], 0.1, 0.075)),
  ...both((s) => Cap([0.58 * s, 0.56, 0.02], [0.64 * s, 0.03, 0.1], 0.074, 0.05)),
  ...both((s) => E([0.66 * s, -0.12, 0.11], [0.045, 0.095, 0.06])),
  ...both((s) => Cap([0.17 * s, 0.02, 0], [0.2 * s, -0.82, 0.02], 0.155, 0.095)),
  ...both((s) => Cap([0.2 * s, -0.82, 0.02], [0.21 * s, -1.62, -0.01], 0.09, 0.055)),
  ...both((s) => E([0.22 * s, -1.72, 0.06], [0.06, 0.04, 0.13])),
)

muscle.push(
  ...both((s) => E([0.17 * s, 1.02, 0.16], [0.17, 0.12, 0.075], 0)),
  ...both((s) => E([0.2 * s, 0.84, -0.14], [0.17, 0.26, 0.08], 1)),
  E([0, 1.2, -0.1], [0.23, 0.1, 0.07], 1),
  ...both((s) => E([0.47 * s, 1.15, 0], [0.125, 0.125, 0.125], 2)),
  ...both((s) => E([0.535 * s, 0.84, 0.07], [0.065, 0.16, 0.06], 3)),
  ...both((s) => E([0.535 * s, 0.84, -0.07], [0.065, 0.17, 0.06], 4)),
  E([0, 0.52, 0.15], [0.14, 0.26, 0.05], 5),
  ...both((s) => E([0.22 * s, 0.46, 0.08], [0.07, 0.2, 0.08], 5)),
  ...both((s) => E([0.19 * s, -0.38, 0.08], [0.12, 0.3, 0.09], 6)),
  ...both((s) => E([0.19 * s, -0.4, -0.08], [0.11, 0.28, 0.08], 7)),
  ...both((s) => E([0.14 * s, 0.02, -0.14], [0.14, 0.14, 0.09], 8)),
  ...both((s) => E([0.21 * s, -1.08, -0.06], [0.07, 0.2, 0.07], 9)),
)

const area = (p) => {
  if (p.type === 'e') {
    const [a, b, c] = p.r
    const q = 1.6
    return 4 * Math.PI * Math.pow((Math.pow(a * b, q) + Math.pow(a * c, q) + Math.pow(b * c, q)) / 3, 1 / q)
  }
  const len = Math.hypot(p.p1[0] - p.p0[0], p.p1[1] - p.p0[1], p.p1[2] - p.p0[2])
  return 2 * Math.PI * ((p.r0 + p.r1) / 2) * len
}

function sampleInto(prims, count, rnd, out, groups, offset) {
  const areas = prims.map(area)
  const total = areas.reduce((a, b) => a + b, 0)
  let k = offset
  const tmp = new THREE.Vector3()
  const ax = new THREE.Vector3()
  const u = new THREE.Vector3()
  const v = new THREE.Vector3()
  prims.forEach((p, pi) => {
    const n = pi === prims.length - 1 ? offset + count - k : Math.round((areas[pi] / total) * count)
    for (let i = 0; i < n && k < offset + count; i++, k++) {
      if (p.type === 'e') {
        // gaussian direction → uniform on sphere, then scale
        let x, y, z, l
        do {
          x = rnd() * 2 - 1
          y = rnd() * 2 - 1
          z = rnd() * 2 - 1
          l = x * x + y * y + z * z
        } while (l > 1 || l < 1e-4)
        l = Math.sqrt(l)
        tmp.set((x / l) * p.r[0] + p.c[0], (y / l) * p.r[1] + p.c[1], (z / l) * p.r[2] + p.c[2])
      } else {
        const t = rnd()
        ax.set(p.p1[0] - p.p0[0], p.p1[1] - p.p0[1], p.p1[2] - p.p0[2])
        const len = ax.length()
        ax.normalize()
        u.set(1, 0, 0)
        if (Math.abs(ax.x) > 0.9) u.set(0, 0, 1)
        v.crossVectors(ax, u).normalize()
        u.crossVectors(v, ax).normalize()
        const a = rnd() * Math.PI * 2
        const r = p.r0 + (p.r1 - p.r0) * t
        tmp.set(p.p0[0], p.p0[1], p.p0[2])
          .addScaledVector(ax, t * len)
          .addScaledVector(u, Math.cos(a) * r)
          .addScaledVector(v, Math.sin(a) * r)
      }
      out[k * 3] = tmp.x
      out[k * 3 + 1] = tmp.y
      out[k * 3 + 2] = tmp.z
      groups[k] = p.g
    }
  })
}

export function buildBody(N, rnd) {
  const pos = new Float32Array(N * 3)
  const group = new Float32Array(N)
  const nBase = Math.floor(N * 0.6)
  sampleInto(base, nBase, rnd, pos, group, 0)
  sampleInto(muscle, N - nBase, rnd, pos, group, nBase)
  return { pos, group }
}

// label anchor points (body space) — one side of each muscle group
export const MUSCLE_ANCHOR = {
  0: [-0.24, 1.04, 0.22],
  1: [-0.3, 0.86, -0.2],
  2: [-0.56, 1.2, 0.04],
  3: [-0.6, 0.84, 0.1],
  4: [-0.6, 0.84, -0.1],
  5: [-0.1, 0.46, 0.19],
  6: [-0.26, -0.38, 0.14],
  7: [-0.27, -0.42, -0.14],
  8: [-0.2, 0.02, -0.21],
  9: [-0.26, -1.08, -0.1],
}
