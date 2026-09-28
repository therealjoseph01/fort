import * as THREE from 'three'
import { kf, kfv, range, clamp, lerp, smooth, w, ease, envAt, cruise } from './timeline'

/*
  THE DIRECTOR'S SCRIPT
  ---------------------
  Every visual value in the film is a pure function of `t` (scroll position in screens).
  computeState(t) writes into `S`; the 3D scene and the DOM overlay only ever read `S`.

  01 Mystery      0.0 – 2.4   darkness, a light sweep travels across the device
  02 Reveal       2.4 – 5.0   full light, device turns toward camera, headline around it
  03 Inside       5.0 – 8.6   camera pushes in, strap releases, exploded view, flip to sensors
  04 Lift         8.6 – 13.6  reassemble, strap wraps a wrist, 8 reps, set/rest/metrics
  05 Intelligence 13.6 – 17.2 lift trail becomes a body; muscle groups illuminate
  06 Beyond       17.2 – 22.6 dawn → day → dusk → night → sleep; health signals on a 24h line
  07 Seven Days   22.6 – 26.0 six more days pass, calmly, on one charge
  08 Fort         26.0 – 29.3 studio light, manifesto, finish configurator, reserve
*/

const DEG = Math.PI / 180
const col = (h) => new THREE.Color(h)
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

export const layout = { mobile: false, aspect: 1.6 }

export const S = {
  cam: V3(0, 0, 10),
  target: V3(),
  rigPos: V3(),
  rigRotZ: 0,
  rigScale: 1,
  rotX: 0,
  rotY: 0,
  explode: 0,
  strapK: 1,
  strapA: 1,
  L: {
    sweepAng: -2.7,
    sweep: 0,
    key: 0,
    fill: 0,
    rim: 0.3,
    top: 0,
    kick: 0,
    front: 0,
    room: 0,
    roomBase: 0,
    amb: 0,
    dir: 0,
    keyColor: col('#fff3e6'),
    fillColor: col('#dde5ee'),
    rimColor: col('#ffffff'),
  },
  led: 0,
  imu: 0,
  ble: 0,
  stackLine: 0,
  trail: 0,
  trailA: 0,
  rep: -1,
  repCount: 0,
  pM1: 0,
  pM2: 0,
  pOpacity: 0,
  pStar: 0,
  bodyRot: 0.3,
  bodyCenter: V3(),
  act: new Float32Array(10),
  rest: 0,
  restA: 0,
  fail: 0,
  failA: 0,
  batt: 1,
  battA: 0,
  charge: 0,
  dust: 0,
  bgTop: col('#010101'),
  bgBot: col('#040404'),
  ink: col('#efe9e1'),
  inkLight: 1,
  accent: col('#d4553d'),
  glowA: 0,
  glowX: 0.5,
  glowY: 0.47,
  glowR: 0.55,
  glowColor: col('#5b3524'),
  hour: 6.2,
  day: 1,
  night: 0,
  px: 0,
  py: 0,
}

/* ------------------------------------------------------------------ */
/* Scene 04 — the lift                                                  */
/* ------------------------------------------------------------------ */
export const LIFT = {
  T0: 9.95,
  durs: [0.4, 0.4, 0.4, 0.18, 0.18, 0.18, 0.18, 0.18],
  tops: [100, 101.5, 103, 104.5, 106, 108, 110, 112],
  vel: [0.72, 0.7, 0.67, 0.64, 0.61, 0.57, 0.53, 0.48],
  starts: [],
  apexT: [],
  apex: [],
  END: 0,
  elbow: V3(),
  R: 2.25,
  th0: 168 * DEG,
  restPos: V3(),
  samples: null,
  N: 900,
  ring: 1,
}

const R_of = (t) => LIFT.R + 0.035 * Math.sin(t * 7.3) + 0.02 * Math.sin(t * 13.1)
const dz_of = (t) => 0.11 * Math.sin(t * 5.3 + 0.4)

export function liftAt(t, out) {
  const L = LIFT
  let rep = -1
  let a = 0
  let top = L.tops[0]
  if (t >= L.T0 && t < L.END) {
    for (let i = 0; i < L.durs.length; i++) {
      if (t < L.starts[i] + L.durs[i]) {
        rep = i
        const u = (t - L.starts[i]) / L.durs[i]
        a = u < 0.42 ? ease.inOut(u / 0.42) : 1 - ease.inOut((u - 0.42) / 0.58)
        top = L.tops[i]
        break
      }
    }
  } else if (t >= L.END) rep = L.durs.length
  const th = lerp(L.th0, top * DEG, a)
  const tc = clamp(t, L.T0, L.END)
  const R = R_of(tc)
  out.set(L.elbow.x + R * Math.cos(th), L.elbow.y + R * Math.sin(th), dz_of(tc))
  return { rep, a, th }
}

function buildLift() {
  const m = layout.mobile
  const L = LIFT
  L.elbow.set(m ? 0.55 : 1.15, m ? -1.6 : -1.55, 0)
  L.R = m ? 1.5 : 2.55
  L.th0 = (m ? 174 : 170) * DEG
  // range of motion shrinks slightly as the set approaches failure
  L.tops = m ? [100, 102, 104, 107, 110, 113, 117, 121] : [95, 97, 99, 102, 105, 109, 113, 118]
  let s = L.T0
  L.starts = L.durs.map((d) => {
    const v = s
    s += d
    return v
  })
  L.END = s
  L.apexT = L.starts.map((st, i) => st + L.durs[i] * 0.42)
  L.apex = L.apexT.map((ta) => {
    const v = V3()
    liftAt(ta, v)
    return v
  })
  liftAt(L.END + 1, L.restPos)
  const arr = new Float32Array(L.N * 3)
  const v = V3()
  for (let i = 0; i < L.N; i++) {
    liftAt(lerp(L.T0, L.END - 1e-4, i / (L.N - 1)), v)
    arr[i * 3] = v.x
    arr[i * 3 + 1] = v.y
    arr[i * 3 + 2] = v.z
  }
  L.samples = arr
}

/* ------------------------------------------------------------------ */
/* Scene 05 — muscles                                                   */
/* ------------------------------------------------------------------ */
export const MUSCLES = [
  { g: 0, name: 'Chest', sets: 14, t: 14.5, dy: [-4, 6] },
  { g: 2, name: 'Shoulders', sets: 10, t: 14.72, dy: [-78, -80] },
  { g: 3, name: 'Biceps', sets: 9, t: 14.94 },
  { g: 5, name: 'Core', sets: 8, t: 15.16 },
  { g: 1, name: 'Back', sets: 16, t: 15.62 },
  { g: 8, name: 'Glutes', sets: 12, t: 15.84 },
  { g: 7, name: 'Hamstrings', sets: 8, t: 16.06 },
  { g: 6, name: 'Quads', sets: 12, t: 16.55 },
]

export const BODY = { center: V3() }

// Scene 07 — Day 2 → Day 7: each step holds for H, then transitions over P − H (story time)
export const WEEK = { T0: 22.78, P: 0.5, H: 0.2, steps: 5 }

/* ------------------------------------------------------------------ */
/* Scene 06/07 — sky & time of day                                      */
/* ------------------------------------------------------------------ */
const SKY = [
  [0, '#04060c', '#0a0f1c'],
  [4.8, '#05070e', '#0d1322'],
  [5.9, '#1b2136', '#5d4c5c'],
  [6.6, '#7d8aa0', '#d9bfa6'],
  [7.6, '#c3ccd7', '#ece2d5'],
  [10, '#dde2e6', '#f3eee7'],
  [14, '#e8eaea', '#f5f1eb'],
  [17, '#e2d5c7', '#efcfaf'],
  [18.6, '#6a5a72', '#e2946a'],
  [19.5, '#2a2b47', '#80535e'],
  [20.6, '#0c1224', '#1d2137'],
  [24, '#04060c', '#0a0f1c'],
].map(([h, a, b]) => [h, col(a), col(b)])

export function skyAt(h, top, bot) {
  const hm = ((h % 24) + 24) % 24
  for (let i = 1; i < SKY.length; i++) {
    if (hm <= SKY[i][0]) {
      const p = SKY[i - 1]
      const n = SKY[i]
      const x = smooth((hm - p[0]) / (n[0] - p[0]))
      top.copy(p[1]).lerp(n[1], x)
      bot.copy(p[2]).lerp(n[2], x)
      return
    }
  }
}

export const nightAt = (h) => {
  const hm = ((h % 24) + 24) % 24
  return hm >= 12 ? smooth(range(hm, 19.6, 21)) : 1 - smooth(range(hm, 4.9, 6.3))
}
const gauss = (x, m, s) => Math.exp(-((x - m) * (x - m)) / (2 * s * s))

/* ------------------------------------------------------------------ */
/* Palette                                                              */
/* ------------------------------------------------------------------ */
const P = {
  d1t: col('#010101'), d1b: col('#040404'),
  d2t: col('#060606'), d2b: col('#0e0c0b'),
  d3t: col('#030303'), d3b: col('#090707'),
  d4t: col('#060606'), d4b: col('#0c0b0a'),
  d5t: col('#070405'), d5b: col('#130708'),
  studioT: col('#f4f1ec'), studioB: col('#e5dfd5'),
  neutralT: col('#1d2030'), neutralB: col('#322b36'),
  inkDark: col('#17130f'), inkLight: col('#efe9e1'),
  oxblood: col('#5a1418'), ember: col('#d4553d'),
  white: col('#ffffff'), warmWhite: col('#fff3e6'), moon: col('#8ea2d6'), amber: col('#ffae72'),
  glowWarm: col('#5b3524'), glowEmber: col('#7a2418'), glowSun: col('#fff1dc'), glowMoon: col('#4b5c8c'), glowStudio: col('#ffffff'),
  skyFill: col('#dfe8f2'),
}
const tA = col('#000')
const tB = col('#000')
const tmp = V3()
const tmp2 = V3()

/* ------------------------------------------------------------------ */
/* Camera & framing                                                      */
/* ------------------------------------------------------------------ */
const CAM = [
  [0, [0, 0, 10.5]],
  [2.4, [0, 0, 9.2]],
  [3.4, [0, 0, 7.4]],
  [4.4, [0.2, 0.1, 7.7]],
  [5.0, [0, 0.2, 7.4]],
  [5.9, [1.2, 1.4, 6.9]],
  [7.2, [1.7, 1.0, 6.7]],
  [8.2, [1.3, 1.2, 7.0]],
  [9.1, [0, -0.2, 9.6]],
  [13.4, [0, -0.2, 9.7]],
  [14.3, [0, 0.1, 9.8]],
  [17.0, [0, 0.1, 9.9]],
  [17.9, [0, 0.2, 9.0]],
  [26.0, [0, 0.2, 9.0]],
  [27.0, [0, 0.1, 8.6]],
]
const TGT = [
  [0, [0, 0, 0]],
  [5.0, [0, 0, 0]],
  [5.9, [0.1, 0.25, 0]],
  [8.2, [0.1, 0.25, 0]],
  [9.1, [0, -0.3, 0]],
  [13.4, [0, -0.3, 0]],
  [14.3, [0, 0, 0]],
]
const CAM_M = [
  [0, [0, 0, 13.5]],
  [2.4, [0, 0, 12.5]],
  [3.4, [0, 0, 10.6]],
  [4.4, [0, 0.1, 11]],
  [5.0, [0, 0.2, 10.4]],
  [5.9, [0.5, 2.0, 13.2]],
  [7.2, [0.8, 1.5, 12.9]],
  [8.2, [0.5, 1.7, 13.2]],
  [9.1, [-0.3, -0.6, 12.4]],
  [13.4, [-0.3, -0.6, 12.4]],
  [14.3, [0, 0.1, 12.6]],
  [17.0, [0, 0.1, 12.6]],
  [17.9, [0, 0.2, 12.4]],
  [26.0, [0, 0.2, 12.4]],
  [27.0, [0, 0.1, 12.2]],
]
const TGT_M = [
  [0, [0, 0, 0]],
  [5.0, [0, 0, 0]],
  [5.9, [0, -0.55, 0]],
  [8.2, [0, -0.55, 0]],
  [9.1, [-0.3, -0.85, 0]],
  [13.4, [-0.3, -0.85, 0]],
  [14.3, [0, 0, 0]],
]

const ROTY = [
  [0, -1.25],
  [2.4, -0.38],
  [3.4, -0.1],
  [4.4, 0.55],
  [5.0, 0.35],
  [5.9, 0.55],
  [7.2, 0.7],
  [7.7, 0.55],
  [8.2, 0.5],
  [9.3, -0.75],
]
const ROTX = [
  [0, 0.08],
  [2.4, 0.08],
  [4.4, 0.05],
  [5.0, -0.35],
  [5.9, -1.0],
  [7.2, -1.0],
  [7.75, 2.14],
  [8.2, 2.14],
  [9.3, 0.18],
]

export function ensureLayout(width, height) {
  const mobile = width / height < 0.85
  layout.aspect = width / height
  if (mobile !== layout.mobile || !LIFT.samples) {
    layout.mobile = mobile
    buildLift()
    BODY.center.set(mobile ? 0 : -0.75, mobile ? -0.6 : -0.05, mobile ? -1.2 : -0.6)
    LIFT.ring = mobile ? 0.78 : 1
  }
}

if (typeof window !== 'undefined') ensureLayout(window.innerWidth, window.innerHeight)

/* ------------------------------------------------------------------ */
export function computeState(t, time) {
  const m = layout.mobile
  const L = S.L

  /* ---------- camera ---------- */
  kfv(t, m ? CAM_M : CAM, S.cam)
  kfv(t, m ? TGT_M : TGT, S.target)
  // pointer parallax, gentle
  const par = 1 - 0.6 * envAt(t, [5.2, 5.9, 8.2, 8.9])
  S.cam.x += S.px * 0.28 * par
  S.cam.y += S.py * 0.16 * par

  /* ---------- device rig ---------- */
  const lift = liftAt(t, tmp)
  S.rep = lift.rep
  S.rigPos.set(0, 0, 0)
  // float during the reveal
  S.rigPos.y += 0.04 * Math.sin(time * 0.8) * w(t, 2.3, 3.0) * (1 - w(t, 5.0, 5.6))
  S.rigPos.lerp(tmp, w(t, 8.6, 9.4))
  const p5 = tmp2.set(m ? 0.85 : 2.25, m ? -2.25 : -1.15, m ? 1.0 : 1.2)
  S.rigPos.lerp(p5, w(t, 13.4, 14.3))
  S.rigPos.lerp(tmp.set(0, m ? 1.0 : 0.62, 0), w(t, 16.9, 18.0))
  S.rigPos.lerp(tmp.set(m ? 0 : -1.05, m ? 0.75 : 0.3, 0), w(t, 22.5, 23.25))
  S.rigPos.lerp(tmp.set(m ? 0 : -1.35, m ? 1.2 : 0.05, 0), w(t, 26.0, 27.0))
  // idle float everywhere after the lift
  S.rigPos.y += 0.03 * Math.sin(time * 0.7) * w(t, 17.2, 17.9)

  S.rigRotZ = (lift.th - LIFT.th0) * w(t, 8.6, 9.4)

  S.rigScale = kf(t, [
    [0, 1],
    [8.6, 1],
    [9.3, m ? 0.55 : 0.62],
    [13.4, m ? 0.55 : 0.62],
    [14.3, m ? 0.42 : 0.5],
    [16.9, m ? 0.42 : 0.5],
    [18.0, m ? 0.58 : 0.7],
    [22.5, m ? 0.58 : 0.7],
    [23.25, m ? 0.62 : 0.85],
    [26.0, m ? 0.62 : 0.85],
    [27.0, m ? 0.78 : 1.05],
  ])

  let ry = kf(t, ROTY)
  // Scene 05: a slow sway (no full spins), so handing over to Scene 06 never whips around
  ry = lerp(ry, -0.5 + 0.45 * Math.sin((t - 13.6) * 1.1), w(t, 13.4, 14.3))
  // through the day and the week the device turns slowly and steadily
  const weekTurn = -0.42 + 0.32 * Math.sin((Math.min(t, 22.6) - 17.2) * 1.15) + 0.35 * cruise(range(t, 22.6, 26.0))
  ry = lerp(ry, weekTurn + 0.04 * Math.sin(time * 0.5), w(t, 16.9, 18.0))
  ry = lerp(ry, -0.62 + 0.1 * Math.sin(time * 0.35), w(t, 26.0, 27.0))
  S.rotY = ry
  let rx = kf(t, ROTX)
  rx = lerp(rx, 0.15, w(t, 13.4, 14.3))
  rx = lerp(rx, 0.12, w(t, 16.9, 18.0))
  S.rotX = rx

  S.explode = kf(t, [
    [5.55, 0],
    [6.35, 1],
    [8.05, 1],
    [8.75, 0],
  ])
  S.strapA = kf(t, [
    [5.05, 1],
    [5.5, 0],
    [8.65, 0],
    [9.1, 1],
  ])
  S.strapK = kf(t, [
    [5.05, 1],
    [5.5, 0.6],
    [8.65, 0.45],
    [9.45, 1],
  ])

  S.imu = envAt(t, [6.45, 6.65, 7.1, 7.25])
  S.ble = envAt(t, [6.6, 6.8, 7.1, 7.25])
  S.led = envAt(t, [7.45, 7.7, 8.25, 8.5])
  S.stackLine = envAt(t, [5.8, 6.2, 7.2, 7.4]) + envAt(t, [7.7, 7.9, 7.95, 8.2])
  S.dust = envAt(t, [0.05, 0.4, 2.0, 2.7])

  /* ---------- lift data ---------- */
  S.trail = range(t, LIFT.T0, LIFT.END)
  S.trailA = envAt(t, [9.9, 9.96, 13.25, 13.6])
  let rc = 0
  for (let i = 0; i < LIFT.apexT.length; i++) if (t >= LIFT.apexT[i]) rc = i + 1
  S.repCount = rc
  S.rest = range(t, 12.15, 12.85)
  S.restA = envAt(t, [12.05, 12.2, 13.25, 13.5])
  S.fail = 0.8 * ease.out(range(t, 12.8, 13.15))
  S.failA = envAt(t, [12.72, 12.88, 13.25, 13.5])

  /* ---------- particles & body ---------- */
  S.pM1 = w(t, 13.45, 14.45)
  S.pM2 = w(t, 16.95, 17.95)
  S.pOpacity = w(t, 9.95, 10.1)
  S.bodyRot =
    kf(t, [
      [13.6, 0.3],
      [15.3, 0.3],
      [15.6, Math.PI - 0.3],
      [16.25, Math.PI - 0.3],
      [16.55, Math.PI * 2 + 0.3],
    ]) +
    0.05 * Math.sin(time * 0.4)
  S.bodyCenter.copy(BODY.center)
  S.act.fill(0)
  for (const mu of MUSCLES) {
    const peak = w(t, mu.t, mu.t + 0.1)
    S.act[mu.g] = peak * (1 - 0.65 * w(t, mu.t + 0.26, mu.t + 0.4))
  }
  const allLit = w(t, 16.72, 16.92)
  const out = w(t, 17.0, 17.45)
  for (let i = 0; i < 10; i++) S.act[i] = lerp(S.act[i], 0.9, allLit) * (1 - out)

  /* ---------- time of day ---------- */
  // Scene 06: one day. Dawn and dusk get the most time so light never snaps to dark.
  let hour = kf(
    t,
    [
      [17.9, 6.2],
      [18.55, 8.4],
      [19.15, 13.0],
      [19.8, 17.2],
      [20.85, 20.4], // sunset → dusk, slowly
      [21.55, 24.0],
      [22.5, 30.6],
    ],
    ease.linear,
  )
  S.hour = hour
  S.night = nightAt(hour)

  // Scene 07: the week. No day/night cycling — the sky holds a calm evening tone while each
  // day rests for a moment, then eases into the next (one step ≈ one screen of scroll).
  const calm = w(t, 22.4, 22.85) * (1 - w(t, 26.0, 26.6))
  let wd = 2
  let pulse = 0 // a soft "new morning" breath during each day change
  for (let k = 0; k < WEEK.steps; k++) {
    const a = WEEK.T0 + k * WEEK.P + WEEK.H
    const b = WEEK.T0 + (k + 1) * WEEK.P
    const x = range(t, a, b)
    wd += smooth(x)
    pulse += Math.sin(Math.PI * x)
  }
  S.dayF = t > 22.6 ? wd : 1 + clamp((hour - 6.2) / 24)
  S.day = t > 22.6 ? Math.floor(wd + 0.5) : Math.floor((hour - 6.2) / 24) + 1
  S.pStar = lerp(S.night, 0.6, calm) * w(t, 17.4, 18.0) * (1 - w(t, 26.0, 26.5))

  /* ---------- battery ---------- */
  S.battA = envAt(t, [22.55, 22.8, 25.95, 26.3])
  S.batt = 1 - 0.91 * ((wd - 2) / WEEK.steps)
  S.charge = w(t, 25.55, 25.95)

  /* ---------- lighting ---------- */
  L.sweepAng = kf(t, [[0, -2.7], [2.4, 1.3, ease.linear]])
  L.sweep = kf(t, [
    [0, 0],
    [0.3, 2.4],
    [2.1, 2.4],
    [2.9, 0],
  ])
  let key = kf(t, [[0, 0], [2.0, 0], [3.0, 1.5], [5.0, 1.5], [5.9, 0.85], [8.6, 0.85], [9.3, 1.25], [13.4, 1.25], [14.3, 0.7], [17.0, 0.7]])
  let fill = kf(t, [[0, 0], [2.1, 0], [3.0, 0.45], [5.0, 0.45], [5.9, 0.2], [8.6, 0.2], [9.3, 0.4], [13.4, 0.4], [14.3, 0.25], [17, 0.25]])
  let rim = kf(t, [[0, 0.3], [2.2, 0.6], [3.0, 1.0], [5.9, 1.5], [8.6, 1.5], [9.3, 1.0], [13.4, 1.0], [14.3, 1.2], [17, 1.2]])
  let kick = kf(t, [[0, 0], [2.6, 0], [3.2, 0.6], [5.0, 0.6], [5.9, 0.9], [8.6, 0.9], [9.3, 0.5]])
  let top = kf(t, [[5.0, 0], [5.9, 0.55], [8.3, 0.55], [9.2, 0]])
  let front = kf(t, [[0, 0], [2.4, 0], [3.2, 0.35], [5.0, 0.35], [5.9, 0.22], [8.6, 0.22], [9.3, 0.35], [13.4, 0.35], [14.3, 0.25], [17, 0.25]])
  let roomBase = kf(t, [[0, 0], [2.2, 0], [3.0, 0.035], [5.0, 0.035], [5.9, 0.03], [8.6, 0.03], [9.3, 0.045], [13.4, 0.045], [14.3, 0.03], [17, 0.03]])
  let room = 0
  const emberMix = kf(t, [[5.4, 0], [6.1, 1], [8.3, 1], [9.2, 0.35], [13.4, 0.35], [14.3, 0.85], [17, 0.85], [17.9, 0]])
  L.keyColor.copy(P.warmWhite)
  L.fillColor.copy(P.skyFill)
  L.rimColor.copy(P.white).lerp(P.ember, emberMix)

  // time-of-day light
  const w6 = w(t, 17.1, 17.9)
  if (w6 > 0) {
    const hm = ((hour % 24) + 24) % 24
    let dayF = smooth(range(hm, 5.8, 7.2)) * (1 - smooth(range(hm, 18.6, 20.2)))
    let sunset = Math.min(1, gauss(hm, 18.9, 0.8) + 0.6 * gauss(hm, 6.3, 0.5))
    dayF = lerp(dayF, 0.3, calm)
    sunset *= 1 - calm
    tA.copy(P.moon).lerp(P.warmWhite, dayF).lerp(P.amber, sunset * 0.85)
    L.keyColor.lerp(tA, w6)
    key = lerp(key, 0.5 + 1.15 * dayF + 0.2 * sunset, w6)
    fill = lerp(fill, 0.12 + 0.7 * dayF, w6)
    rim = lerp(rim, 0.6 + 0.6 * sunset + 0.3 * (1 - dayF), w6)
    tB.copy(P.moon).lerp(P.amber, sunset)
    L.rimColor.lerp(tB, w6 * 0.6)
    kick = lerp(kick, 0.2, w6)
    front = lerp(front, 0.15 + 0.35 * dayF, w6)
    room = lerp(room, 0.85, w6)
    roomBase = lerp(roomBase, 0.03 + 0.05 * (1 - dayF), w6)
  }
  const w8 = w(t, 26.0, 26.9)
  key = lerp(key, 1.3, w8)
  fill = lerp(fill, 0.8, w8)
  rim = lerp(rim, 0.9, w8)
  top = lerp(top, 1.0, w8)
  kick = lerp(kick, 0.3, w8)
  front = lerp(front, 0.25, w8)
  room = lerp(room, 0.9, w8)
  roomBase = lerp(roomBase, 0, w8)
  L.keyColor.lerp(P.warmWhite, w8)
  L.rimColor.lerp(P.white, w8)
  L.key = key
  L.fill = fill
  L.rim = rim
  L.top = top
  L.kick = kick
  L.front = front
  L.room = room
  L.roomBase = roomBase
  L.dir = key * 1.1 + 0.05
  L.amb = 0.03 + fill * 0.25 + w8 * 0.25

  /* ---------- background ---------- */
  S.bgTop.copy(P.d1t)
  S.bgBot.copy(P.d1b)
  let x = w(t, 2.2, 3.0)
  S.bgTop.lerp(P.d2t, x); S.bgBot.lerp(P.d2b, x)
  x = w(t, 5.2, 6.0)
  S.bgTop.lerp(P.d3t, x); S.bgBot.lerp(P.d3b, x)
  x = w(t, 8.6, 9.4)
  S.bgTop.lerp(P.d4t, x); S.bgBot.lerp(P.d4b, x)
  x = w(t, 13.6, 14.4)
  S.bgTop.lerp(P.d5t, x); S.bgBot.lerp(P.d5b, x)
  if (w6 > 0) {
    skyAt(hour, tA, tB)
    const skyCalm = calm * (1 - 0.12 * pulse)
    tA.lerp(P.neutralT, skyCalm); tB.lerp(P.neutralB, skyCalm)
    S.bgTop.lerp(tA, w6); S.bgBot.lerp(tB, w6)
  }
  S.bgTop.lerp(P.studioT, w8); S.bgBot.lerp(P.studioB, w8)

  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
  const lm = 0.4 * lum(S.bgTop) + 0.6 * lum(S.bgBot)
  // text stays light through the week so it never flickers between light and dark
  S.inkLight = lerp(1 - smooth(range(lm, 0.14, 0.32)), 1, calm)
  S.ink.copy(P.inkDark).lerp(P.inkLight, S.inkLight)
  S.accent.copy(P.oxblood).lerp(P.ember, S.inkLight)

  /* ---------- glow ---------- */
  let ga = kf(t, [[0, 0], [2.2, 0], [3.2, 0.55], [5.0, 0.4], [5.9, 0.5], [8.6, 0.4], [9.4, 0.25], [13.4, 0.3], [14.3, 0.45], [17.0, 0.3]])
  S.glowColor.copy(P.glowWarm).lerp(P.glowEmber, emberMix)
  S.glowX = kf(t, [[0, 0.5], [8.6, 0.5], [9.4, m ? 0.5 : 0.58], [13.4, m ? 0.5 : 0.58], [14.3, m ? 0.5 : 0.42]])
  S.glowY = kf(t, [[0, 0.47], [8.6, 0.47], [9.4, m ? 0.62 : 0.52], [13.4, m ? 0.62 : 0.52], [14.3, m ? 0.42 : 0.5]])
  S.glowR = 0.55
  if (w6 > 0) {
    const hm = ((hour % 24) + 24) % 24
    const df = clamp((hm - 5.8) / (19.8 - 5.8))
    const up = Math.sin(Math.PI * df)
    const nf = S.night
    // during the week the glow settles behind the device instead of racing across the sky
    const sx = lerp(lerp(0.12 + 0.76 * df, 0.78, nf), m ? 0.5 : 0.36, calm)
    const sy = lerp(lerp(0.8 - 0.58 * up, 0.2, nf), m ? 0.36 : 0.46, calm)
    tA.copy(P.glowSun).lerp(P.amber, Math.min(1, gauss(hm, 18.9, 0.7) + 0.5 * gauss(hm, 6.4, 0.5))).lerp(P.glowMoon, nf)
    tA.lerp(P.glowMoon, calm)
    S.glowColor.lerp(tA, w6)
    S.glowX = lerp(S.glowX, sx, w6)
    S.glowY = lerp(S.glowY, sy, w6)
    ga = lerp(ga, lerp(lerp(0.55 + 0.25 * (1 - up), 0.3, nf), 0.34 + 0.12 * pulse, calm), w6)
    S.glowR = lerp(S.glowR, 0.45, w6)
  }
  S.glowColor.lerp(P.glowStudio, w8)
  S.glowX = lerp(S.glowX, m ? 0.5 : 0.36, w8)
  S.glowY = lerp(S.glowY, m ? 0.3 : 0.47, w8)
  S.glowR = lerp(S.glowR, 0.5, w8)
  S.glowA = lerp(ga, 0.75, w8)
}
