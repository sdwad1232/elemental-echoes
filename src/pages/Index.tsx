import { useGameState } from '@/game/useGameState';
import { MainMenu } from '@/game/MainMenu';
import { GameScene } from '@/game/GameScene';
import { HUD } from '@/game/HUD';
import { GameOverScreen } from '@/game/GameOverScreen';

const Index = () => {
  const {
    screen, activeElement, health, currentRealm, enemies, collectibles, stats,
    damageFlash, levelUpFlash, notification,
    startGame, backToMenu, switchElement, enterRealm,
    takeDamage, attackEnemy, collectItem, setEnemies,
  } = useGameState();

  if (screen === 'menu') {
    return <MainMenu onStart={startGame} />;
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
        onAttackEnemy={attackEnemy}
        onCollectItem={collectItem}
        onEnemyAttackPlayer={takeDamage}
        onEnterRealm={enterRealm}
        setEnemies={setEnemies}
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
