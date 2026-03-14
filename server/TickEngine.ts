// @ts-nocheck
import { Server } from 'socket.io'
// @ts-ignore
import { getAllRooms, destroyRoom } from './GameRoom.ts'

const TICK_RATE = 20 // 20Hz = 50ms per tick
const HEARTBEAT_TIMEOUT = 15_000 // 15 seconds

// Track last sent state for delta compression
const lastSentState = new Map<string, Map<string, { position: [number, number, number], rotation: [number, number, number] }>>()

export function startTickEngine(io: Server): NodeJS.Timeout {
  const interval = setInterval(() => {
    const rooms = getAllRooms()

    for (const [gameId, room] of rooms) {
      // Check for stale players
      const staleIds = room.getStalePlayerIds(HEARTBEAT_TIMEOUT)
      for (const socketId of staleIds) {
        const player = room.removePlayer(socketId)
        if (player) {
          io.to(gameId).emit('player-left', socketId)
          io.to(gameId).emit('chat-message', {
            id: `sys-${Date.now()}`,
            username: 'SYSTEM',
            message: `${player.username} timed out`,
            type: 'system',
            timestamp: Date.now()
          })
          console.log(`[TickEngine] Player ${player.username} timed out from room ${gameId}`)
        }
      }

      // Destroy empty rooms after save
      if (room.isEmpty) {
        destroyRoom(gameId)
        lastSentState.delete(gameId)
        continue
      }

      // Delta-compressed state broadcast
      if (!lastSentState.has(gameId)) {
        lastSentState.set(gameId, new Map())
      }
      const roomLastState = lastSentState.get(gameId)!

      const changedPlayers: Array<{ id: string, position: [number, number, number], rotation: [number, number, number] }> = []

      for (const player of room.getPlayerStates()) {
        const last = roomLastState.get(player.id)
        if (!last || !arraysEqual(last.position, player.position) || !arraysEqual(last.rotation, player.rotation)) {
          changedPlayers.push({
            id: player.id,
            position: player.position,
            rotation: player.rotation
          })
          roomLastState.set(player.id, {
            position: [...player.position],
            rotation: [...player.rotation]
          })
        }
      }

      // Clean up departed players from last state cache
      for (const [id] of roomLastState) {
        if (!room.players.has(id)) {
          roomLastState.delete(id)
        }
      }

      // Broadcast only if there are changes
      if (changedPlayers.length > 0) {
        io.to(gameId).emit('state-update', changedPlayers)
      }
    }
  }, 1000 / TICK_RATE)

  console.log(`[TickEngine] Started at ${TICK_RATE}Hz`)
  return interval
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.001) return false
  }
  return true
}
