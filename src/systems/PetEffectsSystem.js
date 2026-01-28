// ═══════════════════════════════════════════════════════════════════
// PET EFFECTS SYSTEM - Efeitos Visuais para Interações
// Gerencia efeitos de tela (shake, tint, flash) e estados do pet
// ═══════════════════════════════════════════════════════════════════

/**
 * Sistema de efeitos visuais para o pet e a tela
 */
class PetEffectsSystemClass {
    constructor() {
        // Screen effects
        this.screenShake = { active: false, intensity: 0, duration: 0, elapsed: 0 };
        this.screenTint = { active: false, color: null, alpha: 0, duration: 0, elapsed: 0 };
        this.screenFlash = { active: false, color: null, alpha: 0 };
        
        // Pet states
        this.frozen = { active: false, duration: 0, elapsed: 0 };
        this.shocked = { active: false, duration: 0, elapsed: 0 };
        this.mutating = { active: false, duration: 0, elapsed: 0, targetShape: null, progress: 0 };
        this.tickled = { active: false, duration: 0, elapsed: 0 };
        
        // Referência ao canvas para efeitos
        this.canvas = null;
        this.originalTransform = null;
        
        // Formas para mutação (polígonos convexos alternativos)
        this.mutationShapes = [
            'triangulo', 'quadrado', 'hexagono', 'losango', 'estrela', 'circulo'
        ];
    }
    
    /**
     * Define o canvas para aplicar efeitos
     */
    setCanvas(canvas) {
        this.canvas = canvas;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SCREEN SHAKE - Efeito de tremor na tela
    // ═══════════════════════════════════════════════════════════════════
    
    startScreenShake(intensity = 10, duration = 500) {
        this.screenShake = {
            active: true,
            intensity,
            duration,
            elapsed: 0
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SCREEN TINT - Coloração da tela
    // ═══════════════════════════════════════════════════════════════════
    
    startScreenTint(color, alpha = 0.3, duration = 1000) {
        this.screenTint = {
            active: true,
            color,
            alpha,
            maxAlpha: alpha,
            duration,
            elapsed: 0
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SCREEN FLASH - Flash rápido na tela
    // ═══════════════════════════════════════════════════════════════════
    
    flashScreen(color, alpha = 0.8) {
        this.screenFlash = {
            active: true,
            color,
            alpha,
            maxAlpha: alpha
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FROZEN STATE - Pet congelado
    // ═══════════════════════════════════════════════════════════════════
    
    startFreeze(duration = 4000) {
        this.frozen = {
            active: true,
            duration,
            elapsed: 0,
            tremblePhase: 0
        };
    }
    
    isFrozen() {
        return this.frozen.active;
    }
    
    getFreezeProgress() {
        if (!this.frozen.active) return 0;
        return this.frozen.elapsed / this.frozen.duration;
    }
    
    getFreezeTremble() {
        if (!this.frozen.active) return { x: 0, y: 0 };
        // Tremor rápido e pequeno
        const intensity = 2 * (1 - this.getFreezeProgress()); // Diminui com o tempo
        return {
            x: (Math.random() - 0.5) * intensity,
            y: (Math.random() - 0.5) * intensity
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SHOCKED STATE - Pet em choque
    // ═══════════════════════════════════════════════════════════════════
    
    startShock(duration = 2000) {
        this.shocked = {
            active: true,
            duration,
            elapsed: 0,
            pulsePhase: 0
        };
        
        // Efeitos de tela simultâneos
        this.startScreenShake(15, duration * 0.8);
        this.startScreenTint('#ffff00', 0.25, duration);
        this.flashScreen('#ffffff', 0.9);
    }
    
    isShocked() {
        return this.shocked.active;
    }
    
    getShockProgress() {
        if (!this.shocked.active) return 0;
        return this.shocked.elapsed / this.shocked.duration;
    }
    
    getShockVisuals() {
        if (!this.shocked.active) return null;
        
        const progress = this.getShockProgress();
        const intensity = 1 - progress;
        
        return {
            // Tremor intenso
            tremble: {
                x: (Math.random() - 0.5) * 8 * intensity,
                y: (Math.random() - 0.5) * 8 * intensity
            },
            // Flash elétrico
            flash: Math.sin(this.shocked.pulsePhase * 20) > 0.5,
            // Cor de contorno (amarelo elétrico)
            outlineColor: `rgba(255, 255, 0, ${0.5 + Math.sin(this.shocked.pulsePhase * 15) * 0.5})`,
            // Raios elétricos
            sparks: this.generateElectricSparks(intensity)
        };
    }
    
    generateElectricSparks(intensity) {
        const sparks = [];
        const count = Math.floor(3 + intensity * 5);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            sparks.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                length: 5 + Math.random() * 10,
                angle: angle + (Math.random() - 0.5) * 0.5
            });
        }
        
        return sparks;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MUTATION STATE - Pet mutando de forma
    // ═══════════════════════════════════════════════════════════════════
    
    startMutation(currentShape, duration = 3000) {
        // Escolhe forma diferente da atual
        const availableShapes = this.mutationShapes.filter(s => s !== currentShape);
        const targetShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        
        this.mutating = {
            active: true,
            duration,
            elapsed: 0,
            originalShape: currentShape,
            targetShape,
            progress: 0,
            glitchPhase: 0
        };
        
        // Efeito visual de glitch
        this.flashScreen('#ff00ff', 0.6);
        
        return targetShape;
    }
    
    isMutating() {
        return this.mutating.active;
    }
    
    getMutationProgress() {
        if (!this.mutating.active) return 0;
        return this.mutating.progress;
    }
    
    getMutationData() {
        if (!this.mutating.active) return null;
        return {
            originalShape: this.mutating.originalShape,
            targetShape: this.mutating.targetShape,
            progress: this.mutating.progress,
            // Glitch visual durante transição
            glitch: {
                offsetX: (Math.random() - 0.5) * 10 * (1 - Math.abs(this.mutating.progress - 0.5) * 2),
                offsetY: (Math.random() - 0.5) * 5 * (1 - Math.abs(this.mutating.progress - 0.5) * 2),
                slices: Math.floor(Math.random() * 3) + 1
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TICKLE STATE - Pet com cócegas
    // ═══════════════════════════════════════════════════════════════════
    
    startTickle(duration = 2000) {
        this.tickled = {
            active: true,
            duration,
            elapsed: 0,
            laughPhase: 0
        };
    }
    
    isTickled() {
        return this.tickled.active;
    }
    
    getTickleVisuals() {
        if (!this.tickled.active) return null;
        
        const progress = this.tickled.elapsed / this.tickled.duration;
        const intensity = Math.sin(progress * Math.PI); // Peak no meio
        
        return {
            // Squash/stretch de risada
            squash: {
                x: 1 + Math.sin(this.tickled.laughPhase * 15) * 0.1 * intensity,
                y: 1 - Math.sin(this.tickled.laughPhase * 15) * 0.1 * intensity
            },
            // Pular de alegria
            bounce: Math.abs(Math.sin(this.tickled.laughPhase * 10)) * 5 * intensity,
            // Partículas de risada
            particles: this.generateLaughParticles(intensity)
        };
    }
    
    generateLaughParticles(intensity) {
        if (Math.random() > 0.3 * intensity) return [];
        
        return [{
            text: ['ha', 'he', 'hi', '~', '♪'][Math.floor(Math.random() * 5)],
            x: (Math.random() - 0.5) * 40,
            y: -20 - Math.random() * 20,
            alpha: 0.8
        }];
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UPDATE - Atualiza todos os efeitos
    // ═══════════════════════════════════════════════════════════════════
    
    update(deltaTime) {
        // Screen shake
        if (this.screenShake.active) {
            this.screenShake.elapsed += deltaTime;
            if (this.screenShake.elapsed >= this.screenShake.duration) {
                this.screenShake.active = false;
            }
        }
        
        // Screen tint
        if (this.screenTint.active) {
            this.screenTint.elapsed += deltaTime;
            // Fade out no final
            const remaining = this.screenTint.duration - this.screenTint.elapsed;
            if (remaining < 300) {
                this.screenTint.alpha = this.screenTint.maxAlpha * (remaining / 300);
            }
            if (this.screenTint.elapsed >= this.screenTint.duration) {
                this.screenTint.active = false;
            }
        }
        
        // Screen flash (decai rapidamente)
        if (this.screenFlash.active) {
            this.screenFlash.alpha -= deltaTime * 0.008;
            if (this.screenFlash.alpha <= 0) {
                this.screenFlash.active = false;
            }
        }
        
        // Frozen state
        if (this.frozen.active) {
            this.frozen.elapsed += deltaTime;
            this.frozen.tremblePhase += deltaTime * 0.01;
            if (this.frozen.elapsed >= this.frozen.duration) {
                this.frozen.active = false;
            }
        }
        
        // Shocked state
        if (this.shocked.active) {
            this.shocked.elapsed += deltaTime;
            this.shocked.pulsePhase += deltaTime * 0.01;
            if (this.shocked.elapsed >= this.shocked.duration) {
                this.shocked.active = false;
            }
        }
        
        // Mutating state
        if (this.mutating.active) {
            this.mutating.elapsed += deltaTime;
            this.mutating.glitchPhase += deltaTime * 0.01;
            
            // Curva de progresso suave (ease in-out)
            const t = this.mutating.elapsed / this.mutating.duration;
            this.mutating.progress = t < 0.5 
                ? 2 * t * t 
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            if (this.mutating.elapsed >= this.mutating.duration) {
                this.mutating.active = false;
            }
        }
        
        // Tickled state
        if (this.tickled.active) {
            this.tickled.elapsed += deltaTime;
            this.tickled.laughPhase += deltaTime * 0.01;
            if (this.tickled.elapsed >= this.tickled.duration) {
                this.tickled.active = false;
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDER EFFECTS - Renderiza efeitos na tela
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Aplica transformação de shake no canvas context
     */
    applyScreenShake(ctx) {
        if (!this.screenShake.active) return;
        
        const progress = this.screenShake.elapsed / this.screenShake.duration;
        const intensity = this.screenShake.intensity * (1 - progress);
        
        const offsetX = (Math.random() - 0.5) * intensity;
        const offsetY = (Math.random() - 0.5) * intensity;
        
        ctx.translate(offsetX, offsetY);
    }
    
    /**
     * Renderiza overlay de tint/flash usando CSS (muito mais performático)
     * Não usa mais iteração pixel a pixel
     */
    renderOverlays(renderer) {
        // Os overlays agora são gerenciados via CSS classes no game-container
        // Isso é muito mais performático que iterar 160.000 pixels
    }
    
    /**
     * Renderiza raios elétricos do choque
     */
    renderElectricSparks(renderer, centerX, centerY, sparks, color = '#ffff00') {
        const { r, g, b } = renderer.hexToRgb(color);
        
        sparks.forEach(spark => {
            const startX = centerX + spark.x;
            const startY = centerY + spark.y;
            
            // Linha de raio com zigzag
            let x = startX;
            let y = startY;
            
            for (let i = 0; i < 3; i++) {
                const nextX = x + Math.cos(spark.angle) * spark.length / 3 + (Math.random() - 0.5) * 8;
                const nextY = y + Math.sin(spark.angle) * spark.length / 3 + (Math.random() - 0.5) * 8;
                
                // Desenha segmento
                this.drawLightningSegment(renderer, x, y, nextX, nextY, r, g, b);
                
                x = nextX;
                y = nextY;
            }
        });
    }
    
    drawLightningSegment(renderer, x0, y0, x1, y1, r, g, b) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = Math.round(x0);
        let y = Math.round(y0);
        const endX = Math.round(x1);
        const endY = Math.round(y1);
        
        while (true) {
            // Core brilhante
            renderer.setPixelBlend(x, y, r, g, b, 255);
            // Glow
            renderer.setPixelBlend(x + 1, y, r, g, b, 128);
            renderer.setPixelBlend(x - 1, y, r, g, b, 128);
            renderer.setPixelBlend(x, y + 1, r, g, b, 128);
            renderer.setPixelBlend(x, y - 1, r, g, b, 128);
            
            if (x === endX && y === endY) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }
    
    /**
     * Renderiza partículas de risada
     */
    renderLaughParticles(renderer, centerX, centerY, particles) {
        // Renderiza partículas simples como pixels brilhantes
        const { r, g, b } = renderer.hexToRgb('#ffcc66');
        
        particles.forEach(p => {
            const x = Math.round(centerX + p.x);
            const y = Math.round(centerY + p.y);
            const alpha = Math.floor(p.alpha * 255);
            
            // Desenha pequena "explosão" de pixels
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= 2) {
                        renderer.setPixelBlend(x + dx, y + dy, r, g, b, alpha);
                    }
                }
            }
        });
    }
    
    /**
     * Retorna se há algum efeito ativo
     */
    hasActiveEffects() {
        return this.screenShake.active || 
               this.screenTint.active || 
               this.screenFlash.active ||
               this.frozen.active ||
               this.shocked.active ||
               this.mutating.active ||
               this.tickled.active;
    }
}

// Singleton export
export const PetEffectsSystem = new PetEffectsSystemClass();
export default PetEffectsSystem;
