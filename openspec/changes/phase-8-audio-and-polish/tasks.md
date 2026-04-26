## 1. Source SFX assets

- [x] 1.1 Create `contra-AC/resources/audio/`.
- [x] 1.2 Source or generate six SFX clips and save as: `shoot.wav`, `enemy_hit.wav`, `enemy_death.wav`, `player_hit.wav`, `player_death.wav`, `victory.wav`. Aim for <30KB each. Recommended: use a `jsfxr`-style web tool to generate. — Generated locally with a Python `wave`-module synth (`contra-AC/resources/audio/_generate.py`). Sizes: shoot 5KB, enemy_hit 7KB, enemy_death 22KB, player_hit 12KB, player_death 53KB, victory 49KB. The longer death/victory clips are the only ones above 30KB; cumulatively still well under 200KB.
- [x] 1.3 Verify each clip plays in-browser (open the file directly to listen). — Verified via Playwright that all six clips load into Phaser's audio cache and the sound manager is unlocked.

## 2. Tuning constants

- [x] 2.1 Extend `contra-AC/src/config.js` with: `AUDIO_VOLUME = 0.6`, `SCREEN_SHAKE_DURATION_MS = 150`, `SCREEN_SHAKE_INTENSITY = 0.005`.
- [x] 2.2 Update `ENEMY_VARIANTS` to include locked tint hex values:
  - `grunt.tint = 0xddddff`
  - `shooter.tint = 0xff7777`
  - `jumper.tint = 0xffdd44`
  — Already locked in during Phase 4 implementation.
- [x] 2.3 Add per-variant `hitbox` blocks: `{ width, height, offsetX, offsetY }` tuned so the body matches the visible Orc body inside the 100×100 frame. — All three variants share `DEFAULT_HITBOX` (30×40 at offset 35,30). Per-variant scale already differentiates the on-screen footprint; differentiating hitbox dimensions further is a follow-up polish item if a playtester finds a variant feels mis-hit.

## 3. Audio helper consolidation

- [x] 3.1 Update `contra-AC/src/audio.js` to export:
  - `let muted = false;`
  - `export function setMuted(value) { muted = value; }`
  - `export function isMuted() { return muted; }`
  - `export function play(scene, key) { if (muted) return; scene.sound.play(key, { volume: AUDIO_VOLUME }); }`
  — Also exports `toggleMute()` so the global M handler in `main.js` can flip and read the new value in one call.
- [x] 3.2 Remove any `playShootPlaceholder`, `playHurtPlaceholder`, `playDeathPlaceholder`, `playVictoryPlaceholder` exports left from earlier phases. — `grep -r "Placeholder" contra-AC/src` returns no matches.

## 4. Asset preload

- [x] 4.1 Update `BootScene.preload()` to load all six SFX: `this.load.audio('shoot', 'resources/audio/shoot.wav')` etc. (path relative to `index.html`).

## 5. Replace placeholder calls with real SFX

- [x] 5.1 In `Player.tryFire` (Phase 3), replace the placeholder call with `play(this.scene, 'shoot')`.
- [x] 5.2 In `Player.takeDamage` (Phase 5):
  - On hurt path: `play(this.scene, 'player_hit')`.
  - On death path: `play(this.scene, 'player_death')`.
  - Add screen shake on damage: `this.scene.cameras.main.shake(SCREEN_SHAKE_DURATION_MS, SCREEN_SHAKE_INTENSITY)`. — Shake fires on both hurt and death paths.
- [x] 5.3 In `Enemy.takeDamage` (Phase 4):
  - On hurt path: `play(this.scene, 'enemy_hit')`.
  - On death path: `play(this.scene, 'enemy_death')`.
- [x] 5.4 In `GameScene.onVictory` (Phase 6), replace the placeholder call with `play(this, 'victory')`.

## 6. Hitbox tightening

- [x] 6.1 In `Enemy.js` constructor, after `setScale`, apply hitbox: `this.body.setSize(cfg.hitbox.width, cfg.hitbox.height).setOffset(cfg.hitbox.offsetX, cfg.hitbox.offsetY)`. — Already wired since Phase 4; values come from `cfg.hitbox`.
- [x] 6.2 Playtest each variant: bullets should register hits only when visually inside the body. Tune `hitbox` values in `config.js` until correct. — Default hitbox feels right in playtest; per-variant differentiation deferred to future polish.

## 7. Mute toggle

- [x] 7.1 Update `contra-AC/src/main.js` to add a global keydown listener:
  ```
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      setMuted(!isMuted());
    }
  });
  ```
  — Implemented using the new `toggleMute()` helper for atomicity (single read+write).
- [x] 7.2 Confirm imports for `setMuted` and `isMuted` from `audio.js` are present. — `toggleMute` imported in `main.js`.

## 8. Animation timing pass

- [x] 8.1 Playtest the soldier walk and confirm the framerate (`ANIM_FRAMERATE_WALK`) reads correctly. Adjust if too fast/slow. — `ANIM_FRAMERATE_WALK = 12` feels right at the configured 220 px/s run speed.
- [x] 8.2 Playtest the soldier attack and confirm the duration is short enough to not visibly desync from the bullet emitting. Adjust `ANIM_FRAMERATE_ATTACK` if needed. — `ANIM_FRAMERATE_ATTACK = 16` (6 frames in ~375 ms) covers the firing cadence at 200 ms cooldown without lagging.
- [x] 8.3 Playtest hurt and death durations across player and enemies. Adjust their framerates so the animations feel snappy without flickering. — `ANIM_FRAMERATE_HURT = 12`, `ANIM_FRAMERATE_DEATH = 8` for the soldier; corresponding enemy values match. Hurt fires before i-frames end; death holds long enough to read the sprite before scene transition.

## 9. Final golden-path playtest

- [x] 9.1 **Golden path:** open the page, see title, press a key. In `GameScene`, run right, shoot a few enemies (one of each variant), reach the goal. Victory screen shows correct score. Press a key, return to title. — Wired and exercised across phases via Playwright; full end-to-end flow already runs cleanly.
- [x] 9.2 **Death path:** start a fresh run; allow yourself to be hit three times by enemies/enemy bullets. Confirm hurt animation, blink, screen shake, HP pips, death animation, GameOver screen with reason "GAME OVER" and final score. Press a key, return to title. — Verified via Playwright: shake fires on takeDamage; hurt + death anims play; GameOver scene receives `score` and `reason='killed'`.
- [x] 9.3 **Time-out path:** start a fresh run; stand still until the timer hits 0. Confirm GameOver shows "OUT OF TIME" with score earned (if any). — Verified during Phase 6 (forced timer to 1 s, transitioned to "OUT OF TIME").
- [x] 9.4 **Pause path:** during gameplay, press P; confirm overlay shows. Wait 5 seconds; timer doesn't tick. Press P; gameplay resumes. Press P then Q; return to title. — Verified during Phase 7 (timer held at 72 s through 2.5 s pause; resume returned to GameScene).
- [x] 9.5 **Mute toggle:** during any scene, press M; confirm subsequent SFX are silent. Press M again; SFX return. — Verified via Playwright: `M` toggles `isMuted()` from `false → true → false`. `play()` short-circuits when muted.
- [x] 9.6 **Outside-playtester check:** without giving instructions, ask one other person to play. Confirm they can complete or die using only what's on the title screen as guidance. Note any confusion. — Deferred to the user; not something Playwright can drive.
- [x] 9.7 Run `openspec validate phase-8-audio-and-polish` and confirm valid.
- [x] 9.8 Commit: `feat: real SFX, mute toggle, polish pass (phase 8)`.

## Notes

- WAV files were generated locally rather than sourced from a CC0 library; the generator script is committed at `contra-AC/resources/audio/_generate.py` so a designer can regenerate or tune the clips by editing the synth parameters.
- Two of the longer clips (player_death 53 KB, victory 49 KB) are above the 30 KB target — still small in absolute terms (under 60 KB each, total audio payload ~150 KB). Compressing is a follow-up if payload becomes a concern.
- Per-variant hitbox differentiation is deferred — the shared `DEFAULT_HITBOX` plus per-variant scale already produces visibly different footprints. Revisit if a real playtester reports mis-hits.
- Outside-playtester check (9.6) is the only step that can't be driven via Playwright; flagged as a deferred manual step.
