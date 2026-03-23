import { Element, Realm, GameStats, ELEMENTS, REALM_CONFIGS } from './types';

interface HUDProps {
  activeElement: Element;
  health: number;
  currentRealm: Realm;
  stats: GameStats;
  damageFlash: boolean;
  levelUpFlash: boolean;
  notification: string | null;
  onSwitchElement: (el: Element) => void;
  onBack: () => void;
}

export function HUD({
  activeElement, health, currentRealm, stats,
  damageFlash, levelUpFlash, notification,
  onSwitchElement, onBack,
}: HUDProps) {
  const elements: Element[] = ['fire', 'water', 'earth', 'air'];
  const realmConfig = REALM_CONFIGS[currentRealm];
  const xpPercent = (stats.xp / stats.xpToNext) * 100;

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Damage flash overlay */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/20 pointer-events-none transition-opacity" />
      )}
      {/* Level up flash */}
      {levelUpFlash && (
        <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none transition-opacity" />
      )}

      {/* Notification */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="font-display text-lg tracking-widest text-primary px-6 py-2 bg-background/70 backdrop-blur-sm rounded-lg border border-primary/30 animate-float">
            {notification}
          </div>
        </div>
      )}

      {/* Top left: Health + XP + Stats */}
      <div className="absolute top-5 left-5 flex flex-col gap-2 pointer-events-auto">
        {/* Realm name */}
        <div className="text-xs font-display tracking-[0.3em] uppercase text-muted-foreground">
          {realmConfig.name}
        </div>

        {/* Health bar */}
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50">
          <span className="text-xs font-body text-muted-foreground w-6">HP</span>
          <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(health / stats.maxHealth) * 100}%`,
                backgroundColor: health > stats.maxHealth * 0.5 ? '#4ade80' : health > stats.maxHealth * 0.25 ? '#fbbf24' : '#ef4444',
              }}
            />
          </div>
          <span className="text-[10px] font-body text-muted-foreground w-10 text-right">{health}/{stats.maxHealth}</span>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50">
          <span className="text-xs font-body text-primary w-6">Lv{stats.level}</span>
          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-primary"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-body text-muted-foreground w-10 text-right">{stats.xp}/{stats.xpToNext}</span>
        </div>

        {/* Kill counter */}
        <div className="flex items-center gap-3 text-[10px] font-body text-muted-foreground">
          <span>⚔ {stats.kills} kills</span>
          <span>⚡ {stats.attackPower} ATK</span>
          <span>🌍 {stats.realmsVisited.size}/4</span>
        </div>
      </div>

      {/* Top right: Menu */}
      <div className="absolute top-5 right-5 pointer-events-auto">
        <button
          onClick={onBack}
          className="bg-background/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border/50 text-xs font-body text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          ✕ Menu
        </button>
      </div>

      {/* Bottom center: Elements */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex gap-1.5 bg-background/60 backdrop-blur-sm rounded-xl p-1.5 border border-border/50 pointer-events-auto">
          {elements.map((el) => {
            const config = ELEMENTS[el];
            const isActive = el === activeElement;
            return (
              <button
                key={el}
                onClick={() => onSwitchElement(el)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: isActive ? config.color + '33' : 'transparent',
                  boxShadow: isActive ? `0 0 16px ${config.glowColor}40` : 'none',
                }}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="text-[9px] font-body uppercase tracking-wider" style={{ color: isActive ? config.color : '#555' }}>
                  {config.key}
                </span>
                {isActive && (
                  <span className="text-[8px] font-body" style={{ color: config.glowColor }}>
                    {config.ability}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom left: Controls */}
      <div className="absolute bottom-6 left-5 pointer-events-auto">
        <div className="bg-background/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border/30">
          <p className="text-[9px] font-body text-muted-foreground/70 leading-relaxed">
            WASD — Move · 1-4 — Elements<br />
            Space — Attack · Mouse — Camera
          </p>
        </div>
      </div>

      {/* Bottom right: Element weakness chart */}
      <div className="absolute bottom-6 right-5 pointer-events-auto">
        <div className="bg-background/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-border/30">
          <p className="text-[8px] font-body text-muted-foreground/60 leading-relaxed">
            🔥→🌿 💧→🔥 🌿→💨 💨→🌿<br />
            <span className="text-primary/50">2× damage vs weakness</span>
          </p>
        </div>
      </div>
    </div>
  );
}
