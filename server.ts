// @ts-nocheck - Bypasses Next.js strict TS compiler for pure Node server script
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
// @ts-ignore - Node ESM requires the extension at runtime, but TS complains
import { getOrCreateRoom, getAllRooms } from './server/GameRoom.ts'
// @ts-ignore
import { startTickEngine } from './server/TickEngine.ts'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Rate limiting
const rateLimits = new Map<string, { move: number[], chat: number[] }>()
const MAX_MOVES_PER_SEC = 30
const MAX_CHATS_PER_SEC = 5

function checkRateLimit(socketId: string, type: 'move' | 'chat'): boolean {
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, { move: [], chat: [] })
  }
  const limits = rateLimits.get(socketId)!
  const now = Date.now()
  const timestamps = limits[type]

  // Remove timestamps older than 1 second
  while (timestamps.length > 0 && now - timestamps[0] > 1000) {
    timestamps.shift()
  }

  const max = type === 'move' ? MAX_MOVES_PER_SEC : MAX_CHATS_PER_SEC
  if (timestamps.length >= max) return false

  timestamps.push(now)
  return true
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    cors: { origin: '*' },
    pingInterval: 5000,
    pingTimeout: 10000
  })

  // Start the tick engine
  const tickTimer = startTickEngine(io)

  // API endpoint for active player counts
  server.on('request', (req, res) => {
    if (req.url === '/api/rooms' && req.method === 'GET') {
      const rooms = getAllRooms()
      const data: Record<string, number> = {}
      for (const [id, room] of rooms) {
        data[id] = room.players.size
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
      return
    }
  })

  io.on('connection', (socket) => {
    console.log('[Server] Client connected:', socket.id)

    socket.on('join', async ({ gameId, username, position }) => {
      socket.join(gameId)

      const room = getOrCreateRoom(gameId)
      await room.load()

      room.addPlayer(socket.id, {
        id: socket.id,
        username,
        position: position || [0, 5, 0],
        rotation: [0, 0, 0],
        velocity: [0, 0, 0]
      })

      // Send full room snapshot to the new player
      const snapshot = room.getSnapshot()
      socket.emit('room-snapshot', {
        players: snapshot.players.filter(p => p.id !== socket.id),
        chatHistory: snapshot.chatHistory
      })

      // Broadcast join to others
      socket.to(gameId).emit('player-joined', room.players.get(socket.id))

      // System message
      const sysMsg = {
        id: `sys-${Date.now()}`,
        username: 'SYSTEM',
        message: `${username} joined the game`,
        type: 'system' as const,
        timestamp: Date.now()
      }
      room.addChatMessage(sysMsg)
      io.to(gameId).emit('chat-message', sysMsg)

      console.log(`[Server] ${username} joined room ${gameId} (${room.players.size} players)`)
    })

    socket.on('move', ({ position, rotation }) => {
      if (!checkRateLimit(socket.id, 'move')) return

      // Find which room this socket is in
      for (const [gameId, room] of getAllRooms()) {
        if (room.players.has(socket.id)) {
          room.updatePlayerPosition(socket.id, position, rotation)
          break
        }
      }
    })

    socket.on('heartbeat', () => {
      for (const [, room] of getAllRooms()) {
        if (room.players.has(socket.id)) {
          room.heartbeat(socket.id)
          break
        }
      }
      socket.emit('heartbeat-ack')
    })

    socket.on('chat', ({ message }) => {
      if (!checkRateLimit(socket.id, 'chat')) return

      for (const [gameId, room] of getAllRooms()) {
        const player = room.players.get(socket.id)
        if (player) {
          // Check for commands
          if (message.startsWith('/')) {
            handleCommand(io, socket, room, player, message)
            return
          }

          const chatMsg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            username: player.username,
            message,
            type: 'user' as const,
            timestamp: Date.now()
          }
          room.addChatMessage(chatMsg, player.userId)
          io.to(gameId).emit('chat-message', chatMsg)
          break
        }
      }
    })

    // Block operations
    socket.on('block-place', ({ entity }) => {
      for (const [gameId, room] of getAllRooms()) {
        if (room.players.has(socket.id)) {
          room.placeBlock(entity)
          socket.to(gameId).emit('block-placed', entity)
          break
        }
      }
    })

    socket.on('block-destroy', ({ entityId }) => {
      for (const [gameId, room] of getAllRooms()) {
        if (room.players.has(socket.id)) {
          room.destroyBlock(entityId)
          socket.to(gameId).emit('block-destroyed', entityId)
          break
        }
      }
    })

    socket.on('block-update', ({ entityId, updates }) => {
      for (const [gameId, room] of getAllRooms()) {
        if (room.players.has(socket.id)) {
          room.updateBlock(entityId, updates)
          socket.to(gameId).emit('block-updated', { entityId, updates })
          break
        }
      }
    })

    socket.on('disconnect', () => {
      rateLimits.delete(socket.id)

      for (const [gameId, room] of getAllRooms()) {
        const player = room.removePlayer(socket.id)
        if (player) {
          socket.to(gameId).emit('player-left', socket.id)

          const sysMsg = {
            id: `sys-${Date.now()}`,
            username: 'SYSTEM',
            message: `${player.username} left the game`,
            type: 'system' as const,
            timestamp: Date.now()
          }
          room.addChatMessage(sysMsg)
          io.to(gameId).emit('chat-message', sysMsg)

          console.log(`[Server] ${player.username} left room ${gameId} (${room.players.size} players)`)
          break
        }
      }
    })
  })

  server.once('error', (err) => {
    console.error(err)
    clearInterval(tickTimer)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

// Chat command handler
function handleCommand(io: Server, socket: any, room: any, player: any, message: string) {
  const parts = message.split(' ')
  const cmd = parts[0].toLowerCase()

  switch (cmd) {
    case '/respawn': {
      socket.emit('force-respawn')
      const sysMsg = {
        id: `sys-${Date.now()}`,
        username: 'SYSTEM',
        message: `${player.username} respawned`,
        type: 'system' as const,
        timestamp: Date.now()
      }
      room.addChatMessage(sysMsg)
      io.to(room.id).emit('chat-message', sysMsg)
      break
    }
    case '/tp': {
      if (parts.length >= 4) {
        const x = parseFloat(parts[1])
        const y = parseFloat(parts[2])
        const z = parseFloat(parts[3])
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          socket.emit('force-teleport', { position: [x, y, z] })
          const sysMsg = {
            id: `sys-${Date.now()}`,
            username: 'SYSTEM',
            message: `${player.username} teleported to (${x}, ${y}, ${z})`,
            type: 'system' as const,
            timestamp: Date.now()
          }
          room.addChatMessage(sysMsg)
          io.to(room.id).emit('chat-message', sysMsg)
        }
      }
      break
    }
    default: {
      socket.emit('chat-message', {
        id: `sys-${Date.now()}`,
        username: 'SYSTEM',
        message: `Unknown command: ${cmd}`,
        type: 'system',
        timestamp: Date.now()
      })
    }
  }
}
