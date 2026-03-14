'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { SceneBuilder } from './SceneBuilder'
import { PlayerController } from './PlayerController'
import { MultiplayerManager } from './MultiplayerManager'

export function GameCanvas({ schema, gameId }: { schema: any, gameId: string }) {
  const [username] = useState(() => `Guest-${Math.floor(Math.random() * 1000)}`)
  const spawnEntity = schema.entities?.find((e: any) => e.type === 'spawn')
  const spawnPosition = spawnEntity ? spawnEntity.position : [0, 5, 0]

  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
      <Physics gravity={[0, schema.environment?.gravity || -30, 0]}>
        <SceneBuilder schema={schema} />
        <PlayerController spawnPosition={spawnPosition} />
        <MultiplayerManager gameId={gameId} username={username} spawnPosition={spawnPosition} />
      </Physics>
    </Canvas>
  )
}
