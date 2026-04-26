import { PLAYER_RUN_SPEED, PLAYER_JUMP_VELOCITY } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'soldier-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Character occupies roughly the middle 30x30 of each 100x100 frame.
    this.body.setSize(30, 30).setOffset(35, 35);

    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.play('soldier-idle');
  }

  update() {
    const leftDown = this.keys.left.isDown || this.keys.a.isDown;
    const rightDown = this.keys.right.isDown || this.keys.d.isDown;

    if (leftDown && !rightDown) {
      this.setVelocityX(-PLAYER_RUN_SPEED);
      this.setFlipX(true);
      if (this.anims.currentAnim?.key !== 'soldier-walk') this.play('soldier-walk');
    } else if (rightDown && !leftDown) {
      this.setVelocityX(PLAYER_RUN_SPEED);
      this.setFlipX(false);
      if (this.anims.currentAnim?.key !== 'soldier-walk') this.play('soldier-walk');
    } else {
      this.setVelocityX(0);
      if (this.anims.currentAnim?.key !== 'soldier-idle') this.play('soldier-idle');
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.body.blocked.down) {
      this.setVelocityY(-PLAYER_JUMP_VELOCITY);
    }
  }
}
