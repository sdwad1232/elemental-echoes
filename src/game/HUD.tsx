import { Element, ELEMENTS } from './types';

interface HUDProps {
  activeElement: Element;
  health: number;
  onSwitchElement: (el: Element) => void;
  onBack: () => void;
}

export function HUD({ activeElement, health, onSwitchElement, onBack }: HUDProps) {
  const elements: Element[] = ['fire', 'water', 'earth', 'air'];

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
        {/* Health */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
            <span className="text-sm font-body text-muted-foreground">HP</span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${health}%`,
                  backgroundColor: health > 50 ? '#4ade80' : health > 25 ? '#fbbf24' : '#ef4444'
                }}
              />
            </div>
            <span className="text-xs font-body text-muted-foreground">{health}</span>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="pointer-events-auto bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50 text-sm font-body text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          ✕ Menu
        </button>
      </div>

      {/* Element selector - bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex gap-2 bg-background/60 backdrop-blur-sm rounded-xl p-2 border border-border/50 pointer-events-auto">
          {elements.map((el) => {
            const config = ELEMENTS[el];
            const isActive = el === activeElement;
            return (
              <button
                key={el}
                onClick={() => onSwitchElement(el)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: isActive ? config.color + '33' : 'transparent',
                  boxShadow: isActive ? `0 0 20px ${config.glowColor}40, 0 0 40px ${config.glowColor}20` : 'none',
                }}
              >
                <span className="text-xl">{config.icon}</span>
                <span className="text-[10px] font-body uppercase tracking-widest" style={{ color: isActive ? config.color : '#666' }}>
                  {config.key}
                </span>
                {isActive && (
                  <span className="text-[9px] font-body" style={{ color: config.glowColor }}>
                    {config.ability}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-8 left-6">
        <div className="bg-background/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30 pointer-events-auto">
          <p className="text-[10px] font-body text-muted-foreground leading-relaxed">
            WASD — Move<br />
            1-4 — Elements<br />
            Space — Attack<br />
            Mouse — Camera
          </p>
        </div>
      </div>
    </div>
  );
}
