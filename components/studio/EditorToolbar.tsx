'use client'

interface EditorToolbarProps {
  transformMode: 'translate' | 'rotate' | 'scale'
  onTransformModeChange: (mode: 'translate' | 'rotate' | 'scale') => void
  snapValue: number
  onSnapChange: (val: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onPlayTest: () => void
  isSaving: boolean
  gameId: string
}

const SNAP_OPTIONS = [0, 0.25, 0.5, 1, 2, 4]

export function EditorToolbar({
  transformMode,
  onTransformModeChange,
  snapValue,
  onSnapChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPlayTest,
  isSaving,
  gameId
}: EditorToolbarProps) {
  return (
    <div className="h-10 bg-[#1e1e2e] border-b border-white/10 flex items-center px-3 gap-3 shrink-0">
      {/* Transform Mode */}
      <div className="flex rounded overflow-hidden border border-white/10">
        {[
          { mode: 'translate' as const, label: 'Move', shortcut: 'G', icon: '✥' },
          { mode: 'rotate' as const, label: 'Rotate', shortcut: 'R', icon: '↻' },
          { mode: 'scale' as const, label: 'Scale', shortcut: 'S', icon: '⤡' },
        ].map(({ mode, label, shortcut, icon }) => (
          <button
            key={mode}
            onClick={() => onTransformModeChange(mode)}
            className={`px-2.5 py-1 text-xs font-mono flex items-center gap-1 transition-colors ${
              transformMode === mode
                ? 'bg-blue-500/30 text-blue-400'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
            title={`${label} (${shortcut})`}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Snap */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-white/40">SNAP:</span>
        <select
          value={snapValue}
          onChange={(e) => onSnapChange(parseFloat(e.target.value))}
          className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-white/80 outline-none"
        >
          {SNAP_OPTIONS.map(v => (
            <option key={v} value={v}>{v === 0 ? 'Off' : `${v}u`}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 bg-white/10" />

      {/* Undo / Redo */}
      <div className="flex gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${canUndo ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >↩ Undo</button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${canRedo ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'}`}
          title="Redo (Ctrl+Shift+Z)"
        >↪ Redo</button>
      </div>

      <div className="flex-1" />

      {/* Right side: Play Test + Save */}
      <button
        onClick={onPlayTest}
        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1"
      >
        ▶ Play Test
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded text-xs font-mono font-bold transition-colors disabled:opacity-50"
      >
        {isSaving ? '⏳ Saving...' : '💾 Save'}
      </button>
    </div>
  )
}
