// ═══════════════════════════════════════════════════════════════════
// GEOPET - Entidade do Pet Geométrico (Tamagotchi Style)
// Renderizado 100% com setPixel + Algoritmos de CG
// Baseado no sistema de expressões do HYLOMORPH
// ═══════════════════════════════════════════════════════════════════

import { SHAPES_MAP } from '../data/shapes.js';
import { MATERIALS_MAP, getMaterialById } from '../data/materials.js';
import { materialRenderer } from '../systems/MaterialRenderer.js';

export default class GeoPet {
    constructor(config = {}) {
        // ═══════════════════════════════════════════════════════════════════
        // IDENTIDADE VISUAL (DNA)
        // ═══════════════════════════════════════════════════════════════════
        this.shapeId = config.shapeId || 'circulo';
        this.eyeType = config.eyeType || 'circle';
        this.mouthType = config.mouthType || 'simple';
        
        // NOVO: Sistema de Materiais (substitui cores simples)
        this.materialId = config.materialId || 'aetherium';
        
        // Cores legadas derivadas do material (para sistemas legados como MaterializationSystem)
        const material = getMaterialById(this.materialId);
        this.primaryColor = config.primaryColor || material.palette.glow;
        this.secondaryColor = config.secondaryColor || material.palette.core;
        
        // ═══════════════════════════════════════════════════════════════════
        // POSIÇÃO E TRANSFORMAÇÕES
        // ═══════════════════════════════════════════════════════════════════
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.size = config.size || 40;
        this.scale = config.scale || 1;
        this.rotation = 0;
        
        // ═══════════════════════════════════════════════════════════════════
        // MOVIMENTO (Física simplificada)
        // ═══════════════════════════════════════════════════════════════════
        this.vx = 0;
        this.vy = 0;
        this.targetX = null;
        this.targetY = null;
        this.speed = 1.5;
        this.friction = 0.95;
        
        // ═══════════════════════════════════════════════════════════════════
        // STATS DO TAMAGOTCHI
        // ═══════════════════════════════════════════════════════════════════
        this.hunger = config.hunger ?? 100;     // 0-100 (fome)
        this.happiness = config.happiness ?? 80; // 0-100 (felicidade)  
        this.energy = config.energy ?? 100;      // 0-100 (energia)
        
        // Taxas de decaimento (por segundo)
        this.decayRates = {
            hunger: 0.5,    // Perde 0.5 de fome por segundo
            happiness: 0.2, // Perde 0.2 de felicidade por segundo
            energy: 0.1     // Perde 0.1 de energia por segundo
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE EXPRESSÕES (Baseado no Golem.js)
        // ═══════════════════════════════════════════════════════════════════
        this.expressionState = {
            mood: 'happy',     // happy, neutral, sad, dying, eating
            action: null,      // ação temporária (eating, playing, etc)
            actionTimer: 0     // quando a ação expira
        };
        
        // Parâmetros faciais animados (lerp suave)
        this.faceParams = {
            eyeOpenness: 1,      // 0-1.5 (fechado a arregalado)
            mouthCurve: 0.5,     // -1 a 1 (triste a feliz)
            browAngle: 0,        // -1 a 1 (preocupado a relaxado)
            pupilSize: 1,        // 0.5-1.5 (contraído a dilatado)
            focusOffset: { x: 0, y: 0 }, // Para onde está olhando
            tremor: 0,           // 0-1 (tremendo de medo/frio)
            breathY: 0           // Offset da respiração
        };
        
        // Alvos para interpolação suave
        this.faceTargets = {
            eyeOpenness: 1,
            mouthCurve: 0.5,
            browAngle: 0,
            pupilSize: 1,
            tremor: 0
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMAÇÃO
        // ═══════════════════════════════════════════════════════════════════
        this.breathPhase = Math.random() * Math.PI * 2;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.blinkDuration = 0;
        this.blinkInterval = 120 + Math.random() * 60;
        
        // Squash & Stretch
        this.squashX = 1;
        this.squashY = 1;
        this.squashDecay = 0.9;
        
        // ═══════════════════════════════════════════════════════════════════
        // INTERAÇÃO
        // ═══════════════════════════════════════════════════════════════════
        this.isBeingPetted = false;
        this.lastPetTime = 0;
        this.feedCooldown = 0;
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE FALAS (Typewriter Effect)
        // ═══════════════════════════════════════════════════════════════════
        this.currentDialogue = null;      // Texto completo
        this.displayedDialogue = '';      // Texto visível (typewriter)
        this.dialogueIndex = 0;           // Índice atual do typewriter
        this.dialogueTimer = 0;           // Timer de exibição total
        this.typewriterTimer = 0;         // Timer para próxima letra
        this.typewriterSpeed = 50;        // ms por letra
        this.dialogueDuration = 3000;     // 3 segundos após terminar de digitar
        this.lastAutoDialogue = 0;
        this.autoDialogueInterval = 8000;
        
        // Callbacks para sistemas externos
        this.onSpeak = null; // (text, emotion, context) => void
        this.onTypeLetter = null; // (letter) => void - para som de digitação
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UPDATE PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════
    
    update(deltaTime = 16) {
        const dt = deltaTime / 1000; // Converte para segundos
        
        // Atualiza stats
        this.updateStats(dt);
        
        // Atualiza mood baseado nos stats
        this.updateMood();
        
        // Atualiza expressões faciais
        this.updateExpression();
        
        // Atualiza animações
        this.updateAnimations(dt);
        
        // Atualiza movimento
        this.updateMovement(dt);
        
        // Atualiza diálogos
        this.updateDialogue(deltaTime);
        
        // Cooldowns
        if (this.feedCooldown > 0) {
            this.feedCooldown -= deltaTime;
        }
    }
    
    updateStats(dt) {
        // Não decai stats durante cooldown de alimentação
        if (this.feedCooldown > 0) return;
        
        // Decai stats naturalmente
        this.hunger = Math.max(0, this.hunger - this.decayRates.hunger * dt);
        this.happiness = Math.max(0, this.happiness - this.decayRates.happiness * dt);
        this.energy = Math.max(0, this.energy - this.decayRates.energy * dt);
        
        // Fome baixa afeta felicidade
        if (this.hunger < 30) {
            this.happiness = Math.max(0, this.happiness - 0.5 * dt);
        }
        
        // Energia baixa deixa mais lento
        if (this.energy < 20) {
            this.speed = 0.8;
        } else {
            this.speed = 1.5;
        }
    }
    
    updateMood() {
        // Ação temporária tem prioridade
        if (this.expressionState.action && Date.now() < this.expressionState.actionTimer) {
            return;
        } else {
            this.expressionState.action = null;
        }
        
        // Calcula mood baseado na média dos stats
        const avgStats = (this.hunger + this.happiness + this.energy) / 3;
        
        if (avgStats > 70) {
            this.expressionState.mood = 'happy';
        } else if (avgStats > 40) {
            this.expressionState.mood = 'neutral';
        } else if (avgStats > 15) {
            this.expressionState.mood = 'sad';
        } else {
            this.expressionState.mood = 'dying';
        }
    }
    
    updateExpression() {
        // Define alvos baseados no mood/action
        let target = { open: 1, curve: 0, brow: 0, pupil: 1, tremor: 0 };
        
        const currentMood = this.expressionState.action || this.expressionState.mood;
        
        switch (currentMood) {
            case 'happy':
                target = { open: 1, curve: 0.7, brow: -0.2, pupil: 1, tremor: 0 };
                break;
            case 'neutral':
                target = { open: 0.9, curve: 0.1, brow: 0, pupil: 1, tremor: 0 };
                break;
            case 'sad':
                target = { open: 0.7, curve: -0.5, brow: 0.4, pupil: 0.9, tremor: 0 };
                break;
            case 'dying':
                target = { open: 0.5, curve: -0.3, brow: 0.6, pupil: 0.7, tremor: 0.3 };
                break;
            case 'eating':
                // Boca animada durante alimentação
                const chewPhase = Math.sin(Date.now() * 0.015);
                target = { open: 0.9, curve: 0.3 + chewPhase * 0.3, brow: -0.2, pupil: 1.1, tremor: 0 };
                break;
            case 'love':
                target = { open: 0.8, curve: 0.9, brow: -0.3, pupil: 1.3, tremor: 0 };
                break;
            case 'surprised':
                target = { open: 1.3, curve: 0.1, brow: 0.5, pupil: 0.6, tremor: 0.2 };
                break;
        }
        
        // Interpolação suave (Lerp)
        const lerp = 0.15;
        this.faceParams.eyeOpenness += (target.open - this.faceParams.eyeOpenness) * lerp;
        this.faceParams.mouthCurve += (target.curve - this.faceParams.mouthCurve) * lerp;
        this.faceParams.browAngle += (target.brow - this.faceParams.browAngle) * lerp;
        this.faceParams.pupilSize += (target.pupil - this.faceParams.pupilSize) * lerp;
        this.faceParams.tremor += (target.tremor - this.faceParams.tremor) * lerp;
    }
    
    updateAnimations(dt) {
        // Respiração
        this.breathPhase += 3 * dt;
        this.faceParams.breathY = Math.sin(this.breathPhase) * 2;
        
        // Piscar
        this.blinkTimer++;
        if (!this.isBlinking && this.blinkTimer > this.blinkInterval) {
            this.isBlinking = true;
            this.blinkDuration = 8;
            this.blinkTimer = 0;
            this.blinkInterval = 100 + Math.random() * 80;
        }
        if (this.isBlinking) {
            this.blinkDuration--;
            if (this.blinkDuration <= 0) {
                this.isBlinking = false;
            }
        }
        
        // Squash & Stretch decay
        this.squashX += (1 - this.squashX) * (1 - this.squashDecay);
        this.squashY += (1 - this.squashY) * (1 - this.squashDecay);
    }
    
    updateMovement(dt) {
        // Movimento para alvo
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 3) {
                // Aceleração em direção ao alvo
                const ax = (dx / dist) * this.speed * 0.5;
                const ay = (dy / dist) * this.speed * 0.5;
                
                this.vx += ax;
                this.vy += ay;
                
                // Limita velocidade máxima
                const maxSpeed = this.speed * 3;
                const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (currentSpeed > maxSpeed) {
                    this.vx = (this.vx / currentSpeed) * maxSpeed;
                    this.vy = (this.vy / currentSpeed) * maxSpeed;
                }
            } else {
                // Chegou no destino
                this.targetX = null;
                this.targetY = null;
            }
        }
        
        // Aplica velocidade
        this.x += this.vx;
        this.y += this.vy;
        
        // Fricção
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Para se velocidade muito baixa
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
        if (Math.abs(this.vy) < 0.01) this.vy = 0;
    }
    
    updateDialogue(deltaTime) {
        if (!this.currentDialogue) return;
        
        // Efeito typewriter - adiciona letra por letra
        if (this.dialogueIndex < this.currentDialogue.length) {
            this.typewriterTimer += deltaTime;
            
            while (this.typewriterTimer >= this.typewriterSpeed && 
                   this.dialogueIndex < this.currentDialogue.length) {
                const letter = this.currentDialogue[this.dialogueIndex];
                this.displayedDialogue += letter;
                this.dialogueIndex++;
                this.typewriterTimer -= this.typewriterSpeed;
                
                // Callback para som de digitação (apenas para letras visíveis)
                if (this.onTypeLetter && letter.trim()) {
                    this.onTypeLetter(letter);
                }
            }
        } else {
            // Texto completo - decrementa timer de exibição
            this.dialogueTimer -= deltaTime;
            if (this.dialogueTimer <= 0) {
                this.currentDialogue = null;
                this.displayedDialogue = '';
                this.dialogueIndex = 0;
            }
        }
    }
    
    /**
     * Faz o pet "falar" algo com efeito typewriter
     * @param {string} text - Texto da fala
     * @param {string} context - Contexto: 'idle', 'eating', 'petted', etc.
     */
    say(text, context = 'idle') {
        this.currentDialogue = text;
        this.displayedDialogue = '';
        this.dialogueIndex = 0;
        this.typewriterTimer = 0;
        this.dialogueTimer = this.dialogueDuration;
        
        // Notifica callback externo (para tocar som inicial)
        if (this.onSpeak) {
            this.onSpeak(text, this.expressionState.mood, context);
        }
    }
    
    /**
     * Retorna o diálogo visível atual (com typewriter)
     */
    getDialogue() {
        return this.displayedDialogue || null;
    }
    
    /**
     * Retorna se ainda está digitando
     */
    isTyping() {
        return this.currentDialogue && this.dialogueIndex < this.currentDialogue.length;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDERING (usando apenas setPixel e algoritmos de CG)
    // ═══════════════════════════════════════════════════════════════════
    
    render(renderer, materializationSystem = null) {
        const breathOffset = this.faceParams.breathY;
        const scaleX = this.scale * this.squashX;
        const scaleY = this.scale * this.squashY * (1 + Math.sin(this.breathPhase) * 0.02);
        
        // Se está materializando, usa renderização especial
        if (materializationSystem && materializationSystem.isActive) {
            this.renderWithMaterialization(renderer, materializationSystem, breathOffset, scaleX, scaleY);
            return;
        }
        
        // 1. Glow/Aura (efeito neon)
        this.drawGlow(renderer);
        
        // 2. Corpo
        this.drawBody(renderer, breathOffset, scaleX, scaleY);
        
        // 3. Face (olhos, boca, sobrancelhas)
        this.drawFace(renderer, breathOffset, scaleX, scaleY);
    }
    
    /**
     * Renderização com efeito de materialização (pixel a pixel)
     */
    renderWithMaterialization(renderer, matSystem, breathOffset, scaleX, scaleY) {
        const shape = SHAPES_MAP[this.shapeId];
        if (!shape) return;
        
        const params = shape.getParams(this.size * this.scale);
        const cy = this.y + breathOffset;
        
        // Renderiza glow com alpha baseado no progresso
        const glowAlpha = matSystem.progress;
        if (glowAlpha > 0.1) {
            this.drawGlowWithAlpha(renderer, glowAlpha);
        }
        
        // Renderiza corpo pixel a pixel baseado na máscara
        if (params.type === 'circle') {
            const rx = params.radius * scaleX / this.scale;
            const ry = params.radius * scaleY / this.scale;
            this.fillEllipseWithMask(renderer, this.x, cy, rx, ry, matSystem);
            
            // Contorno apenas se progresso > 50%
            if (matSystem.progress > 0.5) {
                this.drawNeonEllipseWithMask(renderer, this.x, cy, rx, ry, matSystem);
            }
        } else if (params.type === 'polygon') {
            const transformed = params.vertices.map(v => ({
                x: this.x + v.x * scaleX / this.scale,
                y: cy + v.y * scaleY / this.scale
            }));
            this.fillPolygonWithMask(renderer, transformed, matSystem);
            
            if (matSystem.progress > 0.5) {
                this.drawNeonPolygonWithMask(renderer, transformed, matSystem);
            }
        }
        
        // Face aparece por último (progresso > 70%)
        if (matSystem.progress > 0.7) {
            const faceAlpha = (matSystem.progress - 0.7) / 0.3;
            this.drawFaceWithAlpha(renderer, breathOffset, scaleX, scaleY, faceAlpha);
        }
    }
    
    drawGlowWithAlpha(renderer, alpha) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const glowRadius = this.size * this.scale * 1.6;
        
        for (let layer = 4; layer >= 1; layer--) {
            const radius = glowRadius + layer * 6;
            const layerAlpha = Math.round(25 * (1 - layer / 5) * alpha);
            renderer.drawCircleRgba(this.x, this.y, radius, r, g, b, layerAlpha);
        }
    }
    
    fillEllipseWithMask(renderer, cx, cy, rx, ry, matSystem) {
        const inner = renderer.hexToRgb(this.secondaryColor);
        const outer = renderer.hexToRgb(this.primaryColor);
        
        for (let y = -ry; y <= ry; y++) {
            const halfWidth = rx * Math.sqrt(1 - (y * y) / (ry * ry));
            for (let x = -halfWidth; x <= halfWidth; x++) {
                const px = cx + x;
                const py = cy + y;
                
                // Verifica máscara de revelação
                const revealAlpha = matSystem.getRevealAlpha(px, py);
                if (revealAlpha === 0) continue;
                
                // Distância normalizada do centro
                const dx = x / rx;
                const dy = y / ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const t = Math.min(1, dist);
                
                // Interpola cores
                const r = Math.round(inner.r + (outer.r - inner.r) * t);
                const g = Math.round(inner.g + (outer.g - inner.g) * t);
                const b = Math.round(inner.b + (outer.b - inner.b) * t);
                
                // Aplica alpha da máscara
                const alpha = Math.round(200 * (revealAlpha / 255));
                
                // Adiciona "ruído de síntese" para pixels parcialmente revelados
                if (revealAlpha < 255 && revealAlpha > 0) {
                    const noise = (Math.random() - 0.5) * 40;
                    renderer.setPixel(px, py, 
                        Math.min(255, Math.max(0, r + noise)),
                        Math.min(255, Math.max(0, g + noise)),
                        Math.min(255, Math.max(0, b + noise)),
                        alpha
                    );
                } else {
                    renderer.setPixel(px, py, r, g, b, alpha);
                }
            }
        }
    }
    
    drawNeonEllipseWithMask(renderer, cx, cy, rx, ry, matSystem) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const alpha = Math.floor(255 * ((matSystem.progress - 0.5) / 0.5));
        
        for (let i = 2; i >= 0; i--) {
            const layerAlpha = i === 0 ? alpha : Math.round(alpha * 0.3 * (1 - i / 3));
            const offset = i * 1.5;
            this.drawEllipseRgba(renderer, cx, cy, rx + offset, ry + offset, r, g, b, layerAlpha);
        }
    }
    
    fillPolygonWithMask(renderer, vertices, matSystem) {
        const top = renderer.hexToRgb(this.secondaryColor);
        const bottom = renderer.hexToRgb(this.primaryColor);
        
        if (vertices.length < 3) return;
        
        let minY = Infinity, maxY = -Infinity;
        vertices.forEach(v => {
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
        });
        
        const height = maxY - minY || 1;
        minY = Math.ceil(minY);
        maxY = Math.floor(maxY);
        
        for (let y = minY; y <= maxY; y++) {
            const t = (y - minY) / height;
            const r = Math.round(top.r + (bottom.r - top.r) * t);
            const g = Math.round(top.g + (bottom.g - top.g) * t);
            const b = Math.round(top.b + (bottom.b - top.b) * t);
            
            const intersections = [];
            
            for (let i = 0; i < vertices.length; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % vertices.length];
                
                if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
                    const x = v1.x + (y - v1.y) / (v2.y - v1.y) * (v2.x - v1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const revealAlpha = matSystem.getRevealAlpha(x, y);
                    if (revealAlpha === 0) continue;
                    
                    const alpha = Math.round(255 * (revealAlpha / 255));
                    
                    if (revealAlpha < 255 && revealAlpha > 0) {
                        const noise = (Math.random() - 0.5) * 40;
                        renderer.setPixel(x, y,
                            Math.min(255, Math.max(0, r + noise)),
                            Math.min(255, Math.max(0, g + noise)),
                            Math.min(255, Math.max(0, b + noise)),
                            alpha
                        );
                    } else {
                        renderer.setPixel(x, y, r, g, b, alpha);
                    }
                }
            }
        }
    }
    
    drawNeonPolygonWithMask(renderer, vertices, matSystem) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const alpha = Math.floor(255 * ((matSystem.progress - 0.5) / 0.5));
        const n = vertices.length;
        
        for (let layer = 2; layer >= 0; layer--) {
            const layerAlpha = layer === 0 ? alpha : Math.round(alpha * 0.4 * (1 - layer / 3));
            
            for (let i = 0; i < n; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % n];
                
                if (layer > 0) {
                    this.drawThickLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, layerAlpha, layer);
                } else {
                    this.drawLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, layerAlpha);
                }
            }
        }
    }
    
    drawFaceWithAlpha(renderer, breathOffset, scaleX, scaleY, alpha) {
        const s = this.scale;
        const cx = this.x;
        const cy = this.y + breathOffset;
        
        // Renderiza face com alpha global
        this.tempFaceAlpha = alpha;
        this.drawEyes(renderer, cx, cy, s);
        this.drawMouth(renderer, cx, cy + 10 * s, s);
        this.drawBrows(renderer, cx, cy, s);
        this.tempFaceAlpha = 1;
    }
    
    drawGlow(renderer) {
        // Usa a cor do material para o glow
        const material = getMaterialById(this.materialId);
        const glowColor = material ? material.palette.glow : this.primaryColor;
        const { r, g, b } = renderer.hexToRgb(glowColor);
        const glowRadius = this.size * this.scale * 1.6;
        
        // Intensidade do glow varia por material
        const intensity = material ? material.render.glowIntensity : 0.5;
        
        // Múltiplas camadas de glow
        for (let layer = 4; layer >= 1; layer--) {
            const radius = glowRadius + layer * 6;
            const alpha = Math.round(25 * intensity * (1 - layer / 5));
            renderer.drawCircleRgba(this.x, this.y, radius, r, g, b, alpha);
        }
    }
    
    drawBody(renderer, breathOffset, scaleX, scaleY) {
        const shape = SHAPES_MAP[this.shapeId];
        if (!shape) return;
        
        const params = shape.getParams(this.size * this.scale);
        const cy = this.y + breathOffset;
        
        // Atualiza o tempo do MaterialRenderer
        materialRenderer.update(16);
        
        if (params.type === 'circle') {
            const rx = params.radius * scaleX / this.scale;
            const ry = params.radius * scaleY / this.scale;
            
            // Gera pontos do círculo como polígono
            const circlePoints = this.generateCirclePoints(this.x, cy, rx, ry, 32);
            
            // Usa o MaterialRenderer para preencher
            materialRenderer.fill(renderer, this.x, cy, circlePoints, this.materialId);
            
            // Borda com material
            materialRenderer.stroke(renderer, circlePoints, this.materialId);
            
        } else if (params.type === 'polygon') {
            // Transforma vértices
            const transformed = params.vertices.map(v => ({
                x: this.x + v.x * scaleX / this.scale,
                y: cy + v.y * scaleY / this.scale
            }));
            
            // Usa o MaterialRenderer para preencher e contornar
            materialRenderer.fill(renderer, this.x, cy, transformed, this.materialId);
            materialRenderer.stroke(renderer, transformed, this.materialId);
        }
    }
    
    /**
     * Gera pontos de um círculo/elipse como polígono
     */
    generateCirclePoints(cx, cy, rx, ry, segments = 32) {
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: cx + Math.cos(angle) * rx,
                y: cy + Math.sin(angle) * ry
            });
        }
        return points;
    }
    
    // Elipse com gradiente radial (usando setPixel)
    fillEllipseGradient(renderer, cx, cy, rx, ry) {
        const inner = renderer.hexToRgb(this.secondaryColor);
        const outer = renderer.hexToRgb(this.primaryColor);
        
        for (let y = -ry; y <= ry; y++) {
            const halfWidth = rx * Math.sqrt(1 - (y * y) / (ry * ry));
            for (let x = -halfWidth; x <= halfWidth; x++) {
                // Distância normalizada do centro
                const dx = x / rx;
                const dy = y / ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const t = Math.min(1, dist);
                
                // Interpola cores
                const r = Math.round(inner.r + (outer.r - inner.r) * t);
                const g = Math.round(inner.g + (outer.g - inner.g) * t);
                const b = Math.round(inner.b + (outer.b - inner.b) * t);
                
                renderer.setPixel(cx + x, cy + y, r, g, b, 200);
            }
        }
    }
    
    // Elipse com efeito neon (múltiplas camadas)
    drawNeonEllipse(renderer, cx, cy, rx, ry) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        
        // Camadas de glow
        for (let i = 3; i >= 0; i--) {
            const alpha = i === 0 ? 255 : Math.round(80 * (1 - i / 4));
            const offset = i * 1.5;
            this.drawEllipseRgba(renderer, cx, cy, rx + offset, ry + offset, r, g, b, alpha);
        }
    }
    
    // Desenha elipse com RGBA (Midpoint Algorithm)
    drawEllipseRgba(renderer, cx, cy, rx, ry, r, g, b, a) {
        let x = 0;
        let y = Math.round(ry);
        
        let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
        let dx = 2 * ry * ry * x;
        let dy = 2 * rx * rx * y;
        
        const plot = (px, py) => renderer.setPixelBlend(px, py, r, g, b, a);
        
        // Região 1
        while (dx < dy) {
            plot(cx + x, cy + y);
            plot(cx - x, cy + y);
            plot(cx + x, cy - y);
            plot(cx - x, cy - y);
            
            if (d1 < 0) {
                x++;
                dx += 2 * ry * ry;
                d1 += dx + ry * ry;
            } else {
                x++;
                y--;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d1 += dx - dy + ry * ry;
            }
        }
        
        // Região 2
        let d2 = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry;
        
        while (y >= 0) {
            plot(cx + x, cy + y);
            plot(cx - x, cy + y);
            plot(cx + x, cy - y);
            plot(cx - x, cy - y);
            
            if (d2 > 0) {
                y--;
                dy -= 2 * rx * rx;
                d2 += rx * rx - dy;
            } else {
                y--;
                x++;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d2 += dx - dy + rx * rx;
            }
        }
    }
    
    // Polígono com contorno neon
    drawNeonPolygon(renderer, vertices) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const n = vertices.length;
        
        // Múltiplas camadas para efeito glow
        for (let layer = 3; layer >= 0; layer--) {
            const alpha = layer === 0 ? 255 : Math.round(60 * (1 - layer / 4));
            
            for (let i = 0; i < n; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % n];
                
                // Linha com thickness para glow
                if (layer > 0) {
                    this.drawThickLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha, layer);
                } else {
                    this.drawLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha);
                }
            }
        }
    }
    
    // Linha com RGBA (Bresenham)
    drawLineRgba(renderer, x0, y0, x1, y1, r, g, b, a) {
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            renderer.setPixelBlend(x0, y0, r, g, b, a);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    // Linha com espessura
    drawThickLineRgba(renderer, x0, y0, x1, y1, r, g, b, a, thickness) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        
        for (let t = -thickness; t <= thickness; t++) {
            const ox = nx * t * 0.5;
            const oy = ny * t * 0.5;
            this.drawLineRgba(renderer, x0 + ox, y0 + oy, x1 + ox, y1 + oy, r, g, b, a);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FACE RENDERING
    // ═══════════════════════════════════════════════════════════════════
    
    drawFace(renderer, breathOffset, scaleX, scaleY) {
        const s = this.scale;
        const cx = this.x;
        const cy = this.y + breathOffset;
        
        // Tremor (quando com medo/frio)
        const tremorX = (Math.random() - 0.5) * this.faceParams.tremor * 3;
        const tremorY = (Math.random() - 0.5) * this.faceParams.tremor * 3;
        
        // Olhos
        this.drawEyes(renderer, cx + tremorX, cy + tremorY, s);
        
        // Boca
        this.drawMouth(renderer, cx + tremorX, cy + tremorY + 10 * s, s);
        
        // Sobrancelhas
        this.drawBrows(renderer, cx + tremorX, cy + tremorY, s);
        
        // Extras (blush quando feliz)
        if (this.expressionState.mood === 'happy' || this.isBeingPetted) {
            this.drawBlush(renderer, cx, cy, s);
        }
    }
    
    drawEyes(renderer, cx, cy, s) {
        const eyeY = cy - 6 * s;
        const eyeSpacing = 10 * s;
        
        // Focus offset (para onde está olhando)
        const fox = this.faceParams.focusOffset.x;
        const foy = this.faceParams.focusOffset.y;
        
        if (this.isBlinking) {
            // Olhos fechados - linhas horizontais
            const lineY = eyeY;
            renderer.drawLine(cx - eyeSpacing - 4 * s, lineY, cx - eyeSpacing + 4 * s, lineY, this.secondaryColor);
            renderer.drawLine(cx + eyeSpacing - 4 * s, lineY, cx + eyeSpacing + 4 * s, lineY, this.secondaryColor);
            return;
        }
        
        const openness = this.faceParams.eyeOpenness;
        const pupilSize = this.faceParams.pupilSize;
        
        switch (this.eyeType) {
            case 'circle':
                this.drawCircleEyes(renderer, cx, eyeY, eyeSpacing, s, openness, pupilSize, fox, foy);
                break;
            case 'dot':
                this.drawDotEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy);
                break;
            case 'pixel':
                this.drawPixelEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy);
                break;
            case 'slit':
                this.drawSlitEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy);
                break;
            default:
                this.drawCircleEyes(renderer, cx, eyeY, eyeSpacing, s, openness, pupilSize, fox, foy);
        }
    }
    
    drawCircleEyes(renderer, cx, cy, spacing, s, openness, pupilSize, fox, foy) {
        const eyeRadius = 5 * s * openness;
        const pupilR = 2 * s * pupilSize;
        const irisR = 3.5 * s;
        
        // Posições dos olhos
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Esclera (branco)
        renderer.fillCircle(leftX, cy, eyeRadius, '#ffffff');
        renderer.fillCircle(rightX, cy, eyeRadius, '#ffffff');
        
        // Contorno
        renderer.drawCircle(leftX, cy, eyeRadius, this.secondaryColor);
        renderer.drawCircle(rightX, cy, eyeRadius, this.secondaryColor);
        
        // Íris (segue o foco)
        const irisOffsetX = fox * 1.5;
        const irisOffsetY = foy * 1.5;
        renderer.fillCircle(leftX + irisOffsetX, cy + irisOffsetY, irisR, this.secondaryColor);
        renderer.fillCircle(rightX + irisOffsetX, cy + irisOffsetY, irisR, this.secondaryColor);
        
        // Pupila
        renderer.fillCircle(leftX + irisOffsetX, cy + irisOffsetY, pupilR, '#000000');
        renderer.fillCircle(rightX + irisOffsetX, cy + irisOffsetY, pupilR, '#000000');
        
        // Brilho
        const highlightR = pupilR * 0.5;
        renderer.fillCircle(leftX - 1.5 * s + irisOffsetX * 0.3, cy - 1.5 * s + irisOffsetY * 0.3, highlightR, '#ffffff');
        renderer.fillCircle(rightX - 1.5 * s + irisOffsetX * 0.3, cy - 1.5 * s + irisOffsetY * 0.3, highlightR, '#ffffff');
    }
    
    drawDotEyes(renderer, cx, cy, spacing, s, openness, fox, foy) {
        const dotRadius = 4 * s * openness;
        
        const leftX = cx - spacing + fox;
        const rightX = cx + spacing + fox;
        const eyeY = cy + foy;
        
        // Sombra
        renderer.fillCircle(leftX + 1, eyeY + 1, dotRadius, '#000000');
        renderer.fillCircle(rightX + 1, eyeY + 1, dotRadius, '#000000');
        
        // Ponto principal
        renderer.fillCircle(leftX, eyeY, dotRadius, this.secondaryColor);
        renderer.fillCircle(rightX, eyeY, dotRadius, this.secondaryColor);
        
        // Brilho
        renderer.fillCircle(leftX - 1.5 * s, eyeY - 1.5 * s, dotRadius * 0.35, '#ffffff');
        renderer.fillCircle(rightX - 1.5 * s, eyeY - 1.5 * s, dotRadius * 0.35, '#ffffff');
    }
    
    drawPixelEyes(renderer, cx, cy, spacing, s, openness, fox, foy) {
        const eyeW = 8 * s;
        const eyeH = 6 * s * openness;
        
        const leftX = cx - spacing - eyeW / 2;
        const rightX = cx + spacing - eyeW / 2;
        const eyeY = cy - eyeH / 2;
        
        // Fundo branco
        renderer.fillRect(leftX, eyeY, eyeW, eyeH, '#ffffff');
        renderer.fillRect(rightX, eyeY, eyeW, eyeH, '#ffffff');
        
        // Contorno
        renderer.drawRect(leftX, eyeY, eyeW, eyeH, this.secondaryColor);
        renderer.drawRect(rightX, eyeY, eyeW, eyeH, this.secondaryColor);
        
        // Pupila pixel
        const pixelSize = 3 * s;
        const pupilX = fox * 1.5;
        const pupilY = foy * 1.5;
        renderer.fillRect(leftX + eyeW / 2 - pixelSize / 2 + pupilX, cy - pixelSize / 2 + pupilY, pixelSize, pixelSize, this.secondaryColor);
        renderer.fillRect(rightX + eyeW / 2 - pixelSize / 2 + pupilX, cy - pixelSize / 2 + pupilY, pixelSize, pixelSize, this.secondaryColor);
        
        // Highlight
        renderer.fillRect(leftX + 1, eyeY + 1, 2 * s, 2 * s, '#ffffff');
        renderer.fillRect(rightX + 1, eyeY + 1, 2 * s, 2 * s, '#ffffff');
    }
    
    drawSlitEyes(renderer, cx, cy, spacing, s, openness, fox, foy) {
        const eyeW = 5 * s;
        const eyeH = 7 * s * openness;
        
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Fundo do olho (elipse colorida)
        renderer.fillEllipse(leftX, cy, eyeW, eyeH, this.secondaryColor);
        renderer.fillEllipse(rightX, cy, eyeW, eyeH, this.secondaryColor);
        
        // Fenda vertical (pupila)
        const slitW = 2;
        const slitH = eyeH * 0.9;
        renderer.fillRect(leftX - slitW / 2 + fox, cy - slitH / 2 + foy, slitW, slitH, '#000000');
        renderer.fillRect(rightX - slitW / 2 + fox, cy - slitH / 2 + foy, slitW, slitH, '#000000');
        
        // Brilho
        renderer.fillCircle(leftX - 2 * s, cy - 2 * s, 1.5 * s, '#ffffff');
        renderer.fillCircle(rightX - 2 * s, cy - 2 * s, 1.5 * s, '#ffffff');
    }
    
    drawMouth(renderer, cx, cy, s) {
        const curve = this.faceParams.mouthCurve;
        
        switch (this.mouthType) {
            case 'simple':
                this.drawSimpleMouth(renderer, cx, cy, s, curve);
                break;
            case 'cat':
                this.drawCatMouth(renderer, cx, cy, s, curve);
                break;
            case 'pixel':
                this.drawPixelMouth(renderer, cx, cy, s, curve);
                break;
            case 'kawaii':
                this.drawKawaiiMouth(renderer, cx, cy, s, curve);
                break;
            default:
                this.drawSimpleMouth(renderer, cx, cy, s, curve);
        }
    }
    
    drawSimpleMouth(renderer, cx, cy, s, curve) {
        const mouthWidth = 8 * s;
        const curveHeight = curve * 5 * s;
        
        // Desenha arco usando Bresenham para vários segmentos
        const segments = 10;
        let lastX = cx - mouthWidth / 2;
        let lastY = cy;
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = cx - mouthWidth / 2 + mouthWidth * t;
            // Parábola: y = 4 * curve * t * (1 - t)
            const y = cy + curveHeight * 4 * t * (1 - t);
            
            renderer.drawLine(lastX, lastY, x, y, this.secondaryColor);
            lastX = x;
            lastY = y;
        }
    }
    
    drawCatMouth(renderer, cx, cy, s, curve) {
        const w = 6 * s;
        const h = 3 * s * Math.abs(curve);
        const dir = curve >= 0 ? 1 : -1;
        
        // Formato "w" ou "m"
        renderer.drawLine(cx - w, cy, cx - w * 0.3, cy + h * dir, this.secondaryColor);
        renderer.drawLine(cx - w * 0.3, cy + h * dir, cx, cy - h * 0.5 * dir, this.secondaryColor);
        renderer.drawLine(cx, cy - h * 0.5 * dir, cx + w * 0.3, cy + h * dir, this.secondaryColor);
        renderer.drawLine(cx + w * 0.3, cy + h * dir, cx + w, cy, this.secondaryColor);
    }
    
    drawPixelMouth(renderer, cx, cy, s, curve) {
        const mouthW = 10 * s;
        const mouthH = 3 * s;
        
        if (curve > 0.4) {
            // Boca aberta feliz
            renderer.fillRect(cx - mouthW / 2, cy - mouthH / 2, mouthW, mouthH, '#000000');
            renderer.drawRect(cx - mouthW / 2, cy - mouthH / 2, mouthW, mouthH, this.secondaryColor);
        } else if (curve < -0.2) {
            // Boca triste
            renderer.drawLine(cx - mouthW / 2, cy + mouthH, cx + mouthW / 2, cy + mouthH, this.secondaryColor);
        } else {
            // Neutro
            renderer.drawLine(cx - mouthW / 2, cy, cx + mouthW / 2, cy, this.secondaryColor);
        }
    }
    
    drawKawaiiMouth(renderer, cx, cy, s, curve) {
        const radius = 3 * s * Math.abs(curve);
        
        if (curve > 0) {
            // Sorriso pequeno (semicírculo inferior)
            for (let angle = 0; angle <= Math.PI; angle += 0.1) {
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius * 0.5;
                renderer.setPixelHex(x, y, this.secondaryColor);
            }
        } else if (curve < -0.1) {
            // Tristeza (semicírculo superior)
            for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.1) {
                const x = cx + Math.cos(angle) * radius;
                const y = cy + 2 * s + Math.sin(angle) * radius * 0.5;
                renderer.setPixelHex(x, y, this.secondaryColor);
            }
        } else {
            // Boquinha fechada
            renderer.setPixelHex(cx - 1, cy, this.secondaryColor);
            renderer.setPixelHex(cx, cy, this.secondaryColor);
            renderer.setPixelHex(cx + 1, cy, this.secondaryColor);
        }
    }
    
    drawBrows(renderer, cx, cy, s) {
        const browY = cy - 14 * s;
        const browAngle = this.faceParams.browAngle;
        const spacing = 10 * s;
        const browLen = 6 * s;
        
        // Sobrancelha esquerda
        const leftStartY = browY - browAngle * 3 * s;
        const leftEndY = browY + browAngle * 3 * s;
        renderer.drawLine(
            cx - spacing - browLen / 2, leftStartY,
            cx - spacing + browLen / 2, leftEndY,
            this.secondaryColor
        );
        
        // Sobrancelha direita (espelhada)
        const rightStartY = browY + browAngle * 3 * s;
        const rightEndY = browY - browAngle * 3 * s;
        renderer.drawLine(
            cx + spacing - browLen / 2, rightStartY,
            cx + spacing + browLen / 2, rightEndY,
            this.secondaryColor
        );
    }
    
    drawBlush(renderer, cx, cy, s) {
        // Bochechas rosadas quando feliz
        const blushY = cy + 2 * s;
        const blushSpacing = 14 * s;
        const { r, g, b } = renderer.hexToRgb('#ff6b6b');
        
        // Elipses semi-transparentes
        for (let y = -2; y <= 2; y++) {
            for (let x = -4; x <= 4; x++) {
                const dist = Math.sqrt(x * x / 16 + y * y / 4);
                if (dist <= 1) {
                    const alpha = Math.round(40 * (1 - dist));
                    renderer.setPixelBlend(cx - blushSpacing + x * s, blushY + y * s, r, g, b, alpha);
                    renderer.setPixelBlend(cx + blushSpacing + x * s, blushY + y * s, r, g, b, alpha);
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERAÇÕES DO TAMAGOTCHI
    // ═══════════════════════════════════════════════════════════════════
    
    feed(amount = 25) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.happiness = Math.min(100, this.happiness + 5);
        
        // Feedback visual
        this.expressionState.action = 'eating';
        this.expressionState.actionTimer = Date.now() + 1500;
        
        // Cooldown para não decair imediatamente
        this.feedCooldown = 2000;
        
        // Squash de alegria
        this.squash(1.2, 0.8);
    }
    
    pet() {
        this.happiness = Math.min(100, this.happiness + 10);
        this.isBeingPetted = true;
        this.lastPetTime = Date.now();
        
        this.expressionState.action = 'love';
        this.expressionState.actionTimer = Date.now() + 1000;
        
        this.squash(0.9, 1.1);
        
        setTimeout(() => {
            this.isBeingPetted = false;
        }, 500);
    }
    
    play() {
        this.happiness = Math.min(100, this.happiness + 15);
        this.energy = Math.max(0, this.energy - 10);
        
        this.expressionState.action = 'happy';
        this.expressionState.actionTimer = Date.now() + 2000;
    }
    
    sleep() {
        this.energy = Math.min(100, this.energy + 30);
        this.expressionState.action = null;
        this.expressionState.mood = 'neutral';
    }
    
    squash(sx, sy) {
        this.squashX = sx;
        this.squashY = sy;
    }
    
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    lookAt(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Limita o quanto os olhos podem se mover
        const maxMove = 3;
        this.faceParams.focusOffset.x = (dx / dist) * Math.min(maxMove, dist / 30);
        this.faceParams.focusOffset.y = (dy / dist) * Math.min(maxMove, dist / 30);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GESTOS MOBILE
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Verifica se um ponto está dentro do pet (hit test)
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const radius = this.size * this.scale;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    /**
     * Aplica rotação por gesto de arrastar
     * @param {number} deltaAngle - Mudança de ângulo em radianos
     */
    applyRotation(deltaAngle) {
        this.rotation += deltaAngle;
        
        // Normaliza para 0-2PI
        while (this.rotation < 0) this.rotation += Math.PI * 2;
        while (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
    }
    
    /**
     * Calcula ângulo de rotação baseado em posição de arrasto
     */
    getRotationFromDrag(startX, startY, currentX, currentY) {
        const startAngle = Math.atan2(startY - this.y, startX - this.x);
        const currentAngle = Math.atan2(currentY - this.y, currentX - this.x);
        return currentAngle - startAngle;
    }
    
    /**
     * Petting por scrubbing (movimento rápido repetido)
     * @param {number} intensity - Intensidade do scrub (0-1)
     */
    onScrub(intensity) {
        // Quanto maior a intensidade, mais feliz
        const happinessGain = Math.floor(5 + intensity * 15);
        this.happiness = Math.min(100, this.happiness + happinessGain);
        
        this.isBeingPetted = true;
        this.lastPetTime = Date.now();
        
        // Expressão de alegria
        this.expressionState.action = 'love';
        this.expressionState.actionTimer = Date.now() + 500;
        
        // Squash proporcional à intensidade
        const squashAmount = 0.85 + intensity * 0.1;
        this.squash(squashAmount, 2 - squashAmount);
        
        // Reset após um tempo
        setTimeout(() => {
            this.isBeingPetted = false;
        }, 300);
    }
    
    /**
     * Reação a tap/toque único
     */
    onTap() {
        // Pequena reação de atenção
        this.faceTargets.eyeOpenness = 1.3;
        this.squash(0.95, 1.05);
        
        // Vira para "olhar" o toque
        this.expressionState.action = 'alert';
        this.expressionState.actionTimer = Date.now() + 500;
    }
    
    /**
     * Reação a double tap
     */
    onDoubleTap() {
        // Pulo de alegria
        this.squash(0.7, 1.4);
        this.vy = -3;
        
        this.happiness = Math.min(100, this.happiness + 5);
        this.expressionState.action = 'happy';
        this.expressionState.actionTimer = Date.now() + 800;
    }
    
    /**
     * Reação a long press
     */
    onLongPress() {
        // Pet fica sonolento/relaxado
        this.faceTargets.eyeOpenness = 0.5;
        this.expressionState.mood = 'neutral';
        this.squash(1.1, 0.9);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SERIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    toJSON() {
        return {
            shapeId: this.shapeId,
            eyeType: this.eyeType,
            mouthType: this.mouthType,
            materialId: this.materialId,
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            hunger: this.hunger,
            happiness: this.happiness,
            energy: this.energy
        };
    }
    
    static fromJSON(data) {
        return new GeoPet(data);
    }
}
