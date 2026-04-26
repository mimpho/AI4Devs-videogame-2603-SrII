# gameplay-instructions Specification

## Purpose
TBD - created by archiving change show-gameplay-instructions. Update Purpose after archive.
## Requirements
### Requirement: Instructions overlay appears at the start of every `GameScene` run

When `GameScene.create()` finishes, a control-reference overlay SHALL be visible in the sky area of the canvas, anchored to the camera (does not scroll with the level). The overlay SHALL list, at minimum: a movement line, a jump line, a shoot line, and a pause/resume line.

#### Scenario: Overlay is present after fresh start

- **WHEN** the player presses any key on `TitleScene` and `GameScene` becomes active
- **THEN** within 100 ms the canvas displays text lines covering MOVE, JUMP, SHOOT, and PAUSE/RESUME

#### Scenario: Overlay re-appears after retry

- **WHEN** the player loses, returns to `TitleScene`, presses any key, and lands back in `GameScene`
- **THEN** the instructions overlay is shown again

### Requirement: Overlay does not scroll with the camera

Each text line in the overlay SHALL have `scrollFactor === 0` so its screen-relative position is constant as the player traverses the level.

#### Scenario: Overlay stays put as camera scrolls

- **WHEN** the player runs horizontally far enough to scroll the camera
- **THEN** the on-screen position of each instruction line is unchanged

### Requirement: Overlay fades out after the configured duration and destroys itself

The overlay SHALL remain at full opacity for `INSTRUCTIONS_DURATION_MS` (default 10000), then fade alpha to 0 over `INSTRUCTIONS_FADE_OUT_MS` (default 500), then remove its game objects from the scene.

#### Scenario: Visible for 10 seconds, then begins fading

- **WHEN** `GameScene` has been active for 10 000 ms
- **THEN** the overlay's text starts fading toward zero alpha

#### Scenario: Overlay self-destroys after fade-out

- **WHEN** the fade-out tween completes
- **THEN** none of the instruction text objects remain in the scene's display list

### Requirement: Overlay does not block gameplay input

Movement, jumping, shooting, and pausing SHALL all work normally during the 10-second visible window — the overlay is purely visual.

#### Scenario: Player can move and shoot during the overlay window

- **WHEN** the overlay is visible in the first 10 seconds
- **AND** the player presses Right, Space, or Z
- **THEN** the player runs / jumps / fires as it would without the overlay

### Requirement: Overlay tuning lives in `config.js`

`config.js` SHALL export `INSTRUCTIONS_DURATION_MS`, `INSTRUCTIONS_FADE_OUT_MS`, plus position and font-size constants used to lay out the overlay. No magic numbers for those values SHALL be hard-coded inside `Instructions.js` or `GameScene.js`.

#### Scenario: Constants exist with the expected names

- **WHEN** `config.js` is imported
- **THEN** `INSTRUCTIONS_DURATION_MS` and `INSTRUCTIONS_FADE_OUT_MS` resolve to numeric values
- **AND** position/font constants used by the overlay are also exported from `config.js`

