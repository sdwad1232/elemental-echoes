import { useGameState } from '@/game/useGameState';
import { MainMenu } from '@/game/MainMenu';
import { GameScene } from '@/game/GameScene';
import { HUD } from '@/game/HUD';
import { GameOverScreen } from '@/game/GameOverScreen';

const Index = () => {
  const {
    screen, activeElement, health, currentRealm, enemies, collectibles, stats,
    damageFlash, levelUpFlash, notification,
    startGame, backToMenu, switchElement, attack, movePlayer, wasmState,
  } = useGameState();

  if (screen === 'menu') {
    return <MainMenu onStart={startGame} />;
  }

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400 animate-pulse">
            Loading WASM Engine...
          </div>
          <div className="mt-2 text-sm text-gray-500">Kompilerer spillogikk</div>
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
        enemies={enemies}
        collectibles={collectibles}
        onSwitchElement={switchElement}
        onAttack={attack}
        onMove={movePlayer}
        playerX={wasmState?.playerX || 0}
        playerY={wasmState?.playerY || 0.8}
        playerZ={wasmState?.playerZ || 0}
      />
      <HUD
        activeElement={activeElement}
        health={health}
        currentRealm={currentRealm}
        stats={stats}
        damageFlash={damageFlash}
        levelUpFlash={levelUpFlash}
        notification={notification}
        onSwitchElement={switchElement}
        onBack={backToMenu}
      />
    </div>
  );
};

export default Index;
