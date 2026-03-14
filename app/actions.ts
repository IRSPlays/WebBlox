'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function createGame(formData: FormData) {
  const title = formData.get('title') as string
  const username = formData.get('username') as string

  if (!title || !username) {
    throw new Error('Title and username are required')
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        avatar_colors: JSON.stringify(['#ef4444', '#3b82f6'])
      }
    })
  }

  const defaultSchema = {
    gameId: '',
    name: title,
    environment: { skyColor: '#87CEEB', gravity: -30 },
    entities: [
      { id: 'spawn-1', type: 'spawn', position: [0, 5, 0] },
      { id: 'floor-1', type: 'block', position: [0, -1, 0], scale: [100, 2, 100], color: '#2d4c1e', physics: 'fixed' },
      { id: 'tree-trunk-1', type: 'block', position: [5, 1, 5], scale: [1, 4, 1], color: '#4a3018', physics: 'fixed' },
      { id: 'tree-leaves-1', type: 'block', position: [5, 4, 5], scale: [3, 3, 3], color: '#1e4c22', physics: 'fixed' },
      { id: 'tree-trunk-2', type: 'block', position: [-8, 1, 12], scale: [1.2, 5, 1.2], color: '#4a3018', physics: 'fixed' },
      { id: 'tree-leaves-2', type: 'block', position: [-8, 5, 12], scale: [4, 4, 4], color: '#1e4c22', physics: 'fixed' },
      { id: 'rock-1', type: 'block', position: [10, 0, -5], scale: [2, 1.5, 2], color: '#555555', physics: 'fixed' },
      { id: 'wall-1', type: 'block', position: [-10, 2, -10], scale: [10, 4, 1], color: '#d2b48c', physics: 'fixed' },
      { id: 'wall-2', type: 'block', position: [-15, 2, -15], scale: [1, 4, 10], color: '#d2b48c', physics: 'fixed' },
      { id: 'wall-3', type: 'block', position: [-10, 2, -20], scale: [10, 4, 1], color: '#d2b48c', physics: 'fixed' },
      { id: 'roof-1', type: 'block', position: [-12.5, 4.5, -15], scale: [12, 1, 12], color: '#8b0000', physics: 'fixed' }
    ]
  }

  const game = await prisma.game.create({
    data: {
      title,
      creatorId: user.id,
      json_schema: JSON.stringify(defaultSchema)
    }
  })

  // Update schema with actual gameId
  defaultSchema.gameId = game.id
  await prisma.game.update({
    where: { id: game.id },
    data: { json_schema: JSON.stringify(defaultSchema) }
  })

  redirect(`/play/${game.id}`)
}
