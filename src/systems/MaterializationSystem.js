// ═══════════════════════════════════════════════════════════════════
// MATERIALIZATION SYSTEM - Efeito de Rasterização Cyber-Alquímica
// O Golem "nasce" pixel a pixel, revelando o algoritmo de scanline
// ═══════════════════════════════════════════════════════════════════

export default class MaterializationSystem {
    constructor() {
        // Estado da materialização
        this.isActive = false;
        this.progress = 0;          // 0-1 progresso total
        this.currentScanline = 0;   // Linha atual sendo renderizada
        this.pixelsRevealed = 0;    // Pixels já revelados
        this.totalPixels = 0;       // Total de pixels do pet
        
        // Configurações
        this.mode = 'scanline';     // 'scanline', 'radial', 'glitch', 'spiral'
        this.speed = 3;             // Scanlines por frame
        this.glitchIntensity = 0.3;
        
        // Buffer de pixels do pet (para revelar gradualmente)
        this.petPixelBuffer = [];
        this.revealMask = null;     // Máscara de revelação
        
        // Efeitos visuais
        this.scanlineGlow = [];     // Brilho na linha atual
        this.particleTrail = [];    // Partículas de "síntese"
        this.runeSymbols = [];      // Símbolos alquímicos
        
        // Bounds do pet
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        
        // Callbacks
        this.onComplete = null;
        this.onProgress = null;
        
        // Som
        this.audioCtx = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INICIAR MATERIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    start(pet, renderer, mode = 'scanline') {
        this.isActive = true;
        this.progress = 0;
        this.mode = mode;
        this.pet = pet;
        this.renderer = renderer;
        
        // Calcula bounds do pet
        const size = pet.size * pet.scale;
        this.bounds = {
            minX: Math.floor(pet.x - size * 1.2),
            maxX: Math.ceil(pet.x + size * 1.2),
            minY: Math.floor(pet.y - size * 1.2),
            maxY: Math.ceil(pet.y + size * 1.2)
        };
        
        this.currentScanline = this.bounds.minY;
        
        // Cria máscara de revelação
        const width = this.bounds.maxX - this.bounds.minX;
        const height = this.bounds.maxY - this.bounds.minY;
        this.revealMask = new Uint8Array(width * height);
        this.totalPixels = width * height;
        
        // Inicializa partículas alquímicas
        this.initAlchemyParticles();
        
        // Inicializa runas
        this.initRuneSymbols();
        
        // Inicia som de síntese
        this.startSynthesisSound();
        
        console.log(`🔮 Materialização iniciada: modo ${mode}`);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ATUALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        const dt = deltaTime / 1000;
        
        switch (this.mode) {
            case 'scanline':
                this.updateScanline(dt);
                break;
            case 'radial':
                this.updateRadial(dt);
                break;
            case 'glitch':
                this.updateGlitch(dt);
                break;
            case 'spiral':
                this.updateSpiral(dt);
                break;
        }
        
        // Atualiza partículas
        this.updateParticles(dt);
        
        // Atualiza runas
        this.updateRunes(dt);
        
        // Atualiza som
        this.updateSound();
        
        // Callback de progresso
        if (this.onProgress) {
            this.onProgress(this.progress);
        }
        
        // Verifica conclusão
        if (this.progress >= 1) {
            this.complete();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MODO SCANLINE - Linha por linha (CRT style)
    // ═══════════════════════════════════════════════════════════════════
    
    updateScanline(dt) {
        const linesToReveal = Math.ceil(this.speed * (1 + Math.random() * 0.5));
        
        for (let i = 0; i < linesToReveal && this.currentScanline <= this.bounds.maxY; i++) {
            // Revela toda a linha na máscara
            const y = this.currentScanline;
            const width = this.bounds.maxX - this.bounds.minX;
            const yOffset = (y - this.bounds.minY) * width;
            
            // Efeito de "impressão" com variação
            for (let x = this.bounds.minX; x < this.bounds.maxX; x++) {
                const xOffset = x - this.bounds.minX;
                const idx = yOffset + xOffset;
                
                // Chance de glitch/skip
                if (Math.random() > this.glitchIntensity) {
                    this.revealMask[idx] = 255;
                } else {
                    // Pixel glitchado - será revelado em frames seguintes
                    this.revealMask[idx] = Math.floor(Math.random() * 200);
                }
            }
            
            // Adiciona glow na linha atual
            this.scanlineGlow.push({
                y: y,
                intensity: 1,
                decay: 0.85
            });
            
            // Spawn partículas na linha
            if (Math.random() > 0.7) {
                this.spawnScanlineParticle(y);
            }
            
            this.currentScanline++;
        }
        
        // Calcula progresso
        this.progress = (this.currentScanline - this.bounds.minY) / 
                        (this.bounds.maxY - this.bounds.minY);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MODO RADIAL - Do centro para fora
    // ═══════════════════════════════════════════════════════════════════
    
    updateRadial(dt) {
        const maxRadius = Math.max(
            this.bounds.maxX - this.pet.x,
            this.pet.x - this.bounds.minX,
            this.bounds.maxY - this.pet.y,
            this.pet.y - this.bounds.minY
        );
        
        const currentRadius = this.progress * maxRadius;
        const nextRadius = currentRadius + this.speed * 2;
        
        const width = this.bounds.maxX - this.bounds.minX;
        const cx = this.pet.x;
        const cy = this.pet.y;
        
        // Revela pixels dentro do novo raio
        for (let y = this.bounds.minY; y < this.bounds.maxY; y++) {
            for (let x = this.bounds.minX; x < this.bounds.maxX; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist >= currentRadius && dist < nextRadius) {
                    const idx = (y - this.bounds.minY) * width + (x - this.bounds.minX);
                    
                    // Efeito de "onda" com glitch
                    if (Math.random() > this.glitchIntensity * 0.5) {
                        this.revealMask[idx] = 255;
                    }
                }
            }
        }
        
        this.progress = nextRadius / maxRadius;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MODO GLITCH - Blocos aleatórios (cyber style)
    // ═══════════════════════════════════════════════════════════════════
    
    updateGlitch(dt) {
        const blocksPerFrame = 5 + Math.floor(Math.random() * 5);
        const blockSize = 8 + Math.floor(Math.random() * 8);
        
        const width = this.bounds.maxX - this.bounds.minX;
        const height = this.bounds.maxY - this.bounds.minY;
        
        for (let b = 0; b < blocksPerFrame; b++) {
            // Bloco aleatório
            const bx = Math.floor(Math.random() * (width / blockSize)) * blockSize;
            const by = Math.floor(Math.random() * (height / blockSize)) * blockSize;
            
            // Revela o bloco
            for (let y = by; y < by + blockSize && y < height; y++) {
                for (let x = bx; x < bx + blockSize && x < width; x++) {
                    const idx = y * width + x;
                    if (this.revealMask[idx] < 255) {
                        this.revealMask[idx] = 255;
                        this.pixelsRevealed++;
                    }
                }
            }
            
            // Partícula no bloco
            this.spawnGlitchParticle(
                this.bounds.minX + bx + blockSize / 2,
                this.bounds.minY + by + blockSize / 2
            );
        }
        
        this.progress = this.pixelsRevealed / this.totalPixels;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MODO ESPIRAL - Alquimia mística
    // ═══════════════════════════════════════════════════════════════════
    
    updateSpiral(dt) {
        const width = this.bounds.maxX - this.bounds.minX;
        const maxRadius = Math.max(width, this.bounds.maxY - this.bounds.minY) / 2;
        
        // Parâmetros da espiral
        const angle = this.progress * Math.PI * 8; // 4 voltas completas
        const radius = this.progress * maxRadius;
        
        const cx = this.pet.x;
        const cy = this.pet.y;
        
        // Pontos ao longo da espiral
        const pointsPerFrame = 20;
        const angleStep = 0.1;
        
        for (let i = 0; i < pointsPerFrame; i++) {
            const a = angle + i * angleStep;
            const r = (this.progress + i * 0.001) * maxRadius;
            
            const px = Math.round(cx + Math.cos(a) * r);
            const py = Math.round(cy + Math.sin(a) * r);
            
            // Revela área ao redor do ponto
            const brushSize = 3;
            for (let dy = -brushSize; dy <= brushSize; dy++) {
                for (let dx = -brushSize; dx <= brushSize; dx++) {
                    const x = px + dx;
                    const y = py + dy;
                    
                    if (x >= this.bounds.minX && x < this.bounds.maxX &&
                        y >= this.bounds.minY && y < this.bounds.maxY) {
                        const idx = (y - this.bounds.minY) * width + (x - this.bounds.minX);
                        if (this.revealMask[idx] < 255) {
                            this.revealMask[idx] = 255;
                            this.pixelsRevealed++;
                        }
                    }
                }
            }
        }
        
        this.progress += 0.01 * this.speed;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO (com máscara de revelação)
    // ═══════════════════════════════════════════════════════════════════
    
    render(renderer) {
        if (!this.isActive) return;
        
        // Renderiza efeitos de fundo (círculo alquímico)
        this.renderAlchemyCircle(renderer);
        
        // Renderiza runas
        this.renderRunes(renderer);
        
        // Renderiza scanline glow
        this.renderScanlineGlow(renderer);
        
        // Renderiza partículas
        this.renderParticles(renderer);
    }
    
    // Aplica máscara ao pet (chamado após renderizar o pet)
    applyMask(renderer) {
        if (!this.isActive || !this.revealMask) return;
        
        const width = this.bounds.maxX - this.bounds.minX;
        
        // Aplica máscara invertida (esconde pixels não revelados)
        for (let y = this.bounds.minY; y < this.bounds.maxY; y++) {
            for (let x = this.bounds.minX; x < this.bounds.maxX; x++) {
                const idx = (y - this.bounds.minY) * width + (x - this.bounds.minX);
                const reveal = this.revealMask[idx];
                
                if (reveal < 255) {
                    // Pixel não totalmente revelado
                    // Adiciona efeito de "ruído de síntese"
                    if (reveal === 0) {
                        // Totalmente escondido - pixel preto com noise
                        if (Math.random() > 0.95) {
                            // Ocasionalmente mostra um flash do pixel
                            const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
                            renderer.setPixel(x, y, r, g, b, 50);
                        }
                    } else {
                        // Parcialmente revelado - glitch
                        const noise = Math.random() * 50;
                        const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
                        renderer.setPixel(x, y, 
                            Math.min(255, r + noise),
                            Math.min(255, g + noise),
                            Math.min(255, b + noise),
                            reveal
                        );
                    }
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CÍRCULO ALQUÍMICO DE FUNDO
    // ═══════════════════════════════════════════════════════════════════
    
    renderAlchemyCircle(renderer) {
        const cx = this.pet.x;
        const cy = this.pet.y;
        const maxRadius = this.pet.size * this.pet.scale * 2;
        const radius = maxRadius * Math.min(1, this.progress * 1.5);
        
        // Cor baseada no pet
        const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
        
        // Círculo externo pulsante
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        const alpha = Math.floor(60 * pulse * (1 - this.progress));
        
        // Desenha círculo com algoritmo Midpoint
        this.drawCircleRgba(renderer, cx, cy, radius, r, g, b, alpha);
        
        // Círculo interno
        if (radius > 20) {
            this.drawCircleRgba(renderer, cx, cy, radius * 0.7, r, g, b, alpha * 0.5);
        }
        
        // Linhas de "transmutação" (cruz alquímica)
        if (this.progress < 0.8) {
            const lineAlpha = Math.floor(40 * (1 - this.progress));
            
            // Linha vertical
            for (let y = cy - radius; y <= cy + radius; y++) {
                if (Math.abs(y - cy) % 3 === 0) { // Tracejado
                    renderer.setPixelBlend(cx, y, r, g, b, lineAlpha);
                }
            }
            
            // Linha horizontal
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (Math.abs(x - cx) % 3 === 0) {
                    renderer.setPixelBlend(x, cy, r, g, b, lineAlpha);
                }
            }
            
            // Linhas diagonais
            for (let i = -radius; i <= radius; i++) {
                if (Math.abs(i) % 4 === 0) {
                    renderer.setPixelBlend(cx + i, cy + i, r, g, b, lineAlpha * 0.5);
                    renderer.setPixelBlend(cx + i, cy - i, r, g, b, lineAlpha * 0.5);
                }
            }
        }
    }
    
    drawCircleRgba(renderer, cx, cy, radius, r, g, b, a) {
        let x = 0;
        let y = Math.round(radius);
        let d = 1 - radius;
        
        while (x <= y) {
            renderer.setPixelBlend(cx + x, cy + y, r, g, b, a);
            renderer.setPixelBlend(cx - x, cy + y, r, g, b, a);
            renderer.setPixelBlend(cx + x, cy - y, r, g, b, a);
            renderer.setPixelBlend(cx - x, cy - y, r, g, b, a);
            renderer.setPixelBlend(cx + y, cy + x, r, g, b, a);
            renderer.setPixelBlend(cx - y, cy + x, r, g, b, a);
            renderer.setPixelBlend(cx + y, cy - x, r, g, b, a);
            renderer.setPixelBlend(cx - y, cy - x, r, g, b, a);
            
            if (d < 0) {
                d += 2 * x + 3;
            } else {
                d += 2 * (x - y) + 5;
                y--;
            }
            x++;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SCANLINE GLOW
    // ═══════════════════════════════════════════════════════════════════
    
    renderScanlineGlow(renderer) {
        const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
        
        this.scanlineGlow = this.scanlineGlow.filter(glow => {
            const alpha = Math.floor(glow.intensity * 150);
            
            // Linha brilhante
            for (let x = this.bounds.minX; x < this.bounds.maxX; x++) {
                // Efeito de onda
                const wave = Math.sin(x * 0.3 + Date.now() * 0.01) * 0.3 + 0.7;
                renderer.setPixelBlend(x, glow.y, r, g, b, Math.floor(alpha * wave));
                
                // Glow acima e abaixo
                if (alpha > 50) {
                    renderer.setPixelBlend(x, glow.y - 1, r, g, b, Math.floor(alpha * 0.3));
                    renderer.setPixelBlend(x, glow.y + 1, r, g, b, Math.floor(alpha * 0.3));
                }
            }
            
            glow.intensity *= glow.decay;
            return glow.intensity > 0.05;
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PARTÍCULAS ALQUÍMICAS
    // ═══════════════════════════════════════════════════════════════════
    
    initAlchemyParticles() {
        this.particleTrail = [];
    }
    
    spawnScanlineParticle(y) {
        const x = this.bounds.minX + Math.random() * (this.bounds.maxX - this.bounds.minX);
        
        this.particleTrail.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 1 + Math.random() * 2,
            type: 'spark'
        });
    }
    
    spawnGlitchParticle(x, y) {
        this.particleTrail.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            decay: 0.05,
            size: 2 + Math.random() * 3,
            type: 'glitch'
        });
    }
    
    updateParticles(dt) {
        this.particleTrail = this.particleTrail.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravidade leve
            p.life -= p.decay;
            return p.life > 0;
        });
    }
    
    renderParticles(renderer) {
        const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
        const { r: r2, g: g2, b: b2 } = renderer.hexToRgb(this.pet.secondaryColor);
        
        this.particleTrail.forEach(p => {
            const alpha = Math.floor(p.life * 255);
            const size = Math.ceil(p.size * p.life);
            
            if (p.type === 'spark') {
                // Partícula de faísca (cor primária)
                for (let dy = -size; dy <= size; dy++) {
                    for (let dx = -size; dx <= size; dx++) {
                        if (dx * dx + dy * dy <= size * size) {
                            renderer.setPixelBlend(
                                Math.round(p.x + dx),
                                Math.round(p.y + dy),
                                r, g, b, alpha
                            );
                        }
                    }
                }
            } else if (p.type === 'glitch') {
                // Partícula glitch (quadrada, cor secundária)
                for (let dy = -size; dy <= size; dy++) {
                    for (let dx = -size; dx <= size; dx++) {
                        // Adiciona noise
                        const noise = Math.random() > 0.3;
                        if (noise) {
                            renderer.setPixelBlend(
                                Math.round(p.x + dx),
                                Math.round(p.y + dy),
                                r2, g2, b2, alpha
                            );
                        }
                    }
                }
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SÍMBOLOS RÚNICOS / ALQUÍMICOS
    // ═══════════════════════════════════════════════════════════════════
    
    initRuneSymbols() {
        this.runeSymbols = [];
        
        // Cria runas ao redor do pet
        const numRunes = 6;
        const radius = this.pet.size * this.pet.scale * 2.5;
        
        for (let i = 0; i < numRunes; i++) {
            const angle = (i / numRunes) * Math.PI * 2;
            this.runeSymbols.push({
                x: this.pet.x + Math.cos(angle) * radius,
                y: this.pet.y + Math.sin(angle) * radius,
                angle: angle,
                symbol: this.getRandomRuneSymbol(),
                alpha: 0,
                targetAlpha: 200,
                rotation: Math.random() * Math.PI * 2,
                scale: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    getRandomRuneSymbol() {
        // Símbolos alquímicos simplificados (padrões de pixels)
        const symbols = [
            'circle',    // ○ - Perfeição
            'triangle',  // △ - Fogo/Mudança  
            'square',    // □ - Terra/Estabilidade
            'cross',     // + - União
            'star',      // ☆ - Quintessência
            'spiral'     // ◎ - Transformação
        ];
        return symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    updateRunes(dt) {
        this.runeSymbols.forEach((rune, i) => {
            // Aparece gradualmente baseado no progresso
            const revealThreshold = i / this.runeSymbols.length;
            if (this.progress > revealThreshold) {
                rune.alpha = Math.min(rune.alpha + 5, rune.targetAlpha * (1 - this.progress));
            }
            
            // Rotação lenta
            rune.rotation += 0.01;
            
            // Flutua levemente
            rune.y += Math.sin(Date.now() * 0.002 + i) * 0.1;
        });
    }
    
    renderRunes(renderer) {
        const { r, g, b } = renderer.hexToRgb(this.pet.primaryColor);
        
        this.runeSymbols.forEach(rune => {
            if (rune.alpha < 10) return;
            
            const size = 8 * rune.scale;
            const cx = Math.round(rune.x);
            const cy = Math.round(rune.y);
            const alpha = Math.floor(rune.alpha);
            
            switch (rune.symbol) {
                case 'circle':
                    this.drawCircleRgba(renderer, cx, cy, size, r, g, b, alpha);
                    break;
                    
                case 'triangle':
                    // Triângulo com 3 linhas
                    const tri = [
                        { x: cx, y: cy - size },
                        { x: cx - size, y: cy + size * 0.7 },
                        { x: cx + size, y: cy + size * 0.7 }
                    ];
                    for (let i = 0; i < 3; i++) {
                        this.drawLineRgba(renderer, 
                            tri[i].x, tri[i].y,
                            tri[(i + 1) % 3].x, tri[(i + 1) % 3].y,
                            r, g, b, alpha
                        );
                    }
                    break;
                    
                case 'square':
                    for (let dy = -size; dy <= size; dy++) {
                        renderer.setPixelBlend(cx - size, cy + dy, r, g, b, alpha);
                        renderer.setPixelBlend(cx + size, cy + dy, r, g, b, alpha);
                    }
                    for (let dx = -size; dx <= size; dx++) {
                        renderer.setPixelBlend(cx + dx, cy - size, r, g, b, alpha);
                        renderer.setPixelBlend(cx + dx, cy + size, r, g, b, alpha);
                    }
                    break;
                    
                case 'cross':
                    for (let d = -size; d <= size; d++) {
                        renderer.setPixelBlend(cx + d, cy, r, g, b, alpha);
                        renderer.setPixelBlend(cx, cy + d, r, g, b, alpha);
                    }
                    break;
                    
                case 'star':
                    // Estrela de 5 pontas simplificada
                    for (let i = 0; i < 5; i++) {
                        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                        const px = cx + Math.cos(angle) * size;
                        const py = cy + Math.sin(angle) * size;
                        this.drawLineRgba(renderer, cx, cy, px, py, r, g, b, alpha);
                    }
                    break;
                    
                case 'spiral':
                    // Espiral alquímica
                    for (let a = 0; a < Math.PI * 4; a += 0.2) {
                        const sr = (a / (Math.PI * 4)) * size;
                        const px = cx + Math.cos(a) * sr;
                        const py = cy + Math.sin(a) * sr;
                        renderer.setPixelBlend(Math.round(px), Math.round(py), r, g, b, alpha);
                    }
                    break;
            }
        });
    }
    
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
    
    // ═══════════════════════════════════════════════════════════════════
    // SOM DE SÍNTESE (Web Audio)
    // ═══════════════════════════════════════════════════════════════════
    
    startSynthesisSound() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Cria oscilador de "síntese"
            this.synthOsc = this.audioCtx.createOscillator();
            this.synthGain = this.audioCtx.createGain();
            this.synthFilter = this.audioCtx.createBiquadFilter();
            
            // Configuração: som low-fi de "impressora/modem"
            this.synthOsc.type = 'sawtooth';
            this.synthOsc.frequency.value = 100;
            
            this.synthFilter.type = 'lowpass';
            this.synthFilter.frequency.value = 500;
            this.synthFilter.Q.value = 5;
            
            this.synthGain.gain.value = 0.05;
            
            // Conecta
            this.synthOsc.connect(this.synthFilter);
            this.synthFilter.connect(this.synthGain);
            this.synthGain.connect(this.audioCtx.destination);
            
            this.synthOsc.start();
        } catch (e) {
            console.warn('Audio não disponível:', e);
        }
    }
    
    updateSound() {
        if (!this.synthOsc) return;
        
        // Modula frequência baseado no progresso
        const baseFreq = 100 + this.progress * 400;
        const noise = Math.random() * 50;
        this.synthOsc.frequency.value = baseFreq + noise;
        
        // Volume baseado na atividade
        const targetGain = this.isActive ? 0.05 * (1 - this.progress * 0.5) : 0;
        this.synthGain.gain.value += (targetGain - this.synthGain.gain.value) * 0.1;
    }
    
    stopSound() {
        if (this.synthOsc) {
            this.synthGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.1);
            setTimeout(() => {
                this.synthOsc.stop();
                this.audioCtx.close();
            }, 100);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CONCLUSÃO
    // ═══════════════════════════════════════════════════════════════════
    
    complete() {
        this.isActive = false;
        this.stopSound();
        
        // Spawn partículas de conclusão (explosão)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particleTrail.push({
                x: this.pet.x,
                y: this.pet.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02,
                size: 2 + Math.random() * 3,
                type: 'spark'
            });
        }
        
        console.log('✨ Materialização completa!');
        
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════
    
    isRevealed(x, y) {
        if (!this.revealMask) return true;
        if (!this.isActive) return true;
        
        if (x < this.bounds.minX || x >= this.bounds.maxX ||
            y < this.bounds.minY || y >= this.bounds.maxY) {
            return true;
        }
        
        const width = this.bounds.maxX - this.bounds.minX;
        const idx = (y - this.bounds.minY) * width + (x - this.bounds.minX);
        return this.revealMask[idx] >= 255;
    }
    
    getRevealAlpha(x, y) {
        if (!this.revealMask || !this.isActive) return 255;
        
        if (x < this.bounds.minX || x >= this.bounds.maxX ||
            y < this.bounds.minY || y >= this.bounds.maxY) {
            return 255;
        }
        
        const width = this.bounds.maxX - this.bounds.minX;
        const idx = (Math.floor(y) - this.bounds.minY) * width + (Math.floor(x) - this.bounds.minX);
        return this.revealMask[idx] || 0;
    }
}
