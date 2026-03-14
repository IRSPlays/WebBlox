'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { getSocket } from './MultiplayerManager'
import { Avatar } from './Avatar'

const BASE_SPEED = 8
const JUMP_FORCE = 8
const FALL_RESPAWN_Y = -50

export function PlayerController({ spawnPosition = [0, 5, 0] }: { spawnPosition?: [number, number, number] }) {
  const body = useRef<RapierRigidBody>(null)
  const group = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const { world, rapier } = useRapier()
  const lastEmitTime = useRef(0)
  const [isFirstPerson, setIsFirstPerson] = useState(false)
  const [velocity, setVelocity] = useState(new THREE.Vector3())

  // Game mechanics state
  const checkpointPosition = useRef<[number, number, number]>(spawnPosition)
  const speedMultiplier = useRef(1)
  const speedBoostTimer = useRef<NodeJS.Timeout | null>(null)
  const isGrounded = useRef(false)
  const canJump = useRef(true)

  // Custom camera controls state
  const isDragging = useRef(false)
  const cameraEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  // WASD state
  const keys = useRef({ forward: false, backward: false, left: false, right: false, jump: false })

  // Respawn function
  const respawn = useCallback((pos?: [number, number, number]) => {
    if (!body.current) return
    const target = pos || checkpointPosition.current
    body.current.setTranslation({ x: target[0], y: target[1] + 2, z: target[2] }, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }, [])

  // Listen for server force commands
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRespawn = () => respawn()
    const handleTeleport = ({ position }: { position: [number, number, number] }) => respawn(position)

    socket.on('force-respawn', handleRespawn)
    socket.on('force-teleport', handleTeleport)

    return () => {
      socket.off('force-respawn', handleRespawn)
      socket.off('force-teleport', handleTeleport)
    }
  }, [respawn])

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
        cameraEuler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraEuler.current.x))
      }
    }

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

  useFrame(() => {
    if (!body.current || !group.current) return

    // ... later in useFrame
    const currentVelocity = body.current.linvel()
    const position = body.current.translation()

    setVelocity(new THREE.Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z))

    // ─── Ground detection via raycast ─────────────────────────
    const rayOrigin = { x: position.x, y: position.y, z: position.z }
    const rayDir = { x: 0, y: -1, z: 0 }
    const ray = new rapier.Ray(rayOrigin, rayDir)

    // Simple ground check: if vertical velocity is near zero and we're not rising
    isGrounded.current = Math.abs(currentVelocity.y) < 0.5

    // ─── Fall-off-map respawn ─────────────────────────────────
    if (position.y < FALL_RESPAWN_Y) {
      respawn()
      return
    }

    // ─── Apply camera rotation ────────────────────────────────
    camera.quaternion.setFromEuler(cameraEuler.current)

    // ─── Movement relative to camera ──────────────────────────
    const effectiveSpeed = BASE_SPEED * speedMultiplier.current
    const direction = new THREE.Vector3()
    const frontVector = new THREE.Vector3(0, 0, (keys.current.backward ? 1 : 0) - (keys.current.forward ? 1 : 0))
    const sideVector = new THREE.Vector3((keys.current.left ? 1 : 0) - (keys.current.right ? 1 : 0), 0, 0)

    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(effectiveSpeed)
    direction.applyEuler(camera.rotation)
    direction.y = 0

    body.current.setLinvel({ x: direction.x, y: currentVelocity.y, z: direction.z }, true)

    // ─── Jump ─────────────────────────────────────────────────
    if (keys.current.jump && isGrounded.current && canJump.current) {
      body.current.setLinvel({ x: currentVelocity.x, y: JUMP_FORCE, z: currentVelocity.z }, true)
      canJump.current = false
      setTimeout(() => { canJump.current = true }, 300)
    }

    // ─── Rotate avatar to camera yaw ──────────────────────────
    const euler = new THREE.Euler(0, cameraEuler.current.y, 0, 'YXZ')
    group.current.quaternion.setFromEuler(euler)

    // ─── Camera follow ────────────────────────────────────────
    if (isFirstPerson) {
      camera.position.set(position.x, position.y + 1.5, position.z)
    } else {
      const distance = 5
      const cameraDirection = new THREE.Vector3(0, 0, -1).applyEuler(cameraEuler.current)
      camera.position.set(
        position.x - cameraDirection.x * distance,
        position.y + 1.5 - cameraDirection.y * distance,
        position.z - cameraDirection.z * distance
      )
    }

    // ─── Emit position ────────────────────────────────────────
    const now = Date.now()
    if (now - lastEmitTime.current > 50) {
      const socket = getSocket()
      if (socket) {
        socket.emit('move', {
          position: [position.x, position.y, position.z],
          rotation: [0, cameraEuler.current.y, 0]
        })
      }
      lastEmitTime.current = now
    }
  })

  // Handle sensor collisions for game mechanics
  const handleSensorIntersection = useCallback((payload: any) => {
    const otherBody = payload.other?.rigidBody
    if (!otherBody || !body.current) return

    const userData = otherBody.userData as any
    if (!userData) return

    switch (userData.type) {
      case 'trampoline': {
        const force = userData.bounceForce || 20
        const vel = body.current.linvel()
        body.current.setLinvel({ x: vel.x, y: force, z: vel.z }, true)
        break
      }
      case 'speedBoost': {
        speedMultiplier.current = userData.boostMultiplier || 2
        if (speedBoostTimer.current) clearTimeout(speedBoostTimer.current)
        speedBoostTimer.current = setTimeout(() => {
          speedMultiplier.current = 1
        }, (userData.boostDuration || 3) * 1000)
        break
      }
      case 'checkpoint': {
        if (userData.checkpointPosition) {
          checkpointPosition.current = userData.checkpointPosition
        }
        break
      }
      case 'trigger': {
        if (userData.action === 'respawn') {
          respawn()
        } else if (userData.action === 'teleport' && userData.actionTarget) {
          try {
            const pos = JSON.parse(userData.actionTarget)
            respawn(pos)
          } catch {}
        }
        break
      }
    }
  }, [respawn])

  return (
    <>
      <RigidBody
        ref={body}
        position={spawnPosition}
        colliders="cuboid"
        lockRotations
        onIntersectionEnter={handleSensorIntersection}
      >
        <group ref={group}>
          <group visible={!isFirstPerson}>
            <Avatar velocity={velocity} />
          </group>
          <mesh visible={false}>
            <boxGeometry args={[1.5, 3, 1.5]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      </RigidBody>
    </>
  )
}
