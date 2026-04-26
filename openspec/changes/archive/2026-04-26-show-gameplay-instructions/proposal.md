## Why

The title scene only says "Press any key to start". A new player who reaches `GameScene` has no on-screen guidance for movement, shooting, or pause — they have to read CLAUDE.md or guess. Anything that helps them get up to speed in the first ten seconds of play is a free quality-of-life win.

This change shows a short, auto-fading instruction overlay in the sky area at the start of every `GameScene` run. Listed controls cover:
- Move (arrows or WASD)
- Jump (Space)
- Shoot (Z / X / left mouse)
- Pause / resume (P / Esc)

After 10 seconds the overlay fades out and removes itself, leaving the playfield clean.

## What Changes

- New `Instructions` UI module under `contra-AC/src/ui/Instructions.js`. On construction it adds Phaser text lines anchored to the camera in the upper sky area, then schedules its own fade-out and destroy via `scene.time.delayedCall` + `tweens`.
- `GameScene` instantiates `new Instructions(this)` once at the end of `create()` (after HUD), so every fresh run shows the overlay. Retry from `GameOverScene` / `VictoryScene` also rebuilds `GameScene` so the overlay reappears on every retry.
- Tuning constants in `config.js`: visible duration (`INSTRUCTIONS_DURATION_MS = 10000`), fade-out duration (`INSTRUCTIONS_FADE_OUT_MS = 500`), font size, position. The instruction text content is in the module (it's keyed copy, not a tunable).
- No effect on existing scenes, gameplay, physics, or score. The overlay does not block input — pressing any control during the 10 seconds works normally.

## Capabilities

### New Capabilities
- `gameplay-instructions`: the auto-fading on-screen control reference shown during the first seconds of every `GameScene` run.

### Modified Capabilities
<!-- None — adds a new capability rather than altering pause / scoring / etc. -->

## Impact

- **Files changed:** `contra-AC/src/scenes/GameScene.js` (one line in `create` to instantiate the overlay), `contra-AC/src/config.js` (3 constants), `contra-AC/src/ui/Instructions.js` (new ~30-line module).
- **No new files at the root, no asset changes, no API changes.**
- **Performance:** four to six anchored text objects, all destroyed after ~10.5 seconds. Negligible.
- **Out of scope:**
  - No persistent "skip tutorial" toggle. Overlay shows on every `GameScene` start.
  - No localization layer; copy is English-only and lives in the module.
  - No interactive demo (e.g., "press Space now to learn jump"). Just static text.
