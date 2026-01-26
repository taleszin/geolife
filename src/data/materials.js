// ═══════════════════════════════════════════════════════════════════════════
// MATERIALS.JS - As Matérias-Primas Primordiais do Universo GEOLIFE
// ═══════════════════════════════════════════════════════════════════════════
// 
// No princípio, havia apenas o Vazio e a Geometria.
// Do encontro entre ambos, nasceram as Quatro Substâncias:
//
//   ◈ AETHERIUM  - O Sopro Etéreo, matéria dos sonhos e pensamentos
//   ◆ CRYSTALINE - O Cristal Vivo, estrutura e memória
//   ◉ IGNIS      - O Fogo Primordial, energia e transformação  
//   ◎ VOIDMATTER - O Nada que Existe, potencial infinito
//
// Cada GeoPet é formado pela combinação única dessas essências.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Definições das Matérias-Primas
 * Cada material possui propriedades visuais e comportamentais únicas
 */
export const MATERIALS = [
    {
        id: 'aetherium',
        name: 'Aetherium',
        symbol: '◈',
        description: 'O Sopro Etéreo. Matéria dos sonhos, leve como pensamento. Seus portadores são contemplativos e sábios.',
        shortDesc: 'Essência etérea e onírica',
        
        // Cores base (serão moduladas pelo algoritmo)
        palette: {
            core: '#e0f7ff',      // Azul gelo claro (centro)
            mid: '#7fdbff',       // Ciano suave
            edge: '#0074D9',      // Azul profundo
            glow: '#00ffff',      // Ciano neon (brilho)
            accent: '#ffffff'     // Branco (highlights)
        },
        
        // Propriedades de renderização
        render: {
            fillType: 'ethereal',     // Tipo de preenchimento
            borderType: 'diffuse',    // Tipo de borda
            animated: true,           // Tem animação?
            density: 0.7,             // Densidade de pixels (0-1)
            noiseScale: 0.05,         // Escala do ruído
            glowIntensity: 0.6        // Intensidade do glow
        },
        
        // Personalidade associada
        personality: ['sábio', 'contemplativo', 'sereno']
    },
    
    {
        id: 'crystaline',
        name: 'Crystaline',
        symbol: '◆',
        description: 'O Cristal Vivo. Estrutura perfeita, memória eterna. Seus portadores são resilientes e determinados.',
        shortDesc: 'Cristal geométrico e estruturado',
        
        palette: {
            core: '#ff00ff',      // Magenta (centro cristalino)
            mid: '#bf00ff',       // Púrpura
            edge: '#7700ff',      // Violeta profundo
            glow: '#ff00ff',      // Magenta neon
            accent: '#ffffff'     // Reflexos brancos
        },
        
        render: {
            fillType: 'crystalline',
            borderType: 'faceted',
            animated: true,
            density: 0.95,
            noiseScale: 0,           // Cristal é preciso, sem ruído
            glowIntensity: 0.8
        },
        
        personality: ['determinado', 'resiliente', 'preciso']
    },
    
    {
        id: 'ignis',
        name: 'Ignis',
        symbol: '◉',
        description: 'O Fogo Primordial. Energia em constante transformação. Seus portadores são apaixonados e intensos.',
        shortDesc: 'Chama viva e pulsante',
        
        palette: {
            core: '#ffffff',      // Branco incandescente (centro)
            mid: '#ffff00',       // Amarelo
            edge: '#ff6600',      // Laranja
            glow: '#ff0000',      // Vermelho (bordas)
            accent: '#ff4444'     // Vermelho claro
        },
        
        render: {
            fillType: 'incandescent',
            borderType: 'flaming',
            animated: true,
            density: 0.85,
            noiseScale: 0.15,        // Alto ruído = chamas
            glowIntensity: 1.0
        },
        
        personality: ['apaixonado', 'intenso', 'transformador']
    },
    
    {
        id: 'voidmatter',
        name: 'Voidmatter',
        symbol: '◎',
        description: 'O Nada que Existe. Potencial infinito, mistério absoluto. Seus portadores são enigmáticos e profundos.',
        shortDesc: 'Vazio cósmico e estelar',
        
        palette: {
            core: '#000011',      // Quase negro (centro)
            mid: '#0a0a2e',       // Azul escuríssimo
            edge: '#1a1a4e',      // Índigo escuro
            glow: '#4444ff',      // Azul elétrico (estrelas)
            accent: '#ffffff'     // Branco (pontos de luz)
        },
        
        render: {
            fillType: 'void',
            borderType: 'singularity',
            animated: true,
            density: 0.15,           // Muito esparso
            noiseScale: 0.02,
            glowIntensity: 0.4
        },
        
        personality: ['enigmático', 'profundo', 'misterioso']
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // NOVAS MATÉRIAS-PRIMAS - Segunda Geração
    // ═══════════════════════════════════════════════════════════════════════
    
    {
        id: 'verdantia',
        name: 'Verdantia',
        symbol: '❋',
        description: 'A Seiva Primordial. Vida em crescimento perpétuo. Seus portadores são regeneradores e harmoniosos.',
        shortDesc: 'Essência vital e orgânica',
        
        palette: {
            core: '#aaffaa',      // Verde claro (centro vital)
            mid: '#44ff44',       // Verde brilhante
            edge: '#00aa00',      // Verde profundo
            glow: '#00ff44',      // Verde neon
            accent: '#ffffff'     // Branco (esporos de luz)
        },
        
        render: {
            fillType: 'organic',
            borderType: 'vine',
            animated: true,
            density: 0.85,
            noiseScale: 0.08,
            glowIntensity: 0.5
        },
        
        personality: ['regenerador', 'harmonioso', 'paciente']
    },
    
    {
        id: 'ferrum',
        name: 'Ferrum',
        symbol: '⬡',
        description: 'O Metal Ancestral. Força e resistência puras. Seus portadores são inabaláveis e protetores.',
        shortDesc: 'Aço forjado e blindado',
        
        palette: {
            core: '#dddddd',      // Prata claro (centro)
            mid: '#888899',       // Cinza azulado
            edge: '#445566',      // Aço escuro
            glow: '#aaccff',      // Azul metálico
            accent: '#ffffff'     // Branco (reflexos)
        },
        
        render: {
            fillType: 'metallic',
            borderType: 'riveted',
            animated: true,
            density: 1.0,            // Sólido total
            noiseScale: 0.03,
            glowIntensity: 0.3
        },
        
        personality: ['inabalável', 'protetor', 'resoluto']
    },
    
    {
        id: 'tempestium',
        name: 'Tempestium',
        symbol: '⚡',
        description: 'A Fúria Elétrica. Energia em estado puro e caótico. Seus portadores são imprevisíveis e poderosos.',
        shortDesc: 'Relâmpago cristalizado',
        
        palette: {
            core: '#ffffff',      // Branco elétrico
            mid: '#aaffff',       // Ciano claro
            edge: '#4488ff',      // Azul elétrico
            glow: '#ffff00',      // Amarelo (faíscas)
            accent: '#ff88ff'     // Magenta (descargas)
        },
        
        render: {
            fillType: 'electric',
            borderType: 'sparking',
            animated: true,
            density: 0.75,
            noiseScale: 0.12,
            glowIntensity: 1.0
        },
        
        personality: ['imprevisível', 'poderoso', 'veloz']
    },
    
    {
        id: 'umbralith',
        name: 'Umbralith',
        symbol: '◐',
        description: 'A Pedra das Sombras. Mistério solidificado. Seus portadores são furtivos e observadores.',
        shortDesc: 'Obsidiana sombria',
        
        palette: {
            core: '#1a1a2e',      // Roxo escuríssimo
            mid: '#2d2d44',       // Cinza arroxeado
            edge: '#0d0d1a',      // Quase negro
            glow: '#9944ff',      // Roxo neon
            accent: '#ff44aa'     // Rosa (veios de energia)
        },
        
        render: {
            fillType: 'shadow',
            borderType: 'wispy',
            animated: true,
            density: 0.9,
            noiseScale: 0.06,
            glowIntensity: 0.6
        },
        
        personality: ['furtivo', 'observador', 'estratégico']
    }
];

/**
 * Mapa para acesso rápido por ID
 */
export const MATERIALS_MAP = MATERIALS.reduce((map, mat) => {
    map[mat.id] = mat;
    return map;
}, {});

/**
 * Retorna o material pelo índice
 */
export function getMaterialByIndex(index) {
    return MATERIALS[index % MATERIALS.length];
}

/**
 * Retorna o material pelo ID
 */
export function getMaterialById(id) {
    return MATERIALS_MAP[id] || MATERIALS[0];
}
