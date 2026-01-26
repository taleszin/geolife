// ═══════════════════════════════════════════════════════════════════
// FACES DATA - Olhos e Bocas disponíveis para o GeoPet
// Baseado no sistema de expressões do HYLOMORPH
// ═══════════════════════════════════════════════════════════════════

export const EYES = [
    {
        id: 'circle',
        name: 'Redondos',
        icon: '◉',
        desc: 'Olhos redondos e expressivos'
    },
    {
        id: 'dot',
        name: 'Pontos',
        icon: '•',
        desc: 'Olhos simples e fofos'
    },
    {
        id: 'pixel',
        name: 'Pixel',
        icon: '▪',
        desc: 'Olhos quadrados estilo 8-bit'
    },
    {
        id: 'slit',
        name: 'Felinos',
        icon: '◗',
        desc: 'Olhos de gato/réptil'
    }
];

export const MOUTHS = [
    {
        id: 'simple',
        name: 'Simples',
        icon: '‿',
        desc: 'Boca básica e expressiva'
    },
    {
        id: 'cat',
        name: 'Gatinho',
        icon: 'ω',
        desc: 'Boca estilo gato (w)'
    },
    {
        id: 'pixel',
        name: 'Pixel',
        icon: '▬',
        desc: 'Boca quadrada 8-bit'
    },
    {
        id: 'kawaii',
        name: 'Kawaii',
        icon: '◡',
        desc: 'Boca pequena e fofa'
    }
];

// Cores neon disponíveis
export const COLORS = [
    { id: 'cyan', name: 'Ciano', hex: '#00ffff' },
    { id: 'magenta', name: 'Magenta', hex: '#ff00ff' },
    { id: 'green', name: 'Verde Neon', hex: '#00ff88' },
    { id: 'yellow', name: 'Amarelo', hex: '#ffff00' },
    { id: 'orange', name: 'Laranja', hex: '#ff8800' },
    { id: 'pink', name: 'Rosa', hex: '#ff69b4' },
    { id: 'purple', name: 'Roxo', hex: '#bd00ff' },
    { id: 'blue', name: 'Azul', hex: '#0088ff' }
];

// Mapeamentos rápidos
export const EYES_MAP = {};
EYES.forEach(e => EYES_MAP[e.id] = e);

export const MOUTHS_MAP = {};
MOUTHS.forEach(m => MOUTHS_MAP[m.id] = m);

export const COLORS_MAP = {};
COLORS.forEach(c => COLORS_MAP[c.id] = c);

// IDs disponíveis
export const EYE_IDS = EYES.map(e => e.id);
export const MOUTH_IDS = MOUTHS.map(m => m.id);
export const COLOR_IDS = COLORS.map(c => c.id);

export default { EYES, MOUTHS, COLORS };
