'use client'

const ENTITY_CATEGORIES = [
  {
    name: 'Primitives',
    items: [
      { type: 'block', label: 'Block', icon: '🟫', color: '#ffffff' },
      { type: 'sphere', label: 'Sphere', icon: '🔵', color: '#3b82f6' },
      { type: 'cylinder', label: 'Cylinder', icon: '🔘', color: '#a855f7' },
      { type: 'ramp', label: 'Ramp', icon: '📐', color: '#a3a3a3' },
    ]
  },
  {
    name: 'Mechanics',
    items: [
      { type: 'movingPlatform', label: 'Moving Platform', icon: '↔️', color: '#f59e0b' },
      { type: 'conveyor', label: 'Conveyor Belt', icon: '⏩', color: '#6b7280' },
      { type: 'trampoline', label: 'Trampoline', icon: '⬆️', color: '#ec4899' },
      { type: 'spinner', label: 'Spinner', icon: '🔄', color: '#8b5cf6' },
      { type: 'speedBoost', label: 'Speed Boost', icon: '⚡', color: '#06b6d4' },
      { type: 'checkpoint', label: 'Checkpoint', icon: '🏁', color: '#22c55e' },
      { type: 'triggerZone', label: 'Trigger Zone', icon: '🎯', color: '#fbbf24' },
    ]
  },
  {
    name: 'Environment',
    items: [
      { type: 'pointLight', label: 'Point Light', icon: '💡', color: '#fef08a' },
      { type: 'spawn', label: 'Spawn Point', icon: '📍', color: '#22d3ee' },
      { type: 'killZone', label: 'Kill Zone', icon: '💀', color: '#ef4444' },
      { type: 'water', label: 'Water', icon: '🌊', color: '#0ea5e9' },
      { type: 'lava', label: 'Lava', icon: '🌋', color: '#f97316' },
    ]
  }
]

interface ToolboxProps {
  onAddEntity: (type: string, defaults: { color: string }) => void
}

export function Toolbox({ onAddEntity }: ToolboxProps) {
  return (
    <div className="w-56 bg-[#1e1e2e] border-r border-white/10 flex flex-col overflow-hidden">
      <div className="px-3 py-2 bg-white/5 border-b border-white/10 shrink-0">
        <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">🧰 Toolbox</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {ENTITY_CATEGORIES.map(category => (
          <div key={category.name} className="mb-3">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/30 px-1 mb-1">{category.name}</h4>
            <div className="grid grid-cols-2 gap-1">
              {category.items.map(item => (
                <button
                  key={item.type}
                  onClick={() => onAddEntity(item.type, { color: item.color })}
                  className="flex flex-col items-center gap-1 p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 transition-all text-white/80 hover:text-white group"
                  title={item.label}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-[9px] font-mono truncate w-full text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
