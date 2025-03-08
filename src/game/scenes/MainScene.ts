import { Scene, GameObjects, Physics } from 'phaser';
import { Fighter } from '../sprites/Fighter';
// Adithya: (narrowing her eyes) Lidiya… It is clear that I stand taller than you. This is an indisputable fact.

// Lidiya: (raising an eyebrow, smirking) Oh? Then why must you announce it? The moon does not shout to be noticed.

// Adithya: (scoffs) The moon does not need to shout when it looms over the lesser stars.

// Lidiya: (crossing her arms) Oh? And yet, the moon only appears large because of distance. Perhaps you are simply closer to your own delusions.

// Adithya: (leaning in, smirking) A woman who is truly tall does not need to stretch her neck to argue. And yet, here you are—standing on your toes ever so slightly.

// Lidiya: (gasps, stepping back) How dare you! My feet are firmly planted like the great sakura tree!

// Adithya: (raising an eyebrow) Then remove your sandals, Lidiya. Let us see if your roots remain as deep.

// Lidiya: (horrified whisper) …You go too far.

// Adithya: (grinning, hands on hips) What's wrong? Are you afraid that without your wooden crutches, you shall finally look up to me?

// Lidiya: (scoffs, flipping her hair) My height is as natural as the wind. Unlike someone who tilts her chin up just a little when speaking.

// Adithya: (offended gasp) I do no such thing!

// Lidiya: (smirking) Oh, but you do. Just a fraction. But even fractions matter, don't they?

// Adithya: (drawing her katana slightly) I should cut this nonsense down where it stands.

// Lidiya: (hand on her hilt, grinning) A wise idea. Perhaps when you fall, you'll understand what looking up truly means.

// Adithya: (pauses, then sighs, releasing her grip) No… I shall be the greater—both in spirit and height—and let this matter rest.

// Lidiya: (smiling sweetly) Ah, then you admit it? That I am the taller one?

// Adithya: (groans, turning away) This duel… is not worth my time.

// Lidiya: (calling after her) Indeed! Especially when the victor is already clear!


export class MainScene extends Scene {
  private background!: GameObjects.Image;
  private player!: Fighter;
  private enemy!: Fighter;
  private timer: number = 60;
  private timerText!: GameObjects.Text;
  private displayText!: GameObjects.Text;
  private retryButton!: GameObjects.Text;
  private playerHealthBar!: GameObjects.Rectangle;
  private enemyHealthBar!: GameObjects.Rectangle;
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load background
    this.load.image('background', '/assets/background.png');

    // Load player (samuraiMack) assets
    this.load.spritesheet('samuraiMack-idle', '/assets/samuraiMack/Idle.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-run', '/assets/samuraiMack/Run.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-jump', '/assets/samuraiMack/Jump.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-fall', '/assets/samuraiMack/Fall.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-attack1', '/assets/samuraiMack/Attack1.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-attack2', '/assets/samuraiMack/Attack2.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-takeHit', '/assets/samuraiMack/Take Hit.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('samuraiMack-death', '/assets/samuraiMack/Death.png', {
      frameWidth: 200,
      frameHeight: 200
    });

    // Load enemy (kenji) assets
    this.load.spritesheet('kenji-idle', '/assets/kenji/Idle.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-run', '/assets/kenji/Run.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-jump', '/assets/kenji/Jump.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-fall', '/assets/kenji/Fall.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-attack1', '/assets/kenji/Attack1.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-attack2', '/assets/kenji/Attack2.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-takeHit', '/assets/kenji/Take hit.png', {
      frameWidth: 200,
      frameHeight: 200
    });
    this.load.spritesheet('kenji-death', '/assets/kenji/Death.png', {
      frameWidth: 200,
      frameHeight: 200
    });

    // Add this line to load the music
    this.load.audio('bgMusic', '/assets/Nice To Meet Ya - Niall Horan.mp3');
  }

  create() {
    // Create and scale background to fill the screen
    this.background = this.add.image(0, -200, 'background').setOrigin(0, 0);
    this.scale.on('resize', this.resize, this);
    this.resize();

    // Set world bounds to match screen size
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Create fighters with larger scale
    this.player = new Fighter(this, {
      scene: this,
      x: 300,
      y: 800,
      texture: 'samuraiMack-idle',
      name: 'player',
      isEnemy: false
    }).setScale(2.5);

    this.enemy = new Fighter(this, {
      scene: this,
      x: this.scale.width - 300,
      y: 800,
      texture: 'kenji-idle',
      name: 'enemy',
      isEnemy: true
    }).setScale(2.5);

    // Set up AI target
    this.enemy.setTarget(this.player);

    // Adjust physics body size for scaled fighters and allow overlap
    const playerBody = this.player.body as Physics.Arcade.Body;
    const enemyBody = this.enemy.body as Physics.Arcade.Body;
    playerBody.setSize(50, 137).setOffset(70, 35);
    enemyBody.setSize(50, 141).setOffset(70, 35);

    // Allow fighters to pass through each other horizontally but not vertically
    this.physics.add.collider(this.player, this.enemy, undefined, (player: any, enemy: any) => {
      const playerBody = player.body as Physics.Arcade.Body;
      const enemyBody = enemy.body as Physics.Arcade.Body;
      // Only allow collision if one is above the other
      return Math.abs(playerBody.y - enemyBody.y) > 50;
    });

    // Create platform for fighters to stand on
    const platform = this.add.rectangle(this.scale.width / 2, 900, this.scale.width, 20, 0x000000);
    this.physics.add.existing(platform, true);

    // Create UI
    this.createUI();

    // Start timer
    this.startTimer();

    // Setup collisions - only with platform, not between fighters
    this.physics.add.collider(this.player, platform);
    this.physics.add.collider(this.enemy, platform);

    // Setup overlap for attack detection
    this.physics.add.overlap(
      this.player,
      this.enemy,
      () => {
        if (this.player.isAttacking()) {
          this.enemy.takeHit(this.player.getDamage());
          this.enemyHealthBar.width = (this.enemy.getCurrentHealth() / this.enemy.getMaxHealth()) * 400;
        }
      }
    );

    this.physics.add.overlap(
      this.enemy,
      this.player,
      () => {
        if (this.enemy.isAttacking()) {
          this.player.takeHit(this.enemy.getDamage());
          this.playerHealthBar.width = (this.player.getCurrentHealth() / this.player.getMaxHealth()) * 400;
        }
      }
    );

    // Add this after creating other game elements
    // Play background music with loop
    this.bgMusic = this.sound.add('bgMusic', {
      volume: 0.5,  // Adjust volume (0 to 1)
      loop: true    // Music will loop
    });
    this.bgMusic.play();
  }

  private resize() {
    const width = this.scale.width;
    const height = this.scale.height;
    
    // Scale background to fill the screen while maintaining aspect ratio
    const scaleX = width / this.background.width;
    const scaleY = height / this.background.height;
    const scale = Math.max(scaleX, scaleY);
    
    this.background.setScale(scale).setScrollFactor(0);
    this.background.y = -90; // Maintain the upward position after resize
    
    // Update fighter positions and world bounds
    if (this.player && this.enemy) {
      this.physics.world.setBounds(0, 0, width, height);
      this.player.setPosition(300, 800);
      this.enemy.setPosition(width - 300, 800);
    }
  }

  update() {
    if (!this.physics.world.isPaused) {
      this.player.update();
      this.enemy.update();

      // Check for game over conditions
      if (this.player.getCurrentHealth() <= 0) {
        this.timer = 0;  // Stop timer
        this.timerText.setText('0');
        this.gameOver();
      } else if (this.enemy.getCurrentHealth() <= 0) {
        this.timer = 0;  // Stop timer
        this.timerText.setText('0');
        this.gameOver();
      } else if (this.timer <= 0) {
        this.gameOver();
      }
    }
  }

  private createUI() {
    const width = this.scale.width;
    const centerX = width / 2;
    const barWidth = 400;
    const barHeight = 30;
    const edgePadding = 50;

    // Create health bar backgrounds (darker color)
    const playerHealthBg = this.add.rectangle(
      edgePadding + barWidth/2,
      50,
      barWidth + 4,
      barHeight + 4,
      0x28293D
    ).setDepth(1);

    const enemyHealthBg = this.add.rectangle(
      width - (edgePadding + barWidth/2),
      50,
      barWidth + 4,
      barHeight + 4,
      0x28293D
    ).setDepth(1);

    // Create health bars with gradients
    this.playerHealthBar = this.add.rectangle(
      edgePadding + barWidth/2,
      50,
      barWidth,
      barHeight,
      0x4F46E5 // Indigo color
    ).setDepth(2);

    this.enemyHealthBar = this.add.rectangle(
      width - (edgePadding + barWidth/2),
      50,
      barWidth,
      barHeight,
      0xDC2626 // Red color
    ).setDepth(2);

    // Add player names/indicators
    const playerName = this.add.text(
      edgePadding,
      15,
      'ADITHYA',
      {
        fontSize: '16px',
        color: '#fff',
        fontFamily: '"Press Start 2P"'
      }
    ).setDepth(2);

    const enemyName = this.add.text(
      width - edgePadding,
      15,
      'LIDIYA (BOSS)',
      {
        fontSize: '16px',
        color: '#fff',
        fontFamily: '"Press Start 2P"'
      }
    ).setOrigin(1, 0).setDepth(2);

    // Add player stats
    const playerStats = this.add.text(
      edgePadding,
      70,
      `STR: ${this.player.getStrength()}\nAGI: ${this.player.getAgility()}\nDEF: ${this.player.getDefense()}`,
      {
        fontSize: '14px',
        color: '#fff',
        fontFamily: '"Press Start 2P"',
        align: 'left'
      }
    ).setDepth(2);

    // Add enemy stats
    const enemyStats = this.add.text(
      width - edgePadding,
      70,
      `STR: ???\nAGI: ???\nDEF: ???`,
      {
        fontSize: '14px',
        color: '#fff',
        fontFamily: '"Press Start 2P"',
        align: 'right'
      }
    ).setOrigin(1, 0).setDepth(2);

    // Create timer in the center
    this.timerText = this.add.text(centerX, 50, '60', {
      fontSize: '36px',
      color: '#fff',
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5).setDepth(2);

    // Create display text (for game over)
    this.displayText = this.add.text(centerX, 288, '', {
      fontSize: '48px',
      color: '#fff',
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5).setVisible(false).setDepth(2);

    // Create retry button
    this.retryButton = this.add.text(centerX, 388, 'Retry', {
      fontSize: '32px',
      color: '#fff',
      fontFamily: '"Press Start 2P"',
      backgroundColor: '#4A5568',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setInteractive({ useHandCursor: true })
    .setDepth(2)
    .on('pointerover', () => {
      this.retryButton.setStyle({ backgroundColor: '#2D3748' });
    })
    .on('pointerout', () => {
      this.retryButton.setStyle({ backgroundColor: '#4A5568' });
    })
    .on('pointerdown', () => {
      this.resetGame();
    });

    // Add resize handler for UI
    this.scale.on('resize', this.resizeUI, this);
  }

  private resizeUI = () => {
    const width = this.scale.width;
    const centerX = width / 2;
    const barWidth = 400;
    const edgePadding = 50;

    // Update positions
    this.playerHealthBar.setPosition(edgePadding + barWidth/2, 50);
    this.enemyHealthBar.setPosition(width - (edgePadding + barWidth/2), 50);
    this.timerText.setPosition(centerX, 50);
    this.displayText.setPosition(centerX, 288);
    this.retryButton.setPosition(centerX, 388);
  }

  private startTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timer--;
        this.timerText.setText(this.timer.toString());
        if (this.timer <= 0) {
          this.gameOver();
        }
      },
      repeat: 59
    });
  }

  private resetGame() {
    // Reset timer
    this.timer = 60;
    this.timerText.setText('60');
    
    // Start new timer
    this.startTimer();

    // Reset fighters
    this.player.reset();
    this.enemy.reset();

    // Reset UI
    this.displayText.setVisible(false);
    this.retryButton.setVisible(false);
    
    // Reset health bars to full width with smooth transition
    this.tweens.add({
      targets: [this.playerHealthBar, this.enemyHealthBar],
      width: 400,
      duration: 300,
      ease: 'Power2'
    });

    // Resume physics
    this.physics.resume();

    // Restart music if it's not playing
    if (!this.bgMusic.isPlaying) {
      this.bgMusic.play();
    }
  }

  private gameOver() {
    // Stop any ongoing timer events
    this.time.removeAllEvents();
    
    if (this.player.getCurrentHealth() === this.enemy.getCurrentHealth()) {
      this.displayText.setText('Tie');
    } else if (this.player.getCurrentHealth() > this.enemy.getCurrentHealth()) {
      this.displayText.setText('Adithya Wins');
    } else {
      this.displayText.setText('Lidiya Wins');
    }
    this.displayText.setVisible(true);
    this.retryButton.setVisible(true);
    this.physics.pause();
  }
} 