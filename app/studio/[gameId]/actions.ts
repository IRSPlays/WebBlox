'use server'

import { prisma } from '@/lib/db'

export async function updateGameSchema(gameId: string, schema: string) {
  await prisma.game.update({
    where: { id: gameId },
    data: { json_schema: schema }
  })
}
