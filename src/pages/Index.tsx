import { useGameState } from '@/game/useGameState';
import { MainMenu } from '@/game/MainMenu';
import { GameScene } from '@/game/GameScene';
import { HUD } from '@/game/HUD';
import { GameOverScreen } from '@/game/GameOverScreen';

const Index = () => {
  const {
    screen, activeElement, health, currentRealm, stats,
    damageFlash, levelUpFlash, notification,
    startGame, backToMenu, wasmStateRef, tickGame,
  } = useGameState();

  if (screen === 'menu') {
    return <MainMenu onStart={startGame} />;
  }

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-background">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary animate-pulse">
            Loading WASM Engine...
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Kompilerer spillogikk</div>
        </div>
      </div>
    );
  }

  if (screen === 'gameover') {
    return <GameOverScreen stats={stats} onRestart={startGame} onMenu={backToMenu} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameScene
        activeElement={activeElement}
        currentRealm={currentRealm}
        wasmStateRef={wasmStateRef}
        tickGame={tickGame}
      />
      <HUD
        activeElement={activeElement}
        health={health}
        currentRealm={currentRealm}
        stats={stats}
        damageFlash={damageFlash}
        levelUpFlash={levelUpFlash}
        notification={notification}
        onSwitchElement={() => {}}
        onBack={backToMenu}
      />
    </div>
  );
};

export default Index;
