'use client'

import { useState, useEffect, useRef } from 'react'
import { getSocket } from './MultiplayerManager'

export function ChatBox() {
  const [messages, setMessages] = useState<{ id: string, username: string, message: string }[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    const setupSocket = () => {
      const socket = getSocket()
      if (!socket) return false

      const handleMessage = (msg: { id: string, username: string, message: string }) => {
        setMessages(prev => [...prev, msg])
      }

      socket.on('chat-message', handleMessage)
      return true
    }

    if (!setupSocket()) {
      interval = setInterval(() => {
        if (setupSocket()) {
          clearInterval(interval)
        }
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
      const socket = getSocket()
      if (socket) {
        socket.off('chat-message')
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const socket = getSocket()
    if (socket) {
      socket.emit('chat', { message: input })
      setInput('')
    }
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80 min-w-[250px] min-h-[150px] max-w-[80vw] max-h-[80vh] bg-system-bg/90 brutal-border flex flex-col pointer-events-auto resize overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 text-sm font-mono">
        {messages.map((msg, i) => (
          <div key={`${msg.id}-${i}`}>
            <span className="text-system-accent font-bold">{msg.username}: </span>
            <span className="text-system-fg">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex border-t-2 border-system-fg shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Press Enter to chat..."
          className="flex-1 bg-transparent p-2 text-system-fg font-mono focus:outline-none"
          onKeyDown={(e) => {
            // Stop propagation so it doesn't trigger movement
            e.stopPropagation()
          }}
        />
        <button type="submit" className="bg-system-accent text-system-bg px-4 font-bold border-l-2 border-system-fg hover:bg-system-fg">
          SEND
        </button>
      </form>
    </div>
  )
}
