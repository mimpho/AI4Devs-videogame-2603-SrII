# Prompts utilizados — Tic-Tac-Toe (tic-tac-toe-AJD)

Este archivo recoge los **prompts** enviados al asistente de IA durante el desarrollo y documentación del proyecto, junto con un **resumen del proceso** y los retos encontrados.

---

## Prompt 1 — Definición del proyecto, documentación e implementación

**Fecha de uso (referencia):** sesión de desarrollo inicial (abril 2026).

**Texto enviado (sintetizado; el original pedía rol de arquitecto full-stack, juego Tic-Tac-Toe vs máquina, y entregables concretos):**

> Actúa como arquitecto de software y desarrollador full-stack senior… Objetivo: diseñar y describir un proyecto completo para implementar TIC-TAC-TOE (tres en raya) con posibilidad de jugar contra la máquina, asegurando calidad técnica, claridad conceptual y enfoque práctico.
>
> **Especificaciones solicitadas:**  
> - Explicación del juego: reglas, victoria/derrota/empate, ejemplos de tablero.  
> - Arquitectura y tecnologías: stack moderno, división frontend/backend/almacenamiento, justificación, versiones, estructura de proyecto.  
> - Tres niveles de dificultad (fácil: aleatorio; medio: heurísticas; difícil: algoritmo óptimo tipo Minimax) con lógica e integración.  
> - Usabilidad: principios UX/UI, interacción, estados visuales, responsive.  
> - Testing y calidad: unitarios, integración, E2E, ejemplos, herramientas, clean code y SOLID.  
> - Criterios: claro, estructurado, accionable, con ejemplos, buenas prácticas modernas, fácil de implementar.
>
> **Formato de la respuesta:** Markdown estructurado, secciones claras, pseudocódigo/código cuando aporte valor, tablas o listas, detalle medio-alto.
>
> **Entrega de código:** Dentro de una carpeta con el nombre del juego e iniciales (ej. `tic-tac-toe-AJD`), archivos necesarios: **index.html**, CSS, JavaScript; imágenes/recursos si aplican. Referencia al ejemplo `snake-EHS` en el repositorio.

**Resultado esperado del prompt:**  
Documentación en Markdown + implementación web funcional con IA en tres niveles, carpeta `tic-tac-toe-AJD/`.

---

## Prompt 2 — Documentación de prompts y proceso

**Texto enviado:**

> Documenta tu proceso: En un archivo `prompts.md` dentro de la misma carpeta, incluye los prompts utilizados. Además, si quieres, describe el proceso de desarrollo de tu juego, incluyendo cualquier desafío que hayas enfrentado y cómo lo superaste.

**Resultado:**  
Este archivo (`prompts.md`).

---

## Proceso de desarrollo (resumen)

1. **Análisis del requisito**  
   Se priorizó un **frontend estático** (HTML, CSS, JS) sin backend: el tablero 3×3 permite calcular la IA en el cliente sin problemas de rendimiento.

2. **Documentación**  
   Se generó `documentacion.md` con reglas, arquitectura, niveles de dificultad, UX, testing y referencia de índices del tablero, para que el proyecto sea **entregable y replicable** por otro desarrollador.

3. **Implementación**  
   - **index.html:** estructura semántica, selector de dificultad, `role="status"` y `aria-live` para el estado de la partida, botones por celda.  
   - **styles.css:** layout en grid, tema oscuro, contraste y tamaño mínimo de toque, estados de victoria.  
   - **app.js:** estado central (`board`, fase, ganador, línea ganadora), `getWinner` con las 8 líneas, tres estrategias de IA, **minimax** para el nivel difícil, render y eventos.

4. **Integración en el repositorio**  
   Se añadió el enlace al juego en el `index.html` raíz del ejercicio, alineado con el patrón de `snake-EHS`.

---

## Desafíos y cómo se abordaron

| Desafío | Cómo se resolvió |
|--------|-------------------|
| **Coherencia entre “empate” y “partida en curso”** | `getWinner` distingue: primero comprobar líneas completas; si no hay ganador y no quedan casillas vacías, devolver resultado de **empate**. Se evitó la confusión entre `null` (sigue el juego) y `{ mark: 'draw' }` (fin en tablas). |
| **Flujo de fin de partida** | Un único `endGame()` lee el tablero con `getWinner`, fija `state.winner`, `winningLine`, mensaje y deshabilita el selector de dificultad hasta **nueva partida**, reduciendo estados duplicados. |
| **Condición de carrera al reiniciar mientras “piensa” la máquina** | Un contador `playGen` se incrementa al iniciar el turno de la IA y al **Nueva partida** / **cambio de dificultad**; el `setTimeout` del movimiento de la máquina comprueba que el generador no haya cambiado antes de modificar el tablero. |
| **Celdas interactuables vs turno de la IA** | `renderBoard` deshabilita celdas si la casilla está ocupada, la partida terminó o `state.phase === 'ai'`, con feedback visual breve (“pensando”). |
| **Equilibrio documentación vs código** | La lógica **óptima** (minimax) y las **heurísticas** del nivel medio quedan descritas en `documentacion.md`; el código se mantiene legible con nombres explícitos (`moveEasy`, `moveMedium`, `moveHard`, `findWinningMove`). |

---

## Nota sobre el uso de IA

Los prompts anteriores sirvieron para **guiar** el diseño y la implementación. Las decisiones técnicas (p. ej. un solo `endGame`, `playGen`, estructura de archivos) se reflejan en el código y en `documentacion.md` para facilitar revisión y mantenimiento.
