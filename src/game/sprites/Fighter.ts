import { Scene, GameObjects, Physics } from 'phaser';

interface FighterConfig {
  scene: Scene;
  x: number;
  y: number;
  texture: string;
  name: string;
  isEnemy: boolean;
  stats?: FighterStats; // Optional stats configuration
}

interface FighterStats {
  strength: number;
  agility: number;
  defense: number;
  maxHealth: number;
}

export class Fighter extends Physics.Arcade.Sprite {
  private attackBox!: GameObjects.Rectangle;
  private isDead: boolean = false;
  private isEnemy: boolean;
  private cursors!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private attack2Key!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private _isAttacking: boolean = false;
  private lastAttackTime: number = 0;
  private currentAttack: number = 1;
  private initialX: number;
  private initialY: number;
  private canTakeHit: boolean = true;
  private jumpForce: number = -500;
  private moveSpeed: number = 200;
  private target: Fighter | null = null;

  // Combat Stats
  private stats = {
    strength: 20,      // Base strength
    agility: 15000,       // Base agility
    defense: 10,       // Base defense
    maxHealth: 100,    // Maximum health
    currentHealth: 100 // Current health
  };

  // Combat Multipliers
  private readonly STRENGTH_MULTIPLIER = 0.8;    // Each point of strength adds 0.8 damage
  private readonly DEFENSE_MULTIPLIER = 0.3;     // Each point of defense reduces damage by 0.3
  private readonly DODGE_MULTIPLIER = 0.5;
  private readonly CRIT_MULTIPLIER = 0.3;
  private readonly CRIT_DAMAGE = 1.5;
  private readonly BASE_WEAPON_DAMAGE = 10;
  private readonly BASE_ATTACK_COOLDOWN = 1000;  // 1 second base cooldown
  private readonly BASE_MOVE_SPEED: number = 200;  // Base movement speed
  private readonly AGILITY_SPEED_MULTIPLIER: number = 0.5;  // How much each point of agility affects speed

  private aiConfig = {
    attackRange: 150,
    followRange: 400,
    dodgeRange: 200,
    attackCooldown: 2000,
    jumpCooldown: 2500,
    lastJumpTime: 0,
    lastAttackTime: 0,
    attackProbability: 0.3,
    forceAttackDelay: 10000  // 10 seconds
  };

  private lastPlayerAttackTime: number = Date.now();

  constructor(scene: Scene, config: FighterConfig) {
    super(scene, config.x, config.y, config.texture);
    this.isEnemy = config.isEnemy;
    this.initialX = config.x;
    this.initialY = config.y;

    // Initialize stats if provided
    if (config.stats) {
      this.stats = {
        ...this.stats,
        ...config.stats,
        currentHealth: config.stats.maxHealth
      };
    }

    // Set enemy default stats if not provided
    if (this.isEnemy && !config.stats) {
      this.stats = {
        strength: 500,
        agility: 100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000,
        defense: 8000,
        maxHealth: 120,
        currentHealth: 120
      };
    }

    // Add sprite to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    const body = this.body as Physics.Arcade.Body;
    body.setSize(50, 150);
    body.setCollideWorldBounds(true);
    body.setGravityY(1200); // Increased gravity for better jump feel

    // Create attack box
    this.attackBox = scene.add.rectangle(
      this.x + (this.isEnemy ? -50 : 50),
      this.y,
      100,
      50,
      0xff0000,
      0
    );
    scene.physics.add.existing(this.attackBox, true);

    // Set up controls
    if (scene.input.keyboard) {
      if (!this.isEnemy) {
        this.cursors = {
          left: scene.input.keyboard.addKey('A'),
          right: scene.input.keyboard.addKey('D')
        };
        this.attackKey = scene.input.keyboard.addKey('SPACE');
        this.attack2Key = scene.input.keyboard.addKey('E');
        this.jumpKey = scene.input.keyboard.addKey('W');
      } else {
        this.cursors = {
          left: scene.input.keyboard.addKey('LEFT'),
          right: scene.input.keyboard.addKey('RIGHT')
        };
        this.attackKey = scene.input.keyboard.addKey('NUMPAD_ONE');
        this.attack2Key = scene.input.keyboard.addKey('NUMPAD_TWO');
        this.jumpKey = scene.input.keyboard.addKey('UP');
      }

      // Add jump key release listener for variable jump height
      this.jumpKey.on('up', this.onJumpKeyUp, this);
    }

    // Create animations
    this.createAnimations();
  }

  private onJumpKeyUp() {
    const body = this.body as Physics.Arcade.Body;
    // If we're still moving upward when the key is released, reduce the upward velocity
    if (body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * 0.5);
    }
  }

  // Add getter methods for attack state and box
  public getAttackBox(): GameObjects.Rectangle {
    return this.attackBox;
  }

  public isAttacking(): boolean {
    return this._isAttacking;
  }

  private createAnimations() {
    const characterPrefix = this.isEnemy ? 'kenji' : 'samuraiMack';

    // Create idle animation
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-idle`, { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    // Create run animation
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-run`, { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    // Create jump animation
    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-jump`, { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0
    });

    // Create fall animation
    this.anims.create({
      key: 'fall',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-fall`, { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0
    });

    // Create attack1 animation
    this.anims.create({
      key: 'attack1',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-attack1`, { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0
    });

    // Create attack2 animation
    this.anims.create({
      key: 'attack2',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-attack2`, { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0
    });

    // Create take hit animation
    this.anims.create({
      key: 'takeHit',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-takeHit`, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });

    // Create death animation
    this.anims.create({
      key: 'death',
      frames: this.anims.generateFrameNumbers(`${characterPrefix}-death`, { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });

    // Listen for animation complete events
    this.on('animationcomplete', this.handleAnimationComplete, this);
  }

  private handleAnimationComplete(animation: Phaser.Animations.Animation) {
    if (animation.key.includes('attack')) {
      this._isAttacking = false;
    }
  }

  // Calculate combat values
  private calculateDamage(): number {
    // Base damage is now significantly affected by strength
    const baseDamage = this.BASE_WEAPON_DAMAGE + (this.stats.strength * this.STRENGTH_MULTIPLIER);
    
    // Critical hits are based on agility
    const isCritical = Math.random() < (this.stats.agility * this.CRIT_MULTIPLIER) / 100;
    const finalDamage = isCritical ? baseDamage * this.CRIT_DAMAGE : baseDamage;
    
    return Math.round(finalDamage); // Round to nearest integer for cleaner numbers
  }

  private calculateAttackCooldown(): number {
    return Math.max(
      200, // Minimum cooldown
      this.BASE_ATTACK_COOLDOWN - (this.stats.agility * 20)
    );
  }

  private canDodge(): boolean {
    // Calculate dodge chance with agility, but cap it at 50%
    const dodgeChance = Math.min(0.5, (this.stats.agility * this.DODGE_MULTIPLIER) / 100);
    return Math.random() < dodgeChance;
  }

  attack() {
    if (this._isAttacking || this.isDead) return;

    const currentTime = Date.now();
    const attackCooldown = this.calculateAttackCooldown();
    
    if (currentTime - this.lastAttackTime < attackCooldown) return;

    // Update last player attack time if this is the player
    if (!this.isEnemy) {
      this.lastPlayerAttackTime = currentTime;
    }

    // Combo system: if attacking within 500ms of last attack, use attack2
    if (currentTime - this.lastAttackTime < 500) {
      this.currentAttack = 2;
    } else {
      this.currentAttack = 1;
    }

    this._isAttacking = true;
    this.lastAttackTime = currentTime;
    
    // Play the appropriate attack animation
    this.play(`attack${this.currentAttack}`, true);

    // Enable attack box for a short duration
    this.scene.time.delayedCall(200, () => {
      this._isAttacking = false;
    });
  }

  takeHit(incomingDamage: number = 20): boolean {
    if (!this.canTakeHit || this.isDead) return false;

    // Check for dodge based on agility
    if (this.canDodge()) {
      return false;
    }

    // Calculate damage reduction from defense
    const damageReduction = this.stats.defense * this.DEFENSE_MULTIPLIER;
    const finalDamage = Math.max(1, Math.round(incomingDamage - damageReduction)); // Minimum 1 damage
    
    // Apply the damage
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - finalDamage);
    this.canTakeHit = false;
    
    // Brief invulnerability period
    this.scene.time.delayedCall(500, () => {
      this.canTakeHit = true;
    });
    
    if (this.stats.currentHealth <= 0) {
      this.isDead = true;
      this._isAttacking = false;
      
      // Ensure fighter stays on ground when dying
      const body = this.body as Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.setAllowGravity(false);
      
      // Set different y positions for player and enemy death sprites
      if (this.isEnemy) {
        this.setY(539);  // Enemy death position
        body.setSize(50, 141).setOffset(70, 35);
      } else {
        this.setY(565);  // Player death position
        body.setSize(50, 137).setOffset(70, 35);
      }
      
      // Play death animation
      this.play('death', true);
    } else {
      this.play('takeHit', true);
    }

    return true; // Hit landed
  }

  // Getter methods for stats
  public getStrength(): number {
    return this.stats.strength;
  }

  public getAgility(): number {
    return this.stats.agility;
  }

  public getDefense(): number {
    return this.stats.defense;
  }

  // Getter for current health
  public getCurrentHealth(): number {
    return this.stats.currentHealth;
  }

  // Getter for max health
  public getMaxHealth(): number {
    return this.stats.maxHealth;
  }

  // Getter for calculated damage
  public getDamage(): number {
    return this.calculateDamage();
  }

  // Set target for AI
  public setTarget(target: Fighter) {
    this.target = target;
  }

  private updateAI() {
    if (!this.target || this.isDead) return;

    const distanceToTarget = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y
    );

    const currentTime = Date.now();
    const currentMoveSpeed = this.calculateMoveSpeed();

    // Force pursuit and attack if player hasn't attacked in 10 seconds
    const playerInactive = currentTime - this.lastPlayerAttackTime > this.aiConfig.forceAttackDelay;
    if (playerInactive) {
      // Always move towards player when inactive
      const moveDirection = this.x < this.target.x ? 1 : -1;
      this.setVelocityX(currentMoveSpeed * 1.2 * moveDirection); // Apply direction to velocity
      this.setFlipX(moveDirection > 0);

      // Attack immediately when in range
      if (distanceToTarget <= this.aiConfig.attackRange && !this._isAttacking) {
        this.attack();
        return;
      }
      
      // Jump if too far to close distance faster
      if (distanceToTarget > this.aiConfig.attackRange * 2 && 
          currentTime - this.aiConfig.lastJumpTime > this.aiConfig.jumpCooldown) {
        this.setVelocityY(this.jumpForce);
        this.play('jump', true);
        this.aiConfig.lastJumpTime = currentTime;
      }
      return;
    }

    // Regular AI behavior
    // Dodge less frequently and only when very close
    if (this.target.isAttacking() && 
        distanceToTarget < this.aiConfig.dodgeRange * 0.5 && 
        currentTime - this.aiConfig.lastJumpTime > this.aiConfig.jumpCooldown) {
      this.setVelocityY(this.jumpForce);
      this.play('jump', true);
      this.setVelocityX(this.x < this.target.x ? -currentMoveSpeed * 0.7 : currentMoveSpeed * 0.7);
      this.aiConfig.lastJumpTime = currentTime;
      return;
    }

    // Regular attack behavior
    if (distanceToTarget <= this.aiConfig.attackRange && 
        !this._isAttacking && 
        currentTime - this.aiConfig.lastAttackTime > this.aiConfig.attackCooldown &&
        Math.random() < this.aiConfig.attackProbability) {
      if (Math.random() > 0.2) {
        this.attack();
      } else {
        this._isAttacking = true;
        this.currentAttack = 2;
        this.play('attack2', true);
        this.scene.time.delayedCall(200, () => {
          this._isAttacking = false;
        });
      }
      this.aiConfig.lastAttackTime = currentTime;
    } else if (distanceToTarget <= this.aiConfig.followRange) {
      const moveDirection = this.x < this.target.x ? 1 : -1;
      const speedMultiplier = distanceToTarget < this.aiConfig.attackRange * 1.5 ? 0.5 : 0.8;
      this.setVelocityX(currentMoveSpeed * moveDirection * speedMultiplier);
      this.setFlipX(moveDirection > 0);

      if (Math.random() < 0.01 && 
          currentTime - this.aiConfig.lastJumpTime > this.aiConfig.jumpCooldown) {
        this.setVelocityY(this.jumpForce);
        this.play('jump', true);
        this.aiConfig.lastJumpTime = currentTime;
      }
    }
  }

  private calculateMoveSpeed(): number {
    return this.BASE_MOVE_SPEED + (this.stats.agility * this.AGILITY_SPEED_MULTIPLIER);
  }

  update() {
    const body = this.body as Physics.Arcade.Body;

    if (this.isDead) {
      // Keep fighter in place when dead
      this.setVelocity(0, 0);
      return;
    }

    // Update attack box position
    this.attackBox.x = this.x + (this.isEnemy ? -50 : 50);
    this.attackBox.y = this.y;

    // Calculate current move speed based on agility
    const currentMoveSpeed = this.calculateMoveSpeed();

    if (this.isEnemy) {
      // AI behavior for enemy
      this.updateAI();
    } else {
      // Player controls
      if (this.cursors.left?.isDown && !this._isAttacking) {
        this.setVelocityX(-currentMoveSpeed);
        this.setFlipX(!this.isEnemy);
      } else if (this.cursors.right?.isDown && !this._isAttacking) {
        this.setVelocityX(currentMoveSpeed);
        this.setFlipX(this.isEnemy);
      } else {
        this.setVelocityX(0);
      }

      // Jump for player
      if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && !this._isAttacking) {
        this.setVelocityY(this.jumpForce);
        this.play('jump', true);
      }

      // Attacks for player
      if (this.attackKey?.isDown) {
        this.attack();
      } else if (this.attack2Key?.isDown && !this._isAttacking) {
        this._isAttacking = true;
        this.currentAttack = 2;
        this.play('attack2', true);
        this.scene.time.delayedCall(200, () => {
          this._isAttacking = false;
        });
      }
    }

    // Play animations
    if (!this._isAttacking && !this.isDead) {
      if (body.velocity.y < 0) {
        this.play('jump', true);
      } else if (body.velocity.y > 0) {
        this.play('fall', true);
      } else if (body.velocity.x !== 0) {
        this.play('run', true);
      } else {
        this.play('idle', true);
      }
    }
  }

  reset(): void {
    // Reset position
    this.setPosition(this.initialX, this.initialY);
    
    // Reset state
    this.stats.currentHealth = this.stats.maxHealth;
    this.isDead = false;
    this._isAttacking = false;
    this.lastAttackTime = 0;
    this.currentAttack = 1;
    this.canTakeHit = true;
    
    // Reset AI timers
    this.lastPlayerAttackTime = Date.now();  // Reset inactivity timer
    this.aiConfig.lastJumpTime = 0;
    this.aiConfig.lastAttackTime = 0;
    
    // Reset physics
    const body = this.body as Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(true);
    
    // Reset animation
    this.play('idle', true);
    
    // Reset flip
    this.setFlipX(this.isEnemy);
  }
} 