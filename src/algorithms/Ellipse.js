// ═══════════════════════════════════════════════════════════════════
// ALGORITMO DE ELIPSE - Bresenham Midpoint
// Desenha elipses pixel a pixel usando decisão de ponto médio
// ═══════════════════════════════════════════════════════════════════

/**
 * Desenha uma elipse usando algoritmo de Bresenham (Midpoint)
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} rx - Raio X (semi-eixo horizontal)
 * @param {number} ry - Raio Y (semi-eixo vertical)
 * @param {string} color - Cor hexadecimal
 */
export function drawEllipse(renderer, cx, cy, rx, ry, color) {
    const { r, g, b } = hexToRgb(color);
    
    // Algoritmo de Bresenham para Elipse (Midpoint)
    let x = 0;
    let y = ry;
    
    // Valores iniciais
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const twoRx2 = 2 * rx2;
    const twoRy2 = 2 * ry2;
    
    let px = 0;
    let py = twoRx2 * y;
    
    // Região 1: dy/dx > -1
    let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
    
    while (px < py) {
        // Plota os 4 pontos simétricos
        plotEllipsePoints(renderer, cx, cy, x, y, r, g, b);
        
        x++;
        px += twoRy2;
        
        if (p < 0) {
            p += ry2 + px;
        } else {
            y--;
            py -= twoRx2;
            p += ry2 + px - py;
        }
    }
    
    // Região 2: dy/dx < -1
    p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
    
    while (y >= 0) {
        plotEllipsePoints(renderer, cx, cy, x, y, r, g, b);
        
        y--;
        py -= twoRx2;
        
        if (p > 0) {
            p += rx2 - py;
        } else {
            x++;
            px += twoRy2;
            p += rx2 - py + px;
        }
    }
}

/**
 * Desenha uma elipse preenchida usando scanline
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} rx - Raio X
 * @param {number} ry - Raio Y
 * @param {string} color - Cor hexadecimal
 */
export function drawFilledEllipse(renderer, cx, cy, rx, ry, color) {
    const { r, g, b } = hexToRgb(color);
    
    let x = 0;
    let y = ry;
    
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const twoRx2 = 2 * rx2;
    const twoRy2 = 2 * ry2;
    
    let px = 0;
    let py = twoRx2 * y;
    
    // Região 1
    let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
    let lastY = y;
    
    while (px < py) {
        if (y !== lastY) {
            drawHorizontalLine(renderer, cx - x + 1, cx + x - 1, cy + lastY, r, g, b);
            drawHorizontalLine(renderer, cx - x + 1, cx + x - 1, cy - lastY, r, g, b);
            lastY = y;
        }
        
        x++;
        px += twoRy2;
        
        if (p < 0) {
            p += ry2 + px;
        } else {
            y--;
            py -= twoRx2;
            p += ry2 + px - py;
        }
    }
    
    // Região 2
    p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
    
    while (y >= 0) {
        drawHorizontalLine(renderer, cx - x, cx + x, cy + y, r, g, b);
        drawHorizontalLine(renderer, cx - x, cx + x, cy - y, r, g, b);
        
        y--;
        py -= twoRx2;
        
        if (p > 0) {
            p += rx2 - py;
        } else {
            x++;
            px += twoRy2;
            p += rx2 - py + px;
        }
    }
}

/**
 * Desenha elipse com "buraco" no centro (para efeito de íris)
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} cx - Centro X
 * @param {number} cy - Centro Y
 * @param {number} rx - Raio X externo
 * @param {number} ry - Raio Y externo
 * @param {string} color - Cor hexadecimal
 * @param {number} holeRx - Raio X do buraco
 * @param {number} holeRy - Raio Y do buraco
 */
export function drawEllipseWithHole(renderer, cx, cy, rx, ry, color, holeRx, holeRy) {
    const { r, g, b } = hexToRgb(color);
    const width = renderer.width;
    const height = renderer.height;
    
    // Preenche tudo exceto a área da elipse interna
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const dx = px - cx;
            const dy = py - cy;
            
            // Verifica se está dentro da elipse externa
            const outsideOuter = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1;
            
            // Verifica se está fora da elipse interna (o buraco)
            const outsideInner = (dx * dx) / (holeRx * holeRx) + (dy * dy) / (holeRy * holeRy) > 1;
            
            // Preenche se está fora do buraco
            if (outsideOuter || outsideInner) {
                renderer.setPixel(px, py, r, g, b);
            }
        }
    }
}

/**
 * Desenha máscara de íris (tudo preto exceto elipse central)
 * Usado para efeito de abertura/fechamento
 */
export function drawIrisMask(renderer, cx, cy, rx, ry, maskColor = '#000000') {
    const { r, g, b } = hexToRgb(maskColor);
    const width = renderer.width;
    const height = renderer.height;
    
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const dx = px - cx;
            const dy = py - cy;
            
            // Se está fora da elipse, pinta de preto
            if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) {
                renderer.setPixel(px, py, r, g, b);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════

function plotEllipsePoints(renderer, cx, cy, x, y, r, g, b) {
    renderer.setPixel(cx + x, cy + y, r, g, b);
    renderer.setPixel(cx - x, cy + y, r, g, b);
    renderer.setPixel(cx + x, cy - y, r, g, b);
    renderer.setPixel(cx - x, cy - y, r, g, b);
}

function drawHorizontalLine(renderer, x1, x2, y, r, g, b) {
    for (let x = x1; x <= x2; x++) {
        renderer.setPixel(x, y, r, g, b);
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

export default { drawEllipse, drawFilledEllipse, drawEllipseWithHole, drawIrisMask };
