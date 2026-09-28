import { useFrame, useThree, Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { S, computeState, ensureLayout } from '../film/choreo'
import { film, updaters } from '../film/store'
import { Device } from './Device'
import { Lights } from './Lights'
import { Particles } from './Particles'
import { Trail } from './Trail'
import { Rings } from './Rings'
import { Dust } from './Dust'

const v = new THREE.Vector3()

function Director() {
  const size = useThree((s) => s.size)
  ensureLayout(size.width, size.height)
  useFrame((state, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 2.5)
    S.px += (film.pointer.x - S.px) * k
    S.py += (film.pointer.y - S.py) * k
    computeState(film.t, state.clock.elapsedTime)
    const cam = state.camera
    cam.position.copy(S.cam)
    cam.lookAt(S.target)
    cam.updateMatrixWorld()
  }, -1)
  return null
}

// Runs after every scene component has applied its transforms, so labels pin with zero lag.
function OverlaySync() {
  const { camera, size } = useThree()
  useFrame(() => {
    const ctx = {
      camera,
      vw: size.width,
      vh: size.height,
      project(vec) {
        v.copy(vec).project(camera)
        return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height, v.z < 1]
      },
    }
    for (const fn of updaters) fn(S, film.t, ctx)
  })
  return null
}

export function Stage() {
  return (
    <Canvas
      className="stage"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 28, near: 0.1, far: 120, position: [0, 0, 10] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
      }}
    >
      <Director />
      <Lights />
      <Dust />
      <Particles />
      <Trail />
      <Rings />
      <Device />
      <OverlaySync />
    </Canvas>
  )
}
