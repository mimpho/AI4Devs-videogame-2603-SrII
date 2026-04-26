## ADDED Requirements

### Requirement: BootScene preloads player damage and death sheets

`BootScene.preload()` SHALL load the `Soldier/Hurt.png` and `Soldier/Death.png` sprite sheets and register `soldier-hurt` and `soldier-death` animations.

#### Scenario: Hurt and death animations available

- **WHEN** the player needs to play hurt or death
- **THEN** `soldier-hurt` and `soldier-death` are registered animation keys

### Requirement: GameOverScene is registered in main.js

The Phaser game's scene list SHALL include `GameOverScene` after the existing Boot/Title/Game scenes.

#### Scenario: Scene order is preserved

- **WHEN** the scene list is inspected
- **THEN** the order is `[BootScene, TitleScene, GameScene, GameOverScene, ...]`
