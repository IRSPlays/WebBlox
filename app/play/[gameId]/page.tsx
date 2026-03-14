import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GameCanvas } from '@/components/GameCanvas'
import { ChatBox } from '@/components/ChatBox'
import { Menu, MessageSquare, Users, Edit3 } from 'lucide-react'

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { creator: true }
  })

  if (!game) {
    notFound()
  }

  const schema = JSON.parse(game.json_schema)

  return (
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-black">
      {/* Top Bar - Left: Menu & Chat Toggles */}
      <div className="absolute top-0 left-0 w-full h-12 pointer-events-none z-20 flex justify-between px-2 pt-2">
        <div className="flex gap-2 pointer-events-auto">
          <button className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white transition-colors group">
            <Menu size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button className="w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white transition-colors group">
            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Top Bar - Right: Leaderboard & Edit */}
        <div className="flex gap-2 pointer-events-auto h-min">
          <Link 
            href={`/studio/${game.id}`}
            className="h-10 px-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors group gap-2 text-sm font-medium"
          >
            <Edit3 size={16} />
            <span className="hidden sm:inline">Studio</span>
          </Link>

          {/* Leaderboard Panel */}
          <div className="w-48 bg-black/40 backdrop-blur-md rounded border border-white/10 flex flex-col overflow-hidden text-white/90">
            <div className="bg-black/40 px-3 py-2 text-xs font-bold tracking-wider flex justify-between items-center border-b border-white/10 uppercase">
              <span>Players</span>
              <Users size={14} className="text-white/50" />
            </div>
            <div className="flex flex-col p-1">
              {/* Creator entry */}
              <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded text-sm transition-colors cursor-pointer">
                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  {game.creator.username[0].toUpperCase()}
                </div>
                <span className="truncate flex-1 font-medium">{game.creator.username}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">VIP</span>
              </div>
              {/* Note: Other active players will be populated via MultiplayerManager context in the future */}
            </div>
          </div>
        </div>
      </div>
      
      <ChatBox />

      {/* Classic Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none z-10 opacity-70">
        <div className="absolute top-1/2 left-0 w-2 h-[2px] -translate-y-1/2 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-1/2 right-0 w-2 h-[2px] -translate-y-1/2 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-0 left-1/2 w-[2px] h-2 -translate-x-1/2 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
        <div className="absolute bottom-0 left-1/2 w-[2px] h-2 -translate-x-1/2 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
      </div>

      <div className="absolute inset-0 z-0 bg-black cursor-crosshair">
        <GameCanvas schema={schema} gameId={game.id} />
      </div>
    </div>
  )
}
