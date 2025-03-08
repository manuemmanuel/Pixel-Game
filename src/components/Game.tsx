import { useEffect, useRef } from 'react';
import { createGameConfig } from '@/game/config';

export function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const initPhaser = async () => {
      if (typeof window !== 'undefined') {
        const Phaser = (await import('phaser')).default;
        if (!gameRef.current) {
          gameRef.current = new Phaser.Game(createGameConfig());
        }
      }
    };

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="game-content" className="fixed inset-0 flex items-center justify-center" />;
} 