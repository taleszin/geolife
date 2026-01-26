// ═══════════════════════════════════════════════════════════════════
// SHAPES DATA - Formas disponíveis para o GeoPet
// ═══════════════════════════════════════════════════════════════════

export const SHAPES = [
    {
        id: 'circulo',
        name: 'Círculo',
        icon: '●',
        desc: 'Forma suave e amigável',
        // Função que retorna os vértices/parâmetros para renderização
        getParams: (size) => ({
            type: 'circle',
            radius: size
        })
    },
    {
        id: 'quadrado',
        name: 'Quadrado',
        icon: '■',
        desc: 'Forma sólida e estável',
        getParams: (size) => ({
            type: 'polygon',
            vertices: [
                { x: -size, y: -size },
                { x: size, y: -size },
                { x: size, y: size },
                { x: -size, y: size }
            ]
        })
    },
    {
        id: 'triangulo',
        name: 'Triângulo',
        icon: '▲',
        desc: 'Forma afiada e dinâmica',
        getParams: (size) => ({
            type: 'polygon',
            vertices: [
                { x: 0, y: -size * 1.1 },
                { x: size, y: size * 0.8 },
                { x: -size, y: size * 0.8 }
            ]
        })
    },
    {
        id: 'hexagono',
        name: 'Hexágono',
        icon: '⬡',
        desc: 'Forma equilibrada e harmoniosa',
        getParams: (size) => {
            const vertices = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                vertices.push({
                    x: Math.cos(angle) * size,
                    y: Math.sin(angle) * size
                });
            }
            return { type: 'polygon', vertices };
        }
    },
    {
        id: 'losango',
        name: 'Losango',
        icon: '◆',
        desc: 'Forma elegante e angular',
        getParams: (size) => ({
            type: 'polygon',
            vertices: [
                { x: 0, y: -size * 1.2 },
                { x: size * 0.8, y: 0 },
                { x: 0, y: size * 1.2 },
                { x: -size * 0.8, y: 0 }
            ]
        })
    },
    {
        id: 'estrela',
        name: 'Estrela',
        icon: '★',
        desc: 'Forma brilhante e especial',
        getParams: (size) => {
            const vertices = [];
            const outerR = size;
            const innerR = size * 0.4;
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI / 5) * i - Math.PI / 2;
                const r = i % 2 === 0 ? outerR : innerR;
                vertices.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r
                });
            }
            return { type: 'polygon', vertices };
        }
    }
];

// Mapeamento rápido por ID
export const SHAPES_MAP = {};
SHAPES.forEach(shape => {
    SHAPES_MAP[shape.id] = shape;
});

// IDs das formas disponíveis no MVP
export const SHAPE_IDS = SHAPES.map(s => s.id);

export default SHAPES;
