import { Types } from 'phaser';
import { MainScene } from './scenes/MainScene';

export const createGameConfig = (): Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: 'game-content',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1500 },
      debug: false
    }
  },
  scene: [MainScene]
}); 