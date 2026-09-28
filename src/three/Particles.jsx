import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S, LIFT, layout } from '../film/choreo'
import { buildBody } from './bodyPoints'

/*
  One particle system, three lives:
    A  the lift — dust gathered along the path of every rep (Scene 04)
    B  the body — the same dust becomes a figure whose muscles light up (Scene 05)
    C  the sky  — the figure dissolves into the stars of the night (Scenes 06–07)
*/
const N = 9000

const vert = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec3 aC;
  attribute float aGroup;
  attribute float aRand;
  attribute float aU;
  uniform float uM1, uM2, uTrail, uOpacity, uStar, uTime, uSize, uPR, uBodyRot;
  uniform vec3 uBodyCenter;
  uniform float uAct[10];
  varying float vAlpha;
  varying float vHot;
  varying float vStar;

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }

  void main() {
    float d1 = aRand * 0.45;
    float m1 = smoothstep(d1, d1 + 0.55, uM1);
    float d2 = fract(aRand * 7.31) * 0.45;
    float m2 = smoothstep(d2, d2 + 0.55, uM2);

    vec3 b = rotY(aB, uBodyRot) + uBodyCenter;
    vec3 p = mix(aA, b, m1);
    // arc outward while travelling so the flight reads as a swirl, not a lerp
    p += vec3(0.0, 0.0, 1.2) * sin(3.14159 * m1) * (aRand - 0.5);
    p = mix(p, aC, m2);
    p += vec3(0.0, 2.0, 0.0) * sin(3.14159 * m2) * aRand;
    p += 0.018 * vec3(sin(uTime * 0.7 + aRand * 40.0), cos(uTime * 0.6 + aRand * 31.0), sin(uTime * 0.5 + aRand * 23.0));

    float act = 0.0;
    for (int i = 0; i < 10; i++) act += (abs(aGroup - float(i)) < 0.5) ? uAct[i] : 0.0;

    float vis = step(aU, uTrail);
    float aA_ = vis * (0.18 + 0.62 * exp(-(uTrail - aU) * 5.0));
    float aB_ = 0.34 + 0.66 * act;
    float tw = 0.6 + 0.4 * sin(uTime * (1.0 + aRand * 2.0) + aRand * 60.0);
    float aC_ = uStar * (0.15 + 0.85 * step(0.55, fract(aRand * 13.7))) * tw;

    float wA = 1.0 - m1;
    float wC = m2;
    float wB = m1 * (1.0 - m2);
    vAlpha = uOpacity * (wA * aA_ + wB * aB_ + wC * aC_);
    vHot = wB * act + wA * 0.55;
    vStar = wC;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + aRand * 0.8) * (1.0 + act * 0.7 * wB) * mix(1.0, 0.55, wC);
    gl_PointSize = size * uPR / -mv.z;
  }
`

const frag = /* glsl */ `
  uniform vec3 uBase, uHot, uStarCol;
  varying float vAlpha;
  varying float vHot;
  varying float vStar;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uBase, uHot, clamp(vHot, 0.0, 1.0));
    col = mix(col, uStarCol, vStar);
    col += vec3(1.0, 0.85, 0.75) * pow(clamp(vHot, 0.0, 1.0), 3.0) * smoothstep(0.25, 0.0, d) * 0.6;
    gl_FragColor = vec4(col, a * vAlpha);
    if (gl_FragColor.a < 0.003) discard;
  }
`

function seeded(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

export function Particles() {
  const ref = useRef()
  const mobile = useThree((s) => s.size.width / s.size.height < 0.85)

  const geo = useMemo(() => {
    const rnd = seeded(1234)
    const g = new THREE.BufferGeometry()
    const A = new Float32Array(N * 3)
    const C = new Float32Array(N * 3)
    const R = new Float32Array(N)
    const U = new Float32Array(N)
    const samples = LIFT.samples
    const M = LIFT.N
    for (let i = 0; i < N; i++) {
      const u = rnd()
      const f = u * (M - 1)
      const j = Math.min(Math.floor(f), M - 2)
      const x = f - j
      const spread = rnd() < 0.85 ? 0.07 : 0.35
      for (let k = 0; k < 3; k++) {
        A[i * 3 + k] = samples[j * 3 + k] + (samples[(j + 1) * 3 + k] - samples[j * 3 + k]) * x + (rnd() - 0.5) * 2 * spread
      }
      U[i] = u
      R[i] = rnd()
      C[i * 3] = (rnd() - 0.5) * 60
      C[i * 3 + 1] = -3 + rnd() * 20
      C[i * 3 + 2] = -18 - rnd() * 14
    }
    const body = buildBody(N, rnd)
    // shuffle body points so trail → body mapping is scattered, not sequential
    const idx = Array.from({ length: N }, (_, i) => i)
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    const B = new Float32Array(N * 3)
    const G = new Float32Array(N)
    idx.forEach((s, d) => {
      B[d * 3] = body.pos[s * 3]
      B[d * 3 + 1] = body.pos[s * 3 + 1]
      B[d * 3 + 2] = body.pos[s * 3 + 2]
      G[d] = body.group[s]
    })
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    g.setAttribute('aA', new THREE.BufferAttribute(A, 3))
    g.setAttribute('aB', new THREE.BufferAttribute(B, 3))
    g.setAttribute('aC', new THREE.BufferAttribute(C, 3))
    g.setAttribute('aGroup', new THREE.BufferAttribute(G, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(R, 1))
    g.setAttribute('aU', new THREE.BufferAttribute(U, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100)
    return g
    // rebuild when the lift path changes with layout
  }, [mobile, layout.mobile])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uM1: { value: 0 },
          uM2: { value: 0 },
          uTrail: { value: 0 },
          uOpacity: { value: 0 },
          uStar: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: 40 },
          uPR: { value: 1 },
          uBodyRot: { value: 0 },
          uBodyCenter: { value: new THREE.Vector3() },
          uAct: { value: new Array(10).fill(0) },
          uBase: { value: new THREE.Color('#b8aa9c') },
          uHot: { value: new THREE.Color('#ff5a3a') },
          uStarCol: { value: new THREE.Color('#dfe6ff') },
        },
      }),
    [],
  )

  useFrame((state) => {
    const u = mat.uniforms
    u.uM1.value = S.pM1
    u.uM2.value = S.pM2
    u.uTrail.value = S.trail
    u.uOpacity.value = S.pOpacity
    u.uStar.value = S.pStar
    u.uTime.value = state.clock.elapsedTime
    u.uPR.value = state.gl.getPixelRatio()
    u.uBodyRot.value = S.bodyRot
    u.uBodyCenter.value.copy(S.bodyCenter)
    for (let i = 0; i < 10; i++) u.uAct.value[i] = S.act[i]
    ref.current.visible = S.pOpacity > 0.001 && (S.trailA > 0.001 || S.pM1 > 0.001)
  })

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} />
}
