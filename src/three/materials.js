import * as THREE from 'three'

// Procedural brushed-steel grain (no image assets needed).
export function brushedTexture() {
  const W = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = W
  const g = c.getContext('2d')
  g.fillStyle = 'rgb(132,132,132)'
  g.fillRect(0, 0, W, W)
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 5200; i++) {
    const y = rnd() * W
    const v = Math.floor(96 + rnd() * 72)
    g.fillStyle = `rgba(${v},${v},${v},${0.05 + rnd() * 0.14})`
    g.fillRect(0, y, W, 0.4 + rnd() * 1.1)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1.4, 1.4)
  t.center.set(0.5, 0.5)
  t.rotation = Math.PI / 2
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 8
  return t
}

export function glowTexture() {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, S, S)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export const FINISH_LOOK = {
  silver: { color: '#cdcdca', metalness: 1, roughness: 0.52 },
  black: { color: '#2a2a2d', metalness: 0.88, roughness: 0.6 },
  gold: { color: '#dcbd8a', metalness: 1, roughness: 0.5 },
}

export const STRAP_LOOK = {
  charcoal: '#2c2c2f',
  cream: '#e4dccd',
  blue: '#b3c3d3',
}

export function roundedRect(w, h, r) {
  const s = new THREE.Shape()
  const x = w / 2
  const y = h / 2
  s.moveTo(-x + r, -y)
  s.lineTo(x - r, -y)
  s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x, y - r)
  s.absarc(x - r, y - r, r, 0, Math.PI / 2, false)
  s.lineTo(-x + r, y)
  s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(-x, -y + r)
  s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

export function slab(w, h, r, depth, bevel = 0.01, segs = 4, curve = 32) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segs,
    curveSegments: curve,
  })
  g.translate(0, 0, -depth / 2)
  g.computeVertexNormals()
  return g
}
