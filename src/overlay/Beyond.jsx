import { useMemo, useRef, useState, useEffect } from 'react'
import { Beat, Ln, Tag, useFrameDom } from './primitives'
import { envAt, range, smooth } from '../film/timeline'

/*
  Scenes 06–07 — Beyond the workout / Seven days.
  A single 24-hour line runs behind the wearable: heart rate by day, sleep stages by night.
  Time is the scroll. Signals surface as "now" passes them.
*/

const H0 = 6.2
const H1 = 30.6
const SLEEP_START = 23.2
const STAGES = [
  ['L', 0.25], ['D', 0.7], ['L', 0.35], ['R', 0.25], ['L', 0.45], ['D', 0.55], ['L', 0.4], ['R', 0.45], ['L', 0.5],
  ['D', 0.3], ['L', 0.45], ['R', 0.55], ['L', 0.4], ['A', 0.06], ['L', 0.3], ['R', 0.5], ['L', 0.74],
]
const SLEEP_END = SLEEP_START + STAGES.reduce((a, s) => a + s[1], 0)
const STAGE_Y = { A: 150, R: 172, L: 192, D: 214 }

const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s))
const plateau = (h, a, b, s) => smooth(range(h, a - s, a + s)) * (1 - smooth(range(h, b - s, b + s)))

function bpmAt(h) {
  let b = 54 + 9 * smooth(range(h, 6.8, 8.2)) - 6 * smooth(range(h, 20.5, 23))
  b += 30 * gauss(h, 8.45, 0.2)
  b += 18 * gauss(h, 12.6, 0.18)
  b += 26 * gauss(h, 15.2, 0.05)
  b += 80 * plateau(h, 17.95, 18.47, 0.07)
  b += 3 * Math.sin(h * 9.1) + 2 * Math.sin(h * 23.7) + 1.4 * Math.sin(h * 61.3)
  return b
}
function stageAt(h) {
  let x = SLEEP_START
  for (const [s, d] of STAGES) {
    if (h < x + d) return s
    x += d
  }
  return 'A'
}
function yAt(h) {
  const hr = 168 - (bpmAt(h) - 50) * 1.25
  if (h < SLEEP_START - 0.25) return hr
  // stepped hypnogram with softened risers
  let st = STAGE_Y[stageAt(h)]
  const prev = STAGE_Y[stageAt(h - 0.035)]
  st = prev + (st - prev) * 0.5
  const k = smooth(range(h, SLEEP_START - 0.25, SLEEP_START + 0.05)) * (1 - smooth(range(h, SLEEP_END - 0.05, SLEEP_END + 0.2)))
  return hr + (st - hr) * k
}

const NOTES = [
  { h: 7.0, k: 'Resting heart rate', v: '54 bpm' },
  { h: 8.45, k: 'Morning walk', v: 'Detected automatically · 22 min' },
  { h: 10.6, k: 'Temperature', v: 'Steady — within your baseline' },
  { h: 12.6, k: 'Daily movement', v: '52 active minutes' },
  { h: 15.2, k: 'Stress', v: 'Spike at 3:12 pm · settled in 18 min' },
  { h: 18.2, k: 'Evening run', v: 'Zone 2 · 31 min · VO₂ max est. 44' },
  { h: 21.0, k: 'Recovery', v: 'Ready to train tomorrow' },
  { h: 23.25, k: 'Asleep', v: '11:15 pm', down: true },
  { h: 27.4, k: 'Overnight HRV', v: '61 ms', down: true },
  { h: 30.3, k: 'Sleep', v: '7 h 12 m · deep, light & REM' },
]

const fmtTime = (h) => {
  const hm = ((h % 24) + 24) % 24
  let hh = Math.floor(hm)
  const mm = Math.floor((hm - hh) * 60)
  const ap = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return [`${hh}:${String(mm).padStart(2, '0')}`, ap]
}
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function usePxPerHour() {
  const get = () => (window.innerWidth < 760 ? window.innerWidth / 2.4 : window.innerWidth / 4.4)
  const [pph, set] = useState(get)
  useEffect(() => {
    const on = () => set(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return pph
}

export function DayLine() {
  const pph = usePxPerHour()
  const root = useRef()
  const track = useRef()
  const clip = useRef()
  const dot = useRef()
  const legend = useRef()
  const notes = useRef([])

  const { d, W } = useMemo(() => {
    const W = (H1 - H0) * pph
    let d = ''
    const step = 1 / 90
    for (let h = H0; h <= H1 + 1e-6; h += step) {
      d += `${d ? 'L' : 'M'}${((h - H0) * pph).toFixed(1)} ${yAt(h).toFixed(1)}`
    }
    return { d, W }
  }, [pph])

  useFrameDom((S, t, ctx) => {
    const o = envAt(t, [17.8, 18.15, 22.45, 22.8])
    const e = root.current
    e.style.opacity = o.toFixed(3)
    e.style.visibility = o > 0.002 ? 'visible' : 'hidden'
    if (o <= 0.002) return
    const h = Math.min(Math.max(S.hour, H0), H1)
    const x = (h - H0) * pph
    track.current.style.transform = `translate3d(${(ctx.vw / 2 - x).toFixed(1)}px, 0, 0)`
    clip.current.setAttribute('width', Math.max(0, x).toFixed(1))
    dot.current.style.transform = `translate3d(${(ctx.vw / 2).toFixed(1)}px, ${yAt(h).toFixed(1)}px, 0)`
    const sleepK = smooth(range(h, SLEEP_START - 0.2, SLEEP_START + 0.2)) * (1 - smooth(range(h, SLEEP_END, SLEEP_END + 0.3)))
    legend.current.style.opacity = sleepK.toFixed(3)
    NOTES.forEach((n, i) => {
      const el = notes.current[i]
      if (!el) return
      const dd = h - n.h
      const no = smooth(range(dd, -0.3, 0.08)) * (1 - smooth(range(dd, 2.4, 3.3)))
      el.style.opacity = no.toFixed(3)
    })
  })

  return (
    <div className="dayline" ref={root}>
      <div className="dayline-track" ref={track} style={{ width: W }}>
        <svg width={W} height="240" viewBox={`0 0 ${W} 240`} className="dayline-svg">
          <defs>
            <clipPath id="past">
              <rect ref={clip} x="0" y="0" width="0" height="240" />
            </clipPath>
          </defs>
          <path d={d} className="future" />
          <path d={d} className="past" clipPath="url(#past)" />
          {[9, 12, 15, 18, 21, 24, 27, 30].map((hh) => (
            <g key={hh} transform={`translate(${((hh - H0) * pph).toFixed(1)} 0)`}>
              <line y1="228" y2="236" className="hour-tick" />
              <text y="226" className="hour-label" textAnchor="middle">
                {fmtTime(hh).join(' ').replace(':00', '')}
              </text>
            </g>
          ))}
        </svg>
        {NOTES.map((n, i) => (
          <div
            key={i}
            className={`day-note ${n.down ? 'down' : ''}`}
            ref={(el) => (notes.current[i] = el)}
            style={{ left: (n.h - H0) * pph, top: yAt(n.h) }}
          >
            <span className="tag-k">{n.k}</span>
            <span className="day-v">{n.v}</span>
          </div>
        ))}
      </div>
      <div className="dayline-now" />
      <div className="dayline-dot" ref={dot} />
      <div className="dayline-legend" ref={legend}>
        {['Awake', 'REM', 'Light', 'Deep'].map((s) => (
          <span key={s} style={{ top: STAGE_Y[s[0]] }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Clock() {
  const root = useRef()
  const time = useRef()
  const ap = useRef()
  const day = useRef()
  const last = useRef('')
  useFrameDom((S, t) => {
    const o = envAt(t, [18.1, 18.35, 24.55, 24.9])
    const e = root.current
    e.style.opacity = o.toFixed(3)
    e.style.visibility = o > 0.002 ? 'visible' : 'hidden'
    if (o <= 0.002) return
    const [tm, a] = fmtTime(S.hour)
    const inWeek = t > 22.62
    const dayIdx = Math.min(7, Math.max(1, S.day))
    const key = inWeek ? `D${dayIdx}` : `${tm}${a}`
    if (key === last.current) return
    last.current = key
    if (inWeek) {
      time.current.textContent = `Day ${dayIdx}`
      ap.current.textContent = ''
      day.current.textContent = `${DAYS[(dayIdx - 1) % 7]} · ${tm} ${a}`
    } else {
      time.current.textContent = tm
      ap.current.textContent = a
      day.current.textContent = S.hour >= 24 ? 'Tuesday' : 'Monday'
    }
  })
  return (
    <div className="clock" ref={root}>
      <div className="clock-t">
        <span ref={time}>6:12</span>
        <small ref={ap}>AM</small>
      </div>
      <div className="clock-d eyebrow" ref={day}>
        Monday
      </div>
    </div>
  )
}

export function Beyond() {
  return (
    <>
      <Beat at={[17.35, 17.65, 17.95, 18.15]} className="full a-top-left m-bottom">
        <div className="block">
          <div className="eyebrow">06 — Beyond the workout</div>
          <h2 className="headline">
            <Ln>It stays</Ln>
            <Ln i={1}>with you.</Ln>
          </h2>
          <p className="lede">Built to move with you from workouts to recovery to sleep, so your training is read in the context of the rest of your life.</p>
        </div>
      </Beat>
      <Tag
        at={[22.65, 22.9, 24.9, 25.2]}
        anchor={(o, S) => o.copy(S.rigPos).add({ x: 0, y: -1.43 * S.rigScale, z: 0 })}
        leader={false}
        dx={[-50, -50]}
        dy={[16, 12]}
        className="tag-center"
        eyebrow="Battery"
        live={(S) => `${Math.round((S.batt + (1 - S.batt) * S.charge) * 100)}%`}
      />
      <Beat at={[22.75, 23.0, 23.7, 23.95]} className="full a-right">
        <div className="block right-col">
          <div className="eyebrow">07 — Seven days</div>
          <p className="lede">Lifts, grip, sweat, and sleep. Built to stay on through all of it — then refined enough to wear through the rest of your day.</p>
        </div>
      </Beat>
      <Beat at={[23.95, 24.25, 24.95, 25.2]} className="full a-right">
        <div className="block right-col">
          <h2 className="headline">
            <Ln>7+ days.</Ln>
            <Ln i={1}>One charge.</Ln>
          </h2>
          <p className="lede">No screen to light up. No notifications to answer. Fort tracks what matters without asking for your attention all day.</p>
        </div>
      </Beat>
    </>
  )
}
