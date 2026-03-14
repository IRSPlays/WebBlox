'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar } from './Avatar'

let socket: Socket | null = null

export const getSocket = () => socket

interface PlayerData {
  id: string
  username: string
  position: [number, number, number]
  rotation: [number, number, number]
}

export function MultiplayerManager({ gameId, username, spawnPosition }: { gameId: string, username: string, spawnPosition: [number, number, number] }) {
  const [players, setPlayers] = useState<PlayerData[]>([])

  useEffect(() => {
    socket = io({
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('[Multiplayer] Connected:', socket?.id)
      socket?.emit('join', { gameId, username, position: spawnPosition })
    })

    // Full room snapshot on join
    socket.on('room-snapshot', ({ players: roomPlayers, chatHistory }) => {
      setPlayers(roomPlayers.filter((p: PlayerData) => p.id !== socket?.id))
    })

    socket.on('player-joined', (player: PlayerData) => {
      setPlayers((prev) => {
        if (prev.find(p => p.id === player.id)) return prev
        return [...prev, player]
      })
    })

    // 20Hz batched state updates from tick engine
    socket.on('state-update', (updates: Array<{ id: string, position: [number, number, number], rotation: [number, number, number] }>) => {
      setPlayers((prev) => {
        const newPlayers = [...prev]
        for (const update of updates) {
          if (update.id === socket?.id) continue
          const idx = newPlayers.findIndex(p => p.id === update.id)
          if (idx !== -1) {
            newPlayers[idx] = { ...newPlayers[idx], position: update.position, rotation: update.rotation }
          }
        }
        return newPlayers
      })
    })

    // Legacy per-player move (fallback)
    socket.on('player-moved', ({ id, position, rotation }: { id: string, position: [number, number, number], rotation: [number, number, number] }) => {
      setPlayers((prev) => prev.map(p => p.id === id ? { ...p, position, rotation } : p))
    })

    socket.on('player-left', (id: string) => {
      setPlayers((prev) => prev.filter(p => p.id !== id))
    })

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      socket?.emit('heartbeat')
    }, 5000)

    socket.on('reconnect', () => {
      console.log('[Multiplayer] Reconnected, re-joining...')
      socket?.emit('join', { gameId, username, position: spawnPosition })
    })

    return () => {
      clearInterval(heartbeatInterval)
      socket?.disconnect()
      socket = null
    }
  }, [gameId, username, spawnPosition])

  return (
    <>
      {players.map(player => (
        <OtherPlayer key={player.id} player={player} />
      ))}
    </>
  )
}

function OtherPlayer({ player }: { player: PlayerData }) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3())
  const targetQuat = useRef(new THREE.Quaternion())
  const velocity = useRef(new THREE.Vector3())
  const [currentVelocity, setCurrentVelocity] = useState(new THREE.Vector3())

  useFrame((state, delta) => {
    if (!groupRef.current || !player.position) return

    targetPos.current.set(player.position[0], player.position[1], player.position[2])

    // Calculate velocity for animation
    const dist = groupRef.current.position.distanceTo(targetPos.current)
    if (dist > 0.01) {
      velocity.current.copy(targetPos.current).sub(groupRef.current.position).divideScalar(Math.max(delta, 0.016))
      setCurrentVelocity(velocity.current.clone())
    } else {
      setCurrentVelocity(new THREE.Vector3())
    }

    // Smooth interpolation — lerp factor varies by distance for better feel
    const lerpFactor = Math.min(1, delta * 10)
    groupRef.current.position.lerp(targetPos.current, lerpFactor)

    if (player.rotation) {
      const targetRot = new THREE.Euler(player.rotation[0], player.rotation[1], player.rotation[2], 'YXZ')
      targetQuat.current.setFromEuler(targetRot)
      groupRef.current.quaternion.slerp(targetQuat.current, lerpFactor)
    }
  })

  return (
    <group ref={groupRef} position={player.position || [0, 0, 0]}>
      <Avatar velocity={currentVelocity} color="#3b82f6" />
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {player.username || 'Guest'}
      </Text>
    </group>
  )
}
