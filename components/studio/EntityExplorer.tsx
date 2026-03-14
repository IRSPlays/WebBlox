'use client'

import { useRef, useEffect } from 'react'

interface EntityExplorerProps {
  entities: any[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

const TYPE_ICONS: Record<string, string> = {
  block: '🟫', sphere: '🔵', cylinder: '🔘', ramp: '📐',
  movingPlatform: '↔️', conveyor: '⏩', trampoline: '⬆️', spinner: '🔄',
  speedBoost: '⚡', checkpoint: '🏁', triggerZone: '🎯',
  pointLight: '💡', spawn: '📍', killZone: '💀', water: '🌊', lava: '🌋',
}

export function EntityExplorer({ entities, selectedId, onSelect, onDelete, onDuplicate }: EntityExplorerProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedId])

  return (
    <div className="h-40 bg-[#1e1e2e] border-t border-white/10 flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 shrink-0 flex justify-between items-center">
        <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">🗂️ Explorer</h3>
        <span className="text-[10px] font-mono text-white/30">{entities.length} entities</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entities.length === 0 ? (
          <p className="text-white/20 text-xs font-mono text-center py-4">No entities</p>
        ) : (
          entities.map(entity => (
            <div
              key={entity.id}
              ref={entity.id === selectedId ? selectedRef : undefined}
              onClick={() => onSelect(entity.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                onSelect(entity.id)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors text-xs font-mono border-l-2 ${
                entity.id === selectedId
                  ? 'bg-blue-500/20 text-white border-blue-500'
                  : 'text-white/60 hover:bg-white/5 border-transparent hover:text-white/80'
              }`}
            >
              <span className="shrink-0">{TYPE_ICONS[entity.type] || '❓'}</span>
              <span className="truncate flex-1">{entity.id}</span>
              <span className="text-white/20 text-[9px]">{entity.type}</span>
              {entity.id === selectedId && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(entity.id) }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Duplicate"
                  >📋</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(entity.id) }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >🗑️</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
