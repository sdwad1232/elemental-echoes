import { useState, useCallback } from 'react';
import { Element } from './types';

export type GameScreen = 'menu' | 'playing';

export function useGameState() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [activeElement, setActiveElement] = useState<Element>('fire');
  const [health, setHealth] = useState(100);

  const startGame = useCallback(() => setScreen('playing'), []);
  const backToMenu = useCallback(() => {
    setScreen('menu');
    setHealth(100);
    setActiveElement('fire');
  }, []);

  const switchElement = useCallback((el: Element) => setActiveElement(el), []);

  return { screen, activeElement, health, startGame, backToMenu, switchElement };
}
