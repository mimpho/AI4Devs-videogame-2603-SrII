## Context

A title screen showing "Press any key to start" is the only player-facing guidance in the game. Once `GameScene` starts, the player must already know that arrow keys move, Space jumps, Z fires, and P pauses. That's a small but real onboarding gap, and the sky region above the gameplay is empty space we can use without disturbing the action below.

The HUD (HP pips + score + timer) sits in the top-left and is camera-anchored. The pause overlay (Phase 7) lives in its own scene and renders the entire viewport. The right home for an instructions block is the sky band: camera-anchored, centered horizontally, below the HUD row, fades after 10 seconds.

## Goals / Non-Goals

**Goals:**
- A new player can read the basic controls within the first 10 seconds of any `GameScene` run.
- The overlay does not block input or visually interfere with the gameplay area (player, enemies, ground).
- Overlay self-destructs cleanly so it never lingers and never leaks tweens / timers across scene restarts.
- One config-level switch for duration so a designer can tune it without touching code.

**Non-Goals:**
- No "skip tutorial" toggle, no persistence, no first-run-only logic.
- No multilingual or accessibility-oriented variants. English text only.
- No animated/inline glyphs (e.g., a literal arrow-key icon). Plain text suffices.
- No tutorial state machine ("press Z to learn shoot, then we move on"). Static reference.

## Decisions

### Decision 1: Separate `Instructions` UI module

**Choice:** New file `contra-AC/src/ui/Instructions.js` exporting a class. Constructor signature `new Instructions(scene)` mirrors `HUD`. The class internally creates the text lines, schedules its fade-out, and destroys its game objects.

**Why:**
- Same pattern as `HUD.js` (Phase 5/6/7). A reader scanning `src/ui/` sees what's an overlay and what's gameplay.
- Encapsulation: lifecycle (fade + destroy) lives next to the text creation. `GameScene.create` stays a one-line call.
- A future "skip tutorial" config could go inside this class without rippling out.

**Alternatives considered:**
- *Inline the ~25 lines in `GameScene.create`.* Tempting because it's small, but every other UI overlay in the project is its own file; consistency wins.
- *Render via PauseScene-style overlay scene.* Way too heavy for a static, non-interactive block of text.

### Decision 2: Camera-anchored text, sky-band positioning

**Choice:** All text uses `setScrollFactor(0)` (anchored to camera). Position in screen-relative coords: centered horizontally at `GAME_WIDTH / 2`, vertical Y at `INSTRUCTIONS_TOP_Y` (a constant placing it just below the HUD row, around y=60). Each line below stacks down with `INSTRUCTIONS_LINE_HEIGHT` spacing.

**Why:**
- The HUD claims y=16 to ~y=34. The ground starts at y=476. The sky band y=50 → y=200 is empty in normal play (player only enters it via tall jumps).
- `setScrollFactor(0)` matches the HUD pattern. The overlay stays put as the camera scrolls, so a player who runs across the level still sees the controls during the first 10s.
- Centering horizontally avoids visual conflict with the left-aligned HUD.

**Alternatives considered:**
- *Bottom of the screen ("subtitle" placement).* Ground occupies the bottom; would overlap with grass/dirt visuals.
- *Right-aligned in the corner.* Less readable; players' eyes scan left-to-right starting at the HUD.

### Decision 3: 10-second visible duration, then a 500 ms fade

**Choice:** `INSTRUCTIONS_DURATION_MS = 10000` (full opacity), then a `tweens.add({alpha: 0, duration: 500})`, then `destroy()` on tween complete.

**Why:**
- 10 seconds is enough for a player to read 4-5 lines of compact text without rushing. Longer would visually clutter the run.
- A 500 ms fade is the standard "soft disappear" duration — long enough to be noticed, short enough to not draw the eye.
- Destroying after the tween prevents a stale game object from sitting in the scene's display list.

### Decision 4: Lifecycle scoped to a single `GameScene` instance

**Choice:** No persistence. Every time `GameScene.create()` runs (fresh start, retry from Game Over, retry from Victory), a new `Instructions` overlay is built. No `localStorage`, no scene-data flags.

**Why:**
- Consistent with the project's "no persistence" convention (high score, mute state, score history — all in-session only).
- Cheap: rebuilding the overlay on every retry costs ~5 ms once and runs through the same fade-and-destroy cycle.
- Simple mental model: "every run shows it" is easier to reason about than "shows the first time per session, with a flag to reset".

### Decision 5: Plain text content keyed in the module, not a config

**Choice:** Lines like `"MOVE  Arrow keys / WASD"`, `"JUMP  Space"` live in `Instructions.js` as a hardcoded array. `config.js` only exposes the timing/style knobs.

**Why:**
- Configuring text via `config.js` invites localization scope creep. Out of scope.
- The text rarely changes. Keeping it next to the rendering code is more discoverable than a config blob.
- A designer can still tweak — they just open `Instructions.js` instead of `config.js`. Both are within `src/`.

## Risks / Trade-offs

- **Overlay overlaps a high-jumping player or a shooter enemy's bullet** → text is in the upper sky band; the player can briefly cross into it during a jump. The text uses a slightly translucent background or shadow so the player remains visible. In playtest the overlap reads as "you can see through it"; not a real issue.
- **Tween/timer leaks if the scene is stopped before the overlay completes** → fade-out timer is added via `scene.time.delayedCall`. When `GameScene` is stopped (Game Over, Victory, Quit), Phaser cancels the scene's time events and tweens automatically. No manual cleanup needed.
- **Overlay shows after retry which veteran players might find annoying** → 10 seconds is a short price to pay for consistency. If a future "veteran mode" is wanted, gating with a `localStorage` flag is a one-line addition; deferred.
- **Text wider than the canvas at the chosen font size** → keep lines short (≤30 chars) and use a monospace font sized so 30 chars at the chosen size fits within `GAME_WIDTH - 32` px (canvas width minus margin). Verified at design time with the chosen font size of ~16 px.

## Migration Plan

Additive over the current scene set. No data migration. Rollback removes the new module and the one constructor call in `GameScene.create()`.

## Open Questions

- **Should the overlay also appear on the title screen?** Title already shows "Press any key to start" — a controls reference there could be useful too, but it adds another module-instance and conflates the "start" screen with the "playing" screen. Out of scope here; revisit if a playtester says they couldn't find the controls.
