'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Box, Sphere, Sky, Environment, ContactShadows, Stars } from '@react-three/drei'
import * as THREE from 'three'
import {
  MovingPlatform,
  ConveyorBelt,
  Trampoline,
  Spinner,
  SpeedBoostPad,
  Checkpoint,
  TriggerZone,
  PointLightEntity
} from './PhysicsEntities'

// ─── Entity Type Router ──────────────────────────────────────────
function EntityRenderer({ entity }: { entity: any }) {
  switch (entity.type) {
    case 'block':
      return <BlockEntity entity={entity} />
    case 'sphere':
      return <SphereEntity entity={entity} />
    case 'cylinder':
      return <CylinderEntity entity={entity} />
    case 'ramp':
      return <RampEntity entity={entity} />
    case 'killZone':
      return <KillZoneEntity entity={entity} />
    case 'movingPlatform':
      return <MovingPlatform entity={entity} />
    case 'conveyor':
      return <ConveyorBelt entity={entity} />
    case 'trampoline':
      return <Trampoline entity={entity} />
    case 'spinner':
      return <Spinner entity={entity} />
    case 'speedBoost':
      return <SpeedBoostPad entity={entity} />
    case 'checkpoint':
      return <Checkpoint entity={entity} />
    case 'triggerZone':
      return <TriggerZone entity={entity} />
    case 'pointLight':
      return <PointLightEntity entity={entity} />
    case 'water':
      return <WaterEntity entity={entity} />
    case 'lava':
      return <LavaEntity entity={entity} />
    case 'spawn':
      return null // Spawn points are invisible markers
    default:
      return null
  }
}

// ─── Basic Block ──────────────────────────────────────────────────
function BlockEntity({ entity }: { entity: any }) {
  const isGrass = entity.color === '#2d4c1e' || entity.color === '#1e4c22'
  const isWood = entity.color === '#4a3018'
  const isStone = entity.color === '#555555'

  let roughness = entity.roughness ?? 0.7
  let metalness = entity.metalness ?? 0.1

  if (isGrass) { roughness = 0.9; metalness = 0.0 }
  if (isWood) { roughness = 0.8; metalness = 0.1 }
  if (isStone) { roughness = 0.6; metalness = 0.3 }

  return (
    <RigidBody type={entity.physics === 'fixed' ? 'fixed' : 'dynamic'} position={entity.position} rotation={entity.rotation || [0, 0, 0]}>
      <Box args={entity.scale || [1, 1, 1]} castShadow receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#ffffff'}
          roughness={roughness}
          metalness={metalness}
          envMapIntensity={1}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Sphere ───────────────────────────────────────────────────────
function SphereEntity({ entity }: { entity: any }) {
  return (
    <RigidBody type={entity.physics === 'fixed' ? 'fixed' : 'dynamic'} position={entity.position} colliders="ball">
      <Sphere args={[(entity.scale?.[0] || 1) / 2, 32, 32]} castShadow receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#ffffff'}
          roughness={entity.roughness ?? 0.5}
          metalness={entity.metalness ?? 0.3}
        />
      </Sphere>
    </RigidBody>
  )
}

// ─── Cylinder ─────────────────────────────────────────────────────
function CylinderEntity({ entity }: { entity: any }) {
  return (
    <RigidBody type={entity.physics === 'fixed' ? 'fixed' : 'dynamic'} position={entity.position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[(entity.scale?.[0] || 1) / 2, (entity.scale?.[0] || 1) / 2, entity.scale?.[1] || 1, 32]} />
        <meshStandardMaterial
          color={entity.color || '#ffffff'}
          roughness={entity.roughness ?? 0.5}
          metalness={entity.metalness ?? 0.3}
        />
      </mesh>
    </RigidBody>
  )
}

// ─── Ramp (Wedge) ─────────────────────────────────────────────────
function RampEntity({ entity }: { entity: any }) {
  const rampRotation: [number, number, number] = entity.rotation || [-Math.PI / 6, 0, 0]

  return (
    <RigidBody type={entity.physics === 'fixed' ? 'fixed' : 'dynamic'} position={entity.position} rotation={rampRotation} colliders="cuboid">
      <Box args={entity.scale || [4, 0.5, 6]} castShadow receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#a3a3a3'}
          roughness={entity.roughness ?? 0.6}
          metalness={entity.metalness ?? 0.2}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Kill Zone ────────────────────────────────────────────────────
function KillZoneEntity({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.getElapsedTime() * 4) * 0.3
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} sensor userData={{ type: 'trigger', action: 'respawn' }}>
      <Box ref={meshRef} args={entity.scale || [1, 1, 1]}>
        <meshStandardMaterial
          color={entity.color || '#ef4444'}
          emissive={entity.color || '#ef4444'}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Water Block ──────────────────────────────────────────────────
function WaterEntity({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle wave animation
      const t = state.clock.getElapsedTime()
      meshRef.current.position.y = (entity.position?.[1] || 0) + Math.sin(t * 0.8) * 0.08
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} colliders="cuboid">
      <Box ref={meshRef} args={entity.scale || [10, 0.5, 10]} receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#0ea5e9'}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Lava Block ───────────────────────────────────────────────────
function LavaEntity({ entity }: { entity: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.getElapsedTime() * 2) * 0.5
    }
  })

  return (
    <RigidBody type="fixed" position={entity.position} sensor userData={{ type: 'trigger', action: 'respawn' }}>
      <Box ref={meshRef} args={entity.scale || [10, 0.5, 10]} receiveShadow>
        <meshStandardMaterial
          color={entity.color || '#f97316'}
          emissive={'#ef4444'}
          emissiveIntensity={1.5}
          roughness={0.9}
          metalness={0.1}
          toneMapped={false}
        />
      </Box>
    </RigidBody>
  )
}

// ─── Main Scene Builder ───────────────────────────────────────────
export function SceneBuilder({ schema }: { schema: any }) {
  if (!schema || !schema.entities) return null

  const fogColor = schema.environment?.fogColor || '#87CEEB'
  const fogNear = schema.environment?.fogNear || 50
  const fogFar = schema.environment?.fogFar || 200

  return (
    <>
      <color attach="background" args={[schema.environment?.skyColor || '#87CEEB']} />

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight position={[-50, 50, -25]} intensity={0.5} color="#87CEEB" />
      <ContactShadows position={[0, -0.99, 0]} opacity={0.4} scale={100} blur={2} far={4} />

      {/* Entities */}
      {schema.entities.map((entity: any) => (
        <EntityRenderer key={entity.id} entity={entity} />
      ))}
    </>
  )
}
