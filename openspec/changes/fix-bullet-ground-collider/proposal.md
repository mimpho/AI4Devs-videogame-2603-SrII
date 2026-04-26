## Why

The bullet-vs-ground collider in `GameScene` (`GameScene.js:50–52`) crashes with `TypeError: bullet.disableBody is not a function` once any bullet's body actually overlaps the ground body. Reproduced live via Playwright by firing one bullet near ground level — same exact stack the user reported.

Root cause: Phaser's `physics.add.collider(group, sprite, cb)` dispatches internally to `collideSpriteVsGroup(sprite, group, cb)` (sprite reordered to be first), and the callback is invoked with `(sprite, group_member)` — **opposite** of the order passed to `collider()`. So in our wiring `collider(this.bullets, this.groundBody, (bullet) => bullet.disableBody(true, true))`, the first arg named `bullet` is actually the `groundBody` Rectangle, which has no `disableBody` method.

This stayed dormant through Phases 3–7 because bullets fired at the player's torso never reached the ground body's Y range. After `fix-floating-characters` lowered enemy sprite positions by ~14 px (so feet sit on grass), shooter bullets are now spawned 8 px above an enemy sprite that's also lower — putting bullet bodies in the ground body's Y range. Hence: "after playing for a while", the first time a shooter actually fires near the ground, the crash hits.

## What Changes

- Reorder the collider so the standalone sprite (`groundBody`) is the first argument: `physics.add.collider(this.groundBody, this.bullets, (ground, bullet) => bullet.disableBody(true, true))`. This matches Phaser's internal dispatch order and the callback now receives `(ground, bullet)` as named.
- No spec-level behavior change — the requirement "bullet despawns on ground contact" is unchanged. The implementation is brought into line.
- No edits to other colliders/overlaps in the file: bullet-vs-enemies (group vs group), player-vs-enemies (sprite vs group), and player-vs-bullets (sprite vs group) all already pass arguments in the order Phaser invokes the callback.

## Capabilities

### New Capabilities
<!-- None — bug fix only. -->

### Modified Capabilities
<!-- None — implementation correction; no requirement deltas. The combat-shooting "bullet despawns on ground contact" scenario from Phase 3 is what's being made to actually work without throwing. -->

## Impact

- **Files changed:** `contra-AC/src/scenes/GameScene.js` — one collider line.
- **No new files, no constants added, no API changes.**
- **Affected behavior:** any bullet whose body's Y range overlaps the ground body now despawns cleanly without throwing. In normal play this affects shooter-enemy bullets primarily.
- **Out of scope:** bullet body geometry, shooter fire offsets, ground body geometry. The misalignment that brought bullets into the ground's Y range was an intentional fix (`fix-floating-characters`); we leave that in place and fix the collider that was always wrong but never triggered.
