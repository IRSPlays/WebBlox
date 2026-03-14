'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, Box, Sphere, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { updateGameSchema } from './actions'
import { Toolbox } from '@/components/studio/Toolbox'
import { PropertiesPanel } from '@/components/studio/PropertiesPanel'
import { EntityExplorer } from '@/components/studio/EntityExplorer'
import { EditorToolbar } from '@/components/studio/EditorToolbar'
import { useEditorHistory } from '@/hooks/useEditorHistory'

const TYPE_DEFAULTS: Record<string, Partial<any>> = {
  block: { scale: [2, 2, 2], physics: 'fixed' },
  sphere: { scale: [2, 2, 2], physics: 'dynamic' },
  cylinder: { scale: [2, 3, 2], physics: 'fixed' },
  ramp: { scale: [4, 0.5, 6], rotation: [-Math.PI / 6, 0, 0], physics: 'fixed' },
  movingPlatform: { scale: [4, 0.5, 4], physics: 'kinematic', endpoint: [5, 0, 0], speed: 2 },
  conveyor: { scale: [6, 0.3, 2], physics: 'fixed', speed: 5, axis: 'x' },
  trampoline: { scale: [2, 0.3, 2], physics: 'fixed', bounceForce: 20 },
  spinner: { scale: [6, 0.5, 1], physics: 'kinematic', speed: 2 },
  speedBoost: { scale: [3, 0.2, 3], physics: 'fixed', boostMultiplier: 2, boostDuration: 3 },
  checkpoint: { scale: [1, 3, 1], physics: 'fixed' },
  triggerZone: { scale: [3, 3, 3], physics: 'fixed', action: 'message', actionTarget: 'You entered a zone!' },
  killZone: { scale: [4, 0.5, 4], physics: 'fixed' },
  pointLight: { scale: [20, 20, 20], emissiveIntensity: 10 },
  spawn: { scale: [1, 1, 1] },
  water: { scale: [10, 0.5, 10], physics: 'fixed' },
  lava: { scale: [10, 0.5, 10], physics: 'fixed' },
}

export function StudioEditor({ initialSchema, gameId }: { initialSchema: any, gameId: string }) {
  const { state: schema, pushState: pushSchema, undo, redo, canUndo, canRedo } = useEditorHistory(initialSchema)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [snapValue, setSnapValue] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const transformRef = useRef<any>(null)

  const selectedEntity = schema.entities.find((e: any) => e.id === selectedEntityId)

  // ─── Auto-save ──────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await updateGameSchema(gameId, JSON.stringify(schema))
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, 10_000) // 10s of inactivity
  }, [gameId, schema])

  useEffect(() => {
    scheduleSave()
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [schema, scheduleSave])

  // ─── Manual save ────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    try {
      await updateGameSchema(gameId, JSON.stringify(schema))
    } catch (err) {
      console.error('Save failed:', err)
    }
    setIsSaving(false)
  }

  // ─── Add entity ─────────────────────────────────────────────
  const addEntity = useCallback((type: string, defaults: { color: string }) => {
    const typeDefaults = TYPE_DEFAULTS[type] || {}
    const newEntity: any = {
      id: `${type}-${Date.now()}`,
      type,
      position: [0, 3, 0] as number[],
      color: defaults.color,
      ...typeDefaults,
    }

    // If moving platform, set absolute endpoint
    if (type === 'movingPlatform') {
      newEntity.endpoint = [newEntity.position[0] + 5, newEntity.position[1], newEntity.position[2]]
    }

    const newSchema = {
      ...schema,
      entities: [...schema.entities, newEntity]
    }
    pushSchema(newSchema)
    setSelectedEntityId(newEntity.id)
  }, [schema, pushSchema])

  // ─── Update entity ──────────────────────────────────────────
  const updateEntity = useCallback((id: string, updates: Record<string, any>) => {
    const newSchema = {
      ...schema,
      entities: schema.entities.map((e: any) => e.id === id ? { ...e, ...updates } : e)
    }
    pushSchema(newSchema)
  }, [schema, pushSchema])

  // ─── Delete entity ──────────────────────────────────────────
  const deleteEntity = useCallback((id: string) => {
    const newSchema = {
      ...schema,
      entities: schema.entities.filter((e: any) => e.id !== id)
    }
    pushSchema(newSchema)
    if (selectedEntityId === id) setSelectedEntityId(null)
  }, [schema, pushSchema, selectedEntityId])

  // ─── Duplicate entity ───────────────────────────────────────
  const duplicateEntity = useCallback((id: string) => {
    const entity = schema.entities.find((e: any) => e.id === id)
    if (!entity) return
    const newId = `${entity.type}-${Date.now()}`
    const newEntity = {
      ...JSON.parse(JSON.stringify(entity)),
      id: newId,
      position: [entity.position[0] + 2, entity.position[1], entity.position[2]]
    }
    const newSchema = {
      ...schema,
      entities: [...schema.entities, newEntity]
    }
    pushSchema(newSchema)
    setSelectedEntityId(newId)
  }, [schema, pushSchema])

  // ─── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return

      if (e.code === 'KeyG') setTransformMode('translate')
      if (e.code === 'KeyR') setTransformMode('rotate')
      if (e.code === 'KeyS' && !e.ctrlKey) setTransformMode('scale')

      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedEntityId) deleteEntity(selectedEntityId)
      }

      if (e.ctrlKey && e.code === 'KeyD') {
        e.preventDefault()
        if (selectedEntityId) duplicateEntity(selectedEntityId)
      }

      if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }

      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEntityId, deleteEntity, duplicateEntity, undo, redo])

  // ─── Handle transform control changes ──────────────────────
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !selectedEntityId) return
    const obj = transformRef.current.object
    if (obj) {
      updateEntity(selectedEntityId, {
        position: [obj.position.x, obj.position.y, obj.position.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z]
      })
    }
  }, [selectedEntityId, updateEntity])

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#13131f] overflow-hidden">
      {/* Top Toolbar */}
      <EditorToolbar
        transformMode={transformMode}
        onTransformModeChange={setTransformMode}
        snapValue={snapValue}
        onSnapChange={setSnapValue}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onPlayTest={() => window.open(`/play/${gameId}`, '_blank')}
        isSaving={isSaving}
        gameId={gameId}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbox */}
        <Toolbox onAddEntity={addEntity} />

        {/* Center: 3D Viewport + Bottom Explorer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 3D Viewport */}
          <div className="flex-1 relative">
            <Canvas shadows camera={{ position: [15, 15, 15], fov: 50 }}>
              <color attach="background" args={['#1a1a2e']} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[20, 30, 10]} intensity={1.2} castShadow />
              <directionalLight position={[-10, 20, -10]} intensity={0.3} color="#6366f1" />

              <OrbitControls makeDefault />

              <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
                <GizmoViewport labelColor="white" axisHeadScale={1} />
              </GizmoHelper>

              {/* Grid */}
              <gridHelper args={[100, 100, '#334155', '#1e293b']} position={[0, -0.01, 0]} />
              <gridHelper args={[100, 20, '#475569', '#2d3a4f']} position={[0, -0.005, 0]} />

              {/* Entities */}
              {schema.entities.map((entity: any) => (
                <EditorEntity
                  key={entity.id}
                  entity={entity}
                  isSelected={entity.id === selectedEntityId}
                  onSelect={(id) => setSelectedEntityId(id)}
                  transformMode={transformMode}
                  snapValue={snapValue}
                  onTransformEnd={handleTransformChange}
                  transformRef={entity.id === selectedEntityId ? transformRef : undefined}
                />
              ))}
            </Canvas>
          </div>

          {/* Bottom: Explorer */}
          <EntityExplorer
            entities={schema.entities}
            selectedId={selectedEntityId}
            onSelect={setSelectedEntityId}
            onDelete={deleteEntity}
            onDuplicate={duplicateEntity}
          />
        </div>

        {/* Right: Properties */}
        <PropertiesPanel
          entity={selectedEntity}
          onUpdate={updateEntity}
          onDelete={deleteEntity}
          onDuplicate={duplicateEntity}
        />
      </div>
    </div>
  )
}

// ─── Editor Entity ────────────────────────────────────────────────
function EditorEntity({
  entity,
  isSelected,
  onSelect,
  transformMode,
  snapValue,
  onTransformEnd,
  transformRef
}: {
  entity: any
  isSelected: boolean
  onSelect: (id: string) => void
  transformMode: 'translate' | 'rotate' | 'scale'
  snapValue: number
  onTransformEnd: () => void
  transformRef?: React.MutableRefObject<any>
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  const getGeometry = () => {
    switch (entity.type) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }

  const getColor = () => {
    if (entity.type === 'spawn') return '#22d3ee'
    if (entity.type === 'killZone') return '#ef4444'
    if (entity.type === 'water') return '#0ea5e9'
    if (entity.type === 'lava') return '#f97316'
    return entity.color || '#ffffff'
  }

  const getEmissive = () => {
    if (['killZone', 'lava', 'trampoline', 'speedBoost', 'checkpoint'].includes(entity.type)) return getColor()
    if (entity.type === 'pointLight') return entity.color || '#ffffff'
    return '#000000'
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={entity.position || [0, 0, 0]}
        scale={entity.scale || [1, 1, 1]}
        rotation={entity.rotation || [0, 0, 0]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect(entity.id) }}
      >
        {getGeometry()}
        <meshStandardMaterial
          color={getColor()}
          roughness={entity.roughness ?? 0.7}
          metalness={entity.metalness ?? 0.1}
          emissive={getEmissive()}
          emissiveIntensity={isSelected ? 0.6 : (entity.emissiveIntensity ? 0.3 : 0.1)}
          transparent={entity.type === 'water' || entity.type === 'triggerZone'}
          opacity={entity.type === 'triggerZone' ? 0.3 : entity.type === 'water' ? 0.6 : 1}
          wireframe={entity.type === 'triggerZone'}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && meshRef.current && (
        <>
          <TransformControls
            ref={transformRef}
            object={meshRef.current}
            mode={transformMode}
            translationSnap={snapValue || undefined}
            rotationSnap={snapValue ? Math.PI / (180 / (snapValue * 15)) : undefined}
            scaleSnap={snapValue || undefined}
            onMouseUp={onTransformEnd}
          />
          {/* Selection wireframe */}
          <lineSegments position={entity.position || [0, 0, 0]} scale={(entity.scale || [1, 1, 1]).map((s: number) => s * 1.01)}>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color="#3b82f6" linewidth={2} />
          </lineSegments>
        </>
      )}
    </group>
  )
}
