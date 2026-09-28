import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { S, layout } from '../film/choreo'

/*
  All reflections on the steel come from an animated environment:
  a gradient "room" that mirrors the sky behind the page, plus softboxes.
  Scene 01's reveal is a single thin strip travelling around the device.
*/
const white = new THREE.Color('#ffffff')

function Box({ innerRef, ...props }) {
  return (
    <mesh ref={innerRef} {...props}>
      <planeGeometry />
      <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} color="black" />
    </mesh>
  )
}

const roomVert = /* glsl */ `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const roomFrag = /* glsl */ `
  uniform vec3 uTop, uBot, uBase;
  varying vec3 vDir;
  void main() {
    float y = vDir.y;
    vec3 sky = mix(uBot, uTop, smoothstep(-0.2, 0.9, y));
    float floorK = smoothstep(0.05, -0.35, y);
    vec3 c = mix(sky, uBot * 0.35, floorK) + uBase * (0.6 + 0.4 * smoothstep(-0.6, 0.6, y));
    gl_FragColor = vec4(c, 1.0);
  }
`

export function Lights() {
  const sweep = useRef()
  const key = useRef()
  const fill = useRef()
  const rim = useRef()
  const top = useRef()
  const kick = useRef()
  const front = useRef()
  const dir = useRef()
  const amb = useRef()

  const roomMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: roomVert,
        fragmentShader: roomFrag,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uBase: { value: new THREE.Color() } },
      }),
    [],
  )

  useFrame(() => {
    const L = S.L
    const a = L.sweepAng
    sweep.current.position.set(Math.sin(a) * 6, 0.6, Math.cos(a) * 6)
    sweep.current.lookAt(0, 0, 0)
    sweep.current.material.color.copy(white).multiplyScalar(L.sweep)
    key.current.material.color.copy(L.keyColor).multiplyScalar(L.key * 1.6)
    fill.current.material.color.copy(L.fillColor).multiplyScalar(L.fill)
    rim.current.material.color.copy(L.rimColor).multiplyScalar(L.rim * 1.4)
    top.current.material.color.copy(white).multiplyScalar(L.top)
    kick.current.material.color.copy(L.fillColor).multiplyScalar(L.kick)
    front.current.material.color.copy(L.keyColor).multiplyScalar(L.front)
    roomMat.uniforms.uTop.value.copy(S.bgTop).multiplyScalar(L.room)
    roomMat.uniforms.uBot.value.copy(S.bgBot).multiplyScalar(L.room)
    roomMat.uniforms.uBase.value.copy(L.keyColor).multiplyScalar(L.roomBase)
    dir.current.intensity = L.dir
    dir.current.color.copy(L.keyColor)
    amb.current.intensity = L.amb
  })

  return (
    <>
      <ambientLight ref={amb} intensity={0} />
      <directionalLight ref={dir} position={[-3, 4, 5]} intensity={0} />
      <Environment frames={Infinity} resolution={layout.mobile ? 128 : 256}>
        <mesh material={roomMat} scale={40}>
          <sphereGeometry args={[1, 48, 24]} />
        </mesh>
        <Box innerRef={sweep} scale={[0.55, 14, 1]} />
        <Box innerRef={key} position={[-4.5, 4, 5]} scale={[5, 3.2, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Box innerRef={fill} position={[5, -2.5, 5]} scale={[7, 1.6, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Box innerRef={rim} position={[5.5, 2, -5]} scale={[1.6, 9, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Box innerRef={top} position={[0, 7, 0.5]} scale={[7, 7, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Box innerRef={kick} position={[-6, 0.5, -3]} scale={[1.2, 7, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
        <Box innerRef={front} position={[-1.5, 1.2, 8]} scale={[4.5, 5, 1]} onUpdate={(o) => o.lookAt(0, 0, 0)} />
      </Environment>
    </>
  )
}
