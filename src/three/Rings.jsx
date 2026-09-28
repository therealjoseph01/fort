import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S, LIFT } from '../film/choreo'

const vert = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const frag = /* glsl */ `
  uniform float uFill, uAlpha, uTrack;
  uniform vec3 uColor;
  varying vec2 vP;
  void main() {
    float a = fract(0.25 - atan(vP.y, vP.x) / 6.2831853);
    float on = step(a, uFill);
    float head = smoothstep(0.03, 0.0, abs(a - uFill)) * step(0.001, uFill);
    float alpha = uAlpha * (on * 0.95 + (1.0 - on) * uTrack) + head * uAlpha * 0.6;
    gl_FragColor = vec4(uColor + head * 0.4, alpha);
  }
`

function useRing(color, track = 0.14) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uFill: { value: 0 }, uAlpha: { value: 0 }, uTrack: { value: track }, uColor: { value: new THREE.Color(color) } },
      }),
    [color, track],
  )
}

// Rest timer + proximity-to-failure gauges (Scene 04), battery (Scene 07). Always face the camera.
export function Rings() {
  const rest = useRef()
  const fail = useRef()
  const batt = useRef()
  const restMat = useRing('#ffd7c4', 0.12)
  const failMat = useRing('#ff5a3a', 0.1)
  const battMat = useRing('#ffffff', 0.1)
  const geoA = useMemo(() => new THREE.RingGeometry(0.85, 0.86, 256, 1), [])
  const geoB = useMemo(() => new THREE.RingGeometry(1.0, 1.016, 256, 1), [])
  const geoC = useMemo(() => new THREE.RingGeometry(1.42, 1.432, 256, 1), [])
  const white = useMemo(() => new THREE.Color('#ffffff'), [])
  const ember = useMemo(() => new THREE.Color('#ff6a4a'), [])

  useFrame(({ camera }) => {
    rest.current.position.copy(LIFT.restPos)
    fail.current.position.copy(LIFT.restPos)
    rest.current.quaternion.copy(camera.quaternion)
    fail.current.quaternion.copy(camera.quaternion)
    rest.current.scale.setScalar(LIFT.ring)
    fail.current.scale.setScalar(LIFT.ring)
    restMat.uniforms.uFill.value = S.rest
    restMat.uniforms.uAlpha.value = S.restA
    failMat.uniforms.uFill.value = S.fail
    failMat.uniforms.uAlpha.value = S.failA
    rest.current.visible = S.restA > 0.001
    fail.current.visible = S.failA > 0.001

    batt.current.position.copy(S.rigPos)
    batt.current.quaternion.copy(camera.quaternion)
    batt.current.scale.setScalar(S.rigScale)
    const fill = S.batt + (1 - S.batt) * S.charge
    battMat.uniforms.uFill.value = fill
    battMat.uniforms.uAlpha.value = S.battA * (0.55 + 0.45 * S.inkLight)
    battMat.uniforms.uColor.value.copy(S.ink).lerp(fill < 0.2 ? ember : white, S.inkLight * 0.5)
    batt.current.visible = S.battA > 0.001
  })

  return (
    <>
      <mesh ref={rest} geometry={geoA} material={restMat} />
      <mesh ref={fail} geometry={geoB} material={failMat} />
      <mesh ref={batt} geometry={geoC} material={battMat} />
    </>
  )
}
