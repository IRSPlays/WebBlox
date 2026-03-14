'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CuboidCollider, BallCollider } from '@react-three/rapier'
import { Box, Sphere } from '@react-three/drei'
import * as THREE from 'three'

// ─── Moving Platform ──────────────────────────────────────────────
export function MovingPlatform({ entity }: { entity: any }) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const startPos = useRef(new THREE.Vector3(...(entity.position || [0, 0, 0])))
  const endPos = useRef(new THREE.Vector3(...(entity.endpoint || [entity.position[0] + 5, entity.position[1], entity.position[2]])))
  const progress = useRef(0)
  const direction = useRef(1)
  const speed = entity.speed || 2

  useFrame((_, delta) => {
    if (!bodyRef.current) return
    progress.current += delta * speed * 0.1 * direction.current
    if (progress.current >= 1) { progress.current = 1; direction.current = -1 }
    if (progress.current <= 0) { progress.current = 0; direction.current = 1 }

    const pos = startPos.current.clone().lerp(endPos.current, progress.current)
    bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z })
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={entity.position} colliders="cuboid">
      <Box args={entity.scale || [4, 0.5, 4]} castShadow receiveShadow>
        <meshStandardMaterial color={entity.color || '#f59e0b'} roughness={0.4} metalness={0.6} />
      </Box>
      {/* Direction indicator stripes */}
      <Box args={[(entity.scale?.[0] || 4) * 0.8, 0.52, 0.1]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#000000" roughness={0.9} transparent opacity={0.3} />
      </Box>
    </RigidBody>
  )
}

// ─── Conveyor Belt ────────────────────────────────────────────────
export function ConveyorBelt({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const speed = entity.speed || 5
  const axis = entity.axis || 'x'

  useFrame((_, delta) => {
    // Visual: scroll texture offset to indicate direction
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      if (material.map) {
        if (axis === 'x') material.map.offset.x += delta * speed * 0.2
        else material.map.offset.y += delta * speed * 0.2
      }
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} colliders="cuboid">
      <Box ref={meshRef} args={entity.scale || [6, 0.3, 2]} castShadow receiveShadow>
        <meshStandardMaterial color={entity.color || '#6b7280'} roughness={0.3} metalness={0.7} />
      </Box>
      {/* Arrow indicators */}
      {[...Array(3)].map((_, i) => (
        <Box key={i} args={[0.2, 0.32, 0.6]} position={[axis === 'x' ? (i - 1) * 2 : 0, 0.01, axis === 'z' ? (i - 1) * 0.6 : 0]}>
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
        </Box>
      ))}
    </RigidBody>
  )
}

// ─── Trampoline / Bounce Pad ──────────────────────────────────────
export function Trampoline({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const bounceForce = entity.bounceForce || 20

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.03
      meshRef.current.scale.setScalar(scale)
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} colliders={false} userData={{ type: 'trampoline', bounceForce }}>
      <CuboidCollider
        args={[(entity.scale?.[0] || 2) / 2, (entity.scale?.[1] || 0.3) / 2, (entity.scale?.[2] || 2) / 2]}
        sensor
      />
      <Box ref={meshRef} args={entity.scale || [2, 0.3, 2]} castShadow receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#ec4899'}
          roughness={0.3}
          metalness={0.2}
          emissive={entity.color || '#ec4899'}
          emissiveIntensity={0.4}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────
export function Spinner({ entity }: { entity: any }) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const rotationY = useRef(0)
  const speed = entity.speed || 2

  useFrame((_, delta) => {
    if (!bodyRef.current) return
    rotationY.current += delta * speed
    const pos = bodyRef.current.translation()
    bodyRef.current.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z })
    bodyRef.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY.current, 0)))
  })

  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" position={entity.position} colliders="cuboid">
      <Box args={entity.scale || [6, 0.5, 1]} castShadow receiveShadow>
        <meshStandardMaterial color={entity.color || '#8b5cf6'} roughness={0.3} metalness={0.5} />
      </Box>
    </RigidBody>
  )
}

// ─── Speed Boost Pad ──────────────────────────────────────────────
export function SpeedBoostPad({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.getElapsedTime() * 5) * 0.3
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} colliders={false} userData={{ type: 'speedBoost', boostMultiplier: entity.boostMultiplier || 2, boostDuration: entity.boostDuration || 3 }}>
      <CuboidCollider
        args={[(entity.scale?.[0] || 3) / 2, (entity.scale?.[1] || 0.2) / 2, (entity.scale?.[2] || 3) / 2]}
        sensor
      />
      <Box ref={meshRef} args={entity.scale || [3, 0.2, 3]} castShadow receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#06b6d4'}
          roughness={0.2}
          metalness={0.8}
          emissive={entity.color || '#06b6d4'}
          emissiveIntensity={0.5}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Checkpoint ───────────────────────────────────────────────────
export function Checkpoint({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1
      glowRef.current.scale.set(scale, scale, scale)
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} colliders={false} userData={{ type: 'checkpoint', checkpointPosition: entity.position }}>
      <CuboidCollider args={[0.5, 1.5, 0.5]} sensor />
      {/* Flag pole */}
      <Box args={[0.1, 3, 0.1]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial color="#d4d4d4" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Flag */}
      <Box ref={meshRef} args={[1, 0.6, 0.05]} position={[0.55, 2.7, 0]} castShadow>
        <meshStandardMaterial color={entity.color || '#22c55e'} emissive={entity.color || '#22c55e'} emissiveIntensity={0.5} />
      </Box>
      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshStandardMaterial color={entity.color || '#22c55e'} emissive={entity.color || '#22c55e'} emissiveIntensity={1} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
  )
}

// ─── Trigger Zone ─────────────────────────────────────────────────
export function TriggerZone({ entity }: { entity: any }) {
  return (
    <RigidBody type="fixed" position={entity.position} colliders={false} userData={{ type: 'trigger', action: entity.action || 'message', actionTarget: entity.actionTarget || 'You entered a trigger zone!' }}>
      <CuboidCollider
        args={[(entity.scale?.[0] || 3) / 2, (entity.scale?.[1] || 3) / 2, (entity.scale?.[2] || 3) / 2]}
        sensor
      />
      {/* Visible in editor but mostly invisible in play */}
      <Box args={entity.scale || [3, 3, 3]}>
        <meshStandardMaterial color={entity.color || '#fbbf24'} transparent opacity={0.08} wireframe />
      </Box>
    </RigidBody>
  )
}

// ─── Point Light Entity ───────────────────────────────────────────
export function PointLightEntity({ entity }: { entity: any }) {
  return (
    <group position={entity.position}>
      <pointLight
        color={entity.color || '#ffffff'}
        intensity={entity.emissiveIntensity || 10}
        distance={entity.scale?.[0] || 20}
        castShadow
      />
      {/* Visual indicator sphere */}
      <Sphere args={[0.2, 16, 16]}>
        <meshStandardMaterial
          color={entity.color || '#ffffff'}
          emissive={entity.color || '#ffffff'}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Sphere>
    </group>
  )
}
