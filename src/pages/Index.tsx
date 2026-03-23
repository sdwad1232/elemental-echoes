import { useGameState } from '@/game/useGameState';
import { MainMenu } from '@/game/MainMenu';
import { GameScene } from '@/game/GameScene';
import { HUD } from '@/game/HUD';

const Index = () => {
  const { screen, activeElement, health, startGame, backToMenu, switchElement } = useGameState();

  if (screen === 'menu') {
    return <MainMenu onStart={startGame} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GameScene activeElement={activeElement} onSwitchElement={switchElement} />
      <HUD activeElement={activeElement} health={health} onSwitchElement={switchElement} onBack={backToMenu} />
    </div>
  );
};

export default Index;
