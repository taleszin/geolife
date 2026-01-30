// ═══════════════════════════════════════════════════════════════════
// GEOLIFE - Main Entry Point
// Tamagotchi Geométrico com Canvas Puro
// 
// Desenvolvido por: dev taleszin
// © 2026 Todos os direitos reservados
// ═══════════════════════════════════════════════════════════════════

import IrisScene from './scenes/IrisScene.js';
import SplashScene from './scenes/SplashScene.js';
import EditorScene from './scenes/EditorScene.js';
import HomeScene from './scenes/HomeScene.js';

class Game {
    constructor() {
        this.currentScene = null;
        this.scenes = {
            iris: IrisScene,
            splash: SplashScene,
            editor: EditorScene,
            home: HomeScene
        };
        
        // Versão e créditos
        this.version = '1.0.0';
        this.author = 'dev taleszin';
        this.year = 2026;
    }
    
    init() {
        console.log('🎮 GEOLIFE - Iniciando...');
        console.log(`📝 Versão: ${this.version}`);
        console.log(`👤 Desenvolvido por: ${this.author}`);
        console.log(`📅 © ${this.year} Todos os direitos reservados`);
        
        // Mostrar containers
        document.getElementById('game-container').style.opacity = '1';
        document.getElementById('game-container').style.pointerEvents = 'auto';
        document.getElementById('ui-layer').style.opacity = '1';
        
        // Iniciar com efeito de abertura (íris → splash → editor)
        this.changeScene('iris');
    }
    
    changeScene(sceneName, data = null) {
        console.log(`📍 Mudando para cena: ${sceneName}`);
        
        // Destroy current scene
        if (this.currentScene) {
            this.currentScene.destroy();
            this.currentScene = null;
        }
        
        // Limpa containers
        document.getElementById('game-container').innerHTML = '';
        document.getElementById('ui-layer').innerHTML = '';
        
        // Create new scene
        const SceneClass = this.scenes[sceneName];
        if (SceneClass) {
            this.currentScene = new SceneClass(this);
            this.currentScene.init(data);
        } else {
            console.error(`Cena não encontrada: ${sceneName}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
    // Detecta touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
    
    // Cria instância global do jogo
    window.geolife = new Game();
    window.geolife.init();
});

// Previne zoom no mobile
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
