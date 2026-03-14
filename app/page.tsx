import { prisma } from '@/lib/db'
import { AnimatedHome } from '@/components/AnimatedHome'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const games = await prisma.game.findMany({
    include: { creator: true },
    orderBy: { createdAt: 'desc' },
  })
  
  // Serialize dates to pass to client component safely
  const serializedGames = games.map(g => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    creator: {
      ...g.creator,
      createdAt: g.creator.createdAt.toISOString(),
    }
  }))

  return <AnimatedHome initialGames={serializedGames} />
}
