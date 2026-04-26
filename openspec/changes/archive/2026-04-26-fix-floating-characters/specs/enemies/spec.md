## ADDED Requirements

### Requirement: Enemy feet visually rest on the grass surface

Each enemy variant (grunt, shooter, jumper) SHALL be rendered with its character feet aligned to within 1 world pixel of the visible grass surface when standing on the ground.

#### Scenario: Grunt rests at the grass line

- **WHEN** a grunt is on the ground
- **THEN** the rendered Orc sprite's feet are within 1 world pixel of the top row of the grass tile

#### Scenario: Shooter rests at the grass line

- **WHEN** a shooter is on the ground
- **THEN** the rendered Orc sprite's feet are within 1 world pixel of the top row of the grass tile

#### Scenario: Jumper rests at the grass line between hops

- **WHEN** a jumper is on the ground (between hop arcs)
- **THEN** the rendered Orc sprite's feet are within 1 world pixel of the top row of the grass tile

#### Scenario: DEFAULT_HITBOX bottom matches feet in source-frame coordinates

- **WHEN** `ENEMY_VARIANTS.*.hitbox` is inspected
- **THEN** `offsetY + height === 56` (the feet line in the 100×100 source frame)
