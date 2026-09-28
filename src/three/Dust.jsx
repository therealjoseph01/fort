import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S } from '../film/choreo'

// Scene 01: motes caught in the travelling light.
const vert = /* glsl */ `
  attribute float aR;
  uniform float uTime, uI, uBeam, uPR;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * 0.05 * (0.4 + aR) + aR * 10.0, 5.0) - 2.5;
    p.x += sin(uTime * 0.2 + aR * 20.0) * 0.15;
    float beam = exp(-pow(p.x - uBeam, 2.0) / 0.9);
    vA = uI * (0.015 + 0.6 * beam) * (0.3 + 0.7 * aR);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (6.0 + aR * 10.0) * uPR / -mv.z;
  }
`
const frag = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vec3(1.0, 0.95, 0.9), smoothstep(0.5, 0.0, d) * vA);
  }
`

export function Dust() {
  const ref = useRef()
  const { geo, mat } = useMemo(() => {
    const n = 260
    const p = new Float32Array(n * 3)
    const r = new Float32Array(n)
    let s = 99
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < n; i++) {
      p[i * 3] = (rnd() - 0.5) * 7
      p[i * 3 + 1] = (rnd() - 0.5) * 5
      p[i * 3 + 2] = (rnd() - 0.5) * 5
      r[i] = rnd()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
    geo.setAttribute('aR', new THREE.BufferAttribute(r, 1))
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uI: { value: 0 }, uBeam: { value: 0 }, uPR: { value: 1 } },
    })
    return { geo, mat }
  }, [])

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uI.value = S.dust
    mat.uniforms.uBeam.value = Math.sin(S.L.sweepAng) * 2.6
    mat.uniforms.uPR.value = state.gl.getPixelRatio()
    ref.current.visible = S.dust > 0.001
  })
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />
}
