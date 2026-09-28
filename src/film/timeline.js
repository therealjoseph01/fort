// The film is one continuous timeline measured in "screens": 1 unit = 100vh of scroll.
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
