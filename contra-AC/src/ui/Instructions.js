import {
  GAME_WIDTH,
  HUD_FONT_FAMILY,
  INSTRUCTIONS_DURATION_MS,
  INSTRUCTIONS_FADE_OUT_MS,
  INSTRUCTIONS_TOP_Y,
  INSTRUCTIONS_LINE_HEIGHT,
  INSTRUCTIONS_FONT_SIZE,
  INSTRUCTIONS_TEXT_COLOR,
} from '../config.js';

const LINES = [
  'MOVE   Arrows / WASD',
  'JUMP   Space',
  'SHOOT  Z / X / Click',
  'PAUSE  P or Esc',
];

export class Instructions {
  constructor(scene) {
    this.scene = scene;
    this.texts = LINES.map((line, i) =>
      scene.add
        .text(GAME_WIDTH / 2, INSTRUCTIONS_TOP_Y + i * INSTRUCTIONS_LINE_HEIGHT, line, {
          fontFamily: HUD_FONT_FAMILY,
          fontSize: `${INSTRUCTIONS_FONT_SIZE}px`,
          color: INSTRUCTIONS_TEXT_COLOR,
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
    );

    scene.time.delayedCall(INSTRUCTIONS_DURATION_MS, () => this.fadeOut());
  }

  fadeOut() {
    if (!this.texts.length) return;
    this.scene.tweens.add({
      targets: this.texts,
      alpha: 0,
      duration: INSTRUCTIONS_FADE_OUT_MS,
      onComplete: () => this.destroy(),
    });
  }

  destroy() {
    for (const t of this.texts) t.destroy();
    this.texts = [];
  }
}
