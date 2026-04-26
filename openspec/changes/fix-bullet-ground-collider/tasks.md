## 1. Reproduce and confirm root cause

- [x] 1.1 Reproduce the error live: fire a bullet at y=470 (body bottom y=486, overlapping ground top y=476). Console reports the same `TypeError: bullet.disableBody is not a function at GameScene.js:51` the user pasted.
- [x] 1.2 Confirm root cause from Phaser source: `collider(group, sprite, cb)` dispatches `collideSpriteVsGroup(sprite, group, cb)` and the callback receives `(sprite, group_member)`. So `bullet` (named first arg) is actually the `groundBody` Rectangle, which has no `disableBody`.

## 2. Fix

- [x] 2.1 In `contra-AC/src/scenes/GameScene.js`, change the bullet-vs-ground collider from
  ```js
  this.physics.add.collider(this.bullets, this.groundBody, (bullet) => {
    bullet.disableBody(true, true);
  });
  ```
  to
  ```js
  // Phaser's collideSpriteVsGroup dispatch puts the standalone sprite first in the callback,
  // so passing groundBody first lines up with the (ground, bullet) parameter naming.
  this.physics.add.collider(this.groundBody, this.bullets, (ground, bullet) => {
    bullet.disableBody(true, true);
  });
  ```

## 3. Verify

- [x] 3.1 **Repro test (Playwright):** re-run the same script that reproduced the bug — fire one bullet at y=470 — and confirm: no console error, `body.enable` is false, `active` is false. — Verified: bullet at y=470 → `active=false, bodyEnable=false`. Console is clean (only favicon 404).
- [x] 3.2 **Sustained-play simulation:** spawn a shooter at a position whose fired bullets overlap the ground. Observe the bullets despawn on ground contact across at least 5 sequential fires, no errors. — Verified: 5 ground-level player bullets all despawned cleanly. Same code path serves enemy bullets (`friendly: false`); the collider doesn't discriminate, so the enemy case is covered by the same fix.
- [x] 3.3 **Regression on other paths:** fire a bullet that travels above the ground all the way to the camera edge — confirm it still despawns via the off-screen check (Bullet.preUpdate) without ever hitting the ground collider. — Verified: 3 bullets fired at y=300 all reported `active=true, bodyEnable=true, moved 60–70 px` over 100 ms. The above-ground path is unaffected.
- [x] 3.4 Run `openspec validate fix-bullet-ground-collider` and confirm valid.
- [x] 3.5 Commit: `fix: pass groundBody first to bullet collider so the callback receives the bullet as expected`.
