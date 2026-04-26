## Why

After `fix-ground` made the ground render from real atlas tiles, the player and enemies visibly float above the grass. The collision body was tuned in Phase 2/4 against a noisy "anything-goes" tileset visual where ~10 px of misalignment didn't read as wrong; with a clean 16-px-tall grass strip on top of dirt, the gap is unambiguous.

Measured (Pillow probe of every Soldier/Orc idle and walk frame plus the grass tile):
- Soldier feet (lowest opaque pixel): frame y=**56**.
- Orc feet (lowest opaque pixel): frame y=**56**.
- Visible grass-blade row in tile 25: world y=tileTop+1.
- Player body bottom (current): `setOffset(35,35).setSize(30,30)` → frame y=**65**, so feet hover 9 px above the collision top.
- Enemy body bottom (current): `DEFAULT_HITBOX = { width:30, height:40, offsetX:35, offsetY:30 }` → frame y=**70**, feet hover 14 px above the collision top.

The fix is to align body bottoms with the actual character-feet line so the rendered feet sit on the grass tile's surface.

## What Changes

- Tighten `Player.body` from `setSize(30, 30).setOffset(35, 35)` to `setSize(30, 22).setOffset(35, 34)` — body bottom moves from frame y=65 to y=56 (the feet line). Width is unchanged so existing damage-overlap balance is preserved.
- Update `DEFAULT_HITBOX` in `config.js` from `{ width: 30, height: 40, offsetX: 35, offsetY: 30 }` to `{ width: 30, height: 22, offsetX: 35, offsetY: 34 }` — body bottom moves from frame y=70 to y=56. All three enemy variants share this default, so all three are fixed at once.
- No spawn-Y, level-Y, ground-tile-Y, or collision-body-Y changes — the fix is entirely in the per-sprite hitbox geometry.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
<!-- None — visual alignment fix; existing spec scenarios for movement and damage still hold (collision still works, hits still register). -->

## Impact

- **Files changed:** `contra-AC/src/entities/Player.js` (one `body.setSize/setOffset` line), `contra-AC/src/config.js` (one constant block).
- **No new files, no spec deltas.**
- **Gameplay side-effects:** the enemy hitbox shrinks vertically (40→22). Player bullets that previously grazed the top half of the orc sprite no longer register hits — but those grazes were against transparent pixels above the orc's head, so the new behavior is more honest. Enemy-vs-player overlap shrinks the same way, so the player is *slightly* harder to hit. Both effects are corrections, not regressions.
- **Out of scope:** no change to scale, no per-variant hitbox differentiation, no collision-body Y offset (the ground body stays where it is).
