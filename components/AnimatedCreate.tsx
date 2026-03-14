'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, Sparkles, Wand2, Hammer, Loader2 } from 'lucide-react'

export function AnimatedCreate({ createGameAction }: { createGameAction: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true)
    // The action itself will run and redirect
  }

  return (
    <div className="w-full max-w-2xl px-6 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="glass-panel w-full p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-[1px] pointer-events-none">
          <Box className="w-64 h-64 text-primary" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 text-primary mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Initialize World</h1>
          <p className="text-white/50 mb-8">Define the core parameters for your new grid sector.</p>

          <form action={createGameAction} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                World Designation
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full glass-input text-lg font-medium"
                placeholder="e.g. Neon Cyber City"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" />
                Creator Identity
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full glass-input"
                placeholder="Enter your username"
                autoComplete="off"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full glass-button-primary h-14 flex items-center justify-center gap-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Constructing Sector...</span>
                  </>
                ) : (
                  <>
                    <Hammer className="w-5 h-5" />
                    <span>Generate World</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
