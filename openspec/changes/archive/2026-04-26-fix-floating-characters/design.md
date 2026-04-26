## Context

Phase 2 picked the player body as `setSize(30, 30).setOffset(35, 35)` from a quick playtest against the busy old ground (the entire tileset bitmap). That visual was noisy enough to mask the misalignment between the body's bottom edge (frame y=65) and the character's actual lowest opaque pixel (frame y=56). Phase 4 inherited an even larger body for enemies (`height: 40, offsetY: 30`, body bottom at frame y=70), again unnoticed against the noisy ground.

`fix-ground` swapped the visual to a clean 16-px-tall grass tile layered on dirt-fill. With a precise grass surface visible at world y = tileTop + 1, the body-bottom-vs-feet gap is now obviously wrong:
- Player: 9-px gap (feet at frame 56, body bottom at frame 65).
- Enemies: 14-px gap (feet at frame 56, body bottom at frame 70).

Ground tile top is at world y = `GAME_HEIGHT - GROUND_HEIGHT` = 540 − 64 = **476**. Visible grass-blade row at world y ≈ **477**. Collision body top at y=476.

Goal: body bottom = feet line in source frame coordinates (y=56) so when the body rests on the collision boundary at world y=476, the rendered feet are also at y=476 (one pixel above the visible grass blade) — no float.

## Goals / Non-Goals

**Goals:**
- Player and all three enemy variants visually rest on the grass surface — no perceptible gap.
- Hitboxes match where characters visibly are (no phantom hits above heads, no missed hits on bodies).
- Single source of truth: enemy variants keep sharing one default hitbox in `config.js`; player body sets its own values directly.

**Non-Goals:**
- No per-variant hitbox tuning (deferred to future polish).
- No movement/damage spec changes — the collision body, level Y, ground tile Y all stay put.
- No tilemap-based ground; this fix lives entirely in sprite geometry.

## Decisions

### Decision 1: Tighten body height vs. shift the collision body down

**Choice:** Tighten the per-sprite body to match character feet. Leave ground collision and ground tile positions unchanged.

**Why:**
- The bug is sprite-side, not ground-side. The collision body is correct (matches the visible top of the grass tile, which is where the player should logically stand). Moving the ground body would solve the float visually but introduce a half-pixel tile-vs-body offset elsewhere (e.g., the visible grass would extend slightly below the collision plane).
- Sprite hitboxes are the natural place to encode "where the character actually is in the frame". Phase 5 already established this pattern (`setSize/setOffset` per character).

**Alternatives considered:**
- *Lower the ground physics body by ~9 px.* Works for the player but enemies need a different shift (14 px). Different shift per character means we'd need overlapping ground bodies — far worse.
- *Rescale the sprite so character feet land at frame y=99.* Would require source-asset edits or per-frame display origin manipulation. Out of scope and asset-modifying.

### Decision 2: Keep horizontal width unchanged

**Choice:** Player width stays at 30. Enemy default width stays at 30. Only height and Y offset change.

**Why:**
- Horizontal width drives bullet-vs-enemy and player-vs-enemy overlap. Phase 4/5 was tuned around 30-wide hitboxes; tightening width is a separate playtest-driven decision.
- The float is purely vertical. Vertical-only fix keeps the diff minimal and the gameplay feel close to where it was tuned.

**Alternatives considered:**
- *Tighten width too (Soldier ~14 wide, Orc ~21 wide).* Tighter is "more honest" but changes hit registration. If a playtester finds bullets passing through visible enemy bodies, that's a follow-up tweak in `config.js`.

### Decision 3: Single value for all three enemy variants

**Choice:** Update `DEFAULT_HITBOX` once. Grunt, shooter, jumper all reference it via `cfg.hitbox`.

**Why:**
- Per-variant hitboxes were considered in Phase 8 and deferred — the variants differ visually only by tint and scale (1.0/1.1/0.9). Feet line stays at frame y=56 in all of them.
- Across scales 0.9–1.1, the body-vs-visual offset varies by less than 1 world pixel, which is below visual perception.

### Decision 4: No change to body Y offset relative to sprite

**Choice:** New player body `setOffset(35, 34)`, height `22`. Body top at frame y=34, bottom at y=56. Width 30 starts at frame x=35 (unchanged).

**Why:**
- Body bottom = 34 + 22 = 56 = feet line. ✓
- Body top at frame y=34 sits just above Soldier's head (y=38) and Orc's head (y=41). 4-7 px of headroom for "blocking from above" interactions if any later phase adds vertical surfaces.

## Risks / Trade-offs

- **Tighter enemy hitbox could feel like "bullets are missing"** → bullets still register inside the visible character. Pre-fix, bullets registered hits even on transparent pixels above the orc's head, which is the pattern this fix corrects. If post-fix combat feels too loose, restore `height: 30+` and shift `offsetY` to keep bottom at frame 56.
- **Player slightly harder to take damage** → enemy/enemy-bullet overlap area shrinks. Player's HP feels marginally easier to preserve. Tuning knob is the same as above (height + offsetY).
- **Visual seam at body top during attack/jump animations** → attack frames have arms raised; with body top at frame y=34, raised arms may extend above the body. That doesn't affect physics (only the body matters for collision), and it doesn't draw a line — it's just visual. No mitigation needed.
- **Future per-variant tuning** → `DEFAULT_HITBOX` is shared. If grunt vs. shooter vs. jumper ever diverge, replace `cfg.hitbox: DEFAULT_HITBOX` with per-variant blocks. The current fix doesn't preclude that.

## Migration Plan

Two-line diff. No data migration. Rollback = revert.

## Open Questions

- **Should the body bottom land 1-2 px below feet (so feet visually push slightly into the grass blade)?** That's a "feels grounded" polish pass. The current spec aims for feet exactly at the ground line; if playtest shows the float is reduced but still visible, dropping `offsetY` to 33 (body bottom at frame y=55) puts feet 1 px into the blade.
