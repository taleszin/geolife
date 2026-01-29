// ═══════════════════════════════════════════════════════════════════════════
// MATERIAL RENDERER - Sistema de Renderização das Matérias-Primas
// ═══════════════════════════════════════════════════════════════════════════
//
// Este módulo transforma definições abstratas de materiais em pixels concretos.
// Cada substância possui sua própria lógica de preenchimento (fill) e contorno
// (stroke), criando texturas procedurais únicas através de matemática pura.
//
// Algoritmos utilizados:
//   - Scanline Fill (subvertido para criar padrões)
//   - Bresenham (modificado para bordas especiais)
//   - Perlin-like Noise (simplificado)
//   - Gradientes radiais e lineares
//   - Dithering e hachuras geométricas
//
// ═══════════════════════════════════════════════════════════════════════════

import { MATERIALS_MAP } from '../data/materials.js';

/**
 * Renderizador de Materiais
 * Gerencia a renderização visual de cada substância
 */
export default class MaterialRenderer {
    constructor() {
        // Tempo para animações
        this.time = 0;
        
        // Cache de ruído procedural
        this.noiseCache = new Map();
        this.noiseSeed = Math.random() * 1000;
        
        // Constantes para ruído
        this.NOISE_OCTAVES = 3;
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE VITALIDADE - Modificadores de renderização
        // ═══════════════════════════════════════════════════════════════════
        this.vitalityModifiers = {
            glowIntensity: 1.0,     // Multiplicador de brilho (0.2 - 2.0)
            opacity: 1.0,           // Opacidade geral (0.3 - 1.0)
            saturationBoost: 0.0,   // Boost de saturação (-0.2 - 0.3)
            isApex: false,          // Está no "Ápice da Matéria"
            flickerAmount: 0.0      // Quantidade de flicker/oscilação
        };
    }
    
    /**
     * Define os modificadores de vitalidade do pet
     * Chamado pelo GeoPet antes de renderizar
     */
    setVitalityModifiers(mods) {
        if (!mods) return;
        this.vitalityModifiers = {
            glowIntensity: mods.glowIntensity ?? 1.0,
            opacity: mods.opacity ?? 1.0,
            saturationBoost: mods.saturationBoost ?? 0.0,
            isApex: mods.isApex ?? false,
            flickerAmount: mods.flickerAmount ?? 0.0
        };
    }
    
    /**
     * Aplica modificadores de vitalidade a uma cor RGB
     */
    applyVitalityToColor(r, g, b, alpha = 255) {
        const mods = this.vitalityModifiers;
        
        // Aplica saturação boost
        if (mods.saturationBoost !== 0) {
            const boost = mods.saturationBoost;
            // Aumenta diferença entre canais para mais saturação
            const avg = (r + g + b) / 3;
            r = Math.min(255, Math.max(0, r + (r - avg) * boost * 2));
            g = Math.min(255, Math.max(0, g + (g - avg) * boost * 2));
            b = Math.min(255, Math.max(0, b + (b - avg) * boost * 2));
        }
        
        // Aplica opacidade
        alpha = Math.round(alpha * mods.opacity);
        
        // Aplica flicker
        if (mods.flickerAmount > 0) {
            const flicker = 1.0 + Math.sin(Date.now() * 0.02) * mods.flickerAmount * 0.2;
            r = Math.min(255, Math.round(r * flicker));
            g = Math.min(255, Math.round(g * flicker));
            b = Math.min(255, Math.round(b * flicker));
        }
        
        // Ápice: boost dourado sutil
        if (mods.isApex) {
            const apexPulse = 0.95 + Math.sin(Date.now() * 0.003) * 0.05;
            r = Math.min(255, Math.round(r * apexPulse + 10));
            g = Math.min(255, Math.round(g * apexPulse + 5));
        }
        
        return { r, g, b, alpha };
    }
    
    /**
     * Atualiza o tempo de animação
     */
    update(deltaTime) {
        this.time += deltaTime * 0.001;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RUÍDO PROCEDURAL (Simplified Perlin-like)
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Função de hash simples para gerar pseudo-aleatoriedade determinística
     */
    hash(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.noiseSeed) * 43758.5453;
        return n - Math.floor(n);
    }
    
    /**
     * Interpolação suave (smoothstep)
     */
    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Ruído de valor 2D
     */
    noise2D(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        
        const sx = this.smoothstep(fx);
        const sy = this.smoothstep(fy);
        
        const n00 = this.hash(ix, iy);
        const n10 = this.hash(ix + 1, iy);
        const n01 = this.hash(ix, iy + 1);
        const n11 = this.hash(ix + 1, iy + 1);
        
        const nx0 = n00 * (1 - sx) + n10 * sx;
        const nx1 = n01 * (1 - sx) + n11 * sx;
        
        return nx0 * (1 - sy) + nx1 * sy;
    }
    
    /**
     * Ruído fractal (múltiplas oitavas)
     */
    fractalNoise(x, y, octaves = 3, persistence = 0.5) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: AETHERIUM (Etéreo)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Gradiente radial suave do centro para as bordas
    //   - Partículas flutuantes (pontos de luz que se movem)
    //   - Densidade variável baseada em ruído (como névoa)
    //   - Bordas difusas com dithering
    // ═══════════════════════════════════════════════════════════════════════
    
    fillAetherium(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        // Cores RGB
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const glow = this.hexToRgb(palette.glow);
        
        // Scanline modificado com névoa
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    // Distância normalizada do centro
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Ruído para efeito de névoa
                    const noiseVal = this.fractalNoise(
                        x * material.render.noiseScale + this.time * 0.5,
                        y * material.render.noiseScale + this.time * 0.3,
                        3, 0.5
                    );
                    
                    // Densidade varia com ruído
                    const density = material.render.density * (0.5 + noiseVal * 0.5);
                    
                    // Skip pixels baseado em densidade (efeito etéreo)
                    if (Math.random() > density) continue;
                    
                    // Gradiente radial de 3 cores
                    let r, g, b;
                    if (dist < 0.4) {
                        // Centro: core -> mid
                        const t = dist / 0.4;
                        r = core.r + (mid.r - core.r) * t;
                        g = core.g + (mid.g - core.g) * t;
                        b = core.b + (mid.b - core.b) * t;
                    } else {
                        // Borda: mid -> edge
                        const t = (dist - 0.4) / 0.6;
                        r = mid.r + (edge.r - mid.r) * t;
                        g = mid.g + (edge.g - mid.g) * t;
                        b = mid.b + (edge.b - mid.b) * t;
                    }
                    
                    // Modulação por ruído (variação de cor)
                    const colorNoise = noiseVal * 30 - 15;
                    r = Math.max(0, Math.min(255, r + colorNoise));
                    g = Math.max(0, Math.min(255, g + colorNoise));
                    b = Math.max(0, Math.min(255, b + colorNoise));
                    
                    // Alpha diminui nas bordas
                    let alpha = Math.floor(255 * (1 - dist * 0.5) * density);
                    
                    // Aplica modificadores de vitalidade
                    const vitalized = this.applyVitalityToColor(r, g, b, alpha);
                    
                    renderer.setPixel(x, y, vitalized.r, vitalized.g, vitalized.b, vitalized.alpha);
                }
            }
        }
        
        // Partículas flutuantes de luz (mais intensas no Ápice)
        const particleCount = this.vitalityModifiers.isApex ? 12 : 8;
        this.drawFloatingParticles(renderer, cx, cy, bounds, glow, particleCount);
    }
    
    /**
     * Borda difusa (dithering)
     */
    strokeAetherium(renderer, points, material) {
        const { glow, accent } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const accentRgb = this.hexToRgb(accent);
        
        const n = points.length;
        
        // Múltiplas camadas de glow difuso
        for (let layer = 4; layer >= 0; layer--) {
            const alpha = layer === 0 ? 200 : Math.floor(60 * (1 - layer / 5));
            
            for (let i = 0; i < n; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                
                // Linha base com Bresenham
                this.drawLineWithDithering(
                    renderer, p1.x, p1.y, p2.x, p2.y,
                    glowRgb.r, glowRgb.g, glowRgb.b, alpha,
                    layer, // offset para glow
                    0.7    // densidade do dithering
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: CRYSTALINE (Cristal)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Padrões geométricos internos (linhas de fratura)
    //   - Facetas com diferentes intensidades de cor
    //   - Reflexos pontuais (highlights)
    //   - Hachuras angulares precisas
    //   - Bordas duplas com facetamento
    // ═══════════════════════════════════════════════════════════════════════
    
    fillCrystaline(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const accent = this.hexToRgb(palette.accent);
        
        // Ângulo das facetas (rotaciona com o tempo)
        const facetAngle = Math.PI / 6 + this.time * 0.1;
        const facetSpacing = 8;
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente radial base
                    let r, g, b;
                    if (dist < 0.3) {
                        const t = dist / 0.3;
                        r = core.r + (mid.r - core.r) * t;
                        g = core.g + (mid.g - core.g) * t;
                        b = core.b + (mid.b - core.b) * t;
                    } else {
                        const t = (dist - 0.3) / 0.7;
                        r = mid.r + (edge.r - mid.r) * t;
                        g = mid.g + (edge.g - mid.g) * t;
                        b = mid.b + (edge.b - mid.b) * t;
                    }
                    
                    // ═══ FACETAS CRISTALINAS ═══
                    // Padrão de hachura angular (linhas de fratura)
                    const rotX = dx * Math.cos(facetAngle) - dy * Math.sin(facetAngle);
                    const rotY = dx * Math.sin(facetAngle) + dy * Math.cos(facetAngle);
                    
                    // Padrão de grade diagonal
                    const facetPattern1 = Math.abs((rotX + rotY) % facetSpacing) < 1;
                    const facetPattern2 = Math.abs((rotX - rotY) % facetSpacing) < 1;
                    
                    if (facetPattern1 || facetPattern2) {
                        // Linhas de fratura - mais claras
                        r = Math.min(255, r + 40);
                        g = Math.min(255, g + 40);
                        b = Math.min(255, b + 40);
                    }
                    
                    // ═══ REFLEXOS (Highlights) ═══
                    // Pontos de luz simulando reflexão
                    const highlightAngle = Math.atan2(dy, dx);
                    const highlightZone = Math.sin(highlightAngle * 3 + this.time) * 0.5 + 0.5;
                    
                    if (dist < 0.4 && highlightZone > 0.85 && Math.random() > 0.7) {
                        r = accent.r;
                        g = accent.g;
                        b = accent.b;
                    }
                    
                    // ═══ FACETAS DE COR ═══
                    // Diferentes "faces" do cristal com intensidades diferentes
                    const facetId = Math.floor((highlightAngle + Math.PI) / (Math.PI / 3));
                    const facetBrightness = 0.8 + (facetId % 2) * 0.2;
                    
                    r = Math.floor(r * facetBrightness);
                    g = Math.floor(g * facetBrightness);
                    b = Math.floor(b * facetBrightness);
                    
                    renderer.setPixel(x, y, r, g, b, 230);
                }
            }
        }
    }
    
    /**
     * Borda facetada (linhas duplas com brilho)
     */
    strokeCrystaline(renderer, points, material) {
        const { glow, accent } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const accentRgb = this.hexToRgb(accent);
        
        const n = points.length;
        
        // Camada externa de glow
        for (let layer = 3; layer >= 0; layer--) {
            const alpha = layer === 0 ? 255 : Math.floor(100 * (1 - layer / 4));
            
            for (let i = 0; i < n; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                
                // Offset perpendicular para linha dupla
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len * layer * 0.8;
                const ny = dx / len * layer * 0.8;
                
                this.drawBresenhamLine(
                    renderer,
                    Math.round(p1.x + nx), Math.round(p1.y + ny),
                    Math.round(p2.x + nx), Math.round(p2.y + ny),
                    glowRgb.r, glowRgb.g, glowRgb.b, alpha
                );
            }
        }
        
        // Pontos de vértice brilhantes (reflexos nos cantos)
        for (let i = 0; i < n; i++) {
            const p = points[i];
            const sparkle = Math.sin(this.time * 5 + i * 2) * 0.5 + 0.5;
            
            if (sparkle > 0.7) {
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx * dx + dy * dy <= 4) {
                            const alpha = Math.floor(255 * sparkle * (1 - Math.sqrt(dx*dx + dy*dy) / 2));
                            renderer.setPixelBlend(p.x + dx, p.y + dy, accentRgb.r, accentRgb.g, accentRgb.b, alpha);
                        }
                    }
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: IGNIS (Fogo)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Gradiente de temperatura (branco->amarelo->laranja->vermelho)
    //   - Ruído animado intenso (chamas)
    //   - Pixels que "tremem" e mudam
    //   - Bordas irregulares com "faíscas"
    //   - Ondas de calor (distorção)
    // ═══════════════════════════════════════════════════════════════════════
    
    fillIgnis(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);    // Branco
        const mid = this.hexToRgb(palette.mid);      // Amarelo
        const edge = this.hexToRgb(palette.edge);    // Laranja
        const glow = this.hexToRgb(palette.glow);    // Vermelho
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // ═══ RUÍDO DE CHAMAS ═══
                    // Ruído animado que simula fogo
                    const fireNoise = this.fractalNoise(
                        x * material.render.noiseScale,
                        y * material.render.noiseScale - this.time * 3, // Fogo sobe
                        4, 0.6
                    );
                    
                    // Ruído secundário para variação horizontal
                    const waveNoise = this.noise2D(
                        x * 0.1 + this.time,
                        y * 0.05
                    ) * 0.3;
                    
                    // Distância modificada pelo ruído (bordas irregulares)
                    const noisyDist = dist + (fireNoise - 0.5) * 0.4 + waveNoise;
                    
                    // Skip se fora da forma (chamas vazam um pouco)
                    if (noisyDist > 1.1) continue;
                    
                    // ═══ GRADIENTE DE TEMPERATURA ═══
                    // 4 zonas: branco -> amarelo -> laranja -> vermelho
                    let r, g, b;
                    const tempDist = Math.max(0, Math.min(1, noisyDist));
                    
                    if (tempDist < 0.2) {
                        // Centro: branco incandescente
                        const t = tempDist / 0.2;
                        r = core.r + (mid.r - core.r) * t;
                        g = core.g + (mid.g - core.g) * t;
                        b = core.b + (mid.b - core.b) * t;
                    } else if (tempDist < 0.5) {
                        // Meio-interno: amarelo
                        const t = (tempDist - 0.2) / 0.3;
                        r = mid.r + (edge.r - mid.r) * t;
                        g = mid.g + (edge.g - mid.g) * t;
                        b = mid.b + (edge.b - mid.b) * t;
                    } else {
                        // Borda: laranja -> vermelho
                        const t = (tempDist - 0.5) / 0.5;
                        r = edge.r + (glow.r - edge.r) * t;
                        g = edge.g + (glow.g - edge.g) * t;
                        b = edge.b + (glow.b - edge.b) * t;
                    }
                    
                    // ═══ TREMOR DE CHAMA ═══
                    // Variação aleatória para efeito de "vivo"
                    const flicker = (Math.random() - 0.5) * 40 * fireNoise;
                    r = Math.max(0, Math.min(255, r + flicker));
                    g = Math.max(0, Math.min(255, g + flicker * 0.5));
                    // B não varia muito (fogo é quente)
                    
                    // Alpha diminui nas bordas
                    const alpha = Math.floor(255 * Math.max(0, 1 - tempDist * 0.3));
                    
                    renderer.setPixel(x, y, r, g, b, alpha);
                }
            }
        }
        
        // Faíscas ao redor
        this.drawSparks(renderer, cx, cy, bounds, material.palette.glow, 6);
    }
    
    /**
     * Borda flamejante (irregular e pulsante)
     */
    strokeIgnis(renderer, points, material) {
        const { glow, mid } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const midRgb = this.hexToRgb(mid);
        
        const n = points.length;
        
        // Borda principal com irregularidade
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            
            // Subdivide a linha para adicionar irregularidade
            const steps = Math.ceil(Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            ) / 3);
            
            for (let s = 0; s < steps; s++) {
                const t1 = s / steps;
                const t2 = (s + 1) / steps;
                
                // Posições interpoladas
                let x1 = p1.x + (p2.x - p1.x) * t1;
                let y1 = p1.y + (p2.y - p1.y) * t1;
                let x2 = p1.x + (p2.x - p1.x) * t2;
                let y2 = p1.y + (p2.y - p1.y) * t2;
                
                // Adiciona ruído (tremor)
                const noise1 = this.noise2D(x1 * 0.1 + this.time * 2, y1 * 0.1) * 3;
                const noise2 = this.noise2D(x2 * 0.1 + this.time * 2, y2 * 0.1) * 3;
                
                // Perpendicular para deslocamento
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                
                x1 += (-dy / len) * noise1;
                y1 += (dx / len) * noise1;
                x2 += (-dy / len) * noise2;
                y2 += (dx / len) * noise2;
                
                // Cor varia ao longo da borda
                const colorT = (Math.sin(this.time * 8 + s) + 1) / 2;
                const r = Math.floor(glowRgb.r + (midRgb.r - glowRgb.r) * colorT);
                const g = Math.floor(glowRgb.g + (midRgb.g - glowRgb.g) * colorT);
                const b = Math.floor(glowRgb.b + (midRgb.b - glowRgb.b) * colorT);
                
                this.drawBresenhamLine(renderer, 
                    Math.round(x1), Math.round(y1),
                    Math.round(x2), Math.round(y2),
                    r, g, b, 255
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: VOIDMATTER (Vazio)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Fundo quase vazio (anti-matéria)
    //   - Pontos de luz estelares espalhados
    //   - Nebulosas sutis (gradientes de cor)
    //   - Linhas que convergem para o centro (singularidade)
    //   - Bordas que "sugam" a luz (inversão)
    // ═══════════════════════════════════════════════════════════════════════
    
    fillVoidmatter(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const glow = this.hexToRgb(palette.glow);
        const accent = this.hexToRgb(palette.accent);
        
        // ═══ FUNDO VAZIO ═══
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente do vazio (escuro no centro, um pouco mais claro nas bordas)
                    let r, g, b;
                    const t = dist;
                    r = core.r + (edge.r - core.r) * t;
                    g = core.g + (edge.g - core.g) * t;
                    b = core.b + (edge.b - core.b) * t;
                    
                    // Nebulosa sutil
                    const nebulaNoise = this.fractalNoise(
                        x * 0.02 + this.time * 0.1,
                        y * 0.02,
                        2, 0.5
                    );
                    
                    if (nebulaNoise > 0.6) {
                        const nebulaIntensity = (nebulaNoise - 0.6) * 2.5;
                        r = Math.floor(r + glow.r * nebulaIntensity * 0.2);
                        g = Math.floor(g + glow.g * nebulaIntensity * 0.2);
                        b = Math.floor(b + glow.b * nebulaIntensity * 0.3);
                    }
                    
                    renderer.setPixel(x, y, r, g, b, 255);
                }
            }
        }
        
        // ═══ ESTRELAS ═══
        // Pontos de luz espalhados de forma determinística
        const starSeed = Math.floor(this.noiseSeed * 100);
        const numStars = 15 + Math.floor(maxDist / 3);
        
        for (let i = 0; i < numStars; i++) {
            // Posição pseudo-aleatória mas consistente
            const angle = this.hash(i, starSeed) * Math.PI * 2;
            const radius = this.hash(i + 100, starSeed) * maxDist * 0.85;
            
            const sx = cx + Math.cos(angle) * radius;
            const sy = cy + Math.sin(angle) * radius;
            
            // Verifica se está dentro do polígono
            if (!this.pointInPolygon(sx, sy, points)) continue;
            
            // Brilho pulsante
            const twinkle = Math.sin(this.time * 3 + i * 1.7) * 0.5 + 0.5;
            const brightness = 0.5 + twinkle * 0.5;
            
            // Tamanho da estrela
            const size = this.hash(i + 200, starSeed) > 0.7 ? 2 : 1;
            
            // Cor da estrela (varia)
            const starColorT = this.hash(i + 300, starSeed);
            let sr, sg, sb;
            if (starColorT < 0.3) {
                // Azul
                sr = glow.r; sg = glow.g; sb = glow.b;
            } else if (starColorT < 0.6) {
                // Branco
                sr = accent.r; sg = accent.g; sb = accent.b;
            } else {
                // Ciano claro
                sr = 150; sg = 220; sb = 255;
            }
            
            // Desenha estrela
            const alpha = Math.floor(255 * brightness);
            if (size === 1) {
                renderer.setPixelBlend(Math.round(sx), Math.round(sy), sr, sg, sb, alpha);
            } else {
                // Estrela maior (cruz)
                renderer.setPixelBlend(Math.round(sx), Math.round(sy), sr, sg, sb, alpha);
                renderer.setPixelBlend(Math.round(sx - 1), Math.round(sy), sr, sg, sb, Math.floor(alpha * 0.5));
                renderer.setPixelBlend(Math.round(sx + 1), Math.round(sy), sr, sg, sb, Math.floor(alpha * 0.5));
                renderer.setPixelBlend(Math.round(sx), Math.round(sy - 1), sr, sg, sb, Math.floor(alpha * 0.5));
                renderer.setPixelBlend(Math.round(sx), Math.round(sy + 1), sr, sg, sb, Math.floor(alpha * 0.5));
            }
        }
        
        // ═══ LINHAS DE SINGULARIDADE ═══
        // Linhas que convergem para o centro
        const numLines = 8;
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2 + this.time * 0.2;
            const length = maxDist * 0.9;
            
            const endX = cx + Math.cos(angle) * length;
            const endY = cy + Math.sin(angle) * length;
            
            // Linha tracejada convergindo
            this.drawDashedLine(
                renderer, endX, endY, cx, cy,
                glow.r, glow.g, glow.b, 40,
                4, 8 // dash, gap
            );
        }
    }
    
    /**
     * Borda de singularidade (inversão de luz)
     */
    strokeVoidmatter(renderer, points, material) {
        const { glow, edge } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const edgeRgb = this.hexToRgb(edge);
        
        const n = points.length;
        
        // Borda tracejada principal
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            
            // Linha tracejada com glow
            this.drawDashedLine(
                renderer, p1.x, p1.y, p2.x, p2.y,
                glowRgb.r, glowRgb.g, glowRgb.b, 180,
                6, 4
            );
        }
        
        // "Halo de absorção" - borda externa escura
        for (let layer = 1; layer <= 3; layer++) {
            const alpha = Math.floor(30 * (1 - layer / 4));
            
            for (let i = 0; i < n; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len * layer * 1.5;
                const ny = dx / len * layer * 1.5;
                
                this.drawBresenhamLine(
                    renderer,
                    Math.round(p1.x + nx), Math.round(p1.y + ny),
                    Math.round(p2.x + nx), Math.round(p2.y + ny),
                    edgeRgb.r, edgeRgb.g, edgeRgb.b, alpha
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: VERDANTIA (Orgânico/Vegetal)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Células orgânicas (padrão de voronoi simplificado)
    //   - Veios de seiva luminosos
    //   - Pontos de crescimento (brotos)
    //   - Gradiente de clorofila
    // ═══════════════════════════════════════════════════════════════════════
    
    fillVerdantia(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const glow = this.hexToRgb(palette.glow);
        
        // Padrão celular
        const cellSize = 12;
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente base (clorofila)
                    let r, g, b;
                    if (dist < 0.4) {
                        const t = dist / 0.4;
                        r = core.r + (mid.r - core.r) * t;
                        g = core.g + (mid.g - core.g) * t;
                        b = core.b + (mid.b - core.b) * t;
                    } else {
                        const t = (dist - 0.4) / 0.6;
                        r = mid.r + (edge.r - mid.r) * t;
                        g = mid.g + (edge.g - mid.g) * t;
                        b = mid.b + (edge.b - mid.b) * t;
                    }
                    
                    // ═══ PADRÃO CELULAR ═══
                    // Células hexagonais simplificadas
                    const cellX = Math.floor(x / cellSize);
                    const cellY = Math.floor(y / cellSize);
                    const localX = (x % cellSize) / cellSize;
                    const localY = (y % cellSize) / cellSize;
                    
                    // Distância ao centro da célula
                    const cellDist = Math.sqrt(Math.pow(localX - 0.5, 2) + Math.pow(localY - 0.5, 2));
                    
                    // Membrana celular (bordas das células)
                    if (cellDist > 0.35 && cellDist < 0.45) {
                        r = Math.min(255, r + 30);
                        g = Math.min(255, g + 50);
                        b = Math.min(255, b + 20);
                    }
                    
                    // ═══ VEIOS DE SEIVA ═══
                    const veinNoise = this.noise2D(
                        x * 0.05 + this.time * 0.2,
                        y * 0.08
                    );
                    
                    if (veinNoise > 0.7) {
                        const veinIntensity = (veinNoise - 0.7) * 3.3;
                        r = Math.floor(r + glow.r * veinIntensity * 0.3);
                        g = Math.min(255, Math.floor(g + 60 * veinIntensity));
                        b = Math.floor(b * 0.8);
                    }
                    
                    // Variação orgânica
                    const orgNoise = this.fractalNoise(x * 0.03, y * 0.03, 2, 0.5);
                    r = Math.max(0, Math.min(255, r + (orgNoise - 0.5) * 20));
                    g = Math.max(0, Math.min(255, g + (orgNoise - 0.5) * 30));
                    b = Math.max(0, Math.min(255, b + (orgNoise - 0.5) * 15));
                    
                    renderer.setPixel(x, y, r, g, b, 240);
                }
            }
        }
        
        // Esporos/brotos de luz
        this.drawSpores(renderer, cx, cy, bounds, glow, 6);
    }
    
    strokeVerdantia(renderer, points, material) {
        const { glow, mid } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const midRgb = this.hexToRgb(mid);
        const n = points.length;
        
        // Borda ondulada (como cipós)
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            
            const steps = Math.ceil(Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            ) / 2);
            
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                let x = p1.x + (p2.x - p1.x) * t;
                let y = p1.y + (p2.y - p1.y) * t;
                
                // Ondulação de cipó
                const wave = Math.sin(t * Math.PI * 4 + this.time * 2) * 2;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                
                x += (-dy / len) * wave;
                y += (dx / len) * wave;
                
                // Cor pulsante
                const pulse = Math.sin(this.time * 3 + t * 10) * 0.3 + 0.7;
                const r = Math.floor(glowRgb.r * pulse);
                const g = Math.floor(glowRgb.g * pulse);
                const b = Math.floor(glowRgb.b * pulse);
                
                renderer.setPixelBlend(Math.round(x), Math.round(y), r, g, b, 220);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: FERRUM (Metálico)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Reflexos especulares (highlights metálicos)
    //   - Padrão de escovado/martelado
    //   - Gradiente de aço
    //   - Rebites na borda
    // ═══════════════════════════════════════════════════════════════════════
    
    fillFerrum(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const accent = this.hexToRgb(palette.accent);
        
        // Ângulo da luz (muda lentamente)
        const lightAngle = this.time * 0.3;
        const lightX = Math.cos(lightAngle);
        const lightY = Math.sin(lightAngle);
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente base
                    let r, g, b;
                    const t = Math.min(1, dist);
                    r = core.r + (edge.r - core.r) * t;
                    g = core.g + (edge.g - core.g) * t;
                    b = core.b + (edge.b - core.b) * t;
                    
                    // ═══ REFLEXO ESPECULAR ═══
                    // Simula reflexo de luz ambiente
                    const normX = dx / (maxDist || 1);
                    const normY = dy / (maxDist || 1);
                    const specular = Math.max(0, normX * lightX + normY * lightY);
                    const specPower = Math.pow(specular, 3);
                    
                    r = Math.min(255, r + 80 * specPower);
                    g = Math.min(255, g + 80 * specPower);
                    b = Math.min(255, b + 90 * specPower);
                    
                    // ═══ PADRÃO ESCOVADO ═══
                    // Linhas horizontais sutis (metal escovado)
                    const brushNoise = this.noise2D(x * 0.3, y * 0.01);
                    if (brushNoise > 0.6) {
                        const brushIntensity = (brushNoise - 0.6) * 2.5;
                        r = Math.min(255, r + 20 * brushIntensity);
                        g = Math.min(255, g + 20 * brushIntensity);
                        b = Math.min(255, b + 25 * brushIntensity);
                    }
                    
                    // ═══ MANCHAS DE FORJA ═══
                    const forgeNoise = this.fractalNoise(x * 0.02, y * 0.02, 2, 0.6);
                    if (forgeNoise > 0.65) {
                        r = Math.floor(r * 0.85);
                        g = Math.floor(g * 0.85);
                        b = Math.floor(b * 0.9);
                    }
                    
                    renderer.setPixel(x, y, r, g, b, 255);
                }
            }
        }
    }
    
    strokeFerrum(renderer, points, material) {
        const { glow, mid } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const midRgb = this.hexToRgb(mid);
        const n = points.length;
        
        // Borda dupla (reforço metálico)
        for (let layer = 0; layer < 2; layer++) {
            for (let i = 0; i < n; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len * layer;
                const ny = dx / len * layer;
                
                const color = layer === 0 ? glowRgb : midRgb;
                const alpha = layer === 0 ? 255 : 180;
                
                this.drawBresenhamLine(
                    renderer,
                    Math.round(p1.x + nx), Math.round(p1.y + ny),
                    Math.round(p2.x + nx), Math.round(p2.y + ny),
                    color.r, color.g, color.b, alpha
                );
            }
        }
        
        // Rebites nos vértices
        for (let i = 0; i < n; i++) {
            const p = points[i];
            // Rebite circular
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const d = dx * dx + dy * dy;
                    if (d <= 4) {
                        const bright = d <= 1 ? 255 : 180;
                        renderer.setPixelBlend(
                            Math.round(p.x + dx), Math.round(p.y + dy),
                            glowRgb.r, glowRgb.g, glowRgb.b, bright
                        );
                    }
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: TEMPESTIUM (Elétrico)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Raios internos (linhas de energia)
    //   - Flashes aleatórios
    //   - Plasma pulsante
    //   - Faíscas na borda
    // ═══════════════════════════════════════════════════════════════════════
    
    fillTempestium(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const glow = this.hexToRgb(palette.glow);
        
        // Flash global (relâmpago)
        const flash = Math.random() < 0.05 ? 1 : 0;
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente base (plasma)
                    let r, g, b;
                    if (dist < 0.3) {
                        const t = dist / 0.3;
                        r = core.r + (mid.r - core.r) * t;
                        g = core.g + (mid.g - core.g) * t;
                        b = core.b + (mid.b - core.b) * t;
                    } else {
                        const t = (dist - 0.3) / 0.7;
                        r = mid.r + (edge.r - mid.r) * t;
                        g = mid.g + (edge.g - mid.g) * t;
                        b = mid.b + (edge.b - mid.b) * t;
                    }
                    
                    // ═══ RAIOS INTERNOS ═══
                    const angle = Math.atan2(dy, dx);
                    const boltNoise = this.noise2D(
                        angle * 3 + this.time * 5,
                        dist * 10
                    );
                    
                    if (boltNoise > 0.75) {
                        // Raio de energia
                        r = Math.min(255, r + 100);
                        g = Math.min(255, g + 100);
                        b = Math.min(255, b + 50);
                    }
                    
                    // ═══ PLASMA PULSANTE ═══
                    const pulse = Math.sin(this.time * 8 + dist * 10) * 0.3 + 0.7;
                    r = Math.floor(r * pulse);
                    g = Math.floor(g * pulse);
                    b = Math.floor(b * (0.8 + pulse * 0.2));
                    
                    // Flash de relâmpago
                    if (flash) {
                        r = Math.min(255, r + 100);
                        g = Math.min(255, g + 100);
                        b = Math.min(255, b + 100);
                    }
                    
                    // Ruído elétrico
                    const noise = (Math.random() - 0.5) * 30;
                    r = Math.max(0, Math.min(255, r + noise));
                    g = Math.max(0, Math.min(255, g + noise));
                    
                    renderer.setPixel(x, y, r, g, b, 245);
                }
            }
        }
        
        // Raios do centro para fora
        this.drawLightningBolts(renderer, cx, cy, maxDist, glow, 4);
    }
    
    strokeTempestium(renderer, points, material) {
        const { glow, accent } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const accentRgb = this.hexToRgb(accent);
        const n = points.length;
        
        // Borda com faíscas saltando
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            
            // Linha base
            this.drawBresenhamLine(
                renderer,
                Math.round(p1.x), Math.round(p1.y),
                Math.round(p2.x), Math.round(p2.y),
                glowRgb.r, glowRgb.g, glowRgb.b, 255
            );
            
            // Faíscas aleatórias
            if (Math.random() < 0.3) {
                const t = Math.random();
                const sparkX = p1.x + (p2.x - p1.x) * t;
                const sparkY = p1.y + (p2.y - p1.y) * t;
                
                // Faísca em direção aleatória
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkLen = 3 + Math.random() * 5;
                const endX = sparkX + Math.cos(sparkAngle) * sparkLen;
                const endY = sparkY + Math.sin(sparkAngle) * sparkLen;
                
                this.drawBresenhamLine(
                    renderer,
                    Math.round(sparkX), Math.round(sparkY),
                    Math.round(endX), Math.round(endY),
                    accentRgb.r, accentRgb.g, accentRgb.b, 200
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PREENCHIMENTO: UMBRALITH (Sombrio)
    // ═══════════════════════════════════════════════════════════════════════
    // Características:
    //   - Névoa de sombras
    //   - Veios de energia roxa
    //   - Partículas de escuridão
    //   - Borda nebulosa
    // ═══════════════════════════════════════════════════════════════════════
    
    fillUmbralith(renderer, cx, cy, points, material) {
        const palette = material.palette;
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        const core = this.hexToRgb(palette.core);
        const mid = this.hexToRgb(palette.mid);
        const edge = this.hexToRgb(palette.edge);
        const glow = this.hexToRgb(palette.glow);
        const accent = this.hexToRgb(palette.accent);
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    
                    // Gradiente de sombra (escuro no centro, mais escuro ainda na borda)
                    let r, g, b;
                    const t = dist;
                    r = core.r + (edge.r - core.r) * t;
                    g = core.g + (edge.g - core.g) * t;
                    b = core.b + (edge.b - core.b) * t;
                    
                    // ═══ NÉVOA DE SOMBRAS ═══
                    const shadowNoise = this.fractalNoise(
                        x * 0.04 + this.time * 0.3,
                        y * 0.04 - this.time * 0.2,
                        3, 0.6
                    );
                    
                    // Escurece com ruído
                    const shadowFactor = 0.7 + shadowNoise * 0.3;
                    r = Math.floor(r * shadowFactor);
                    g = Math.floor(g * shadowFactor);
                    b = Math.floor(b * shadowFactor);
                    
                    // ═══ VEIOS DE ENERGIA ═══
                    const veinNoise = this.noise2D(
                        x * 0.08 + this.time * 0.5,
                        y * 0.08
                    );
                    
                    if (veinNoise > 0.72) {
                        const veinIntensity = (veinNoise - 0.72) * 3.5;
                        r = Math.min(255, r + glow.r * veinIntensity * 0.4);
                        g = Math.min(255, g + glow.g * veinIntensity * 0.2);
                        b = Math.min(255, b + glow.b * veinIntensity * 0.5);
                    }
                    
                    // Veios secundários (rosa)
                    const vein2 = this.noise2D(x * 0.1 - this.time * 0.3, y * 0.06);
                    if (vein2 > 0.78) {
                        const v2Int = (vein2 - 0.78) * 4.5;
                        r = Math.min(255, r + accent.r * v2Int * 0.3);
                        g = Math.min(255, g + accent.g * v2Int * 0.1);
                        b = Math.min(255, b + accent.b * v2Int * 0.2);
                    }
                    
                    renderer.setPixel(x, y, r, g, b, 250);
                }
            }
        }
        
        // Partículas de escuridão (pontos que "absorvem" luz)
        this.drawShadowMotes(renderer, cx, cy, bounds, glow, accent, 8);
    }
    
    strokeUmbralith(renderer, points, material) {
        const { glow, accent } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const accentRgb = this.hexToRgb(accent);
        const n = points.length;
        
        // Borda nebulosa (múltiplas camadas com dithering)
        for (let layer = 3; layer >= 0; layer--) {
            const alpha = layer === 0 ? 200 : Math.floor(80 * (1 - layer / 4));
            
            for (let i = 0; i < n; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                
                // Offset ondulante
                const waveOffset = Math.sin(this.time * 2 + i) * layer * 0.5;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len * (layer + waveOffset);
                const ny = dx / len * (layer + waveOffset);
                
                this.drawLineWithDithering(
                    renderer,
                    p1.x + nx, p1.y + ny,
                    p2.x + nx, p2.y + ny,
                    glowRgb.r, glowRgb.g, glowRgb.b, alpha,
                    0, 0.6
                );
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EFEITOS AUXILIARES PARA NOVOS MATERIAIS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Esporos/brotos de luz (para Verdantia)
     */
    drawSpores(renderer, cx, cy, bounds, color, count) {
        const rgb = this.hexToRgb(color);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        for (let i = 0; i < count; i++) {
            const seed = i + Math.floor(this.time * 0.5);
            const angle = this.hash(seed, 50) * Math.PI * 2;
            const radius = this.hash(seed, 51) * maxDist * 0.7;
            
            // Movimento flutuante
            const floatX = Math.sin(this.time * 2 + i * 1.3) * 3;
            const floatY = Math.cos(this.time * 1.5 + i * 1.7) * 4 - this.time * 2;
            
            const px = cx + Math.cos(angle) * radius + floatX;
            const py = cy + Math.sin(angle) * radius + floatY;
            
            const brightness = Math.sin(this.time * 4 + i * 2) * 0.4 + 0.6;
            const alpha = Math.floor(180 * brightness);
            
            renderer.setPixelBlend(Math.round(px), Math.round(py), rgb.r, rgb.g, rgb.b, alpha);
        }
    }
    
    /**
     * Raios de relâmpago (para Tempestium)
     */
    drawLightningBolts(renderer, cx, cy, maxDist, color, count) {
        const rgb = this.hexToRgb(color);
        
        for (let i = 0; i < count; i++) {
            // Apenas desenha se "ativado" pelo tempo
            const boltTime = (this.time * 3 + i * 1.7) % 2;
            if (boltTime > 0.3) continue;
            
            const angle = (i / count) * Math.PI * 2 + this.time * 0.5;
            let x = cx;
            let y = cy;
            
            const steps = 8 + Math.floor(Math.random() * 5);
            const stepLen = maxDist * 0.8 / steps;
            
            for (let s = 0; s < steps; s++) {
                // Próximo ponto com desvio aleatório
                const nextAngle = angle + (Math.random() - 0.5) * 0.8;
                const nextX = x + Math.cos(nextAngle) * stepLen;
                const nextY = y + Math.sin(nextAngle) * stepLen;
                
                const alpha = Math.floor(255 * (1 - s / steps));
                this.drawBresenhamLine(renderer, 
                    Math.round(x), Math.round(y),
                    Math.round(nextX), Math.round(nextY),
                    rgb.r, rgb.g, rgb.b, alpha
                );
                
                x = nextX;
                y = nextY;
            }
        }
    }
    
    /**
     * Partículas de sombra (para Umbralith)
     */
    drawShadowMotes(renderer, cx, cy, bounds, glowColor, accentColor, count) {
        const glow = this.hexToRgb(glowColor);
        const accent = this.hexToRgb(accentColor);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        for (let i = 0; i < count; i++) {
            const seed = i * 17 + Math.floor(this.time * 0.3);
            const angle = this.hash(seed, 100) * Math.PI * 2;
            const radius = this.hash(seed, 101) * maxDist * 0.6;
            
            // Órbita lenta
            const orbitAngle = angle + this.time * 0.2 * (1 + this.hash(i, 102) * 0.5);
            
            const px = cx + Math.cos(orbitAngle) * radius;
            const py = cy + Math.sin(orbitAngle) * radius;
            
            // Alterna entre glow e accent
            const useAccent = this.hash(i, 103) > 0.5;
            const color = useAccent ? accent : glow;
            
            const pulse = Math.sin(this.time * 3 + i * 2.1) * 0.4 + 0.6;
            const alpha = Math.floor(150 * pulse);
            
            // Ponto com pequeno halo
            renderer.setPixelBlend(Math.round(px), Math.round(py), color.r, color.g, color.b, alpha);
            renderer.setPixelBlend(Math.round(px - 1), Math.round(py), color.r, color.g, color.b, Math.floor(alpha * 0.4));
            renderer.setPixelBlend(Math.round(px + 1), Math.round(py), color.r, color.g, color.b, Math.floor(alpha * 0.4));
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES PRINCIPAIS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Preenche forma com material
     */
    fill(renderer, cx, cy, points, materialId) {
        const material = MATERIALS_MAP[materialId];
        if (!material) return;
        
        switch (material.render.fillType) {
            case 'ethereal':
                this.fillAetherium(renderer, cx, cy, points, material);
                break;
            case 'crystalline':
                this.fillCrystaline(renderer, cx, cy, points, material);
                break;
            case 'incandescent':
                this.fillIgnis(renderer, cx, cy, points, material);
                break;
            case 'void':
                this.fillVoidmatter(renderer, cx, cy, points, material);
                break;
            case 'organic':
                this.fillVerdantia(renderer, cx, cy, points, material);
                break;
            case 'metallic':
                this.fillFerrum(renderer, cx, cy, points, material);
                break;
            case 'electric':
                this.fillTempestium(renderer, cx, cy, points, material);
                break;
            case 'shadow':
                this.fillUmbralith(renderer, cx, cy, points, material);
                break;
            default:
                this.fillDefault(renderer, cx, cy, points, material);
        }
    }
    
    /**
     * Desenha borda com material
     */
    stroke(renderer, points, materialId) {
        const material = MATERIALS_MAP[materialId];
        if (!material) return;
        
        switch (material.render.borderType) {
            case 'diffuse':
                this.strokeAetherium(renderer, points, material);
                break;
            case 'faceted':
                this.strokeCrystaline(renderer, points, material);
                break;
            case 'flaming':
                this.strokeIgnis(renderer, points, material);
                break;
            case 'singularity':
                this.strokeVoidmatter(renderer, points, material);
                break;
            case 'vine':
                this.strokeVerdantia(renderer, points, material);
                break;
            case 'riveted':
                this.strokeFerrum(renderer, points, material);
                break;
            case 'sparking':
                this.strokeTempestium(renderer, points, material);
                break;
            case 'wispy':
                this.strokeUmbralith(renderer, points, material);
                break;
            default:
                this.strokeDefault(renderer, points, material);
        }
    }
    
    /**
     * Preenchimento padrão (fallback)
     */
    fillDefault(renderer, cx, cy, points, material) {
        const { core, edge } = material.palette;
        const coreRgb = this.hexToRgb(core);
        const edgeRgb = this.hexToRgb(edge);
        const bounds = this.getBounds(points);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const intersections = this.scanlineIntersections(points, y);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
                    const t = Math.min(1, dist);
                    
                    const r = Math.floor(coreRgb.r + (edgeRgb.r - coreRgb.r) * t);
                    const g = Math.floor(coreRgb.g + (edgeRgb.g - coreRgb.g) * t);
                    const b = Math.floor(coreRgb.b + (edgeRgb.b - coreRgb.b) * t);
                    
                    renderer.setPixel(x, y, r, g, b, 255);
                }
            }
        }
    }
    
    /**
     * Borda padrão (fallback)
     */
    strokeDefault(renderer, points, material) {
        const { glow } = material.palette;
        const glowRgb = this.hexToRgb(glow);
        const n = points.length;
        
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            this.drawBresenhamLine(renderer, 
                Math.round(p1.x), Math.round(p1.y),
                Math.round(p2.x), Math.round(p2.y),
                glowRgb.r, glowRgb.g, glowRgb.b, 255
            );
        }
    }
    
    /**
     * Calcula bounds de um conjunto de pontos
     */
    getBounds(points) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        
        return {
            minX: Math.floor(minX),
            maxX: Math.ceil(maxX),
            minY: Math.floor(minY),
            maxY: Math.ceil(maxY),
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    /**
     * Scanline: encontra interseções com linha horizontal
     */
    scanlineIntersections(vertices, y) {
        const intersections = [];
        const n = vertices.length;
        
        for (let i = 0; i < n; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % n];
            
            if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
                const x = v1.x + (y - v1.y) / (v2.y - v1.y) * (v2.x - v1.x);
                intersections.push(x);
            }
        }
        
        return intersections.sort((a, b) => a - b);
    }
    
    /**
     * Verifica se ponto está dentro do polígono
     */
    pointInPolygon(x, y, vertices) {
        let inside = false;
        const n = vertices.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * Algoritmo de Bresenham para linhas
     */
    drawBresenhamLine(renderer, x0, y0, x1, y1, r, g, b, a) {
        // Garante valores inteiros
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        // Limite de segurança
        let maxIterations = Math.max(dx, dy) * 2 + 10;
        
        while (maxIterations-- > 0) {
            renderer.setPixelBlend(x0, y0, r, g, b, a);
            
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    /**
     * Linha com dithering (para bordas difusas)
     */
    drawLineWithDithering(renderer, x0, y0, x1, y1, r, g, b, a, offset, density) {
        // Garante valores inteiros para evitar loop infinito
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        // Perpendicular para offset
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -(y1 - y0) / len * offset;
        const ny = (x1 - x0) / len * offset;
        
        // Limite de segurança para evitar loops infinitos
        let maxIterations = Math.max(dx, dy) * 2 + 10;
        
        while (maxIterations-- > 0) {
            // Dithering: skip alguns pixels aleatoriamente
            if (Math.random() < density) {
                renderer.setPixelBlend(
                    Math.round(x0 + nx), 
                    Math.round(y0 + ny), 
                    r, g, b, a
                );
            }
            
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    /**
     * Linha tracejada
     */
    drawDashedLine(renderer, x0, y0, x1, y1, r, g, b, a, dashLength, gapLength) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(len);
        
        let dashCounter = 0;
        const cycleLength = dashLength + gapLength;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(x0 + dx * t);
            const y = Math.round(y0 + dy * t);
            
            // Desenha apenas durante o "dash"
            if (dashCounter < dashLength) {
                renderer.setPixelBlend(x, y, r, g, b, a);
            }
            
            dashCounter = (dashCounter + 1) % cycleLength;
        }
    }
    
    /**
     * Partículas flutuantes de luz
     */
    drawFloatingParticles(renderer, cx, cy, bounds, color, count) {
        const rgb = this.hexToRgb(color);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        for (let i = 0; i < count; i++) {
            // Movimento circular + flutuação
            const baseAngle = (i / count) * Math.PI * 2;
            const angle = baseAngle + this.time * 0.5 + Math.sin(this.time + i) * 0.3;
            const radius = maxDist * (0.3 + this.hash(i, 0) * 0.5);
            const floatY = Math.sin(this.time * 2 + i * 1.5) * 5;
            
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius + floatY;
            
            // Brilho pulsante
            const brightness = 0.5 + Math.sin(this.time * 3 + i * 2) * 0.5;
            const alpha = Math.floor(200 * brightness);
            
            // Desenha partícula (pequeno glow)
            renderer.setPixelBlend(Math.round(px), Math.round(py), rgb.r, rgb.g, rgb.b, alpha);
            renderer.setPixelBlend(Math.round(px - 1), Math.round(py), rgb.r, rgb.g, rgb.b, Math.floor(alpha * 0.3));
            renderer.setPixelBlend(Math.round(px + 1), Math.round(py), rgb.r, rgb.g, rgb.b, Math.floor(alpha * 0.3));
        }
    }
    
    /**
     * Faíscas ao redor (para Ignis)
     */
    drawSparks(renderer, cx, cy, bounds, color, count) {
        const rgb = this.hexToRgb(color);
        const maxDist = Math.max(bounds.width, bounds.height) / 2;
        
        for (let i = 0; i < count; i++) {
            // Posição pseudo-aleatória que muda com o tempo
            const seed = i + Math.floor(this.time * 2);
            const angle = this.hash(seed, 100) * Math.PI * 2;
            const radius = maxDist * (0.8 + this.hash(seed, 200) * 0.4);
            
            // Movimento ascendente (faíscas sobem)
            const rise = (this.time * 50 + i * 20) % 30;
            
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius - rise;
            
            // Fade out conforme sobe
            const life = 1 - rise / 30;
            const alpha = Math.floor(255 * life * life);
            
            if (alpha > 10) {
                renderer.setPixelBlend(Math.round(px), Math.round(py), rgb.r, rgb.g, rgb.b, alpha);
            }
        }
    }
    
    /**
     * Converte hex para RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}

// Instância singleton
export const materialRenderer = new MaterialRenderer();
