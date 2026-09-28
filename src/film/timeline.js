// The film is one continuous timeline measured in "story time" (roughly: screens).
// All choreography is written in story time; PACE below decides how much scroll each part gets.
export const TOTAL = 29.3

export const SCENES = [
  { id: 'mystery', n: '01', name: 'Mystery', start: 0, end: 2.4, jump: 0 },
  { id: 'reveal', n: '02', name: 'The Reveal', start: 2.4, end: 5.0, jump: 3.35 },
  { id: 'inside', n: '03', name: 'Inside Fort', start: 5.0, end: 8.6, jump: 6.75 },
  { id: 'lift', n: '04', name: 'You Lift', start: 8.6, end: 13.6, jump: 9.3 },
  { id: 'intel', n: '05', name: 'Strength Intelligence', start: 13.6, end: 17.2, jump: 14.35 },
  { id: 'beyond', n: '06', name: 'Beyond the Workout', start: 17.2, end: 22.6, jump: 17.75 },
  { id: 'endure', n: '07', name: 'Seven Days', start: 22.6, end: 26.0, jump: 22.9 },
  { id: 'fort', n: '08', name: 'Fort', start: 26.0, end: TOTAL, jump: 28.75 },
]

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
export const lerp = (a, b, t) => a + (b - a) * t
export const range = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)))
export const smooth = (x) => x * x * (3 - 2 * x)
export const w = (t, a, b) => smooth(range(t, a, b))

/*
  PACE — slow-motion zones. [storyStart, storyEnd, factor]: that stretch of the film gets
  `factor`× more scroll distance, so it plays slower under the same scroll. Edges blend
  smoothly (no sudden change of speed). Raise a factor to slow a moment further.
*/
export const PACE = [
  [7.15, 7.95, 1.6], // 03 · device turns over to show the sensors
  [8.55, 9.45, 1.5], // 03 → 04 · reassembles and moves to the wrist
  [9.95, 12.05, 1.3], // 04 · the reps
  [13.35, 14.35, 1.5], // 04 → 05 · moves aside as the body forms
  [15.25, 15.65, 1.6], // 05 · body turns to show the back
  [16.2, 16.6, 1.6], // 05 · body turns back
  [16.9, 17.9, 1.8], // 05 → 06 · returns to centre, dawn breaks
  [17.9, 22.5, 1.7], // 06 · a full day: light to dark
  [22.5, 26.0, 2.0], // 07 · the week
  [26.0, 27.1, 1.7], // 07 → 08 · moves into the studio
]
const PACE_RAMP = 0.25
const PACE_STEP = 0.004
const paceAt = (s) => {
  let k = 1
  for (const [a, b, f] of PACE) {
    const box = smooth(range(s, a - PACE_RAMP, a + PACE_RAMP)) * (1 - smooth(range(s, b - PACE_RAMP, b + PACE_RAMP)))
    k += (f - 1) * box
  }
  return k
}
// scrollOf[i] = scroll distance (screens) needed to reach story time i * PACE_STEP
const N_PACE = Math.ceil(TOTAL / PACE_STEP) + 1
const scrollOf = new Float32Array(N_PACE)
for (let i = 1; i < N_PACE; i++) scrollOf[i] = scrollOf[i - 1] + PACE_STEP * paceAt((i - 0.5) * PACE_STEP)

// total scroll length of the film, in screens
export const SCROLL_TOTAL = scrollOf[N_PACE - 1]

// story time → scroll position (screens)
export function unwarp(story) {
  const f = clamp(story / PACE_STEP, 0, N_PACE - 1)
  const i = Math.min(Math.floor(f), N_PACE - 2)
  return scrollOf[i] + (scrollOf[i + 1] - scrollOf[i]) * (f - i)
}

// scroll position (screens) → story time
export function warp(scroll) {
  if (scroll <= 0) return 0
  if (scroll >= SCROLL_TOTAL) return TOTAL
  let lo = 0
  let hi = N_PACE - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (scrollOf[mid] < scroll) lo = mid
    else hi = mid
  }
  const x = (scroll - scrollOf[lo]) / (scrollOf[hi] - scrollOf[lo] || 1)
  return (lo + x) * PACE_STEP
}

export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
}

// Constant speed through the middle, gently eased at both ends (e = share of the range used by each ramp).
// Peak speed is only 1/(1-e) of the average, so nothing suddenly rushes when scrolling fast.
export function cruise(x, e = 0.15) {
  const v = 1 / (1 - e)
  if (x <= 0) return 0
  if (x >= 1) return 1
  if (x < e) return (v / (2 * e)) * x * x
  if (x > 1 - e) {
    const y = 1 - x
    return 1 - (v / (2 * e)) * y * y
  }
  return v * (x - e / 2)
}

// Keyframes: [[t0, v0], [t1, v1, easeFn?], ...]
export function kf(t, frames, e = ease.inOut) {
  if (t <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i++) {
    const f = frames[i]
    if (t <= f[0]) {
      const p = frames[i - 1]
      const x = (t - p[0]) / (f[0] - p[0] || 1)
      return p[1] + (f[1] - p[1]) * (f[2] || e)(x)
    }
  }
  return frames[frames.length - 1][1]
}

// Vector keyframes: [[t, [x, y, z]], ...] → writes into a THREE.Vector3
export function kfv(t, frames, out, e = ease.inOut) {
  if (t <= frames[0][0]) return out.fromArray(frames[0][1])
  for (let i = 1; i < frames.length; i++) {
    const f = frames[i]
    if (t <= f[0]) {
      const p = frames[i - 1]
      const x = (f[2] || e)((t - p[0]) / (f[0] - p[0] || 1))
      return out.set(
        p[1][0] + (f[1][0] - p[1][0]) * x,
        p[1][1] + (f[1][1] - p[1][1]) * x,
        p[1][2] + (f[1][2] - p[1][2]) * x,
      )
    }
  }
  return out.fromArray(frames[frames.length - 1][1])
}

// Envelope for anything that fades in then out: [inStart, inEnd, outStart, outEnd]
export const envAt = (t, at) => (t < at[1] ? smooth(range(t, at[0], at[1])) : 1 - smooth(range(t, at[2], at[3])))

export const sceneIndexAt = (t) => {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].start - 0.0001) return i
  return 0
}
