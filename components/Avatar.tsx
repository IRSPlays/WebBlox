import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Avatar({ velocity, color = '#ef4444' }: { velocity: THREE.Vector3, color?: string }) {
  const group = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Mesh>(null)
  const rightArm = useRef<THREE.Mesh>(null)
  const leftLeg = useRef<THREE.Mesh>(null)
  const rightLeg = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!group.current) return

    // Calculate speed (ignoring Y for walking animation)
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    
    // Animation cycle based on time and speed
    const time = state.clock.getElapsedTime()
    const walkCycle = speed > 0.1 ? Math.sin(time * 10) : 0

    // Animate limbs
    if (leftArm.current && rightArm.current && leftLeg.current && rightLeg.current) {
      const swingAngle = walkCycle * 0.5
      
      leftArm.current.rotation.x = swingAngle
      rightArm.current.rotation.x = -swingAngle
      
      leftLeg.current.rotation.x = -swingAngle
      rightLeg.current.rotation.x = swingAngle
    }
  })

  // Roblox-style blocky avatar
  return (
    <group ref={group}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#fcd34d" /> {/* Yellowish head */}
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1.2, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Left Arm */}
      <group position={[-0.75, 1.1, 0]}>
        <mesh ref={leftArm} position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group position={[0.75, 1.1, 0]}>
        <mesh ref={rightArm} position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>
      
      {/* Left Leg */}
      <group position={[-0.25, -0.1, 0]}>
        <mesh ref={leftLeg} position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#1e3a8a" /> {/* Blue pants */}
        </mesh>
      </group>
      
      {/* Right Leg */}
      <group position={[0.25, -0.1, 0]}>
        <mesh ref={rightLeg} position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
    </group>
  )
}
