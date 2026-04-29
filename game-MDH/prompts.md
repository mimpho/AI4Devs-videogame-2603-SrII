# NEON DRIFT — Prompts Documentation

## Game Description

**Neon Drift** is a dodge/shoot arcade game with a synthwave/retrowave aesthetic. The player controls a spaceship that must dodge and destroy asteroids falling from the top of the screen. The game increases in difficulty as the level rises (speed, obstacle spawn frequency). There are 3 lives and the score is saved locally.

**Controls:**
- `←` / `→` or `A` / `D` — Move the ship
- `SPACE` — Shoot
- `ESC` — Pause
- On mobile: swipe to move, tap to shoot

---

## Prompts Used

### Prompt 1 — Concept and General Structure

> "Create a complete arcade game with HTML, CSS and JavaScript in separate files named `index.html`, `style.css` and `game.js`. The game is called NEON DRIFT and has a synthwave/retrowave aesthetic. The player controls a spaceship that dodges and destroys asteroids. Include: a start screen, a game over screen, a HUD with score/level/lives, a level system with increasing difficulty, particle effects when destroying enemies, and a hi-score saved in localStorage."


### Prompt 2 — Synthwave Visual Aesthetic

> "Apply a synthwave/retrowave aesthetic with: a neon color palette (pink #ff2d78, cyan #00f5ff, purple #b44fff, yellow #ffe600) on a very dark background #04020f. Use Orbitron for titles and Share Tech Mono for data. Add an animated perspective grid at the bottom (like a retro floor), a parallax starfield, a scanlines effect over the overlays, and neon glow on all important elements."



### Prompt 3 — Player Ship

> "Draw the player's ship on canvas with a stylized sci-fi triangular shape. It should have: a cyan-to-pink gradient on the body, wings with pink accent lines, a semi-transparent elliptical cockpit, and an animated engine with flickering yellow/orange glow. Also implement movement with acceleration/friction using the arrow keys and WASD."

### Prompt 4 — Obstacles (Asteroids)

> "Create asteroids as irregular polygons (5 to 8 sides) drawn on canvas. Each asteroid should have: a neon color (pink or purple randomly), glow via shadowBlur, semi-transparent fill, continuous rotation, downward vertical movement, and slight horizontal movement that bounces off the edges. Spawn frequency and speed should increase with the level."



### Prompt 5 — Shooting and Collision System

> "Implement a bullet system: the ship fires cyan projectiles upward when SPACE is pressed or the screen is tapped (mobile). Detect bullet-asteroid collision (Euclidean distance) and ship-asteroid collision (circle-rect). When an asteroid is destroyed, generate a neon particle explosion. If the ship is hit: it loses a life, flickers (temporary 2-second invincibility), and a red flash appears on screen."



### Prompt 6 — Level Progression and HUD

> "Every 300 points the level increases. On level up: asteroid fall speed increases, spawn interval decreases (minimum 28 frames), and base speed goes up. The HUD displays score, level, and lives (♥ hearts) using Orbitron with neon glow. The score passively increases every second based on the current level."


### Prompt 7 — Touch Support and Pause

> "Add touch screen support: swiping moves the ship horizontally, tapping fires a bullet. Also implement a pause screen (toggled with ESC) with buttons to resume and return to the menu."


## Challenges and Solutions

### 1. Animated Perspective Grid
**Challenge:** Creating a retro floor effect with real perspective on canvas without external libraries.  
**Solution:** Calculate a vanishing point at `H * 0.52` and draw vertical lines converging toward the center, plus horizontal lines whose width grows with `t = (y - horizon) / (H - horizon)`. Scrolling is achieved by shifting `gridOffset` each frame.

### 2. Irregular Asteroid Shape
**Challenge:** Asteroids needed a random but consistent shape (not changing frame to frame).  
**Solution:** Generate polygon vertices mathematically with `Math.cos/sin` and a fixed number of sides per asteroid, without `Math.random()` inside `drawObstacle()`.

### 3. Menu Animation Without an Active Game Loop
**Challenge:** The starfield background needed to animate even on the menu screen.  
**Solution:** A separate `menuLoop()` IIFE was created that runs independently of the game state and only stops when the state is neither `menu` nor `gameover`.

### 4. Precise Ship-Asteroid Collision Detection
**Challenge:** Both the ship and the asteroids are polygons — exact detection would be complex.  
**Solution:** The ship was approximated as a rectangle at 70% of its real dimensions, and the asteroid as a circle at 75% of its radius, using `circleRect()`. This is accurate enough and very efficient.

---

## Testing

- ✅ Chrome 124 (desktop) — works correctly
- ✅ Firefox 125 (desktop) — works correctly
- ✅ Safari 17 (macOS) — works correctly
- ✅ Chrome (Android mobile) — touch controls functional
- ✅ Safari (iOS) — touch controls functional
- ✅ Window resizing — canvas adapts correctly

---

## Possible Future Improvements

- Power-ups (shield, triple shot, speed boost)
- Procedural synthwave music with the Web Audio API
- Online leaderboard
- Different enemy types (zigzag movement, shooting back)
- Endless mode with changing background maps
