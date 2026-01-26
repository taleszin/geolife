// ═══════════════════════════════════════════════════════════════════════════
// MOBILE EDITOR SCENE - Editor de GeoPet otimizado para Mobile
// ═══════════════════════════════════════════════════════════════════════════
//
// Layout Mobile-First:
//   - Pet no centro da tela (área principal)
//   - Carrossel de seleção na base (thumb zone)
//   - Botões de categoria nas laterais
//   - Gestos: swipe para navegar, pinch para zoom, scrub para petting
//
// ═══════════════════════════════════════════════════════════════════════════

import Renderer from '../core/Renderer.js';
import GeoPet from '../entities/GeoPet.js';
import { SHAPES } from '../data/shapes.js';
import { EYES, MOUTHS } from '../data/faces.js';
import { MATERIALS } from '../data/materials.js';
import { UISoundSystem } from '../systems/UISoundSystem.js';
import { PetVoiceSystem } from '../systems/PetVoiceSystem.js';
import MaterializationSystem from '../systems/MaterializationSystem.js';
import { touchInput } from '../systems/TouchInputSystem.js';
import MobileCarousel from '../ui/MobileCarousel.js';

export default class MobileEditorScene {
    constructor(game) {
        this.game = game;
        this.renderer = null;
        this.canvas = null;
        
        // Pet
        this.pet = null;
        
        // Sistema de Materialização
        this.materializationSystem = new MaterializationSystem();
        
        // Seleções atuais
        this.selection = {
            shapeIndex: 0,
            eyeIndex: 0,
            mouthIndex: 0,
            materialIndex: 0
        };
        
        // Carrosséis
        this.carousels = {};
        this.activeCarousel = 'material'; // Categoria ativa
        
        // Categorias disponíveis
        this.categories = ['shape', 'material', 'eye', 'mouth'];
        this.categoryIndex = 1; // Começa em material
        
        // Layout responsivo
        this.layout = {
            petArea: { x: 0, y: 0, width: 0, height: 0 },
            carouselArea: { x: 0, y: 0, width: 0, height: 0 },
            categoryButtons: [],
            createButton: { x: 0, y: 0, width: 0, height: 0 }
        };
        
        // Estado de interação
        this.isDraggingPet = false;
        this.dragStartAngle = 0;
        
        // Animação
        this.animationFrame = null;
        
        // Handler para resize/orientation
        this.onResizeBound = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    init() {
        UISoundSystem.init();
        PetVoiceSystem.init();
        
        this.createCanvas();
        this.calculateLayout();
        this.createCarousels();
        this.createPet();
        this.setupTouchInput();
        this.startLoop();
        
        UISoundSystem.playOpen();
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
        if (this.renderer) {
            this.renderer.destroy();
        }
        touchInput.destroy();

        if (this.onResizeBound) {
            window.removeEventListener('resize', this.onResizeBound);
            window.removeEventListener('orientationchange', this.onResizeBound);
            this.onResizeBound = null;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CANVAS E LAYOUT
    // ═══════════════════════════════════════════════════════════════════════
    
    createCanvas() {
        const container = document.getElementById('game-container');
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'editor-canvas';
        
        // Tamanho inicial - será ajustado pelo responsive
        const width = Math.min(window.innerWidth, 500);
        const height = Math.min(window.innerHeight - 50, 700);
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        container.appendChild(this.canvas);
        
        // Renderer com DPR e responsive
        this.renderer = new Renderer(this.canvas, {
            width: width,
            height: height,
            useDPR: true
        });
        
        this.renderer.setupResponsive(container, {
            maintainAspectRatio: false,
            minWidth: 280,
            minHeight: 450,
            maxWidth: 500,
            maxHeight: 800,
            padding: 10
        });

        // Recalcula layout quando a tela muda
        this.onResizeBound = () => {
            this.calculateLayout();
            this.updateCarouselsLayout();
            this.positionPet();
            this.renderer.markDirty();
        };
        window.addEventListener('resize', this.onResizeBound);
        window.addEventListener('orientationchange', this.onResizeBound);
    }
    
    calculateLayout() {
        const w = this.renderer.logicalWidth;
        const h = this.renderer.logicalHeight;
        const isLandscape = w > h;
        
        if (isLandscape) {
            // Landscape: carrossel à direita
            this.layout.petArea = {
                x: 0,
                y: 0,
                width: w * 0.65,
                height: h
            };
            this.layout.carouselArea = {
                x: w * 0.65,
                y: h * 0.1,
                width: w * 0.35,
                height: h * 0.7
            };
        } else {
            // Portrait: carrossel embaixo (thumb zone)
            const carouselHeight = 120;
            const categoryHeight = 50;
            
            this.layout.petArea = {
                x: 0,
                y: 0,
                width: w,
                height: h - carouselHeight - categoryHeight - 60
            };
            
            this.layout.carouselArea = {
                x: 10,
                y: h - carouselHeight - 50,
                width: w - 20,
                height: carouselHeight
            };
            
            // Botões de categoria acima do carrossel
            const categoryY = h - carouselHeight - categoryHeight - 55;
            const btnWidth = (w - 50) / 4;
            
            this.layout.categoryButtons = this.categories.map((cat, i) => ({
                category: cat,
                x: 10 + i * (btnWidth + 10),
                y: categoryY,
                width: btnWidth,
                height: categoryHeight - 10
            }));
            
            // Botão criar
            this.layout.createButton = {
                x: w / 2 - 80,
                y: h - 45,
                width: 160,
                height: 40
            };
            
            // Botão Aleatório (ao lado do criar) - garantido em ambos os modos
            const createBtn = this.layout.createButton || { x: Math.max(10, w - 170), y: h - 45, width: 160, height: 40 };
            this.layout.randomButton = {
                x: createBtn.x - 54,
                y: createBtn.y,
                width: 44,
                height: createBtn.height
            };
        
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CARROSSÉIS
    // ═══════════════════════════════════════════════════════════════════════
    
    createCarousels() {
        const area = this.layout.carouselArea;
        
        // Carrossel de Formas
        this.carousels.shape = new MobileCarousel({
            items: SHAPES.map(s => ({ ...s, icon: 'circle' })),
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height - 20,
            initialIndex: this.selection.shapeIndex,
            onSelect: (item, index) => this.onCarouselSelect('shape', index)
        });
        
        // Carrossel de Materiais
        this.carousels.material = new MobileCarousel({
            items: MATERIALS,
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height - 20,
            initialIndex: this.selection.materialIndex,
            onSelect: (item, index) => this.onCarouselSelect('material', index)
        });
        
        // Carrossel de Olhos
        this.carousels.eye = new MobileCarousel({
            items: EYES,
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height - 20,
            initialIndex: this.selection.eyeIndex,
            onSelect: (item, index) => this.onCarouselSelect('eye', index)
        });
        
        // Carrossel de Bocas
        this.carousels.mouth = new MobileCarousel({
            items: MOUTHS,
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height - 20,
            initialIndex: this.selection.mouthIndex,
            onSelect: (item, index) => this.onCarouselSelect('mouth', index)
        });
    }
    
    onCarouselSelect(type, index) {
        UISoundSystem.playSelect();
        
        switch (type) {
            case 'shape':
                this.selection.shapeIndex = index;
                this.pet.shapeId = SHAPES[index].id;
                this.rematerialize();
                break;
            case 'material':
                this.selection.materialIndex = index;
                const mat = MATERIALS[index];
                this.pet.materialId = mat.id;
                this.pet.primaryColor = mat.palette.glow;
                this.pet.secondaryColor = mat.palette.core;
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
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH INPUT
    // ═══════════════════════════════════════════════════════════════════════
    
    setupTouchInput() {
        touchInput.init(this.canvas);
        
        // TAP - Selecionar categoria ou item
        touchInput.on('tap', (e) => this.onTap(e));
        
        // DOUBLE TAP - Pet reage
        touchInput.on('doubleTap', (e) => this.onDoubleTap(e));
        
        // PAN - Arrastar carrossel ou rotacionar pet
        touchInput.on('panStart', (e) => this.onPanStart(e));
        touchInput.on('pan', (e) => this.onPan(e));
        touchInput.on('panEnd', (e) => this.onPanEnd(e));
        
        // SWIPE - Navegar carrossel ou categoria
        touchInput.on('swipe', (e) => this.onSwipe(e));
        
        // SCRUB - Petting
        touchInput.on('scrub', (e) => this.onScrub(e));
        
        // PINCH - Zoom
        touchInput.on('pinch', (e) => this.onPinch(e));
    }
    
    onTap(e) {
        const { x, y } = e;
        
        // Verifica botões de categoria
        for (const btn of this.layout.categoryButtons) {
            if (this.isInRect(x, y, btn)) {
                this.selectCategory(btn.category);
                return;
            }
        }

        // Verifica botão aleatório (randomize)
        if (this.layout.randomButton && this.isInRect(x, y, this.layout.randomButton)) {
            this.randomizePet();
            return;
        }
        
        // Verifica botão criar
        if (this.isInRect(x, y, this.layout.createButton)) {
            this.onCreatePet();
            return;
        }
        
        // Verifica carrossel
        const carousel = this.carousels[this.activeCarousel];
        if (carousel && carousel.onTap(x, y)) {
            return;
        }
        
        // Verifica pet
        if (this.pet && this.pet.containsPoint(x, y)) {
            this.pet.onTap();
            UISoundSystem.playHover();
        }
    }
    
    onDoubleTap(e) {
        if (this.pet && this.pet.containsPoint(e.x, e.y)) {
            this.pet.onDoubleTap();
            UISoundSystem.playSelect();
        }
    }
    
    onPanStart(e) {
        const { x, y } = e;
        
        // Verifica se está no pet
        if (this.pet && this.pet.containsPoint(x, y)) {
            this.isDraggingPet = true;
            this.dragStartAngle = Math.atan2(y - this.pet.y, x - this.pet.x);
            return;
        }
        
        // Verifica carrossel
        const carousel = this.carousels[this.activeCarousel];
        if (carousel && carousel.onDragStart(x, y)) {
            return;
        }
    }
    
    onPan(e) {
        const { x, y, deltaX, deltaY } = e;
        
        // Rotação do pet
        if (this.isDraggingPet && this.pet) {
            const currentAngle = Math.atan2(y - this.pet.y, x - this.pet.x);
            const deltaAngle = currentAngle - this.dragStartAngle;
            this.pet.applyRotation(deltaAngle * 0.3);
            this.dragStartAngle = currentAngle;
            
            // Também faz olhar para onde está arrastando
            this.pet.lookAt(x, y);
            return;
        }
        
        // Carrossel
        const carousel = this.carousels[this.activeCarousel];
        if (carousel) {
            carousel.onDragMove(x, y);
        }
    }
    
    onPanEnd(e) {
        this.isDraggingPet = false;
        
        const carousel = this.carousels[this.activeCarousel];
        if (carousel) {
            carousel.onDragEnd(e.x, e.y);
        }
    }
    
    onSwipe(e) {
        const { direction, startX, startY } = e;
        
        // Se swipe na área do pet, muda categoria
        if (this.isInRect(startX, startY, this.layout.petArea)) {
            if (direction === 'left') {
                this.nextCategory();
            } else if (direction === 'right') {
                this.prevCategory();
            }
            return;
        }
        
        // Se swipe no carrossel
        const carousel = this.carousels[this.activeCarousel];
        if (carousel && carousel.isInBounds(startX, startY)) {
            carousel.onSwipe(direction, e.velocity);
        }
    }
    
    onScrub(e) {
        // Petting! O pet fica feliz
        if (this.pet && this.pet.containsPoint(e.x, e.y)) {
            this.pet.onScrub(e.intensity);
            
            // Feedback sonoro
            if (e.intensity > 0.5) {
                PetVoiceSystem.playHappy();
            }
        }
    }
    
    onPinch(e) {
        // Zoom na viewport
        this.renderer.applyZoom(e.scale, e.center.x, e.center.y);
        this.renderer.registerActivity();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVEGAÇÃO DE CATEGORIAS
    // ═══════════════════════════════════════════════════════════════════════
    
    selectCategory(category) {
        if (this.activeCarousel === category) return;
        
        this.activeCarousel = category;
        this.categoryIndex = this.categories.indexOf(category);
        UISoundSystem.playHover();
    }
    
    nextCategory() {
        this.categoryIndex = (this.categoryIndex + 1) % this.categories.length;
        this.activeCarousel = this.categories[this.categoryIndex];
        UISoundSystem.playHover();
    }
    
    prevCategory() {
        this.categoryIndex = (this.categoryIndex - 1 + this.categories.length) % this.categories.length;
        this.activeCarousel = this.categories[this.categoryIndex];
        UISoundSystem.playHover();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PET
    // ═══════════════════════════════════════════════════════════════════════
    
    createPet() {
        const material = MATERIALS[this.selection.materialIndex];
        const petArea = this.layout.petArea;
        
        this.pet = new GeoPet({
            x: petArea.x + petArea.width / 2,
            y: petArea.y + petArea.height / 2,
            size: 50,
            scale: 1.2,
            shapeId: SHAPES[this.selection.shapeIndex].id,
            eyeType: EYES[this.selection.eyeIndex].id,
            mouthType: MOUTHS[this.selection.mouthIndex].id,
            materialId: material.id,
            primaryColor: material.palette.glow,
            secondaryColor: material.palette.core
        });
        
        this.startMaterialization();
    }
    
    startMaterialization() {
        const modes = ['scanline', 'radial', 'glitch', 'spiral'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        
        this.materializationSystem.start(this.pet, this.renderer, mode);
        this.materializationSystem.onComplete = () => {
            PetVoiceSystem.playBirth(this.pet.shapeId);
        };
    }
    
    rematerialize() {
        if (!this.materializationSystem.isActive) {
            this.startMaterialization();
        }
    }
    
    onCreatePet() {
        UISoundSystem.playSuccess();
        const petData = this.pet.toJSON();
        
        // Transição
        setTimeout(() => {
            this.game.changeScene('home', petData);
        }, 500);
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

        // Atualiza carrosséis sem animação para feedback instantâneo
        if (this.carousels.shape) this.carousels.shape.selectItem(shapeIdx, false);
        if (this.carousels.material) this.carousels.material.selectItem(matIdx, false);
        if (this.carousels.eye) this.carousels.eye.selectItem(eyeIdx, false);
        if (this.carousels.mouth) this.carousels.mouth.selectItem(mouthIdx, false);

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

        // Feedback sonoro e visual
        UISoundSystem.playSelect();
        PetVoiceSystem.playHappy();
        this.renderer.markDirty();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════
    
    startLoop() {
        const loop = () => {
            this.update();
            
            // Só renderiza se necessário (economia de bateria)
            if (this.renderer.shouldRender()) {
                this.render();
                this.renderer.rendered();
            }
            
            this.animationFrame = requestAnimationFrame(loop);
        };
        loop();
    }
    
    update() {
        // Sistema de materialização
        if (this.materializationSystem.isActive) {
            this.materializationSystem.update(16);
            this.renderer.markDirty();
        }
        
        // Pet
        if (this.pet) {
            this.pet.update();
        }
        
        // Carrossel ativo
        const carousel = this.carousels[this.activeCarousel];
        if (carousel) {
            carousel.update(16);
        }
    }
    
    render() {
        this.renderer.clear('#0a0a0f');
        
        // Grid de fundo
        this.drawBackgroundGrid();
        
        // Materialização
        if (this.materializationSystem.isActive) {
            this.materializationSystem.render(this.renderer);
        }
        
        // Pet
        if (this.pet) {
            this.pet.render(this.renderer, this.materializationSystem);
        }
        
        // Partículas
        if (this.materializationSystem.isActive) {
            this.materializationSystem.renderParticles(this.renderer);
        }
        
        // UI Mobile
        this.renderCategoryButtons();
        this.renderCarousel();
        this.renderRandomButton();
        this.renderCreateButton();
        this.renderCategoryIndicator();
        
        this.renderer.flush();
    }
    
    drawBackgroundGrid() {
        const gridSize = 30;
        const w = this.renderer.logicalWidth;
        const h = this.renderer.logicalHeight;
        
        for (let x = 0; x < w; x += gridSize) {
            this.renderer.drawLine(x, 0, x, h, '#1a1a2e');
        }
        for (let y = 0; y < h; y += gridSize) {
            this.renderer.drawLine(0, y, w, y, '#1a1a2e');
        }
        
        // Círculos decorativos
        const cx = this.layout.petArea.x + this.layout.petArea.width / 2;
        const cy = this.layout.petArea.y + this.layout.petArea.height / 2;
        this.renderer.drawCircle(cx, cy, 100, '#1f1f3a');
        this.renderer.drawCircle(cx, cy, 120, '#15152a');
    }
    
    renderCategoryButtons() {
        const catIcons = {
            shape: '◯',
            material: '◈',
            eye: '◉',
            mouth: '◡'
        };
        
        const catColors = {
            shape: '#00ffff',
            material: '#ff00ff',
            eye: '#ffff00',
            mouth: '#00ff00'
        };
        
        for (const btn of this.layout.categoryButtons) {
            const isActive = btn.category === this.activeCarousel;
            const color = isActive ? catColors[btn.category] : '#444';
            const { r, g, b } = this.renderer.hexToRgb(color);
            
            // Borda do botão
            this.drawRoundedRect(btn.x, btn.y, btn.width, btn.height, color, isActive);
            
            // Ícone no centro
            const cx = btn.x + btn.width / 2;
            const cy = btn.y + btn.height / 2;
            
            // Desenha ícone geométrico
            if (btn.category === 'shape') {
                this.renderer.drawCircle(cx, cy, 8, color);
            } else if (btn.category === 'material') {
                // Losango
                this.renderer.drawLine(cx, cy - 8, cx + 8, cy, color);
                this.renderer.drawLine(cx + 8, cy, cx, cy + 8, color);
                this.renderer.drawLine(cx, cy + 8, cx - 8, cy, color);
                this.renderer.drawLine(cx - 8, cy, cx, cy - 8, color);
            } else if (btn.category === 'eye') {
                // Olho
                this.renderer.drawCircle(cx, cy, 6, color);
                for (let i = -2; i <= 2; i++) {
                    this.renderer.setPixel(cx + i, cy, r, g, b);
                }
            } else if (btn.category === 'mouth') {
                // Sorriso
                for (let i = -6; i <= 6; i++) {
                    const curveY = Math.abs(i) * 0.3;
                    this.renderer.setPixel(cx + i, cy + curveY, r, g, b);
                }
            }
        }
    }
    
    renderCarousel() {
        const carousel = this.carousels[this.activeCarousel];
        if (carousel) {
            carousel.render(this.renderer);
        }
    }
    
    renderCreateButton() {
        const btn = this.layout.createButton;
        const color = '#00ff88';
        
        this.drawRoundedRect(btn.x, btn.y, btn.width, btn.height, color, true);
        
        // Estrela no centro
        const cx = btn.x + btn.width / 2;
        const cy = btn.y + btn.height / 2;
        const { r, g, b } = this.renderer.hexToRgb(color);
        
        // Desenha estrela
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + Math.cos(angle) * 10;
            const y1 = cy + Math.sin(angle) * 10;
            const x2 = cx + Math.cos(angle + Math.PI * 0.4) * 5;
            const y2 = cy + Math.sin(angle + Math.PI * 0.4) * 5;
            this.renderer.drawLine(x1, y1, x2, y2, color);
        }
    }
    
    renderRandomButton() {
        const btn = this.layout.randomButton;
        if (!btn) return;
        const color = '#ffcc00';
        
        // Fundo do botão
        this.drawRoundedRect(btn.x, btn.y, btn.width, btn.height, color, true);
        
        const cx = Math.round(btn.x + btn.width / 2);
        const cy = Math.round(btn.y + btn.height / 2);
        
        // Ícone shuffle simplificado (duas setas curvas)
        // Parte superior
        this.renderer.drawLine(cx - 8, cy - 4, cx - 2, cy - 4, '#ffffff');
        this.renderer.drawLine(cx - 2, cy - 4, cx - 2, cy - 2, '#ffffff');
        this.renderer.drawLine(cx - 2, cy - 2, cx + 2, cy - 2, '#ffffff');
        this.renderer.setPixel(cx + 3, cy - 1, 255, 255, 255);
        this.renderer.setPixel(cx + 4, cy - 2, 255, 255, 255);
        
        // Parte inferior (espelhada)
        this.renderer.drawLine(cx - 8, cy + 4, cx - 2, cy + 4, '#ffffff');
        this.renderer.drawLine(cx - 2, cy + 4, cx - 2, cy + 2, '#ffffff');
        this.renderer.drawLine(cx - 2, cy + 2, cx + 2, cy + 2, '#ffffff');
        this.renderer.setPixel(cx + 3, cy + 1, 255, 255, 255);
        this.renderer.setPixel(cx + 4, cy + 2, 255, 255, 255);
        
        // Halo externo para dar destaque
        const haloColor = this.renderer.hexToRgb('#ffcc00');
        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
            for (let rad = Math.max(6, Math.floor(btn.width/2)); rad < Math.max(8, Math.floor(btn.width/1.5)); rad += 1) {
                const px = Math.round(cx + Math.cos(angle) * rad);
                const py = Math.round(cy + Math.sin(angle) * rad);
                this.renderer.setPixelBlend(px, py, haloColor.r, haloColor.g, haloColor.b, 40);
            }
        }
        // Ícone maior (duas setas com mais pixels)
        for (let dx = -3; dx <= -1; dx++) this.renderer.setPixel(cx + dx, cy - 4, 255,255,255);
        for (let dx = -2; dx <= 1; dx++) this.renderer.setPixel(cx + dx, cy - 3, 255,255,255);
        for (let dx = -1; dx <= 2; dx++) this.renderer.setPixel(cx + dx, cy + 3, 255,255,255);
        for (let dx = -2; dx <= 1; dx++) this.renderer.setPixel(cx + dx, cy + 4, 255,255,255);
        // Pontas
        this.renderer.setPixel(cx + 4, cy - 2, 255,255,255);
        this.renderer.setPixel(cx + 4, cy + 2, 255,255,255);
    }
    
    renderCategoryIndicator() {
        // Nome da categoria atual
        const names = {
            shape: 'FORMA',
            material: 'MATÉRIA',
            eye: 'OLHOS',
            mouth: 'BOCA'
        };
        
        // Indicador visual acima do carrossel
        const area = this.layout.carouselArea;
        const color = this.getCategoryColor(this.activeCarousel);
        const { r, g, b } = this.renderer.hexToRgb(color);
        
        // Linha indicadora
        const lineY = area.y - 5;
        const lineWidth = 40;
        const cx = area.x + area.width / 2;
        
        for (let i = -lineWidth / 2; i <= lineWidth / 2; i++) {
            const alpha = Math.floor(200 * (1 - Math.abs(i) / (lineWidth / 2)));
            this.renderer.setPixelBlend(cx + i, lineY, r, g, b, alpha);
        }
    }
    
    getCategoryColor(category) {
        const colors = {
            shape: '#00ffff',
            material: '#ff00ff',
            eye: '#ffff00',
            mouth: '#00ff00'
        };
        return colors[category] || '#ffffff';
    }
    
    drawRoundedRect(x, y, w, h, color, filled = false) {
        const { r, g, b } = this.renderer.hexToRgb(color);
        
        // Linhas horizontais
        for (let i = 3; i < w - 3; i++) {
            this.renderer.setPixel(x + i, y, r, g, b);
            this.renderer.setPixel(x + i, y + h, r, g, b);
        }
        
        // Linhas verticais
        for (let i = 3; i < h - 3; i++) {
            this.renderer.setPixel(x, y + i, r, g, b);
            this.renderer.setPixel(x + w, y + i, r, g, b);
        }
        
        // Cantos arredondados
        this.renderer.setPixel(x + 2, y + 1, r, g, b);
        this.renderer.setPixel(x + 1, y + 2, r, g, b);
        this.renderer.setPixel(x + w - 2, y + 1, r, g, b);
        this.renderer.setPixel(x + w - 1, y + 2, r, g, b);
        this.renderer.setPixel(x + 2, y + h - 1, r, g, b);
        this.renderer.setPixel(x + 1, y + h - 2, r, g, b);
        this.renderer.setPixel(x + w - 2, y + h - 1, r, g, b);
        this.renderer.setPixel(x + w - 1, y + h - 2, r, g, b);
        
        // Preenchimento se filled
        if (filled) {
            for (let py = y + 3; py < y + h - 2; py++) {
                for (let px = x + 3; px < x + w - 2; px++) {
                    this.renderer.setPixelBlend(px, py, r, g, b, 30);
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LAYOUT HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    updateCarouselsLayout() {
        const area = this.layout.carouselArea;
        if (!area) return;
        Object.keys(this.carousels).forEach(key => {
            const c = this.carousels[key];
            if (!c) return;
            c.x = area.x;
            c.y = area.y;
            c.width = area.width;
            c.height = Math.max(40, area.height - 20);
            // Recalcula posições internas
            if (typeof c.calculateItemPositions === 'function') c.calculateItemPositions();
            if (typeof c.snapToSelected === 'function') c.snapToSelected(false);
        });
    }

    positionPet() {
        if (!this.pet) return;
        const petArea = this.layout.petArea;
        this.pet.x = petArea.x + petArea.width / 2;
        this.pet.y = petArea.y + petArea.height / 2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    
    isInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
}
