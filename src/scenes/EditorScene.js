// ═══════════════════════════════════════════════════════════════════
// EDITOR SCENE - Tela de criação/customização do GeoPet
// ═══════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import GeoPet from '../entities/GeoPet.js';
import { SHAPES } from '../data/shapes.js';
import { EYES, MOUTHS } from '../data/faces.js';
import { MATERIALS } from '../data/materials.js';
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
            materialIndex: 0  // Novo: índice do material
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
                <h3>MATÉRIA-PRIMA</h3>
                <div class="material-row" id="material-options"></div>
                <div class="material-description" id="material-desc">
                    <span class="material-name"></span>
                    <span class="material-text"></span>
                </div>
            </div>
            
            <div class="editor-section">
                <h3>OLHOS <button class="rainbow-btn" id="eye-color-btn" title="Cor customizada"></button></h3>
                <div class="option-row" id="eye-options"></div>
                <div class="color-picker-container" id="eye-color-picker" style="display:none;">
                    <input type="color" id="eye-color-input" value="#00ffff">
                    <button class="color-reset-btn" id="eye-color-reset">✕ Resetar</button>
                </div>
            </div>
            
            <div class="editor-section">
                <h3>BOCA <button class="rainbow-btn" id="mouth-color-btn" title="Cor customizada"></button></h3>
                <div class="option-row" id="mouth-options"></div>
                <div class="color-picker-container" id="mouth-color-picker" style="display:none;">
                    <input type="color" id="mouth-color-input" value="#00ffff">
                    <button class="color-reset-btn" id="mouth-color-reset">✕ Resetar</button>
                </div>
            </div>
            
            <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
                <button id="randomize-pet-btn" class="neon-btn small" title="Gerar aleatoriamente">⤴ ALEATÓRIO</button>
                <button id="create-pet-btn" class="neon-btn">★ CRIAR PET ★</button>
            </div>
        `;
        
        document.getElementById('ui-layer').appendChild(uiContainer);
        
        this.populateOptions();
        this.bindEvents();
        this.updateMaterialDescription();
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
        
        // Materials (NOVO!)
        const materialContainer = document.getElementById('material-options');
        MATERIALS.forEach((material, index) => {
            const btn = document.createElement('button');
            btn.className = 'material-btn' + (index === this.selection.materialIndex ? ' selected' : '');
            btn.dataset.index = index;
            btn.dataset.type = 'material';
            btn.dataset.id = material.id;
            btn.innerHTML = `<span class="material-symbol">${material.symbol}</span><span class="material-label">${material.name}</span>`;
            btn.title = material.shortDesc;
            
            // Cor de fundo baseada na paleta do material
            btn.style.setProperty('--material-glow', material.palette.glow);
            btn.style.setProperty('--material-core', material.palette.core);
            
            materialContainer.appendChild(btn);
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
    }
    
    updateMaterialDescription() {
        const material = MATERIALS[this.selection.materialIndex];
        const nameEl = document.querySelector('.material-name');
        const textEl = document.querySelector('.material-text');
        
        if (nameEl && textEl && material) {
            nameEl.textContent = `${material.symbol} ${material.name}`;
            nameEl.style.color = material.palette.glow;
            textEl.textContent = material.description;
        }
    }
    
    bindEvents() {
        // Option buttons - hover e click com som
        document.querySelectorAll('.option-btn, .material-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                UISoundSystem.playHover();
                // Mostra descrição ao hover nos materiais
                if (btn.dataset.type === 'material') {
                    const index = parseInt(btn.dataset.index);
                    const mat = MATERIALS[index];
                    const nameEl = document.querySelector('.material-name');
                    const textEl = document.querySelector('.material-text');
                    if (nameEl && textEl) {
                        nameEl.textContent = `${mat.symbol} ${mat.name}`;
                        nameEl.style.color = mat.palette.glow;
                        textEl.textContent = mat.description;
                    }
                }
            });
            btn.addEventListener('mouseleave', () => {
                // Volta para a seleção atual
                if (btn.dataset.type === 'material') {
                    this.updateMaterialDescription();
                }
            });
            btn.addEventListener('click', (e) => this.onOptionClick(e));
        });
        
        // Create button
        const createBtn = document.getElementById('create-pet-btn');
        createBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
        createBtn.addEventListener('click', () => {
            this.onCreatePet();
        });

        // Randomize button
        const randomBtn = document.getElementById('randomize-pet-btn');
        if (randomBtn) {
            randomBtn.addEventListener('mouseenter', () => UISoundSystem.playHover());
            randomBtn.addEventListener('click', () => {
                this.randomizePet();
                // Feedback visual rápido
                randomBtn.classList.add('pulsing');
                setTimeout(() => randomBtn.classList.remove('pulsing'), 400);
            });
        }
        
        // ═══ SISTEMA ARCO-ÍRIS - Seletores de Cor RGB ═══
        this.bindColorPickers();
        
        // Canvas mouse move for eye tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.pet.lookAt(x, y);
        });
    }
    
    /**
     * Sistema Arco-Íris - Configura seletores de cores RGB customizadas
     */
    bindColorPickers() {
        // Botão de cor dos olhos
        const eyeColorBtn = document.getElementById('eye-color-btn');
        const eyeColorPicker = document.getElementById('eye-color-picker');
        const eyeColorInput = document.getElementById('eye-color-input');
        const eyeColorReset = document.getElementById('eye-color-reset');
        
        // Botão de cor da boca
        const mouthColorBtn = document.getElementById('mouth-color-btn');
        const mouthColorPicker = document.getElementById('mouth-color-picker');
        const mouthColorInput = document.getElementById('mouth-color-input');
        const mouthColorReset = document.getElementById('mouth-color-reset');
        
        // Toggle picker dos olhos
        if (eyeColorBtn) {
            eyeColorBtn.addEventListener('click', () => {
                UISoundSystem.playSelect();
                const isVisible = eyeColorPicker.style.display !== 'none';
                eyeColorPicker.style.display = isVisible ? 'none' : 'flex';
                eyeColorBtn.classList.toggle('active', !isVisible);
            });
        }
        
        // Input de cor dos olhos
        if (eyeColorInput) {
            eyeColorInput.addEventListener('input', (e) => {
                this.pet.eyeColor = e.target.value;
                eyeColorBtn.style.background = e.target.value;
            });
        }
        
        // Reset cor dos olhos
        if (eyeColorReset) {
            eyeColorReset.addEventListener('click', () => {
                UISoundSystem.playSelect();
                this.pet.eyeColor = null;
                eyeColorBtn.style.background = '';
                eyeColorInput.value = this.pet.secondaryColor || '#00ffff';
            });
        }
        
        // Toggle picker da boca
        if (mouthColorBtn) {
            mouthColorBtn.addEventListener('click', () => {
                UISoundSystem.playSelect();
                const isVisible = mouthColorPicker.style.display !== 'none';
                mouthColorPicker.style.display = isVisible ? 'none' : 'flex';
                mouthColorBtn.classList.toggle('active', !isVisible);
            });
        }
        
        // Input de cor da boca
        if (mouthColorInput) {
            mouthColorInput.addEventListener('input', (e) => {
                this.pet.mouthColor = e.target.value;
                mouthColorBtn.style.background = e.target.value;
            });
        }
        
        // Reset cor da boca
        if (mouthColorReset) {
            mouthColorReset.addEventListener('click', () => {
                UISoundSystem.playSelect();
                this.pet.mouthColor = null;
                mouthColorBtn.style.background = '';
                mouthColorInput.value = this.pet.secondaryColor || '#00ffff';
            });
        }
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
                // Re-materializa quando muda a forma
                this.rematerialize();
                break;
            case 'material':
                this.selection.materialIndex = index;
                const selectedMaterial = MATERIALS[index];
                this.pet.materialId = selectedMaterial.id;
                // Atualiza cores legadas baseado no material (para MaterializationSystem)
                this.pet.primaryColor = selectedMaterial.palette.glow;
                this.pet.secondaryColor = selectedMaterial.palette.core;
                // Atualiza descrição e re-materializa
                this.updateMaterialDescription();
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
        }
        
        // Atualiza UI
        this.updateSelectedButtons(type, index);
    }
    
    updateSelectedButtons(type, selectedIndex) {
        const containerId = {
            'shape': 'shape-options',
            'material': 'material-options',
            'eye': 'eye-options',
            'mouth': 'mouth-options'
        }[type];
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.querySelectorAll('.option-btn, .material-btn').forEach((btn, i) => {
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

    randomizePet() {
        // Gera índices aleatórios
        const shapeIdx = Math.floor(Math.random() * SHAPES.length);
        const matIdx = Math.floor(Math.random() * MATERIALS.length);
        const eyeIdx = Math.floor(Math.random() * EYES.length);
        const mouthIdx = Math.floor(Math.random() * MOUTHS.length);

        this.selection.shapeIndex = shapeIdx;
        this.selection.materialIndex = matIdx;
        this.selection.eyeIndex = eyeIdx;
        this.selection.mouthIndex = mouthIdx;

        // Atualiza o pet
        if (!this.pet) {
            this.createPet();
        } else {
            this.pet.shapeId = SHAPES[shapeIdx].id;
            const mat = MATERIALS[matIdx];
            this.pet.materialId = mat.id;
            this.pet.primaryColor = mat.palette.glow;
            this.pet.secondaryColor = mat.palette.core;
            this.pet.eyeType = EYES[eyeIdx].id;
            this.pet.mouthType = MOUTHS[mouthIdx].id;
            this.rematerialize();
        }

        // Atualiza UI
        this.updateSelectedButtons('shape', shapeIdx);
        this.updateSelectedButtons('material', matIdx);
        this.updateSelectedButtons('eye', eyeIdx);
        this.updateSelectedButtons('mouth', mouthIdx);
        this.updateMaterialDescription();

        // Feedback sonoro / visual
        UISoundSystem.playSelect();
        PetVoiceSystem.playHappy();
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PET CREATION
    // ═══════════════════════════════════════════════════════════════════
    
    createPet() {
        const material = MATERIALS[this.selection.materialIndex];
        
        this.pet = new GeoPet({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 50,
            scale: 1.2,
            shapeId: SHAPES[this.selection.shapeIndex].id,
            eyeType: EYES[this.selection.eyeIndex].id,
            mouthType: MOUTHS[this.selection.mouthIndex].id,
            materialId: material.id,
            // Cores legadas para compatibilidade
            primaryColor: material.palette.glow,
            secondaryColor: material.palette.core
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
