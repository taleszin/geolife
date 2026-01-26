// ═══════════════════════════════════════════════════════════════════════════
// VIEWPORT CLIP SYSTEM - Cohen-Sutherland Line Clipping
// ═══════════════════════════════════════════════════════════════════════════
//
// Implementa o algoritmo Cohen-Sutherland para clipar linhas na viewport,
// essencial quando zoom e pan são aplicados.
//
// Region Codes (outcode):
//   1001 | 1000 | 1010
//   ─────┼──────┼─────
//   0001 | 0000 | 0010   0000 = inside
//   ─────┼──────┼─────
//   0101 | 0100 | 0110
//
//        LEFT   RIGHT   BOTTOM   TOP
//  bit:   0       1       2       3
//
// ═══════════════════════════════════════════════════════════════════════════

// Bits de região
const INSIDE = 0b0000;
const LEFT   = 0b0001;
const RIGHT  = 0b0010;
const BOTTOM = 0b0100;
const TOP    = 0b1000;

export default class ViewportClipSystem {
    constructor() {
        // Viewport bounds (em coordenadas de tela)
        this.xMin = 0;
        this.yMin = 0;
        this.xMax = 100;
        this.yMax = 100;
        
        // Cache de últimos cálculos (otimização)
        this.lastResult = null;
    }
    
    /**
     * Define os limites da viewport
     * @param {number} xMin - Limite esquerdo
     * @param {number} yMin - Limite superior
     * @param {number} xMax - Limite direito
     * @param {number} yMax - Limite inferior
     */
    setViewport(xMin, yMin, xMax, yMax) {
        this.xMin = xMin;
        this.yMin = yMin;
        this.xMax = xMax;
        this.yMax = yMax;
    }
    
    /**
     * Calcula o outcode de um ponto em relação à viewport
     * @param {number} x - Coordenada X do ponto
     * @param {number} y - Coordenada Y do ponto
     * @returns {number} - Código de região (4 bits)
     */
    computeOutcode(x, y) {
        let code = INSIDE;
        
        if (x < this.xMin) {
            code |= LEFT;
        } else if (x > this.xMax) {
            code |= RIGHT;
        }
        
        if (y < this.yMin) {
            code |= TOP;
        } else if (y > this.yMax) {
            code |= BOTTOM;
        }
        
        return code;
    }
    
    /**
     * Algoritmo Cohen-Sutherland para clipar uma linha
     * @param {number} x0 - X inicial
     * @param {number} y0 - Y inicial
     * @param {number} x1 - X final
     * @param {number} y1 - Y final
     * @returns {object|null} - { x0, y0, x1, y1 } clippado ou null se fora
     */
    clipLine(x0, y0, x1, y1) {
        let outcode0 = this.computeOutcode(x0, y0);
        let outcode1 = this.computeOutcode(x1, y1);
        let accept = false;
        
        // Loop até resolver
        while (true) {
            // Trivialmente aceito - ambos dentro
            if ((outcode0 | outcode1) === 0) {
                accept = true;
                break;
            }
            
            // Trivialmente rejeitado - ambos no mesmo lado fora
            if ((outcode0 & outcode1) !== 0) {
                break;
            }
            
            // Precisa clipar
            // Escolhe o ponto fora
            const outcodeOut = outcode1 > outcode0 ? outcode1 : outcode0;
            
            let x, y;
            
            // Encontra interseção
            if (outcodeOut & TOP) {
                // Acima
                x = x0 + (x1 - x0) * (this.yMin - y0) / (y1 - y0);
                y = this.yMin;
            } else if (outcodeOut & BOTTOM) {
                // Abaixo
                x = x0 + (x1 - x0) * (this.yMax - y0) / (y1 - y0);
                y = this.yMax;
            } else if (outcodeOut & RIGHT) {
                // Direita
                y = y0 + (y1 - y0) * (this.xMax - x0) / (x1 - x0);
                x = this.xMax;
            } else if (outcodeOut & LEFT) {
                // Esquerda
                y = y0 + (y1 - y0) * (this.xMin - x0) / (x1 - x0);
                x = this.xMin;
            }
            
            // Substitui ponto fora pelo ponto de interseção
            if (outcodeOut === outcode0) {
                x0 = x;
                y0 = y;
                outcode0 = this.computeOutcode(x0, y0);
            } else {
                x1 = x;
                y1 = y;
                outcode1 = this.computeOutcode(x1, y1);
            }
        }
        
        if (accept) {
            return {
                x0: Math.round(x0),
                y0: Math.round(y0),
                x1: Math.round(x1),
                y1: Math.round(y1)
            };
        }
        
        return null;
    }
    
    /**
     * Verifica se um ponto está dentro da viewport
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isPointInside(x, y) {
        return this.computeOutcode(x, y) === INSIDE;
    }
    
    /**
     * Clipa um círculo (retorna null se completamente fora)
     * @param {number} cx - Centro X
     * @param {number} cy - Centro Y
     * @param {number} r - Raio
     * @returns {object|null} - { cx, cy, r, visible: 'full'|'partial'|null }
     */
    clipCircle(cx, cy, r) {
        // Bounding box do círculo
        const left = cx - r;
        const right = cx + r;
        const top = cy - r;
        const bottom = cy + r;
        
        // Completamente fora
        if (right < this.xMin || left > this.xMax ||
            bottom < this.yMin || top > this.yMax) {
            return null;
        }
        
        // Completamente dentro
        if (left >= this.xMin && right <= this.xMax &&
            top >= this.yMin && bottom <= this.yMax) {
            return { cx, cy, r, visible: 'full' };
        }
        
        // Parcialmente visível
        return { cx, cy, r, visible: 'partial' };
    }
    
    /**
     * Clipa um retângulo (retorna o retângulo clippado)
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @returns {object|null}
     */
    clipRect(x, y, width, height) {
        const x2 = x + width;
        const y2 = y + height;
        
        // Completamente fora
        if (x2 < this.xMin || x > this.xMax ||
            y2 < this.yMin || y > this.yMax) {
            return null;
        }
        
        // Clipa
        const clippedX = Math.max(x, this.xMin);
        const clippedY = Math.max(y, this.yMin);
        const clippedX2 = Math.min(x2, this.xMax);
        const clippedY2 = Math.min(y2, this.yMax);
        
        return {
            x: Math.floor(clippedX),
            y: Math.floor(clippedY),
            width: Math.ceil(clippedX2 - clippedX),
            height: Math.ceil(clippedY2 - clippedY),
            partial: (clippedX !== x || clippedY !== y || 
                     clippedX2 !== x2 || clippedY2 !== y2)
        };
    }
    
    /**
     * Clipa um polígono (Sutherland-Hodgman)
     * @param {Array<{x: number, y: number}>} vertices 
     * @returns {Array<{x: number, y: number}>}
     */
    clipPolygon(vertices) {
        if (!vertices || vertices.length < 3) return [];
        
        let output = [...vertices];
        
        // Clipa contra cada borda
        output = this.clipPolygonAgainstEdge(output, 'left');
        output = this.clipPolygonAgainstEdge(output, 'right');
        output = this.clipPolygonAgainstEdge(output, 'top');
        output = this.clipPolygonAgainstEdge(output, 'bottom');
        
        return output;
    }
    
    /**
     * Clipa polígono contra uma borda (helper para Sutherland-Hodgman)
     */
    clipPolygonAgainstEdge(vertices, edge) {
        if (vertices.length === 0) return [];
        
        const output = [];
        
        for (let i = 0; i < vertices.length; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % vertices.length];
            
            const currentInside = this.isInsideEdge(current.x, current.y, edge);
            const nextInside = this.isInsideEdge(next.x, next.y, edge);
            
            if (currentInside) {
                output.push(current);
                
                if (!nextInside) {
                    // Saindo - adiciona interseção
                    output.push(this.intersectEdge(current, next, edge));
                }
            } else if (nextInside) {
                // Entrando - adiciona interseção e next
                output.push(this.intersectEdge(current, next, edge));
            }
        }
        
        return output;
    }
    
    isInsideEdge(x, y, edge) {
        switch (edge) {
            case 'left': return x >= this.xMin;
            case 'right': return x <= this.xMax;
            case 'top': return y >= this.yMin;
            case 'bottom': return y <= this.yMax;
        }
        return true;
    }
    
    intersectEdge(p1, p2, edge) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let t;
        
        switch (edge) {
            case 'left':
                t = (this.xMin - p1.x) / dx;
                return { x: this.xMin, y: p1.y + t * dy };
            case 'right':
                t = (this.xMax - p1.x) / dx;
                return { x: this.xMax, y: p1.y + t * dy };
            case 'top':
                t = (this.yMin - p1.y) / dy;
                return { x: p1.x + t * dx, y: this.yMin };
            case 'bottom':
                t = (this.yMax - p1.y) / dy;
                return { x: p1.x + t * dx, y: this.yMax };
        }
        return p1;
    }
    
    /**
     * Transforma coordenadas mundo para tela com zoom e pan
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {object} viewport - { zoom, panX, panY }
     * @returns {{x: number, y: number}}
     */
    worldToScreen(worldX, worldY, viewport) {
        const { zoom = 1, panX = 0, panY = 0, centerX = 0, centerY = 0 } = viewport;
        
        // Translada para centro, aplica zoom, translada de volta
        const x = (worldX - centerX) * zoom + centerX + panX;
        const y = (worldY - centerY) * zoom + centerY + panY;
        
        return { x, y };
    }
    
    /**
     * Transforma coordenadas de tela para mundo
     * @param {number} screenX 
     * @param {number} screenY 
     * @param {object} viewport 
     * @returns {{x: number, y: number}}
     */
    screenToWorld(screenX, screenY, viewport) {
        const { zoom = 1, panX = 0, panY = 0, centerX = 0, centerY = 0 } = viewport;
        
        const x = (screenX - panX - centerX) / zoom + centerX;
        const y = (screenY - panY - centerY) / zoom + centerY;
        
        return { x, y };
    }
}

// Singleton para uso global
export const viewportClip = new ViewportClipSystem();
