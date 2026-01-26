// ═══════════════════════════════════════════════════════════════════════════
// TOUCH INPUT SYSTEM - Sistema de Entrada para Mobile
// ═══════════════════════════════════════════════════════════════════════════
//
// Gerencia todos os eventos de toque, detecta gestos e fornece uma API
// unificada para interação mobile-first.
//
// Gestos suportados:
//   - TAP: Toque único rápido
//   - DOUBLE TAP: Dois toques rápidos
//   - LONG PRESS: Toque prolongado (500ms)
//   - SWIPE: Deslizar horizontal/vertical
//   - PAN: Arrastar contínuo
//   - PINCH: Dois dedos aproximando/afastando (zoom)
//   - ROTATE: Dois dedos girando
//   - SCRUB: Movimentos rápidos repetidos (petting)
//
// ═══════════════════════════════════════════════════════════════════════════

class TouchInputSystem {
    constructor() {
        this.isInitialized = false;
        this.canvas = null;
        
        // Estado dos toques ativos
        this.touches = new Map(); // touchId -> touchData
        this.activeTouchCount = 0;
        
        // Histórico para detecção de gestos
        this.touchHistory = [];
        this.lastTapTime = 0;
        this.lastTapPosition = { x: 0, y: 0 };
        
        // Timers
        this.longPressTimer = null;
        this.longPressDelay = 500;
        
        // Estado do Pinch
        this.pinchState = {
            active: false,
            initialDistance: 0,
            currentScale: 1,
            center: { x: 0, y: 0 }
        };
        
        // Estado de Rotação
        this.rotateState = {
            active: false,
            initialAngle: 0,
            currentAngle: 0
        };
        
        // Estado de Scrub (petting)
        this.scrubState = {
            active: false,
            movements: [],
            lastDirection: null,
            directionChanges: 0,
            scrubStartTime: 0
        };
        
        // Thresholds
        this.config = {
            tapMaxDuration: 200,      // ms
            tapMaxDistance: 15,       // px
            doubleTapMaxDelay: 300,   // ms
            swipeMinDistance: 50,     // px
            swipeMaxDuration: 300,    // ms
            scrubMinChanges: 3,       // mudanças de direção
            scrubTimeWindow: 500,     // ms
            pinchMinDistance: 10      // px
        };
        
        // Callbacks registrados
        this.listeners = {
            tap: [],
            doubleTap: [],
            longPress: [],
            swipe: [],
            pan: [],
            panStart: [],
            panEnd: [],
            pinch: [],
            pinchStart: [],
            pinchEnd: [],
            rotate: [],
            scrub: []
        };
        
        // Device info
        this.isTouchDevice = false;
        this.devicePixelRatio = 1;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    
    init(canvas) {
        if (this.isInitialized) return;
        
        this.canvas = canvas;
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Bind touch events
        this.bindTouchEvents(canvas);
        
        // Fallback para mouse em desktop
        if (!this.isTouchDevice) {
            this.bindMouseEvents(canvas);
        }
        
        // Previne comportamentos padrão indesejados
        this.preventDefaultBehaviors();
        
        this.isInitialized = true;
        console.log(`📱 TouchInputSystem inicializado (Touch: ${this.isTouchDevice}, DPR: ${this.devicePixelRatio})`);
    }
    
    bindTouchEvents(element) {
        element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        element.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        element.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        element.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
    }
    
    bindMouseEvents(element) {
        let isMouseDown = false;
        let mouseId = 'mouse';
        
        element.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            this.handleTouchStart([{
                identifier: mouseId,
                clientX: e.clientX,
                clientY: e.clientY
            }], e);
        });
        
        element.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                this.handleTouchMove([{
                    identifier: mouseId,
                    clientX: e.clientX,
                    clientY: e.clientY
                }], e);
            }
        });
        
        element.addEventListener('mouseup', (e) => {
            if (isMouseDown) {
                isMouseDown = false;
                this.handleTouchEnd([{
                    identifier: mouseId,
                    clientX: e.clientX,
                    clientY: e.clientY
                }], e);
            }
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (isMouseDown) {
                isMouseDown = false;
                this.handleTouchEnd([{
                    identifier: mouseId,
                    clientX: e.clientX,
                    clientY: e.clientY
                }], e);
            }
        });
        
        // Scroll wheel para zoom (simula pinch)
        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.emit('pinch', {
                scale: delta,
                center: { x, y },
                isWheel: true
            });
        }, { passive: false });
    }
    
    preventDefaultBehaviors() {
        // Previne zoom por double tap e gestos nativos
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Previne scroll do body quando tocando no canvas
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas || this.canvas.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS DE EVENTOS
    // ═══════════════════════════════════════════════════════════════════════
    
    onTouchStart(e) {
        e.preventDefault();
        this.handleTouchStart(Array.from(e.changedTouches), e);
    }
    
    onTouchMove(e) {
        e.preventDefault();
        this.handleTouchMove(Array.from(e.changedTouches), e);
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        this.handleTouchEnd(Array.from(e.changedTouches), e);
    }
    
    onTouchCancel(e) {
        e.preventDefault();
        this.handleTouchEnd(Array.from(e.changedTouches), e);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PROCESSAMENTO DE TOQUES
    // ═══════════════════════════════════════════════════════════════════════
    
    handleTouchStart(touches, originalEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const now = Date.now();
        
        touches.forEach(touch => {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.touches.set(touch.identifier, {
                id: touch.identifier,
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                startTime: now,
                lastMoveTime: now
            });
        });
        
        this.activeTouchCount = this.touches.size;
        
        // Detecta início de gestos
        if (this.activeTouchCount === 1) {
            // Único toque - possível tap, pan, swipe
            const touch = this.touches.values().next().value;
            
            // Inicia timer de long press
            this.longPressTimer = setTimeout(() => {
                if (this.touches.size === 1) {
                    this.emit('longPress', {
                        x: touch.startX,
                        y: touch.startY
                    });
                }
            }, this.longPressDelay);
            
            // Emite panStart
            this.emit('panStart', {
                x: touch.startX,
                y: touch.startY
            });
            
            // Inicia tracking de scrub
            this.scrubState = {
                active: true,
                movements: [{ x: touch.startX, y: touch.startY, time: now }],
                lastDirection: null,
                directionChanges: 0,
                scrubStartTime: now
            };
            
        } else if (this.activeTouchCount === 2) {
            // Dois toques - possível pinch ou rotate
            this.cancelLongPress();
            const touchArray = Array.from(this.touches.values());
            
            // Calcula distância inicial entre os dedos
            const dx = touchArray[1].currentX - touchArray[0].currentX;
            const dy = touchArray[1].currentY - touchArray[0].currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            this.pinchState = {
                active: true,
                initialDistance: distance,
                currentScale: 1,
                center: {
                    x: (touchArray[0].currentX + touchArray[1].currentX) / 2,
                    y: (touchArray[0].currentY + touchArray[1].currentY) / 2
                }
            };
            
            this.rotateState = {
                active: true,
                initialAngle: angle,
                currentAngle: 0
            };
            
            this.emit('pinchStart', {
                center: this.pinchState.center,
                distance: distance
            });
        }
    }
    
    handleTouchMove(touches, originalEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const now = Date.now();
        
        touches.forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) return;
            
            touchData.currentX = touch.clientX - rect.left;
            touchData.currentY = touch.clientY - rect.top;
            touchData.lastMoveTime = now;
        });
        
        // Verifica se moveu o suficiente para cancelar long press
        if (this.activeTouchCount === 1 && this.longPressTimer) {
            const touch = this.touches.values().next().value;
            const dx = touch.currentX - touch.startX;
            const dy = touch.currentY - touch.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.config.tapMaxDistance) {
                this.cancelLongPress();
            }
        }
        
        // Processa gestos de um dedo
        if (this.activeTouchCount === 1) {
            const touch = this.touches.values().next().value;
            const dx = touch.currentX - touch.startX;
            const dy = touch.currentY - touch.startY;
            
            // Emite pan
            this.emit('pan', {
                x: touch.currentX,
                y: touch.currentY,
                deltaX: dx,
                deltaY: dy,
                startX: touch.startX,
                startY: touch.startY
            });
            
            // Tracking de scrub (petting)
            if (this.scrubState.active) {
                this.trackScrub(touch.currentX, touch.currentY, now);
            }
        }
        
        // Processa gestos de dois dedos
        if (this.activeTouchCount === 2 && this.pinchState.active) {
            const touchArray = Array.from(this.touches.values());
            
            const dx = touchArray[1].currentX - touchArray[0].currentX;
            const dy = touchArray[1].currentY - touchArray[0].currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Calcula escala
            const scale = distance / this.pinchState.initialDistance;
            this.pinchState.currentScale = scale;
            
            // Centro atual
            const center = {
                x: (touchArray[0].currentX + touchArray[1].currentX) / 2,
                y: (touchArray[0].currentY + touchArray[1].currentY) / 2
            };
            this.pinchState.center = center;
            
            // Calcula rotação
            const rotation = angle - this.rotateState.initialAngle;
            this.rotateState.currentAngle = rotation;
            
            // Emite pinch
            this.emit('pinch', {
                scale: scale,
                center: center,
                distance: distance,
                isWheel: false
            });
            
            // Emite rotate
            this.emit('rotate', {
                angle: rotation,
                angleDegrees: rotation * (180 / Math.PI),
                center: center
            });
        }
    }
    
    handleTouchEnd(touches, originalEvent) {
        const now = Date.now();
        
        touches.forEach(touch => {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) return;
            
            const duration = now - touchData.startTime;
            const dx = touchData.currentX - touchData.startX;
            const dy = touchData.currentY - touchData.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Detecta TAP
            if (duration < this.config.tapMaxDuration && distance < this.config.tapMaxDistance) {
                // Verifica double tap
                const timeSinceLastTap = now - this.lastTapTime;
                const distFromLastTap = Math.sqrt(
                    Math.pow(touchData.startX - this.lastTapPosition.x, 2) +
                    Math.pow(touchData.startY - this.lastTapPosition.y, 2)
                );
                
                if (timeSinceLastTap < this.config.doubleTapMaxDelay && 
                    distFromLastTap < this.config.tapMaxDistance * 2) {
                    this.emit('doubleTap', {
                        x: touchData.currentX,
                        y: touchData.currentY
                    });
                    this.lastTapTime = 0; // Reset
                } else {
                    this.emit('tap', {
                        x: touchData.currentX,
                        y: touchData.currentY
                    });
                    this.lastTapTime = now;
                    this.lastTapPosition = { x: touchData.startX, y: touchData.startY };
                }
            }
            
            // Detecta SWIPE
            if (duration < this.config.swipeMaxDuration && distance > this.config.swipeMinDistance) {
                const angle = Math.atan2(dy, dx);
                let direction;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    direction = dx > 0 ? 'right' : 'left';
                } else {
                    direction = dy > 0 ? 'down' : 'up';
                }
                
                this.emit('swipe', {
                    direction: direction,
                    distance: distance,
                    velocity: distance / duration,
                    angle: angle,
                    startX: touchData.startX,
                    startY: touchData.startY,
                    endX: touchData.currentX,
                    endY: touchData.currentY
                });
            }
            
            this.touches.delete(touch.identifier);
        });
        
        this.activeTouchCount = this.touches.size;
        this.cancelLongPress();
        
        // Finaliza pan se não há mais toques
        if (this.activeTouchCount === 0) {
            const lastTouch = touches[touches.length - 1];
            const rect = this.canvas.getBoundingClientRect();
            this.emit('panEnd', {
                x: lastTouch.clientX - rect.left,
                y: lastTouch.clientY - rect.top
            });
            
            // Finaliza scrub se estava ativo
            if (this.scrubState.active) {
                this.scrubState.active = false;
            }
        }
        
        // Finaliza pinch se tinha dois dedos e agora tem menos
        if (this.pinchState.active && this.activeTouchCount < 2) {
            this.emit('pinchEnd', {
                finalScale: this.pinchState.currentScale,
                center: this.pinchState.center
            });
            this.pinchState.active = false;
            this.rotateState.active = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DETECÇÃO DE SCRUB (PETTING)
    // ═══════════════════════════════════════════════════════════════════════
    
    trackScrub(x, y, time) {
        const movements = this.scrubState.movements;
        movements.push({ x, y, time });
        
        // Mantém apenas movimentos recentes
        while (movements.length > 0 && 
               time - movements[0].time > this.config.scrubTimeWindow) {
            movements.shift();
        }
        
        if (movements.length < 3) return;
        
        // Detecta direção do movimento
        const last = movements[movements.length - 1];
        const prev = movements[movements.length - 2];
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        
        // Direção predominante
        let direction;
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
        } else {
            direction = dy > 0 ? 'down' : 'up';
        }
        
        // Conta mudanças de direção
        if (this.scrubState.lastDirection && direction !== this.scrubState.lastDirection) {
            // Verifica se é direção oposta (não apenas diferente)
            const isOpposite = 
                (this.scrubState.lastDirection === 'left' && direction === 'right') ||
                (this.scrubState.lastDirection === 'right' && direction === 'left') ||
                (this.scrubState.lastDirection === 'up' && direction === 'down') ||
                (this.scrubState.lastDirection === 'down' && direction === 'up');
            
            if (isOpposite) {
                this.scrubState.directionChanges++;
            }
        }
        this.scrubState.lastDirection = direction;
        
        // Emite scrub se houver mudanças de direção suficientes
        if (this.scrubState.directionChanges >= this.config.scrubMinChanges) {
            const duration = time - this.scrubState.scrubStartTime;
            const intensity = Math.min(1, this.scrubState.directionChanges / 10);
            
            this.emit('scrub', {
                x: x,
                y: y,
                intensity: intensity,
                directionChanges: this.scrubState.directionChanges,
                duration: duration
            });
            
            // Reset para continuar detectando
            this.scrubState.directionChanges = 0;
            this.scrubState.scrubStartTime = time;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════════════
    
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SISTEMA DE EVENTOS
    // ═══════════════════════════════════════════════════════════════════════
    
    on(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].push(callback);
        }
        return () => this.off(eventName, callback);
    }
    
    off(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
        }
    }
    
    emit(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => callback(data));
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS PARA THUMB ZONES
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Verifica se um ponto está na "thumb zone" (zona confortável para polegares)
     * Baseado em estudos de ergonomia mobile
     */
    isInThumbZone(x, y) {
        if (!this.canvas) return false;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Thumb zones: cantos inferiores e laterais inferiores
        const bottomZone = y > height * 0.6;
        const leftZone = x < width * 0.3;
        const rightZone = x > width * 0.7;
        
        return bottomZone || (y > height * 0.4 && (leftZone || rightZone));
    }
    
    /**
     * Retorna a zona de toque para posicionamento de UI
     */
    getTouchZone(x, y) {
        if (!this.canvas) return 'center';
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const horizontal = x < width / 3 ? 'left' : (x > width * 2/3 ? 'right' : 'center');
        const vertical = y < height / 3 ? 'top' : (y > height * 2/3 ? 'bottom' : 'middle');
        
        return `${vertical}-${horizontal}`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════
    
    destroy() {
        this.touches.clear();
        this.cancelLongPress();
        Object.keys(this.listeners).forEach(key => {
            this.listeners[key] = [];
        });
        this.isInitialized = false;
    }
}

// Singleton exportado
export const touchInput = new TouchInputSystem();
export default TouchInputSystem;
