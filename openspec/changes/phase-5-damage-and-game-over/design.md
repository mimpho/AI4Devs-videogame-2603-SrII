## Context

Phases 2–4 built a player on a level, a fire system, and three enemy variants — but a run cannot end. Without a damage→HP→game-over loop, the project's gameplay tension is theoretical. Phase 5 ships the loop: enemies and enemy bullets damage the player, the HUD shows current HP, dying transitions to a `GameOverScene` that returns to the title.

This phase is also the project's first HUD (informing Phase 6's timer and Phase 7's score), the first non-Boot/Title/Game scene introduced post-Phase-1, and the first invulnerability-window pattern (a generic feel device any later "stunned on hit" feature can reuse).

Constraints unchanged. Tuning still in `config.js`. No new art added — HP indicator drawn with primitives or text.

## Goals / Non-Goals

**Goals:**
- Enemies and enemy bullets reduce player HP by 1 per hit.
- Hit triggers an i-frame window during which further damage is ignored; the sprite blinks while invulnerable.
- HP indicator (3 pips) renders in the HUD, fixed to camera.
- A `SCORE: 0` placeholder field in the HUD reserves layout for Phase 7.
- HP 0 triggers the death animation, then transitions to `GameOverScene`.
- `GameOverScene` shows "GAME OVER" + "Press any key to retry" and returns to `TitleScene`.

**Non-Goals:**
- No multi-hit weapons, no damage variation per enemy variant — every hit is 1 HP.
- No checkpoints, no extra lives, no respawn at-position.
- No persistent score (Phase 7 doesn't persist either; nothing in MVP does).
- No timer expiry path yet (Phase 6 wires that into the same Game Over scene).
- No real audio — placeholder hurt/death blips only.

## Decisions

### Decision 1: HP lives on `Player.js`; HUD subscribes via scene events

**Choice:** `Player` owns `this.hp` as the source of truth, initialized from `PLAYER_MAX_HP`. On HP change, the player emits `'player-hp-changed'` on `this.scene.events`. The HUD listens and re-renders the pip row.

**Why:**
- Single source of truth: anyone can read `player.hp`, but only the player mutates it.
- Event-based HUD avoids polling each frame.
- Phase 6's timer and Phase 7's score will use the same scene-event pattern, keeping the HUD update model uniform.

**Alternatives considered:** HUD reads `player.hp` every frame (rejected — polling, even though cheap, sets a bad pattern); store HP on the scene (rejected — splits the source of truth).

### Decision 2: I-frames as a wall-clock window with sprite blink

**Choice:** On hit, set `this.invulnerableUntil = scene.time.now + PLAYER_HIT_IFRAMES_MS`. Damage callbacks early-return if `time < invulnerableUntil`. While invulnerable, a `tween` toggles `alpha` between 1 and 0.4 every `PLAYER_HIT_BLINK_INTERVAL_MS`. On i-frame end, alpha resets to 1 and the tween clears.

**Why:**
- Wall-clock based — frame-rate independent, like Phase 3's fire cooldown.
- Blink is the universal language for "I-frames are active". A player who has never seen this game still reads it correctly.
- The i-frame applies to *all* damage sources (contact, enemy bullets) — shared callback gate.

### Decision 3: HUD is its own module if non-trivial; otherwise inline in `GameScene`

**Choice:** Start inline. If HUD code grows past ~40 lines (HP pips + score placeholder + later timer + score field), extract `contra-AC/src/ui/HUD.js`. Phase 6 likely triggers the extraction.

**Why:**
- Don't pre-create a module for a feature that's small now. Extract when the cost of inlining exceeds the cost of an extra file.
- Keeps Phase 5's diff small.

### Decision 4: HP pips drawn with primitives, not sprites

**Choice:** Three filled rectangles (or arcs) drawn via `this.add.graphics` for each pip, with a stroke. Filled when alive, hollow when lost.

**Why:**
- No new art: roadmap's eight-phase plan does not budget HP-icon assets, and adding them now would set a precedent.
- Primitives mean a designer can adjust pip color/size/spacing in `config.js` without touching art.
- A `text` indicator (`HP: 3`) is even simpler but reads less arcade-like; pips win on feel without significant code cost.

### Decision 5: Death is an animation that *then* transitions

**Choice:** On HP→0: disable player input and physics-driven movement, play `soldier-death` once, on `animationcomplete` call `this.scene.scene.start('GameOverScene', { reason: 'killed' })`.

**Why:**
- Playing the animation before transitioning gives the player visual closure on what just happened.
- Disabling input prevents firing during death.
- Passing `{ reason }` through `scene.start` data sets up Phase 6's `'time_up'` reason without restructuring the scene's signature later.

### Decision 6: `GameOverScene` is a top-level scene, not an overlay

**Choice:** `GameOverScene` replaces `GameScene` (started via `scene.start`, not `scene.launch`). The world is gone; only the GAME OVER text and prompt show.

**Why:**
- The world is over — nothing to see beneath. Simpler to teardown and recreate on retry than to maintain a paused-but-visible game.
- Phase 7's pause is the overlay-style scene; Game Over is not.
- Memory: when the player retries, `TitleScene` → `GameScene` rebuilds fresh, no state leaks.

### Decision 7: "Press any key to retry" returns to `TitleScene`, not `GameScene`

**Choice:** `GameOverScene` listens for any keydown and starts `TitleScene`.

**Why:**
- Roadmap explicitly: "→ returns to `TitleScene`".
- A direct retry into `GameScene` would feel snappier but also accidentally bypasses the title — the player sees the title at most once per page load, which feels wrong.
- Title → Game costs ~200ms; not a noticeable delay.

## Risks / Trade-offs

- **Damage during death animation** → Mitigation: on HP→0 set `this.invulnerableUntil = Infinity` (or a flag) so any contact during the death animation no-ops.
- **HUD visible behind GameOverScene** → Mitigation: `scene.start('GameOverScene')` stops `GameScene`, which removes its HUD. If we ever switched to launch-as-overlay, the HUD would need explicit hide.
- **HP-pip layout shift when timer/score added later** → Mitigation: HUD constants in `config.js` define the slot positions. Phase 6/7 just fill the slot they already exist for.
- **Player getting stuck in i-frames if event order goes wrong** → Mitigation: i-frames end on a wall-clock check, not an event. Even if the blink tween fails, damage gating still expires correctly.
- **Hit-register order ambiguity (one frame, two damages)** → Mitigation: damage callback checks `invulnerableUntil` *before* applying. Two enemies overlapping in one frame still result in 1 HP loss; the i-frame starts on the first hit.

## Migration Plan

Additive over Phase 4. Rolling back removes damage wiring and the Game Over scene; Phase 4's enemies remain.

## Open Questions

- **`PLAYER_HIT_IFRAMES_MS`** — start at `1000ms`. Tune so the player can survive walking past one enemy without taking 3 hits but not so long that bullets pass through harmlessly.
- **`PLAYER_HIT_BLINK_INTERVAL_MS`** — start at `100ms` (5 blinks per second of invulnerability). Faster reads as electric/static; slower reads as broken.
- **GAME OVER reason text** — Phase 5 only ships `'killed'`. Phase 6's tasks file is responsible for adding `'time_up'`. Phase 5 still passes `reason` so Phase 6 can extend without restructuring.
