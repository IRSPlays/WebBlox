'use client'

import { useState, useEffect, useRef } from 'react'
import { getSocket } from './MultiplayerManager'

interface ChatMessage {
  id: string
  username: string
  message: string
  type: 'user' | 'system' | 'command'
  timestamp: number
}

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const setupSocket = () => {
      const socket = getSocket()
      if (!socket) return false

      // Load chat history from room snapshot
      socket.on('room-snapshot', ({ chatHistory }: { chatHistory: ChatMessage[] }) => {
        if (chatHistory && chatHistory.length > 0) {
          setMessages(chatHistory)
        }
      })

      socket.on('chat-message', (msg: ChatMessage) => {
        setMessages(prev => [...prev.slice(-99), msg]) // Keep last 100
      })

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
        socket.off('room-snapshot')
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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`absolute top-14 left-2 z-20 w-[30%] min-w-[300px] max-w-[400px] flex flex-col pointer-events-none transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-0.5 max-h-[250px] pointer-events-auto [text-shadow:_1px_1px_1px_rgba(0,0,0,0.8)] custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && (
          <p className="text-white/50 text-[13px] font-sans italic py-2">Chat is ready.</p>
        )}
        {messages.map((msg, i) => (
          <div key={`${msg.id}-${i}`} className="flex gap-1.5 leading-relaxed bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors break-words">
            {msg.type === 'system' ? (
              <span className="text-red-400 font-bold text-[14px] font-sans [text-shadow:_1px_1px_0_rgba(0,0,0,1)]">
                {msg.message}
              </span>
            ) : (
              <span className="text-[14px] font-sans inline-block">
                <span className="font-bold text-gray-200">[{msg.username}]: </span>
                <span className="text-white ml-1">{msg.message}</span>
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="pointer-events-auto mt-1 mx-1 relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="To chat click here or press / key"
          className="w-full bg-black/40 hover:bg-black/60 focus:bg-black/80 backdrop-blur-md rounded border border-transparent focus:border-white/20 px-3 py-2 text-white font-sans text-[14px] transition-all duration-200 focus:outline-none placeholder:text-white/60 placeholder:font-medium shadow-sm custom-scrollbar"
          onKeyDown={(e) => e.stopPropagation()}
        />
        {/* We can hide the send button for genuine Roblox feel, users just hit Enter */}
      </form>
    </div>
  )
}
