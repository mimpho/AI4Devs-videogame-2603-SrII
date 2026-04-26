## ADDED Requirements

### Requirement: Bullet-vs-ground collider despawns the bullet without throwing

When any bullet's body overlaps the level ground body, the collider callback SHALL invoke `disableBody(true, true)` on the bullet (not on the ground), and SHALL NOT throw `TypeError: ...is not a function`.

#### Scenario: Player bullet near ground level despawns cleanly

- **WHEN** the player fires a bullet whose body Y range overlaps the ground body Y range
- **THEN** the bullet's `body.enable` becomes `false`
- **AND** the bullet's `active` becomes `false`
- **AND** no uncaught error is thrown to the console

#### Scenario: Enemy bullet near ground level despawns cleanly

- **WHEN** a shooter enemy fires a bullet whose body Y range overlaps the ground body Y range
- **THEN** the bullet's `body.enable` becomes `false`
- **AND** the bullet's `active` becomes `false`
- **AND** no uncaught error is thrown to the console
