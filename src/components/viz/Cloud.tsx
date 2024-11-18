import * as THREE from "three"
import { createContext, useContext, useRef, useState, MutableRefObject } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Clouds, Cloud, CameraShake, Environment, OrbitControls, ContactShadows, PerspectiveCamera } from "@react-three/drei"
import { CuboidCollider, BallCollider, Physics, RigidBody } from "@react-three/rapier"
import { random } from "maath"

const context = createContext<MutableRefObject<any> | null>(null)

interface ICloudAppProps {
  seed1?: number;
  seed2?: number;
  seed3?: number;
  seed4?: number;
}

// https://codesandbox.io/p/sandbox/gwthnh?file=%2Fsrc%2FApp.js%3A1%2C1-78%2C1
export default function CloudApp({ seed1 = 0, seed2 = 0, seed3 = 0, seed4 = 0 }: ICloudAppProps) {
  const shake = useRef<any>(null)

  return (
    <Canvas>
      <DynamicAmbientLight 
          seed={seed1} 
          intensity={Math.PI / 3} 
          
          />


      <PerspectiveCamera makeDefault position={[0, -4, 18]} fov={90} onUpdate={(self) => self.lookAt(0, 0, 0)}>
        <DynamicSpotLight 
          saturationMultiplier={seed3*2}
          color="#C0E500" position={[0, 40, 2]} angle={0.5} decay={1} distance={45} penumbra={1} intensity={2000} />
        <DynamicSpotLight
          intensityMultiplier={seed2*2}
          position={[-19, 0, -8]}
          color="#ff00d6"
          angle={0.25}
          decay={0.75}
          distance={185}
          penumbra={-1}
          intensity={300} // Initial intensity
        /> {/* Move spotlight into a separate component */}

      </PerspectiveCamera>

      <context.Provider value={shake}>
        {/* <CameraShake ref={shake} decay decayRate={0.95} maxYaw={0.05} maxPitch={0.01} yawFrequency={4} pitchFrequency={2} rollFrequency={2} intensity={0} /> */}
        <Clouds limit={400} material={THREE.MeshLambertMaterial}>
          <Physics gravity={[0, 0, 0]}>
            {/* <Pointer /> */}
            <Puffycloud seed1={seed1} seed={10} position={[0, 0, 0]} />
            {/* <Puffycloud seed={20} position={[0, 50, 0]} />
            <Puffycloud seed={30} position={[50, 0, 50]} />
            <Puffycloud seed={40} position={[0, 0, -50]} /> */}
            {/* <CuboidCollider position={[0, -15, 0]} args={[400, 10, 400]} /> */}
          </Physics>
        </Clouds>
      </context.Provider>

      <mesh scale={200}>
        <sphereGeometry />
        <meshStandardMaterial color="#999" roughness={0.7} side={THREE.BackSide} />
      </mesh>
      {/* <ContactShadows opacity={0.25} color="black" position={[0, -10, 0]} scale={50} blur={2.5} far={40} /> */}
      {/* <OrbitControls makeDefault autoRotate enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 1.7} maxPolarAngle={Math.PI / 1.7} /> */}
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/blue_lagoon_night_1k.hdr" />
    </Canvas>
  )
}

interface PuffycloudProps {
  seed: number
  vec?: THREE.Vector3
  seed1?: number
  [key: string]: any
}

function Puffycloud({ seed, vec = new THREE.Vector3(), seed1 = 0, ...props }: PuffycloudProps) {

  const light = useRef<any>(null)
  const rig = useContext(context)
  const cloudRef = useRef<any>(null);
  const cloudRef2 = useRef<any>(null);

  useFrame(() => {
    if (cloudRef.current && cloudRef2.current) {
      const targetScale = 0.5 + seed1;
      cloudRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      cloudRef2.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <RigidBody userData={{ cloud: true }} linearDamping={4} angularDamping={1} friction={0.1} {...props} colliders={false}>
      <BallCollider args={[4]} />
      <Cloud
        segments={40}
        seed={seed}
        fade={30}
        speed={0.1}
        growth={16}
        volume={12}
        opacity={0.6}
        bounds={[8, 6, 2]}
        ref={cloudRef}
      />
      <Cloud
        position={[0, 1, 0]}
        seed={seed + 1}
        fade={30}
        speed={0.5}
        growth={16}
        volume={20}
        opacity={1}
        bounds={[12, 4, 2]}
        ref={cloudRef2}
      />
      <pointLight position={[0, 0, 0]} ref={light} color="blue" />
    </RigidBody>
  )
}

function DynamicSpotLight({intensityMultiplier=0, saturationMultiplier=1, color, intensity, ...props }: { intensityMultiplier?: number, saturationMultiplier?: number, color: string,
   intensity:number, [key: string]: any }) {
  const lightRef = useRef<any>(null);

  useFrame(() => {
    if (lightRef.current) {
      // Dynamically adjust the intensity
      lightRef.current.intensity = intensity * (1 + intensityMultiplier);

      // Adjust the color saturation
      const baseColor = new THREE.Color(color);
      const { h, s, l } = baseColor.getHSL({ h: 0, s: 0, l: 0 });
      const adjustedSaturation = THREE.MathUtils.clamp(s * saturationMultiplier, 0, 1); // Clamp between 0 and 1
      baseColor.setHSL(h, adjustedSaturation, l); // Set adjusted saturation
      lightRef.current.color = baseColor;
    }
  });

  return (
    <spotLight
      ref={lightRef}
      color={color}
      {...props}

    />
  );
}

function DynamicAmbientLight({ seed, intensity, ...props }: { seed: number, intensity:number, [key: string]: any }) {
  const lightRef = useRef<any>(null);

  

  useFrame(() => {
    if (lightRef.current && seed >0) {
      lightRef.current.intensity = intensity * (1 - seed/2); // Dynamically update intensity
    }
  });

  return (
    <ambientLight
      ref={lightRef}
      {...props}
    />
  );
}

// interface PointerProps {
//   vec?: THREE.Vector3
//   dir?: THREE.Vector3
// }

// function Pointer({ vec = new THREE.Vector3(), dir = new THREE.Vector3() }: PointerProps) {
//   const ref = useRef<any>(null)
//   useFrame(({ pointer, viewport, camera }) => {
//     vec.set(pointer.x, pointer.y, 0.5).unproject(camera)
//     dir.copy(vec).sub(camera.position).normalize()
//     vec.add(dir.multiplyScalar(camera.position.length()))
//     ref.current?.setNextKinematicTranslation(vec)
//   })
//   return (
//     <RigidBody userData={{ cloud: true }} type="kinematicPosition" colliders={false} ref={ref}>
//       <BallCollider args={[4]} />
//     </RigidBody>
//   )
// }
