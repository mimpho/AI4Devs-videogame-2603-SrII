class PlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlayScene' });
    }

    init(data) {
        // Por defecto cargamos el nivel 1 si no se hace clic en el menú
        this.currentLevel = data.level || 1;
    }

    create() {
        console.log(`PlayScene: Iniciada (Nivel ${this.currentLevel})`);

        // Reproducir música del nivel (deteniendo la del menú)
        this.sound.stopAll();
        this.sound.play('music_level', { loop: true, volume: 0.5 });

        // Efecto de sonido continuo (rodamiento de bolas)
        this.sfxRolling = this.sound.add('sfx_rolling', { loop: true, volume: 0.8 });
        this.sfxRolling.play();

        this.add.image(640, 360, `bg_level${this.currentLevel}`);

        // Generar textura para los tiradores (puntos de control)
        let handleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        handleGraphics.fillStyle(0xffff00); // Nodos amarillos
        handleGraphics.fillCircle(8, 8, 8);
        handleGraphics.generateTexture('dragHandle', 16, 16);

        // Cargamos los puntos base (hacemos un deep copy para poder editar libremente)
        this.originalPoints = JSON.parse(JSON.stringify(this.cache.json.get(`path_level${this.currentLevel}`)));

        // this.debugGraphics = this.add.graphics();
        this.buildCurve();

        // Modo Edición: Desactivado para juego final (Descomentar para editar paths)
        /*
        this.debugHandles = [];
        this.originalPoints.forEach((p, index) => {
            let handle = this.add.image(p.x, p.y, 'dragHandle').setInteractive({ cursor: 'pointer' });
            handle.pointIndex = index;
            this.input.setDraggable(handle);
            this.debugHandles.push(handle);
        });

        this.updateHandlesAndCurve = () => {
            this.debugHandles.forEach(h => {
                h.x = this.originalPoints[h.pointIndex].x;
                h.y = this.originalPoints[h.pointIndex].y;
            });
            this.buildCurve();
        };

        // Transformación Global: Desplazamiento
        this.input.keyboard.on('keydown-UP', () => { this.originalPoints.forEach(p => p.y -= 1); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-DOWN', () => { this.originalPoints.forEach(p => p.y += 1); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-LEFT', () => { this.originalPoints.forEach(p => p.x -= 1); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-RIGHT', () => { this.originalPoints.forEach(p => p.x += 1); this.updateHandlesAndCurve(); });
        
        // Transformación Global: Escalado (centrado)
        const cx = 640; const cy = 360;
        this.input.keyboard.on('keydown-W', () => { this.originalPoints.forEach(p => p.y = cy + (p.y - cy) * 1.005); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-S', () => { this.originalPoints.forEach(p => p.y = cy + (p.y - cy) * 0.995); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-D', () => { this.originalPoints.forEach(p => p.x = cx + (p.x - cx) * 1.005); this.updateHandlesAndCurve(); });
        this.input.keyboard.on('keydown-A', () => { this.originalPoints.forEach(p => p.x = cx + (p.x - cx) * 0.995); this.updateHandlesAndCurve(); });

        // Evento al arrastrar un tirador (ajuste fino)
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            this.originalPoints[gameObject.pointIndex].x = dragX;
            this.originalPoints[gameObject.pointIndex].y = dragY;
            this.buildCurve();
        });

        // Evento al pulsar la barra espaciadora para volcar el JSON
        this.input.keyboard.on('keydown-SPACE', () => {
            let cleanPoints = this.originalPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
            console.log(`=== COPIA ESTO DENTRO DE assets/paths/level${this.currentLevel}.json ===`);
            console.log(JSON.stringify(cleanPoints));
        });
        */
        // Definimos los colores antes para poder cargar la munición inicial
        this.sphereColors = ['sphere_red', 'sphere_blue', 'sphere_green', 'sphere_yellow'];

        this.shooter = this.add.sprite(640, 650, 'shooter');

        // Munición cargada (lo que vamos a disparar)
        this.currentAmmoColor = Phaser.Math.RND.pick(this.sphereColors);
        this.ammoSprite = this.add.sprite(640, 650, this.currentAmmoColor);
        this.ammoSprite.setScale(0.6375); // Hacerla un 15% más pequeña que el 0.75 anterior (0.75 * 0.85 = 0.6375)

        // Variables para suavizar el movimiento y la puntería
        this.targetX = 640;
        this.targetY = 650;

        this.input.on('pointermove', (pointer) => {
            this.targetX = Phaser.Math.Clamp(pointer.x, 40, 1280 - 40);
            this.targetY = pointer.y; // Usamos la Y del ratón para saber hacia dónde rotar
        });

        // == NUEVO CÓDIGO FASE 3/4: LÓGICA DE ESFERAS Y DISPARO ==

        // 1. Cadena de esferas (Tren)
        this.pathSpheres = [];
        this.totalPathLength = this.curve.getLength();

        // Separación paramétrica: Basada en el nuevo diámetro (64px * 0.6375 ≈ 40.8px)
        this.tSpacing = 40.8 / this.totalPathLength;

        // Creamos una cadena inicial de 20 esferas enemigas
        for (let i = 0; i < 20; i++) {
            let color = Phaser.Math.RND.pick(this.sphereColors);
            let sphere = this.add.sprite(-100, -100, color);
            sphere.setScale(0.6375); // Escala ajustada

            // La bola 0 va en cabeza. Las siguientes van detrás (índice negativo en la curva t)
            sphere.pathT = -i * this.tSpacing;
            sphere.colorId = color;
            this.pathSpheres.push(sphere);
        }

        // 2. Disparo de bolas por parte del jugador
        this.bullets = this.physics.add.group();

        this.input.on('pointerdown', (pointer) => {
            if (this.isPaused) return; // FASE 5: No disparar si el juego está pausado

            // Reproducir sonido de disparo
            this.sound.play('sfx_shoot', { volume: 0.1 });

            // Usamos la bala cargada
            let bulletColor = this.currentAmmoColor;

            // Recargamos INMEDIATAMENTE una nueva bola aleatoria (solo de colores existentes)
            this.currentAmmoColor = this.getNextAmmoColor();
            this.ammoSprite.setTexture(this.currentAmmoColor);

            // Calculamos el punto exacto de la boca del escarabajo para generar la bala
            // Restamos Math.PI/2 porque habíamos compensado la rotación visualmente
            let angle = this.shooter.rotation - Math.PI / 2;
            let ammoOffset = 45; // Distancia desde el centro del escarabajo a las fauces
            let spawnX = this.shooter.x + Math.cos(angle) * ammoOffset;
            let spawnY = this.shooter.y + Math.sin(angle) * ammoOffset;

            // Disparamos la bola original
            let bullet = this.physics.add.sprite(spawnX, spawnY, bulletColor);
            bullet.setScale(0.6375); // Escala ajustada
            bullet.colorId = bulletColor;
            this.bullets.add(bullet);

            // Le aplicamos física Arcade en la dirección de la rotación
            let speed = 800;
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        });

        // Interfaz de Usuario (UI) y Puntuación
        this.score = 0;

        // Añadir barra de puntuación estilo Luxor (Asset Profesional)
        this.scoreBar = this.add.image(640, 50, 'ui_bar').setDepth(100);
        this.scoreBar.setScale(0.45);

        this.scoreText = this.add.text(640, 60, 'SCORE: 0', {
            fontSize: '18px',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 2,
            fontFamily: 'Georgia'
        }).setOrigin(0.5).setDepth(101);
        this.scoreText.setShadow(2, 2, 'rgba(0,0,0,1)', 2);

        // Evento de Pausa Lógica
        this.isPaused = false;
        this.input.keyboard.on('keydown-P', () => {
            if (this.isPaused) {
                // Reanudar
                this.isPaused = false;
                this.scene.stop('PauseScene'); // Ocultar overlay
                this.physics.resume();         // Descongelar balas
                this.tweens.resumeAll();       // Descongelar explosiones
                if (this.sfxRolling) this.sfxRolling.resume();
            } else {
                // Pausar
                this.isPaused = true;
                this.scene.launch('PauseScene'); // Mostrar overlay
                this.physics.pause();            // Congelar balas en el aire
                this.tweens.pauseAll();          // Congelar animaciones en curso
                if (this.sfxRolling) this.sfxRolling.pause();
            }
        });
    }

    update(time, delta) {
        if (this.isPaused) return; // Congelar movimiento del tren y colisiones

        // 0. Lógica del Shooter (Movimiento suave y Rotación)
        if (this.shooter) {
            // Suavizado (Lerp) para seguir la posición X del ratón
            this.shooter.x += (this.targetX - this.shooter.x) * 0.15;

            // Ángulo hacia el ratón
            let angle = Phaser.Math.Angle.Between(this.shooter.x, this.shooter.y, this.targetX, this.targetY);

            // Evitar que apunte hacia abajo (girando la cabeza 180 grados de forma brusca)
            if (angle > 0 && angle < Math.PI) {
                angle = (angle > Math.PI / 2) ? Math.PI : 0;
            }

            // El escarabajo mira hacia arriba originalmente (-PI/2)
            // Le sumamos PI/2 (90 grados) para cuadrar con la orientación de Phaser
            this.shooter.rotation = angle + Math.PI / 2;

            // Colocar la munición exactamente en la boca del escarabajo
            let ammoOffset = 45; // Distancia del centro a la boca
            this.ammoSprite.x = this.shooter.x + Math.cos(angle) * ammoOffset;
            this.ammoSprite.y = this.shooter.y + Math.sin(angle) * ammoOffset;
        }

        let speedPixelsPerSec = 70;
        let tDelta = (speedPixelsPerSec / this.totalPathLength) * (delta / 1000);

        // 1. Mover el tren (Lógica Luxor: El bloque trasero empuja, los bloques cortados se frenan)
        // Recorremos desde la última esfera (la que está más atrás en el camino)
        for (let i = this.pathSpheres.length - 1; i >= 0; i--) {
            let sphere = this.pathSpheres[i];

            if (i === this.pathSpheres.length - 1) {
                // El vagón de cola siempre avanza
                sphere.pathT += tDelta;
            } else {
                let sphereBehind = this.pathSpheres[i + 1];
                // Espaciado dinámico basado en el tamaño real de las esferas (colisión real)
                let realSpacing = ((sphere.displayHeight / 2) + (sphereBehind.displayHeight / 2)) / this.totalPathLength;
                let expectedT = sphereBehind.pathT + realSpacing;

                if (sphere.pathT < expectedT) {
                    // Empuje físico suavizado: la bola de atrás empuja a la de adelante
                    // Usamos una velocidad de expansión mayor que la de avance para que se sienta reactivo
                    let maxPush = tDelta * 6;
                    sphere.pathT = Math.min(expectedT, sphere.pathT + maxPush);
                } else if (sphere.pathT > expectedT + 0.0001) {
                    // Hay un hueco (gap). Atracción magnética si los colores coinciden
                    if (sphere.colorId === sphereBehind.colorId) {
                        sphere.pathT -= tDelta * 3; // Magnetismo (succión hacia atrás)
                        if (sphere.pathT < expectedT) sphere.pathT = expectedT; // Snap final
                    }
                }
            }

            // Renderizado (getPointAt garantiza velocidad constante en píxeles)
            if (sphere.pathT >= 0 && sphere.pathT <= 1) {
                let point = this.curve.getPointAt(sphere.pathT);
                sphere.setPosition(point.x, point.y);
                sphere.rotation += 0.02; // Rotación lenta (rodar)
            } else if (sphere.pathT > 1) {
                // FASE 5: DERROTA. La cadena ha llegado al agujero (Pirámide)
                this.scene.start('GameOverScene', { score: this.score, win: false });
                return; // Detenemos el update inmediatamente
            }
        }

        // 2. Colisión Disparos vs Cadena (Inserción)
        for (let b = this.bullets.getChildren().length - 1; b >= 0; b--) {
            let bullet = this.bullets.getChildren()[b];

            if (bullet.y < -50) {
                bullet.destroy();
                continue;
            }

            for (let i = 0; i < this.pathSpheres.length; i++) {
                let sphere = this.pathSpheres[i];
                // Comprobamos la distancia manual (colisión circular simple)
                if (sphere.pathT >= 0 && sphere.pathT <= 1) {
                    let distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, sphere.x, sphere.y);
                    if (distance < 20) { // Radio de colisión reducido (aprox 40.8 / 2)
                        this.sound.play('sfx_impact', { volume: 0.3 });
                        this.insertSphere(bullet, i);
                        bullet.destroy();
                        break; // Salir del bucle de esferas
                    }
                }
            }
        }
    }

    // == MÉTODOS DE FÍSICA AVANZADA (FASE 4) ==

    buildCurve() {
        const points = this.originalPoints.map(p => new Phaser.Math.Vector2(p.x, p.y));
        this.curve = new Phaser.Curves.Spline(points);

        // Pintamos el trazado rojo para ayudar a ajustar (Oculto en juego final)
        /*
        this.debugGraphics.clear();
        this.debugGraphics.lineStyle(4, 0xff0000, 0.7);
        this.curve.draw(this.debugGraphics, 64);
        */
    }

    insertSphere(bullet, hitIndex) {
        let hitSphere = this.pathSpheres[hitIndex];

        // Crear la nueva esfera visualmente
        let newSphere = this.add.sprite(bullet.x, bullet.y, bullet.colorId);
        newSphere.setScale(0.6375); // Escala ajustada
        newSphere.colorId = bullet.colorId;
        newSphere.pathT = hitSphere.pathT; // Ocupará exactamente el lugar de la golpeada

        newSphere.pathT = hitSphere.pathT; // Se coloca inicialmente solapada (el update la empujará suavemente)

        // Insertamos la nueva esfera justo detrás de la golpeada en nuestro array estructural
        this.pathSpheres.splice(hitIndex + 1, 0, newSphere);

        // Revisamos si se formó un Match-3 o superior al insertarla
        this.checkMatch3(hitIndex + 1);
    }

    checkMatch3(index) {
        let color = this.pathSpheres[index].colorId;
        let matchIndices = [index];

        // Revisar hacia adelante (esferas más cercanas a la pirámide, índices menores)
        for (let i = index - 1; i >= 0; i--) {
            if (this.pathSpheres[i].colorId === color) matchIndices.push(i);
            else break; // Racha rota
        }

        // Revisar hacia atrás (esferas más cercanas a la cola, índices mayores)
        for (let i = index + 1; i < this.pathSpheres.length; i++) {
            if (this.pathSpheres[i].colorId === color) matchIndices.push(i);
            else break; // Racha rota
        }

        // Si hay 3 o más del mismo color, explotarlas
        if (matchIndices.length >= 3) {
            // Reproducir sonido de explosión al eliminar un conjunto de bolas
            this.sound.play('sfx_explosion', { volume: 0.3 });
            matchIndices.sort((a, b) => b - a);

            for (let idx of matchIndices) {
                // GUARDAMOS LA REFERENCIA DIRECTA a la esfera.
                // Si usamos this.pathSpheres[idx] dentro del onComplete fallará,
                // porque el splice alterará el array de inmediato y el índice ya no apuntará a ella.
                let sphereToDestroy = this.pathSpheres[idx];

                // Efecto de destrucción simple
                this.tweens.add({
                    targets: sphereToDestroy,
                    scaleX: 1.5, scaleY: 1.5, alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        if (sphereToDestroy) sphereToDestroy.destroy();
                    }
                });

                // Las eliminamos del array estructural al instante
                this.pathSpheres.splice(idx, 1);
            }
            // Fase 5: Sumar puntuación base y bonificador por combo (más de 3 bolas)
            let basePoints = matchIndices.length * 10;
            let comboBonus = (matchIndices.length > 3) ? (matchIndices.length - 3) * 20 : 0;
            this.score += basePoints + comboBonus;
            this.scoreText.setText('SCORE: ' + this.score);

            // Fase 5: Condición de Victoria
            if (this.pathSpheres.length === 0) {
                // Damos un margen de medio segundo para que termine la animación de la última explosión
                this.time.delayedCall(500, () => {
                    this.scene.start('GameOverScene', { score: this.score, win: true });
                });
            } else {
                // Verificar si el color que tenemos cargado todavía existe en el camino
                let colorsInPath = [...new Set(this.pathSpheres.map(s => s.colorId))];
                if (!colorsInPath.includes(this.currentAmmoColor)) {
                    this.currentAmmoColor = Phaser.Math.RND.pick(colorsInPath);
                    this.ammoSprite.setTexture(this.currentAmmoColor);
                }
            }
        }
    }

    // Obtener un color de bola que exista actualmente en el camino
    getNextAmmoColor() {
        if (!this.pathSpheres || this.pathSpheres.length === 0) {
            return Phaser.Math.RND.pick(this.sphereColors);
        }

        let colorsInPath = [...new Set(this.pathSpheres.map(s => s.colorId))];
        return Phaser.Math.RND.pick(colorsInPath);
    }
}
