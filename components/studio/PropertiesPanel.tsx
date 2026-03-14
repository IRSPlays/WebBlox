'use client'

import { useState } from 'react'

interface PropertiesPanelProps {
  entity: any | null
  onUpdate: (id: string, updates: Record<string, any>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function PropertiesPanel({ entity, onUpdate, onDelete, onDuplicate }: PropertiesPanelProps) {
  if (!entity) {
    return (
      <div className="w-64 bg-[#1e1e2e] border-l border-white/10 flex items-center justify-center">
        <p className="text-white/20 text-xs font-mono text-center px-4">Select an entity to<br/>view properties</p>
      </div>
    )
  }

  const handleVectorChange = (field: string, axis: number, value: string) => {
    const current = entity[field] || [0, 0, 0]
    const newVec = [...current]
    newVec[axis] = parseFloat(value) || 0
    onUpdate(entity.id, { [field]: newVec })
  }

  const handleChange = (field: string, value: any) => {
    onUpdate(entity.id, { [field]: value })
  }

  return (
    <div className="w-64 bg-[#1e1e2e] border-l border-white/10 flex flex-col overflow-hidden">
      <div className="px-3 py-2 bg-white/5 border-b border-white/10 shrink-0 flex justify-between items-center">
        <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">📋 Properties</h3>
        <span className="text-[9px] font-mono text-blue-400">{entity.type}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Name / ID */}
        <FieldGroup label="ID">
          <input
            value={entity.id}
            readOnly
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/40"
          />
        </FieldGroup>

        {/* Position */}
        <FieldGroup label="Position">
          <VectorInput
            value={entity.position || [0, 0, 0]}
            onChange={(axis, val) => handleVectorChange('position', axis, val)}
          />
        </FieldGroup>

        {/* Scale */}
        <FieldGroup label="Scale">
          <VectorInput
            value={entity.scale || [1, 1, 1]}
            onChange={(axis, val) => handleVectorChange('scale', axis, val)}
          />
        </FieldGroup>

        {/* Rotation */}
        <FieldGroup label="Rotation (deg)">
          <VectorInput
            value={(entity.rotation || [0, 0, 0]).map((r: number) => (r * 180 / Math.PI))}
            onChange={(axis, val) => {
              const rads = [...(entity.rotation || [0, 0, 0])]
              rads[axis] = (parseFloat(val) || 0) * Math.PI / 180
              onUpdate(entity.id, { rotation: rads })
            }}
          />
        </FieldGroup>

        {/* Color */}
        <FieldGroup label="Color">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={entity.color || '#ffffff'}
              onChange={(e) => handleChange('color', e.target.value)}
              className="w-8 h-8 rounded border border-white/20 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={entity.color || '#ffffff'}
              onChange={(e) => handleChange('color', e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80"
            />
          </div>
        </FieldGroup>

        {/* Material */}
        <FieldGroup label="Roughness">
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={entity.roughness ?? 0.7}
            onChange={(e) => handleChange('roughness', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-[10px] font-mono text-white/40">{(entity.roughness ?? 0.7).toFixed(2)}</span>
        </FieldGroup>

        <FieldGroup label="Metalness">
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={entity.metalness ?? 0.1}
            onChange={(e) => handleChange('metalness', parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-[10px] font-mono text-white/40">{(entity.metalness ?? 0.1).toFixed(2)}</span>
        </FieldGroup>

        {/* Physics */}
        <FieldGroup label="Physics">
          <select
            value={entity.physics || 'fixed'}
            onChange={(e) => handleChange('physics', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80"
          >
            <option value="fixed">Fixed</option>
            <option value="dynamic">Dynamic</option>
            <option value="kinematic">Kinematic</option>
          </select>
        </FieldGroup>

        {/* Type-specific properties */}
        {entity.type === 'movingPlatform' && (
          <>
            <FieldGroup label="Endpoint">
              <VectorInput
                value={entity.endpoint || [entity.position[0] + 5, entity.position[1], entity.position[2]]}
                onChange={(axis, val) => handleVectorChange('endpoint', axis, val)}
              />
            </FieldGroup>
            <FieldGroup label="Speed">
              <input
                type="number"
                value={entity.speed ?? 2}
                onChange={(e) => handleChange('speed', parseFloat(e.target.value) || 1)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80"
                step="0.5"
              />
            </FieldGroup>
          </>
        )}

        {entity.type === 'conveyor' && (
          <>
            <FieldGroup label="Speed">
              <input type="number" value={entity.speed ?? 5} onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="1" />
            </FieldGroup>
            <FieldGroup label="Axis">
              <select value={entity.axis || 'x'} onChange={(e) => handleChange('axis', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80">
                <option value="x">X</option>
                <option value="z">Z</option>
              </select>
            </FieldGroup>
          </>
        )}

        {entity.type === 'trampoline' && (
          <FieldGroup label="Bounce Force">
            <input type="number" value={entity.bounceForce ?? 20} onChange={(e) => handleChange('bounceForce', parseFloat(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="1" />
          </FieldGroup>
        )}

        {entity.type === 'speedBoost' && (
          <>
            <FieldGroup label="Boost Multiplier">
              <input type="number" value={entity.boostMultiplier ?? 2} onChange={(e) => handleChange('boostMultiplier', parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="0.5" />
            </FieldGroup>
            <FieldGroup label="Duration (s)">
              <input type="number" value={entity.boostDuration ?? 3} onChange={(e) => handleChange('boostDuration', parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="0.5" />
            </FieldGroup>
          </>
        )}

        {entity.type === 'spinner' && (
          <FieldGroup label="Spin Speed">
            <input type="number" value={entity.speed ?? 2} onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="0.5" />
          </FieldGroup>
        )}

        {entity.type === 'triggerZone' && (
          <>
            <FieldGroup label="Action">
              <select value={entity.action || 'message'} onChange={(e) => handleChange('action', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80">
                <option value="message">Show Message</option>
                <option value="teleport">Teleport</option>
                <option value="respawn">Respawn</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Action Target">
              <input type="text" value={entity.actionTarget || ''} onChange={(e) => handleChange('actionTarget', e.target.value)}
                placeholder={entity.action === 'teleport' ? '[x, y, z]' : 'Message text...'}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" />
            </FieldGroup>
          </>
        )}

        {entity.type === 'pointLight' && (
          <FieldGroup label="Intensity">
            <input type="number" value={entity.emissiveIntensity ?? 10} onChange={(e) => handleChange('emissiveIntensity', parseFloat(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white/80" step="1" />
          </FieldGroup>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
        <button
          onClick={() => onDuplicate(entity.id)}
          className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          title="Ctrl+D"
        >
          📋 Duplicate
        </button>
        <button
          onClick={() => onDelete(entity.id)}
          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          title="Delete"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────
function FieldGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function VectorInput({ value, onChange }: { value: number[], onChange: (axis: number, val: string) => void }) {
  const labels = ['X', 'Y', 'Z']
  const colors = ['text-red-400', 'text-green-400', 'text-blue-400']

  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex-1 flex items-center gap-1">
          <span className={`text-[9px] font-mono ${colors[i]}`}>{labels[i]}</span>
          <input
            type="number"
            value={parseFloat(value[i]?.toFixed(2)) || 0}
            onChange={(e) => onChange(i, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-white/80"
            step="0.5"
          />
        </div>
      ))}
    </div>
  )
}
