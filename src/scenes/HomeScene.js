// ═══════════════════════════════════════════════════════════════════
// HOME SCENE - Quarto do GeoPet
// Movimento básico + interação (alimentar) + sistema de falas
// Com minimapa simples no canto superior direito
// ═══════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import GeoPet, { MOOD_TYPES, MOOD_LABELS } from '../entities/GeoPet.js';
import { UISoundSystem } from '../systems/UISoundSystem.js';
import { PetVoiceSystem } from '../systems/PetVoiceSystem.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import MaterializationSystem from '../systems/MaterializationSystem.js';
import { PetEffectsSystem } from '../systems/PetEffectsSystem.js';
import { InteractionHistorySystem, INTERACTION_TYPES } from '../systems/InteractionHistorySystem.js';

export default class HomeScene {
    constructor(game) {
        this.game = game;
        this.renderer = null;
        this.canvas = null;
        
        // Pet
        this.pet = null;
        this.petData = null;
        
        // Sistema de Materialização
        this.materializationSystem = new MaterializationSystem();
        this.isFirstSpawn = true; // Flag para nascimento inicial
        
        // Sistema de Efeitos
        this.effectsSystem = PetEffectsSystem;
        
        // Sem cooldowns - jogador pode interagir livremente
        
        // UI Elements
        this.hungerBar = null;
        
        // Background image
        this.backgroundImage = null;
        this.backgroundLoaded = false;
        
        // Room bounds - será calculado dinamicamente baseado no canvas
        this.roomBounds = {
            x: 0,
            y: 0,
            width: 800,
            height: 600
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // MINIMAPA - Canvas separado em escala reduzida
        // ═══════════════════════════════════════════════════════════════════
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.minimapScale = 0.15; // 15% do tamanho original
        
        // Food
        this.food = null;
        this.foodSpawnTimer = 0;
        
        // Animation
        this.animationFrame = null;
        this.lastTime = 0;
        
        // Wandering
        this.wanderTimer = 0;
        this.wanderInterval = 3000;
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE COLAPSO / GAME OVER
        // ═══════════════════════════════════════════════════════════════════
        this.isGameOver = false;
        this.gameOverProgress = 0;
        this.lastCollapseDialogueTime = 0;
        this.collapseDialogueInterval = 1500; // Falas mais rápidas durante colapso
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE SEGURAR E ARREMESSAR (Grab & Throw)
        // ═══════════════════════════════════════════════════════════════════
        this.isGrabbing = false;                  // Está segurando o pet?
        this.wasGrabbing = false;                 // Estava segurando (para ignorar click)
        this.clickedOnPet = false;                // Clicou no pet (para ignorar onClick)
        this.grabStartTime = 0;                   // Tempo que começou a segurar
        this.grabHoldThreshold = 150;             // Ms para considerar "hold" vs "click"
        this.grabPositions = [];                  // Histórico de posições para calcular velocidade
        this.maxGrabPositions = 10;               // Quantas posições guardar (aumentado)
        this.lastGrabPos = { x: 0, y: 0 };        // Última posição do cursor
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════
    
    init(petData) {
        this.petData = petData;
        this.createCanvas();
        this.createMinimap();
        this.createUI();
        this.createPet();
        this.setupDialogueSystem();
        this.startLoop();
        this.startHungerDecay();
        
        // Som de abertura
        UISoundSystem.playOpen();
        
        // Inicia materialização do pet (efeito de nascimento)
        this.startMaterialization();
    }
    
    /**
     * Inicia efeito de materialização cyber-alquímica
     */
    startMaterialization(mode = 'scanline') {
        // Escolhe modo baseado na forma ou aleatório
        const modes = ['scanline', 'radial', 'glitch', 'spiral'];
        const selectedMode = mode || modes[Math.floor(Math.random() * modes.length)];
        
        this.materializationSystem.start(this.pet, this.renderer, selectedMode);
        
        // Callback quando materialização completa
        this.materializationSystem.onComplete = () => {
            // Pet "nasce" e faz som
            PetVoiceSystem.playBirth(this.pet.shapeId);
            
            // Saudação após nascimento
            setTimeout(() => {
                const greeting = DialogueSystem.speak(
                    this.isFirstSpawn ? 'birth' : 'greeting', 
                    'happy', 
                    this.pet.shapeId
                );
                this.pet.say(greeting, this.isFirstSpawn ? 'birth' : 'greeting');
                this.isFirstSpawn = false;
            }, 300);
        };
        
        // Callback de progresso (opcional, para UI)
        this.materializationSystem.onProgress = (progress) => {
            // Poderia atualizar uma barra de "síntese" na UI
        };
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.hungerDecayInterval) {
            clearInterval(this.hungerDecayInterval);
        }
        
        // Remove resize listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        // Remove minimapa
        if (this.minimapCanvas) {
            this.minimapCanvas.remove();
        }
        
        // Remove UI
        const uiContainer = document.getElementById('home-ui');
        if (uiContainer) uiContainer.remove();
        
        // Remove canvas
        if (this.canvas) this.canvas.remove();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CANVAS SETUP
    // ═══════════════════════════════════════════════════════════════════
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'home-canvas';
        
        // Carrega imagem de fundo
        this.backgroundImage = new Image();
        this.backgroundImage.onload = () => {
            this.backgroundLoaded = true;
        };
        // Detecta o base path automaticamente
        const basePath = document.querySelector('base')?.href || window.location.pathname.replace(/[^/]*$/, '');
        this.backgroundImage.src = `${basePath}background.png`;
        
        // Calcula tamanho responsivo
        this.updateCanvasSize();
        
        const container = document.getElementById('game-container');
        container.appendChild(this.canvas);
        
        this.renderer = new Renderer(this.canvas);
        
        // ═══ SISTEMA DE SEGURAR E ARREMESSAR (Mouse) ═══
        this.canvas.addEventListener('mousedown', (e) => this.onGrabStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onGrabEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onGrabEnd(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        
        // Touch events para mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        
        // Resize listener
        this.resizeHandler = () => {
            this.updateCanvasSize();
            this.updateMinimapSize();
        };
        window.addEventListener('resize', this.resizeHandler);
    }
    
    /**
     * Cria o minimapa - um canvas menor no canto superior direito
     * Clicável para teleportar o pet
     */
    createMinimap() {
        const container = document.getElementById('game-container');
        
        this.minimapCanvas = document.createElement('canvas');
        this.minimapCanvas.id = 'minimap-canvas';
        this.minimapCanvas.className = 'minimap';
        
        // Estilo do minimapa
        Object.assign(this.minimapCanvas.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            borderRadius: '8px',
            border: '2px solid rgba(0, 255, 255, 0.6)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.5)',
            zIndex: '50',
            pointerEvents: 'auto', // HABILITADO para cliques
            opacity: '0.9',
            cursor: 'pointer'
        });
        
        container.appendChild(this.minimapCanvas);
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Eventos de click no minimapa para teleportar o pet
        this.minimapCanvas.addEventListener('click', (e) => this.onMinimapClick(e));
        this.minimapCanvas.addEventListener('touchstart', (e) => this.onMinimapTouch(e), { passive: false });
        
        this.updateMinimapSize();
    }
    
    /**
     * Atualiza tamanho do minimapa baseado no canvas principal
     */
    updateMinimapSize() {
        if (!this.minimapCanvas) return;
        
        // Minimapa é 15% do tamanho lógico do canvas
        const isMobile = window.innerWidth <= 800;
        this.minimapScale = isMobile ? 0.12 : 0.15;
        
        // Usa dimensões lógicas para cálculo consistente
        const logicalW = this.logicalWidth || this.canvas.width;
        const logicalH = this.logicalHeight || this.canvas.height;
        
        this.minimapCanvas.width = Math.floor(logicalW * this.minimapScale);
        this.minimapCanvas.height = Math.floor(logicalH * this.minimapScale);
        
        // Define tamanho CSS também para consistência
        this.minimapCanvas.style.width = `${this.minimapCanvas.width}px`;
        this.minimapCanvas.style.height = `${this.minimapCanvas.height}px`;
        
        // Ajusta posição em mobile
        if (isMobile) {
            this.minimapCanvas.style.top = '5px';
            this.minimapCanvas.style.right = '5px';
        } else {
            this.minimapCanvas.style.top = '10px';
            this.minimapCanvas.style.right = '10px';
        }
    }
    
    /**
     * Handler de click no minimapa - teleporta o pet para a posição clicada
     */
    onMinimapClick(e) {
        e.stopPropagation();
        
        const rect = this.minimapCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Converte coordenadas do minimapa para coordenadas do jogo
        const gameX = clickX / this.minimapScale;
        const gameY = clickY / this.minimapScale;
        
        // Verifica se está dentro dos limites do quarto
        if (this.isInsideRoom(gameX, gameY)) {
            this.pet.moveTo(gameX, gameY);
            this.showHint('🗺️ Teleportando para o ponto clicado!');
            UISoundSystem.playClick('confirm');
        }
    }
    
    /**
     * Handler de touch no minimapa - teleporta o pet para a posição tocada
     */
    onMinimapTouch(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        const rect = this.minimapCanvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Converte coordenadas do minimapa para coordenadas do jogo
        const gameX = touchX / this.minimapScale;
        const gameY = touchY / this.minimapScale;
        
        // Verifica se está dentro dos limites do quarto
        if (this.isInsideRoom(gameX, gameY)) {
            this.pet.moveTo(gameX, gameY);
            this.showHint('🗺️ Teleportando para o ponto tocado!');
            UISoundSystem.playClick('confirm');
        }
    }
    
    /**
     * Calcula tamanho do canvas (chamado na criação inicial)
     */
    calculateCanvasSize() {
        const isMobile = window.innerWidth <= 800;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        let width, height;
        
        if (isMobile) {
            if (isLandscape) {
                const maxWidth = window.innerWidth - 200;
                const maxHeight = window.innerHeight - 20;
                const aspectRatio = 16 / 10;
                if (maxWidth / maxHeight > aspectRatio) {
                    height = maxHeight;
                    width = height * aspectRatio;
                } else {
                    width = maxWidth;
                    height = width / aspectRatio;
                }
                width = Math.max(360, Math.floor(width));
                height = Math.max(225, Math.floor(height));
            } else {
                width = Math.floor(window.innerWidth - 10);
                const uiHeightPercent = 0.44;
                const availableHeight = window.innerHeight * (1 - uiHeightPercent) - 15;
                height = Math.floor(availableHeight);
                width = Math.max(320, width);
                height = Math.max(280, height);
            }
        } else {
            // Desktop: canvas grande no centro, UI lateral
            const maxWidth = Math.min(window.innerWidth - 260, 1200);
            const maxHeight = Math.min(window.innerHeight - 60, 900);
            const aspectRatio = 16 / 10;
            if (maxWidth / maxHeight > aspectRatio) {
                height = maxHeight;
                width = height * aspectRatio;
            } else {
                width = maxWidth;
                height = width / aspectRatio;
            }
            width = Math.max(400, Math.floor(width));
            height = Math.max(250, Math.floor(height));
        }
        
        // Armazena dimensões lógicas
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Define tamanho do canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Define CSS também para garantir consistência
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        this.updateRoomBounds(width, height);
    }
    
    /**
     * Atualiza os limites do quarto baseado nas dimensões
     */
    updateRoomBounds(width, height) {
        const isMobile = window.innerWidth <= 800;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        let margin = 0;
        if (!isMobile || isLandscape) {
            margin = Math.min(width, height) * 0.05;
        }
        
        this.roomBounds = {
            x: margin,
            y: margin,
            width: width - margin * 2,
            height: height - margin * 2
        };
        
        // Reposiciona pet se existir
        if (this.pet) {
            const ageScale = this.pet.getAgeScale ? this.pet.getAgeScale() : 1;
            const petRadius = this.pet.size * (this.pet.scale || 1) * ageScale * 0.8;
            
            this.pet.x = Math.max(
                this.roomBounds.x + petRadius,
                Math.min(this.roomBounds.x + this.roomBounds.width - petRadius, this.pet.x)
            );
            
            this.pet.y = Math.max(
                this.roomBounds.y + petRadius,
                Math.min(this.roomBounds.y + this.roomBounds.height - petRadius, this.pet.y)
            );
        }
    }
    
    /**
     * Atualiza tamanho do canvas de forma responsiva (chamado no resize)
     * Canvas expansivo que prioriza a visualização do pet
     */
    updateCanvasSize() {
        const isMobile = window.innerWidth <= 800;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        let width, height;
        
        if (isMobile) {
            if (isLandscape) {
                // Mobile landscape: canvas à esquerda, UI à direita (similar a desktop)
                const maxWidth = window.innerWidth - 200;
                const maxHeight = window.innerHeight - 20;
                
                // Mantém aspect ratio 16:10 no landscape
                const aspectRatio = 16 / 10;
                if (maxWidth / maxHeight > aspectRatio) {
                    height = maxHeight;
                    width = height * aspectRatio;
                } else {
                    width = maxWidth;
                    height = width / aspectRatio;
                }
                
                width = Math.max(360, Math.floor(width));
                height = Math.max(225, Math.floor(height));
            } else {
                // Mobile portrait: PREENCHE TODA A ÁREA DISPONÍVEL (sem aspect ratio fixo)
                // Usa toda a largura menos margens mínimas
                width = Math.floor(window.innerWidth - 10);
                
                // Calcula altura disponível: total menos UI embaixo
                // UI ocupa ~44vh, deixamos espaço seguro
                const uiHeightPercent = 0.44;
                const availableHeight = window.innerHeight * (1 - uiHeightPercent) - 15;
                height = Math.floor(availableHeight);
                
                // Garante mínimos razoáveis
                width = Math.max(320, width);
                height = Math.max(280, height);
            }
        } else {
            // Desktop: canvas grande no centro, UI lateral
            const maxWidth = Math.min(window.innerWidth - 260, 1200);
            const maxHeight = Math.min(window.innerHeight - 60, 900);
            
            // Aspect ratio 16:10 no desktop
            const aspectRatio = 16 / 10;
            if (maxWidth / maxHeight > aspectRatio) {
                height = maxHeight;
                width = height * aspectRatio;
            } else {
                width = maxWidth;
                height = width / aspectRatio;
            }
            
            width = Math.max(400, Math.floor(width));
            height = Math.max(250, Math.floor(height));
        }
        
        // Atualiza dimensões lógicas
        this.logicalWidth = width;
        this.logicalHeight = height;
        
        // Atualiza canvas
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        // Recria o renderer com novas dimensões
        if (this.renderer) {
            this.renderer = new Renderer(this.canvas, {
                useDPR: false,
                width: width,
                height: height
            });
        }
        
        // Atualiza roomBounds usando método compartilhado
        this.updateRoomBounds(width, height);
    }
    
    /**
     * Touch start handler para mobile
     */
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = this.getTouchPosition(touch);
        
        // Verifica se tocou no pet
        if (this.isPetAtPosition(pos.x, pos.y)) {
            this.startGrabbing(pos.x, pos.y);
        } else if (this.isInsideRoom(pos.x, pos.y)) {
            if (this.food && this.isNearFood(pos.x, pos.y)) {
                this.pet.moveTo(this.food.x, this.food.y);
            } else {
                this.pet.moveTo(pos.x, pos.y);
            }
        }
    }
    
    /**
     * Touch move handler para eye tracking e grab em mobile
     */
    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = this.getTouchPosition(touch);
        
        if (this.isGrabbing && this.pet.isHeld) {
            this.updateGrabbing(pos.x, pos.y);
        } else {
            this.pet.lookAt(pos.x, pos.y);
        }
    }
    
    /**
     * Touch end handler para soltar o pet
     */
    onTouchEnd(e) {
        e.preventDefault();
        if (this.isGrabbing) {
            this.endGrabbing();
        }
    }
    
    /**
     * Converte posição de touch para coordenadas do canvas
     */
    getTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }
    
    /**
     * Converte posição de mouse para coordenadas do canvas
     */
    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE SEGURAR E ARREMESSAR (Grab & Throw)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Mouse down - início do grab
     */
    onGrabStart(e) {
        const pos = this.getMousePosition(e);
        
        // Verifica se clicou no pet
        if (this.isPetAtPosition(pos.x, pos.y)) {
            e.preventDefault(); // Previne o click padrão
            this.clickedOnPet = true; // Marca que clicou no pet
            this.startGrabbing(pos.x, pos.y);
        } else {
            this.clickedOnPet = false;
        }
    }
    
    /**
     * Mouse move - atualiza grab ou eye tracking
     */
    onMouseMove(e) {
        const pos = this.getMousePosition(e);
        
        if (this.isGrabbing && this.pet && this.pet.isHeld) {
            // Se está segurando, atualiza posição do pet
            this.updateGrabbing(pos.x, pos.y);
        } else {
            // Caso contrário, pet olha para o mouse
            if (this.pet) {
                this.pet.lookAt(pos.x, pos.y);
            }
        }
    }
    
    /**
     * Mouse up / leave - fim do grab
     */
    onGrabEnd(e) {
        if (this.isGrabbing) {
            // Captura a última posição antes de soltar
            if (e.type !== 'mouseleave') {
                const pos = this.getMousePosition(e);
                this.grabPositions.push({ x: pos.x, y: pos.y, time: Date.now() });
            }
            this.endGrabbing();
        }
    }
    
    /**
     * Verifica se o pet está na posição
     */
    isPetAtPosition(x, y) {
        if (!this.pet || this.pet.isDead || this.pet.isCollapsing) return false;
        
        const ageScale = this.pet.getAgeScale ? this.pet.getAgeScale() : 1;
        const baseRadius = this.pet.size * (this.pet.scale || 1) * ageScale;
        // Garante um raio mínimo generoso para pets pequenos (bebês/adolescentes)
        const petRadius = Math.max(baseRadius * 2, 50);
        
        const dx = x - this.pet.x;
        const dy = y - this.pet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < petRadius;
    }
    
    /**
     * Inicia o processo de grab
     */
    startGrabbing(x, y) {
        if (!this.pet || this.pet.isDead || this.pet.isCollapsing) return;
        
        this.isGrabbing = true;
        this.grabStartTime = Date.now();
        this.grabPositions = [{ x, y, time: Date.now() }];
        this.lastGrabPos = { x, y };
        
        // Inicia hold no pet
        this.pet.startHold();
        
        // Move pet para posição inicial
        this.pet.updateHold(x, y);
        
        // Feedback sonoro
        UISoundSystem.playClick('special');
    }
    
    /**
     * Atualiza posição durante grab
     */
    updateGrabbing(x, y) {
        if (!this.isGrabbing || !this.pet || !this.pet.isHeld) return;
        if (x === undefined || y === undefined) return;
        
        const now = Date.now();
        
        // Atualiza posição do pet
        this.pet.updateHold(x, y);
        
        // Guarda histórico de posições para calcular velocidade
        this.grabPositions.push({ x, y, time: now });
        if (this.grabPositions.length > this.maxGrabPositions) {
            this.grabPositions.shift();
        }
        
        this.lastGrabPos = { x, y };
    }
    
    /**
     * Termina o grab (solta ou arremessa)
     */
    endGrabbing() {
        if (!this.isGrabbing || !this.pet) return;
        
        const holdDuration = Date.now() - this.grabStartTime;
        
        // Calcula velocidade de arremesso baseada no histórico de posições
        let velocity = this.calculateThrowVelocity();
        
        // Se não detectou movimento mas houve distância percorrida, usa fallback
        if (velocity.x === 0 && velocity.y === 0 && this.grabPositions.length >= 2) {
            const first = this.grabPositions[0];
            const last = this.grabPositions[this.grabPositions.length - 1];
            const dist = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
            if (dist > 10) {
                // Usa distância como indicador de força
                const angle = Math.atan2(last.y - first.y, last.x - first.x);
                const speed = Math.min(dist * 0.5, 20);
                velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
            }
        }
        
        // Solta o pet com a velocidade calculada
        if (this.pet.isHeld) {
            this.pet.release(velocity.x, velocity.y);
            
            // Feedback sonoro
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (speed > 2) {
                UISoundSystem.playShock(); // Som de arremesso
            }
        }
        
        this.wasGrabbing = true; // Marca para ignorar o click que vem junto
        this.isGrabbing = false;
        this.grabPositions = [];
    }
    
    /**
     * Calcula velocidade de arremesso baseada no movimento recente
     */
    calculateThrowVelocity() {
        if (this.grabPositions.length < 2) {
            return { x: 0, y: 0 };
        }
        
        // Pega as últimas posições (mais recentes = mais peso)
        const recent = this.grabPositions.slice(-5);
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        const dt = (last.time - first.time) / 1000; // em segundos
        if (dt < 0.001) return { x: 0, y: 0 }; // Evita divisão por zero
        
        // Calcula velocidade (fator maior = arremesso mais forte)
        const vx = (last.x - first.x) / dt * 0.5;
        const vy = (last.y - first.y) / dt * 0.5;
        
        return { x: vx, y: vy };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UI CREATION
    // ═══════════════════════════════════════════════════════════════════
    
    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'home-ui';
        uiContainer.innerHTML = `
            <div class="home-header">
                <h2 class="room-title" id="mood-display">😊 Feliz</h2>
                
                <!-- Info de Idade, Vitalidade e Personalidade -->
                <div class="pet-info-row" id="pet-info-row">
                    <span class="pet-age" id="pet-age">🌱 Infante</span>
                    <span class="pet-personality" id="pet-personality">☀️ Radiante</span>
                    <span class="pet-vitality" id="pet-vitality">❤️ 75%</span>
                </div>
                
                <div class="stats-panel">
                    <div class="stat">
                        <span class="stat-label">FOME</span>
                        <div class="stat-bar">
                            <div class="stat-fill" id="hunger-bar"></div>
                        </div>
                    </div>
                    <div class="stat">
                        <span class="stat-label">FELICIDADE</span>
                        <div class="stat-bar">
                            <div class="stat-fill happiness" id="happiness-bar"></div>
                        </div>
                    </div>
                    <div class="stat">
                        <span class="stat-label">ENERGIA</span>
                        <div class="stat-bar">
                            <div class="stat-fill energy" id="energy-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="home-actions">
                <span class="wellness-label">💚 BEM-ESTAR</span>
                <button id="feed-btn" class="action-btn positive">🍎 Alimentar</button>
                <button id="heal-btn" class="action-btn positive">💚 Curar</button>
                <button id="tickle-btn" class="action-btn positive">🪶 Cócegas</button>
                <button id="wash-btn" class="action-btn positive">💧 Banho</button>
            </div>
            
            <div class="home-actions-chaos">
                <span class="chaos-label">⚠️ CAOS</span>
                <button id="shock-btn" class="action-btn danger">⚡ Choque</button>
                <button id="freeze-btn" class="action-btn danger">❄️ Congelar</button>
                <button id="mutate-btn" class="action-btn danger">🔮 Mutar</button>
                <button id="ignite-btn" class="action-btn danger">🔥 Fogo</button>
                <button id="fragment-btn" class="action-btn danger">🧬 Fragmentar</button>
                <button id="slice-btn" class="action-btn danger">⚔️ Cortar</button>
            </div>
            
            <div class="home-actions-special">
                <span class="special-label">✨ ESPECIAIS</span>
                <button id="fragment-btn" class="action-btn special">🧬 Fragmentar</button>
                <button id="ignite-btn" class="action-btn special">🔥 Fogo</button>
                <button id="wash-btn" class="action-btn special">💧 Água</button>
                <button id="slice-btn" class="action-btn special">⚔️ Cortar</button>
            </div>
            
            <div class="home-actions-secondary">
                <button id="edit-btn" class="action-btn secondary">✏️ Editar</button>
            </div>
            
            <div class="hint-text" id="hint-text">Clique no chão para mover seu GeoPet!</div> 
        `;
        
        document.getElementById('ui-layer').appendChild(uiContainer);
        
        this.hungerBar = document.getElementById('hunger-bar');
        this.happinessBar = document.getElementById('happiness-bar');
        this.energyBar = document.getElementById('energy-bar');
        this.petAgeEl = document.getElementById('pet-age');
        this.petPersonalityEl = document.getElementById('pet-personality');
        this.petVitalityEl = document.getElementById('pet-vitality');
        
        // Bind events com sons - Ações positivas
        const feedBtn = document.getElementById('feed-btn');
        feedBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        feedBtn.addEventListener('click', () => this.feedPet());
        
        const tickleBtn = document.getElementById('tickle-btn');
        tickleBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        tickleBtn.addEventListener('click', () => this.ticklePet());
        
        const healBtn = document.getElementById('heal-btn');
        healBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        healBtn.addEventListener('click', () => this.healPet());
        
        // Bind events - Ações de caos
        const shockBtn = document.getElementById('shock-btn');
        shockBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        shockBtn.addEventListener('click', () => this.shockPet());
        
        const freezeBtn = document.getElementById('freeze-btn');
        freezeBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        freezeBtn.addEventListener('click', () => this.freezePet());
        
        const mutateBtn = document.getElementById('mutate-btn');
        mutateBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        mutateBtn.addEventListener('click', () => this.mutatePet());
        
        // Bind events - Ações especiais
        const fragmentBtn = document.getElementById('fragment-btn');
        fragmentBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        fragmentBtn.addEventListener('click', () => this.fragmentPet());
        
        const igniteBtn = document.getElementById('ignite-btn');
        igniteBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        igniteBtn.addEventListener('click', () => this.ignitePet());
        
        const washBtn = document.getElementById('wash-btn');
        washBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        washBtn.addEventListener('click', () => this.washPet());
        
        const sliceBtn = document.getElementById('slice-btn');
        sliceBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        sliceBtn.addEventListener('click', () => this.slicePet());
        
        const editBtn = document.getElementById('edit-btn');
        editBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        editBtn.addEventListener('click', () => this.goToEditor());
    }
    

    
    // ═══════════════════════════════════════════════════════════════════
    // DIALOGUE SYSTEM SETUP
    // ═══════════════════════════════════════════════════════════════════
    
    setupDialogueSystem() {
        // Configura callback para quando o pet começa a falar
        this.pet.onSpeak = (text, emotion, context) => {
            // Não toca mais a voz completa aqui - será letra por letra
        };
        
        // Configura callback para cada letra digitada (som de voz)
        this.pet.onTypeLetter = (letter) => {
            PetVoiceSystem.playTypeLetter(this.pet.shapeId, letter);
        };
        
        // Timer para falas automáticas
        this.autoDialogueTimer = 0;
        this.autoDialogueInterval = 6000 + Math.random() * 4000; // 6-10 segundos
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PET CREATION
    // ═══════════════════════════════════════════════════════════════════
    
    createPet() {
        // Tamanho base do pet - será escalado pela idade
        const baseSize = 50; // Tamanho base fixo, a escala de idade cuida do resto
        
        this.pet = new GeoPet({
            ...this.petData,
            x: this.roomBounds.x + this.roomBounds.width / 2,
            y: this.roomBounds.y + this.roomBounds.height / 2,
            size: baseSize,
            scale: 1
        });
        
        // ═══════════════════════════════════════════════════════════════════
        // SETUP: Callbacks de Maturação (Age System)
        // ═══════════════════════════════════════════════════════════════════
        
        // Callback quando muda de estágio de idade
        this.pet.onAgeStageChange = (newStage, oldStage) => {
            // Gera fala de mudança de estágio
            const dialogue = DialogueSystem.generateAgeStageDialogue(newStage, oldStage, this.pet.shapeId);
            if (dialogue) {
                this.pet.say(dialogue, 'stageChange');
                PetVoiceSystem.speak('Yay!', this.pet.shapeId, 'happy');
                
                // Squash animado
                this.pet.squash(0.8, 1.3);
            }
        };
        
        // Callback de EFLORESCÊNCIA (quando atinge idade adulta)
        this.pet.onReachAdulthood = () => {
            this.triggerEfflorescence();
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // SETUP: Callbacks de Colapso/Morte
        // ═══════════════════════════════════════════════════════════════════
        
        // Callback quando inicia o colapso
        this.pet.onCollapseStart = () => {
            this.onCollapseStart();
        };
        
        // Callback de progresso do colapso
        this.pet.onCollapseProgress = (stage, progress) => {
            this.onCollapseProgress(stage, progress);
        };
        
        // Callback de morte completa
        this.pet.onDeath = () => {
            this.onPetDeath();
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE COLAPSO / MORTE
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Chamado quando o colapso sistêmico inicia
     */
    onCollapseStart() {
        console.log('💀 COLAPSO INICIADO - Pet está morrendo...');
        
        // Som de erro/glitch
        UISoundSystem.playShock();
        
        // Primeira fala de colapso
        const dialogue = DialogueSystem.speak('collapse_stage1', 'dying', this.pet.shapeId);
        this.pet.say(dialogue, 'collapse');
        this.lastCollapseDialogueTime = Date.now();
        
        // Vibração do dispositivo se disponível
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        // Esconde botões de interação
        const actionsContainer = document.querySelector('.home-actions');
        const chaosContainer = document.querySelector('.home-actions-chaos');
        if (actionsContainer) actionsContainer.style.opacity = '0.3';
        if (chaosContainer) chaosContainer.style.opacity = '0.3';
    }
    
    /**
     * Chamado a cada mudança de estágio do colapso
     */
    onCollapseProgress(stage, progress) {
        console.log(`☠️ Colapso estágio ${stage} - ${Math.floor(progress * 100)}%`);
        
        // Fala de quarta parede baseada no estágio
        const now = Date.now();
        if (now - this.lastCollapseDialogueTime > this.collapseDialogueInterval) {
            let context;
            if (stage <= 1) context = 'collapse_stage1';
            else if (stage <= 2) context = 'collapse_stage2';
            else if (stage <= 3) context = 'collapse_stage3';
            else context = 'collapse_final';
            
            const dialogue = DialogueSystem.speak(context, 'dying', this.pet.shapeId);
            this.pet.say(dialogue, 'collapse');
            this.lastCollapseDialogueTime = now;
            
            // Som de estática
            if (stage >= 2) {
                PetVoiceSystem.emote('dying', this.pet.shapeId);
            }
        }
        
        // Efeito de tela (shake)
        if (stage >= 2) {
            this.addScreenEffect('collapse');
        }
    }
    
    /**
     * Chamado quando o pet morre completamente
     */
    onPetDeath() {
        console.log('☠️ GAME OVER - Pet morreu');
        
        this.isGameOver = true;
        
        // Para o decay de fome
        if (this.hungerDecayInterval) {
            clearInterval(this.hungerDecayInterval);
        }
        
        // Som final
        UISoundSystem.playMutate();
        
        // Mostra tela de Game Over após um breve delay
        setTimeout(() => {
            this.showGameOverScreen();
        }, 1500);
    }
    
    /**
     * Mostra a tela de Game Over com estilo neon/cyber
     */
    showGameOverScreen() {
        // Remove UI existente
        const homeUI = document.getElementById('home-ui');
        if (homeUI) homeUI.style.display = 'none';
        
        // Cria overlay de game over
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.id = 'game-over-overlay';
        gameOverOverlay.className = 'game-over-overlay';
        gameOverOverlay.innerHTML = `
            <div class="game-over-content">
                <div class="game-over-glitch-container">
                    <h1 class="game-over-title" data-text="COLAPSO SISTÊMICO">GAME OVER!</h1>
                </div>
                
                <div class="game-over-message">
                    <p class="game-over-subtitle">memória liberada</p>
                    <p class="game-over-code">// seu GeoPet retornou ao vácuo digital</p>
                    <p class="game-over-code">// os dados foram fragmentados</p>
                    <p class="game-over-code">// return undefined;</p>
                </div>
                
                <div class="game-over-stats">
                    <span>idade alcançada: <strong>${this.pet.getAgeStageLabel()}</strong></span>
                    <span>personalidade: <strong>${this.pet.getPersonalityLabel()}</strong></span>
                </div>
                
                <div class="game-over-buttons">
                    <button id="new-pet-btn" class="game-over-btn primary">
                        <span class="btn-icon"></span>
                        <span class="btn-text">Novo GeoPet</span>
                    </button>
                    <button id="exit-btn" class="game-over-btn secondary">
                        <span class="btn-icon">🚪</span>
                        <span class="btn-text">Sair</span>
                    </button>
                </div>
                
                <div class="game-over-static"></div>
            </div>
        `;
        
        document.getElementById('game-container').appendChild(gameOverOverlay);
        
        // Eventos dos botões
        document.getElementById('new-pet-btn').addEventListener('click', () => {
            UISoundSystem.playClick('confirm');
            this.startNewGame();
        });
        
        document.getElementById('exit-btn').addEventListener('click', () => {
            UISoundSystem.playClose();
            this.exitGame();
        });
        
        // Animação de entrada
        setTimeout(() => {
            gameOverOverlay.classList.add('visible');
        }, 100);
        
        // Adiciona estilos de Game Over
        this.injectGameOverStyles();
    }
    
    /**
     * Injeta estilos CSS para tela de Game Over
     */
    injectGameOverStyles() {
        if (document.getElementById('game-over-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'game-over-styles';
        style.textContent = `
            .game-over-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #0a0a12 0%, #1a0a1a 50%, #0a0a12 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 1s ease;
            }
            
            .game-over-overlay.visible {
                opacity: 1;
            }
            
            .game-over-content {
                text-align: center;
                padding: 40px;
                position: relative;
            }
            
            .game-over-glitch-container {
                position: relative;
                margin-bottom: 30px;
            }
            
            .game-over-title {
                font-family: 'Courier New', monospace;
                font-size: clamp(1.5rem, 5vw, 3rem);
                color: #ff0066;
                text-shadow: 
                    0 0 10px #ff0066,
                    0 0 20px #ff0066,
                    0 0 40px #ff0066,
                    2px 2px 0 #00ffff,
                    -2px -2px 0 #00ffff;
                letter-spacing: 4px;
                animation: glitch-text 2s infinite;
                position: relative;
            }
            
            .game-over-title::before,
            .game-over-title::after {
                content: attr(data-text);
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
            }
            
            .game-over-title::before {
                animation: glitch-1 0.3s infinite;
                color: #00ffff;
                z-index: -1;
            }
            
            .game-over-title::after {
                animation: glitch-2 0.3s infinite;
                color: #ff0066;
                z-index: -2;
            }
            
            @keyframes glitch-text {
                0%, 100% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
            }
            
            @keyframes glitch-1 {
                0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
                20% { clip-path: inset(20% 0 60% 0); transform: translate(-5px); }
                40% { clip-path: inset(40% 0 40% 0); transform: translate(5px); }
                60% { clip-path: inset(60% 0 20% 0); transform: translate(-5px); }
                80% { clip-path: inset(80% 0 0% 0); transform: translate(5px); }
            }
            
            @keyframes glitch-2 {
                0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
                20% { clip-path: inset(80% 0 0% 0); transform: translate(5px); }
                40% { clip-path: inset(60% 0 20% 0); transform: translate(-5px); }
                60% { clip-path: inset(40% 0 40% 0); transform: translate(5px); }
                80% { clip-path: inset(20% 0 60% 0); transform: translate(-5px); }
            }
            
            .game-over-message {
                margin-bottom: 30px;
            }
            
            .game-over-subtitle {
                font-size: 1.2rem;
                color: #888;
                margin-bottom: 15px;
                font-style: italic;
            }
            
            .game-over-code {
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                color: #555;
                margin: 5px 0;
            }
            
            .game-over-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 40px;
                color: #00ffff;
                font-size: 0.9rem;
            }
            
            .game-over-stats strong {
                color: #fff;
            }
            
            .game-over-buttons {
                display: flex;
                gap: 20px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .game-over-btn {
                padding: 15px 30px;
                font-size: 1rem;
                font-family: 'Courier New', monospace;
                border: 2px solid;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            .game-over-btn.primary {
                background: linear-gradient(135deg, #00ffff22, #00ffff11);
                border-color: #00ffff;
                color: #00ffff;
                box-shadow: 0 0 20px #00ffff33, inset 0 0 20px #00ffff11;
            }
            
            .game-over-btn.primary:hover {
                background: linear-gradient(135deg, #00ffff44, #00ffff22);
                box-shadow: 0 0 30px #00ffff66, inset 0 0 30px #00ffff22;
                transform: scale(1.05);
            }
            
            .game-over-btn.secondary {
                background: linear-gradient(135deg, #ff006622, #ff006611);
                border-color: #ff0066;
                color: #ff0066;
                box-shadow: 0 0 20px #ff006633, inset 0 0 20px #ff006611;
            }
            
            .game-over-btn.secondary:hover {
                background: linear-gradient(135deg, #ff006644, #ff006622);
                box-shadow: 0 0 30px #ff006666, inset 0 0 30px #ff006622;
                transform: scale(1.05);
            }
            
            .btn-icon {
                font-size: 1.2rem;
            }
            
            .game-over-static {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 255, 255, 0.03) 2px,
                    rgba(255, 255, 255, 0.03) 4px
                );
                animation: static-noise 0.1s infinite;
                z-index: -1;
            }
            
            @keyframes static-noise {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            /* Efeito de colapso na tela durante a morte */
            .effect-collapse {
                animation: screen-shake 0.5s ease;
            }
            
            @keyframes screen-shake {
                0%, 100% { transform: translate(0); filter: none; }
                10% { transform: translate(-5px, 3px); }
                20% { transform: translate(5px, -3px); filter: hue-rotate(20deg); }
                30% { transform: translate(-3px, 5px); }
                40% { transform: translate(3px, -5px); filter: hue-rotate(-20deg); }
                50% { transform: translate(-5px, -3px); }
                60% { transform: translate(5px, 3px); filter: saturate(0.5); }
                70% { transform: translate(-3px, -5px); }
                80% { transform: translate(3px, 5px); filter: hue-rotate(10deg); }
                90% { transform: translate(-5px, 3px); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Inicia um novo jogo (volta ao editor)
     */
    startNewGame() {
        // Remove overlay de game over
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) overlay.remove();
        
        // Volta ao editor para criar novo pet
        this.game.changeScene('editor', null);
    }
    
    /**
     * Sai do jogo (volta à tela inicial ou fecha)
     */
    exitGame() {
        // Remove overlay de game over
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) overlay.remove();
        
        // Tenta voltar ao editor como fallback
        this.game.changeScene('editor', null);
    }
    
    /**
     * Evento de Eflorescência - Celebração visual quando pet vira adulto
     */
    triggerEfflorescence() {
        console.log('✧ EFLORESCÊNCIA - Pet atingiu maturidade! ✧');
        
        // Som especial
        PetVoiceSystem.playBirth(this.pet.shapeId);
        UISoundSystem.playSuccess();
        
        // Fala especial
        const dialogue = DialogueSystem.speak('stageChange_young_adult', 'happy', this.pet.shapeId);
        this.pet.say(dialogue, 'efflorescence');
        
        // Efeito de materialização celebrativo
        this.materializationSystem.start(this.pet, this.renderer, 'spiral');
        
        // Squash & Stretch celebrativo
        this.pet.squash(0.6, 1.6);
        setTimeout(() => this.pet.squash(1.4, 0.7), 200);
        setTimeout(() => this.pet.squash(0.9, 1.1), 400);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERACTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    onClick(e) {
        // Se estava segurando o pet OU se clicou no pet, não processa click normal
        if (this.wasGrabbing || this.clickedOnPet) {
            this.wasGrabbing = false;
            this.clickedOnPet = false;
            return;
        }
        
        const pos = this.getMousePosition(e);
        const x = pos.x;
        const y = pos.y;
        
        // Verifica se clicou dentro do quarto
        if (this.isInsideRoom(x, y)) {
            // Se tem comida e clicou nela
            if (this.food && this.isNearFood(x, y)) {
                this.pet.moveTo(this.food.x, this.food.y);
                return;
            }
            
            // Move o pet
            this.pet.moveTo(x, y);
            this.showHint('Seu GeoPet está se movendo!');
        }
    }

    isInsideRoom(x, y) {
        const b = this.roomBounds;
        return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
    }

    isNearFood(x, y) {
        if (!this.food) return false;
        const dx = x - this.food.x;
        const dy = y - this.food.y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
    }
    
    feedPet() {
        // Som de click
        UISoundSystem.playClick('confirm');
        
        // Spawn food no quarto
        const b = this.roomBounds;
        this.food = {
            x: b.x + 50 + Math.random() * (b.width - 100),
            y: b.y + 50 + Math.random() * (b.height - 100),
            size: 12,
            color: '#ff6b6b',
            pulsePhase: 0
        };
        
        this.showHint('Comida apareceu! Seu GeoPet vai até ela.');
        
        // Pet vai até a comida
        this.pet.moveTo(this.food.x, this.food.y);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // NOVAS INTERAÇÕES
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Aplica choque elétrico no pet
     */
    shockPet() {
        // Som
        UISoundSystem.playShock();
        
        // Aplica no pet
        this.pet.shock();
        
        // Registra maus tratos para o sistema de humor
        this.pet.registerMistreatment();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.SHOCK, {
            mood: this.pet.expressionState.mood,
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        // Fala de choque
        const dialogue = DialogueSystem.speak('shocked', 'shocked', this.pet.shapeId);
        this.pet.say(dialogue, 'shocked');
        
        this.showHint('⚡ ZZZAP! -20 felicidade, -15 energia');
        this.updateAllBars();
        
        // Efeito visual via CSS (shake + amarelado)
        this.addScreenEffect('shock');
    }
    
    /**
     * Congela o pet
     */
    freezePet() {
        // Som
        UISoundSystem.playFreeze();
        
        // Aplica no pet
        this.pet.freeze();
        
        // Registra maus tratos para o sistema de humor
        this.pet.registerMistreatment();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.FREEZE, {
            mood: this.pet.expressionState.mood,
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        // Fala
        const dialogue = DialogueSystem.speak('frozen', 'frozen', this.pet.shapeId);
        this.pet.say(dialogue, 'frozen');
        
        this.showHint('❄️ Congelando! -25 energia, -10 felicidade');
        this.updateAllBars();
        
        // Efeito visual via CSS
        this.addScreenEffect('freeze');
    }
    
    /**
     * Muta o pet para outra forma
     */
    mutatePet() {
        // Som
        UISoundSystem.playMutate();
        
        // Aplica no pet
        const result = this.pet.mutate(null, 5000);
        
        // Registra maus tratos para o sistema de humor
        this.pet.registerMistreatment();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.MUTATE, {
            mood: this.pet.expressionState.mood,
            originalShape: result.original,
            mutatedShape: result.mutated,
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        // Fala
        const dialogue = DialogueSystem.speak('mutating', 'mutating', result.original);
        this.pet.say(dialogue, 'mutating');
        
        this.showHint(`🔮 Mutando de ${result.original} para ${result.mutated}!`);
        this.updateAllBars();
        
        // Efeito visual via CSS
        this.addScreenEffect('mutate');
    }
    
    /**
     * Fragmenta o pet (mitose)
     */
    fragmentPet() {
        // Som especial
        UISoundSystem.playMutate(); // Usa mutate como base
        
        // Aplica fragmentação
        this.pet.fragment();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.MUTATE, {
            mood: this.pet.expressionState.mood,
            action: 'fragment',
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        this.showHint('🧬 Pet fragmentado em mitose!');
        this.updateAllBars();
        
        // Efeito visual
        this.addScreenEffect('mutate');
    }
    
    /**
     * Coloca fogo no pet
     */
    ignitePet() {
        // Som de fogo
        UISoundSystem.playShock(); // Usa shock como base
        
        // Coloca fogo
        this.pet.ignite();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.SHOCK, {
            mood: this.pet.expressionState.mood,
            action: 'ignite',
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        this.showHint('🔥 Pet pegando fogo!');
        this.updateAllBars();
        
        // Efeito visual
        this.addScreenEffect('shock');
    }
    
    /**
     * Dá banho no pet
     */
    washPet() {
        // Som de água
        UISoundSystem.playClick('special');
        
        // Dá banho
        this.pet.wash();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.TICKLE, {
            mood: this.pet.expressionState.mood,
            action: 'wash',
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        this.showHint('💧 Pet recebendo banho refrescante!');
        this.updateAllBars();
    }
    
    /**
     * Corta o pet ao meio
     */
    slicePet() {
        // Som de corte
        UISoundSystem.playShock();
        
        // Corta
        this.pet.slice();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.SHOCK, {
            mood: this.pet.expressionState.mood,
            action: 'slice',
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        this.showHint('⚔️ Pet cortado ao meio!');
        this.updateAllBars();
        
        // Efeito visual
        this.addScreenEffect('shock');
    }
    
    /**
     * Faz cócegas no pet
     */
    ticklePet() {
        // Som
        UISoundSystem.playTickle();
        
        // Aplica no pet
        this.pet.tickle();
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.TICKLE, {
            mood: this.pet.expressionState.mood,
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        // Fala
        const dialogue = DialogueSystem.speak('tickled', 'tickled', this.pet.shapeId);
        this.pet.say(dialogue, 'tickled');
        
        this.showHint('🪶 Hahaha! +15 felicidade');
        this.updateAllBars();
    }
    
    /**
     * Cura/restaura o pet
     */
    healPet() {
        // Som
        UISoundSystem.playHeal();
        
        // Aplica no pet
        this.pet.heal(30);
        
        // Registra no histórico
        InteractionHistorySystem.record(INTERACTION_TYPES.HEAL, {
            mood: this.pet.expressionState.mood,
            hunger: this.pet.hunger,
            happiness: this.pet.happiness,
            energy: this.pet.energy
        });
        
        // Fala
        const dialogue = DialogueSystem.speak('healed', 'love', this.pet.shapeId);
        this.pet.say(dialogue, 'healed');
        
        this.showHint('💚 Curado! +30 stats');
        this.updateAllBars();
        
        this.addScreenEffect('heal');
    }
    
    /**
     * Adiciona efeito visual temporário na tela
     */
    addScreenEffect(type) {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        container.classList.add(`effect-${type}`);
        
        // Remove após a animação
        const durations = {
            shock: 2000,
            freeze: 4000,
            mutate: 3000,
            heal: 1000,
            collapse: 500
        };
        
        setTimeout(() => {
            container.classList.remove(`effect-${type}`);
        }, durations[type] || 1000);
    }
    
    /**
     * Atualiza todas as barras de stats
     */
    updateAllBars() {
        this.updateHungerBar();
        this.updateHappinessBar();
        this.updateEnergyBar();
        this.updatePetInfo();
    }
    
    updatePetInfo() {
        if (!this.pet) return;
        
        // Atualiza Idade (Stage)
        if (this.petAgeEl) {
            const stageIcons = {
                'infant': '👶',
                'young': '🧒',
                'adult': '🧑'
            };
            const stageNames = {
                'infant': 'Bebê',
                'young': 'Adolescente',
                'adult': 'Adulto'
            };
            const stage = this.pet.ageStage || 'infant';
            this.petAgeEl.textContent = `${stageIcons[stage]} ${stageNames[stage]}`;
            
            // Cor baseada no estágio
            if (stage === 'infant') {
                this.petAgeEl.style.color = '#ffb6c1';
            } else if (stage === 'young') {
                this.petAgeEl.style.color = '#87ceeb';
            } else {
                this.petAgeEl.style.color = '#98fb98';
            }
        }
        
        // Atualiza Personalidade
        if (this.petPersonalityEl) {
            const personalityIcons = {
                'radiant': '☀️',
                'melancholic': '🌙',
                'unstable': '⚡',
                'protective': '🛡️'
            };
            const personalityNames = {
                'radiant': 'Radiante',
                'melancholic': 'Melancólico',
                'unstable': 'Instável',
                'protective': 'Protetor'
            };
            const personality = this.pet.personality || 'radiant';
            this.petPersonalityEl.textContent = `${personalityIcons[personality]} ${personalityNames[personality]}`;
            
            // Cor baseada na personalidade
            const personalityColors = {
                'radiant': '#ffd93d',
                'melancholic': '#a29bfe',
                'unstable': '#ff6b6b',
                'protective': '#74b9ff'
            };
            this.petPersonalityEl.style.color = personalityColors[personality];
        }
        
        // Atualiza Vitalidade
        if (this.petVitalityEl) {
            const vitality = Math.round((this.pet.vitalitySmoothed || this.pet.vitality || 0.5) * 100);
            const isApex = this.pet.isAtApex;
            
            // Ícone baseado na vitalidade
            let icon = '💀';
            if (vitality >= 90) icon = '💖';
            else if (vitality >= 70) icon = '❤️';
            else if (vitality >= 50) icon = '🧡';
            else if (vitality >= 30) icon = '💛';
            else icon = '💔';
            
            if (isApex) {
                this.petVitalityEl.textContent = `✨ ÁPICE ✨`;
                this.petVitalityEl.style.color = '#ffd700';
                this.petVitalityEl.style.textShadow = '0 0 8px #ffd700';
            } else {
                this.petVitalityEl.textContent = `${icon} ${vitality}%`;
                this.petVitalityEl.style.textShadow = 'none';
                
                // Cor baseada na vitalidade
                if (vitality >= 70) {
                    this.petVitalityEl.style.color = '#00ff88';
                } else if (vitality >= 40) {
                    this.petVitalityEl.style.color = '#ffaa00';
                } else {
                    this.petVitalityEl.style.color = '#ff4444';
                }
            }
        }
    }
    
    updateHappinessBar() {
        if (this.happinessBar) {
            this.happinessBar.style.width = `${this.pet.happiness}%`;
            
            if (this.pet.happiness < 30) {
                this.happinessBar.style.backgroundColor = '#ff4444';
            } else if (this.pet.happiness < 60) {
                this.happinessBar.style.backgroundColor = '#ffaa00';
            } else {
                this.happinessBar.style.backgroundColor = '#ff69b4';
            }
        }
    }
    
    updateEnergyBar() {
        if (this.energyBar) {
            this.energyBar.style.width = `${this.pet.energy}%`;
            
            if (this.pet.energy < 30) {
                this.energyBar.style.backgroundColor = '#ff4444';
            } else if (this.pet.energy < 60) {
                this.energyBar.style.backgroundColor = '#ffaa00';
            } else {
                this.energyBar.style.backgroundColor = '#00ffff';
            }
        }
    }
    
    goToEditor() {
        UISoundSystem.playClose();
        // Passa os dados do pet atual para manter a aparência no editor
        const petData = this.pet.toJSON();
        this.game.changeScene('editor', petData);
    }
    
    showHint(text) {
        const hint = document.getElementById('hint-text');
        hint.textContent = text;
        hint.classList.add('visible');
        
        setTimeout(() => {
            hint.classList.remove('visible');
        }, 2000);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HUNGER SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    
    startHungerDecay() {
        this.hungerDecayInterval = setInterval(() => {
            this.pet.hunger = Math.max(0, this.pet.hunger - 1);
            this.updateAllBars();
        }, 1000);
    }
    
    updateHungerBar() {
        if (this.hungerBar) {
            this.hungerBar.style.width = `${this.pet.hunger}%`;
            
            // Cor baseada na fome
            if (this.pet.hunger < 30) {
                this.hungerBar.style.backgroundColor = '#ff4444';
            } else if (this.pet.hunger < 60) {
                this.hungerBar.style.backgroundColor = '#ffaa00';
            } else {
                this.hungerBar.style.backgroundColor = '#00ff88';
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════
    
    startLoop() {
        this.lastTime = performance.now();
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.animationFrame = requestAnimationFrame(loop);
        };
        
        loop(performance.now());
    }
    
    update(deltaTime) {
        // Se o jogo acabou, não atualiza mais nada
        if (this.isGameOver) {
            return;
        }
        
        // Atualiza sistema de materialização
        if (this.materializationSystem.isActive) {
            this.materializationSystem.update(deltaTime);
            // Durante materialização, pet não se move
            return;
        }
        
        this.pet.update(deltaTime);
        
        // Update throw physics if pet is thrown
        if (this.pet.isThrown) {
            this.pet.updateThrowPhysics(deltaTime, this.roomBounds);
        }
        
        // Atualiza display de humor
        this.updateMoodDisplay();
        
        // Atualiza info de idade periodicamente
        this.updatePetInfo();
        
        // Constrain pet to room (skip if thrown - physics handles it)
        if (!this.pet.isThrown) {
            this.constrainPetToRoom();
        }
        
        // Check food collision
        this.checkFoodCollision();
        
        // Random wandering (skip if held, thrown, or dizzy)
        if (!this.pet.isHeld && !this.pet.isThrown && !this.pet.isDizzy) {
            this.updateWandering(deltaTime);
        }
        
        // Update food animation
        if (this.food) {
            this.food.pulsePhase += 0.1;
        }
        
        // Auto dialogue
        this.updateAutoDialogue(deltaTime);
    }
    
    /**
     * Atualiza o display de humor na UI
     */
    updateMoodDisplay() {
        const moodDisplay = document.getElementById('mood-display');
        if (moodDisplay && this.pet) {
            const moodLabel = this.pet.getMoodLabel();
            if (moodDisplay.textContent !== moodLabel) {
                moodDisplay.textContent = moodLabel;
                // Animação de transição
                moodDisplay.classList.add('mood-change');
                setTimeout(() => moodDisplay.classList.remove('mood-change'), 300);
            }
        }
    }
    
    /**
     * Mantém o pet dentro dos limites do quarto (correção de viewport)
     */
    constrainPetToRoom() {
        if (!this.pet || !this.roomBounds) return;
        
        const b = this.roomBounds;
        // Considera o raio do pet + escala de idade para cálculo preciso
        const ageScale = this.pet.getAgeScale ? this.pet.getAgeScale() : 1.0;
        const petRadius = this.pet.size * (this.pet.scale || 1) * ageScale * 0.65;
        
        // Clamp rigoroso: pet NUNCA sai da área visível
        const minX = b.x + petRadius;
        const maxX = b.x + b.width - petRadius;
        const minY = b.y + petRadius;
        const maxY = b.y + b.height - petRadius;
        
        // Aplica limites com correção de velocidade se necessário
        if (this.pet.x < minX) {
            this.pet.x = minX;
            this.pet.vx = Math.abs(this.pet.vx || 0); // Rebate
        } else if (this.pet.x > maxX) {
            this.pet.x = maxX;
            this.pet.vx = -Math.abs(this.pet.vx || 0);
        }
        
        if (this.pet.y < minY) {
            this.pet.y = minY;
            this.pet.vy = Math.abs(this.pet.vy || 0);
        } else if (this.pet.y > maxY) {
            this.pet.y = maxY;
            this.pet.vy = -Math.abs(this.pet.vy || 0);
        }
    }
    
    checkFoodCollision() {
        if (!this.food) return;
        
        const dx = this.pet.x - this.food.x;
        const dy = this.pet.y - this.food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.pet.size + this.food.size) {
            // Pet come a comida
            this.pet.feed(25);
            this.food = null;
            this.updateAllBars();
            
            // Registra no histórico
            InteractionHistorySystem.record(INTERACTION_TYPES.FEED, {
                mood: this.pet.expressionState.mood,
                hunger: this.pet.hunger,
                happiness: this.pet.happiness,
                energy: this.pet.energy
            });
            
            // Som e fala de alimentação
            UISoundSystem.playFeed();
            PetVoiceSystem.emote('eat', this.pet.shapeId);
            const dialogue = DialogueSystem.speak('eating', 'happy', this.pet.shapeId);
            this.pet.say(dialogue, 'eating');
            
            this.showHint('Nhom nhom! +25 fome');
        }
    }
    
    updateWandering(deltaTime) {
        // Se não tem alvo e não está se movendo
        if (this.pet.targetX === null && Math.random() < 0.005) {
            const b = this.roomBounds;
            const margin = this.pet.size + 10;
            
            const newX = b.x + margin + Math.random() * (b.width - margin * 2);
            const newY = b.y + margin + Math.random() * (b.height - margin * 2);
            
            this.pet.moveTo(newX, newY);
        }
    }
    
    updateAutoDialogue(deltaTime) {
        this.autoDialogueTimer += deltaTime;
        
        if (this.autoDialogueTimer >= this.autoDialogueInterval) {
            this.autoDialogueTimer = 0;
            this.autoDialogueInterval = 6000 + Math.random() * 4000; // Reset intervalo
            
            // Só fala se não tiver diálogo ativo
            if (!this.pet.getDialogue()) {
                const dialogue = DialogueSystem.generateDialogue(
                    'idle', 
                    this.pet.expressionState.mood, 
                    this.pet.shapeId
                );
                this.pet.say(dialogue, 'idle');
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════
    
    render() {
        const ctx = this.renderer.ctx;
        
        // 1. Primeiro desenha o background (diretamente no canvas, não no buffer de pixels)
        this.drawBackground();
        
        // 2. Limpa o buffer de pixels com transparência para os elementos do jogo
        this.renderer.clearTransparent();
        
        // 3. Desenha elementos do jogo no buffer
        this.drawRoomOverlay();
        
        // Draw food
        if (this.food) {
            this.drawFood();
        }
        
        // Renderiza efeitos de materialização (fundo)
        if (this.materializationSystem.isActive) {
            this.materializationSystem.render(this.renderer);
        }
        
        // Draw pet (com ou sem materialização)
        this.pet.render(this.renderer, this.materializationSystem);
        
        // Renderiza partículas de materialização (frente) - SOMENTE se ainda ativa
        if (this.materializationSystem.isActive && this.materializationSystem.particleTrail.length > 0) {
            this.materializationSystem.renderParticles(this.renderer);
        }
        
        // 4. Aplica o buffer sobre o background (com composição alpha)
        this.renderer.flushWithAlpha();
        
        // 5. Renderiza MINIMAPA - copia do canvas principal em escala reduzida
        this.renderMinimap();
        
        // Draw dialogue bubble (usando HTML overlay)
        this.updateDialogueBubble();
    }
    
    /**
     * Renderiza o minimapa - simplesmente copia o canvas principal escalado
     * Com indicador de posição do pet
     */
    renderMinimap() {
        if (!this.minimapCanvas || !this.minimapCtx) return;
        
        const ctx = this.minimapCtx;
        
        // Limpa o minimapa
        ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Copia o canvas principal para o minimapa em escala reduzida
        ctx.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, this.minimapCanvas.width, this.minimapCanvas.height
        );
        
        // Overlay escuro sutil para diferenciar do canvas principal
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);
        
        // Desenha indicador de posição do pet (círculo pulsante)
        if (this.pet) {
            const petMinimapX = this.pet.x * this.minimapScale;
            const petMinimapY = this.pet.y * this.minimapScale;
            const pulseSize = 3 + Math.sin(Date.now() / 200) * 1;
            
            // Glow externo
            ctx.beginPath();
            ctx.arc(petMinimapX, petMinimapY, pulseSize + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
            
            // Círculo principal
            ctx.beginPath();
            ctx.arc(petMinimapX, petMinimapY, pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = '#00ffff';
            ctx.fill();
        }
        
        // Borda interna brilhante
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, this.minimapCanvas.width - 2, this.minimapCanvas.height - 2);
    }
    
    /**
     * Desenha o background (imagem ou fallback)
     */
    drawBackground() {
        const ctx = this.renderer.ctx;
        
        if (this.backgroundLoaded && this.backgroundImage) {
            // Calcula dimensões para cover
            const imgRatio = this.backgroundImage.width / this.backgroundImage.height;
            const canvasRatio = this.canvas.width / this.canvas.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (canvasRatio > imgRatio) {
                drawWidth = this.canvas.width;
                drawHeight = drawWidth / imgRatio;
                offsetX = 0;
                offsetY = (this.canvas.height - drawHeight) / 2;
            } else {
                drawHeight = this.canvas.height;
                drawWidth = drawHeight * imgRatio;
                offsetX = (this.canvas.width - drawWidth) / 2;
                offsetY = 0;
            }
            
            ctx.drawImage(this.backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
            
            // Overlay escuro sutil para contraste
            ctx.fillStyle = 'rgba(5, 5, 10, 0.35)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback: gradiente escuro
            const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#0a0a12');
            gradient.addColorStop(0.5, '#0d0d18');
            gradient.addColorStop(1, '#08080f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Desenha overlay do quarto (grid e bordas neon)
     */
    drawRoomOverlay() {
        const b = this.roomBounds;
        const ctx = this.renderer.ctx;
        
        // Grid sutil (direto no canvas após o background)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        const gridSpacing = Math.max(30, Math.min(50, this.canvas.width / 12));
        
        for (let x = b.x; x <= b.x + b.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, b.y);
            ctx.lineTo(x, b.y + b.height);
            ctx.stroke();
        }
        
        for (let y = b.y; y <= b.y + b.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(b.x, y);
            ctx.lineTo(b.x + b.width, y);
            ctx.stroke();
        }
    }
    
    updateDialogueBubble() {
        let bubble = document.getElementById('dialogue-bubble');
        const dialogue = this.pet.getDialogue();
        const isTyping = this.pet.isTyping();
        
        if (dialogue) {
            if (!bubble) {
                bubble = document.createElement('div');
                bubble.id = 'dialogue-bubble';
                bubble.className = 'dialogue-bubble';
                document.getElementById('game-container').appendChild(bubble);
            }
            
            // Adiciona cursor piscando se ainda está digitando
            bubble.textContent = isTyping ? dialogue + '█' : dialogue;
            bubble.classList.toggle('typing', isTyping);
            bubble.style.display = 'block';
            
            // === POSICIONAMENTO ESTILO QUADRINHOS ===
            // O balão fica EXATAMENTE centralizado acima do pet
            
            const canvasRect = this.canvas.getBoundingClientRect();
            const containerRect = document.getElementById('game-container').getBoundingClientRect();
            
            // Escala entre coordenadas lógicas do renderer e pixels da tela
            const logicalW = this.renderer?.logicalWidth || this.canvas.width;
            const logicalH = this.renderer?.logicalHeight || this.canvas.height;
            const scaleX = canvasRect.width / logicalW;
            const scaleY = canvasRect.height / logicalH;
            
            // Centro do pet em coordenadas de tela (pixels)
            const petScreenX = this.pet.x * scaleX;
            const petScreenY = this.pet.y * scaleY;
            
            // Offset do canvas em relação ao container
            const canvasOffsetX = canvasRect.left - containerRect.left;
            const canvasOffsetY = canvasRect.top - containerRect.top;
            
            // Posição final do centro do pet relativa ao container
            const petCenterX = canvasOffsetX + petScreenX;
            const petCenterY = canvasOffsetY + petScreenY;
            
            // Raio do pet escalado (considera idade)
            const ageScale = this.pet.getAgeScale ? this.pet.getAgeScale() : 1;
            const petRadius = this.pet.size * this.pet.scale * ageScale * scaleY;
            
            // Topo da cabeça do pet + margem para o rabinho do balão (10px)
            const tailHeight = 12; // Altura do rabinho CSS
            const headTopY = petCenterY - petRadius - tailHeight;
            
            // Posiciona o balão: left centraliza horizontal, top define a BASE do balão
            bubble.style.left = `${petCenterX}px`;
            bubble.style.top = `${headTopY}px`;
            bubble.style.bottom = 'auto';
            // translateX(-50%) centraliza horizontal, translateY(-100%) coloca balão ACIMA do ponto
            bubble.style.transform = 'translate(-50%, -100%)';
        } else if (bubble) {
            bubble.style.display = 'none';
        }
    }
    
    drawFood() {
        const f = this.food;
        const pulse = 1 + Math.sin(f.pulsePhase) * 0.15;
        const size = f.size * pulse;
        
        // Glow
        this.renderer.fillCircleGradient(f.x, f.y, size * 2, '#ff6b6b', '#110000');
        
        // Comida (maçã simplificada)
        this.renderer.fillCircle(f.x, f.y, size, f.color);
        this.renderer.drawNeonCircle(f.x, f.y, size, '#ff8888', 2);
        
        // Cabinho
        this.renderer.drawLine(f.x, f.y - size, f.x + 3, f.y - size - 5, '#88ff88');
        
        // Folha
        this.renderer.fillCircle(f.x + 4, f.y - size - 3, 3, '#88ff88');
    }
}
