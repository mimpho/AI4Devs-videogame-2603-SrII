import { GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, LEVEL_WIDTH_SCREENS } from '../config.js';
import { Player } from '../entities/Player.js';
import { createBulletPool } from '../entities/Bullet.js';
import { EnemySpawner } from '../entities/EnemySpawner.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const levelWidth = GAME_WIDTH * LEVEL_WIDTH_SCREENS;

    this.cameras.main.setBackgroundColor('#7ec0ee');

    this.add
      .tileSprite(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT, 'grass-tileset')
      .setOrigin(0, 0);

    this.groundBody = this.add
      .rectangle(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT)
      .setOrigin(0, 0)
      .setVisible(false);
    this.physics.add.existing(this.groundBody, true);

    this.physics.world.setBounds(0, 0, levelWidth, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, levelWidth, GAME_HEIGHT);

    this.bullets = createBulletPool(this);
    this.physics.add.collider(this.bullets, this.groundBody, (bullet) => {
      bullet.disableBody(true, true);
    });

    this.player = new Player(this, 80, GAME_HEIGHT - GROUND_HEIGHT - 100);
    this.physics.add.collider(this.player, this.groundBody);

    this.enemies = this.physics.add.group();
    this.physics.add.collider(this.enemies, this.groundBody);
    this.physics.add.collider(this.player, this.enemies);

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      if (!bullet.friendly) return;
      bullet.disableBody(true, true);
      enemy.takeDamage(1);
    });

    // Player damage from enemies on overlap (collision still keeps bodies separate).
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (!enemy.active || enemy.dead) return;
      player.takeDamage(1);
    });

    // Player damage from enemy bullets.
    this.physics.add.overlap(this.player, this.bullets, (player, bullet) => {
      if (bullet.friendly) return;
      bullet.disableBody(true, true);
      player.takeDamage(1);
    });

    this.spawner = new EnemySpawner(this, this.enemies);

    this.cameras.main.startFollow(this.player, true, 0.1, 0);

    this.hud = new HUD(this);
    this.events.emit('player-hp-changed', this.player.hp);
  }

  update() {
    this.player.update();
  }
}
