import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../film/choreo'
import { film } from '../film/store'
import { ease, clamp } from '../film/timeline'
import { anchors } from './anchors'
import { StrapGeometry } from './StrapGeometry'
import { brushedTexture, glowTexture, slab, FINISH_LOOK, STRAP_LOOK } from './materials'

/*
  The Fort module, modelled from product photography:
  a brushed stainless rounded-rectangle shell, screen-free, on a closed silicone band.
  Internals (not visible when assembled) are revealed in Scene 03's exploded view.
*/

const EXPLODE = {
  shell: { off: 1.05, delay: 0.0 },
  battery: { off: 0.52, delay: 0.14 },
  pcb: { off: 0.05, delay: 0.22 },
  back: { off: -0.52, delay: 0.06 },
}
const stagger = (e, d) => ease.inOut(clamp((e - d) / (1 - 0.22)))

function seeded(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

export function Device() {
  const rig = useRef()
  const orient = useRef()
  const shell = useRef()
  const battery = useRef()
  const pcb = useRef()
  const back = useRef()
  const strapGroup = useRef()
  const axes = useRef()
  const ble = useRef()
  const stack = useRef()

  const res = useMemo(() => {
    const brushed = brushedTexture()
    const glow = glowTexture()
    const metal = new THREE.MeshPhysicalMaterial({
      color: FINISH_LOOK.silver.color,
      metalness: 1,
      roughness: FINISH_LOOK.silver.roughness,
      roughnessMap: brushed,
      anisotropy: 0.6,
      anisotropyRotation: Math.PI / 2,
    })
    const ceramic = new THREE.MeshPhysicalMaterial({ color: '#111113', roughness: 0.32, metalness: 0.1, clearcoat: 0.7, clearcoatRoughness: 0.18 })
    const glass = new THREE.MeshPhysicalMaterial({ color: '#07090b', roughness: 0.06, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04 })
    const pouch = new THREE.MeshPhysicalMaterial({ color: '#b4b7bb', metalness: 0.35, roughness: 0.42, clearcoat: 0.3 })
    const board = new THREE.MeshStandardMaterial({ color: '#1a2b21', roughness: 0.55, metalness: 0.2 })
    const chip = new THREE.MeshStandardMaterial({ color: '#19191b', roughness: 0.32, metalness: 0.2 })
    const shield = new THREE.MeshStandardMaterial({ color: '#b3b6ba', roughness: 0.28, metalness: 1 })
    const gold = new THREE.MeshStandardMaterial({ color: '#c9a468', roughness: 0.3, metalness: 1 })
    const passive = new THREE.MeshStandardMaterial({ color: '#3b3a38', roughness: 0.5, metalness: 0.2 })
    const strap = new THREE.MeshPhysicalMaterial({
      color: STRAP_LOOK.charcoal,
      roughness: 0.6,
      metalness: 0,
      sheen: 0.45,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color('#ffffff'),
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      transparent: false,
    })
    const ember = new THREE.MeshBasicMaterial({ color: '#ff6a4a', transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
    const emberSoft = new THREE.MeshBasicMaterial({ color: '#ffd7c4', transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
    const led = new THREE.MeshBasicMaterial({ color: '#3dff8a', toneMapped: false })
    const ledGlow = new THREE.SpriteMaterial({ map: glow, color: '#3dff8a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    const cone = new THREE.SpriteMaterial({ map: glow, color: '#39ff84', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    const line = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })

    const geo = {
      shell: slab(0.9, 1.8, 0.33, 0.2, 0.065, 10, 56),
      back: slab(0.8, 1.66, 0.28, 0.05, 0.025, 6, 48),
      dome: new THREE.SphereGeometry(0.55, 64, 16, 0, Math.PI * 2, 0, 0.42),
      battery: slab(0.66, 1.08, 0.14, 0.06, 0.012, 3, 32),
      pcb: slab(0.82, 1.6, 0.3, 0.022, 0.004, 1, 40),
      led: new THREE.CircleGeometry(0.026, 24),
      pd: new THREE.PlaneGeometry(0.05, 0.05),
      pad: new THREE.PlaneGeometry(0.075, 0.075),
      contact: new THREE.CircleGeometry(0.026, 24),
      axis: new THREE.CylinderGeometry(0.0045, 0.0045, 0.46, 8),
      tip: new THREE.ConeGeometry(0.014, 0.04, 12),
      gyro: new THREE.TorusGeometry(0.21, 0.0035, 6, 96, Math.PI * 1.55),
      ring: new THREE.TorusGeometry(1, 0.012, 6, 96),
      dash: new THREE.CylinderGeometry(0.0035, 0.0035, 0.07, 6),
    }
    const strapGeo = new StrapGeometry()

    // PCB population
    const rnd = seeded(11)
    const parts = []
    const keepOut = [
      [-0.12, 0.05, 0.16],
      [0.17, 0.38, 0.11],
      [0.14, -0.42, 0.14],
    ]
    for (let i = 0; i < 90 && parts.length < 30; i++) {
      const x = (rnd() - 0.5) * 0.62
      const y = (rnd() - 0.5) * 1.3
      if (keepOut.some(([kx, ky, kr]) => Math.hypot(x - kx, y - ky) < kr)) continue
      const rot = rnd() > 0.5 ? 0 : Math.PI / 2
      parts.push({ x, y, rot, g: rnd() > 0.7 })
    }
    return { mats: { metal, ceramic, glass, pouch, board, chip, shield, gold, passive, strap, ember, emberSoft, led, ledGlow, cone, line }, geo, strapGeo, parts }
  }, [])

  const { mats, geo, strapGeo, parts } = res
  const tgt = useMemo(() => ({ metal: new THREE.Color(), strap: new THREE.Color() }), [])

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime
    rig.current.position.copy(S.rigPos)
    rig.current.rotation.set(0, 0, S.rigRotZ)
    rig.current.scale.setScalar(S.rigScale)
    orient.current.rotation.set(S.rotX, S.rotY, 0)

    const e = S.explode
    shell.current.position.z = EXPLODE.shell.off * stagger(e, EXPLODE.shell.delay)
    shell.current.rotation.z = 0.05 * stagger(e, 0)
    battery.current.position.z = 0.06 + EXPLODE.battery.off * stagger(e, EXPLODE.battery.delay)
    battery.current.rotation.z = -0.035 * stagger(e, 0.1)
    pcb.current.position.z = -0.07 + EXPLODE.pcb.off * stagger(e, EXPLODE.pcb.delay)
    back.current.position.z = -0.2 + EXPLODE.back.off * stagger(e, EXPLODE.back.delay)
    back.current.rotation.z = 0.03 * stagger(e, 0.05)
    battery.current.visible = pcb.current.visible = e > 0.002

    // strap
    strapGeo.update(S.strapK)
    const sa = S.strapA
    strapGroup.current.visible = sa > 0.01
    const wantT = sa < 0.995
    if (mats.strap.transparent !== wantT) {
      mats.strap.transparent = wantT
      mats.strap.needsUpdate = true
    }
    mats.strap.opacity = sa
    mats.strap.depthWrite = !wantT

    // finish & strap colour (eased)
    const f = FINISH_LOOK[film.finish] || FINISH_LOOK.silver
    const k = 1 - Math.exp(-dt * 5)
    mats.metal.color.lerp(tgt.metal.set(f.color), k)
    mats.metal.metalness += (f.metalness - mats.metal.metalness) * k
    mats.metal.roughness += (f.roughness - mats.metal.roughness) * k
    mats.strap.color.lerp(tgt.strap.set(STRAP_LOOK[film.strap] || STRAP_LOOK.charcoal), k)

    // sensors & signals
    const pulse = 0.75 + 0.25 * Math.sin(time * 6.0)
    mats.ember.opacity = S.imu * (0.65 + 0.35 * Math.sin(time * 4))
    mats.emberSoft.opacity = S.imu * 0.9
    mats.led.color.setRGB(0.12 + 1.6 * S.led * pulse, 0.25 + 3.2 * S.led * pulse, 0.18 + 1.9 * S.led * pulse)
    mats.ledGlow.opacity = S.led * 0.9 * pulse
    mats.cone.opacity = S.led * 0.35
    mats.line.opacity = S.stackLine * 0.35
    axes.current.visible = S.imu > 0.005
    ble.current.visible = S.ble > 0.005
    stack.current.visible = S.stackLine > 0.005
    if (ble.current.visible) {
      ble.current.children.forEach((r, i) => {
        const ph = (time * 0.55 + i / 3) % 1
        r.scale.setScalar(0.06 + ph * 0.26)
        r.material.opacity = S.ble * (1 - ph) * 0.9
      })
    }
  })

  const setAnchor = (name) => (o) => {
    if (o) anchors[name] = o
  }

  return (
    <group ref={rig}>
      <group ref={orient}>
        <group ref={setAnchor('device')} />

        {/* shell — stainless steel, no screen */}
        <group ref={shell}>
          <mesh geometry={geo.shell} material={mats.metal} />
          <group ref={setAnchor('shell')} position={[0.5, 0.42, 0.14]} />
        </group>

        {/* battery */}
        <group ref={battery} position={[0, 0, 0.06]}>
          <mesh geometry={geo.battery} material={mats.pouch} />
          <mesh position={[0, -0.36, 0.043]} material={mats.gold}>
            <boxGeometry args={[0.22, 0.05, 0.004]} />
          </mesh>
          <group ref={setAnchor('battery')} position={[0.34, -0.2, 0.03]} />
        </group>

        {/* logic board: IMU, MCU, BLE */}
        <group ref={pcb} position={[0, 0, -0.07]}>
          <mesh geometry={geo.pcb} material={mats.board} />
          {/* MCU */}
          <mesh position={[-0.12, 0.05, 0.034]} material={mats.chip}>
            <boxGeometry args={[0.24, 0.24, 0.036]} />
          </mesh>
          {/* IMU — accelerometer + gyroscope */}
          <mesh position={[0.17, 0.38, 0.03]} material={mats.chip}>
            <boxGeometry args={[0.13, 0.13, 0.028]} />
          </mesh>
          <mesh position={[0.17, 0.38, 0.046]} material={mats.ember}>
            <boxGeometry args={[0.135, 0.135, 0.002]} />
          </mesh>
          {/* BLE radio (shielded) + antenna trace */}
          <mesh position={[0.14, -0.42, 0.03]} material={mats.shield}>
            <boxGeometry args={[0.2, 0.14, 0.03]} />
          </mesh>
          <mesh position={[0, 0.7, 0.014]} material={mats.gold}>
            <boxGeometry args={[0.46, 0.016, 0.004]} />
          </mesh>
          <mesh position={[-0.3, 0.3, 0.014]} material={mats.gold}>
            <boxGeometry args={[0.012, 0.5, 0.004]} />
          </mesh>
          <mesh position={[0.02, -0.18, 0.014]} material={mats.gold}>
            <boxGeometry args={[0.34, 0.01, 0.004]} />
          </mesh>
          {parts.map((p, i) => (
            <mesh key={i} position={[p.x, p.y, 0.02]} rotation={[0, 0, p.rot]} material={p.g ? mats.gold : mats.passive}>
              <boxGeometry args={[0.04, 0.02, 0.014]} />
            </mesh>
          ))}
          <group ref={setAnchor('imu')} position={[0.24, 0.38, 0.05]} />
          <group ref={setAnchor('ble')} position={[0.24, -0.42, 0.05]} />
          {/* motion axes gizmo */}
          <group ref={axes} position={[0.17, 0.38, 0.05]}>
            <mesh geometry={geo.axis} material={mats.ember} rotation={[0, 0, Math.PI / 2]} position={[0.2, 0, 0]} />
            <mesh geometry={geo.axis} material={mats.emberSoft} position={[0, 0.2, 0]} />
            <mesh geometry={geo.axis} material={mats.ember} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} />
            <mesh geometry={geo.tip} material={mats.ember} rotation={[0, 0, -Math.PI / 2]} position={[0.44, 0, 0]} />
            <mesh geometry={geo.tip} material={mats.emberSoft} position={[0, 0.44, 0]} />
            <mesh geometry={geo.tip} material={mats.ember} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.44]} />
            <mesh geometry={geo.gyro} material={mats.emberSoft} />
          </group>
          {/* BLE pulses */}
          <group ref={ble} position={[0.14, -0.42, 0.05]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} geometry={geo.ring}>
                <meshBasicMaterial color="#ffd7c4" transparent opacity={0} depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>

        {/* sensor back: PPG optical window, temperature, charging contacts */}
        <group ref={back} position={[0, 0, -0.2]}>
          <mesh geometry={geo.back} material={mats.ceramic} />
          <mesh geometry={geo.dome} material={mats.glass} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4527]} />
          {[0, 1, 2, 3].map((i) => {
            const a = Math.PI / 4 + (i * Math.PI) / 2
            return (
              <group key={i} position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.0905]}>
                <mesh geometry={geo.led} material={mats.led} rotation={[0, Math.PI, 0]} />
                <sprite material={mats.ledGlow} scale={[0.24, 0.24, 0.24]} position={[0, 0, -0.02]} />
              </group>
            )
          })}
          <mesh geometry={geo.pd} material={mats.chip} rotation={[0, Math.PI, 0]} position={[0.034, 0, -0.0985]} />
          <mesh geometry={geo.pd} material={mats.chip} rotation={[0, Math.PI, 0]} position={[-0.034, 0, -0.0985]} />
          <sprite material={mats.cone} scale={[0.95, 0.95, 0.95]} position={[0, 0, -0.16]} />
          <mesh geometry={geo.pad} material={mats.gold} rotation={[0, Math.PI, 0]} position={[0, 0.6, -0.0515]} />
          <mesh geometry={geo.contact} material={mats.gold} rotation={[0, Math.PI, 0]} position={[0.12, -0.62, -0.0515]} />
          <mesh geometry={geo.contact} material={mats.gold} rotation={[0, Math.PI, 0]} position={[-0.12, -0.62, -0.0515]} />
          <group ref={setAnchor('ppg')} position={[0, 0, -0.1]} />
          <group ref={setAnchor('temp')} position={[0, 0.6, -0.055]} />
        </group>

        {/* exploded-view axis */}
        <group ref={stack}>
          {Array.from({ length: 22 }, (_, i) => (
            <mesh key={i} geometry={geo.dash} material={mats.line} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.95 + i * 0.12]} />
          ))}
        </group>

        {/* band */}
        <group ref={strapGroup}>
          <mesh geometry={strapGeo} material={mats.strap} />
          <mesh geometry={strapGeo} material={mats.strap} scale={[1, -1, 1]} />
        </group>
      </group>
    </group>
  )
}
