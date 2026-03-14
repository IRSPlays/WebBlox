'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Box, Play, PenTool, LayoutDashboard, Heart, ArrowRight } from 'lucide-react'

export function AnimatedHome({ initialGames }: { initialGames: any[] }) {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="w-full max-w-7xl px-6 py-12 md:py-20 flex flex-col items-center">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center w-full max-w-3xl mb-24 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse-slow" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next-Gen Ecosystem Live
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-tight">
          BUILD. PLAY. <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 animate-pulse-slow">CONQUER.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
          Welcome to the grid. Discover immersive worlds crafted by the community, or launch the studio to engineer your own reality.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/studio/new" className="glass-button-primary px-8 py-4 text-base shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2">
            <PenTool className="w-5 h-5" />
            <span>Launch Studio</span>
          </Link>
          <a href="#discover" className="glass-button bg-white/5 px-8 py-4 text-base flex items-center justify-center gap-2 text-white/70 hover:text-white">
            <LayoutDashboard className="w-5 h-5" />
            <span>Explore Worlds</span>
          </a>
        </div>
      </motion.div>

      {/* Discover Section */}
      <div id="discover" className="w-full">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Discover Worlds</h2>
            <p className="text-sm text-white/40 mt-1">Trending experiences tailored for the grid.</p>
          </div>
          <Link href="/studio/new" className="text-sm font-medium text-primary hover:text-blue-300 transition-colors flex items-center gap-1 group">
            Create yours <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {initialGames.length === 0 ? (
          <div className="glass-panel w-full py-32 flex flex-col items-center justify-center text-center">
            <Box className="w-12 h-12 text-white/20 mb-4 animate-float" />
            <h3 className="text-xl font-medium text-white/60 mb-2">The Grid is Empty</h3>
            <p className="text-white/40 text-sm mb-6">Be the first pioneer to construct a world.</p>
            <Link href="/studio/new" className="glass-button-primary">Initialize World</Link>
          </div>
        ) : (
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {initialGames.map((game) => (
              <motion.div key={game.id} variants={itemVars} className="group cursor-pointer">
                <div className="glass-panel h-full flex flex-col overflow-hidden relative">
                  {/* Thumbnail area */}
                  <div className="h-48 bg-gradient-to-br from-zinc-900 to-black border-b border-white/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                    <span className="font-black italic text-5xl text-white/10 group-hover:scale-110 transition-transform duration-500 z-10">
                      {game.title.substring(0, 2).toUpperCase()}
                    </span>
                    {/* Live indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 z-20">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                      <span className="text-[10px] font-mono text-white/80">LIVE</span>
                    </div>
                    {/* Hover overlay with quick play button */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-center justify-center">
                      <Link href={`/play/${game.id}`} className="w-14 h-14 rounded-full bg-primary/20 backdrop-blur-md border border-primary/50 text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Play className="w-6 h-6 ml-1" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Info area */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors line-clamp-1">{game.title}</h3>
                    {game.description && (
                      <p className="text-sm text-white/40 mt-2 line-clamp-2">{game.description}</p>
                    )}
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-white/30 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60">
                          {game.creator.username.charAt(0).toUpperCase()}
                        </span>
                        <span>{game.creator.username}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 hover:text-red-400 transition-colors">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{game.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit button (shows on hover of the whole card for creator... assuming anyone can edit in dev) */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                    <Link href={`/studio/${game.id}`} className="bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all block">
                      <PenTool className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
