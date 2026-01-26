// ═══════════════════════════════════════════════════════════════════
// EDITOR SCENE - Tela de criação/customização do GeoPet
// ═══════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import GeoPet from '../entities/GeoPet.js';
import { SHAPES } from '../data/shapes.js';
import { EYES, MOUTHS, COLORS } from '../data/faces.js';
import { UISoundSystem } from '../systems/UISoundSystem.js';
import { PetVoiceSystem } from '../systems/PetVoiceSystem.js';
import MaterializationSystem from '../systems/MaterializationSystem.js';

export default class EditorScene {
    constructor(game) {
        this.game = game;
        this.renderer = null;
        this.canvas = null;
        
        // Preview pet
        this.pet = null;
        
        // Sistema de Materialização
        this.materializationSystem = new MaterializationSystem();
        
        // Seleções atuais
        this.selection = {
            shapeIndex: 0,
            eyeIndex: 0,
            mouthIndex: 0,
            primaryColorIndex: 0,
            secondaryColorIndex: 1
        };
        
        // UI Elements
        this.ui = {};
        
        // Animação
        this.animationFrame = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════
    
    init() {
        // Inicializa sistemas de áudio
        UISoundSystem.init();
        PetVoiceSystem.init();
        
        this.createCanvas();
        this.createUI();
        this.createPet();
        this.startLoop();
        
        // Som de abertura
        UISoundSystem.playOpen();
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Remove UI
        const uiContainer = document.getElementById('editor-ui');
        if (uiContainer) uiContainer.remove();
        
        // Remove canvas
        if (this.canvas) this.canvas.remove();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CANVAS SETUP
    // ═══════════════════════════════════════════════════════════════════
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'editor-canvas';
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        const container = document.getElementById('game-container');
        container.appendChild(this.canvas);
        
        this.renderer = new Renderer(this.canvas);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UI CREATION
    // ═══════════════════════════════════════════════════════════════════
    
    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'editor-ui';
        uiContainer.innerHTML = `
            <h1 class="editor-title">✧ CRIAR PET ✧</h1>
            
            <div class="editor-section">
                <h3>FORMA</h3>
                <div class="option-row" id="shape-options"></div>
            </div>
            
            <div class="editor-section">
                <h3>OLHOS</h3>
                <div class="option-row" id="eye-options"></div>
            </div>
            
            <div class="editor-section">
                <h3>BOCA</h3>
                <div class="option-row" id="mouth-options"></div>
            </div>
            
            <div class="editor-section">
                <h3>COR PRIMÁRIA</h3>
                <div class="color-row" id="primary-color-options"></div>
            </div>
            
            <div class="editor-section">
                <h3>COR SECUNDÁRIA</h3>
                <div class="color-row" id="secondary-color-options"></div>
            </div>
            
            <button id="create-pet-btn" class="neon-btn">★ CRIAR PET ★</button>
        `;
        
        document.getElementById('ui-layer').appendChild(uiContainer);
        
        this.populateOptions();
        this.bindEvents();
    }
    
    populateOptions() {
        // Shapes
        const shapeContainer = document.getElementById('shape-options');
        SHAPES.forEach((shape, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (index === this.selection.shapeIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'shape';
            btn.innerHTML = `<span class="icon">${shape.icon}</span><span class="label">${shape.name}</span>`;
            btn.title = shape.desc;
            shapeContainer.appendChild(btn);
        });
        
        // Eyes
        const eyeContainer = document.getElementById('eye-options');
        EYES.forEach((eye, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (index === this.selection.eyeIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'eye';
            btn.innerHTML = `<span class="icon">${eye.icon}</span><span class="label">${eye.name}</span>`;
            btn.title = eye.desc;
            eyeContainer.appendChild(btn);
        });
        
        // Mouths
        const mouthContainer = document.getElementById('mouth-options');
        MOUTHS.forEach((mouth, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (index === this.selection.mouthIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'mouth';
            btn.innerHTML = `<span class="icon">${mouth.icon}</span><span class="label">${mouth.name}</span>`;
            btn.title = mouth.desc;
            mouthContainer.appendChild(btn);
        });
        
        // Primary Colors
        const primaryContainer = document.getElementById('primary-color-options');
        COLORS.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = 'color-btn' + (index === this.selection.primaryColorIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'primaryColor';
            btn.style.backgroundColor = color.hex;
            btn.style.boxShadow = `0 0 10px ${color.hex}`;
            btn.title = color.name;
            primaryContainer.appendChild(btn);
        });
        
        // Secondary Colors
        const secondaryContainer = document.getElementById('secondary-color-options');
        COLORS.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = 'color-btn' + (index === this.selection.secondaryColorIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'secondaryColor';
            btn.style.backgroundColor = color.hex;
            btn.style.boxShadow = `0 0 10px ${color.hex}`;
            btn.title = color.name;
            secondaryContainer.appendChild(btn);
        });
    }
    
    bindEvents() {
        // Option buttons - hover e click com som
        document.querySelectorAll('.option-btn, .color-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => UISoundSystem.playHover());
            btn.addEventListener('click', (e) => this.onOptionClick(e));
        });
        
        // Create button
        const createBtn = document.getElementById('create-pet-btn');
        createBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        createBtn.addEventListener('click', () => {
            this.onCreatePet();
        });
        
        // Canvas mouse move for eye tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.pet.lookAt(x, y);
        });
    }
    
    onOptionClick(e) {
        const btn = e.currentTarget;
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index);
        
        // Som de seleção
        UISoundSystem.playSelect();
        
        // Atualiza seleção
        switch (type) {
            case 'shape':
                this.selection.shapeIndex = index;
                this.pet.shapeId = SHAPES[index].id;
                // Re-materializa quando muda a forma (efeito especial)
                this.rematerialize();
                break;
            case 'eye':
                this.selection.eyeIndex = index;
                this.pet.eyeType = EYES[index].id;
                break;
            case 'mouth':
                this.selection.mouthIndex = index;
                this.pet.mouthType = MOUTHS[index].id;
                break;
            case 'primaryColor':
                this.selection.primaryColorIndex = index;
                this.pet.primaryColor = COLORS[index].hex;
                break;
            case 'secondaryColor':
                this.selection.secondaryColorIndex = index;
                this.pet.secondaryColor = COLORS[index].hex;
                break;
        }
        
        // Atualiza UI
        this.updateSelectedButtons(type, index);
    }
    
    updateSelectedButtons(type, selectedIndex) {
        const containerId = {
            'shape': 'shape-options',
            'eye': 'eye-options',
            'mouth': 'mouth-options',
            'primaryColor': 'primary-color-options',
            'secondaryColor': 'secondary-color-options'
        }[type];
        
        const container = document.getElementById(containerId);
        container.querySelectorAll('.option-btn, .color-btn').forEach((btn, i) => {
            btn.classList.toggle('selected', i === selectedIndex);
        });
    }
    
    onCreatePet() {
        // Som de sucesso
        UISoundSystem.playSuccess();
        
        // Salva os dados do pet
        const petData = this.pet.toJSON();
        
        // Efeito de transição
        const btn = document.getElementById('create-pet-btn');
        btn.classList.add('creating');
        btn.textContent = '✧ CRIANDO... ✧';
        
        setTimeout(() => {
            this.game.changeScene('home', petData);
        }, 800);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PET CREATION
    // ═══════════════════════════════════════════════════════════════════
    
    createPet() {
        this.pet = new GeoPet({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 50,
            scale: 1.2,
            shapeId: SHAPES[this.selection.shapeIndex].id,
            eyeType: EYES[this.selection.eyeIndex].id,
            mouthType: MOUTHS[this.selection.mouthIndex].id,
            primaryColor: COLORS[this.selection.primaryColorIndex].hex,
            secondaryColor: COLORS[this.selection.secondaryColorIndex].hex
        });
        
        // Inicia materialização cyber-alquímica
        this.startMaterialization();
    }
    
    /**
     * Inicia efeito de materialização no preview
     */
    startMaterialization() {
        // Escolhe modo aleatório
        const modes = ['scanline', 'radial', 'glitch', 'spiral'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        
        this.materializationSystem.start(this.pet, this.renderer, mode);
        
        // Callback quando completo
        this.materializationSystem.onComplete = () => {
            // Pet "nasce" com som
            PetVoiceSystem.playBirth(this.pet.shapeId);
        };
    }
    
    /**
     * Re-materializa o pet (chamado quando muda a seleção)
     */
    rematerialize() {
        if (!this.materializationSystem.isActive) {
            this.startMaterialization();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════
    
    startLoop() {
        const loop = () => {
            this.update();
            this.render();
            this.animationFrame = requestAnimationFrame(loop);
        };
        loop();
    }
    
    update() {
        // Atualiza sistema de materialização
        if (this.materializationSystem.isActive) {
            this.materializationSystem.update(16); // ~60 FPS
        }
        
        // Atualiza pet
        this.pet.update();
    }
    
    render() {
        // Limpa canvas
        this.renderer.clear('#0a0a0f');
        
        // Grid de fundo (estilo tech)
        this.drawBackgroundGrid();
        
        // Renderiza efeitos de materialização (fundo)
        if (this.materializationSystem.isActive) {
            this.materializationSystem.render(this.renderer);
        }
        
        // Render pet (com ou sem materialização)
        this.pet.render(this.renderer, this.materializationSystem);
        
        // Renderiza partículas (frente) - SOMENTE se ainda ativa
        if (this.materializationSystem.isActive && this.materializationSystem.particleTrail.length > 0) {
            this.materializationSystem.renderParticles(this.renderer);
        }
        
        // Flush para canvas
        this.renderer.flush();
    }
    
    drawBackgroundGrid() {
        const gridSize = 30;
        const gridColor = '#1a1a2e';
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.renderer.drawLine(x, 0, x, this.canvas.height, gridColor);
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.renderer.drawLine(0, y, this.canvas.width, y, gridColor);
        }
        
        // Círculo decorativo central
        this.renderer.drawCircle(this.canvas.width / 2, this.canvas.height / 2, 100, '#1f1f3a');
        this.renderer.drawCircle(this.canvas.width / 2, this.canvas.height / 2, 120, '#15152a');
    }
}
