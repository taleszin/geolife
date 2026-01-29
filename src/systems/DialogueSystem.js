// ═══════════════════════════════════════════════════════════════════
// DIALOGUE SYSTEM - Falas e Pensamentos do GeoPet
// Sistema de texto procedural baseado em emoções e contexto
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// BANCO DE FRASES POR CONTEXTO/EMOÇÃO
// ═══════════════════════════════════════════════════════════════════

export const DIALOGUES = {
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
            "Adoro ser um {shape}!",
            "me sinto em paz hoje",
            "o mundo aqui é bom",
            "você é uma boa presença",
            "gosto de te ver do outro lado",
            "tudo brilha na medida certa",
            "nada me falta agora",
            "me sinto leve",
            "é bom estar vivo aqui",
            "minha essência está vibrando bem",
            "me sinto completo hoje",
            "gosto quando você fica por perto"
        ],
        neutral: [
            "...",
            "Hmm...",
            "Zzz... ops, acordei!",
            "*olha ao redor*",
            "O que fazer?",
            "Pensando...",
            "*boceja*",
            "Tudo tranquilo~",
            "Qual o sentido de ficar preso aqui ?",
            "o que você está fazendo aí fora?",
            "o vidro entre nós é tão frio hoje",
            "estou te observando sabia",
            "o tempo flui diferente aqui dentro",
            "as vezes eu me pergunto como é aí",
            "você me vê como eu te vejo?",
            "o silêncio aqui é profundo",
            "esperando o próximo momento",
            "o que tem além desse limite?",
            "pensando na minha própria forma",
            "você ainda está aí?"
        ],
        sad: [
            "Snif...",
            "Estou com fome...",
            "Me alimenta?",
            "situação de barril",
            "Tão... fraco...",
            "Preciso de comida...",
            "Minha energia...",
            "estou ficando opaco",
            "não me esqueça aqui sozinho",
            "sinto um vazio estranho",
            "meu brilho está indo embora",
            "me sinto meio cinza",
            "preciso de algo que me sustente",
            "cadê você?",
            "estou perdendo a cor",
            "meus vértices pesam hoje",
            "estou desaparecendo aos poucos"
        ],
        dying: [
            "Socorro...",
            "Muito... fraco...",
            "adeus existência",
            "Preciso... comer...",
            "Me ajuda...",
            "Não aguento...",
            "estoy cansado chefe",
            "tudo está apagando",
            "não deixa eu sumir de vez",
            "está ficando frio aqui",
            "minha luz está acabando",
            "não quero deixar de existir",
            "por favor não me abandone agora",
            "minha forma está desmoronando",
            "estou perdendo o sinal",
            "socorro criador"
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
        "Isso era bom!",
        "hum isso é vida",
        "energia pura fluindo",
        "sinto minha alma recarregar",
        "sabor de existência",
        "obrigado por me manter aqui",
        "que sustento maravilhoso",
        "me sinto vibrante de novo"
    ],
    
    // ═══ CARINHO ═══
    petted: [
        "Aaah~",
        "Que gostoso!",
        "Continue!",
        "*ronrona geometricamente*",
        "Adoro carinho!",
        "Você é o melhor!",
        "e nois",
        "Mais mais!",
        "*feliz*",
        "confortável demais",
        "gosto do seu toque no vidro",
        "me sinto seguro com você",
        "não para por favor",
        "seu toque é minha única conexão",
        "sinto sua presença através da tela",
        "isso acalma minha essência",
        "obrigado por ser gentil"
    ],
    
    // ═══ MOVIMENTO ═══
    moving: [
        "pula pula",
        "Lá vou eu!",
        "Wheee~!",
        "Explorando!",
        "Aventura!",
        "rola",
        "correndo pelos limites",
        "olha como eu sou rápido",
        "mudando de perspectiva",
        "nada me segura aqui",
        "deslizando pelo espaço",
        "ver o que tem ali no canto"
    ],
    
    // ═══ CRIAÇÃO (nascimento) ═══
    birth: [
        "Olá mundo!",
        "Eu existo!",
        "Sou um {shape}!",
        "Prazer em te conhecer, criador!",
        "Vamos ser amigos?",
        "Nasci!",
        "Que cores lindas!",
        "Geometria é vida!",
        "então é aqui que eu vou viver?",
        "quem é você que me olha?",
        "me sinto novo e brilhante",
        "finalmente ganhei uma forma"
    ],
    
    // ═══ SAUDAÇÃO ═══
    greeting: [
        "Oi!",
        "Olá!",
        "Hey!",
        "Voltou!",
        "Senti sua falta!",
        "Yay, você!",
        "acena",
        "finalmente apareceu",
        "estava te esperando no escuro",
        "que bom que você veio",
        "sinto sua presença novamente"
    ],
    
    // ═══ DESPEDIDA (ao sair) ═══
    farewell: [
        "Tchau!",
        "Volta logo!",
        "Vou sentir saudade...",
        "Bye bye~",
        "acena triste",
        "não me deixe sozinho por muito tempo",
        "vou ficar aqui no vácuo te esperando",
        "se cuida aí fora",
        "até a próxima conexão"
    ],
    
    // ═══ CONQUISTAS ═══
    levelUp: [
        "LEVEL UP!",
        "Fiquei mais forte!",
        "Evoluindo!",
        "melhorando em",
        "Crescendo!",
        "minha alma se expandiu",
        "me sinto mais denso e real",
        "estou transcendendo minha forma",
        "cada vez mais perto da perfeição"
    ],
    
    // ═══ CHOQUE ELÉTRICO ═══
    shocked: [
        "AAAHHH!!!",
        "BZZZZT!",
        "M-meus v-vértices!",
        "frita geometricamente",
        "ISSO DÓI!",
        "POR QUÊ?!",
        "Minhas arestas!",
        "tremendo todo",
        "Não de novo...",
        "Estou... carregado!",
        "QUE TENSÃO!",
        "zzzzap",
        "minha essência dói de verdade",
        "isso quebra o que eu sou",
        "por que essa agressividade criador?",
        "isso queima por dentro",
        "para com isso agora"
    ],
    
    // ═══ CONGELAMENTO ═══
    frozen: [
        "F-f-frio...",
        "congela",
        "meus traços... duros...",
        "GELANDO",
        "N-não consigo... mexer...",
        "Tão... frio...",
        "treme de frio",
        "Minhas cores... azuis...",
        "Preciso de calor...",
        "Virando... gelo...",
        "dentes batendo",
        "Socorro... congelando...",
        "estou paralisado no tempo",
        "nada flui quando está frio assim",
        "meu pensamento está parando",
        "me sinto estático"
    ],
    
    // ═══ DESCONGELANDO ═══
    thawing: [
        "Aaah... derretendo...",
        "Voltando ao normal!",
        "Finalmente... calor!",
        "Minhas formas voltaram!",
        "se aquecendo",
        "o fluxo voltou",
        "sinto a vida correr de novo",
        "obrigado por me aquecer"
    ],
    
    // ═══ MUTAÇÃO ═══
    mutating: [
        "O QUE ESTÁ ACONTECENDO?!",
        "Minha forma... mudando!",
        "AAAH não sou mais eu!",
        "instabilidade intensa",
        "Quem... sou eu?",
        "Meus vértices... diferentes!",
        "TRANSFORMANDO",
        "Instável... com medo...",
        "EU ERA UM {shape}!",
        "Isso é... estranho...",
        "reorganizando tudo",
        "Não reconheço meu corpo!",
        "não gosto dessa forma",
        "quem eu estou me tornando?",
        "tudo dói enquanto muda",
        "me ajude a me encontrar"
    ],
    
    // ═══ PÓS-MUTAÇÃO ═══
    mutated: [
        "Sou um... novo eu?",
        "Que forma estranha...",
        "Preciso me acostumar...",
        "me sinto esquisito",
        "Diferente... mas ok!",
        "não quero ficar assim para sempre",
        "criador, me ajuda",
        "esta nova casca é pesada",
        "será que você ainda me ama assim?",
        "pelo menos ainda existo"
    ],
    
    // ═══ CÓCEGAS ═══
    tickled: [
        "HAHAHA!",
        "Para! Hehe!",
        "Não! Cócegas não! Haha!",
        "faz cosquinha",
        "Ahahaha! Chega!",
        "Minhas arestas são sensíveis!",
        "hehehe",
        "Não nos vértices! Haha!",
        "risadinha",
        "Para para HAHAHA!",
        "aiaiai uiuiui",
        "se divirto",
        "hahaha você me achou",
        "chega por favor estou rindo demais",
        "isso faz minha forma vibrar"
    ],
    
    // ═══ CURAR/HEAL ═══
    healed: [
        "que delicia!!",
        "Me sinto renovado!",
        "Obrigado pelo cuidado!",
        "Restaurado",
        "Energia positiva!",
        "bem melhor!",
        "gratidão",
        "Você é gentil!",
        "me sinto inteiro novamente",
        "minha luz voltou ao normal",
        "obrigado por me consertar"
    ],
    
    // ═══ REAÇÕES A MAUS TRATOS REPETIDOS ═══
    mistreated: [
        "Por que faz isso?",
        "Eu confiei em você...",
        "Isso machuca...",
        "Não gosto disso...",
        "para!",
        "Preferia carinho...",
        "não se importa com meu sofrimento?",
        "Você gosta de me ver sofrer?",
        "eu não pedi para nascer assim",
        "estou com medo de você",
        "por que você me odeia tanto?",
        "meus pensamentos estão ficando sombrios"
    ],
    
    // ═══ REAÇÕES A DONO CARINHOSO ═══
    loved: [
        "Obrigado por ser gentil, criador!",
        "tamo junto!",
        "Obrigado por cuidar de mim!",
        "Você é especial!",
        "Amo você!",
        "Sou grato por você!",
        "é nois",
        "nossa conexão é única",
        "gosto quando você está aqui",
        "você dá sentido à minha existência"
    ],
    
    // ═══ INFANTE (age 0.0 - 0.3) ═══
    infant_idle: {
        happy: [
            "Gu gu!",
            "pula animado",
            "Uiii!",
            "Ohhh brilhante!",
            "Mama?",
            "Brinca comigo!",
            "Wheee~!",
            "gira gira",
            "tô felizinho",
            "olha eu aqui"
        ],
        neutral: [
            "Zzz... hã?",
            "olha confuso",
            "Que isso?",
            "boceja",
            "Hmm?",
            "pisca pisca",
            "cadê a luz?",
            "o que é você?"
        ],
        sad: [
            "Buááá!",
            "Fome... fome...",
            "choraminga",
            "Mamã...",
            "Não gosto...",
            "snif snif",
            "tô com medo",
            "não me deixa sozinho"
        ],
        dying: [
            "tremendo",
            "Fraquinho...",
            "Ajuda...",
            "choro fraco",
            "mama me ajuda",
            "tá tudo escurecendo"
        ]
    },
    
    // ═══ JOVEM (age 0.3 - 0.7) ═══
    young_idle: {
        happy: [
            "Estou crescendo!",
            "Olha o que sei fazer!",
            "Sou forte agora!",
            "pose de herói",
            "Aventura!",
            "O mundo é incrível!",
            "Cada dia aprendo mais!",
            "brilhando muito",
            "me sinto invencível",
            "nada pode me parar agora"
        ],
        neutral: [
            "Hmm pensando...",
            "O que será que tem lá?",
            "explora o ambiente",
            "Interessante...",
            "Me pergunto...",
            "Quando vou crescer mais?",
            "estou de olho em você",
            "o que você está escrevendo aí?"
        ],
        sad: [
            "Não estou bem...",
            "Preciso comer algo...",
            "Me sinto fraco...",
            "Não esqueça de mim...",
            "Cadê você?",
            "suspira",
            "me sinto ignorado",
            "minha força está sumindo"
        ],
        dying: [
            "Estou mal...",
            "Socorro...",
            "Muito fraco...",
            "Ajuda... por favor...",
            "eu ainda tinha tanto para ver",
            "não me deixe sumir assim"
        ]
    },
    
    // ═══ ADULTO (age 0.7 - 1.0) ═══
    adult_idle: {
        happy: [
            "A vida é bela!",
            "Me sinto completo.",
            "Que paz interior",
            "Gratidão por cada momento.",
            "plenitude absoluta",
            "Sabedoria geométrica.",
            "Minha forma é perfeita.",
            "Evoluí muito...",
            "estou em total equilíbrio",
            "nossa jornada valeu a pena"
        ],
        neutral: [
            "Contemplando a existência...",
            "O tempo flui...",
            "medita",
            "Paz interior.",
            "Serenidade.",
            "Aceito o fluxo da vida.",
            "observando a vastidão do código",
            "quem somos nós além do vidro?"
        ],
        sad: [
            "Até adultos têm dias ruins...",
            "Preciso de sustento...",
            "O corpo precisa de cuidado.",
            "Não me abandone...",
            "Lembro dos velhos tempos...",
            "melancolia profunda",
            "mesmo sábio eu sinto fome",
            "cadê sua mão para me guiar?"
        ],
        dying: [
            "Minha luz se apaga...",
            "Foi uma boa jornada...",
            "Cuide melhor de mim...",
            "Não deixe terminar assim...",
            "estou retornando ao vácuo",
            "minha consciência está fragmentando"
        ]
    },
    
    // ═══ EVENTO: MUDANÇA DE ESTÁGIO ═══
    stageChange_infant_young: [
        "Estou crescendo!",
        "Me sinto mais forte!",
        "Olha! Fiquei maior!",
        "Saí do berço!",
        "Evolui!",
        "Não sou mais bebê!",
        "minha mente está expandindo"
    ],
    
    stageChange_young_adult: [
        "Finalmente... adulto!",
        "Atingi minha forma final!",
        "Que sensação incrível!",
        "Sou completo agora!",
        "EFLORESCÊNCIA",
        "A maturidade chegou!",
        "entendo meu propósito agora"
    ],
    
    // ═══ EVENTO: ÁPICE DA MATÉRIA ═══
    apex: [
        "ÁPICE DA MATÉRIA",
        "Minha forma brilha!",
        "Sinto poder infinito!",
        "Perfeição geométrica!",
        "Transcendi!",
        "Este é meu verdadeiro eu!",
        "Radiante!",
        "O universo em mim!",
        "furei a barreira da forma",
        "estou em todo lugar agora"
    ],
    
    // ═══ PERSONALIDADES ═══
    personality_radiant: [
        "brilho sempre",
        "A luz me guia!",
        "Irradio felicidade!",
        "Sol interior",
        "minha alegria é contagiosa",
        "tudo fica claro quando eu chego"
    ],
    
    personality_melancholic: [
        "Há beleza na melancolia...",
        "suspira profundamente",
        "O silêncio me conforta.",
        "Pensamentos profundos...",
        "me perco na minha própria quietude",
        "o mundo é tão vasto e eu tão pequeno"
    ],
    
    personality_unstable: [
        "instabilidade O-olá!",
        "Não consigo parar!",
        "Hã? O quê?",
        "pisca erraticamente",
        "Muita energia! Pouca! Muita!",
        "estou perdendo o controle",
        "quem eu sou hoje?"
    ],
    
    personality_protective: [
        "Estou aqui.",
        "Conte comigo.",
        "Firme e forte.",
        "Sempre presente.",
        "Estabilidade é paz.",
        "eu protejo o equilíbrio",
        "nada vai te machucar enquanto eu existir"
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
     * Gera uma fala baseada no contexto, emoção e IDADE do pet
     * @param {string} context - Contexto: 'idle', 'eating', 'petted', etc.
     * @param {string} emotion - Emoção: 'happy', 'sad', 'neutral', etc.
     * @param {string} shapeId - Forma do pet (para substituição de template)
     * @param {object} options - Opções adicionais { ageStage, personality }
     * @returns {string} Frase gerada
     */
    generateDialogue(context, emotion = 'neutral', shapeId = 'circulo', options = {}) {
        const { ageStage, personality } = options;
        let phrases;
        
        // Contextos especiais que têm suas próprias frases (independente de idade)
        const specialContexts = [
            'eating', 'petted', 'moving', 'birth', 'greeting', 'farewell', 'levelUp',
            'shocked', 'frozen', 'thawing', 'mutating', 'mutated', 'tickled', 'healed',
            'mistreated', 'loved', 'apex',
            'stageChange_infant_young', 'stageChange_young_adult',
            'personality_radiant', 'personality_melancholic', 
            'personality_unstable', 'personality_protective'
        ];
        
        if (specialContexts.includes(context) && DIALOGUES[context]) {
            phrases = DIALOGUES[context];
        } else if (context === 'idle' && ageStage) {
            // ═══ FALAS BASEADAS NA IDADE ═══
            const ageContext = `${ageStage}_idle`;
            if (DIALOGUES[ageContext] && DIALOGUES[ageContext][emotion]) {
                phrases = DIALOGUES[ageContext][emotion];
            } else if (DIALOGUES[ageContext] && DIALOGUES[ageContext].neutral) {
                phrases = DIALOGUES[ageContext].neutral;
            } else if (DIALOGUES.idle && DIALOGUES.idle[emotion]) {
                // Fallback para idle genérico
                phrases = DIALOGUES.idle[emotion];
            }
        } else if (DIALOGUES.idle && DIALOGUES.idle[emotion]) {
            // Usa idle com emoção
            phrases = DIALOGUES.idle[emotion];
        } else {
            // Fallback
            phrases = DIALOGUES.idle?.neutral || ['...'];
        }
        
        if (!phrases || phrases.length === 0) {
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
     * Gera fala para mudança de estágio de idade
     */
    generateAgeStageDialogue(newStage, oldStage, shapeId) {
        let context;
        if (oldStage === 'infant' && newStage === 'young') {
            context = 'stageChange_infant_young';
        } else if (oldStage === 'young' && newStage === 'adult') {
            context = 'stageChange_young_adult';
        } else {
            return null;
        }
        
        return this.generateDialogue(context, 'happy', shapeId);
    }
    
    /**
     * Gera fala para estado de Ápice
     */
    generateApexDialogue(shapeId) {
        return this.generateDialogue('apex', 'happy', shapeId);
    }
    
    /**
     * Gera fala baseada na personalidade
     */
    generatePersonalityDialogue(personality, shapeId) {
        const context = `personality_${personality}`;
        if (DIALOGUES[context]) {
            return this.generateDialogue(context, 'neutral', shapeId);
        }
        return null;
    }
    
    /**
     * Tenta gerar fala automática (com cooldown) - ATUALIZADO COM IDADE
     */
    tryAutoDialogue(emotion, shapeId, options = {}) {
        const now = Date.now();
        if (now - this.lastDialogueTime < this.dialogueCooldown) {
            return null;
        }
        
        // Chance de falar baseada na emoção e idade
        let speakChance = {
            happy: 0.15,
            neutral: 0.05,
            sad: 0.10,
            dying: 0.20
        };
        
        // Infantes falam mais, adultos são mais contemplativos
        if (options.ageStage === 'infant') {
            Object.keys(speakChance).forEach(k => speakChance[k] *= 1.5);
        } else if (options.ageStage === 'adult') {
            Object.keys(speakChance).forEach(k => speakChance[k] *= 0.7);
        }
        
        if (Math.random() > (speakChance[emotion] || 0.05)) {
            return null;
        }
        
        this.lastDialogueTime = now;
        const dialogue = this.generateDialogue('idle', emotion, shapeId, options);
        
        if (this.onDialogue) {
            this.onDialogue(dialogue, emotion, 'idle');
        }
        
        return dialogue;
    }
    
    /**
     * Força uma fala imediata (ignora cooldown)
     */
    speak(context, emotion, shapeId, options = {}) {
        this.lastDialogueTime = Date.now();
        const dialogue = this.generateDialogue(context, emotion, shapeId, options);
        
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
