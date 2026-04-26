## Context

The user reported `Uncaught TypeError: bullet.disableBody is not a function` at `GameScene.js:51` after playing for a while. Reproduced via Playwright with a single bullet fired at y=470 (body bottom y=486 vs ground top y=476) — same stack trace, same line.

Phaser 3.80 source flow for `physics.add.collider(group, sprite, cb)`:
1. `World.collide` → `World.collideObjects(group, sprite, cb, ...)`.
2. `collideObjects` checks types: object1=GROUP, object2=SPRITE → routes to `World.collideSpriteVsGroup(object2, object1, cb, ...)` — i.e. **reorders** the args.
3. `collideSpriteVsGroup(sprite, group, cb, ...)` iterates the group and for each member calls `collideSpriteVsSprite(sprite, member, ...)`.
4. `collideSpriteVsSprite(sprite1, sprite2, cb, ...)` invokes `cb(sprite1, sprite2)` — i.e. the standalone sprite first, then the group member.

Net effect: regardless of whether `collider(group, sprite, cb)` or `collider(sprite, group, cb)` is called, the callback always receives `(sprite, group_member)`. This is the opposite of what the order-as-passed reading suggests.

Why this only triggers now:
- Pre-`fix-floating-characters`: enemies stood with sprite.y around 456 (body bottom in source frame at y=70). Shooter bullets fired at sprite.y - 8 = 448 → bullet body (~32×32) extends y=432–464. Ground top at y=476. **No overlap** with ground.
- Post-`fix-floating-characters`: enemy sprite.y is around 470 (body bottom at frame y=56 now). Shooter bullets fire at y=462 → body y=446–478. **Overlaps ground** at y=476 by 2 px. First shooter bullet hits the bug.
- Player bullets fire at player.y - 10. Player.y after the body fix is around 470. So player bullets fire at y=460, body y=444–476 — exactly grazing the ground top. They occasionally hit the bug too, just less often than enemy bullets.

## Goals / Non-Goals

**Goals:**
- The bullet-vs-ground collider's callback receives the bullet as the named-bullet argument, so `bullet.disableBody(true, true)` works.
- Same intent as before: bullet despawns on ground contact.
- Minimum diff; no other colliders touched.

**Non-Goals:**
- No defensive try/catch in the callback (the right fix is correct arg ordering, not error suppression).
- No change to bullet body geometry, fire offsets, or ground body geometry.
- No general "always destructure both args and pick the bullet" helper. One-line reorder suffices.

## Decisions

### Decision 1: Reorder, don't sniff

**Choice:** `physics.add.collider(this.groundBody, this.bullets, (ground, bullet) => bullet.disableBody(true, true))`.

**Why:**
- Phaser's documented behavior is "callback receives sprite first, group member second" (after the internal reorder). Passing `(sprite, group)` matches the dispatch — what you pass is what you get back, in the same order.
- An alternative — `(a, b) => { const bullet = a.disableBody ? a : b; ... }` — works but encodes the bug into the call site and makes a future reader wonder why both args are sniffed. Reorder is cleaner.

**Alternatives considered:**
- *Leave args as `(this.bullets, this.groundBody, ...)` and rename the callback param to `ground`.* Same outcome but counter-intuitive: the first arg passed is actually the group, but the callback parameter would be named after the second arg. Cognitively worse.
- *Replace the Rectangle ground body with a Sprite-based static body.* Phaser's `Sprite` does have `disableBody`, but the args would still be reordered by Phaser; this just hides the issue rather than fixing it.

### Decision 2: No spec delta

**Choice:** Don't add a new requirement to `combat-shooting`. The Phase 3 requirement "bullets despawn when colliding with the ground" already exists; this change makes the implementation actually fulfill it without throwing.

**Why:**
- This is implementation-aligning-with-spec, not a new behavior. Adding a "callback args order" requirement would leak Phaser's internals into our spec.
- The closest near-spec is `fix-shooting-arrows`'s "recycled bullets fire identically to fresh ones". A similar phrasing here ("bullet despawns cleanly when overlapping the ground body") could be added, but the Phase 3 spec already says "bullets despawn on ground contact". Repeating it adds noise.

## Risks / Trade-offs

- **Reordering colliders is a footgun for Phase 9+.** Any future collider that relies on argument-order conventions could re-introduce this class of bug. Mitigation: add an inline comment at the fixed line explaining Phaser's dispatch ordering, so future contributors know why the order is what it is.
- **Other colliders look similar in structure.** Reviewed all of them before fixing:
  - `collider(this.player, this.groundBody)` — no callback, separation only. Fine regardless of arg order.
  - `collider(this.enemies, this.groundBody)` — no callback. Fine.
  - `collider(this.player, this.enemies)` — no callback. Fine.
  - `overlap(this.bullets, this.enemies, (bullet, enemy) => …)` — group vs group; Phaser's `collideGroupVsGroup` callback IS `(member1, member2)` matching input order. Currently correct.
  - `overlap(this.player, this.enemies, (player, enemy) => …)` — sprite vs group; same dispatch as bullet-vs-ground but the player **is** the sprite (passed first). Reorder happens but result is still `(player, enemy)`. Currently correct.
  - `overlap(this.player, this.bullets, (player, bullet) => …)` — sprite vs group; same as above. Currently correct.
  - `overlap(this.player, this.goal, () => onVictory())` — sprite vs sprite. Direct `collideSpriteVsSprite`. Args match input order. Currently correct.
- Only the bullet-vs-ground collider has the `(group, sprite, callback_using_first_arg_as_groupMember)` shape. One-line fix is sufficient.

## Migration Plan

Single-line edit. Rollback = revert.

## Open Questions

- **Should we add a Phaser-quirks comment to a CONVENTIONS doc?** The CLAUDE.md "Conventions" section already exists; one bullet about "always pass the standalone sprite first to `physics.add.collider` when one side is a group" would prevent recurrence. Not strictly required for this fix; can be a follow-up doc tweak if it happens again.
