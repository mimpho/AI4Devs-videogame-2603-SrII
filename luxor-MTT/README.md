# Luxor 3 Web Adaptation

![Luxor Web Logo](assets/images/luxor_logo.png)

> 🎮 **[▶ Jugar en vivo](https://mimpho.github.io/AI4Devs-videogame-2603-SrII/luxor-MTT/)** — GitHub Pages

Una adaptación moderna y pulida del clásico juego de match-3 de esferas ambientado en el Antiguo Egipto. Este proyecto se centra en ofrecer una experiencia de juego fluida con una estética visual de alta fidelidad.

## 🌟 Características

- **Estética Premium**: Interfaz de usuario diseñada con assets 3D de alta definición, relieves dorados y texturas de piedra.
- **Física Refinada**: Sistema de movimiento de esferas por curvas sincronizado para una jugabilidad suave sin saltos ni solapamientos.
- **Mecánicas Luxor**: Disparo de esferas, cadenas de colores, colisiones precisas y sistema de niveles.
- **UI Adaptativa**: Menús, marcador y pantallas de pausa/fin de juego integrados armoniosamente con el arte conceptual original.

## 🛠️ Stack Tecnológico

- **Motor**: [Phaser 3](https://phaser.io/) (JavaScript Game Framework)
- **Lenguaje**: JavaScript (ES6+)
- **Estilos**: Vanilla CSS3 para el contenedor web.
- **Assets**: 
  - Arte conceptual generado por IA de alta gama.
  - Procesamiento de imágenes con Python (Pillow) para recortes de precisión y transparencia mediante erosión de bordes.
- **Servidor Local**: Python 3 http.server para desarrollo.

## 🚀 Instalación Rápida

Para ejecutar el juego localmente, sigue estos pasos:

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd luxor-MTT
   ```

2. **Servir el proyecto**:
   Debido a las restricciones de CORS de los navegadores para cargar assets locales, necesitas un servidor web. La forma más rápida es usar Python:
   ```bash
   # Si tienes Python 3 instalado
   python3 -m http.server 8000
   ```

3. **Jugar**:
   Abre tu navegador y dirígete a:
   `http://localhost:8000`

## 🧰 Scripts de Desarrollo (Tools)

Durante el desarrollo se utilizaron varios scripts de Python para procesar assets y generar la lógica del juego:

- `svg_to_json.py`: Extrae los datos de trazado (path) de un archivo SVG y los muestrea en un array JSON de puntos de control (x, y) para que Phaser genere los caminos del juego.
- `json_to_svg.py`: Reconstruye una imagen SVG básica a partir de un JSON de puntos, utilizado para proporcionar referencias estructurales del camino a generadores de imágenes por IA.
- `adjust_svg.py` & `adjust_svg2.py`: Escalan y aplanan automáticamente las coordenadas Y de los trazados SVG para asegurar que encajen dentro del área de juego sin superponerse con los elementos de la interfaz.
- `crop_ui.py`: Automatiza el recorte de elementos individuales de la interfaz (UI) a partir de una hoja de diseño generada por IA, erosionando y eliminando simultáneamente los fondos oscuros para crear PNGs transparentes.
- `remove_bg.py`: Un script de utilidad para eliminar fondos blancos de imágenes base, reemplazándolos por un canal alfa para lograr transparencia.

## 🗺️ Cómo se crean los caminos del juego (De SVG a JSON)

El juego utiliza curvas complejas para el desplazamiento de las esferas. Así es como se generan:

1. **Diseño**: Se dibuja o genera un trazado (path) SVG usando software vectorial sobre un fondo de arte conceptual.
2. **Transformación**: El script `svg_to_json.py` lee el vector `<path d="...">` del archivo SVG. 
3. **Muestreo de Puntos**: El script en Python (usando la librería `svgpathtools`) evalúa la curva matemática del vector y toma muestras a intervalos regulares (por ejemplo, 50 puntos).
4. **Salida JSON**: Estas coordenadas muestreadas se exportan como un array de objetos `{"x": ..., "y": ...}` a un archivo JSON (como `level1.json`).
5. **Integración en Phaser**: En el motor del juego, Phaser 3 carga este archivo JSON y utiliza su clase `Phaser.Curves.Spline` para recrear dinámicamente la curva suave durante la ejecución. Las esferas siguen entonces esta trayectoria (spline) de forma fluida.

## 🎮 Controles

- **Ratón**: Mover el lanzador y hacer clic para disparar esferas.
- **P**: Pausar / Reanudar el juego.

## 🎵 Créditos de Audio

- **Música**: Las canciones del menú principal y los niveles han sido generadas íntegramente con **[Google Gemini](https://gemini.google.com/)**.
- **Efectos de Sonido (SFX)**: Los efectos de sonido han sido descargados de **[Magnific Audio - Sound Effects](https://www.magnific.com/audio/sound-effects)**.

---
*Desarrollado con pasión por el Antiguo Egipto y el diseño de videojuegos.*
