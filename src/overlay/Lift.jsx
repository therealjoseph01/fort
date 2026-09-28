import { useRef } from 'react'
import * as THREE from 'three'
import { Beat, Ln, Tag, useFrameDom } from './primitives'
import { LIFT, liftAt } from '../film/choreo'
import { envAt, range, ease } from '../film/timeline'

/*
  Scene 04 — You lift. Fort understands.
  The data lives in the space around the lift: rep numerals behind the device,
  velocities at the top of each arc, rest and failure as rings around it,
  and the set's story in a column of labels whose leaders point back at the motion.
*/

const pad = (n) => String(n).padStart(2, '0')
const tmp = new THREE.Vector3()

// a point on the path of rep i at phase u (0 → start, 0.42 → top)
const onRep = (i, u) => (out) => {
  liftAt(LIFT.starts[i] + LIFT.durs[i] * u, tmp)
  out.copy(tmp)
}

// Huge outlined numerals, behind the canvas
export function LiftBackdrop() {
  const rep = useRef()
  const repNum = useRef()
  const vol = useRef()
  const volNum = useRef()
  const last = useRef({ rep: -1, vol: '' })
  useFrameDom((S, t) => {
    const o = envAt(t, [LIFT.apexT[0] - 0.06, LIFT.apexT[0] + 0.02, 12.05, 12.3])
    rep.current.style.opacity = o.toFixed(3)
    rep.current.style.visibility = o > 0.002 ? 'visible' : 'hidden'
    if (S.repCount !== last.current.rep && S.repCount > 0) {
      last.current.rep = S.repCount
      repNum.current.textContent = pad(S.repCount)
      repNum.current.classList.remove('tick')
      void repNum.current.offsetWidth
      repNum.current.classList.add('tick')
    }
    const vo = envAt(t, [12.7, 12.9, 13.3, 13.55])
    vol.current.style.opacity = vo.toFixed(3)
    vol.current.style.visibility = vo > 0.002 ? 'visible' : 'hidden'
    if (vo > 0.002) {
      const v = Math.round(ease.out(range(t, 12.72, 13.15)) * 9840)
      const s = v.toLocaleString('en-US')
      if (s !== last.current.vol) {
        last.current.vol = s
        volNum.current.textContent = s
      }
    }
  })
  return (
    <>
      <div className="numeral rep" ref={rep}>
        <span className="numeral-k">Rep</span>
        <span className="numeral-n" ref={repNum}>
          01
        </span>
      </div>
      <div className="numeral vol" ref={vol}>
        <span className="numeral-k">Training volume · this session</span>
        <span className="numeral-n">
          <span ref={volNum}>0</span>
          <small>lb</small>
        </span>
      </div>
    </>
  )
}

export function Lift() {
  return (
    <>
      <Beat at={[8.85, 9.15, 9.72, 9.95]} className="full a-left you-lift">
        <h2 className="display">
          <Ln>You lift.</Ln>
        </h2>
      </Beat>
      <Beat at={[9.12, 9.42, 9.72, 9.95]} className="full a-right you-lift">
        <h2 className="display">
          <Ln>Fort understands.</Ln>
        </h2>
      </Beat>
      <Beat at={[9.95, 10.15, 12.45, 12.65]} className="full a-top-left">
        <div className="hud">
          <span className="eyebrow">04 — Automatic strength tracking</span>
          <span className="hud-sub">No tapping. No logging. The athlete simply lifts — Fort detects the exercise, counts every rep, and times the rest.</span>
        </div>
      </Beat>

      <Tag
        at={[10.05, 10.25, 11.95, 12.15]}
        anchor={(o, S) => o.copy(S.rigPos).add({ x: 0.42, y: 0.42, z: 0 })}
        side={['right', 'left']}
        dx={[60, -70]}
        dy={[-50, -70]}
        eyebrow="Exercise detected"
        title="Dumbbell curl"
      />

      {/* velocity readout beside the top of the arc, one line per rep */}
      <Tag
        at={[LIFT.apexT[0] - 0.02, LIFT.apexT[0] + 0.05, 12.1, 12.35]}
        anchor={(o) => o.copy(LIFT.apex[0])}
        leader={false}
        side="left"
        dx={[-140, -70]}
        dy={[-66, -60]}
        eyebrow="Rep velocity"
        className="tag-vel"
      />
      {LIFT.vel.slice(0, 3).map((v, i) => (
        <Tag
          key={i}
          at={[LIFT.apexT[i] - 0.02, LIFT.apexT[i] + 0.05, 12.1, 12.35]}
          anchor={(o) => o.copy(LIFT.apex[0])}
          leader={false}
          side="left"
          dx={[-140, -70]}
          dy={[-44 + i * 20, -40 + i * 18]}
          className="tag-vel first"
        >
          <span className="rep-i">{pad(i + 1)}</span>
          <span className="vel">{v.toFixed(2)}</span>
          <span className="unit">m/s</span>
        </Tag>
      ))}

      {/* set complete — rest */}
      <Tag
        at={[12.05, 12.22, 13.25, 13.5]}
        anchor={(o) => o.copy(LIFT.restPos).add({ x: 0, y: 1.02 * LIFT.ring, z: 0 })}
        leader={false}
        dx={[-70, -70]}
        dy={[-56, -50]}
        className="tag-center wide"
        eyebrow="Set 01 of 04"
        title="8 reps · 25 lb"
      />
      <Tag
        at={[12.15, 12.3, 13.25, 13.5]}
        anchor={(o) => o.copy(LIFT.restPos).add({ x: -0.86 * LIFT.ring, y: 0, z: 0 })}
        leader={false}
        side="left"
        dx={[-18, -10]}
        dy={[-30, -26]}
        eyebrow="Rest"
        live={(S) => {
          const s = Math.round(102 * S.rest)
          return `${Math.floor(s / 60)}:${pad(s % 60)}`
        }}
      />

      {/* the set, understood */}
      <Tag at={[12.55, 12.72, 13.25, 13.5]} anchor={(o) => o.copy(LIFT.apex[7])} col={[0.66, 0.06]} row={[0.3, 0.64]} leader={[true, false]} eyebrow="Rep velocity" title="0.72 → 0.48 m/s">
        Down 33% from the first rep to the last.
      </Tag>
      <Tag at={[12.62, 12.8, 13.25, 13.5]} anchor={onRep(2, 0.24)} col={[0.66, 0.54]} row={[0.45, 0.64]} leader={[true, false]} eyebrow="Rep cadence" title="1.1 s up · 1.9 s down" />
      <Tag at={[12.7, 12.88, 13.25, 13.5]} anchor={onRep(0, 0.14)} col={[0.66, 0.06]} row={[0.58, 0.76]} leader={[true, false]} eyebrow="Time under tension" title="34 s" />
      <Tag at={[12.84, 13.0, 13.25, 13.5]} anchor={(o) => o.copy(LIFT.restPos).add({ x: 0.72 * LIFT.ring, y: -0.72 * LIFT.ring, z: 0 })} col={[0.66, 0.54]} row={[0.72, 0.76]} leader={[true, false]} eyebrow="Proximity to failure" title="≈ 2 reps in reserve" />
    </>
  )
}
