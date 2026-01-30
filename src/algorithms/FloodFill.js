// ═══════════════════════════════════════════════════════════════════
// ALGORITMO DE FLOOD FILL - Preenchimento por Inundação
// Implementação com pilha (stack-based) para evitar stack overflow
// ═══════════════════════════════════════════════════════════════════

/**
 * Flood Fill usando pilha (não recursivo)
 * Preenche uma área conectada com a cor especificada
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} startX - Coordenada X inicial
 * @param {number} startY - Coordenada Y inicial
 * @param {string} fillColor - Cor de preenchimento (hex)
 * @param {number} tolerance - Tolerância para comparação de cores (0-255)
 */
export function floodFill(renderer, startX, startY, fillColor, tolerance = 0) {
    const width = renderer.width;
    const height = renderer.height;
    const pixels = renderer.pixels;
    
    startX = Math.round(startX);
    startY = Math.round(startY);
    
    // Verifica limites
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
        return;
    }
    
    // Converte cor de preenchimento
    const fill = hexToRgb(fillColor);
    
    // Obtém cor do pixel inicial
    const startIndex = (startY * width + startX) * 4;
    const targetR = pixels[startIndex];
    const targetG = pixels[startIndex + 1];
    const targetB = pixels[startIndex + 2];
    const targetA = pixels[startIndex + 3];
    
    // Se a cor alvo é igual à cor de preenchimento, não faz nada
    if (colorsMatch(targetR, targetG, targetB, fill.r, fill.g, fill.b, 0)) {
        return;
    }
    
    // Pilha para processamento
    const stack = [[startX, startY]];
    
    // Set para pixels já visitados (evita reprocessamento)
    const visited = new Set();
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        // Pula se já visitou
        if (visited.has(key)) continue;
        
        // Verifica limites
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const index = (y * width + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        
        // Verifica se a cor corresponde à cor alvo
        if (!colorsMatch(r, g, b, targetR, targetG, targetB, tolerance)) {
            continue;
        }
        
        // Marca como visitado
        visited.add(key);
        
        // Preenche o pixel
        pixels[index] = fill.r;
        pixels[index + 1] = fill.g;
        pixels[index + 2] = fill.b;
        pixels[index + 3] = 255;
        
        // Adiciona vizinhos à pilha (4-conectividade)
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
}

/**
 * Flood Fill otimizado usando scanline
 * Mais eficiente para grandes áreas
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} startX - Coordenada X inicial
 * @param {number} startY - Coordenada Y inicial
 * @param {string} fillColor - Cor de preenchimento (hex)
 * @param {number} tolerance - Tolerância para comparação de cores
 */
export function floodFillScanline(renderer, startX, startY, fillColor, tolerance = 0) {
    const width = renderer.width;
    const height = renderer.height;
    const pixels = renderer.pixels;
    
    startX = Math.round(startX);
    startY = Math.round(startY);
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
        return;
    }
    
    const fill = hexToRgb(fillColor);
    
    const startIndex = (startY * width + startX) * 4;
    const targetR = pixels[startIndex];
    const targetG = pixels[startIndex + 1];
    const targetB = pixels[startIndex + 2];
    
    if (colorsMatch(targetR, targetG, targetB, fill.r, fill.g, fill.b, 0)) {
        return;
    }
    
    const stack = [[startX, startY]];
    const visited = new Uint8Array(width * height);
    
    const matchesTarget = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        if (visited[y * width + x]) return false;
        
        const idx = (y * width + x) * 4;
        return colorsMatch(
            pixels[idx], pixels[idx + 1], pixels[idx + 2],
            targetR, targetG, targetB, tolerance
        );
    };
    
    const fillPixel = (x, y) => {
        const idx = (y * width + x) * 4;
        pixels[idx] = fill.r;
        pixels[idx + 1] = fill.g;
        pixels[idx + 2] = fill.b;
        pixels[idx + 3] = 255;
        visited[y * width + x] = 1;
    };
    
    while (stack.length > 0) {
        let [x, y] = stack.pop();
        
        // Move para a esquerda até encontrar limite
        while (x > 0 && matchesTarget(x - 1, y)) {
            x--;
        }
        
        let spanAbove = false;
        let spanBelow = false;
        
        // Processa a linha da esquerda para direita
        while (x < width && matchesTarget(x, y)) {
            fillPixel(x, y);
            
            // Verifica linha acima
            if (!spanAbove && y > 0 && matchesTarget(x, y - 1)) {
                stack.push([x, y - 1]);
                spanAbove = true;
            } else if (spanAbove && y > 0 && !matchesTarget(x, y - 1)) {
                spanAbove = false;
            }
            
            // Verifica linha abaixo
            if (!spanBelow && y < height - 1 && matchesTarget(x, y + 1)) {
                stack.push([x, y + 1]);
                spanBelow = true;
            } else if (spanBelow && y < height - 1 && !matchesTarget(x, y + 1)) {
                spanBelow = false;
            }
            
            x++;
        }
    }
}

/**
 * Flood Fill com gradiente (efeito visual)
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} startX - Coordenada X inicial
 * @param {number} startY - Coordenada Y inicial
 * @param {string} centerColor - Cor no centro (hex)
 * @param {string} edgeColor - Cor nas bordas (hex)
 */
export function floodFillGradient(renderer, startX, startY, centerColor, edgeColor) {
    const width = renderer.width;
    const height = renderer.height;
    const pixels = renderer.pixels;
    
    startX = Math.round(startX);
    startY = Math.round(startY);
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
        return;
    }
    
    const center = hexToRgb(centerColor);
    const edge = hexToRgb(edgeColor);
    
    const startIndex = (startY * width + startX) * 4;
    const targetR = pixels[startIndex];
    const targetG = pixels[startIndex + 1];
    const targetB = pixels[startIndex + 2];
    
    // Primeiro passa: coleta todos os pixels e suas distâncias
    const stack = [[startX, startY, 0]];
    const visited = new Map();
    let maxDist = 0;
    
    while (stack.length > 0) {
        const [x, y, dist] = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const idx = (y * width + x) * 4;
        if (!colorsMatch(pixels[idx], pixels[idx + 1], pixels[idx + 2], targetR, targetG, targetB, 10)) {
            continue;
        }
        
        visited.set(key, { x, y, dist });
        maxDist = Math.max(maxDist, dist);
        
        stack.push([x + 1, y, dist + 1]);
        stack.push([x - 1, y, dist + 1]);
        stack.push([x, y + 1, dist + 1]);
        stack.push([x, y - 1, dist + 1]);
    }
    
    // Segunda passa: preenche com gradiente
    for (const [key, data] of visited) {
        const t = maxDist > 0 ? data.dist / maxDist : 0;
        const idx = (data.y * width + data.x) * 4;
        
        pixels[idx] = Math.round(center.r + (edge.r - center.r) * t);
        pixels[idx + 1] = Math.round(center.g + (edge.g - center.g) * t);
        pixels[idx + 2] = Math.round(center.b + (edge.b - center.b) * t);
        pixels[idx + 3] = 255;
    }
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════

function colorsMatch(r1, g1, b1, r2, g2, b2, tolerance) {
    return Math.abs(r1 - r2) <= tolerance &&
           Math.abs(g1 - g2) <= tolerance &&
           Math.abs(b1 - b2) <= tolerance;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

export default { floodFill, floodFillScanline, floodFillGradient };
