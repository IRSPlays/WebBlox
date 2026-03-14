import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GameCanvas } from '@/components/GameCanvas'
import { ChatBox } from '@/components/ChatBox'

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
    <div className="flex-1 flex flex-col h-full relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-2xl font-black uppercase tracking-tighter bg-system-bg/80 p-2 brutal-border">{game.title}</h2>
        <p className="font-mono text-system-accent bg-system-bg/80 p-2 brutal-border border-t-0">
          {'//'} CREATOR: {game.creator.username}
        </p>
      </div>
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <p className="font-mono text-system-fg bg-system-bg/80 p-2 brutal-border pointer-events-none text-right">
          WASD: MOVE | SPACE: JUMP<br/>
          CLICK & DRAG: LOOK AROUND<br/>
          V: TOGGLE CAMERA
        </p>
        <Link 
          href={`/studio/${game.id}`}
          className="font-mono font-bold bg-system-accent text-system-bg px-4 py-2 brutal-border hover:bg-system-fg transition-colors"
        >
          EDIT WORLD
        </Link>
      </div>
      
      <ChatBox />

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 flex items-center justify-center">
        <div className="w-full h-[2px] bg-white/80 absolute" />
        <div className="h-full w-[2px] bg-white/80 absolute" />
      </div>

      <div className="flex-1 w-full h-full bg-system-bg cursor-crosshair">
        <GameCanvas schema={schema} gameId={game.id} />
      </div>
    </div>
  )
}
