import { Beat, Ln, Tag } from './primitives'
import { anchors } from '../three/anchors'
import { MUSCLES } from '../film/choreo'
import { MUSCLE_ANCHOR } from '../three/bodyPoints'

const fromAnchor = (name) => (out) => {
  const o = anchors[name]
  if (!o) return false
  o.getWorldPosition(out)
}

const bodyPoint = (g) => {
  const p = MUSCLE_ANCHOR[g]
  return (out, S) => {
    const c = Math.cos(S.bodyRot)
    const s = Math.sin(S.bodyRot)
    out.set(c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]).add(S.bodyCenter)
  }
}

/* ---------------------------------- 01 · Mystery ---------------------------------- */
export function Mystery() {
  return (
    <>
      <Beat at={[-1, -1, 0.04, 0.3]} className="full a-bottom">
        <div className="cue">
          <span className="eyebrow">Scroll to reveal</span>
          <i />
        </div>
      </Beat>
      <Beat at={[0.22, 0.5, 0.74, 0.95]} className="full a-bottom whisper">
        <p>Most wearables were built for cardio.</p>
      </Beat>
      <Beat at={[0.95, 1.2, 1.44, 1.65]} className="full a-bottom whisper">
        <p>Steps. Sleep scores. Notifications.</p>
      </Beat>
      <Beat at={[1.65, 1.9, 2.12, 2.36]} className="full a-bottom whisper">
        <p>Not for the work you do under the bar.</p>
      </Beat>
    </>
  )
}

/* ---------------------------------- 02 · Reveal ---------------------------------- */
export function Reveal() {
  return (
    <>
      <Beat at={[2.5, 3.05, 3.9, 4.2]} className="full a-center">
        <h1 className="display split">
          <span className="l">
            <Ln>The Strength</Ln>
          </span>
          <span className="gap" aria-hidden="true" />
          <span className="r">
            <Ln i={1}>Wearable.</Ln>
          </span>
        </h1>
      </Beat>
      <Beat at={[2.95, 3.3, 3.9, 4.2]} className="full a-bottom">
        <p className="lede center">Tracks sleep, recovery, and every workout — including strength training.</p>
      </Beat>
      <Beat at={[4.18, 4.45, 4.75, 5.0]} className="full a-bottom-left">
        <p className="note">
          Stainless steel.
          <br />
          No screen. No notifications.
        </p>
      </Beat>
      <Beat at={[4.28, 4.55, 4.75, 5.0]} className="full a-top-right">
        <p className="quote">
          <Ln>Like jewelry,</Ln>
          <Ln i={1}>not performance gear.</Ln>
        </p>
      </Beat>
    </>
  )
}

/* ---------------------------------- 03 · Inside ---------------------------------- */
export function Inside() {
  return (
    <>
      <Beat at={[5.3, 5.75, 6.12, 6.38]} className="full a-top-left">
        <div className="block">
          <div className="eyebrow">03 — Inside Fort</div>
          <h2 className="headline">
            <Ln>Three signals.</Ln>
            <Ln i={1}>Read continuously.</Ln>
          </h2>
          <p className="lede">Motion, heart rate, and temperature work together to understand how you move, how much effort you put in, and how your body responds.</p>
        </div>
      </Beat>
      <Tag at={[6.25, 6.45, 7.05, 7.25]} anchor={fromAnchor('shell')} col={[0.65, 0.06]} row={[null, 0.7]} dy={[-34, 0]} side={['right', 'right']} leader={[true, false]} eyebrow="Body" title="Stainless steel">
        Brushed, sealed, and screen-free by design.
      </Tag>
      <Tag at={[6.38, 6.58, 7.05, 7.25]} anchor={fromAnchor('battery')} col={[0.35, 0.52]} row={[null, 0.7]} dy={[-18, 0]} side={['left', 'right']} leader={[true, false]} eyebrow="Power" title="7+ day battery">
        A week of training, sleep, and everything between.
      </Tag>
      <Tag at={[6.5, 6.7, 7.05, 7.25]} anchor={fromAnchor('imu')} col={[0.65, 0.06]} row={[null, 0.81]} dy={[-4, 0]} side={['right', 'right']} leader={[true, false]} eyebrow="Motion · IMU" title="Accelerometer + gyroscope">
        Reads the path, speed, and rhythm of every rep.
      </Tag>
      <Tag at={[6.62, 6.82, 7.05, 7.25]} anchor={fromAnchor('ble')} col={[0.35, 0.52]} row={[null, 0.81]} dy={[14, 0]} side={['left', 'right']} leader={[true, false]} eyebrow="Connectivity" title="Bluetooth Low Energy">
        Syncs quietly to the Fort app on iOS and Android.
      </Tag>
      <Beat at={[7.22, 7.4, 7.62, 7.78]} className="full a-bottom">
        <p className="eyebrow">The side that touches your skin</p>
      </Beat>
      <Tag at={[7.62, 7.82, 8.18, 8.4]} anchor={fromAnchor('ppg')} col={[0.65, 0.06]} row={[null, 0.74]} dy={[-30, 0]} side={['right', 'right']} leader={[true, false]} eyebrow="Heart rate · PPG" title="Optical heart rate sensor">
        Effort during the lift. Recovery overnight.
      </Tag>
      <Tag at={[7.76, 7.96, 8.18, 8.4]} anchor={fromAnchor('temp')} col={[0.35, 0.52]} row={[null, 0.74]} dy={[-10, 0]} side={['left', 'right']} leader={[true, false]} eyebrow="Temperature" title="Temperature sensor">
        Follows changes in your baseline.
      </Tag>
    </>
  )
}

/* ---------------------------------- 05 · Intelligence ---------------------------------- */
export function Intelligence() {
  return (
    <>
      <Beat at={[13.85, 14.25, 15.15, 15.4]} className="full a-top-right m-lede-hide">
        <div className="block right">
          <div className="eyebrow">05 — Strength intelligence</div>
          <h2 className="headline">
            <Ln>Strength,</Ln>
            <Ln i={1}>not just strain.</Ln>
          </h2>
          <p className="lede">Many wearables can tell you how hard your body worked. Fort helps you understand what that work is building.</p>
        </div>
      </Beat>
      <Beat at={[14.4, 14.6, 16.6, 16.85]} className="full a-bottom-left">
        <div className="hud">
          <span className="eyebrow">Per-muscle volume</span>
          <span className="hud-sub">This week · 4 sessions</span>
        </div>
      </Beat>
      {MUSCLES.map((mu) => (
        <Tag
          key={mu.g}
          at={[mu.t, mu.t + 0.08, mu.t + 0.3, mu.t + 0.42]}
          anchor={bodyPoint(mu.g)}
          side="left"
          dx={[-120, -30]}
          dy={mu.dy || [-22, -40]}
          eyebrow={mu.name}
          className="tag-muscle"
        >
          <span className="big-num">{mu.sets}</span> sets
        </Tag>
      ))}
      <Beat at={[16.55, 16.8, 17.05, 17.35]} className="full a-top-right m-lede-hide">
        <div className="block right words">
          <p className="quad">
            <Ln>Strength.</Ln>
            <Ln i={1}>Control.</Ln>
            <Ln i={2}>Consistency.</Ln>
            <Ln i={3}>Capacity.</Ln>
          </p>
          <p className="lede">From the squat rack to Pilates, sculpt, and strength classes, Fort shows what each session is building — and Fort Foundations turns it into an expert-led plan.</p>
        </div>
      </Beat>
    </>
  )
}

/* ---------------------------------- 08 · Fort ---------------------------------- */
export function Worn() {
  return (
    <>
      <Beat at={[26.3, 26.65, 27.1, 27.4]} className="full a-right">
        <div className="block right-col">
          <div className="eyebrow">08 — Fort</div>
          <h2 className="headline">
            <Ln>Made to be worn,</Ln>
            <Ln i={1}>not managed.</Ln>
          </h2>
          <p className="lede">A stainless steel body. A minimal form. Designed to live with your jewelry, your watch, and your daily routine.</p>
        </div>
      </Beat>
      <Beat at={[27.3, 27.6, 28.1, 28.38]} className="full a-right">
        <div className="block right-col">
          <p className="manifesto">
            <Ln>Not another smartwatch.</Ln>
            <Ln i={1}>Not a ring you take off to train.</Ln>
            <Ln i={2}>Not a recovery score that leaves your workouts unexplained.</Ln>
          </p>
          <p className="lede">Fort is a strength wearable for real training, real life, and the progress that happens between them.</p>
        </div>
      </Beat>
    </>
  )
}
