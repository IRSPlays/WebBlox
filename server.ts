import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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
    cors: {
      origin: '*',
    }
  })

  const players = new Map()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join', ({ gameId, username, position }) => {
      socket.join(gameId)
      players.set(socket.id, { id: socket.id, gameId, username, position, rotation: [0, 0, 0] })
      
      // Send all existing players in the room to the new player
      const roomPlayers = Array.from(players.values()).filter(p => p.gameId === gameId)
      socket.emit('init-players', roomPlayers)
      
      // Broadcast to others in the room
      socket.to(gameId).emit('player-joined', players.get(socket.id))
    })

    socket.on('move', ({ position, rotation }) => {
      const player = players.get(socket.id)
      if (player) {
        player.position = position
        player.rotation = rotation
        socket.to(player.gameId).emit('player-moved', { id: socket.id, position, rotation })
      }
    })

    socket.on('chat', ({ message }) => {
      const player = players.get(socket.id)
      if (player) {
        io.to(player.gameId).emit('chat-message', { id: Date.now().toString(), username: player.username, message })
      }
    })

    socket.on('disconnect', () => {
      const player = players.get(socket.id)
      if (player) {
        socket.to(player.gameId).emit('player-left', socket.id)
        players.delete(socket.id)
      }
      console.log('Client disconnected:', socket.id)
    })
  })

  server.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
