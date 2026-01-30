// ═══════════════════════════════════════════════════════════════════
// IRIS SCENE - Cena de Abertura com Efeito Íris (Elipse)
// Demonstra algoritmo de Elipse (Bresenham Midpoint)
// Estilo Looney Tunes - círculo/elipse se abrindo
// ═══════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import { drawIrisMask, drawFilledEllipse } from '../algorithms/Ellipse.js';

export default class IrisScene {
    constructor(game) {
        this.game = game;
        this.renderer = null;
        this.canvas = null;
        this.animationFrame = null;
        
        // Estado da animação
        this.progress = 0;           // 0 a 1
        this.duration = 1500;        // 1.5 segundos
        this.startTime = null;
        this.isClosing = false;      // false = abrindo, true = fechando
        
        // Callback quando terminar
        this.onComplete = null;
        this.nextScene = 'splash';
        this.nextSceneData = null;
    }
    
    init(data) {
        console.log('🎬 IrisScene - Iniciando efeito de abertura...');
        
        // Garante que data seja um objeto válido
        if (!data || typeof data !== 'object') {
            data = {};
        }
        
        // Configurações opcionais
        if (data && data.closing) {
            this.isClosing = true;
            this.progress = 1;
        }
        if (data.duration) {
            this.duration = data.duration;
        }
        if (data.nextScene) {
            this.nextScene = data.nextScene;
        }
        if (data.nextSceneData) {
            this.nextSceneData = data.nextSceneData;
        }
        if (data.onComplete) {
            this.onComplete = data.onComplete;
        }
        
        this.setupCanvas();
        this.startTime = performance.now();
        this.animate();
    }
    
    setupCanvas() {
        const container = document.getElementById('game-container');
        
        // Cria canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'iris-canvas';
        this.canvas.width = 400;
        this.canvas.height = 600;
        this.canvas.style.cssText = `
            display: block;
            margin: 0 auto;
            background: #000;
            max-width: 100%;
            max-height: 100vh;
        `;
        
        container.appendChild(this.canvas);
        
        // Inicializa renderer
        this.renderer = new Renderer(this.canvas, {
            width: 400,
            height: 600,
            useDPR: true
        });
    }
    
    animate() {
        const now = performance.now();
        const elapsed = now - this.startTime;
        
        // Calcula progresso (0 a 1)
        this.progress = Math.min(1, elapsed / this.duration);
        
        // Easing: ease-out cubic
        const eased = this.isClosing 
            ? 1 - this.easeOutCubic(this.progress)
            : this.easeOutCubic(this.progress);
        
        // Renderiza
        this.render(eased);
        
        // Continua animação ou finaliza
        if (this.progress < 1) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.complete();
        }
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeInCubic(t) {
        return t * t * t;
    }
    
    render(progress) {
        const width = this.renderer.width;
        const height = this.renderer.height;
        const cx = width / 2;
        const cy = height / 2;
        
        // Limpa canvas (preto)
        this.renderer.clear('#000000');
        
        // Calcula tamanho da elipse baseado no progresso
        // Começa pequeno e cresce até cobrir toda a tela
        const maxRx = width * 0.8;
        const maxRy = height * 0.6;
        
        const rx = maxRx * progress;
        const ry = maxRy * progress;
        
        if (rx > 1 && ry > 1) {
            // Desenha área visível (elipse "transparente")
            // Na verdade desenhamos o buraco primeiro com cor de fundo
            // e depois a máscara preta ao redor
            
            // Preenche toda a área da elipse com cor de transição
            // (simula o que vai aparecer por baixo)
            drawFilledEllipse(this.renderer, cx, cy, rx, ry, '#0a0a0f');
            
            // Desenha máscara preta ao redor da elipse
            drawIrisMask(this.renderer, cx, cy, rx, ry, '#000000');
        }
        
        // Aplica ao canvas
        this.renderer.present();
    }
    
    complete() {
        console.log('🎬 IrisScene - Animação completa!');
        
        if (this.onComplete) {
            this.onComplete();
        } else {
            // Muda para próxima cena
            this.game.changeScene(this.nextScene, this.nextSceneData);
        }
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
    }
}
