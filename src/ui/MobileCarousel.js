// ═══════════════════════════════════════════════════════════════════════════
// MOBILE CAROUSEL - Carrossel de Seleção para Touch
// ═══════════════════════════════════════════════════════════════════════════
//
// Um carrossel horizontal otimizado para mobile que permite selecionar
// itens deslizando o dedo. Renderizado no canvas com ícones geométricos.
//
// Features:
//   - Navegação por swipe horizontal
//   - Snap para item central
//   - Momentum/inércia ao soltar
//   - Indicadores de posição
//   - Ícones geométricos (renderizados com Bresenham/Midpoint)
//
// ═══════════════════════════════════════════════════════════════════════════

export default class MobileCarousel {
    constructor(options = {}) {
        // Items do carrossel
        this.items = options.items || [];
        this.selectedIndex = options.initialIndex || 0;
        
        // Posição e dimensões
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 300;
        this.height = options.height || 80;
        
        // Configuração visual
        this.itemWidth = options.itemWidth || 60;
        this.itemHeight = options.itemHeight || 60;
        this.itemGap = options.itemGap || 15;
        this.visibleItems = options.visibleItems || 5;
        
        // Estado de scroll
        this.scrollX = 0;
        this.targetScrollX = 0;
        this.velocity = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartScrollX = 0;
        
        // Física do momentum
        this.friction = 0.92;
        this.snapStrength = 0.15;
        this.minVelocity = 0.5;
        
        // Callbacks
        this.onSelect = options.onSelect || (() => {});
        this.onHover = options.onHover || (() => {});
        
        // Cores
        this.colors = {
            background: options.bgColor || 'rgba(10, 10, 20, 0.8)',
            border: options.borderColor || '#333',
            itemBg: options.itemBgColor || 'rgba(30, 30, 50, 0.9)',
            itemBorder: options.itemBorderColor || '#444',
            selectedBorder: options.selectedBorderColor || '#00ffff',
            selectedGlow: options.selectedGlowColor || '#00ffff',
            text: options.textColor || '#888',
            textSelected: options.textSelectedColor || '#fff',
            indicator: options.indicatorColor || '#444',
            indicatorActive: options.indicatorActiveColor || '#00ffff'
        };
        
        // Cache de posições calculadas
        this.itemPositions = [];
        this.calculateItemPositions();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SETUP DE ITENS
    // ═══════════════════════════════════════════════════════════════════════
    
    setItems(items) {
        this.items = items;
        this.calculateItemPositions();
        this.snapToSelected(false);
    }
    
    calculateItemPositions() {
        this.itemPositions = [];
        const totalWidth = this.items.length * (this.itemWidth + this.itemGap) - this.itemGap;
        const startX = (this.width - this.itemWidth) / 2;
        
        this.items.forEach((item, index) => {
            this.itemPositions.push({
                x: startX + index * (this.itemWidth + this.itemGap),
                targetScrollX: index * (this.itemWidth + this.itemGap)
            });
        });
        
        this.maxScroll = Math.max(0, (this.items.length - 1) * (this.itemWidth + this.itemGap));
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INTERAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Inicia arrasto
     */
    onDragStart(x, y) {
        if (!this.isInBounds(x, y)) return false;
        
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartScrollX = this.scrollX;
        this.velocity = 0;
        
        return true;
    }
    
    /**
     * Durante arrasto
     */
    onDragMove(x, y) {
        if (!this.isDragging) return;
        
        const deltaX = this.dragStartX - x;
        this.scrollX = this.dragStartScrollX + deltaX;
        
        // Calcula velocidade para momentum
        this.velocity = deltaX * 0.1;
        
        // Limita scroll com elasticidade
        if (this.scrollX < 0) {
            this.scrollX *= 0.3;
        } else if (this.scrollX > this.maxScroll) {
            this.scrollX = this.maxScroll + (this.scrollX - this.maxScroll) * 0.3;
        }
    }
    
    /**
     * Finaliza arrasto
     */
    onDragEnd(x, y) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Aplica momentum ou snap
        if (Math.abs(this.velocity) > 5) {
            // Momentum - deixa deslizar
        } else {
            // Snap para o item mais próximo
            this.snapToNearest();
        }
    }
    
    /**
     * Toque/clique em item específico
     */
    onTap(x, y) {
        if (!this.isInBounds(x, y)) return false;
        
        // Encontra item tocado
        const relativeX = x - this.x;
        
        for (let i = 0; i < this.items.length; i++) {
            const itemX = this.itemPositions[i].x - this.scrollX;
            const itemRight = itemX + this.itemWidth;
            
            if (relativeX >= itemX && relativeX <= itemRight) {
                this.selectItem(i);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Swipe horizontal
     */
    onSwipe(direction, velocity) {
        if (direction === 'left') {
            this.selectItem(Math.min(this.items.length - 1, this.selectedIndex + 1));
        } else if (direction === 'right') {
            this.selectItem(Math.max(0, this.selectedIndex - 1));
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SELEÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    
    selectItem(index, animate = true) {
        if (index < 0 || index >= this.items.length) return;
        
        const oldIndex = this.selectedIndex;
        this.selectedIndex = index;
        
        if (animate) {
            this.targetScrollX = this.itemPositions[index].targetScrollX;
        } else {
            this.scrollX = this.itemPositions[index].targetScrollX;
            this.targetScrollX = this.scrollX;
        }
        
        if (oldIndex !== index) {
            this.onSelect(this.items[index], index);
        }
    }
    
    snapToSelected(animate = true) {
        this.selectItem(this.selectedIndex, animate);
    }
    
    snapToNearest() {
        // Encontra o item mais próximo do centro
        const centerScroll = this.scrollX;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        
        this.itemPositions.forEach((pos, index) => {
            const distance = Math.abs(pos.targetScrollX - centerScroll);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });
        
        this.selectItem(nearestIndex);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE (Física)
    // ═══════════════════════════════════════════════════════════════════════
    
    update(deltaTime = 16) {
        if (this.isDragging) return;
        
        // Aplica momentum
        if (Math.abs(this.velocity) > this.minVelocity) {
            this.scrollX += this.velocity;
            this.velocity *= this.friction;
            
            // Bounce nas bordas
            if (this.scrollX < 0) {
                this.scrollX = 0;
                this.velocity *= -0.3;
            } else if (this.scrollX > this.maxScroll) {
                this.scrollX = this.maxScroll;
                this.velocity *= -0.3;
            }
        } else {
            this.velocity = 0;
            
            // Snap suave para target
            const diff = this.targetScrollX - this.scrollX;
            if (Math.abs(diff) > 0.5) {
                this.scrollX += diff * this.snapStrength;
            } else {
                this.scrollX = this.targetScrollX;
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    
    render(renderer) {
        // Background do carrossel
        this.drawBackground(renderer);
        
        // Renderiza items visíveis
        this.items.forEach((item, index) => {
            const itemX = this.x + this.itemPositions[index].x - this.scrollX;
            const itemY = this.y + (this.height - this.itemHeight) / 2;
            
            // Só renderiza se visível
            if (itemX + this.itemWidth >= this.x && itemX <= this.x + this.width) {
                const isSelected = index === this.selectedIndex;
                const distFromCenter = Math.abs(itemX + this.itemWidth/2 - (this.x + this.width/2));
                const scale = Math.max(0.7, 1 - distFromCenter / this.width * 0.5);
                
                this.drawItem(renderer, item, itemX, itemY, isSelected, scale);
            }
        });
        
        // Indicadores de posição
        this.drawIndicators(renderer);
        
        // Setas de navegação
        this.drawNavigationHints(renderer);
    }
    
    drawBackground(renderer) {
        // Borda do carrossel
        const { r, g, b } = renderer.hexToRgb(this.colors.border);
        
        // Linha superior
        for (let x = this.x; x < this.x + this.width; x++) {
            renderer.setPixelBlend(x, this.y, r, g, b, 100);
        }
        // Linha inferior
        for (let x = this.x; x < this.x + this.width; x++) {
            renderer.setPixelBlend(x, this.y + this.height, r, g, b, 100);
        }
    }
    
    drawItem(renderer, item, x, y, isSelected, scale) {
        const centerX = x + this.itemWidth / 2;
        const centerY = y + this.itemHeight / 2;
        const size = Math.floor(this.itemWidth * scale * 0.4);
        
        // Cor do item (usa paleta se disponível)
        const glowColor = item.palette?.glow || item.color || '#00ffff';
        const { r, g, b } = renderer.hexToRgb(glowColor);
        
        // Glow se selecionado
        if (isSelected) {
            // Halo externo
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                for (let rad = size + 2; rad < size + 8; rad++) {
                    const px = centerX + Math.cos(angle) * rad;
                    const py = centerY + Math.sin(angle) * rad;
                    const alpha = Math.floor(60 * (1 - (rad - size - 2) / 6));
                    renderer.setPixelBlend(Math.round(px), Math.round(py), r, g, b, alpha);
                }
            }
        }
        
        // Borda do item (círculo)
        const borderColor = isSelected ? this.colors.selectedBorder : this.colors.itemBorder;
        renderer.drawCircle(Math.round(centerX), Math.round(centerY), size, borderColor);
        
        // Ícone/símbolo do item
        if (item.symbol) {
            // Desenha símbolo como texto (simplificado)
            // Em uma implementação completa, desenharíamos com primitivas
            this.drawSymbol(renderer, item.symbol, centerX, centerY, glowColor, isSelected);
        } else if (item.icon) {
            this.drawGeometricIcon(renderer, item.icon, centerX, centerY, glowColor, size * 0.6);
        }
        
        // Nome abaixo (apenas se selecionado)
        if (isSelected && item.name) {
            // Indicador visual de seleção
            const underlineY = y + this.itemHeight + 5;
            for (let i = -15; i <= 15; i++) {
                const alpha = Math.floor(200 * (1 - Math.abs(i) / 15));
                renderer.setPixelBlend(Math.round(centerX + i), underlineY, r, g, b, alpha);
            }
        }
    }
    
    drawSymbol(renderer, symbol, cx, cy, color, isSelected) {
        // Mapeamento de símbolos para desenhos geométricos
        const { r, g, b } = renderer.hexToRgb(color);
        const alpha = isSelected ? 255 : 150;
        
        // Ponto central como fallback
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (dx * dx + dy * dy <= 4) {
                    renderer.setPixelBlend(Math.round(cx + dx), Math.round(cy + dy), r, g, b, alpha);
                }
            }
        }
    }
    
    drawGeometricIcon(renderer, iconType, cx, cy, color, size) {
        const { r, g, b } = renderer.hexToRgb(color);
        
        switch (iconType) {
            case 'circle':
                renderer.drawCircle(Math.round(cx), Math.round(cy), Math.round(size), color);
                break;
            case 'square':
                const half = Math.floor(size);
                for (let i = -half; i <= half; i++) {
                    renderer.setPixel(cx + i, cy - half, r, g, b);
                    renderer.setPixel(cx + i, cy + half, r, g, b);
                    renderer.setPixel(cx - half, cy + i, r, g, b);
                    renderer.setPixel(cx + half, cy + i, r, g, b);
                }
                break;
            case 'triangle':
                const h = size;
                renderer.drawLine(cx, cy - h, cx - h, cy + h * 0.6, color);
                renderer.drawLine(cx - h, cy + h * 0.6, cx + h, cy + h * 0.6, color);
                renderer.drawLine(cx + h, cy + h * 0.6, cx, cy - h, color);
                break;
            case 'diamond':
                renderer.drawLine(cx, cy - size, cx + size, cy, color);
                renderer.drawLine(cx + size, cy, cx, cy + size, color);
                renderer.drawLine(cx, cy + size, cx - size, cy, color);
                renderer.drawLine(cx - size, cy, cx, cy - size, color);
                break;
            default:
                // Ponto
                renderer.setPixel(cx, cy, r, g, b);
        }
    }
    
    drawIndicators(renderer) {
        if (this.items.length <= 1) return;
        
        const indicatorSize = 4;
        const indicatorGap = 8;
        const totalWidth = this.items.length * indicatorSize + (this.items.length - 1) * indicatorGap;
        const startX = this.x + (this.width - totalWidth) / 2;
        const indicatorY = this.y + this.height - 12;
        
        this.items.forEach((item, index) => {
            const ix = startX + index * (indicatorSize + indicatorGap);
            const isActive = index === this.selectedIndex;
            const color = isActive ? this.colors.indicatorActive : this.colors.indicator;
            const { r, g, b } = renderer.hexToRgb(color);
            
            // Desenha indicador como círculo pequeno
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx * dx + dy * dy <= 1) {
                        renderer.setPixel(ix + dx, indicatorY + dy, r, g, b, isActive ? 255 : 120);
                    }
                }
            }
        });
    }
    
    drawNavigationHints(renderer) {
        // Setas nas laterais se há mais itens
        const arrowY = this.y + this.height / 2;
        const arrowAlpha = 80;
        
        // Seta esquerda
        if (this.selectedIndex > 0) {
            const ax = this.x + 10;
            for (let i = 0; i < 5; i++) {
                renderer.setPixelBlend(ax + i, arrowY - i, 255, 255, 255, arrowAlpha);
                renderer.setPixelBlend(ax + i, arrowY + i, 255, 255, 255, arrowAlpha);
            }
        }
        
        // Seta direita
        if (this.selectedIndex < this.items.length - 1) {
            const ax = this.x + this.width - 10;
            for (let i = 0; i < 5; i++) {
                renderer.setPixelBlend(ax - i, arrowY - i, 255, 255, 255, arrowAlpha);
                renderer.setPixelBlend(ax - i, arrowY + i, 255, 255, 255, arrowAlpha);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    
    isInBounds(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    getSelectedItem() {
        return this.items[this.selectedIndex];
    }
    
    getSelectedIndex() {
        return this.selectedIndex;
    }
}
