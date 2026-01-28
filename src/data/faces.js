// ═══════════════════════════════════════════════════════════════════
// FACES DATA - Olhos e Bocas disponíveis para o GeoPet
// Catálogo expandido com tipos criativos e expressivos
// ═══════════════════════════════════════════════════════════════════

export const EYES = [
    // ═══ OLHOS CLÁSSICOS ═══
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
    },
    
    // ═══ NOVOS OLHOS CRIATIVOS ═══
    {
        id: 'cyber',
        name: 'Visor Cyber',
        icon: '⌐',
        desc: 'Visor cibernético horizontal pulsante'
    },
    {
        id: 'spiral',
        name: 'Espiral',
        icon: '◎',
        desc: 'Olhos em espiral hipnótica giratória'
    },
    {
        id: 'void',
        name: 'Vazio',
        icon: '○',
        desc: 'Órbitas vazias com ponto de luz central'
    },
    {
        id: 'compound',
        name: 'Composto',
        icon: '⬢',
        desc: 'Olhos compostos de múltiplos pixels'
    },
    {
        id: 'cross',
        name: 'Cruz',
        icon: '✚',
        desc: 'Olhos em formato de cruz/mira'
    },
    {
        id: 'star',
        name: 'Estrela',
        icon: '✦',
        desc: 'Olhos brilhantes estilo anime'
    },
    {
        id: 'glitch',
        name: 'Glitch',
        icon: '▓',
        desc: 'Olhos com efeito de interferência digital'
    },
    {
        id: 'heart',
        name: 'Coração',
        icon: '♥',
        desc: 'Olhos apaixonados em formato de coração'
    }
];

export const MOUTHS = [
    // ═══ BOCAS CLÁSSICAS ═══
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
    },
    
    // ═══ NOVAS BOCAS CRIATIVAS ═══
    {
        id: 'saw',
        name: 'Serra',
        icon: '⋀⋀⋀',
        desc: 'Boca de zigue-zague afiado'
    },
    {
        id: 'joker',
        name: 'Coringa',
        icon: '☺',
        desc: 'Sorriso maníaco que sobe além do rosto'
    },
    {
        id: 'fangs',
        name: 'Presas',
        icon: '⚶',
        desc: 'Boca com presas de vampiro'
    },
    {
        id: 'pulse',
        name: 'Pulso',
        icon: '∿',
        desc: 'Linha de áudio pulsando'
    },
    {
        id: 'zipper',
        name: 'Zíper',
        icon: '⌇',
        desc: 'Boca costurada/zipada'
    },
    {
        id: 'bubble',
        name: 'Bolha',
        icon: '○',
        desc: 'Boca de bolha/soprando'
    },
    {
        id: 'uwu',
        name: 'UwU',
        icon: 'ᵕ',
        desc: 'Boca super fofa estilo UwU'
    },
    {
        id: 'robot',
        name: 'Robô',
        icon: '═',
        desc: 'Boca digital segmentada'
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
    { id: 'blue', name: 'Azul', hex: '#0088ff' },
    { id: 'red', name: 'Vermelho', hex: '#ff3333' },
    { id: 'white', name: 'Branco', hex: '#ffffff' },
    { id: 'lime', name: 'Lima', hex: '#aaff00' },
    { id: 'teal', name: 'Turquesa', hex: '#00aaaa' }
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
