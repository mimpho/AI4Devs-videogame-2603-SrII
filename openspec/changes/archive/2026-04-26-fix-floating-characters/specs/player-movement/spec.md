## ADDED Requirements

### Requirement: Player feet visually rest on the grass surface

When the player is at rest on the ground, the rendered Soldier sprite SHALL have its lowest opaque pixel ("feet") aligned to within 1 world pixel of the visible grass surface. The player SHALL NOT visibly float above the ground.

#### Scenario: Player rests at the grass line

- **WHEN** the player is on the ground (`body.blocked.down === true`)
- **THEN** the rendered character's feet are within 1 world pixel of the top row of the grass tile

#### Scenario: Player body bottom matches feet in source-frame coordinates

- **WHEN** `Player.body` is inspected
- **THEN** the body's offsetY plus its height equals 56 (the feet line in the 100×100 source frame)
