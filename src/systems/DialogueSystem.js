// ═══════════════════════════════════════════════════════════════════
// DIALOGUE SYSTEM - Falas e Pensamentos do GeoPet
// Sistema de texto procedural baseado em emoções e contexto
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// BANCO DE FRASES POR CONTEXTO/EMOÇÃO
// ═══════════════════════════════════════════════════════════════════

const DIALOGUES = {
    // ═══ ESTADO IDLE (ocioso) ═══
    idle: {
        happy: [
            "♪ La la la~",
            "Que dia lindo!",
            "Estou tão feliz!",
            "✧ Brilhando ✧",
            "Yay~!",
            "Hehe~",
            "♫ ♪ ♫",
            "Tudo é geométrico!",
            "Adoro ser um {shape}!"
        ],
        neutral: [
            "...",
            "Hmm...",
            "Zzz... ops, acordei!",
            "*olha ao redor*",
            "O que fazer?",
            "Pensando...",
            "*boceja*",
            "Tudo tranquilo~"
        ],
        sad: [
            "Snif...",
            "Estou com fome...",
            "Me alimenta?",
            "*barriga ronca*",
            "Tão... fraco...",
            "Preciso de comida...",
            "Minha energia...",
            "😢"
        ],
        dying: [
            "Socorro...",
            "Muito... fraco...",
            "*tremendo*",
            "Preciso... comer...",
            "Me ajuda...",
            "Não aguento...",
            "💀"
        ]
    },
    
    // ═══ ALIMENTAÇÃO ═══
    eating: [
        "NOM NOM NOM!",
        "Delícia!",
        "Obrigado pela comida!",
        "*mastiga feliz*",
        "Que gostoso!",
        "Mais! Mais!",
        "Nhom nhom~",
        "Energia restaurada!",
        "Aaah~ satisfeito!",
        "Isso era bom!"
    ],
    
    // ═══ CARINHO ═══
    petted: [
        "Aaah~",
        "Que gostoso!",
        "Continue!",
        "*ronrona geometricamente*",
        "Adoro carinho!",
        "Você é o melhor!",
        "💕",
        "Mais mais!",
        "*feliz*"
    ],
    
    // ═══ MOVIMENTO ═══
    moving: [
        "*pula pula*",
        "Lá vou eu!",
        "Wheee~!",
        "Explorando!",
        "Aventura!",
        "*rola*"
    ],
    
    // ═══ CRIAÇÃO (nascimento) ═══
    birth: [
        "Olá mundo!",
        "Eu existo!",
        "Sou um {shape}!",
        "Prazer em conhecer!",
        "Vamos ser amigos?",
        "✧ Nasci! ✧",
        "Que cores lindas!",
        "Geometria é vida!"
    ],
    
    // ═══ SAUDAÇÃO ═══
    greeting: [
        "Oi!",
        "Olá!",
        "Hey!",
        "Voltou!",
        "Senti sua falta!",
        "Yay, você!",
        "*acena*"
    ],
    
    // ═══ DESPEDIDA (ao sair) ═══
    farewell: [
        "Tchau!",
        "Volta logo!",
        "Vou sentir saudade...",
        "Bye bye~",
        "*acena triste*"
    ],
    
    // ═══ CONQUISTAS ═══
    levelUp: [
        "LEVEL UP!",
        "Fiquei mais forte!",
        "Evoluindo!",
        "✧ POWER UP ✧",
        "Crescendo!"
    ],
    
    // ═══ CHOQUE ELÉTRICO ═══
    shocked: [
        "AAAHHH!!!",
        "⚡ BZZZZT! ⚡",
        "M-meus v-vértices!",
        "*frita geometricamente*",
        "ISSO DÓI!",
        "POR QUÊ?!",
        "Minhas arestas!",
        "*pixels tremendo*",
        "Não de novo...",
        "Estou... carregado!",
        "QUE TENSÃO!",
        "*zzzzap*"
    ],
    
    // ═══ CONGELAMENTO ═══
    frozen: [
        "F-f-frio...",
        "*congela*",
        "Meus pixels... duros...",
        "❄️ GELANDO ❄️",
        "N-não consigo... mexer...",
        "Tão... frio...",
        "*treme de frio*",
        "Minhas cores... azuis...",
        "Preciso de calor...",
        "Virando... gelo...",
        "*dentes batendo*",
        "Socorro... congelando..."
    ],
    
    // ═══ DESCONGELANDO ═══
    thawing: [
        "Aaah... derretendo...",
        "Voltando ao normal!",
        "Finalmente... calor!",
        "Minhas formas voltaram!",
        "*se aquecendo*"
    ],
    
    // ═══ MUTAÇÃO ═══
    mutating: [
        "O QUE ESTÁ ACONTECENDO?!",
        "Minha forma... mudando!",
        "AAAH não sou mais eu!",
        "*glitch intenso*",
        "Quem... sou eu?",
        "Meus vértices... diferentes!",
        "✧ TRANSFORMANDO ✧",
        "Instável... molecularmente...",
        "EU ERA UM {shape}!",
        "Isso é... estranho...",
        "*pixels reorganizando*",
        "Não reconheço meu corpo!"
    ],
    
    // ═══ PÓS-MUTAÇÃO ═══
    mutated: [
        "Sou um... novo eu?",
        "Que forma estranha...",
        "Preciso me acostumar...",
        "Olha só meus ângulos!",
        "Diferente... mas ok!",
        "*examina nova forma*"
    ],
    
    // ═══ CÓCEGAS ═══
    tickled: [
        "HAHAHA!",
        "Para! Hehe!",
        "Não! Cócegas não! Haha!",
        "*morrendo de rir*",
        "Ahahaha! Chega!",
        "Minhas arestas são sensíveis!",
        "HIHIHI~",
        "Não nos vértices! Haha!",
        "*risada geométrica*",
        "Para para HAHAHA!",
        "Aiii que cócegas!",
        "♪ Hehehe~ ♪"
    ],
    
    // ═══ CURAR/HEAL ═══
    healed: [
        "Aaah~ que alívio!",
        "Me sinto renovado!",
        "Obrigado pelo cuidado!",
        "✧ Restaurado ✧",
        "Energia positiva!",
        "Muito melhor!",
        "*brilha de gratidão*",
        "Você é gentil!"
    ],
    
    // ═══ REAÇÕES A MAUS TRATOS REPETIDOS ═══
    mistreated: [
        "Por que faz isso?",
        "Eu confiei em você...",
        "Isso machuca...",
        "Não gosto disso...",
        "*olhar triste*",
        "Preferia carinho...",
        "Sou só formas... mas sinto...",
        "Você gosta de me ver sofrer?"
    ],
    
    // ═══ REAÇÕES A DONO CARINHOSO ═══
    loved: [
        "Melhor dono!",
        "Te adoro! 💕",
        "Obrigado por cuidar de mim!",
        "Você é especial!",
        "*coração geométrico*",
        "Sortudo por ter você!",
        "♥ Amor infinito ♥"
    ]
};

// ═══════════════════════════════════════════════════════════════════
// EMOJIS POR EMOÇÃO (para exibição visual)
// ═══════════════════════════════════════════════════════════════════

const EMOTION_EMOJIS = {
    happy: ['✧', '♪', '♫', '💕', '✨', '😊'],
    neutral: ['...', '~', '・', '○'],
    sad: ['😢', '💧', ';;', '...'],
    dying: ['💀', '😵', '×_×', '...'],
    eating: ['🍎', '😋', '♨', 'NOM'],
    love: ['💕', '💗', '❤', '♥'],
    surprised: ['!?', '!!', '⚡', '😮'],
    shocked: ['⚡', '💥', '😱', 'ZZZAP'],
    frozen: ['❄️', '🥶', '💎', '*.*'],
    mutating: ['🔄', '✧', '???', '!?!'],
    tickled: ['😂', '🤣', 'haha', '~♪']
};

// ═══════════════════════════════════════════════════════════════════
// NOME DAS FORMAS (para substituição em templates)
// ═══════════════════════════════════════════════════════════════════

const SHAPE_NAMES = {
    circulo: 'círculo',
    quadrado: 'quadrado',
    triangulo: 'triângulo',
    hexagono: 'hexágono',
    losango: 'losango',
    estrela: 'estrela'
};

// ═══════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

class DialogueSystemClass {
    constructor() {
        // Histórico de falas (evita repetição)
        this.recentDialogues = [];
        this.maxHistory = 5;
        
        // Cooldown entre falas automáticas
        this.lastDialogueTime = 0;
        this.dialogueCooldown = 5000; // 5 segundos
        
        // Callback para quando uma fala é gerada
        this.onDialogue = null;
    }
    
    /**
     * Define callback para quando o pet fala
     * @param {Function} callback - (text, emotion, context) => void
     */
    setOnDialogue(callback) {
        this.onDialogue = callback;
    }
    
    /**
     * Gera uma fala baseada no contexto e emoção
     * @param {string} context - Contexto: 'idle', 'eating', 'petted', etc.
     * @param {string} emotion - Emoção: 'happy', 'sad', 'neutral', etc.
     * @param {string} shapeId - Forma do pet (para substituição de template)
     * @returns {string} Frase gerada
     */
    generateDialogue(context, emotion = 'neutral', shapeId = 'circulo') {
        let phrases;
        
        // Contextos especiais que têm suas próprias frases
        const specialContexts = [
            'eating', 'petted', 'moving', 'birth', 'greeting', 'farewell', 'levelUp',
            'shocked', 'frozen', 'thawing', 'mutating', 'mutated', 'tickled', 'healed',
            'mistreated', 'loved'
        ];
        
        if (specialContexts.includes(context) && DIALOGUES[context]) {
            phrases = DIALOGUES[context];
        } else if (DIALOGUES.idle && DIALOGUES.idle[emotion]) {
            // Usa idle com emoção
            phrases = DIALOGUES.idle[emotion];
        } else {
            // Fallback
            phrases = DIALOGUES.idle?.neutral || ['...'];
        }
        
        if (phrases.length === 0) {
            return '...';
        }
        
        // Evita repetição recente
        let attempts = 0;
        let phrase;
        do {
            phrase = phrases[Math.floor(Math.random() * phrases.length)];
            attempts++;
        } while (this.recentDialogues.includes(phrase) && attempts < 5);
        
        // Adiciona ao histórico
        this.recentDialogues.push(phrase);
        if (this.recentDialogues.length > this.maxHistory) {
            this.recentDialogues.shift();
        }
        
        // Substitui placeholders
        phrase = this._processTemplate(phrase, shapeId);
        
        return phrase;
    }
    
    /**
     * Tenta gerar fala automática (com cooldown)
     */
    tryAutoDialogue(emotion, shapeId) {
        const now = Date.now();
        if (now - this.lastDialogueTime < this.dialogueCooldown) {
            return null;
        }
        
        // Chance de falar baseada na emoção
        const speakChance = {
            happy: 0.15,
            neutral: 0.05,
            sad: 0.10,
            dying: 0.20
        };
        
        if (Math.random() > (speakChance[emotion] || 0.05)) {
            return null;
        }
        
        this.lastDialogueTime = now;
        const dialogue = this.generateDialogue('idle', emotion, shapeId);
        
        if (this.onDialogue) {
            this.onDialogue(dialogue, emotion, 'idle');
        }
        
        return dialogue;
    }
    
    /**
     * Força uma fala imediata (ignora cooldown)
     */
    speak(context, emotion, shapeId) {
        this.lastDialogueTime = Date.now();
        const dialogue = this.generateDialogue(context, emotion, shapeId);
        
        if (this.onDialogue) {
            this.onDialogue(dialogue, emotion, context);
        }
        
        return dialogue;
    }
    
    /**
     * Retorna emoji aleatório para a emoção
     */
    getEmoji(emotion) {
        const emojis = EMOTION_EMOJIS[emotion] || EMOTION_EMOJIS.neutral;
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    /**
     * Processa template substituindo {shape}
     */
    _processTemplate(text, shapeId) {
        const shapeName = SHAPE_NAMES[shapeId] || 'forma';
        return text.replace(/{shape}/g, shapeName);
    }
}

// Singleton export
export const DialogueSystem = new DialogueSystemClass();
export default DialogueSystem;
