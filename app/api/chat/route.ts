import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('gameId')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { gameId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 100),
    include: { user: { select: { username: true } } }
  })

  return NextResponse.json(
    messages.reverse().map(m => ({
      id: m.id,
      username: m.user.username,
      message: m.content,
      type: m.type,
      timestamp: m.createdAt.getTime()
    }))
  )
}
