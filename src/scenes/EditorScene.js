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
    
    init(petData = null) {
        // Guarda dados do pet se estiver editando
        this.editingPetData = petData;
        
        // Se editando, configura seleções baseadas no pet existente
        if (petData) {
            this.setupSelectionsFromPetData(petData);
        }
        
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
    
    /**
     * Configura as seleções baseadas nos dados do pet existente
     */
    setupSelectionsFromPetData(petData) {
        // Encontra índices baseado nos IDs do pet
        const shapeIdx = SHAPES.findIndex(s => s.id === petData.shapeId);
        const materialIdx = MATERIALS.findIndex(m => m.id === petData.materialId);
        const eyeIdx = EYES.findIndex(e => e.id === petData.eyeType);
        const mouthIdx = MOUTHS.findIndex(m => m.id === petData.mouthType);
        
        // Aplica se encontrou, senão mantém default (0)
        if (shapeIdx >= 0) this.selection.shapeIndex = shapeIdx;
        if (materialIdx >= 0) this.selection.materialIndex = materialIdx;
        if (eyeIdx >= 0) this.selection.eyeIndex = eyeIdx;
        if (mouthIdx >= 0) this.selection.mouthIndex = mouthIdx;
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
            <h1 class="editor-title"> CRIAR GEOPET </h1>
            
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
                <h3>CONTORNO <span class="color-wrap" style="position:relative; display:inline-block;"><button class="rainbow-btn" id="border-color-btn" title="Cor do contorno neon"></button> <button class="color-reset-btn" id="border-color-reset" title="Resetar cor">✕</button><input type="color" id="border-color-input" value="#00ffff" style="position:absolute; left:50%; transform:translateX(-50%); bottom:100%; margin-bottom:6px; width:34px; height:34px; opacity:0; border:0; padding:0; cursor:pointer;"></span></h3>
                <p class="section-hint">Cor do contorno neon do seu pet</p>
            </div>
            
            <div class="editor-section">
                <h3>OLHOS <span class="color-wrap" style="position:relative; display:inline-block;"><button class="rainbow-btn" id="eye-color-btn" title="Cor customizada"></button> <button class="color-reset-btn" id="eye-color-reset" title="Resetar cor">✕</button><input type="color" id="eye-color-input" value="#00ffff" style="position:absolute; left:50%; transform:translateX(-50%); bottom:100%; margin-bottom:6px; width:34px; height:34px; opacity:0; border:0; padding:0; cursor:pointer;"></span></h3>
                <div class="option-row" id="eye-options"></div>
            </div>
            
            <div class="editor-section">
                <h3>BOCA <span class="color-wrap" style="position:relative; display:inline-block;"><button class="rainbow-btn" id="mouth-color-btn" title="Cor customizada"></button> <button class="color-reset-btn" id="mouth-color-reset" title="Resetar cor">✕</button><input type="color" id="mouth-color-input" value="#00ffff" style="position:absolute; left:50%; transform:translateX(-50%); bottom:100%; margin-bottom:6px; width:34px; height:34px; opacity:0; border:0; padding:0; cursor:pointer;"></span></h3>
                <div class="option-row" id="mouth-options"></div>
            </div>
            
            <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
                <button id="randomize-pet-btn" class="neon-btn small" title="Gerar aleatoriamente">⤴ ALEATÓRIO</button>
                <button id="create-pet-btn" class="neon-btn">CRIAR GEOPET</button>
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
        const eyeColorInput = document.getElementById('eye-color-input');
        const eyeColorReset = document.getElementById('eye-color-reset');

        // Botão de cor da boca
        const mouthColorBtn = document.getElementById('mouth-color-btn');
        const mouthColorInput = document.getElementById('mouth-color-input');
        const mouthColorReset = document.getElementById('mouth-color-reset');
        
        // Botão de cor da borda/contorno neon
        const borderColorBtn = document.getElementById('border-color-btn');
        const borderColorInput = document.getElementById('border-color-input');
        const borderColorReset = document.getElementById('border-color-reset');

        // Clique no botão arco-íris: dispara o seletor nativo imediatamente
        if (eyeColorBtn && eyeColorInput) {
            eyeColorBtn.addEventListener('click', () => {
                UISoundSystem.playSelect();
                eyeColorInput.click();
            });

            eyeColorInput.addEventListener('input', (e) => {
                if (this.pet) this.pet.eyeColor = e.target.value;
                eyeColorBtn.style.background = e.target.value;
            });
        }

        if (eyeColorReset) {
            eyeColorReset.addEventListener('click', () => {
                UISoundSystem.playSelect();
                if (this.pet) this.pet.eyeColor = null;
                if (eyeColorBtn) eyeColorBtn.style.background = '';
                if (eyeColorInput) eyeColorInput.value = this.pet ? this.pet.secondaryColor || '#00ffff' : '#00ffff';
            });
        }

        // Boca: mesma lógica
        if (mouthColorBtn && mouthColorInput) {
            mouthColorBtn.addEventListener('click', () => {
                UISoundSystem.playSelect();
                mouthColorInput.click();
            });

            mouthColorInput.addEventListener('input', (e) => {
                if (this.pet) this.pet.mouthColor = e.target.value;
                mouthColorBtn.style.background = e.target.value;
            });
        }

        if (mouthColorReset) {
            mouthColorReset.addEventListener('click', () => {
                UISoundSystem.playSelect();
                if (this.pet) this.pet.mouthColor = null;
                if (mouthColorBtn) mouthColorBtn.style.background = '';
                if (mouthColorInput) mouthColorInput.value = this.pet ? this.pet.secondaryColor || '#00ffff' : '#00ffff';
            });
        }
        
        // Borda/Contorno: mesma lógica
        if (borderColorBtn && borderColorInput) {
            borderColorBtn.addEventListener('click', () => {
                UISoundSystem.playSelect();
                borderColorInput.click();
            });

            borderColorInput.addEventListener('input', (e) => {
                if (this.pet) this.pet.borderColor = e.target.value;
                borderColorBtn.style.background = e.target.value;
            });
        }

        if (borderColorReset) {
            borderColorReset.addEventListener('click', () => {
                UISoundSystem.playSelect();
                if (this.pet) this.pet.borderColor = null;
                if (borderColorBtn) borderColorBtn.style.background = '';
                if (borderColorInput) borderColorInput.value = this.pet ? this.pet.primaryColor || '#00ffff' : '#00ffff';
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

        // Helper: gera cor HEX aleatória
        const randHex = () => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');

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

        // --- Randomiza cores personalizadas (olhos, boca, contorno) ---
        // Gera cores aleatórias e aplica ao pet e aos controles de UI
        const eyeColor = randHex();
        const mouthColor = randHex();
        const borderColor = randHex();

        if (this.pet) {
            this.pet.eyeColor = eyeColor;
            this.pet.mouthColor = mouthColor;
            this.pet.borderColor = borderColor;
        }

        // Atualiza inputs e botões visuais (se existem)
        const eyeInput = document.getElementById('eye-color-input');
        const eyeBtn = document.getElementById('eye-color-btn');
        const mouthInput = document.getElementById('mouth-color-input');
        const mouthBtn = document.getElementById('mouth-color-btn');
        const borderInput = document.getElementById('border-color-input');
        const borderBtn = document.getElementById('border-color-btn');

        if (eyeInput) eyeInput.value = eyeColor;
        if (eyeBtn) eyeBtn.style.background = eyeColor;
        if (mouthInput) mouthInput.value = mouthColor;
        if (mouthBtn) mouthBtn.style.background = mouthColor;
        if (borderInput) borderInput.value = borderColor;
        if (borderBtn) borderBtn.style.background = borderColor;

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
        
        // Dados base do pet
        const petConfig = {
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
        };
        
        // Se editando um pet existente, preserva cores customizadas e borderColor
        if (this.editingPetData) {
            if (this.editingPetData.eyeColor) petConfig.eyeColor = this.editingPetData.eyeColor;
            if (this.editingPetData.mouthColor) petConfig.mouthColor = this.editingPetData.mouthColor;
            if (this.editingPetData.borderColor) petConfig.borderColor = this.editingPetData.borderColor;
        }
        
        this.pet = new GeoPet(petConfig);
        
        // Inicia materialização cyber-alquímica
        this.startMaterialization();

        // Sincroniza valores dos inputs de cor ocultos e dos botões com o pet criado
        const eyeInput = document.getElementById('eye-color-input');
        const eyeBtn = document.getElementById('eye-color-btn');
        const mouthInput = document.getElementById('mouth-color-input');
        const mouthBtn = document.getElementById('mouth-color-btn');
        const borderInput = document.getElementById('border-color-input');
        const borderBtn = document.getElementById('border-color-btn');

        if (eyeInput) eyeInput.value = this.pet.eyeColor || this.pet.secondaryColor || '#00ffff';
        if (eyeBtn) eyeBtn.style.background = this.pet.eyeColor || '';
        if (mouthInput) mouthInput.value = this.pet.mouthColor || this.pet.secondaryColor || '#00ffff';
        if (mouthBtn) mouthBtn.style.background = this.pet.mouthColor || '';
        if (borderInput) borderInput.value = this.pet.borderColor || this.pet.primaryColor || '#00ffff';
        if (borderBtn) borderBtn.style.background = this.pet.borderColor || '';
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
