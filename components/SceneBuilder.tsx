'use client'

import { RigidBody } from '@react-three/rapier'
import { Box, Sky, Environment, ContactShadows, Stars } from '@react-three/drei'

export function SceneBuilder({ schema }: { schema: any }) {
  if (!schema || !schema.entities) return null;

  return (
    <>
      <color attach="background" args={[schema.environment?.skyColor || '#87CEEB']} />
      
      {/* Realistic Environment */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
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

      {/* Contact Shadows for better grounding */}
      <ContactShadows position={[0, -0.99, 0]} opacity={0.4} scale={100} blur={2} far={4} />

      {schema.entities.map((entity: any) => {
        if (entity.type === 'block') {
          // Determine material properties based on color to simulate different materials
          const isGrass = entity.color === '#2d4c1e' || entity.color === '#1e4c22'
          const isWood = entity.color === '#4a3018'
          const isStone = entity.color === '#555555'
          
          let roughness = 0.7
          let metalness = 0.1
          
          if (isGrass) { roughness = 0.9; metalness = 0.0 }
          if (isWood) { roughness = 0.8; metalness = 0.1 }
          if (isStone) { roughness = 0.6; metalness = 0.3 }

          return (
            <RigidBody key={entity.id} type={entity.physics === 'fixed' ? 'fixed' : 'dynamic'} position={entity.position}>
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
        if (entity.type === 'killZone') {
          return (
            <RigidBody key={entity.id} type="fixed" position={entity.position} sensor>
              <Box args={entity.scale || [1, 1, 1]}>
                <meshStandardMaterial color={entity.color || '#ef4444'} emissive={entity.color || '#ef4444'} emissiveIntensity={0.8} toneMapped={false} />
              </Box>
            </RigidBody>
          )
        }
        return null;
      })}
    </>
  )
}
