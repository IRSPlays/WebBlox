import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'WeBlox | UGC 3D Platform',
  description: 'Full-Stack User Generated Content (UGC) 3D Multiplayer Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-system-bg text-system-fg font-sans antialiased min-h-screen flex flex-col">
        <header className="border-b-2 border-system-fg p-4 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tighter">WeBlox<span className="text-system-accent">_</span></h1>
          <nav className="flex gap-4 font-mono text-sm">
            <a href="/" className="hover:text-system-accent uppercase">Hub</a>
            <a href="/login" className="hover:text-system-accent uppercase">Login</a>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
