## 1. Tuning constants

- [x] 1.1 Add to `contra-AC/src/config.js`:
  - `INSTRUCTIONS_DURATION_MS = 10000` (visible time at full alpha)
  - `INSTRUCTIONS_FADE_OUT_MS = 500` (alpha tween duration)
  - `INSTRUCTIONS_TOP_Y = 60` (camera-relative Y of the first line)
  - `INSTRUCTIONS_LINE_HEIGHT = 22` (vertical spacing between lines)
  - `INSTRUCTIONS_FONT_SIZE = 16`
  - `INSTRUCTIONS_TEXT_COLOR = '#ffffff'`

## 2. Instructions UI module

- [x] 2.1 Create `contra-AC/src/ui/Instructions.js` exporting `class Instructions`. The constructor takes `(scene)` and:
  - Defines the lines locally as a hardcoded array, e.g.:
    ```js
    const LINES = [
      'MOVE   Arrows / WASD',
      'JUMP   Space',
      'SHOOT  Z / X / Click',
      'PAUSE  P or Esc',
    ];
    ```
  - For each line at index `i`, adds a `scene.add.text(GAME_WIDTH / 2, INSTRUCTIONS_TOP_Y + i * INSTRUCTIONS_LINE_HEIGHT, line, { fontFamily: HUD_FONT_FAMILY, fontSize: INSTRUCTIONS_FONT_SIZE + 'px', color: INSTRUCTIONS_TEXT_COLOR }).setOrigin(0.5, 0).setScrollFactor(0)`.
  - Stores references in `this.texts` (array).
- [x] 2.2 Schedule fade-out: `scene.time.delayedCall(INSTRUCTIONS_DURATION_MS, () => this.fadeOut())`.
- [x] 2.3 Implement `fadeOut()` that runs `scene.tweens.add({ targets: this.texts, alpha: 0, duration: INSTRUCTIONS_FADE_OUT_MS, onComplete: () => this.destroy() })`.
- [x] 2.4 Implement `destroy()` that loops `this.texts` calling `text.destroy()` on each, then clears the array.

## 3. GameScene wiring

- [x] 3.1 In `contra-AC/src/scenes/GameScene.js`, import `Instructions` from `../ui/Instructions.js`.
- [x] 3.2 At the end of `GameScene.create()` (after `this.hud = new HUD(this); this.events.emit('player-hp-changed', ...)`), add `this.instructions = new Instructions(this);`.
- [x] 3.3 Do not store anything in `this.instructions` that needs to outlive the overlay. The class self-destroys; no scene-level cleanup hook needed.

## 4. Verify

- [x] 4.1 **Visual:** start a fresh run; within 100 ms, the four instruction lines are visible in the sky area centered horizontally below the HUD.
- [x] 4.2 **Anchored to camera:** run to the right edge of the level during the first 10 s and confirm the instructions stay in the same screen position even as the camera scrolls.
- [x] 4.3 **Fade and destroy:** wait the full 10 s + 0.5 s; the overlay fades out smoothly and disappears. No console errors.
- [x] 4.4 **Retry shows overlay again:** die or finish, return to title, start a new run; the overlay re-appears.
- [x] 4.5 **Inputs work during the window:** in the first 10 s, hold Right + tap Space + tap Z; player moves, jumps, fires normally with no input blocking.
- [x] 4.6 Run `openspec validate show-gameplay-instructions` and confirm valid.
- [x] 4.7 Commit: `feat: show on-screen control reference for the first 10 seconds of each run`.
