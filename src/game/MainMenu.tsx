import { useState, useEffect } from 'react';
import { ELEMENTS, Element } from './types';

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  const [visible, setVisible] = useState(false);
  const [hoveredEl, setHoveredEl] = useState<Element | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const elements: Element[] = ['fire', 'water', 'earth', 'air'];

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {elements.map((el, i) => (
          <div
            key={el}
            className="absolute rounded-full animate-pulse-glow"
            style={{
              width: 200 + i * 60,
              height: 200 + i * 60,
              left: `${15 + i * 20}%`,
              top: `${20 + (i % 2) * 40}%`,
              background: `radial-gradient(circle, ${ELEMENTS[el].glowColor}15, transparent 70%)`,
              animationDelay: `${i * 0.5}s`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-12 transition-all duration-1000"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="text-center">
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
            Elemental
          </h1>
          <h1 className="font-display text-5xl md:text-7xl font-normal tracking-[0.2em] text-primary mt-1">
            REALMS
          </h1>
          <p className="mt-6 text-muted-foreground font-body text-sm tracking-widest uppercase">
            Master the Elements · Restore Balance
          </p>
        </div>

        <div className="flex gap-6">
          {elements.map((el) => {
            const config = ELEMENTS[el];
            const isHovered = hoveredEl === el;
            return (
              <div
                key={el}
                className="flex flex-col items-center gap-2 cursor-default transition-transform duration-300"
                style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}
                onMouseEnter={() => setHoveredEl(el)}
                onMouseLeave={() => setHoveredEl(null)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300"
                  style={{
                    backgroundColor: config.color + '22',
                    boxShadow: isHovered ? `0 0 24px ${config.glowColor}50` : `0 0 8px ${config.glowColor}20`,
                  }}
                >
                  {config.icon}
                </div>
                <span
                  className="text-[10px] font-body uppercase tracking-widest transition-colors duration-300"
                  style={{ color: isHovered ? config.color : '#555' }}
                >
                  {config.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Features list */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] font-body text-muted-foreground/70">
          <span>⚔ Dynamic combat with elemental weaknesses</span>
          <span>🌍 4 unique realms to explore</span>
          <span>📈 Level up and grow stronger</span>
          <span>✨ Collect shards, orbs, and health</span>
        </div>

        <button
          onClick={onStart}
          className="group relative font-display text-lg tracking-[0.3em] uppercase px-12 py-4 rounded-lg transition-all duration-300 active:scale-95 border border-primary/30 text-primary hover:border-primary/60"
          style={{
            background: 'linear-gradient(135deg, hsl(42 90% 55% / 0.08), hsl(42 90% 55% / 0.02))',
          }}
        >
          <span className="relative z-10">Begin Adventure</span>
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: '0 0 30px hsl(42 90% 55% / 0.2), 0 0 60px hsl(42 90% 55% / 0.1)' }}
          />
        </button>

        <div className="flex gap-6 text-[10px] font-body text-muted-foreground/40 uppercase tracking-wider">
          <span>WASD to move</span>
          <span>1-4 switch elements</span>
          <span>Space to attack</span>
        </div>
      </div>
    </div>
  );
}
