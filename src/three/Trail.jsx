import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { S, LIFT, layout } from '../film/choreo'
import { glowTexture } from './materials'

// Scene 04: the path of every rep, drawn by the device itself as it moves.
export function Trail() {
  const size = useThree((s) => s.size)
  const mobile = size.width / size.height < 0.85
  const group = useRef()

  const { core, halo, coreMat, haloMat, dots } = useMemo(() => {
    const pts = Array.from(LIFT.samples)
    const g1 = new LineGeometry()
    g1.setPositions(pts)
    const g2 = new LineGeometry()
    g2.setPositions(pts)
    const coreMat = new LineMaterial({ color: new THREE.Color('#ffb59e'), linewidth: 1.6, transparent: true, opacity: 0, depthWrite: false })
    const haloMat = new LineMaterial({ color: new THREE.Color('#ff5a3a'), linewidth: 9, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    const core = new Line2(g1, coreMat)
    const halo = new Line2(g2, haloMat)
    core.frustumCulled = halo.frustumCulled = false
    const tex = glowTexture()
    const dots = LIFT.apex.map((p) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: '#ff8a6a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
      const s = new THREE.Sprite(m)
      s.position.copy(p)
      s.scale.setScalar(0.16)
      return s
    })
    return { core, halo, coreMat, haloMat, dots }
  }, [mobile, layout.mobile])

  useEffect(() => {
    coreMat.resolution.set(size.width, size.height)
    haloMat.resolution.set(size.width, size.height)
  }, [size, coreMat, haloMat])

  useFrame((state) => {
    const segs = LIFT.N - 1
    const n = Math.max(0, Math.floor(S.trail * segs))
    core.geometry.instanceCount = n
    halo.geometry.instanceCount = n
    coreMat.opacity = S.trailA * 0.9
    haloMat.opacity = S.trailA * 0.14
    group.current.visible = S.trailA > 0.001 && n > 0
    const time = state.clock.elapsedTime
    dots.forEach((d, i) => {
      const on = S.repCount > i ? 1 : 0
      d.material.opacity = on * S.trailA * (0.75 + 0.25 * Math.sin(time * 3 + i))
    })
  })

  return (
    <group ref={group}>
      <primitive object={halo} />
      <primitive object={core} />
      {dots.map((d, i) => (
        <primitive key={i} object={d} />
      ))}
    </group>
  )
}
