// ═══════════════════════════════════════════════════════════════════
// HOME SCENE - Quarto do GeoPet
// Movimento básico + interação (alimentar) + sistema de falas
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
        
        // Room bounds
        this.roomBounds = {
            x: 50,
            y: 100,
            width: 300,
            height: 250
        };
        
        // Food
        this.food = null;
        this.foodSpawnTimer = 0;
        
        // Animation
        this.animationFrame = null;
        this.lastTime = 0;
        
        // Wandering
        this.wanderTimer = 0;
        this.wanderInterval = 3000;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════
    
    init(petData) {
        this.petData = petData;
        this.createCanvas();
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
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        const container = document.getElementById('game-container');
        container.appendChild(this.canvas);
        
        this.renderer = new Renderer(this.canvas);
        
        // Eventos
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
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
                <button id="feed-btn" class="action-btn positive">🍎 Alimentar</button>
                <button id="tickle-btn" class="action-btn positive">🪶 Cócegas</button>
                <button id="heal-btn" class="action-btn positive">💚 Curar</button>
            </div>
            
            <div class="home-actions-chaos">
                <span class="chaos-label">⚠️ CAOS</span>
                <button id="shock-btn" class="action-btn danger">⚡ Choque</button>
                <button id="freeze-btn" class="action-btn danger">❄️ Congelar</button>
                <button id="mutate-btn" class="action-btn danger">🔮 Mutar</button>
            </div>
            
            <div class="home-actions-secondary">
                <button id="respawn-btn" class="action-btn secondary">🔄 Re-Sintetizar</button>
                <button id="edit-btn" class="action-btn secondary">✏️ Editar</button>
            </div>
            
            <div class="materialization-modes" id="mat-modes" style="display: none;">
                <button class="mat-mode-btn" data-mode="scanline">📺 Scanline</button>
                <button class="mat-mode-btn" data-mode="radial">🌀 Radial</button>
                <button class="mat-mode-btn" data-mode="glitch">⚡ Glitch</button>
                <button class="mat-mode-btn" data-mode="spiral">🔄 Espiral</button>
            </div>
            
            <div class="hint-text" id="hint-text">Clique no chão para mover seu pet!</div>
        `;
        
        document.getElementById('ui-layer').appendChild(uiContainer);
        
        this.hungerBar = document.getElementById('hunger-bar');
        this.happinessBar = document.getElementById('happiness-bar');
        this.energyBar = document.getElementById('energy-bar');
        
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
        
        const editBtn = document.getElementById('edit-btn');
        editBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        editBtn.addEventListener('click', () => this.goToEditor());
        
        // Botão de re-sintetizar
        const respawnBtn = document.getElementById('respawn-btn');
        respawnBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        respawnBtn.addEventListener('click', () => this.toggleMaterializationModes());
        
        // Botões de modo de materialização
        document.querySelectorAll('.mat-mode-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => UISoundSystem.playHover());
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.respawnPet(mode);
            });
        });
    }
    
    toggleMaterializationModes() {
        const modes = document.getElementById('mat-modes');
        const isVisible = modes.style.display !== 'none';
        modes.style.display = isVisible ? 'none' : 'flex';
        UISoundSystem.playClick(isVisible ? 'cancel' : 'confirm');
    }
    
    respawnPet(mode) {
        // Esconde menu
        document.getElementById('mat-modes').style.display = 'none';
        
        // Reseta posição do pet
        this.pet.x = this.roomBounds.x + this.roomBounds.width / 2;
        this.pet.y = this.roomBounds.y + this.roomBounds.height / 2;
        this.pet.targetX = null;
        this.pet.targetY = null;
        
        // Inicia materialização
        this.isFirstSpawn = false;
        this.startMaterialization(mode);
        
        this.showHint(`🔮 Re-sintetizando em modo ${mode.toUpperCase()}...`);
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
        this.pet = new GeoPet({
            ...this.petData,
            x: this.roomBounds.x + this.roomBounds.width / 2,
            y: this.roomBounds.y + this.roomBounds.height / 2,
            size: 40,
            scale: 1
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERACTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Verifica se clicou dentro do quarto
        if (this.isInsideRoom(x, y)) {
            // Se tem comida e clicou nela
            if (this.food && this.isNearFood(x, y)) {
                this.pet.moveTo(this.food.x, this.food.y);
                return;
            }
            
            // Move o pet
            this.pet.moveTo(x, y);
            this.showHint('Seu pet está se movendo!');
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Pet olha para o mouse
        this.pet.lookAt(x, y);
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
        
        this.showHint('Comida apareceu! Seu pet vai até ela.');
        
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
            heal: 1000
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
        this.game.changeScene('editor');
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
        // Atualiza sistema de materialização
        if (this.materializationSystem.isActive) {
            this.materializationSystem.update(deltaTime);
            // Durante materialização, pet não se move
            return;
        }
        
        this.pet.update(deltaTime);
        
        // Atualiza display de humor
        this.updateMoodDisplay();
        
        // Constrain pet to room
        this.constrainPetToRoom();
        
        // Check food collision
        this.checkFoodCollision();
        
        // Random wandering
        this.updateWandering(deltaTime);
        
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
    
    constrainPetToRoom() {
        const b = this.roomBounds;
        const margin = this.pet.size;
        
        this.pet.x = Math.max(b.x + margin, Math.min(b.x + b.width - margin, this.pet.x));
        this.pet.y = Math.max(b.y + margin, Math.min(b.y + b.height - margin, this.pet.y));
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
        // Clear
        this.renderer.clear('#0a0a0f');
        
        // Draw room
        this.drawRoom();
        
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
        
        // Draw dialogue bubble (usando HTML overlay)
        this.updateDialogueBubble();
        
        // Flush
        this.renderer.flush();
    }
    
    /**
     * Renderiza efeitos visuais especiais no pet
     */
    renderPetEffects() {
        // Efeito de congelamento
        if (this.effectsSystem.isFrozen()) {
            const progress = this.effectsSystem.getFreezeProgress();
            const tremble = this.effectsSystem.getFreezeTremble();
            
            // Aplica tremor ao pet
            this.pet.x += tremble.x;
            this.pet.y += tremble.y;
            
            // Renderiza cristais de gelo ao redor
            this.drawFreezeEffect(progress);
        }
        
        // Efeito de mutação
        if (this.effectsSystem.isMutating()) {
            const data = this.effectsSystem.getMutationData();
            if (data) {
                this.drawMutationEffect(data);
            }
        }
        
        // Efeito de cócegas
        if (this.effectsSystem.isTickled()) {
            const visuals = this.effectsSystem.getTickleVisuals();
            if (visuals) {
                // Aplica squash/stretch de risada
                this.pet.squashX = visuals.squash.x;
                this.pet.squashY = visuals.squash.y;
                
                // Aplica bounce
                this.pet.y -= visuals.bounce;
            }
        }
    }
    
    /**
     * Desenha efeito de congelamento
     */
    drawFreezeEffect(progress) {
        const cx = this.pet.x;
        const cy = this.pet.y;
        const radius = this.pet.size * 1.5;
        
        // Aura gelada
        const iceColor = { r: 100, g: 200, b: 255 };
        const alpha = Math.floor(100 * (1 - progress));
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.001;
            const dist = radius * (0.8 + Math.sin(Date.now() * 0.002 + i) * 0.2);
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            
            // Cristal de gelo (pequeno triângulo/losango)
            const size = 3 + Math.random() * 3;
            this.renderer.setPixelBlend(x, y, iceColor.r, iceColor.g, iceColor.b, alpha);
            this.renderer.setPixelBlend(x + 1, y, iceColor.r, iceColor.g, iceColor.b, alpha * 0.7);
            this.renderer.setPixelBlend(x - 1, y, iceColor.r, iceColor.g, iceColor.b, alpha * 0.7);
            this.renderer.setPixelBlend(x, y + 1, iceColor.r, iceColor.g, iceColor.b, alpha * 0.7);
            this.renderer.setPixelBlend(x, y - 1, iceColor.r, iceColor.g, iceColor.b, alpha * 0.7);
        }
        
        // Borda congelada ao redor do pet
        if (progress < 0.8) {
            this.renderer.drawNeonCircle(cx, cy, this.pet.size + 5, '#88ddff', 2);
        }
    }
    
    /**
     * Desenha efeito de mutação (glitch visual)
     */
    drawMutationEffect(data) {
        const cx = this.pet.x;
        const cy = this.pet.y;
        
        // Linhas de glitch
        const glitchColor = '#ff00ff';
        const { r, g, b } = this.renderer.hexToRgb(glitchColor);
        
        for (let i = 0; i < data.glitch.slices; i++) {
            const y = cy - this.pet.size + Math.random() * this.pet.size * 2;
            const offsetX = data.glitch.offsetX * (Math.random() - 0.5) * 2;
            
            // Desenha linha de interferência
            for (let x = cx - this.pet.size; x < cx + this.pet.size; x++) {
                if (Math.random() > 0.5) {
                    this.renderer.setPixelBlend(x + offsetX, y, r, g, b, 100);
                }
            }
        }
    }
    
    updateDialogueBubble() {
        let bubble = document.getElementById('dialogue-bubble');
        const dialogue = this.pet.getDialogue();
        
        if (dialogue) {
            if (!bubble) {
                bubble = document.createElement('div');
                bubble.id = 'dialogue-bubble';
                bubble.className = 'dialogue-bubble';
                document.getElementById('game-container').appendChild(bubble);
            }
            
            bubble.textContent = dialogue;
            bubble.style.display = 'block';
            
            // Posiciona acima do pet (ajusta para escala do canvas)
            const canvasRect = this.canvas.getBoundingClientRect();
            const scaleX = canvasRect.width / this.canvas.width;
            const scaleY = canvasRect.height / this.canvas.height;
            
            // Converte coordenadas do canvas para coordenadas da tela
            const screenX = this.pet.x * scaleX;
            const screenY = this.pet.y * scaleY;
            
            bubble.style.left = `${screenX}px`;
            bubble.style.top = `${screenY - this.pet.size * scaleY * 2 - 30}px`;
        } else if (bubble) {
            bubble.style.display = 'none';
        }
    }
    
    drawRoom() {
        const b = this.roomBounds;
        
        // Chão (gradiente)
        for (let y = b.y; y < b.y + b.height; y++) {
            const t = (y - b.y) / b.height;
            const r = Math.round(15 + t * 10);
            const g = Math.round(15 + t * 10);
            const bVal = Math.round(25 + t * 15);
            
            for (let x = b.x; x < b.x + b.width; x++) {
                this.renderer.setPixel(x, y, r, g, bVal);
            }
        }
        
        // Grid do chão
        const gridColor = '#1a1a2e';
        for (let x = b.x; x <= b.x + b.width; x += 20) {
            this.renderer.drawLine(x, b.y, x, b.y + b.height, gridColor);
        }
        for (let y = b.y; y <= b.y + b.height; y += 20) {
            this.renderer.drawLine(b.x, y, b.x + b.width, y, gridColor);
        }
        
        // Bordas do quarto (neon)
        this.renderer.drawNeonLine(b.x, b.y, b.x + b.width, b.y, '#00ffff', 3);
        this.renderer.drawNeonLine(b.x + b.width, b.y, b.x + b.width, b.y + b.height, '#00ffff', 3);
        this.renderer.drawNeonLine(b.x + b.width, b.y + b.height, b.x, b.y + b.height, '#00ffff', 3);
        this.renderer.drawNeonLine(b.x, b.y + b.height, b.x, b.y, '#00ffff', 3);
        
        // Cantos decorativos
        const cornerSize = 15;
        this.renderer.drawLine(b.x, b.y, b.x + cornerSize, b.y, '#ff00ff');
        this.renderer.drawLine(b.x, b.y, b.x, b.y + cornerSize, '#ff00ff');
        
        this.renderer.drawLine(b.x + b.width, b.y, b.x + b.width - cornerSize, b.y, '#ff00ff');
        this.renderer.drawLine(b.x + b.width, b.y, b.x + b.width, b.y + cornerSize, '#ff00ff');
        
        this.renderer.drawLine(b.x + b.width, b.y + b.height, b.x + b.width - cornerSize, b.y + b.height, '#ff00ff');
        this.renderer.drawLine(b.x + b.width, b.y + b.height, b.x + b.width, b.y + b.height - cornerSize, '#ff00ff');
        
        this.renderer.drawLine(b.x, b.y + b.height, b.x + cornerSize, b.y + b.height, '#ff00ff');
        this.renderer.drawLine(b.x, b.y + b.height, b.x, b.y + b.height - cornerSize, '#ff00ff');
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
