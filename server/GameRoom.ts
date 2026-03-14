import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PlayerState {
  id: string
  username: string
  userId?: string
  position: [number, number, number]
  rotation: [number, number, number]
  velocity: [number, number, number]
  lastHeartbeat: number
}

export interface ChatMsg {
  id: string
  username: string
  message: string
  type: 'user' | 'system' | 'command'
  timestamp: number
}

export interface WorldEntity {
  id: string
  type: string
  position: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  physics?: string
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
  // Mechanic-specific
  endpoint?: [number, number, number]
  speed?: number
  axis?: string
  action?: string
  actionTarget?: string
  bounceForce?: number
  boostMultiplier?: number
  boostDuration?: number
}

export interface WorldSchema {
  gameId: string
  name: string
  environment: {
    skyColor: string
    gravity: number
    fogColor?: string
    fogNear?: number
    fogFar?: number
    timeOfDay?: number
  }
  entities: WorldEntity[]
}

const MAX_CHAT_HISTORY = 50
const AUTO_SAVE_INTERVAL = 30_000 // 30 seconds

export class GameRoom {
  id: string
  players: Map<string, PlayerState> = new Map()
  worldState: WorldSchema | null = null
  chatHistory: ChatMsg[] = []
  private dirty = false
  private saveTimer: NodeJS.Timeout | null = null
  private loaded = false

  constructor(id: string) {
    this.id = id
  }

  async load(): Promise<WorldSchema | null> {
    if (this.loaded) return this.worldState

    try {
      const game = await prisma.game.findUnique({ where: { id: this.id } })
      if (game) {
        this.worldState = JSON.parse(game.json_schema) as WorldSchema
        this.loaded = true

        // Load recent chat history
        const messages = await prisma.chatMessage.findMany({
          where: { gameId: this.id },
          orderBy: { createdAt: 'desc' },
          take: MAX_CHAT_HISTORY,
          include: { user: true }
        })

        this.chatHistory = messages.reverse().map(m => ({
          id: m.id,
          username: m.user.username,
          message: m.content,
          type: m.type as ChatMsg['type'],
          timestamp: m.createdAt.getTime()
        }))
      }
    } catch (err) {
      console.error(`[GameRoom ${this.id}] Failed to load:`, err)
    }

    // Start auto-save timer
    this.saveTimer = setInterval(() => this.save(), AUTO_SAVE_INTERVAL)

    return this.worldState
  }

  async save(): Promise<void> {
    if (!this.dirty || !this.worldState) return
    try {
      await prisma.game.update({
        where: { id: this.id },
        data: { json_schema: JSON.stringify(this.worldState) }
      })
      this.dirty = false
      console.log(`[GameRoom ${this.id}] Auto-saved world state`)
    } catch (err) {
      console.error(`[GameRoom ${this.id}] Failed to save:`, err)
    }
  }

  addPlayer(socketId: string, player: Omit<PlayerState, 'lastHeartbeat'>): void {
    this.players.set(socketId, {
      ...player,
      lastHeartbeat: Date.now()
    })
  }

  removePlayer(socketId: string): PlayerState | undefined {
    const player = this.players.get(socketId)
    this.players.delete(socketId)
    return player
  }

  updatePlayerPosition(socketId: string, position: [number, number, number], rotation: [number, number, number]): void {
    const player = this.players.get(socketId)
    if (player) {
      player.position = position
      player.rotation = rotation
    }
  }

  heartbeat(socketId: string): void {
    const player = this.players.get(socketId)
    if (player) {
      player.lastHeartbeat = Date.now()
    }
  }

  getStalePlayerIds(timeoutMs: number = 15_000): string[] {
    const now = Date.now()
    const stale: string[] = []
    for (const [id, player] of this.players) {
      if (now - player.lastHeartbeat > timeoutMs) {
        stale.push(id)
      }
    }
    return stale
  }

  placeBlock(entity: WorldEntity): void {
    if (!this.worldState) return
    this.worldState.entities.push(entity)
    this.dirty = true
  }

  destroyBlock(entityId: string): WorldEntity | undefined {
    if (!this.worldState) return
    const idx = this.worldState.entities.findIndex(e => e.id === entityId)
    if (idx !== -1) {
      const [removed] = this.worldState.entities.splice(idx, 1)
      this.dirty = true
      return removed
    }
  }

  updateBlock(entityId: string, updates: Partial<WorldEntity>): void {
    if (!this.worldState) return
    const entity = this.worldState.entities.find(e => e.id === entityId)
    if (entity) {
      Object.assign(entity, updates)
      this.dirty = true
    }
  }

  async addChatMessage(msg: ChatMsg, userId?: string): Promise<void> {
    this.chatHistory.push(msg)
    if (this.chatHistory.length > MAX_CHAT_HISTORY) {
      this.chatHistory.shift()
    }
    // Persist to DB
    try {
      if (userId) {
        await prisma.chatMessage.create({
          data: {
            gameId: this.id,
            userId: userId,
            content: msg.message,
            type: msg.type
          }
        })
      }
    } catch (err) {
      console.error(`[GameRoom ${this.id}] Failed to persist chat:`, err)
    }
  }

  getSnapshot() {
    return {
      players: Array.from(this.players.values()),
      worldState: this.worldState,
      chatHistory: this.chatHistory
    }
  }

  getPlayerStates(): PlayerState[] {
    return Array.from(this.players.values())
  }

  get isEmpty(): boolean {
    return this.players.size === 0
  }

  async destroy(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
    }
    await this.save() // Final save
  }
}

// Room Manager
const rooms = new Map<string, GameRoom>()

export function getOrCreateRoom(gameId: string): GameRoom {
  let room = rooms.get(gameId)
  if (!room) {
    room = new GameRoom(gameId)
    rooms.set(gameId, room)
  }
  return room
}

export function getRoom(gameId: string): GameRoom | undefined {
  return rooms.get(gameId)
}

export async function destroyRoom(gameId: string): Promise<void> {
  const room = rooms.get(gameId)
  if (room) {
    await room.destroy()
    rooms.delete(gameId)
  }
}

export function getAllRooms(): Map<string, GameRoom> {
  return rooms
}
