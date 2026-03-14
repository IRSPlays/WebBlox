import { createGame } from '@/app/actions';

export default function NewGamePage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <form action={createGame} className="brutal-panel w-full max-w-md flex flex-col gap-6">
        <div className="border-b-2 border-system-fg pb-4 mb-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">New World</h2>
          <p className="font-mono text-system-accent mt-2">{'//'} INITIALIZE_GRID</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="font-mono text-sm uppercase">World Title</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="brutal-input"
            placeholder="e.g. Brutal Parkour"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="font-mono text-sm uppercase">Creator Username</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="brutal-input"
            placeholder="e.g. Haziq"
          />
        </div>

        <button type="submit" className="brutal-button mt-4">
          [+] Initialize
        </button>
      </form>
    </div>
  );
}
