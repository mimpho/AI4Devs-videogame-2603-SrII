# Proyecto: Tic-Tac-Toe (Tres en raya) — `tic-tac-toe-AJD`

Documentación de diseño para implementar el juego con modo **jugador humano vs máquina**, stack **frontend estático (HTML/CSS/JS)** y criterios de calidad alineados con buenas prácticas actuales.

---

## 1. Explicación del juego

### 1.1 Reglas

| Aspecto | Descripción |
|--------|-------------|
| **Tablero** | Rejilla de **3×3** casillas. |
| **Jugadores** | Dos: uno usa **X**, otro **O** (en esta implementación: tú = **X**, máquina = **O**). |
| **Turnos** | Por turnos alternos; en cada turno se coloca **una** marca en una casilla **vacía**. |
| **Objetivo** | Conseguir **tres marcas alineadas** en fila, columna o diagonal. |
| **Fin de partida** | Cuando alguien gana o cuando el tablero está **lleno** sin ganador (**empate**). |

### 1.2 Cómo se gana, se pierde o se empata

- **Gana** quien completa primero una línea de tres (fila, columna o diagonal).
- **Pierde** un jugador cuando el **oponente** completa su línea antes.
- **Empate** cuando las **9 casillas** están ocupadas y **ninguna** de las ocho líneas posibles es homogénea (tres X o tres O).

### 1.3 Ejemplos de estados del tablero

**Estado inicial (vacío):**

```text
   |   |
-----------
   |   |
-----------
   |   |
```

**Victoria de X (primera fila):**

```text
 X | X | X
-----------
   | O |
-----------
 O |   |
```

**Empate (tablero lleno, sin trío):**

```text
 X | O | X
-----------
 X | O | O
-----------
 O | X | X
```

**Jugada intermedia (turno de O, casillas 5, 7 y 9 aún libres, numeración 1-9 de izq→der, arriba→abajo):**

```text
 X |   | O
-----------
 X | O |
-----------
   |   |
```

---

## 2. Arquitectura y tecnologías

### 2.1 Stack propuesto (equilibrado y fácil de desplegar)

| Capa | Tecnología | Versión recomendada | Notas |
|------|------------|---------------------|--------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Navegadores actuales (Chromium 120+, Firefox 120+, Safari 17+) | Sin framework obligatorio: lógica clara en módulos/funciones. |
| **Backend** | *Opcional* — no requerido para esta versión | — | Toda la IA corre en el cliente. |
| **Almacenamiento** | *Opcional* | — | Partidas en memoria; futuras versiones: `localStorage` para estadísticas. |

**Justificación:**

- **HTML/CSS/JS puro** reduce acoplamiento, facilita alojar en GitHub Pages o cualquier hosting estático y mantiene el foco en **lógica del juego y UX**.
- No hace falta servidor para un tablero 3×3: el coste de cómputo del **minimax** es despreciable.
- Si más adelante se desea **multijugador online** o **antitrampas**, se añadiría un backend (Node, Deno, etc.) que valide movimientos.

### 2.2 División lógica de la solución

| Módulo conceptual | Responsabilidad |
|-------------------|-----------------|
| **Estado del juego** | Tablero, turno, fase (jugando / terminado), dificultad, ganador o empate. |
| **Reglas** | Validez de jugadas, detección de líneas ganadoras, comprobación de tablero lleno. |
| **IA** | Estrategia según dificultad: aleatorio, heurísticas, minimax. |
| **Presentación** | DOM, clases CSS por estado, feedback al usuario, responsive. |
| **Orquestación** | Clicks → actualizar estado → (si toca) IA → render. |

### 2.3 Estructura de proyecto recomendada (esta entrega)

```text
tic-tac-toe-AJD/
├── index.html      # Estructura semántica, meta viewport, carga de CSS/JS
├── styles.css      # Layout, estados visuales, responsive
├── app.js          # Estado, reglas, IA, enlace con el DOM
└── documentacion.md# Este documento
```

Imágenes no son obligatorias: el tablero se dibuja con **CSS** y **texto** (X / O) para carga cero y mantenimiento sencillo.

### 2.4 Principios de código (alto nivel)

- **Separación**: cálculo de movimientos independiente de manipulación del DOM (facilita tests y cambiar UI).
- **Inmutabilidad** donde aporte claridad: copias del tablero o restauración tras simulación en minimax.
- **Nombres explícitos** (`getWinner`, `isDraw`, `chooseAiMove`).

---

## 3. Juego contra la máquina: niveles de dificultad

| Nivel | Comportamiento | Técnica |
|--------|----------------|--------|
| **Fácil** | Juega en **cualquier** casilla libre al azar. | `movimientos_vacíos → elegir uno al random` |
| **Medio** | **Heurística** en prioridad: ganar si puede → bloquear al jugador → centro → esquina → borde. | Reglas *if* ordenadas sobre el tablero |
| **Difícil** | Juego **óptimo**: no pierde nunca; si el oponente falla, gana. | **Minimax** (o minimax + poda alfa-beta) |

### 3.1 Fácil: movimientos aleatorios

**Pseudocódigo:**

```text
function movimientoFácil(tablero):
    vacías = [índices donde casilla == vacía]
    return vacías[aleatorio(0, vacías.length - 1)]
```

Garantía: siempre movimiento **legal**; a veces comete errores *graves* a propósito.

### 3.2 Medio: heurísticas básicas

**Orden sugerido:**

1. **Ganar**: si hay una casilla que complete tres **O** en línea, jugar ahí.
2. **Bloquear**: si **X** puede ganar al siguiente turno, jugar la casilla que lo impide.
3. **Centro** (índice 4 en 0..8) si está libre.
4. **Esquinas** (0, 2, 6, 8) con alguna libre, preferir una.
5. **Bordes** (1, 3, 5, 7) restantes.
6. Si nada aplica, fallback **aleatorio** en vacías.

Esto bate a jugadores inatentos y a la IA fácil, sin ser infalible.

### 3.3 Difícil: algoritmo óptimo (minimax)

**Idea:** modelar el juego como un **árbol de juego**. En cada nodo, un jugador elige un movimiento que conduce a hijos. Se asigna una **puntuación** a hojas terminales: victoria IA (+), derrota IA (−), empate (0). La máquina **maximiza** el resultado cuando juega la IA, el usuario **minimiza** (o recíprocamente, según convención) cuando juega X.

**Pseudocódigo (esencia):**

```text
function minimax(tablero, esTurnoIa, profundidadOmitirOpcional):
    g = evaluarGanador(tablero)
    si g == IA: retornar +10
    si g == HUMANO: retornar -10
    si tableroLleno: retornar 0

    si esTurnoIa:
        mejor = -∞
        para cada movimiento m legal:
            simular m con O
            mejor = max(mejor, minimax(tablero, false))
            deshacer m
        retornar mejor
    sino
        peor = +∞
        para cada movimiento m legal:
            simular m con X
            peor = min(peor, minimax(tablero, true))
            deshacer m
        retornar peor
```

**Mejor jugada (IA):** probar cada casilla libre, colocar O, y elegir el movimiento con **máximo** `minimax` (desde el punto de vista de la IA). En tablero 3×3 el coste es pequeño; **poda alfa-beta** es opcional para generalizar a tableros mayores.

**Integración en el sistema:** tras el turno del humano, el control llama a `elegirMovimientoIa(dificultad, tablero)` que enrama a `fácil` / `medio` / `minimax` y aplica un único `colocar(índice)`.

---

## 4. Usabilidad (UX / UI)

### 4.1 Principios

| Principio | Aplicación concreta |
|------------|---------------------|
| **Claridad** | Título, instrucción corta, quién juega con qué símbolo. |
| **Feedback** | Clases/ARIA al pasar el ratón, al hacer focus, y al **deshabilitar** celdas cuando la partida terminó o mientras "piensa" la máquina. |
| **Accesibilidad** | Celdas como `<button>`, `aria-label` ("Casilla 1, vacía"), `role="status"` o `aria-live` para anuncios de fin de partida. |
| **Responsive** | `max-width` del tablero, `min()` para tamaño de celdas, márgenes flexibles, área de toque mín. ~44px. |

### 4.2 Interacción

1. Elegir **dificultad** (antes o durante; en esta entrega, antes y al reiniciar).  
2. Clic (o teclado en botones) en **casilla vacía** = tu jugada.  
3. **Turno** visible ("Tu turno" / "Turno de la máquina").  
4. Al final: mensaje **Ganaste / Gana la máquina / Empate**; botón **Jugar de nuevo**.  

### 4.3 Estados visuales (UI)

- **Jugando — turno humano**: celdas vacías activas, mensaje "Tu turno (X)".
- **Jugando — turno máquina**: celdas deshabilitadas brevemente, mensaje "Pensando…" o "Turno de O".
- **Victoria X**: resaltar (subrayado/color) la línea ganadora; anuncio de victoria.
- **Victoria O**: igual para la línea de O.
- **Empate**: mensaje neutro; no hay línea resaltada.
- **Error**: en modo solo legal, poco frecuente; si se rehúsa un click en celda ocupada, mensaje breve o *shake* sutil (opcional).

**Responsive:** una columna en móvil (selector + tablero + estado apilados); en desktop, centrado con ancho confortable.

---

## 5. Testing y calidad

### 5.1 Estrategia de testing

| Tipo | Qué probar | Ejemplos concretos |
|------|------------|---------------------|
| **Unitario** | Funciones puras: tablero, legalidad, ganador, minimax en posiciones clásicas. | `checkWinner` en tablero vacío → `null`; con `[X,X,X,_,...]` en fila 0 → X. |
| **Integración** | Orquestación: "tras tres X en línea, estado = terminado, ganador = X". | Secuencia de `playMove` y snapshots de estado. |
| **E2E (opcional)** | Flujo en navegador: abrir, jugar, ver mensaje de victoria. | Playwright/Cypress: clic en celdas, assert texto "Ganaste". |

### 5.2 Herramientas adecuadas (referencia)

| Uso | Herramienta típica |
|-----|---------------------|
| Unit + integración en Node | **Vitest** o **Jest** |
| E2E | **Playwright** (recomendado en 2025–2026) o **Cypress** |
| Calidad de estilo | **ESLint** (config plana) |

*Nota:* con JS sin empaquetador, exportar funciones a `app.js` con `export` o duplicar funciones de prueba en un `game.test.mjs` que importe un módulo `gameLogic.js` es el siguiente paso natural; la entrega mínima puede quedar toda en `app.js` y extraer módulo cuando se añada CI.

### 5.3 Buenas prácticas (clean code, SOLID)

- **S** — *Single Responsibility:* reglas e IA en funciones con una responsabilidad.  
- **D** — *Dependency Inversion:* el DOM notifica eventos, la lógica no conoce CSS concreto.  
- Nombres verbales, funciones cortas, **sin lógica duplicada** entre "comprobar ganador" y "resaltar línea".  
- Comentarios solo donde la **intención** no es obvia (p. ej. convenio 0-8 de celdas).

### 5.4 Criterios de calidad de esta documentación y del código

- Especificación **accionable** (reglas, tres niveles de IA, arquitectura, tests).  
- Tecnologías y versiones **indicadas** (navegadores, opciones de test).  
- Implementación **incluida** en el mismo repositorio bajo `tic-tac-toe-AJD/`.

---

## 6. Referencia rápida: líneas ganadoras (índices 0-8)

```text
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

**Líneas (índices):** `[0,1,2]`, `[3,4,5]`, `[6,7,8]`, `[0,3,6]`, `[1,4,7]`, `[2,5,8]`, `[0,4,8]`, `[2,4,6]`.

---

*Documento generado para el módulo AI4Devs — Tic-Tac-Toe, carpeta `tic-tac-toe-AJD`.*
