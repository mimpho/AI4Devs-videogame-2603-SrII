import {
  PLAYER_MAX_HP,
  HUD_MARGIN,
  HUD_PIP_SIZE,
  HUD_PIP_SPACING,
  HUD_PIP_FILL_COLOR,
  HUD_PIP_STROKE_COLOR,
  HUD_SCORE_X,
  HUD_SCORE_FONT_SIZE,
  HUD_FONT_FAMILY,
} from '../config.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.pips = [];

    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      const x = HUD_MARGIN + i * (HUD_PIP_SIZE + HUD_PIP_SPACING);
      const pip = scene.add
        .rectangle(x, HUD_MARGIN, HUD_PIP_SIZE, HUD_PIP_SIZE, HUD_PIP_FILL_COLOR)
        .setOrigin(0, 0)
        .setStrokeStyle(2, HUD_PIP_STROKE_COLOR)
        .setScrollFactor(0);
      this.pips.push(pip);
    }

    this.scoreText = scene.add
      .text(HUD_SCORE_X, HUD_MARGIN, 'SCORE: 0', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${HUD_SCORE_FONT_SIZE}px`,
        color: '#ffffff',
      })
      .setScrollFactor(0);

    scene.events.on('player-hp-changed', (hp) => this.setHp(hp));
    scene.events.on('score-changed', (score) => this.setScore(score));
  }

  setHp(hp) {
    this.pips.forEach((pip, i) => {
      if (i < hp) pip.setFillStyle(HUD_PIP_FILL_COLOR);
      else pip.setFillStyle(HUD_PIP_FILL_COLOR, 0); // hollow
    });
  }

  setScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);
  }
}
