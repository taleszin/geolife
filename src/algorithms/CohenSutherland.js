// ═══════════════════════════════════════════════════════════════════
// ALGORITMO DE COHEN-SUTHERLAND - Clipping de Linhas
// Recorta linhas contra uma janela retangular
// ═══════════════════════════════════════════════════════════════════

// Códigos de região (outcodes)
const INSIDE = 0b0000; // 0
const LEFT   = 0b0001; // 1
const RIGHT  = 0b0010; // 2
const BOTTOM = 0b0100; // 4
const TOP    = 0b1000; // 8

/**
 * Calcula o outcode de um ponto em relação à janela de clipping
 * @param {number} x - Coordenada X do ponto
 * @param {number} y - Coordenada Y do ponto
 * @param {object} window - Janela de clipping {xMin, yMin, xMax, yMax}
 * @returns {number} Outcode do ponto
 */
export function computeOutcode(x, y, window) {
    let code = INSIDE;
    
    if (x < window.xMin) {
        code |= LEFT;
    } else if (x > window.xMax) {
        code |= RIGHT;
    }
    
    if (y < window.yMin) {
        code |= TOP; // Em canvas, Y cresce para baixo
    } else if (y > window.yMax) {
        code |= BOTTOM;
    }
    
    return code;
}

/**
 * Algoritmo de Cohen-Sutherland para clipping de linha
 * @param {number} x0 - X inicial da linha
 * @param {number} y0 - Y inicial da linha
 * @param {number} x1 - X final da linha
 * @param {number} y1 - Y final da linha
 * @param {object} window - Janela de clipping {xMin, yMin, xMax, yMax}
 * @returns {object|null} Linha recortada {x0, y0, x1, y1} ou null se totalmente fora
 */
export function clipLine(x0, y0, x1, y1, window) {
    let outcode0 = computeOutcode(x0, y0, window);
    let outcode1 = computeOutcode(x1, y1, window);
    let accept = false;
    
    while (true) {
        if ((outcode0 | outcode1) === 0) {
            // Ambos dentro - aceita linha completa
            accept = true;
            break;
        } else if ((outcode0 & outcode1) !== 0) {
            // Ambos fora do mesmo lado - rejeita linha
            break;
        } else {
            // Pelo menos um endpoint está fora
            let x, y;
            
            // Escolhe o ponto que está fora
            const outcodeOut = outcode0 !== 0 ? outcode0 : outcode1;
            
            // Calcula interseção com a borda
            if (outcodeOut & TOP) {
                // Ponto está acima da janela
                x = x0 + (x1 - x0) * (window.yMin - y0) / (y1 - y0);
                y = window.yMin;
            } else if (outcodeOut & BOTTOM) {
                // Ponto está abaixo da janela
                x = x0 + (x1 - x0) * (window.yMax - y0) / (y1 - y0);
                y = window.yMax;
            } else if (outcodeOut & RIGHT) {
                // Ponto está à direita da janela
                y = y0 + (y1 - y0) * (window.xMax - x0) / (x1 - x0);
                x = window.xMax;
            } else if (outcodeOut & LEFT) {
                // Ponto está à esquerda da janela
                y = y0 + (y1 - y0) * (window.xMin - x0) / (x1 - x0);
                x = window.xMin;
            }
            
            // Atualiza o ponto que estava fora
            if (outcodeOut === outcode0) {
                x0 = x;
                y0 = y;
                outcode0 = computeOutcode(x0, y0, window);
            } else {
                x1 = x;
                y1 = y;
                outcode1 = computeOutcode(x1, y1, window);
            }
        }
    }
    
    if (accept) {
        return { x0, y0, x1, y1 };
    }
    
    return null; // Linha completamente fora
}

/**
 * Verifica se um ponto está dentro da janela de clipping
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @param {object} window - Janela de clipping
 * @returns {boolean} true se dentro
 */
export function isPointInside(x, y, window) {
    return computeOutcode(x, y, window) === INSIDE;
}

/**
 * Desenha uma linha com clipping usando Cohen-Sutherland
 * @param {Renderer} renderer - Instância do Renderer
 * @param {number} x0 - X inicial
 * @param {number} y0 - Y inicial
 * @param {number} x1 - X final
 * @param {number} y1 - Y final
 * @param {string} color - Cor hexadecimal
 * @param {object} window - Janela de clipping (opcional, usa viewport do renderer)
 */
export function drawClippedLine(renderer, x0, y0, x1, y1, color, window = null) {
    // Usa viewport do renderer se não especificado
    if (!window) {
        window = {
            xMin: renderer.viewport.x,
            yMin: renderer.viewport.y,
            xMax: renderer.viewport.x + renderer.viewport.width - 1,
            yMax: renderer.viewport.y + renderer.viewport.height - 1
        };
    }
    
    const clipped = clipLine(x0, y0, x1, y1, window);
    
    if (clipped) {
        renderer.drawLine(clipped.x0, clipped.y0, clipped.x1, clipped.y1, color);
    }
}

/**
 * Clipa um polígono contra uma janela retangular
 * Usa Sutherland-Hodgman para polígonos
 * @param {Array} vertices - Array de {x, y}
 * @param {object} window - Janela de clipping
 * @returns {Array} Vértices do polígono recortado
 */
export function clipPolygon(vertices, window) {
    if (!vertices || vertices.length < 3) return [];
    
    let output = [...vertices];
    
    // Clipa contra cada borda da janela
    const edges = [
        { code: LEFT, test: (p) => p.x >= window.xMin, intersect: intersectLeft },
        { code: RIGHT, test: (p) => p.x <= window.xMax, intersect: intersectRight },
        { code: TOP, test: (p) => p.y >= window.yMin, intersect: intersectTop },
        { code: BOTTOM, test: (p) => p.y <= window.yMax, intersect: intersectBottom }
    ];
    
    for (const edge of edges) {
        if (output.length === 0) break;
        
        const input = output;
        output = [];
        
        for (let i = 0; i < input.length; i++) {
            const current = input[i];
            const next = input[(i + 1) % input.length];
            
            const currentInside = edge.test(current);
            const nextInside = edge.test(next);
            
            if (currentInside) {
                output.push(current);
                if (!nextInside) {
                    output.push(edge.intersect(current, next, window));
                }
            } else if (nextInside) {
                output.push(edge.intersect(current, next, window));
            }
        }
    }
    
    return output;
}

// Funções de interseção para cada borda
function intersectLeft(p1, p2, window) {
    const t = (window.xMin - p1.x) / (p2.x - p1.x);
    return { x: window.xMin, y: p1.y + t * (p2.y - p1.y) };
}

function intersectRight(p1, p2, window) {
    const t = (window.xMax - p1.x) / (p2.x - p1.x);
    return { x: window.xMax, y: p1.y + t * (p2.y - p1.y) };
}

function intersectTop(p1, p2, window) {
    const t = (window.yMin - p1.y) / (p2.y - p1.y);
    return { x: p1.x + t * (p2.x - p1.x), y: window.yMin };
}

function intersectBottom(p1, p2, window) {
    const t = (window.yMax - p1.y) / (p2.y - p1.y);
    return { x: p1.x + t * (p2.x - p1.x), y: window.yMax };
}

// Exporta constantes para uso externo
export const OUTCODES = { INSIDE, LEFT, RIGHT, BOTTOM, TOP };

export default { 
    clipLine, 
    computeOutcode, 
    isPointInside, 
    drawClippedLine,
    clipPolygon,
    OUTCODES 
};
