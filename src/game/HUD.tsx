import { Element, Realm, GameStats, ELEMENTS, REALM_CONFIGS } from './types';

interface CombatHudData {
  combo: number;
  dashReady: boolean;
  abilityReady: boolean;
  abilityCooldownPercent: number;
  dashCooldownPercent: number;
}

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
  combatHud?: CombatHudData;
}

export function HUD({
  activeElement, health, currentRealm, stats,
  damageFlash, levelUpFlash, notification,
  onSwitchElement, onBack, combatHud,
}: HUDProps) {
  const elements: Element[] = ['fire', 'water', 'earth', 'air'];
  const realmConfig = REALM_CONFIGS[currentRealm];
  const xpPercent = (stats.xp / stats.xpToNext) * 100;
  const elConfig = ELEMENTS[activeElement];

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

      {/* Combo notification */}
      {combatHud && combatHud.combo >= 2 && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className="font-display text-2xl tracking-widest font-bold px-4 py-1 rounded-lg animate-pulse"
            style={{
              color: elConfig.glowColor,
              textShadow: `0 0 20px ${elConfig.glowColor}, 0 0 40px ${elConfig.glowColor}50`,
            }}
          >
            {combatHud.combo}× COMBO!
          </div>
        </div>
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

      {/* Right side: Ability cooldowns */}
      {combatHud && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
          {/* Dash */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl border-2 overflow-hidden"
              style={{
                borderColor: combatHud.dashReady ? elConfig.glowColor : '#333',
                backgroundColor: combatHud.dashReady ? elConfig.color + '20' : '#11111180',
              }}
            >
              {!combatHud.dashReady && (
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all"
                  style={{
                    height: `${combatHud.dashCooldownPercent * 100}%`,
                    backgroundColor: elConfig.color + '30',
                  }}
                />
              )}
            </div>
            <span className="relative text-lg z-10">💨</span>
            <span className="absolute -bottom-4 text-[8px] font-body text-muted-foreground">SHIFT</span>
          </div>

          {/* Ability */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl border-2 overflow-hidden"
              style={{
                borderColor: combatHud.abilityReady ? elConfig.glowColor : '#333',
                backgroundColor: combatHud.abilityReady ? elConfig.color + '20' : '#11111180',
                boxShadow: combatHud.abilityReady ? `0 0 12px ${elConfig.glowColor}40` : 'none',
              }}
            >
              {!combatHud.abilityReady && (
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all"
                  style={{
                    height: `${combatHud.abilityCooldownPercent * 100}%`,
                    backgroundColor: elConfig.color + '30',
                  }}
                />
              )}
            </div>
            <span className="relative text-lg z-10">{elConfig.icon}</span>
            <span className="absolute -bottom-4 text-[8px] font-body text-muted-foreground">E</span>
          </div>
        </div>
      )}

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
            Space — Attack · Shift — Dash · E — Ability
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
