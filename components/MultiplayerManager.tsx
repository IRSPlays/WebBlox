'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar } from './Avatar'

let socket: Socket | null = null

export const getSocket = () => socket

export function MultiplayerManager({ gameId, username, spawnPosition }: { gameId: string, username: string, spawnPosition: [number, number, number] }) {
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    socket = io()

    socket.on('connect', () => {
      socket?.emit('join', { gameId, username, position: spawnPosition })
    })

    socket.on('init-players', (initialPlayers) => {
      setPlayers(initialPlayers.filter((p: any) => p.id !== socket?.id))
    })

    socket.on('player-joined', (player) => {
      setPlayers((prev) => [...prev, player])
    })

    socket.on('player-moved', ({ id, position, rotation }) => {
      setPlayers((prev) => prev.map(p => p.id === id ? { ...p, position, rotation } : p))
    })

    socket.on('player-left', (id) => {
      setPlayers((prev) => prev.filter(p => p.id !== id))
    })

    return () => {
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

function OtherPlayer({ player }: { player: any }) {
  const groupRef = useRef<THREE.Group>(null)
  const [velocity, setVelocity] = useState(new THREE.Vector3())
  const lastPosition = useRef(new THREE.Vector3())
  
  useFrame((state, delta) => {
    if (groupRef.current && player.position) {
      const targetPos = new THREE.Vector3(player.position[0], player.position[1], player.position[2])
      
      // Calculate velocity for animation
      const currentPos = groupRef.current.position.clone()
      const dist = currentPos.distanceTo(targetPos)
      
      if (dist > 0.01) {
        const vel = targetPos.clone().sub(currentPos).divideScalar(delta)
        setVelocity(vel)
      } else {
        setVelocity(new THREE.Vector3(0, 0, 0))
      }

      // Smooth interpolation
      groupRef.current.position.lerp(targetPos, 0.2)
      
      if (player.rotation) {
        const targetRot = new THREE.Euler(player.rotation[0], player.rotation[1], player.rotation[2], 'YXZ')
        const targetQuat = new THREE.Quaternion().setFromEuler(targetRot)
        groupRef.current.quaternion.slerp(targetQuat, 0.2)
      }
    }
  })

  return (
    <group ref={groupRef} position={player.position || [0, 0, 0]}>
      <Avatar velocity={velocity} color="#3b82f6" />
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
