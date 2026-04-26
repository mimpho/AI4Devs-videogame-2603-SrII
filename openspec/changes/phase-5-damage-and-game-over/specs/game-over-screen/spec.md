## ADDED Requirements

### Requirement: GameOverScene exists and is registered

A new scene `contra-AC/src/scenes/GameOverScene.js` SHALL exist and be registered in `main.js` alongside the other scenes. Its scene key SHALL be `'GameOverScene'`.

#### Scenario: Scene is registered

- **WHEN** the Phaser game instance is constructed
- **THEN** `'GameOverScene'` is included in the scene list

### Requirement: GameOverScene displays the loss screen

`GameOverScene` SHALL render "GAME OVER" prominently and a "Press any key to retry" prompt below it. The background SHALL be a distinct dark color (no gameplay world rendered).

#### Scenario: Loss screen content

- **WHEN** `GameOverScene` is the active scene
- **THEN** the canvas displays "GAME OVER" text
- **AND** displays "Press any key to retry" text
- **AND** does NOT render the gameplay world (player, enemies, level)

### Requirement: GameOverScene accepts a reason argument

`GameOverScene.init(data)` SHALL accept `{ reason: string }`. Phase 5 only handles `reason === 'killed'`. The structure SHALL be in place so Phase 6 can pass `'time_up'` without restructuring.

#### Scenario: Reason data is preserved

- **WHEN** `GameOverScene` is started with `{ reason: 'killed' }`
- **THEN** the scene receives and stores the reason

### Requirement: Pressing any key returns to TitleScene

While `GameOverScene` is active, pressing any keyboard key SHALL transition to `TitleScene`.

#### Scenario: Any key restarts the run

- **WHEN** any key is pressed in `GameOverScene`
- **THEN** the active scene becomes `TitleScene`

#### Scenario: Holding a key during transition does not retrigger

- **WHEN** a key is held during the transition out of `GameOverScene`
- **THEN** the transition runs exactly once
