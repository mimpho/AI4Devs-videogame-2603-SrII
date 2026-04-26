## Why

After Phase 7 the game is functionally complete: every state transition works, the loop is closed, the HUD is informative. What it lacks is *feel*. Placeholder synthesized blips were used through Phases 3–6 because audio polish was deferred; the three Orc variants are visually similar because tinting was rough-cut in Phase 4. Phase 8 is the final pass: real SFX for every meaningful action, a mute toggle, distinct enemy tints, and small game-feel touches (screen shake on damage, animation timing tuning) so an outside playtester can pick the game up and feel the loop without instructions.

This is the last MVP phase. After it ships, the game is shippable and the roadmap's "Cut from MVP" list (multiple levels, power-ups, music, etc.) becomes the candidate pool for follow-up rounds.

## What Changes

- New audio assets land under `contra-AC/resources/audio/` (short, royalty-free or generated locally with a `jsfxr`-style tool). At minimum: `shoot.wav`, `enemy_hit.wav`, `enemy_death.wav`, `player_hit.wav`, `player_death.wav`, `victory.wav`. Each is small (<50KB) so total payload stays modest.
- `BootScene` preloads all audio. Each placeholder beep wired in earlier phases is replaced by the corresponding real SFX. SFX are triggered through a small `src/audio.js` helper so volume and the mute toggle live in one place.
- A mute toggle bound to the `M` key, available in `GameScene`, `PauseScene`, and end screens. Mute state persists across scenes within a single page session (kept in a module-level variable in `audio.js`); not persisted across reloads (out of MVP scope).
- Visual tuning pass on the three enemy variants: each gets a distinct, locked-in tint hex value in `config.js`, scaled appropriately so an outside playtester can read "grunt vs. shooter vs. jumper" at a glance. Hitboxes are tightened where the 100×100 sprite has too much transparent padding.
- Screen shake on player damage: brief, low-amplitude `cameras.main.shake` triggered from the `damage-and-lives` flow.
- Animation timing pass: walk loop framerate, attack animation duration, hurt/death durations adjusted for readability.
- Final manual playtest checklist added to `tasks.md`: golden path (start → run → shoot → win) and at least one death path.
- `src/config.js` gains: per-variant locked tint hex values, `SCREEN_SHAKE_DURATION_MS`, `SCREEN_SHAKE_INTENSITY`, audio volume defaults.

## Capabilities

### New Capabilities
- `audio-sfx`: the audio asset manifest, the `audio.js` helper, the mute toggle, and the wiring to every action that should play a sound.

### Modified Capabilities
- `combat-shooting`: shoot SFX upgraded from placeholder beep to the real asset; volume goes through `audio.js`.
- `enemies`: enemy-hit and enemy-death SFX upgraded; per-variant tint constants are finalized in `config.js`; hitbox sizes tightened.
- `damage-and-lives`: player-hit and player-death SFX upgraded; screen shake fires on damage.
- `victory-screen`: victory SFX plays on transition.
- `game-shell`: `BootScene` now also preloads audio; the `M` mute toggle is wired globally.

## Impact

- **New files:** `contra-AC/src/audio.js`, `contra-AC/resources/audio/*.wav` (six clips minimum).
- **Modified files:** every scene module that triggers an SFX (`GameScene`, `GameOverScene`, `VictoryScene`, `PauseScene`), `Player.js`, `Enemy.js`, `Bullet.js`, `BootScene.js`, `config.js`, the HUD module.
- **Constraints honored:** SFX only (no music — explicit roadmap non-goal); no new gameplay features, no graphical settings menu.
- **Out of scope:** background music, mobile/touch controls, persistent settings, leaderboards, accessibility-specific audio cues — all on the post-MVP candidate list.
