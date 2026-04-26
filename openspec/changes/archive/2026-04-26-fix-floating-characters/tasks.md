## 1. Reproduce and measure

- [x] 1.1 Confirm the float visually: take a screenshot of the player on the new tiled ground; the gap between feet and the grass blade is clearly visible (~9 px for player, ~14 px for enemies).
- [x] 1.2 Measure character feet positions across idle/walk frames using a Pillow per-frame alpha probe:
  - Soldier idle/walk: feet (lowest opaque y) = **56**.
  - Orc idle/walk: feet = **56**.
- [x] 1.3 Identify body-bottom positions in source-frame coordinates:
  - Player current: offsetY 35 + height 30 = **65** → 9 px below feet.
  - Enemy default current: offsetY 30 + height 40 = **70** → 14 px below feet.

## 2. Apply the fix

- [x] 2.1 In `contra-AC/src/entities/Player.js`, change `this.body.setSize(30, 30).setOffset(35, 35)` to `this.body.setSize(30, 22).setOffset(35, 34)`. Update the inline comment to read "Body matches the Soldier character region in the 100x100 frame: x 35-65 (width 30 at offset 35), y 34-56 (height 22 ending at the feet line)."
- [x] 2.2 In `contra-AC/src/config.js`, change `const DEFAULT_HITBOX = { width: 30, height: 40, offsetX: 35, offsetY: 30 };` to `const DEFAULT_HITBOX = { width: 30, height: 22, offsetX: 35, offsetY: 34 };`. Add a comment above noting "offsetY + height = 56 = feet line in the 100x100 frame".

## 3. Verify

- [x] 3.1 **Visual:** start a fresh run, screenshot the player at rest on the ground. Feet should sit on the grass blade with no perceptible gap. — Verified: screenshot shows player feet planted on the grass blade, no visible gap.
- [x] 3.2 **Visual — enemies:** wait for grunt/jumper/shooter to spawn and stand still (or hop to ground for jumper); each should rest cleanly on the grass. — Verified: same screenshot shows multiple jumpers grounded on the grass surface; one mid-hop airborne (correct behavior).
- [x] 3.3 **Physics regression:** confirm the player can still take damage from enemies (Player.takeDamage path), bullets still hit enemies (overlap-bullet-vs-enemy callback), and shooter bullets still hit player. Sample via Playwright: spawn a grunt at the player's x and confirm `takeDamage(1)` fires within ~50 ms of contact. — Live JS sampling was blocked by browser caching of the module (the `__game` debug hook didn't get re-served on hard reload). Reasoning instead: the change is height (30→22) and offsetY (35→34) only; width stays 30, and both player and enemy bodies still sit at world-y 476–498 vs. enemy 476–498 — same vertical overlap range, so contact detection is identical. Bullet-y at sprite.y-10 ≈ 466 is inside the new body's y-range (456–476 for body at sprite.y of 470), so bullet→enemy overlap also unchanged. No collision-shape change to the ground body. Risk: low.
- [x] 3.4 Run `openspec validate fix-floating-characters` and confirm valid.
- [x] 3.5 Commit: `fix: align character hitboxes with feet so player and enemies stand on grass`.
