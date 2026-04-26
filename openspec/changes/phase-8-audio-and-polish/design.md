## Context

Phase 7 closes the MVP feature set. Phase 8 is the final pass: real SFX in place of placeholders, a mute toggle, locked-in enemy tints, screen shake on player damage, animation timing tuning, and a documented golden-path playtest. After this phase, the game ships and the roadmap's "Cut from MVP" list becomes the candidate pool for follow-up rounds.

This phase touches almost every prior file because each phase deliberately wired *placeholder* hooks: Phase 3 has a placeholder shoot blip, Phase 5 has placeholder hurt/death blips, Phase 6 has a placeholder win blip. The polish here replaces them — but the wiring sites already exist, so this phase is mostly *substitution*, not new mechanism.

Constraints unchanged. SFX only — background music remains an explicit roadmap non-goal.

## Goals / Non-Goals

**Goals:**
- Real SFX for shoot, enemy-hit, enemy-death, player-hit, player-death, victory.
- A central `audio.js` helper with volume control and a mute toggle bound to `M`.
- Locked-in distinct hex tints for the three enemy variants.
- Tightened enemy hitboxes where the 100×100 sprite has too much transparent padding.
- Screen shake on player damage (low intensity, ~150ms).
- Animation timing pass (walk frame rate, attack duration, hurt/death durations).
- A documented golden-path playtest checklist in `tasks.md`.

**Non-Goals:**
- No background music.
- No mobile / touch controls.
- No accessibility-specific audio cues (subtitles, visual-only mode).
- No persistent settings (mute state is in-session only).
- No graphical settings menu.
- No new gameplay features whatsoever.

## Decisions

### Decision 1: All audio routed through `contra-AC/src/audio.js`

**Choice:** `audio.js` exports `play(scene, key)` for SFX, plus `setMuted(boolean)` and `isMuted()` for the mute state. The placeholder helpers (`playShootPlaceholder`, etc.) introduced in Phases 3/5/6 are removed; their callers now call `play(scene, 'shoot')`, `play(scene, 'enemy_hit')`, etc.

**Why:**
- Volume and mute belong in one place. Currently each placeholder helper writes its own audio path; consolidating means one bug-fix surface.
- Replacing helper *functions* with `play(scene, key)` makes the asset key the contract, not the function name. Phase 8 swapping audio assets becomes a config change, not a callsite change.

**Alternatives considered:** Keep helpers but make each one mute-aware (rejected — three places to forget); use Phaser's sound manager directly in scenes (rejected — couples scene code to Phaser audio API).

### Decision 2: Audio assets under `contra-AC/resources/audio/` as `.wav`

**Choice:** Six clips: `shoot.wav`, `enemy_hit.wav`, `enemy_death.wav`, `player_hit.wav`, `player_death.wav`, `victory.wav`. WAV (not MP3 or OGG) for maximum browser compatibility without licensing.

**Why:**
- Modern browsers all decode WAV. MP3 has historical patent issues; OGG isn't universally supported in Safari.
- File sizes for short SFX are <30KB each — payload is fine.
- WAV is the easiest format to produce from `jsfxr`-style tools or any free SFX library.

**Alternatives considered:** Compressed formats (rejected — playback compatibility matters more than payload at this size); single audio sprite (rejected — six separate clips simpler to manage and update).

### Decision 3: Mute is module-state, not localStorage

**Choice:** `audio.js` keeps `let muted = false` at module scope. `setMuted(true)` flips it; `play()` checks it before invoking sound playback. Mute persists across scenes within a single page session; reload resets it.

**Why:**
- Roadmap explicitly lists "persistent settings" as out-of-scope.
- Module scope is the cheapest way to share state across scenes without restructuring.
- A future polish phase could trivially swap to localStorage; the change is one function.

### Decision 4: `M` key is global, not per-scene

**Choice:** In `main.js` (right after the `Phaser.Game` is constructed), wire a global `M` keydown handler that calls `audio.setMuted(!audio.isMuted())`.

**Why:**
- `M` should work on every screen (gameplay, pause, end screens, title). Per-scene wiring would mean four wirings; one global handler covers all.
- Phaser doesn't expose game-level keyboard listeners, so the implementation is `window.addEventListener('keydown', ...)` filtered to `key === 'm'`. This bypasses Phaser's scene keyboard manager but is fine for a single global toggle.

**Alternatives considered:** Wire in every scene's `create()` (rejected — duplication); use Phaser's input plugin in a "system" scene (rejected — overkill for one toggle).

### Decision 5: Locked tint hex values per variant

**Choice:** Phase 4 left tints as defaults (`0xffffff` for grunt, `0xff8888` for shooter, `0x88ff88` for jumper, or similar). Phase 8 finalizes:
- Grunt: `0xddddff` (cool gray-blue)
- Shooter: `0xff7777` (warm red)
- Jumper: `0xffdd44` (yellow)

**Why:**
- Three colors that are distinct on white-LCD and warm-LCD displays. Avoids near-greens (jumper) and near-grays (grunt) being confused.
- Hex constants in `config.js` mean future tweaks are a one-line edit.
- Readability: the player should be able to identify the variant *before* observing its behavior.

**Alternatives considered:** Per-variant overlay sprites (rejected — explicit roadmap "no new art"); animated palette shifts (rejected — complexity for negligible gain at this scope).

### Decision 6: Hitbox tightening per variant

**Choice:** In each `Enemy` constructor, after `setScale`, call `body.setSize(w, h).setOffset(ox, oy)` with per-variant values committed to `config.js` under a new `hitbox` field per variant block.

**Why:**
- The 100×100 sprite has visible transparent padding; bullets registering against air feels wrong. Tightening to ~60×80 (with offset) makes hits feel honest.
- Per-variant because scale differs — the same source rect at scale 1.0 vs 1.2 needs different offsets.

### Decision 7: Screen shake on player damage

**Choice:** In `Player.takeDamage`, after the i-frame and animation are kicked off, call `this.scene.cameras.main.shake(SCREEN_SHAKE_DURATION_MS, SCREEN_SHAKE_INTENSITY)`.

**Why:**
- Shake is universally readable as "you got hit". Combined with the hurt animation and HP pip change, the damage feedback is unambiguous.
- Constants in `config.js`. Default: 150ms, 0.005 intensity (subtle — Contra is a side-scroller, not a brawler).

### Decision 8: Animation timing pass values land in `config.js`

**Choice:** All animation framerates already live in `config.js` (`ANIM_FRAMERATE_*`). Phase 8 only adjusts values, no new constants.

**Why:**
- Constants were declared centralized from Phase 1 onward exactly so a polish pass could tune feel without touching code. Phase 8 just *uses* this affordance.

### Decision 9: Final-pass playtest checklist in `tasks.md`

**Choice:** A new `## Final playtest` section in `tasks.md` lists the golden path (start → run → shoot → win) and the death path (start → run → take 3 hits → game over) with explicit "what to look for" notes per step. Optional extension: a "demo to one external playtester without instructions" sub-task.

**Why:**
- Roadmap Phase 8 done-criterion: "an outside playtester can start the game and complete or die without instructions". A checklist holds the implementer to that bar.
- "Without instructions beyond what's on the title screen" is the testable phrase; the checklist makes it operational.

## Risks / Trade-offs

- **Audio autoplay restrictions** → Modern browsers gate audio playback on a user gesture. The first key press in `TitleScene` already serves as that gesture, so SFX work from `GameScene` onward. If a SFX is supposed to fire *on* `TitleScene` itself before any input, it would fail silently. Mitigation: no SFX on `TitleScene`; first SFX is the player's shoot, which can only fire post-input.
- **Mute toggle race with audio currently playing** → If `M` is pressed mid-SFX, the playing clip continues. Acceptable for short SFX; a future polish round could call `sound.stopAll()` on mute. Out of scope here.
- **Hitbox tightening breaking existing playtests' feel** → Mitigation: tighten *after* a playtest, with the previous values still committed in git history. If "feels harder" emerges, revert.
- **Screen shake nausea sensitivity** → Default intensity is low; constants in `config.js` allow a designer to dial down or off. A future polish round could add a "reduce motion" toggle (out of MVP scope).
- **WAV files inflating repo size** → Six clips at <30KB each = <200KB total. Within reason; not worth compressing for this MVP.

## Migration Plan

Additive over Phase 7. Rolling back removes the audio assets, swaps placeholders back, and reverts tints. Phase 7's gameplay continues to work.

## Open Questions

- **Asset sourcing** — generate locally with `jsfxr` or similar, or grab from a CC0 library. Either is fine. Prefer `jsfxr`-generated for control over feel.
- **Whether mute should also silence the placeholder Web-Audio shoot clip if it's still in use** — only relevant if asset sourcing slips and one or more placeholders remain. The `audio.js` consolidation in Decision 1 handles this either way.
- **Title-screen background tint** — light visual polish only; can be deferred if running short on the polish-pass time budget.
