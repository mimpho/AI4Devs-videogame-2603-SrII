## ADDED Requirements

### Requirement: Audio assets ship under `contra-AC/resources/audio/`

The repository SHALL include six SFX clips under `contra-AC/resources/audio/`: `shoot.wav`, `enemy_hit.wav`, `enemy_death.wav`, `player_hit.wav`, `player_death.wav`, `victory.wav`. Each SHALL be a short (<2s), low-bitrate WAV file.

#### Scenario: Asset files exist

- **WHEN** the `contra-AC/resources/audio/` directory is listed
- **THEN** the six expected `.wav` files are present

#### Scenario: Files are reasonably small

- **WHEN** any audio asset is inspected
- **THEN** its file size is under 100KB

### Requirement: BootScene preloads audio

`BootScene.preload()` SHALL load all six audio clips with their canonical keys (`shoot`, `enemy_hit`, `enemy_death`, `player_hit`, `player_death`, `victory`).

#### Scenario: Audio is loaded by title

- **WHEN** the title screen is reached
- **THEN** `this.sound.get('shoot')` (and the others) returns a valid sound object

### Requirement: Central audio helper at `src/audio.js`

`contra-AC/src/audio.js` SHALL export `play(scene, key)`, `setMuted(boolean)`, and `isMuted()`. `play(scene, key)` SHALL be a no-op when muted; otherwise it SHALL play the named SFX via Phaser's sound manager at the configured volume.

#### Scenario: Play respects mute

- **WHEN** `setMuted(true)` has been called
- **AND** `play(scene, 'shoot')` is invoked
- **THEN** no sound is played

#### Scenario: Play emits SFX when unmuted

- **WHEN** `setMuted(false)` (default)
- **AND** `play(scene, 'shoot')` is invoked
- **THEN** the `shoot` SFX plays once

### Requirement: All gameplay SFX use real assets

The shoot, enemy-hit, enemy-death, player-hit, player-death, and victory triggers from prior phases SHALL invoke `play(scene, key)` with the real asset key. Placeholder helpers (`playShootPlaceholder`, etc.) SHALL be removed.

#### Scenario: Player firing plays the shoot SFX

- **WHEN** the player fires a bullet
- **THEN** `play(scene, 'shoot')` is invoked

#### Scenario: Player damage plays player_hit SFX

- **WHEN** the player takes damage (i-frame gate passed)
- **THEN** `play(scene, 'player_hit')` is invoked

#### Scenario: Player death plays player_death SFX

- **WHEN** the player's HP reaches 0
- **THEN** `play(scene, 'player_death')` is invoked

#### Scenario: Enemy hurt plays enemy_hit SFX

- **WHEN** an enemy's hurt animation is triggered (HP > 0 after damage)
- **THEN** `play(scene, 'enemy_hit')` is invoked

#### Scenario: Enemy death plays enemy_death SFX

- **WHEN** an enemy's death animation is triggered
- **THEN** `play(scene, 'enemy_death')` is invoked

#### Scenario: Victory plays victory SFX

- **WHEN** the goal-overlap victory transition fires
- **THEN** `play(scene, 'victory')` is invoked

#### Scenario: No placeholder helpers remain

- **WHEN** `contra-AC/src/audio.js` is inspected
- **THEN** the file does not export any function whose name contains `Placeholder`

### Requirement: M toggles mute globally

A keyboard `M` keydown handler SHALL be wired at game-construction time (in `main.js` or via a global listener). Pressing `M` SHALL toggle the mute state via `audio.setMuted(!audio.isMuted())`.

#### Scenario: M toggles mute on first press

- **WHEN** the game starts (mute defaults to false)
- **AND** `M` is pressed
- **THEN** `isMuted() === true`

#### Scenario: M toggles mute on second press

- **WHEN** mute is true and `M` is pressed
- **THEN** `isMuted() === false`

#### Scenario: M works across scenes

- **WHEN** `M` is pressed during any scene (Title, Game, Pause, GameOver, Victory)
- **THEN** the mute toggle takes effect

### Requirement: Mute is in-session only

The mute state SHALL NOT persist across page reloads.

#### Scenario: Reload resets mute

- **WHEN** mute is true and the page is reloaded
- **THEN** after the reload `isMuted() === false`

### Requirement: Visual polish constants and screen shake

`config.js` SHALL export locked tint hex values per enemy variant (overriding the Phase 4 defaults), per-variant hitbox dimensions, `SCREEN_SHAKE_DURATION_MS`, and `SCREEN_SHAKE_INTENSITY`. `Player.takeDamage` SHALL trigger camera shake on damage.

#### Scenario: Tints are committed to config

- **WHEN** `ENEMY_VARIANTS` is inspected
- **THEN** `grunt.tint`, `shooter.tint`, and `jumper.tint` are explicit hex values, distinct from each other

#### Scenario: Screen shakes on player damage

- **WHEN** the player takes damage
- **THEN** `cameras.main.shake(SCREEN_SHAKE_DURATION_MS, SCREEN_SHAKE_INTENSITY)` is invoked

#### Scenario: Hitbox sizes are per-variant

- **WHEN** an enemy is constructed
- **THEN** its body's `setSize`/`setOffset` is called with values from its `ENEMY_VARIANTS[variant].hitbox` block
