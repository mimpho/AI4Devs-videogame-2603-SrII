# player-movement Specification

## Purpose
The Soldier player entity, its physics body, animations, and input bindings, plus the world it moves through (ground, camera follow, level bounds). Owns every gameplay primitive that lets the player traverse a level.
## Requirements
### Requirement: Soldier player entity exists in `GameScene`

`GameScene` SHALL instantiate a single Soldier player entity, defined in `contra-AC/src/entities/Player.js`, that participates in Arcade Physics and is rendered at the start of the level.

#### Scenario: Player is created on scene start

- **WHEN** `GameScene.create()` runs
- **THEN** exactly one Player instance exists in the scene
- **AND** it has an Arcade Physics body
- **AND** it stands on the ground rather than falling through it

#### Scenario: Player is rendered using the Soldier sprite

- **WHEN** the player is at rest
- **THEN** the rendered sprite uses the `Soldier/Idle` sprite sheet

### Requirement: Horizontal movement responds to arrow keys and WASD

The player SHALL move horizontally at `PLAYER_RUN_SPEED` (from `config.js`) in response to the Left/Right arrow keys *or* the `A`/`D` keys.

#### Scenario: Right movement with arrow key

- **WHEN** the right arrow is held
- **THEN** the player's horizontal velocity is `+PLAYER_RUN_SPEED`
- **AND** the player faces right
- **AND** the walk animation plays

#### Scenario: Left movement with WASD

- **WHEN** the `A` key is held
- **THEN** the player's horizontal velocity is `-PLAYER_RUN_SPEED`
- **AND** the player faces left
- **AND** the walk animation plays

#### Scenario: Both directions held simultaneously

- **WHEN** Left and Right are held at the same time
- **THEN** the player's horizontal velocity is zero
- **AND** the idle animation plays

#### Scenario: No horizontal input

- **WHEN** no horizontal-movement keys are held
- **THEN** the player's horizontal velocity is zero
- **AND** the idle animation plays

### Requirement: Single ground-only jump

The player SHALL jump exactly once per ground contact in response to the `Space` key, applying an instant upward velocity of `PLAYER_JUMP_VELOCITY` (from `config.js`).

#### Scenario: Jump from ground

- **WHEN** the player is touching the ground and `Space` is pressed
- **THEN** the player's vertical velocity becomes `-PLAYER_JUMP_VELOCITY`

#### Scenario: No double jump

- **WHEN** the player is airborne and `Space` is pressed
- **THEN** the player's vertical velocity is unchanged

#### Scenario: Jump only fires on key-down, not on hold

- **WHEN** `Space` is held continuously after the player lands
- **THEN** at most one new jump is triggered per landing

### Requirement: Gravity and ground collision

World gravity SHALL be set to `GRAVITY` (from `config.js`). The player SHALL collide with the ground and SHALL NOT fall through it.

#### Scenario: Player falls under gravity

- **WHEN** the player is airborne and no jump is active
- **THEN** the player's vertical velocity increases over time toward the floor

#### Scenario: Player rests on the ground

- **WHEN** the player has landed and no jump key is pressed
- **THEN** the player's vertical velocity is zero
- **AND** the player's `body.blocked.down` flag is true

### Requirement: Walk and idle animations

The Soldier SHALL play a walk animation while moving horizontally and an idle animation when stationary.

#### Scenario: Walk animation triggers

- **WHEN** the player's horizontal velocity is non-zero
- **THEN** the active animation key is `soldier-walk`

#### Scenario: Idle animation triggers

- **WHEN** the player's horizontal velocity is zero
- **THEN** the active animation key is `soldier-idle`

### Requirement: Level is `LEVEL_WIDTH_SCREENS` screens wide with a tiled ground

The playable level SHALL extend horizontally from `0` to `LEVEL_WIDTH_SCREENS * GAME_WIDTH` pixels. A continuous ground built from `grass tileset.png` SHALL span the full width.

#### Scenario: Ground spans the level

- **WHEN** the player walks from the leftmost edge to the rightmost edge
- **THEN** the player remains on a continuous, visible ground tile strip the entire way
- **AND** the player never falls through the ground

#### Scenario: Player cannot leave level bounds

- **WHEN** the player attempts to walk past the left edge of the level
- **THEN** the player stops at the left bound

- **WHEN** the player attempts to walk past the right edge of the level
- **THEN** the player stops at the right bound

### Requirement: Camera follows the player horizontally

The main camera SHALL follow the player's horizontal position, clamped to the level bounds.

#### Scenario: Camera tracks the player horizontally

- **WHEN** the player moves horizontally inside the level
- **THEN** the camera scrolls to keep the player approximately centered
- **AND** the camera does not scroll past the level's left or right bound

#### Scenario: Camera does not jitter on jumps

- **WHEN** the player jumps and lands
- **THEN** the camera's vertical position is unchanged

### Requirement: Player tuning constants live in `config.js`

`src/config.js` SHALL export `PLAYER_RUN_SPEED`, `PLAYER_JUMP_VELOCITY`, `GRAVITY`, and `LEVEL_WIDTH_SCREENS = 3` as individual named constants. No movement-related numeric value SHALL be hard-coded inside `Player.js` or any scene.

#### Scenario: Tuning is centralized

- **WHEN** `Player.js`, `GameScene.js`, or `main.js` is searched for hard-coded movement numbers
- **THEN** none are found; every value comes from a named import from `config.js`

#### Scenario: Constants exist with correct names

- **WHEN** `config.js` is imported
- **THEN** `PLAYER_RUN_SPEED`, `PLAYER_JUMP_VELOCITY`, `GRAVITY`, and `LEVEL_WIDTH_SCREENS` resolve to numeric values
- **AND** `LEVEL_WIDTH_SCREENS === 3`

### Requirement: Player reads fire input alongside movement input

`Player.update()` SHALL read fire input (`Z`, `X`, left mouse) on the same frame as movement input. Movement and fire SHALL be independent — pressing fire SHALL NOT block movement, and pressing movement SHALL NOT block fire.

#### Scenario: Move and fire simultaneously

- **WHEN** the player holds Right and `Z` at the same time
- **THEN** the player moves right
- **AND** bullets are emitted at the configured cooldown
- **AND** bullets travel rightward (in the facing direction)

#### Scenario: Fire while jumping

- **WHEN** the player presses `Space` and `Z` at the same time while on the ground
- **THEN** the player jumps
- **AND** a bullet is emitted

### Requirement: Fire keys do not interfere with movement keys

Adding `Z`, `X`, and the mouse `pointer` to the player's input map SHALL NOT change the behavior of arrow keys, WASD, or `Space` defined by Phase 2.

#### Scenario: Phase-2 movement still works after fire wiring

- **WHEN** the player uses Left/Right/A/D/Space without pressing any fire input
- **THEN** the movement behavior is identical to Phase 2 (run, jump, idle/walk animations)

### Requirement: Ground visual is built from atlas tiles, not the whole tileset bitmap

The level ground SHALL be rendered using individual cells from the `grass-tileset` atlas — a grass-top tile across the top edge and a dirt-fill tile across the body — rather than tiling the entire 384×128 source PNG.

#### Scenario: Demo-mockup content does not appear in the playfield

- **WHEN** the player runs from the leftmost edge of the level to the rightmost edge
- **THEN** the visible ground shows only flat grass on dirt
- **AND** no signs, crates, trees, flowers, or floating platforms from the source PNG's mockup section appear in the ground strip

#### Scenario: Ground tile indexes are configurable

- **WHEN** `config.js` is inspected
- **THEN** the indexes for the grass-top tile and the dirt fill tile are exported as named constants
- **AND** changing those constants visibly changes the ground without requiring edits to scene code

#### Scenario: Collision body is unchanged

- **WHEN** the player walks across the new visual ground
- **THEN** the player rests on the same world Y as before the visual change
- **AND** the player still cannot fall through any part of the ground

### Requirement: Player feet visually rest on the grass surface

When the player is at rest on the ground, the rendered Soldier sprite SHALL have its lowest opaque pixel ("feet") aligned to within 1 world pixel of the visible grass surface. The player SHALL NOT visibly float above the ground.

#### Scenario: Player rests at the grass line

- **WHEN** the player is on the ground (`body.blocked.down === true`)
- **THEN** the rendered character's feet are within 1 world pixel of the top row of the grass tile

#### Scenario: Player body bottom matches feet in source-frame coordinates

- **WHEN** `Player.body` is inspected
- **THEN** the body's offsetY plus its height equals 56 (the feet line in the 100×100 source frame)

