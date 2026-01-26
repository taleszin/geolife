// ═══════════════════════════════════════════════════════════════════
// RENDERER - Motor de Renderização com Algoritmos de CG
// setPixel como base + Bresenham + Midpoint + Scanline
// ═══════════════════════════════════════════════════════════════════

export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // ImageData para manipulação pixel a pixel
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.pixels = this.imageData.data;
        
        // Buffer de profundidade (para futuro uso)
        this.depthBuffer = new Float32Array(this.width * this.height);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // PRIMITIVA BASE: setPixel
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Define um pixel na posição (x, y) com cor RGBA
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @param {number} a - Alpha (0-255)
     */
    setPixel(x, y, r, g, b, a = 255) {
        x = Math.round(x);
        y = Math.round(y);
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        const index = (y * this.width + x) * 4;
        this.pixels[index] = r;
        this.pixels[index + 1] = g;
        this.pixels[index + 2] = b;
        this.pixels[index + 3] = a;
    }
    
    /**
     * Define pixel usando cor hexadecimal
     */
    setPixelHex(x, y, hexColor, alpha = 255) {
        const { r, g, b } = this.hexToRgb(hexColor);
        this.setPixel(x, y, r, g, b, alpha);
    }
    
    /**
     * Define pixel com blending (alpha compositing)
     */
    setPixelBlend(x, y, r, g, b, a) {
        x = Math.round(x);
        y = Math.round(y);
        
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        
        const index = (y * this.width + x) * 4;
        const srcAlpha = a / 255;
        const dstAlpha = this.pixels[index + 3] / 255;
        const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
        
        if (outAlpha > 0) {
            this.pixels[index] = (r * srcAlpha + this.pixels[index] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            this.pixels[index + 1] = (g * srcAlpha + this.pixels[index + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            this.pixels[index + 2] = (b * srcAlpha + this.pixels[index + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            this.pixels[index + 3] = outAlpha * 255;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ALGORITMO DE BRESENHAM - Linhas
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Desenha linha usando algoritmo de Bresenham
     * @param {number} x0 - X inicial
     * @param {number} y0 - Y inicial
     * @param {number} x1 - X final
     * @param {number} y1 - Y final
     * @param {string} color - Cor hexadecimal
     */
    drawLine(x0, y0, x1, y1, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            this.setPixel(x0, y0, r, g, b);
            
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }
    
    /**
     * Desenha linha com espessura
     */
    drawThickLine(x0, y0, x1, y1, color, thickness = 2) {
        const { r, g, b } = this.hexToRgb(color);
        const half = Math.floor(thickness / 2);
        
        // Vetor perpendicular normalizado
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        
        for (let t = -half; t <= half; t++) {
            const ox = nx * t;
            const oy = ny * t;
            this.drawLineRgb(x0 + ox, y0 + oy, x1 + ox, y1 + oy, r, g, b);
        }
    }
    
    drawLineRgb(x0, y0, x1, y1, r, g, b) {
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            this.setPixel(x0, y0, r, g, b);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ALGORITMO MIDPOINT - Círculo
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Desenha círculo usando algoritmo Midpoint
     */
    drawCircle(cx, cy, radius, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        let x = 0;
        let y = radius;
        let d = 1 - radius;
        
        this.plotCirclePoints(cx, cy, x, y, r, g, b);
        
        while (x < y) {
            if (d < 0) {
                d += 2 * x + 3;
            } else {
                d += 2 * (x - y) + 5;
                y--;
            }
            x++;
            this.plotCirclePoints(cx, cy, x, y, r, g, b);
        }
    }
    
    plotCirclePoints(cx, cy, x, y, r, g, b) {
        this.setPixel(cx + x, cy + y, r, g, b);
        this.setPixel(cx - x, cy + y, r, g, b);
        this.setPixel(cx + x, cy - y, r, g, b);
        this.setPixel(cx - x, cy - y, r, g, b);
        this.setPixel(cx + y, cy + x, r, g, b);
        this.setPixel(cx - y, cy + x, r, g, b);
        this.setPixel(cx + y, cy - x, r, g, b);
        this.setPixel(cx - y, cy - x, r, g, b);
    }
    
    /**
     * Círculo preenchido com scanline
     */
    fillCircle(cx, cy, radius, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        for (let y = -radius; y <= radius; y++) {
            const halfWidth = Math.sqrt(radius * radius - y * y);
            for (let x = -halfWidth; x <= halfWidth; x++) {
                this.setPixel(cx + x, cy + y, r, g, b);
            }
        }
    }
    
    /**
     * Círculo com gradiente radial (neon glow)
     */
    fillCircleGradient(cx, cy, radius, colorInner, colorOuter) {
        const inner = this.hexToRgb(colorInner);
        const outer = this.hexToRgb(colorOuter);
        
        for (let y = -radius; y <= radius; y++) {
            const halfWidth = Math.sqrt(radius * radius - y * y);
            for (let x = -halfWidth; x <= halfWidth; x++) {
                const dist = Math.sqrt(x * x + y * y);
                const t = dist / radius;
                
                const r = Math.round(inner.r + (outer.r - inner.r) * t);
                const g = Math.round(inner.g + (outer.g - inner.g) * t);
                const b = Math.round(inner.b + (outer.b - inner.b) * t);
                const a = Math.round(255 * (1 - t * 0.5)); // Fade alpha
                
                this.setPixel(cx + x, cy + y, r, g, b, a);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ALGORITMO MIDPOINT - Elipse
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Desenha elipse usando algoritmo Midpoint
     */
    drawEllipse(cx, cy, rx, ry, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        let x = 0;
        let y = ry;
        
        // Região 1
        let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
        let dx = 2 * ry * ry * x;
        let dy = 2 * rx * rx * y;
        
        while (dx < dy) {
            this.plotEllipsePoints(cx, cy, x, y, r, g, b);
            
            if (d1 < 0) {
                x++;
                dx += 2 * ry * ry;
                d1 += dx + ry * ry;
            } else {
                x++;
                y--;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d1 += dx - dy + ry * ry;
            }
        }
        
        // Região 2
        let d2 = ry * ry * (x + 0.5) * (x + 0.5) + rx * rx * (y - 1) * (y - 1) - rx * rx * ry * ry;
        
        while (y >= 0) {
            this.plotEllipsePoints(cx, cy, x, y, r, g, b);
            
            if (d2 > 0) {
                y--;
                dy -= 2 * rx * rx;
                d2 += rx * rx - dy;
            } else {
                y--;
                x++;
                dx += 2 * ry * ry;
                dy -= 2 * rx * rx;
                d2 += dx - dy + rx * rx;
            }
        }
    }
    
    plotEllipsePoints(cx, cy, x, y, r, g, b) {
        this.setPixel(cx + x, cy + y, r, g, b);
        this.setPixel(cx - x, cy + y, r, g, b);
        this.setPixel(cx + x, cy - y, r, g, b);
        this.setPixel(cx - x, cy - y, r, g, b);
    }
    
    /**
     * Elipse preenchida
     */
    fillEllipse(cx, cy, rx, ry, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        for (let y = -ry; y <= ry; y++) {
            const halfWidth = rx * Math.sqrt(1 - (y * y) / (ry * ry));
            for (let x = -halfWidth; x <= halfWidth; x++) {
                this.setPixel(cx + x, cy + y, r, g, b);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // POLÍGONOS E SCANLINE FILL
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Desenha polígono a partir de vértices
     */
    drawPolygon(vertices, color) {
        const n = vertices.length;
        for (let i = 0; i < n; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % n];
            this.drawLine(v1.x, v1.y, v2.x, v2.y, color);
        }
    }
    
    /**
     * Polígono preenchido usando Scanline Fill
     */
    fillPolygon(vertices, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        if (vertices.length < 3) return;
        
        // Encontrar bounds
        let minY = Infinity, maxY = -Infinity;
        vertices.forEach(v => {
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
        });
        
        minY = Math.ceil(minY);
        maxY = Math.floor(maxY);
        
        // Scanline
        for (let y = minY; y <= maxY; y++) {
            const intersections = [];
            
            for (let i = 0; i < vertices.length; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % vertices.length];
                
                if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
                    const x = v1.x + (y - v1.y) / (v2.y - v1.y) * (v2.x - v1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    this.setPixel(x, y, r, g, b);
                }
            }
        }
    }
    
    /**
     * Polígono preenchido com gradiente
     */
    fillPolygonGradient(vertices, colorTop, colorBottom) {
        const top = this.hexToRgb(colorTop);
        const bottom = this.hexToRgb(colorBottom);
        
        if (vertices.length < 3) return;
        
        let minY = Infinity, maxY = -Infinity;
        vertices.forEach(v => {
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
        });
        
        const height = maxY - minY || 1;
        minY = Math.ceil(minY);
        maxY = Math.floor(maxY);
        
        for (let y = minY; y <= maxY; y++) {
            const t = (y - minY) / height;
            const r = Math.round(top.r + (bottom.r - top.r) * t);
            const g = Math.round(top.g + (bottom.g - top.g) * t);
            const b = Math.round(top.b + (bottom.b - top.b) * t);
            
            const intersections = [];
            
            for (let i = 0; i < vertices.length; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % vertices.length];
                
                if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
                    const x = v1.x + (y - v1.y) / (v2.y - v1.y) * (v2.x - v1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    this.setPixel(x, y, r, g, b);
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RETÂNGULO
    // ═══════════════════════════════════════════════════════════════════
    
    drawRect(x, y, width, height, color) {
        this.drawLine(x, y, x + width, y, color);
        this.drawLine(x + width, y, x + width, y + height, color);
        this.drawLine(x + width, y + height, x, y + height, color);
        this.drawLine(x, y + height, x, y, color);
    }
    
    fillRect(x, y, width, height, color) {
        const { r, g, b } = this.hexToRgb(color);
        
        for (let py = y; py < y + height; py++) {
            for (let px = x; px < x + width; px++) {
                this.setPixel(px, py, r, g, b);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TRANSFORMAÇÕES MATRICIAIS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Aplica matriz de transformação 3x3 a um ponto
     */
    transformPoint(x, y, matrix) {
        return {
            x: matrix[0][0] * x + matrix[0][1] * y + matrix[0][2],
            y: matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]
        };
    }
    
    /**
     * Matriz de translação
     */
    translationMatrix(tx, ty) {
        return [
            [1, 0, tx],
            [0, 1, ty],
            [0, 0, 1]
        ];
    }
    
    /**
     * Matriz de escala
     */
    scaleMatrix(sx, sy) {
        return [
            [sx, 0, 0],
            [0, sy, 0],
            [0, 0, 1]
        ];
    }
    
    /**
     * Matriz de rotação
     */
    rotationMatrix(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [cos, -sin, 0],
            [sin, cos, 0],
            [0, 0, 1]
        ];
    }
    
    /**
     * Multiplica duas matrizes 3x3
     */
    multiplyMatrices(a, b) {
        const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }
    
    /**
     * Transforma array de vértices
     */
    transformVertices(vertices, matrix) {
        return vertices.map(v => this.transformPoint(v.x, v.y, matrix));
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // EFEITOS NEON / GLOW
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Desenha linha com efeito neon (múltiplas passadas com alpha)
     */
    drawNeonLine(x0, y0, x1, y1, color, glowSize = 4) {
        const { r, g, b } = this.hexToRgb(color);
        
        // Glow externo (mais transparente)
        for (let i = glowSize; i > 0; i--) {
            const alpha = Math.round(50 * (1 - i / glowSize));
            this.drawThickLineRgba(x0, y0, x1, y1, r, g, b, alpha, i * 2);
        }
        
        // Linha central (brilhante)
        this.drawLine(x0, y0, x1, y1, color);
    }
    
    drawThickLineRgba(x0, y0, x1, y1, r, g, b, a, thickness) {
        const half = Math.floor(thickness / 2);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        
        for (let t = -half; t <= half; t++) {
            const ox = nx * t;
            const oy = ny * t;
            this.drawLineRgba(x0 + ox, y0 + oy, x1 + ox, y1 + oy, r, g, b, a);
        }
    }
    
    drawLineRgba(x0, y0, x1, y1, r, g, b, a) {
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            this.setPixelBlend(x0, y0, r, g, b, a);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    /**
     * Círculo com glow neon
     */
    drawNeonCircle(cx, cy, radius, color, glowSize = 4) {
        const { r, g, b } = this.hexToRgb(color);
        
        // Glow externo
        for (let i = glowSize; i > 0; i--) {
            const alpha = Math.round(80 * (1 - i / glowSize));
            this.drawCircleRgba(cx, cy, radius + i, r, g, b, alpha);
        }
        
        // Círculo principal
        this.drawCircle(cx, cy, radius, color);
    }
    
    drawCircleRgba(cx, cy, radius, r, g, b, a) {
        let x = 0;
        let y = radius;
        let d = 1 - radius;
        
        const plot = (px, py) => this.setPixelBlend(px, py, r, g, b, a);
        
        const plotPoints = () => {
            plot(cx + x, cy + y);
            plot(cx - x, cy + y);
            plot(cx + x, cy - y);
            plot(cx - x, cy - y);
            plot(cx + y, cy + x);
            plot(cx - y, cy + x);
            plot(cx + y, cy - x);
            plot(cx - y, cy - x);
        };
        
        plotPoints();
        
        while (x < y) {
            if (d < 0) {
                d += 2 * x + 3;
            } else {
                d += 2 * (x - y) + 5;
                y--;
            }
            x++;
            plotPoints();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Converte cor hexadecimal para RGB
     */
    hexToRgb(hex) {
        // Suporta formatos: #RGB, #RRGGBB, RGB, RRGGBB
        hex = hex.replace('#', '');
        
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    }
    
    /**
     * Converte RGB para hexadecimal
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    /**
     * Interpola entre duas cores
     */
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        return this.rgbToHex(
            c1.r + (c2.r - c1.r) * t,
            c1.g + (c2.g - c1.g) * t,
            c1.b + (c2.b - c1.b) * t
        );
    }
    
    /**
     * Limpa o canvas
     */
    clear(color = '#111111') {
        const { r, g, b } = this.hexToRgb(color);
        
        for (let i = 0; i < this.pixels.length; i += 4) {
            this.pixels[i] = r;
            this.pixels[i + 1] = g;
            this.pixels[i + 2] = b;
            this.pixels[i + 3] = 255;
        }
    }
    
    /**
     * Aplica o buffer de pixels ao canvas
     */
    flush() {
        this.ctx.putImageData(this.imageData, 0, 0);
    }
    
    /**
     * Redimensiona o canvas
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.imageData = this.ctx.createImageData(width, height);
        this.pixels = this.imageData.data;
        this.depthBuffer = new Float32Array(width * height);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // VIEWPORT + COHEN-SUTHERLAND CLIPPING
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Define viewport para clipping
     */
    setViewport(x, y, width, height) {
        this.viewport = { x, y, width, height };
    }
    
    /**
     * Cohen-Sutherland region codes
     */
    computeOutCode(x, y) {
        const v = this.viewport || { x: 0, y: 0, width: this.width, height: this.height };
        let code = 0;
        
        if (x < v.x) code |= 1;        // LEFT
        if (x > v.x + v.width) code |= 2;   // RIGHT
        if (y < v.y) code |= 4;        // TOP
        if (y > v.y + v.height) code |= 8;  // BOTTOM
        
        return code;
    }
    
    /**
     * Cohen-Sutherland line clipping
     */
    clipLine(x0, y0, x1, y1) {
        const v = this.viewport || { x: 0, y: 0, width: this.width, height: this.height };
        let outCode0 = this.computeOutCode(x0, y0);
        let outCode1 = this.computeOutCode(x1, y1);
        let accept = false;
        
        while (true) {
            if (!(outCode0 | outCode1)) {
                accept = true;
                break;
            } else if (outCode0 & outCode1) {
                break;
            } else {
                let x, y;
                const outCodeOut = outCode0 ? outCode0 : outCode1;
                
                if (outCodeOut & 8) {
                    x = x0 + (x1 - x0) * (v.y + v.height - y0) / (y1 - y0);
                    y = v.y + v.height;
                } else if (outCodeOut & 4) {
                    x = x0 + (x1 - x0) * (v.y - y0) / (y1 - y0);
                    y = v.y;
                } else if (outCodeOut & 2) {
                    y = y0 + (y1 - y0) * (v.x + v.width - x0) / (x1 - x0);
                    x = v.x + v.width;
                } else {
                    y = y0 + (y1 - y0) * (v.x - x0) / (x1 - x0);
                    x = v.x;
                }
                
                if (outCodeOut === outCode0) {
                    x0 = x;
                    y0 = y;
                    outCode0 = this.computeOutCode(x0, y0);
                } else {
                    x1 = x;
                    y1 = y;
                    outCode1 = this.computeOutCode(x1, y1);
                }
            }
        }
        
        return accept ? { x0, y0, x1, y1 } : null;
    }
    
    /**
     * Desenha linha com clipping
     */
    drawLineClipped(x0, y0, x1, y1, color) {
        const clipped = this.clipLine(x0, y0, x1, y1);
        if (clipped) {
            this.drawLine(clipped.x0, clipped.y0, clipped.x1, clipped.y1, color);
        }
    }
}
