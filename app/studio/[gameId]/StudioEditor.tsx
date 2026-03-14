'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import { updateGameSchema } from './actions'

export function StudioEditor({ initialSchema, gameId }: { initialSchema: any, gameId: string }) {
  const [schema, setSchema] = useState(initialSchema)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateGameSchema(gameId, JSON.stringify(schema))
    } catch (error) {
      console.error('Failed to save schema', error)
    }
    setIsSaving(false)
  }

  const addEntity = (type: string) => {
    const newEntity = {
      id: `${type}-${Date.now()}`,
      type,
      position: [0, 5, 0],
      scale: [2, 2, 2],
      color: type === 'killZone' ? '#ef4444' : '#ffffff',
      physics: type === 'killZone' ? 'fixed' : 'dynamic'
    }
    setSchema({
      ...schema,
      entities: [...schema.entities, newEntity]
    })
    setSelectedEntityId(newEntity.id)
  }

  const updateEntityPosition = (id: string, position: [number, number, number]) => {
    setSchema({
      ...schema,
      entities: schema.entities.map((e: any) => e.id === id ? { ...e, position } : e)
    })
  }

  return (
    <div className="flex-1 flex w-full h-full bg-system-bg">
      <div className="w-64 border-r-2 border-system-fg bg-system-bg flex flex-col z-10 relative">
        <div className="p-4 border-b-2 border-system-fg mt-24">
          <h3 className="font-bold uppercase">Tools</h3>
        </div>
        <div className="p-4 flex flex-col gap-2 border-b-2 border-system-fg">
          <button onClick={() => addEntity('block')} className="brutal-button text-sm">Add Block</button>
          <button onClick={() => addEntity('killZone')} className="brutal-button text-sm border-system-error text-system-error hover:bg-system-error hover:text-system-bg">Add KillZone</button>
        </div>
        <div className="p-4 flex flex-col gap-2 border-b-2 border-system-fg">
          <h4 className="font-mono text-xs text-system-fg/50 mb-2">TRANSFORM MODE</h4>
          <div className="flex gap-2">
            <button onClick={() => setTransformMode('translate')} className={`flex-1 brutal-border p-1 text-xs uppercase ${transformMode === 'translate' ? 'bg-system-fg text-system-bg' : ''}`}>Move</button>
            <button onClick={() => setTransformMode('scale')} className={`flex-1 brutal-border p-1 text-xs uppercase ${transformMode === 'scale' ? 'bg-system-fg text-system-bg' : ''}`}>Scale</button>
          </div>
        </div>
        <div className="p-4 mt-auto">
          <button onClick={handleSave} disabled={isSaving} className="brutal-button w-full bg-system-accent text-system-bg border-system-accent hover:bg-system-fg hover:text-system-bg hover:border-system-fg">
            {isSaving ? 'SAVING...' : 'SAVE WORLD'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
          <color attach="background" args={[schema.environment?.skyColor || '#0f172a']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
          
          <OrbitControls makeDefault />
          
          {schema.entities.map((entity: any) => (
            <group key={entity.id} position={entity.position} onClick={(e) => { e.stopPropagation(); setSelectedEntityId(entity.id) }}>
              <mesh castShadow receiveShadow scale={entity.scale || [1, 1, 1]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={entity.color || '#ffffff'} emissive={entity.type === 'killZone' ? entity.color : '#000000'} emissiveIntensity={0.5} />
              </mesh>
              {selectedEntityId === entity.id && (
                <TransformControls 
                  mode={transformMode}
                  onMouseUp={(e: any) => {
                    const obj = e?.target?.object
                    if (obj) {
                      updateEntityPosition(entity.id, [obj.position.x, obj.position.y, obj.position.z])
                    }
                  }}
                />
              )}
            </group>
          ))}
          
          <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.01, 0]} />
        </Canvas>
      </div>
    </div>
  )
}
