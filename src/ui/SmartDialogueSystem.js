// ═══════════════════════════════════════════════════════════════════════════
// SMART DIALOGUE SYSTEM - Balões de Diálogo Responsivos para Mobile
// ═══════════════════════════════════════════════════════════════════════════
//
// Sistema de diálogo que:
// - Se reposiciona automaticamente para não ser obstruído pelo dedo
// - Usa speech bubbles com "rabinho" (tail) apontando para o emissor
// - Suporta diferentes estados emocionais do pet
// - Typewriter effect para texto
// - Integração com sistema de toque para evitar overlap
//
// ═══════════════════════════════════════════════════════════════════════════

export default class SmartDialogueSystem {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Configuração de aparência
        this.config = {
            maxWidth: 180,          // Largura máxima do balão
            minWidth: 60,           // Largura mínima
            padding: 10,            // Padding interno
            tailSize: 8,            // Tamanho do rabinho
            borderRadius: 6,        // Raio dos cantos
            fontSize: 12,           // Tamanho aproximado (baseado em pixels)
            lineHeight: 14,         // Altura de linha
            typewriterSpeed: 50,    // ms por caractere
            displayDuration: 3000,  // ms para mostrar após completar
            fadeOutDuration: 300    // ms para fade out
        };
        
        // Estado atual
        this.currentDialogue = null;
        this.displayedText = '';
        this.textProgress = 0;
        this.startTime = 0;
        this.isTyping = true;
        this.alpha = 1;
        
        // Posicionamento
        this.position = { x: 0, y: 0 };
        this.preferredSide = 'top';  // 'top', 'bottom', 'left', 'right'
        this.tailPosition = { x: 0, y: 0 };
        
        // Zona de toque atual (para evitar)
        this.touchZone = null;
        
        // Fila de diálogos
        this.queue = [];
    }
    
    /**
     * Mostra um diálogo
     * @param {string} text - Texto a exibir
     * @param {object} emitter - Objeto emissor (pet) com x, y, size
     * @param {object} options - Opções adicionais
     */
    show(text, emitter, options = {}) {
        const dialogue = {
            text,
            emitter,
            emotion: options.emotion || 'neutral',
            instant: options.instant || false,
            duration: options.duration || this.config.displayDuration,
            color: options.color || this.getEmotionColor(options.emotion),
            bgColor: options.bgColor || '#1a1a2e',
            borderColor: options.borderColor || '#2a2a4e'
        };
        
        // Se já há diálogo, adiciona à fila
        if (this.currentDialogue && !options.interrupt) {
            this.queue.push(dialogue);
            return;
        }
        
        this.currentDialogue = dialogue;
        this.displayedText = '';
        this.textProgress = 0;
        this.startTime = Date.now();
        this.isTyping = !dialogue.instant;
        this.alpha = 1;
        
        // Calcula posição inicial
        this.calculatePosition(emitter);
    }
    
    /**
     * Atualiza a zona de toque atual (chamado pelo TouchInputSystem)
     * @param {object} zone - { x, y, radius } do toque
     */
    updateTouchZone(zone) {
        this.touchZone = zone;
        
        // Recalcula posição se há diálogo
        if (this.currentDialogue) {
            this.adjustPositionForTouch();
        }
    }
    
    /**
     * Remove a zona de toque
     */
    clearTouchZone() {
        this.touchZone = null;
    }
    
    /**
     * Calcula a posição ideal do balão
     */
    calculatePosition(emitter) {
        const canvas = this.renderer.canvas;
        const w = this.renderer.logicalWidth;
        const h = this.renderer.logicalHeight;
        
        // Dimensões estimadas do balão
        const balloonWidth = Math.min(this.config.maxWidth, 
            this.estimateTextWidth(this.currentDialogue.text) + this.config.padding * 2);
        const balloonHeight = this.estimateTextHeight(this.currentDialogue.text, balloonWidth);
        
        // Centro do emissor
        const emitterX = emitter.x;
        const emitterY = emitter.y;
        const emitterRadius = emitter.size || 50;
        
        // Calcula espaço disponível em cada direção
        const spaceTop = emitterY - emitterRadius - this.config.tailSize;
        const spaceBottom = h - (emitterY + emitterRadius + this.config.tailSize);
        const spaceLeft = emitterX - emitterRadius - this.config.tailSize;
        const spaceRight = w - (emitterX + emitterRadius + this.config.tailSize);
        
        // Escolhe o lado com mais espaço
        const spaces = [
            { side: 'top', space: spaceTop, needsHeight: balloonHeight },
            { side: 'bottom', space: spaceBottom, needsHeight: balloonHeight },
            { side: 'left', space: spaceLeft, needsHeight: balloonWidth },
            { side: 'right', space: spaceRight, needsHeight: balloonWidth }
        ];
        
        // Ordena por espaço disponível
        spaces.sort((a, b) => (b.space - b.needsHeight) - (a.space - a.needsHeight));
        
        this.preferredSide = spaces[0].side;
        
        // Calcula posição baseada no lado escolhido
        this.calculatePositionForSide(emitterX, emitterY, emitterRadius, 
            balloonWidth, balloonHeight);
    }
    
    calculatePositionForSide(emitterX, emitterY, emitterRadius, width, height) {
        const gap = this.config.tailSize + 5;
        
        switch (this.preferredSide) {
            case 'top':
                this.position.x = emitterX - width / 2;
                this.position.y = emitterY - emitterRadius - gap - height;
                this.tailPosition.x = emitterX;
                this.tailPosition.y = this.position.y + height;
                break;
                
            case 'bottom':
                this.position.x = emitterX - width / 2;
                this.position.y = emitterY + emitterRadius + gap;
                this.tailPosition.x = emitterX;
                this.tailPosition.y = this.position.y;
                break;
                
            case 'left':
                this.position.x = emitterX - emitterRadius - gap - width;
                this.position.y = emitterY - height / 2;
                this.tailPosition.x = this.position.x + width;
                this.tailPosition.y = emitterY;
                break;
                
            case 'right':
                this.position.x = emitterX + emitterRadius + gap;
                this.position.y = emitterY - height / 2;
                this.tailPosition.x = this.position.x;
                this.tailPosition.y = emitterY;
                break;
        }
        
        // Garante que fica dentro da tela
        this.clampToScreen(width, height);
    }
    
    clampToScreen(width, height) {
        const w = this.renderer.logicalWidth;
        const h = this.renderer.logicalHeight;
        const margin = 5;
        
        this.position.x = Math.max(margin, Math.min(w - width - margin, this.position.x));
        this.position.y = Math.max(margin, Math.min(h - height - margin, this.position.y));
    }
    
    /**
     * Ajusta posição para evitar zona de toque
     */
    adjustPositionForTouch() {
        if (!this.touchZone || !this.currentDialogue) return;
        
        const touch = this.touchZone;
        const touchRadius = touch.radius || 40; // Raio do "dedo"
        
        // Verifica se há overlap
        const balloonWidth = this.config.maxWidth;
        const balloonHeight = this.estimateTextHeight(this.currentDialogue.text, balloonWidth);
        
        const balloonRect = {
            x: this.position.x,
            y: this.position.y,
            width: balloonWidth,
            height: balloonHeight
        };
        
        // Verifica colisão com círculo do toque
        if (this.circleRectCollision(touch.x, touch.y, touchRadius, balloonRect)) {
            // Move para o lado oposto do toque
            const emitter = this.currentDialogue.emitter;
            const dx = touch.x - emitter.x;
            const dy = touch.y - emitter.y;
            
            // Determina novo lado preferido
            if (Math.abs(dx) > Math.abs(dy)) {
                this.preferredSide = dx > 0 ? 'left' : 'right';
            } else {
                this.preferredSide = dy > 0 ? 'top' : 'bottom';
            }
            
            // Recalcula posição
            this.calculatePositionForSide(emitter.x, emitter.y, emitter.size || 50,
                balloonWidth, balloonHeight);
        }
    }
    
    circleRectCollision(cx, cy, r, rect) {
        const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
        const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
        
        const dx = cx - nearestX;
        const dy = cy - nearestY;
        
        return (dx * dx + dy * dy) < (r * r);
    }
    
    /**
     * Estima largura do texto (aproximação)
     */
    estimateTextWidth(text) {
        // Aproximação: 6px por caractere em média
        return Math.min(text.length * 6, this.config.maxWidth);
    }
    
    /**
     * Estima altura do texto com wrap
     */
    estimateTextHeight(text, maxWidth) {
        const charsPerLine = Math.floor((maxWidth - this.config.padding * 2) / 6);
        const lines = Math.ceil(text.length / charsPerLine);
        return lines * this.config.lineHeight + this.config.padding * 2;
    }
    
    /**
     * Retorna cor baseada na emoção
     */
    getEmotionColor(emotion) {
        const colors = {
            neutral: '#ffffff',
            happy: '#00ff88',
            sad: '#6688ff',
            angry: '#ff4444',
            excited: '#ffff00',
            confused: '#ff88ff',
            sleepy: '#888888',
            hungry: '#ff8800',
            love: '#ff66aa'
        };
        return colors[emotion] || colors.neutral;
    }
    
    /**
     * Atualiza o sistema (chamar a cada frame)
     */
    update(deltaTime) {
        if (!this.currentDialogue) {
            // Processa fila
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                this.show(next.text, next.emitter, next);
            }
            return;
        }
        
        const elapsed = Date.now() - this.startTime;
        const text = this.currentDialogue.text;
        
        if (this.isTyping) {
            // Typewriter effect
            const targetProgress = Math.floor(elapsed / this.config.typewriterSpeed);
            
            if (targetProgress > this.textProgress) {
                this.textProgress = Math.min(targetProgress, text.length);
                this.displayedText = text.substring(0, this.textProgress);
                
                if (this.textProgress >= text.length) {
                    this.isTyping = false;
                    this.startTime = Date.now(); // Reset para duração de exibição
                }
            }
        } else {
            // Exibindo texto completo
            const displayTime = elapsed;
            
            if (displayTime > this.currentDialogue.duration) {
                // Começa fade out
                const fadeProgress = (displayTime - this.currentDialogue.duration) / 
                                    this.config.fadeOutDuration;
                this.alpha = Math.max(0, 1 - fadeProgress);
                
                if (this.alpha <= 0) {
                    this.hide();
                }
            }
        }
    }
    
    /**
     * Renderiza o diálogo
     */
    render() {
        if (!this.currentDialogue || this.alpha <= 0) return;
        
        const { bgColor, borderColor, color } = this.currentDialogue;
        const text = this.displayedText;
        
        if (!text) return;
        
        // Calcula dimensões do balão
        const width = Math.min(this.config.maxWidth, 
            this.estimateTextWidth(text) + this.config.padding * 2);
        const height = this.estimateTextHeight(text, width);
        
        const x = Math.floor(this.position.x);
        const y = Math.floor(this.position.y);
        
        // Desenha balão
        this.drawBalloon(x, y, width, height, bgColor, borderColor);
        
        // Desenha tail (rabinho)
        this.drawTail(x, y, width, height, bgColor, borderColor);
        
        // Desenha texto
        this.drawText(x + this.config.padding, y + this.config.padding, 
            text, color, width - this.config.padding * 2);
    }
    
    drawBalloon(x, y, w, h, bgColor, borderColor) {
        const renderer = this.renderer;
        const r = this.config.borderRadius;
        const alpha = Math.floor(this.alpha * 255);
        
        const bg = renderer.hexToRgb(bgColor);
        const border = renderer.hexToRgb(borderColor);
        
        // Preenchimento
        for (let py = y + r; py < y + h - r; py++) {
            for (let px = x + 1; px < x + w - 1; px++) {
                renderer.setPixelBlend(px, py, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
            }
        }
        
        // Top e bottom
        for (let px = x + r; px < x + w - r; px++) {
            for (let py = y + 1; py < y + r; py++) {
                renderer.setPixelBlend(px, py, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
            }
            for (let py = y + h - r; py < y + h - 1; py++) {
                renderer.setPixelBlend(px, py, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
            }
        }
        
        // Bordas horizontais
        for (let px = x + r; px < x + w - r; px++) {
            renderer.setPixelBlend(px, y, border.r, border.g, border.b, alpha);
            renderer.setPixelBlend(px, y + h - 1, border.r, border.g, border.b, alpha);
        }
        
        // Bordas verticais
        for (let py = y + r; py < y + h - r; py++) {
            renderer.setPixelBlend(x, py, border.r, border.g, border.b, alpha);
            renderer.setPixelBlend(x + w - 1, py, border.r, border.g, border.b, alpha);
        }
        
        // Cantos arredondados (aproximação)
        this.drawCorner(x + r, y + r, r, 'tl', border, alpha);
        this.drawCorner(x + w - r - 1, y + r, r, 'tr', border, alpha);
        this.drawCorner(x + r, y + h - r - 1, r, 'bl', border, alpha);
        this.drawCorner(x + w - r - 1, y + h - r - 1, r, 'br', border, alpha);
    }
    
    drawCorner(cx, cy, r, corner, color, alpha) {
        // Simplificado - desenha arco com pontos
        const renderer = this.renderer;
        const startAngle = {
            'tl': Math.PI,
            'tr': -Math.PI / 2,
            'bl': Math.PI / 2,
            'br': 0
        }[corner];
        
        for (let a = 0; a <= Math.PI / 2; a += 0.2) {
            const angle = startAngle + a;
            const px = Math.round(cx + Math.cos(angle) * r);
            const py = Math.round(cy + Math.sin(angle) * r);
            renderer.setPixelBlend(px, py, color.r, color.g, color.b, alpha);
        }
    }
    
    drawTail(x, y, w, h, bgColor, borderColor) {
        const renderer = this.renderer;
        const size = this.config.tailSize;
        const alpha = Math.floor(this.alpha * 255);
        const bg = renderer.hexToRgb(bgColor);
        const border = renderer.hexToRgb(borderColor);
        
        let tx = this.tailPosition.x;
        let ty = this.tailPosition.y;
        
        // Desenha triângulo apontando para o emissor
        switch (this.preferredSide) {
            case 'top':
                // Triângulo apontando para baixo
                tx = Math.max(x + 10, Math.min(x + w - 10, tx));
                for (let i = 0; i < size; i++) {
                    const halfWidth = Math.floor((size - i) / 2);
                    for (let j = -halfWidth; j <= halfWidth; j++) {
                        renderer.setPixelBlend(tx + j, ty + i, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
                    }
                }
                // Borda
                for (let i = 0; i < size; i++) {
                    renderer.setPixelBlend(tx - (size - i) / 2, ty + i, border.r, border.g, border.b, alpha);
                    renderer.setPixelBlend(tx + (size - i) / 2, ty + i, border.r, border.g, border.b, alpha);
                }
                break;
                
            case 'bottom':
                // Triângulo apontando para cima
                tx = Math.max(x + 10, Math.min(x + w - 10, tx));
                for (let i = 0; i < size; i++) {
                    const halfWidth = Math.floor(i / 2);
                    for (let j = -halfWidth; j <= halfWidth; j++) {
                        renderer.setPixelBlend(tx + j, ty - size + i, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
                    }
                }
                break;
                
            case 'left':
                // Triângulo apontando para direita
                ty = Math.max(y + 10, Math.min(y + h - 10, ty));
                for (let i = 0; i < size; i++) {
                    const halfHeight = Math.floor((size - i) / 2);
                    for (let j = -halfHeight; j <= halfHeight; j++) {
                        renderer.setPixelBlend(tx + i, ty + j, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
                    }
                }
                break;
                
            case 'right':
                // Triângulo apontando para esquerda
                ty = Math.max(y + 10, Math.min(y + h - 10, ty));
                for (let i = 0; i < size; i++) {
                    const halfHeight = Math.floor(i / 2);
                    for (let j = -halfHeight; j <= halfHeight; j++) {
                        renderer.setPixelBlend(tx - size + i, ty + j, bg.r, bg.g, bg.b, Math.floor(alpha * 0.9));
                    }
                }
                break;
        }
    }
    
    drawText(x, y, text, color, maxWidth) {
        const renderer = this.renderer;
        const { r, g, b } = renderer.hexToRgb(color);
        const alpha = Math.floor(this.alpha * 255);
        
        // Sistema de texto pixel art minimalista
        // Cada caractere é ~5x7 pixels
        const charWidth = 5;
        const charHeight = 7;
        const charSpacing = 1;
        const lineSpacing = 2;
        
        let cursorX = x;
        let cursorY = y;
        const charsPerLine = Math.floor(maxWidth / (charWidth + charSpacing));
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Word wrap
            if (cursorX + charWidth > x + maxWidth || char === '\n') {
                cursorX = x;
                cursorY += charHeight + lineSpacing;
            }
            
            if (char === '\n' || char === ' ') {
                cursorX += charWidth + charSpacing;
                continue;
            }
            
            // Desenha caractere como pequeno bloco 3x5
            this.drawChar(cursorX, cursorY, char, r, g, b, alpha);
            
            cursorX += charWidth + charSpacing;
        }
    }
    
    drawChar(x, y, char, r, g, b, alpha) {
        // Mini font 3x5 simplificada
        const patterns = {
            'A': [0b010, 0b101, 0b111, 0b101, 0b101],
            'B': [0b110, 0b101, 0b110, 0b101, 0b110],
            'C': [0b011, 0b100, 0b100, 0b100, 0b011],
            'D': [0b110, 0b101, 0b101, 0b101, 0b110],
            'E': [0b111, 0b100, 0b110, 0b100, 0b111],
            'F': [0b111, 0b100, 0b110, 0b100, 0b100],
            'G': [0b011, 0b100, 0b101, 0b101, 0b011],
            'H': [0b101, 0b101, 0b111, 0b101, 0b101],
            'I': [0b111, 0b010, 0b010, 0b010, 0b111],
            'J': [0b001, 0b001, 0b001, 0b101, 0b010],
            'K': [0b101, 0b110, 0b100, 0b110, 0b101],
            'L': [0b100, 0b100, 0b100, 0b100, 0b111],
            'M': [0b101, 0b111, 0b101, 0b101, 0b101],
            'N': [0b101, 0b111, 0b111, 0b111, 0b101],
            'O': [0b010, 0b101, 0b101, 0b101, 0b010],
            'P': [0b110, 0b101, 0b110, 0b100, 0b100],
            'Q': [0b010, 0b101, 0b101, 0b111, 0b011],
            'R': [0b110, 0b101, 0b110, 0b101, 0b101],
            'S': [0b011, 0b100, 0b010, 0b001, 0b110],
            'T': [0b111, 0b010, 0b010, 0b010, 0b010],
            'U': [0b101, 0b101, 0b101, 0b101, 0b010],
            'V': [0b101, 0b101, 0b101, 0b010, 0b010],
            'W': [0b101, 0b101, 0b101, 0b111, 0b101],
            'X': [0b101, 0b101, 0b010, 0b101, 0b101],
            'Y': [0b101, 0b101, 0b010, 0b010, 0b010],
            'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
            '0': [0b010, 0b101, 0b101, 0b101, 0b010],
            '1': [0b010, 0b110, 0b010, 0b010, 0b111],
            '2': [0b110, 0b001, 0b010, 0b100, 0b111],
            '3': [0b110, 0b001, 0b010, 0b001, 0b110],
            '4': [0b101, 0b101, 0b111, 0b001, 0b001],
            '5': [0b111, 0b100, 0b110, 0b001, 0b110],
            '6': [0b011, 0b100, 0b110, 0b101, 0b010],
            '7': [0b111, 0b001, 0b010, 0b010, 0b010],
            '8': [0b010, 0b101, 0b010, 0b101, 0b010],
            '9': [0b010, 0b101, 0b011, 0b001, 0b110],
            '.': [0b000, 0b000, 0b000, 0b000, 0b010],
            ',': [0b000, 0b000, 0b000, 0b010, 0b100],
            '!': [0b010, 0b010, 0b010, 0b000, 0b010],
            '?': [0b110, 0b001, 0b010, 0b000, 0b010],
            ':': [0b000, 0b010, 0b000, 0b010, 0b000],
            '-': [0b000, 0b000, 0b111, 0b000, 0b000],
            "'": [0b010, 0b010, 0b000, 0b000, 0b000],
            ' ': [0b000, 0b000, 0b000, 0b000, 0b000]
        };
        
        const upper = char.toUpperCase();
        const pattern = patterns[upper] || patterns[' '];
        
        for (let row = 0; row < 5; row++) {
            const bits = pattern[row];
            for (let col = 0; col < 3; col++) {
                if (bits & (1 << (2 - col))) {
                    this.renderer.setPixelBlend(x + col, y + row, r, g, b, alpha);
                }
            }
        }
    }
    
    /**
     * Esconde o diálogo atual
     */
    hide() {
        this.currentDialogue = null;
        this.displayedText = '';
        this.textProgress = 0;
        this.alpha = 1;
    }
    
    /**
     * Limpa tudo incluindo fila
     */
    clear() {
        this.hide();
        this.queue = [];
    }
    
    /**
     * Verifica se está ativo
     */
    isActive() {
        return this.currentDialogue !== null || this.queue.length > 0;
    }
    
    /**
     * Pula para próximo diálogo
     */
    skip() {
        if (this.isTyping) {
            // Mostra texto completo instantaneamente
            this.displayedText = this.currentDialogue.text;
            this.textProgress = this.currentDialogue.text.length;
            this.isTyping = false;
            this.startTime = Date.now();
        } else {
            // Vai para próximo
            this.hide();
        }
    }
}
