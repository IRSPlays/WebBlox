import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Rocket, Box } from 'lucide-react'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'WeBlox | UGC 3D Platform',
  description: 'A Next-Generation 3D Sandbox & Multiplayer Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased selection:bg-primary selection:text-white`}>
        {/* Dynamic Nav Bar */}
        <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 2xl:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.8)] transition-shadow">
              <Box className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-white">
              WEBLOX<span className="text-primary">_</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Discover
            </Link>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <Link href="/studio/new" className="glass-button-primary flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Create</span>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="pt-16 min-h-screen flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}
