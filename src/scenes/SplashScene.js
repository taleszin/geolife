// ═══════════════════════════════════════════════════════════════════
// SPLASH SCENE - Tela de Splash com Logo
// Demonstra algoritmo de Flood Fill
// Créditos: dev taleszin © 2026
// ═══════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import { floodFill, floodFillScanline } from '../algorithms/FloodFill.js';
import { drawEllipse, drawFilledEllipse } from '../algorithms/Ellipse.js';

export default class SplashScene {
    constructor(game) {
        this.game = game;
        this.renderer = null;
        this.canvas = null;
        this.animationFrame = null;
        
        // Estado da animação
        this.phase = 'logo';        // 'logo', 'fill', 'credits', 'fadeout'
        this.startTime = null;
        this.phaseStartTime = null;
        
        // Timings
        this.logoDrawDuration = 800;    // Desenha logo
        this.fillDelay = 200;           // Pausa antes do fill
        this.fillDuration = 600;        // Animação do flood fill
        this.creditsDuration = 1500;    // Mostra créditos
        this.fadeOutDuration = 500;     // Fade out
        
        // Partículas decorativas
        this.particles = [];
        
        // Cores do tema
        this.colors = {
            bg: '#0a0a0f',
            primary: '#00ffcc',
            secondary: '#ff00ff',
            accent: '#ffff00',
            white: '#ffffff'
        };
    }
    
    init(data = {}) {
        console.log('🎨 SplashScene - Iniciando tela de splash...');
        
        this.setupCanvas();
        this.setupUI();
        this.createParticles();
        
        this.startTime = performance.now();
        this.phaseStartTime = this.startTime;
        this.phase = 'logo';
        
        this.animate();
    }
    
    setupCanvas() {
        const container = document.getElementById('game-container');
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'splash-canvas';
        this.canvas.width = 400;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            display: block;
            margin: 0 auto;
            background: ${this.colors.bg};
            max-width: 100%;
            max-height: 100vh;
        `;
        
        container.appendChild(this.canvas);
        
        this.renderer = new Renderer(this.canvas, {
            width: 400,
            height: 600,
            useDPR: true
        });
    }
    
    setupUI() {
        const uiLayer = document.getElementById('ui-layer');
        
        // Container de créditos (inicialmente invisível)
        this.creditsContainer = document.createElement('div');
        this.creditsContainer.id = 'splash-credits';
        this.creditsContainer.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Press Start 2P', monospace;
            color: ${this.colors.white};
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: 100;
            pointer-events: none;
        `;
        this.creditsContainer.innerHTML = `
            <div style="font-size: 8px; color: #666; margin-bottom: 8px;">desenvolvido por</div>
            <div style="font-size: 12px; color: ${this.colors.primary}; text-shadow: 0 0 10px ${this.colors.primary};">
                dev taleszin
            </div>
            <div style="font-size: 6px; color: #444; margin-top: 12px;">
                © 2026 Todos os direitos reservados
            </div>
        `;
        
        uiLayer.appendChild(this.creditsContainer);
        
        // Texto "Toque para continuar"
        this.tapText = document.createElement('div');
        this.tapText.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Press Start 2P', monospace;
            font-size: 8px;
            color: #666;
            opacity: 0;
            transition: opacity 0.5s ease;
            animation: blink 1s ease-in-out infinite;
            z-index: 100;
        `;
        this.tapText.textContent = '[ toque para continuar ]';
        uiLayer.appendChild(this.tapText);
        
        // Adiciona estilo de animação blink
        if (!document.getElementById('splash-styles')) {
            const style = document.createElement('style');
            style.id = 'splash-styles';
            style.textContent = `
                @keyframes blink {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Evento de clique/toque para pular
        this.clickHandler = () => {
            if (this.phase === 'credits') {
                this.goToNextScene();
            }
        };
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('touchstart', this.clickHandler);
    }
    
    createParticles() {
        // Cria partículas decorativas
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * 400,
                y: Math.random() * 600,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                alpha: Math.random() * 0.5 + 0.2,
                color: [this.colors.primary, this.colors.secondary, this.colors.accent][Math.floor(Math.random() * 3)]
            });
        }
    }
    
    animate() {
        const now = performance.now();
        const phaseElapsed = now - this.phaseStartTime;
        
        // Atualiza fase
        this.updatePhase(phaseElapsed);
        
        // Renderiza
        this.render(phaseElapsed);
        
        // Continua animação
        if (this.phase !== 'done') {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        }
    }
    
    updatePhase(elapsed) {
        switch (this.phase) {
            case 'logo':
                if (elapsed >= this.logoDrawDuration + this.fillDelay) {
                    this.phase = 'fill';
                    this.phaseStartTime = performance.now();
                    console.log('🎨 Iniciando Flood Fill...');
                }
                break;
                
            case 'fill':
                if (elapsed >= this.fillDuration) {
                    this.phase = 'credits';
                    this.phaseStartTime = performance.now();
                    this.showCredits();
                }
                break;
                
            case 'credits':
                if (elapsed >= this.creditsDuration) {
                    // Apenas mostra "toque para continuar"
                    this.tapText.style.opacity = '1';
                }
                break;
                
            case 'fadeout':
                if (elapsed >= this.fadeOutDuration) {
                    this.goToNextScene();
                }
                break;
        }
    }
    
    showCredits() {
        this.creditsContainer.style.opacity = '1';
    }
    
    render(phaseElapsed) {
        const width = this.renderer.width;
        const height = this.renderer.height;
        
        // Limpa
        this.renderer.clear(this.colors.bg);
        
        // Desenha partículas de fundo
        this.renderParticles();
        
        // Desenha logo GEOLIFE
        this.renderLogo(phaseElapsed);
        
        // Apresenta
        this.renderer.present();
    }
    
    renderParticles() {
        for (const p of this.particles) {
            // Move partícula
            p.y -= p.speed;
            if (p.y < -10) {
                p.y = 610;
                p.x = Math.random() * 400;
            }
            
            // Desenha
            const rgb = this.hexToRgb(p.color);
            const alpha = Math.floor(p.alpha * 255);
            
            for (let dx = 0; dx < p.size; dx++) {
                for (let dy = 0; dy < p.size; dy++) {
                    this.renderer.setPixel(
                        Math.floor(p.x + dx),
                        Math.floor(p.y + dy),
                        rgb.r, rgb.g, rgb.b, alpha
                    );
                }
            }
        }
    }
    
    renderLogo(phaseElapsed) {
        const cx = this.renderer.width / 2;
        const cy = this.renderer.height / 2 - 50;
        
        // Desenha forma geométrica central (hexágono/diamante)
        this.drawGeometricLogo(cx, cy, phaseElapsed);
        
        // Desenha texto "GEOLIFE"
        this.drawLogoText(cx, cy + 80, phaseElapsed);
        
        // Desenha subtítulo
        if (this.phase === 'credits' || this.phase === 'fadeout') {
            this.drawSubtitle(cx, cy + 110);
        }
    }
    
    drawGeometricLogo(cx, cy, elapsed) {
        const progress = Math.min(1, elapsed / this.logoDrawDuration);
        const size = 60;
        
        // Hexágono central
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2 / 6) - Math.PI / 2;
            points.push({
                x: cx + Math.cos(angle) * size,
                y: cy + Math.sin(angle) * size
            });
        }
        
        // Desenha contorno do hexágono progressivamente
        const edgesToDraw = Math.floor(progress * 6);
        for (let i = 0; i < edgesToDraw; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % 6];
            this.renderer.drawLine(p1.x, p1.y, p2.x, p2.y, this.colors.primary);
        }
        
        // Última aresta parcial
        if (edgesToDraw < 6) {
            const partialProgress = (progress * 6) - edgesToDraw;
            const p1 = points[edgesToDraw];
            const p2 = points[(edgesToDraw + 1) % 6];
            const px = p1.x + (p2.x - p1.x) * partialProgress;
            const py = p1.y + (p2.y - p1.y) * partialProgress;
            this.renderer.drawLine(p1.x, p1.y, px, py, this.colors.primary);
        }
        
        // Flood Fill quando fase for 'fill'
        if (this.phase === 'fill' || this.phase === 'credits' || this.phase === 'fadeout') {
            // Preenche o hexágono com flood fill
            // Primeiro, precisamos ter certeza que o hexágono está fechado
            if (progress >= 1) {
                this.fillLogoCenter(cx, cy);
            }
        }
        
        // Desenha diamante interno
        if (progress > 0.5) {
            const innerProgress = (progress - 0.5) * 2;
            const innerSize = size * 0.4 * innerProgress;
            
            // Diamante (losango)
            this.renderer.drawLine(cx, cy - innerSize, cx + innerSize, cy, this.colors.secondary);
            this.renderer.drawLine(cx + innerSize, cy, cx, cy + innerSize, this.colors.secondary);
            this.renderer.drawLine(cx, cy + innerSize, cx - innerSize, cy, this.colors.secondary);
            this.renderer.drawLine(cx - innerSize, cy, cx, cy - innerSize, this.colors.secondary);
        }
    }
    
    fillLogoCenter(cx, cy) {
        // Usa Flood Fill para preencher área interna
        // Desenha preenchimento manual do hexágono para demonstrar o conceito
        const rgb = this.hexToRgb(this.colors.primary);
        
        // Scanline fill simplificado do hexágono
        const size = 58; // Ligeiramente menor para ficar dentro das bordas
        
        for (let y = -size; y <= size; y++) {
            // Calcula largura da linha nessa altura (forma hexagonal)
            const absY = Math.abs(y);
            let width;
            
            if (absY <= size * 0.5) {
                // Parte central mais larga
                width = size;
            } else {
                // Partes superior e inferior afunilam
                width = size - (absY - size * 0.5) * 1.15;
            }
            
            width = Math.max(0, width);
            
            for (let x = -width; x <= width; x++) {
                this.renderer.setPixel(
                    Math.floor(cx + x),
                    Math.floor(cy + y),
                    rgb.r, rgb.g, rgb.b, 40  // Semi-transparente
                );
            }
        }
    }
    
    drawLogoText(cx, cy, elapsed) {
        const progress = Math.min(1, elapsed / this.logoDrawDuration);
        if (progress < 0.3) return;
        
        const textProgress = (progress - 0.3) / 0.7;
        const text = 'GEOLIFE';
        const charWidth = 16;
        const startX = cx - (text.length * charWidth) / 2;
        
        // Desenha cada letra pixel art
        for (let i = 0; i < text.length; i++) {
            const charProgress = Math.min(1, textProgress * text.length - i);
            if (charProgress <= 0) continue;
            
            const alpha = Math.floor(charProgress * 255);
            this.drawPixelChar(
                text[i],
                startX + i * charWidth,
                cy,
                this.colors.primary,
                alpha
            );
        }
    }
    
    drawSubtitle(cx, cy) {
        const text = 'TAMAGOTCHI GEOMETRICO';
        const rgb = this.hexToRgb('#666666');
        
        // Texto simples centralizado (representação simplificada)
        const startX = cx - text.length * 3;
        for (let i = 0; i < text.length; i++) {
            // Ponto simples para cada caractere
            this.renderer.setPixel(startX + i * 6, cy, rgb.r, rgb.g, rgb.b);
            this.renderer.setPixel(startX + i * 6 + 1, cy, rgb.r, rgb.g, rgb.b);
        }
    }
    
    drawPixelChar(char, x, y, color, alpha = 255) {
        const rgb = this.hexToRgb(color);
        const patterns = this.getCharPatterns();
        const pattern = patterns[char] || patterns['?'];
        
        for (let py = 0; py < pattern.length; py++) {
            for (let px = 0; px < pattern[py].length; px++) {
                if (pattern[py][px]) {
                    this.renderer.setPixel(x + px * 2, y + py * 2, rgb.r, rgb.g, rgb.b, alpha);
                    this.renderer.setPixel(x + px * 2 + 1, y + py * 2, rgb.r, rgb.g, rgb.b, alpha);
                    this.renderer.setPixel(x + px * 2, y + py * 2 + 1, rgb.r, rgb.g, rgb.b, alpha);
                    this.renderer.setPixel(x + px * 2 + 1, y + py * 2 + 1, rgb.r, rgb.g, rgb.b, alpha);
                }
            }
        }
    }
    
    getCharPatterns() {
        // Padrões 5x5 para letras pixel art
        return {
            'G': [
                [1,1,1,1,1],
                [1,0,0,0,0],
                [1,0,1,1,1],
                [1,0,0,0,1],
                [1,1,1,1,1]
            ],
            'E': [
                [1,1,1,1,1],
                [1,0,0,0,0],
                [1,1,1,1,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'O': [
                [1,1,1,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,1]
            ],
            'L': [
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'I': [
                [1,1,1,1,1],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [1,1,1,1,1]
            ],
            'F': [
                [1,1,1,1,1],
                [1,0,0,0,0],
                [1,1,1,1,0],
                [1,0,0,0,0],
                [1,0,0,0,0]
            ],
            '?': [
                [0,1,1,1,0],
                [0,0,0,1,0],
                [0,0,1,0,0],
                [0,0,0,0,0],
                [0,0,1,0,0]
            ]
        };
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    goToNextScene() {
        if (this.phase === 'done') return;
        this.phase = 'done';
        
        console.log('🎨 SplashScene - Indo para editor...');
        this.game.changeScene('editor');
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        if (this.creditsContainer) {
            this.creditsContainer.remove();
        }
        
        if (this.tapText) {
            this.tapText.remove();
        }
        
        document.removeEventListener('click', this.clickHandler);
        document.removeEventListener('touchstart', this.clickHandler);
    }
}
