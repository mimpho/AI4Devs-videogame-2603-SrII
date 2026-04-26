## Why

Phase 4 puts dangerous-looking enemies on the screen, but they cannot actually hurt the player. Without a damage and lose loop, the game has no stakes — the only state transition is "press a key, then run forever". Phase 5 closes this gap: enemies and enemy bullets damage the Soldier, the HUD shows remaining HP, and dying transitions to a Game Over screen that loops back to the title.

This phase also ships the project's first HUD (laying groundwork for Phase 6 timer and Phase 7 score), the first invulnerability window (a pattern reused for any later "stun on hit" features), and the first non-gameplay scene introduced since Phase 1 (`GameOverScene`).

## What Changes

- `Player.js` gains HP state initialized to `PLAYER_MAX_HP` (declared in Phase 1, used here for the first time). On contact with an enemy or enemy bullet, HP decreases by 1, the hurt animation plays, and an invulnerability window of `PLAYER_HIT_IFRAMES_MS` starts during which further damage is ignored. While invulnerable the sprite blinks (alpha tween) so the state is visible.
- At HP 0, the death animation plays; on its completion `GameScene` transitions to a new `GameOverScene`.
- New scene `contra-AC/src/scenes/GameOverScene.js` — full-screen overlay with "GAME OVER" text, the run's death cause, and "Press any key to retry" returning to `TitleScene`.
- HUD (rendered by `GameScene`) shows three pip/heart icons matching current HP. A small "SCORE: 0" placeholder appears in the same area to reserve the layout for Phase 7. The HUD is fixed to the camera (`scrollFactor: 0`).
- Hurt and death SFX are wired with placeholder synthesized blips (real SFX lands in Phase 8).
- `src/config.js` gains: `PLAYER_HIT_IFRAMES_MS`, `PLAYER_HIT_BLINK_INTERVAL_MS`, HUD-layout constants (margin, pip spacing).

## Capabilities

### New Capabilities
- `damage-and-lives`: the player's HP state, damage resolution from enemies and enemy bullets, the i-frame window, hurt/death animations, and the HUD HP indicator.
- `game-over-screen`: the `GameOverScene` and its retry-to-title flow.

### Modified Capabilities
- `enemies`: enemies and enemy bullets are now wired as damage sources against the player (the Phase 4 collisions existed but were no-ops).
- `game-shell`: `GameOverScene` is registered alongside the existing scenes; `GameScene` now instantiates the HUD.

## Impact

- **New files:** `contra-AC/src/scenes/GameOverScene.js`, possibly `contra-AC/src/ui/HUD.js` if the HUD logic exceeds ~30 lines.
- **Modified files:** `contra-AC/src/entities/Player.js`, `contra-AC/src/entities/Enemy.js`, `contra-AC/src/entities/Bullet.js`, `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/main.js` (scene registration), `contra-AC/src/config.js`.
- **Constants added:** `PLAYER_HIT_IFRAMES_MS`, `PLAYER_HIT_BLINK_INTERVAL_MS`, HUD layout constants.
- **Constraints honored:** no new art (HP indicator drawn with primitive shapes or text), no new frameworks.
- **Out of scope:** no checkpoints, no extra lives, no persistent score, no win condition (Phase 6), no pause (Phase 7), no real SFX assets.
