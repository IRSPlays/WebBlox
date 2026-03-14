import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { StudioEditor } from './StudioEditor'

export default async function StudioPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params
  
  const game = await prisma.game.findUnique({
    where: { id: gameId }
  })

  if (!game) {
    notFound()
  }

  // Parse schema or use empty if null
  let schema = { entities: [], environment: {} }
  try {
    if (game.json_schema) {
      schema = typeof game.json_schema === 'string' 
        ? JSON.parse(game.json_schema) 
        : game.json_schema
    }
  } catch (e) {
    console.error('Failed to parse json_schema:', e)
  }

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-black fixed top-0 left-0 z-50">
      <StudioEditor initialSchema={schema} gameId={game.id} />
    </div>
  )
}
