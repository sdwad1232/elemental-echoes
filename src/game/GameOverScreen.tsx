import { GameStats } from './types';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ stats, onRestart, onMenu }: GameOverScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h2 className="font-display text-4xl md:text-6xl text-destructive tracking-tight">
            Fallen
          </h2>
          <p className="mt-3 text-muted-foreground font-body text-sm">
            The elements have overwhelmed you...
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 bg-card/50 rounded-xl p-6 border border-border/50 min-w-[280px]">
          <div className="text-center">
            <p className="text-2xl font-display text-primary">{stats.level}</p>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Level</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display text-primary">{stats.kills}</p>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Kills</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display text-primary">{stats.realmsVisited.size}</p>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Realms</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display text-primary">{stats.attackPower}</p>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">ATK Power</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="font-display text-sm tracking-[0.2em] uppercase px-8 py-3 rounded-lg border border-primary/40 text-primary hover:border-primary/70 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(42 90% 55% / 0.1), transparent)' }}
          >
            Try Again
          </button>
          <button
            onClick={onMenu}
            className="font-body text-sm px-6 py-3 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
