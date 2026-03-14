import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function Home() {
  const games = await prisma.game.findMany({
    include: { creator: true },
    orderBy: { id: 'desc' }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-12 border-b-2 border-system-fg pb-4">
        <div>
          <h2 className="text-6xl font-black uppercase tracking-tighter">Hub</h2>
          <p className="font-mono text-system-accent mt-2">{'//'} DISCOVER_WORLDS</p>
        </div>
        <Link href="/studio/new" className="brutal-button">
          [+] Create World
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="brutal-panel border-dashed text-center py-24">
          <p className="font-mono text-system-fg/50 mb-4">NO_WORLDS_FOUND</p>
          <p className="text-xl">The grid is empty. Be the first to build.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <div key={game.id} className="brutal-panel flex flex-col group">
              <div className="h-48 bg-system-fg/10 border-b-2 border-system-fg -mx-6 -mt-6 mb-6 flex items-center justify-center overflow-hidden">
                <span className="font-mono text-system-fg/30 text-4xl group-hover:scale-110 transition-transform">
                  {game.title.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <h3 className="text-2xl font-bold uppercase truncate">{game.title}</h3>
              <p className="font-mono text-sm text-system-accent mt-2">
                BY: {game.creator.username}
              </p>
              <div className="mt-auto pt-6 flex gap-4">
                <Link href={`/play/${game.id}`} className="brutal-button flex-1 text-center">
                  PLAY
                </Link>
                <Link href={`/studio/${game.id}`} className="brutal-button bg-system-fg text-system-bg hover:bg-system-accent hover:text-system-fg">
                  EDIT
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
