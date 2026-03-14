'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { getSocket } from './MultiplayerManager'
import { Avatar } from './Avatar'

const SPEED = 8
const JUMP_FORCE = 8

export function PlayerController({ spawnPosition = [0, 5, 0] }: { spawnPosition?: [number, number, number] }) {
  const body = useRef<RapierRigidBody>(null)
  const group = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const lastEmitTime = useRef(0)
  const [isFirstPerson, setIsFirstPerson] = useState(false)
  const [velocity, setVelocity] = useState(new THREE.Vector3())
  
  // Custom camera controls state
  const isDragging = useRef(false)
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  
  // Simple WASD state
  const keys = useRef({ forward: false, backward: false, left: false, right: false, jump: false })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.code === 'KeyW') keys.current.forward = true
      if (e.code === 'KeyS') keys.current.backward = true
      if (e.code === 'KeyA') keys.current.left = true
      if (e.code === 'KeyD') keys.current.right = true
      if (e.code === 'Space') keys.current.jump = true
      if (e.code === 'KeyV') setIsFirstPerson(prev => !prev)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.code === 'KeyW') keys.current.forward = false
      if (e.code === 'KeyS') keys.current.backward = false
      if (e.code === 'KeyA') keys.current.left = false
      if (e.code === 'KeyD') keys.current.right = false
      if (e.code === 'Space') keys.current.jump = false
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName === 'INPUT') return
      // Right click or left click to drag
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true
      }
    }
    
    const handleMouseUp = () => {
      isDragging.current = false
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        cameraEuler.current.y -= e.movementX * 0.005
        cameraEuler.current.x -= e.movementY * 0.005
        
        // Clamp pitch to avoid flipping
        cameraEuler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraEuler.current.x))
      }
    }
    
    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('contextmenu', handleContextMenu)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gl.domElement])

  useFrame((state) => {
    if (!body.current || !group.current) return

    const currentVelocity = body.current.linvel()
    const position = body.current.translation()
    
    setVelocity(new THREE.Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z))

    // Apply custom camera rotation
    camera.quaternion.setFromEuler(cameraEuler.current)

    // Movement relative to camera
    const direction = new THREE.Vector3()
    const frontVector = new THREE.Vector3(0, 0, (keys.current.backward ? 1 : 0) - (keys.current.forward ? 1 : 0))
    const sideVector = new THREE.Vector3((keys.current.left ? 1 : 0) - (keys.current.right ? 1 : 0), 0, 0)

    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED)
    direction.applyEuler(camera.rotation)
    direction.y = 0 // Keep movement on the horizontal plane

    body.current.setLinvel({ x: direction.x, y: currentVelocity.y, z: direction.z }, true)

    // Jump (very basic, no ground check for now)
    if (keys.current.jump && Math.abs(currentVelocity.y) < 0.1) {
      body.current.setLinvel({ x: currentVelocity.x, y: JUMP_FORCE, z: currentVelocity.z }, true)
      keys.current.jump = false
    }

    // Rotate avatar to match camera yaw (but not pitch/roll)
    const euler = new THREE.Euler(0, cameraEuler.current.y, 0, 'YXZ')
    group.current.quaternion.setFromEuler(euler)

    // Camera follow
    if (isFirstPerson) {
      camera.position.set(position.x, position.y + 1.5, position.z)
    } else {
      // Third person camera
      const distance = 5
      const cameraDirection = new THREE.Vector3(0, 0, -1).applyEuler(cameraEuler.current)
      
      camera.position.set(
        position.x - cameraDirection.x * distance,
        position.y + 1.5 - cameraDirection.y * distance,
        position.z - cameraDirection.z * distance
      )
    }

    // Emit position
    const now = Date.now()
    if (now - lastEmitTime.current > 50) { // 20 times per second
      const socket = getSocket()
      if (socket) {
        socket.emit('move', { 
          position: [position.x, position.y, position.z],
          rotation: [0, cameraEuler.current.y, 0] // Send yaw rotation
        })
      }
      lastEmitTime.current = now
    }
  })

  return (
    <>
      <RigidBody ref={body} position={spawnPosition} colliders="cuboid" lockRotations>
        <group ref={group}>
          <group visible={!isFirstPerson}>
            <Avatar velocity={velocity} />
          </group>
          {/* Invisible collider mesh */}
          <mesh visible={false}>
            <boxGeometry args={[1.5, 3, 1.5]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      </RigidBody>
    </>
  )
}
