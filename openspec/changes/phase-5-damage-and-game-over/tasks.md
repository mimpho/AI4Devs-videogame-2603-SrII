## 1. Asset preload and animation registration

- [x] 1.1 Inspect `contra-AC/resources/Characters(100x100)/Soldier/Hurt.png` and `Death.png` sheets; record frame counts in comments. — Both 400x100 → 4 frames at 100x100. Actual paths nested under `Soldier/Soldier/`.
- [x] 1.2 Update `BootScene.preload()` to load both sheets as `soldier-hurt` and `soldier-death`.
- [x] 1.3 In `BootScene.create()`, register `soldier-hurt` and `soldier-death` animations. Neither loops.

## 2. Tuning constants

- [x] 2.1 Extend `contra-AC/src/config.js` with: `PLAYER_HIT_IFRAMES_MS = 1000`, `PLAYER_HIT_BLINK_INTERVAL_MS = 100`, `HUD_MARGIN = 16`, `HUD_PIP_SIZE = 18`, `HUD_PIP_SPACING = 8`, `HUD_PIP_FILL_COLOR = 0xff4444`, `HUD_SCORE_X` (camera-relative), `HUD_SCORE_FONT_SIZE`. — Also added `HUD_PIP_STROKE_COLOR`, `HUD_FONT_FAMILY`, and `ANIM_FRAMERATE_HURT`/`ANIM_FRAMERATE_DEATH`.

## 3. Player damage logic

- [x] 3.1 In `Player.js` constructor, initialize `this.hp = PLAYER_MAX_HP`, `this.invulnerableUntil = 0`, and a reference to a blink tween (initially `null`).
- [x] 3.2 Add `Player.takeDamage(amount = 1)`:
  - If `scene.time.now < this.invulnerableUntil`, return.
  - `this.hp = Math.max(0, this.hp - amount)`.
  - `scene.events.emit('player-hp-changed', this.hp)`.
  - If `hp > 0`: play `soldier-hurt` once; on animationcomplete restore walk/idle. Set `invulnerableUntil = time.now + PLAYER_HIT_IFRAMES_MS`. Start blink tween.
  - If `hp === 0`: disable input flag (`this.dead = true`), `body.setVelocity(0,0)`, set `invulnerableUntil = Infinity`, play `soldier-death`. On animationcomplete: `scene.scene.start('GameOverScene', { reason: 'killed' })`.
  — Added a `hurting` flag (parallel to `attacking`) so `update()` does not override the hurt animation with movement-anim selection while hurt is playing. Caught and fixed during playtest.
- [x] 3.3 Modify `Player.update` to early-return if `this.dead`, so input is ignored during death animation.
- [x] 3.4 Implement the blink helper: `scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, repeat: -1, duration: PLAYER_HIT_BLINK_INTERVAL_MS })`. Stop and reset alpha when i-frames end (use a delayed call).

## 4. Damage wiring in GameScene

- [x] 4.1 In `GameScene.create()`, replace the Phase-4 `physics.add.collider(player, enemies)` with both a collider AND an overlap that calls `player.takeDamage(1)` when the overlap fires.
- [x] 4.2 Add `physics.add.overlap(this.player, this.bullets, (player, bullet) => { if (bullet.friendly) return; bullet.disableBody(true, true); player.takeDamage(1); })` so enemy bullets damage.

## 5. HUD

- [x] 5.1 In `GameScene.create()`, add an HUD container (or just a graphics object + text) anchored to camera (`setScrollFactor(0)`). Build:
  - `PLAYER_MAX_HP` pip rectangles drawn via `add.graphics`, sized `HUD_PIP_SIZE`, spaced `HUD_PIP_SPACING`, starting at `(HUD_MARGIN, HUD_MARGIN)`.
  - A `add.text` reading "SCORE: 0" at `(HUD_SCORE_X, HUD_MARGIN)`.
  — Implemented as a separate `contra-AC/src/ui/HUD.js` module since the layout exceeded ~30 lines and Phase 6 / 7 will extend it.
- [x] 5.2 Wire HUD update on the `'player-hp-changed'` scene event: redraw the pips so the first `hp` pips are filled (`HUD_PIP_FILL_COLOR`) and the rest are hollow (stroke only). — HUD also subscribes to `'score-changed'` ahead of Phase 7.

## 6. GameOverScene

- [x] 6.1 Create `contra-AC/src/scenes/GameOverScene.js` exporting `class GameOverScene extends Phaser.Scene` with key `'GameOverScene'`.
- [x] 6.2 Implement `init(data)` to store `this.reason = data.reason ?? 'killed'`.
- [x] 6.3 Implement `create()`: paint background dark (`cameras.main.setBackgroundColor('#0a0a0a')`), add centered "GAME OVER" text (large), add "Press any key to retry" beneath. Wire `this.input.keyboard.once('keydown', () => this.scene.start('TitleScene'))`. — Headline branches on reason: `'time_up'` → "OUT OF TIME" (Phase 6 wires the time-up source).

## 7. main.js scene registration

- [x] 7.1 Update `contra-AC/src/main.js` to import `GameOverScene` and add it to the `scene` array after `GameScene`.

## 8. Placeholder SFX

- [x] 8.1 Add `playHurtPlaceholder(scene)` and `playDeathPlaceholder(scene)` to `contra-AC/src/audio.js` (slightly lower-pitched blips than the shoot SFX). — Sawtooth waves: hurt 440→110 Hz over 180 ms; death 220→60 Hz over 600 ms. Exported as `playPlayerHurtPlaceholder` / `playPlayerDeathPlaceholder`.
- [x] 8.2 Wire from `Player.takeDamage` (hurt path) and on death-animation start.

## 9. Verification and playtest

- [x] 9.1 **Playtest — first hit:** walk into a grunt; confirm one HP pip empties, hurt animation plays, sprite blinks for ~1 second, no second hit registers during blink. — Verified via Playwright: HP went 3→2 on first hit; blink tween started; second hit during i-frames ignored (HP stayed at 2).
- [x] 9.2 **Playtest — enemy bullet damage:** stand still while a shooter fires; confirm the arrow damages on overlap and despawns. — Overlap callback wired (`if (!bullet.friendly) bullet.disableBody(...); player.takeDamage(1)`). Also exercised end-to-end during the live death loop.
- [x] 9.3 **Playtest — three hits:** take three hits; confirm HUD empties pip-by-pip. — Verified: HP 3→2→1→0 in live gameplay; HUD pips visibly hollowed (`fillAlpha` 1→1→0 then 1→0→0 etc).
- [x] 9.4 **Playtest — death:** on the third hit, confirm death animation plays and transitions to Game Over. — Verified end-to-end: live enemies killed the player, `soldier-death` played, scene transitioned to `GameOverScene` with `reason='killed'`.
- [x] 9.5 **Playtest — retry:** on Game Over, press any key; confirm Title screen appears and a fresh run starts. — Verified: Enter key on Game Over → only `TitleScene` active.
- [x] 9.6 **Playtest — HUD anchored:** run across the level; confirm pip row stays in the corner. — Pips and score text use `setScrollFactor(0)`; visible in screenshot during gameplay.
- [x] 9.7 **Tuning pass:** if i-frames feel too short/long, adjust `PLAYER_HIT_IFRAMES_MS` only. — Defaults retained (1000 ms felt right; the player survived 3 hits in normal play).
- [x] 9.8 Run `openspec validate phase-5-damage-and-game-over` and confirm valid.
- [x] 9.9 Commit: `feat: damage, HP HUD, and game over loop (phase 5)`.
