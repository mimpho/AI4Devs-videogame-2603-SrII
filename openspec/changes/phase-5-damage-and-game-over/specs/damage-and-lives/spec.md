## ADDED Requirements

### Requirement: Player has HP initialized from `PLAYER_MAX_HP`

The Player entity SHALL maintain an `hp` property initialized to `PLAYER_MAX_HP` (from `config.js`) at scene start.

#### Scenario: HP starts at max

- **WHEN** `GameScene.create()` finishes
- **THEN** `player.hp === PLAYER_MAX_HP`

### Requirement: Damage from enemies and enemy bullets reduces HP by 1

Contact between the player and an active enemy, OR overlap with an enemy bullet (`friendly: false`), SHALL reduce `player.hp` by 1 (subject to the i-frame gate).

#### Scenario: Enemy contact damages

- **WHEN** the player overlaps an active enemy and is not in i-frames
- **THEN** `player.hp` decreases by 1
- **AND** the player enters i-frames

#### Scenario: Enemy bullet damages

- **WHEN** the player overlaps an active enemy bullet and is not in i-frames
- **THEN** `player.hp` decreases by 1
- **AND** the bullet despawns
- **AND** the player enters i-frames

#### Scenario: Damage caps at zero

- **WHEN** `player.hp` is 1 and a hit is registered
- **THEN** `player.hp` becomes 0 (does not go negative)

### Requirement: Invulnerability window after damage

On taking damage, the player SHALL be invulnerable for `PLAYER_HIT_IFRAMES_MS`. During the window, further damage from any source SHALL be ignored. While invulnerable, the player sprite SHALL blink (alpha alternates).

#### Scenario: Subsequent hit during i-frames is ignored

- **WHEN** the player has just been hit and is within i-frames
- **AND** another enemy or enemy bullet overlaps the player
- **THEN** `player.hp` does not change
- **AND** the second damage source remains active (bullet does NOT despawn merely from contact during i-frames)

#### Scenario: Sprite blinks during i-frames

- **WHEN** the player is invulnerable
- **THEN** the sprite's alpha alternates between full and reduced opacity at `PLAYER_HIT_BLINK_INTERVAL_MS`
- **AND** when i-frames end, alpha returns to 1.0

### Requirement: Hurt animation plays on damage taken

On a successful damage event (i-frame gate passed), the Soldier SHALL play the `soldier-hurt` animation once.

#### Scenario: Hurt animation runs

- **WHEN** the player takes damage
- **THEN** the active animation becomes `soldier-hurt`
- **AND** when the hurt animation completes, the active animation reverts to walk or idle based on movement state

### Requirement: HUD displays HP

`GameScene` SHALL render an HP indicator showing the player's current HP as `PLAYER_MAX_HP` pips (filled for current HP, hollow for lost HP). The HUD SHALL be fixed to the camera (does not scroll with the level).

#### Scenario: HUD reflects current HP

- **WHEN** `player.hp` equals `PLAYER_MAX_HP`
- **THEN** all `PLAYER_MAX_HP` pips are filled

- **WHEN** `player.hp` equals 1
- **THEN** 1 pip is filled and the rest are hollow

#### Scenario: HUD does not scroll

- **WHEN** the player moves horizontally and the camera scrolls
- **THEN** the HUD's screen-relative position does not change

### Requirement: HUD reserves a score field

The HUD SHALL render a "SCORE: 0" placeholder text in a fixed slot. Phase 7 fills it with a live value.

#### Scenario: Score placeholder is visible

- **WHEN** `GameScene` is active
- **THEN** the text "SCORE: 0" (or equivalent) is rendered in the HUD layout

### Requirement: HP 0 triggers death animation and Game Over transition

When `player.hp` reaches 0, the player SHALL play the `soldier-death` animation once. On animation completion, the scene SHALL transition to `GameOverScene` with `reason: 'killed'`.

#### Scenario: Lethal hit triggers death

- **WHEN** `player.hp` reaches 0
- **THEN** the active animation becomes `soldier-death`
- **AND** input is disabled
- **AND** the player is invulnerable for the remainder of the animation

#### Scenario: Death animation completion transitions to Game Over

- **WHEN** the death animation completes
- **THEN** the scene transitions via `scene.start('GameOverScene', { reason: 'killed' })`

### Requirement: Damage tuning constants live in `config.js`

`config.js` SHALL export `PLAYER_HIT_IFRAMES_MS`, `PLAYER_HIT_BLINK_INTERVAL_MS`, and HUD layout constants (margins, pip spacing, pip dimensions, score text position).

#### Scenario: Constants exist with the expected names

- **WHEN** `config.js` is imported
- **THEN** the i-frame and HUD layout constants resolve to numeric values
