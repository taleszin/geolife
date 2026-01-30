// ═══════════════════════════════════════════════════════════════════
// GEOPET - Entidade do Pet Geométrico (Tamagotchi Style)
// Renderizado 100% com setPixel + Algoritmos de CG
// Baseado no sistema de expressões do HYLOMORPH
// ═══════════════════════════════════════════════════════════════════

import { SHAPES_MAP } from '../data/shapes.js';
import { MATERIALS_MAP, getMaterialById } from '../data/materials.js';
import { materialRenderer } from '../systems/MaterialRenderer.js';

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE HUMOR - Estados emocionais baseados nas estatísticas
// ═══════════════════════════════════════════════════════════════════
export const MOOD_TYPES = {
    ECSTATIC: 'ecstatic',       // Eufórico (stats muito altos)
    HAPPY: 'happy',             // Feliz (stats bons)
    CONTENT: 'content',         // Contente (stats OK)
    NEUTRAL: 'neutral',         // Neutro
    BORED: 'bored',             // Entediado (energia baixa, resto OK)
    CONFUSED: 'confused',       // Confuso (stats misturados)
    THOUGHTFUL: 'thoughtful',   // Pensativo (energia alta, felicidade baixa)
    SAD: 'sad',                 // Triste (felicidade baixa)
    HUNGRY: 'hungry',           // Faminto (fome baixa)
    TIRED: 'tired',             // Cansado (energia baixa)
    ANGRY: 'angry',             // Raivoso (maltratado recentemente)
    DYING: 'dying'              // Morrendo (todos stats críticos)
};

export const MOOD_LABELS = {
    [MOOD_TYPES.ECSTATIC]: '✨ Eufórico!',
    [MOOD_TYPES.HAPPY]: '😊 Feliz',
    [MOOD_TYPES.CONTENT]: '🙂 Contente',
    [MOOD_TYPES.NEUTRAL]: '😐 Neutro',
    [MOOD_TYPES.BORED]: '😑 Entediado',
    [MOOD_TYPES.CONFUSED]: '😕 Confuso',
    [MOOD_TYPES.THOUGHTFUL]: '🤔 Pensativo',
    [MOOD_TYPES.SAD]: '😢 Triste',
    [MOOD_TYPES.HUNGRY]: '🍽️ Faminto',
    [MOOD_TYPES.TIRED]: '😴 Cansado',
    [MOOD_TYPES.ANGRY]: '😠 Irritado',
    [MOOD_TYPES.DYING]: '💀 Crítico'
};

export default class GeoPet {
    constructor(config = {}) {
        // ═══════════════════════════════════════════════════════════════════
        // IDENTIDADE VISUAL (DNA)
        // ═══════════════════════════════════════════════════════════════════
        this.shapeId = config.shapeId || 'circulo';
        this.eyeType = config.eyeType || 'circle';
        this.mouthType = config.mouthType || 'simple';
        
        // NOVO: Sistema de Materiais (substitui cores simples)
        this.materialId = config.materialId || 'aetherium';
        
        // Cores legadas derivadas do material (para sistemas legados como MaterializationSystem)
        const material = getMaterialById(this.materialId);
        this.primaryColor = config.primaryColor || material.palette.glow;
        this.secondaryColor = config.secondaryColor || material.palette.core;
        
        // ═══════════════════════════════════════════════════════════════════
        // CORES CUSTOMIZÁVEIS (Sistema Arco-Íris)
        // Permite cores independentes para olhos, boca e borda neon
        // ═══════════════════════════════════════════════════════════════════
        this.eyeColor = config.eyeColor || null;     // null = usa secondaryColor
        this.mouthColor = config.mouthColor || null; // null = usa secondaryColor
        this.borderColor = config.borderColor || null; // null = usa primaryColor (cor do glow)
        
        // ═══════════════════════════════════════════════════════════════════
        // POSIÇÃO E TRANSFORMAÇÕES
        // ═══════════════════════════════════════════════════════════════════
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.size = config.size || 40;
        this.scale = config.scale || 1;
        this.rotation = 0;
        
        // ═══════════════════════════════════════════════════════════════════
        // MOVIMENTO (Física simplificada)
        // ═══════════════════════════════════════════════════════════════════
        this.vx = 0;
        this.vy = 0;
        this.targetX = null;
        this.targetY = null;
        this.speed = 1.5;
        this.friction = 0.95;
        
        // ═══════════════════════════════════════════════════════════════════
        // STATS DO TAMAGOTCHI
        // ═══════════════════════════════════════════════════════════════════
        this.hunger = config.hunger ?? 75;      // 0-100 (fome) - começa em 75%
        this.happiness = config.happiness ?? 70; // 0-100 (felicidade) - começa em 70%
        this.energy = config.energy ?? 80;       // 0-100 (energia) - começa em 80%
        
        // Taxas de decaimento (por segundo) - aumentadas para maior diversidade de humor
        this.decayRates = {
            hunger: 1.2,    // Perde 1.2 de fome por segundo (antes: 0.5)
            happiness: 0.5, // Perde 0.5 de felicidade por segundo (antes: 0.2)
            energy: 0.3     // Perde 0.3 de energia por segundo (antes: 0.1)
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE HUMOR
        // ═══════════════════════════════════════════════════════════════════
        this.currentMood = MOOD_TYPES.HAPPY;
        this.moodTimer = 0;             // Para transições suaves
        this.recentMistreatment = 0;    // Contador de maus tratos recentes
        this.mistreatmentDecay = 0;     // Timer para decay do contador
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE EXPRESSÕES (Baseado no Golem.js)
        // ═══════════════════════════════════════════════════════════════════
        this.expressionState = {
            mood: 'happy',     // happy, neutral, sad, dying, eating
            action: null,      // ação temporária (eating, playing, etc)
            actionTimer: 0     // quando a ação expira
        };
        
        // Parâmetros faciais animados (lerp suave)
        this.faceParams = {
            eyeOpenness: 1,      // 0-1.5 (fechado a arregalado)
            mouthCurve: 0.5,     // -1 a 1 (triste a feliz)
            browAngle: 0,        // -1 a 1 (preocupado a relaxado)
            pupilSize: 1,        // 0.5-1.5 (contraído a dilatado)
            focusOffset: { x: 0, y: 0 }, // Para onde está olhando
            tremor: 0,           // 0-1 (tremendo de medo/frio)
            breathY: 0           // Offset da respiração
        };
        
        // Alvos para interpolação suave
        this.faceTargets = {
            eyeOpenness: 1,
            mouthCurve: 0.5,
            browAngle: 0,
            pupilSize: 1,
            tremor: 0
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // ANIMAÇÃO
        // ═══════════════════════════════════════════════════════════════════
        this.breathPhase = Math.random() * Math.PI * 2;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.blinkDuration = 0;
        this.blinkInterval = 120 + Math.random() * 60;
        
        // Squash & Stretch
        this.squashX = 1;
        this.squashY = 1;
        this.squashDecay = 0.9;
        
        // ═══════════════════════════════════════════════════════════════════
        // INTERAÇÃO
        // ═══════════════════════════════════════════════════════════════════
        this.isBeingPetted = false;
        this.lastPetTime = 0;
        this.feedCooldown = 0;
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE FALAS (Typewriter Effect)
        // ═══════════════════════════════════════════════════════════════════
        this.currentDialogue = null;      // Texto completo
        this.displayedDialogue = '';      // Texto visível (typewriter)
        this.dialogueIndex = 0;           // Índice atual do typewriter
        this.dialogueTimer = 0;           // Timer de exibição total
        this.typewriterTimer = 0;         // Timer para próxima letra
        this.typewriterSpeed = 50;        // ms por letra
        this.dialogueDuration = 3000;     // 3 segundos após terminar de digitar
        this.lastAutoDialogue = 0;
        this.autoDialogueInterval = 8000;
        
        // Callbacks para sistemas externos
        this.onSpeak = null; // (text, emotion, context) => void
        this.onTypeLetter = null; // (letter) => void - para som de digitação
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE MATURAÇÃO (AGING)
        // ═══════════════════════════════════════════════════════════════════
        this.age = config.age ?? 0.0;                    // 0.0 = Infante, 1.0 = Adulto
        this.ageAccumulator = config.ageAccumulator ?? 0; // Acumula progresso de crescimento
        this.hasReachedAdulthood = config.hasReachedAdulthood ?? false; // Flag para evento único
        
        // Estágios de vida: Infante (0-0.3), Jovem (0.3-0.7), Adulto (0.7-1.0)
        this.ageStage = this.calculateAgeStage();
        this.previousAgeStage = this.ageStage;
        
        // ═══ SISTEMA DE CRESCIMENTO INDIVIDUAL ═══
        // Cada pet nasce com um potencial de crescimento único!
        // Varia de 1.8x a 2.5x do tamanho base (dobro ou mais do adulto anterior)
        this.maxGrowthScale = config.maxGrowthScale ?? this.generateMaxGrowthScale();
        
        // Callback para eventos de crescimento
        this.onAgeStageChange = null; // (newStage, oldStage) => void
        this.onReachAdulthood = null; // () => void - evento de Eflorescência
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE VITALIDADE
        // ═══════════════════════════════════════════════════════════════════
        this.vitality = this.calculateVitality();        // Média ponderada dos stats
        this.vitalitySmoothed = this.vitality;           // Versão suavizada (lerp)
        this.isAtApex = false;                           // "Ápice da Matéria"
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE COLAPSO SISTÊMICO (Morte)
        // O pet pode morrer quando a vitalidade chega a 0
        // ═══════════════════════════════════════════════════════════════════
        this.instability = 0;                    // 0-1, cresce quando vitalidade < 15%
        this.isCollapsing = false;               // Flag de colapso ativo
        this.collapseProgress = 0;               // 0-1, progresso do colapso
        this.collapseStage = 0;                  // 0-4, estágios do colapso
        this.isDead = false;                     // Pet morreu completamente
        this.collapseParticles = [];             // Partículas de dissolução
        this.lastCollapseDialogue = 0;           // Timer para falas de colapso
        this.collapseDialogueInterval = 2000;    // Intervalo entre falas
        
        // Callbacks de colapso
        this.onCollapseStart = null;             // () => void - início do colapso
        this.onCollapseProgress = null;          // (stage, progress) => void
        this.onDeath = null;                     // () => void - morte completa
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE PERSONALIDADE (DNA COMPORTAMENTAL)
        // ═══════════════════════════════════════════════════════════════════
        // Tipos: 'radiant' (brilha mais), 'melancholic' (mais opaco), 
        //        'unstable' (oscila), 'protective' (estável)
        this.personality = config.personality || this.generateRandomPersonality();
        
        // Modificadores visuais baseados na personalidade (calculados em update)
        this.personalityModifiers = {
            glowMultiplier: 1.0,      // Multiplicador de brilho
            saturationBoost: 0.0,     // Boost de saturação
            flickerAmount: 0.0,       // Quantidade de oscilação
            stabilityFactor: 1.0      // Fator de estabilidade
        };
        
        // Tempo interno para efeitos de personalidade
        this.personalityPhase = Math.random() * Math.PI * 2;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE MATURAÇÃO - Helpers
    // ═══════════════════════════════════════════════════════════════════
    
    calculateAgeStage() {
        if (this.age < 0.3) return 'infant';
        if (this.age < 0.7) return 'young';
        return 'adult';
    }
    
    getAgeStageLabel() {
        const labels = {
            'infant': '🌱 Infante',
            'young': '🌿 Jovem',
            'adult': '🌳 Adulto'
        };
        return labels[this.ageStage] || '???';
    }
    
    /**
     * Gera potencial de crescimento único para este pet
     * Cada pet cresce até um tamanho diferente (1.8x a 2.5x do base)
     * Isso cria diversidade e surpresa no crescimento!
     */
    generateMaxGrowthScale() {
        // Distribuição levemente enviesada para tamanhos maiores serem mais raros
        // Base: 1.8x, máximo: 2.5x (média ~2.1x)
        const baseMin = 1.8;
        const baseMax = 2.5;
        
        // Usa distribuição normal-ish para raridade
        const r1 = Math.random();
        const r2 = Math.random();
        const gaussian = (r1 + r2) / 2; // Aproximação de normal
        
        return baseMin + gaussian * (baseMax - baseMin);
    }
    
    /**
     * Retorna escala visual baseada na idade
     * Crescimento gradual e natural com diferenças MUITO claras entre estágios
     * O pet nasce MUITO PEQUENO e cresce até seu maxGrowthScale único!
     * 
     * Bebê (0.0-0.3):       0.15x - 0.40x  (minúsculo, como semente!)
     * Adolescente (0.3-0.7): 0.40x - 1.00x (GROWTH SPURT! crescimento explosivo)
     * Adulto (0.7-1.0):     1.00x - maxGrowthScale (finaliza em tamanho épico!)
     */
    getAgeScale() {
        const maxScale = this.maxGrowthScale || 2.0; // Fallback
        
        // Curva de crescimento com "growth spurts" (surtos de crescimento)
        if (this.age < 0.3) {
            // Bebê: minúsculo como semente! (0.15 -> 0.40)
            const t = this.age / 0.3;
            // Ease-out com bounce sutil para sentir o crescimento
            const eased = 1 - Math.pow(1 - t, 2.5);
            return 0.15 + eased * 0.25;
        } else if (this.age < 0.7) {
            // Adolescente: GROWTH SPURT! (0.40 -> 1.00)
            // Crescimento explosivo e muito visível!
            const t = (this.age - 0.3) / 0.4;
            // Ease-out forte para crescimento rápido e impactante
            const eased = 1 - Math.pow(1 - t, 2);
            return 0.40 + eased * 0.60;
        } else {
            // Adulto: alcança potencial máximo único! (1.00 -> maxScale)
            const t = (this.age - 0.7) / 0.3;
            // Ease-out suave para finalizar majestosamente
            const eased = 1 - Math.pow(1 - t, 4);
            const finalRange = maxScale - 1.0;
            return 1.0 + eased * finalRange;
        }
    }
    
    /**
     * Retorna fator de movimento errático (infantes são mais agitados)
     */
    getErraticFactor() {
        // Infante: 1.0 (muito errático) -> Adulto: 0.1 (calmo)
        return Math.max(0.1, 1.0 - this.age * 0.9);
    }
    
    /**
     * Retorna instabilidade de brilho (infantes piscam mais)
     */
    getGlowInstability() {
        // Infante: 0.5 (muito instável) -> Adulto: 0.0 (estável)
        return Math.max(0, 0.5 - this.age * 0.5);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE VITALIDADE - Helpers
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Calcula vitalidade como média ponderada
     * hunger: 40%, happiness: 35%, energy: 25%
     */
    calculateVitality() {
        return (this.hunger * 0.4 + this.happiness * 0.35 + this.energy * 0.25) / 100;
    }
    
    /**
     * Retorna multiplicador de brilho baseado na vitalidade
     */
    getVitalityGlowMultiplier() {
        // Vitalidade baixa = pet "apagado" (0.3), alta = brilhante (1.5)
        return 0.3 + this.vitalitySmoothed * 1.2;
    }
    
    /**
     * Retorna opacidade do material baseada na vitalidade
     */
    getVitalityOpacity() {
        // Mínimo 40% de opacidade, máximo 100%
        return 0.4 + this.vitalitySmoothed * 0.6;
    }
    
    /**
     * Verifica se está no "Ápice da Matéria"
     * Adulto com vitalidade máxima
     */
    checkApexState() {
        return this.age >= 0.9 && this.vitalitySmoothed > 0.85;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SISTEMA DE PERSONALIDADE - Helpers
    // ═══════════════════════════════════════════════════════════════════
    
    generateRandomPersonality() {
        const types = ['radiant', 'melancholic', 'unstable', 'protective'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getPersonalityLabel() {
        const labels = {
            'radiant': '☀️ Radiante',
            'melancholic': '🌙 Melancólico',
            'unstable': '⚡ Instável',
            'protective': '🛡️ Protetor'
        };
        return labels[this.personality] || '???';
    }
    
    /**
     * Atualiza modificadores visuais baseados na personalidade
     */
    updatePersonalityModifiers(dt) {
        this.personalityPhase += dt * 2; // Velocidade da oscilação
        
        switch (this.personality) {
            case 'radiant':
                // Brilha mais mesmo com stats médios
                this.personalityModifiers.glowMultiplier = 1.3;
                this.personalityModifiers.saturationBoost = 0.15;
                this.personalityModifiers.flickerAmount = 0;
                this.personalityModifiers.stabilityFactor = 1.1;
                break;
                
            case 'melancholic':
                // Mais opaco e contido
                this.personalityModifiers.glowMultiplier = 0.75;
                this.personalityModifiers.saturationBoost = -0.1;
                this.personalityModifiers.flickerAmount = 0;
                this.personalityModifiers.stabilityFactor = 0.9;
                break;
                
            case 'unstable':
                // Oscila como lâmpada com mau contato
                const flicker = Math.sin(this.personalityPhase * 8) * 0.3 + 
                               Math.sin(this.personalityPhase * 13) * 0.15 +
                               (Math.random() - 0.5) * 0.1;
                this.personalityModifiers.glowMultiplier = 1.0 + flicker;
                this.personalityModifiers.saturationBoost = flicker * 0.2;
                this.personalityModifiers.flickerAmount = Math.abs(flicker);
                this.personalityModifiers.stabilityFactor = 0.7;
                break;
                
            case 'protective':
                // Estável e consistente
                this.personalityModifiers.glowMultiplier = 1.0;
                this.personalityModifiers.saturationBoost = 0;
                this.personalityModifiers.flickerAmount = 0;
                this.personalityModifiers.stabilityFactor = 1.3;
                break;
        }
    }
    
    /**
     * Retorna o multiplicador final de renderização combinando todos os sistemas
     */
    getRenderModifiers() {
        const ageScale = this.getAgeScale();
        const ageInstability = this.getGlowInstability();
        const vitalityGlow = this.getVitalityGlowMultiplier();
        const vitalityOpacity = this.getVitalityOpacity();
        const isApex = this.isAtApex;
        
        // Combina personalidade com vitalidade
        let finalGlow = vitalityGlow * this.personalityModifiers.glowMultiplier;
        let finalOpacity = vitalityOpacity;
        
        // Instabilidade de infante
        if (ageInstability > 0) {
            const instabilityFlicker = Math.sin(Date.now() * 0.01) * ageInstability;
            finalGlow += instabilityFlicker * 0.3;
        }
        
        // Ápice da Matéria - boost especial
        if (isApex) {
            finalGlow *= 1.5;
            finalOpacity = 1.0;
        }
        
        return {
            scale: ageScale,
            glowIntensity: Math.max(0.2, Math.min(2.0, finalGlow)),
            opacity: Math.max(0.3, Math.min(1.0, finalOpacity)),
            saturationBoost: this.personalityModifiers.saturationBoost,
            isApex: isApex,
            erraticFactor: this.getErraticFactor(),
            flickerAmount: this.personalityModifiers.flickerAmount + ageInstability
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UPDATE PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════
    
    update(deltaTime = 16) {
        const dt = deltaTime / 1000; // Converte para segundos
        
        // Se está morto, não atualiza mais nada exceto partículas
        if (this.isDead) {
            this.updateCollapseParticles(dt);
            return;
        }
        
        // Atualiza stats
        this.updateStats(dt);
        
        // Atualiza sistemas de Maturação e Vitalidade
        this.updateAging(dt);
        this.updateVitality(dt);
        this.updatePersonalityModifiers(dt);
        
        // Atualiza sistema de colapso se ativo
        if (this.isCollapsing) {
            this.updateCollapse(dt);
        }
        
        // Atualiza mood baseado nos stats (SISTEMA EXPANDIDO)
        this.updateMood(dt);
        
        // Atualiza expressões faciais
        this.updateExpression();
        
        // Atualiza animações
        this.updateAnimations(dt);
        
        // Atualiza movimento (com fator errático de infante) - mais lento se instável
        if (!this.isCollapsing) {
            this.updateMovement(dt);
        }
        
        // Atualiza diálogos
        this.updateDialogue(deltaTime);
        
        // Cooldowns
        if (this.feedCooldown > 0) {
            this.feedCooldown -= deltaTime;
        }
    }
    
    updateStats(dt) {
        // Não decai stats durante cooldown de alimentação
        if (this.feedCooldown > 0) return;
        
        // Decai stats naturalmente
        this.hunger = Math.max(0, this.hunger - this.decayRates.hunger * dt);
        this.happiness = Math.max(0, this.happiness - this.decayRates.happiness * dt);
        this.energy = Math.max(0, this.energy - this.decayRates.energy * dt);
        
        // Fome baixa afeta felicidade
        if (this.hunger < 30) {
            this.happiness = Math.max(0, this.happiness - 0.5 * dt);
        }
        
        // Energia baixa deixa mais lento
        if (this.energy < 20) {
            this.speed = 0.8;
        } else {
            this.speed = 1.5;
        }
        
        // Decai contador de maus tratos
        if (this.recentMistreatment > 0) {
            this.mistreatmentDecay += dt;
            if (this.mistreatmentDecay > 30) { // 30 segundos para esquecer
                this.recentMistreatment = Math.max(0, this.recentMistreatment - 1);
                this.mistreatmentDecay = 0;
            }
        }
    }
    
    /**
     * Sistema de Maturação (Aging)
     * O pet cresce baseado no tempo e na qualidade dos cuidados
     * BALANCEAMENTO: Crescimento gradual e orgânico para experiência juicy!
     */
    updateAging(dt) {
        // Taxa base de envelhecimento: ~3 minutos para crescimento completo
        // Lento e gradual o suficiente para apreciar cada estágio de crescimento
        const baseAgeRate = 1 / 120; // 1.0 em 120 segundos (2 minutos) base
        
        // Qualidade dos cuidados influencia o crescimento de forma suave
        const careQuality = this.calculateVitality();
        // Multiplier suave: 0.8x (negligência) a 1.4x (cuidado perfeito)
        const ageMultiplier = 0.8 + careQuality * 0.6;
        
        // Acumula idade
        const ageIncrement = baseAgeRate * ageMultiplier * dt;
        this.age = Math.min(1.0, this.age + ageIncrement);
        
        // Verifica mudança de estágio
        const newStage = this.calculateAgeStage();
        if (newStage !== this.ageStage) {
            const oldStage = this.ageStage;
            this.previousAgeStage = oldStage;
            this.ageStage = newStage;
            
            // Callback de mudança de estágio
            if (this.onAgeStageChange) {
                this.onAgeStageChange(newStage, oldStage);
            }
        }
        
        // Verifica se atingiu a idade adulta pela primeira vez
        if (!this.hasReachedAdulthood && this.age >= 0.7) {
            this.hasReachedAdulthood = true;
            
            // Callback de Eflorescência!
            if (this.onReachAdulthood) {
                this.onReachAdulthood();
            }
        }
    }
    
    /**
     * Sistema de Vitalidade
     * Atualiza a vitalidade com suavização (lerp)
     */
    updateVitality(dt) {
        // Calcula vitalidade atual
        const targetVitality = this.calculateVitality();
        
        // Suaviza com lerp (evita mudanças bruscas)
        const lerpSpeed = 2.0; // Velocidade de transição
        this.vitalitySmoothed += (targetVitality - this.vitalitySmoothed) * lerpSpeed * dt;
        this.vitality = targetVitality;
        
        // Verifica estado de Ápice
        this.isAtApex = this.checkApexState();
        
        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE INSTABILIDADE E COLAPSO
        // Quando vitalidade < 15%, instabilidade começa a crescer
        // ═══════════════════════════════════════════════════════════════════
        this.updateInstability(dt);
    }
    
    /**
     * Atualiza instabilidade sistêmica
     * Cresce exponencialmente quando vitalidade está baixa
     */
    updateInstability(dt) {
        if (this.isDead) return;
        
        const vitality = this.vitalitySmoothed;
        
        // Instabilidade começa quando vitalidade < 15%
        if (vitality < 0.15) {
            // Quanto menor a vitalidade, mais rápido cresce a instabilidade
            const severityFactor = 1 - (vitality / 0.15); // 0-1
            const growthRate = 0.05 + severityFactor * 0.15; // 0.05 - 0.20 por segundo
            
            // Crescimento exponencial
            this.instability = Math.min(1.0, this.instability + growthRate * dt * (1 + this.instability));
            
            // Quando vitalidade = 0, inicia colapso
            if (vitality <= 0.01 && !this.isCollapsing) {
                this.startCollapse();
            }
        } else {
            // Recuperação RÁPIDA da instabilidade quando cuidado
            // Quanto maior a vitalidade, mais rápida a recuperação
            const recoveryRate = 0.15 + vitality * 0.25; // 0.15 - 0.40 por segundo
            this.instability = Math.max(0, this.instability - recoveryRate * dt);
        }
    }
    
    /**
     * Inicia o processo de colapso sistêmico (morte)
     */
    startCollapse() {
        if (this.isCollapsing || this.isDead) return;
        
        this.isCollapsing = true;
        this.collapseProgress = 0;
        this.collapseStage = 1;
        this.instability = 1.0;
        
        // Gera partículas iniciais de dissolução
        this.generateCollapseParticles(50);
        
        // Callback
        if (this.onCollapseStart) {
            this.onCollapseStart();
        }
        
        console.log('💀 COLAPSO SISTÊMICO INICIADO');
    }
    
    /**
     * Atualiza o processo de colapso
     */
    updateCollapse(dt) {
        if (!this.isCollapsing || this.isDead) return;
        
        // Progresso do colapso (5 segundos total)
        const collapseSpeed = 0.2; // 20% por segundo = 5 segundos
        this.collapseProgress = Math.min(1.0, this.collapseProgress + collapseSpeed * dt);
        
        // Atualiza estágio baseado no progresso
        const newStage = Math.floor(this.collapseProgress * 4) + 1;
        if (newStage !== this.collapseStage) {
            this.collapseStage = Math.min(4, newStage);
            
            // Callback de progresso
            if (this.onCollapseProgress) {
                this.onCollapseProgress(this.collapseStage, this.collapseProgress);
            }
            
            // Gera mais partículas a cada estágio
            this.generateCollapseParticles(30 + this.collapseStage * 20);
        }
        
        // Atualiza partículas de colapso
        this.updateCollapseParticles(dt);
        
        // Morte completa
        if (this.collapseProgress >= 1.0) {
            this.completeDeath();
        }
    }
    
    /**
     * Gera partículas de dissolução do pet
     */
    generateCollapseParticles(count) {
        const ageScale = this.getAgeScale();
        const petRadius = this.size * this.scale * ageScale;
        
        for (let i = 0; i < count; i++) {
            // Posição aleatória dentro do pet
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * petRadius;
            
            this.collapseParticles.push({
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3 - 1, // Bias para cima (alma subindo)
                size: 1 + Math.random() * 3,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color: Math.random() > 0.3 ? this.primaryColor : '#888888', // Mistura cor + cinza
                isStatic: Math.random() > 0.7 // Algumas partículas são estática pura
            });
        }
    }
    
    /**
     * Atualiza partículas de colapso
     */
    updateCollapseParticles(dt) {
        for (let i = this.collapseParticles.length - 1; i >= 0; i--) {
            const p = this.collapseParticles[i];
            
            // Movimento errático (glitch)
            p.x += p.vx + (Math.random() - 0.5) * 2;
            p.y += p.vy + (Math.random() - 0.5) * 2;
            
            // Gravidade inversa sutil (dissolve para cima)
            p.vy -= 0.05;
            
            // Decai vida
            p.life -= p.decay;
            
            // Remove partículas mortas
            if (p.life <= 0) {
                this.collapseParticles.splice(i, 1);
            }
        }
    }
    
    /**
     * Completa o processo de morte
     */
    completeDeath() {
        this.isDead = true;
        this.isCollapsing = false;
        this.collapseProgress = 1.0;
        this.collapseStage = 4;
        
        // Callback de morte
        if (this.onDeath) {
            this.onDeath();
        }
        
        console.log('☠️ PET MORREU - GAME OVER');
    }
    
    /**
     * Retorna o fator de glitch visual baseado na instabilidade
     */
    getGlitchFactor() {
        if (this.isDead) return 1.0;
        if (this.isCollapsing) return 0.5 + this.collapseProgress * 0.5;
        return this.instability;
    }
    
    /**
     * Retorna jitter para coordenadas (tremor de vértices)
     */
    getVertexJitter() {
        const glitch = this.getGlitchFactor();
        if (glitch < 0.1) return { x: 0, y: 0 };
        
        const intensity = glitch * 8; // Até 8 pixels de desvio
        return {
            x: (Math.random() - 0.5) * intensity,
            y: (Math.random() - 0.5) * intensity
        };
    }
    
    /**
     * Verifica se uma scanline deve ser ignorada (falha de scanline)
     */
    shouldSkipScanline(y) {
        const glitch = this.getGlitchFactor();
        if (glitch < 0.2) return false;
        
        // Chance de pular aumenta com instabilidade
        const skipChance = glitch * 0.3; // Até 30% de chance
        
        // Padrão de scanline mais evidente
        const scanlinePattern = Math.sin(y * 0.5 + Date.now() * 0.01) > 0;
        
        return scanlinePattern && Math.random() < skipChance;
    }
    
    /**
     * Retorna cor corrompida (dessaturação + estática)
     */
    getCorruptedColor(originalColor, renderer) {
        const glitch = this.getGlitchFactor();
        if (glitch < 0.1) return originalColor;
        
        let { r, g, b } = renderer.hexToRgb(originalColor);
        
        // Dessaturação progressiva
        const gray = (r + g + b) / 3;
        const saturationLoss = glitch * 0.7;
        r = Math.round(r + (gray - r) * saturationLoss);
        g = Math.round(g + (gray - g) * saturationLoss);
        b = Math.round(b + (gray - b) * saturationLoss);
        
        // Ruído de estática
        if (Math.random() < glitch * 0.4) {
            const noise = (Math.random() - 0.5) * 100 * glitch;
            r = Math.min(255, Math.max(0, r + noise));
            g = Math.min(255, Math.max(0, g + noise));
            b = Math.min(255, Math.max(0, b + noise));
        }
        
        // Piscar em tons de erro (vermelho/magenta)
        if (Math.random() < glitch * 0.15) {
            return '#ff0066';
        }
        
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    
    /**
     * Retorna alpha corrompido (piscar/transparência)
     */
    getCorruptedAlpha(baseAlpha = 255) {
        const glitch = this.getGlitchFactor();
        if (glitch < 0.1) return baseAlpha;
        
        // Flicker aleatório
        if (Math.random() < glitch * 0.3) {
            return Math.floor(baseAlpha * (0.3 + Math.random() * 0.4));
        }
        
        // Fade gradual durante colapso
        if (this.isCollapsing) {
            return Math.floor(baseAlpha * (1 - this.collapseProgress * 0.8));
        }
        
        return baseAlpha;
    }
    
    /**
     * Sistema de Humor expandido - calcula mood baseado em múltiplos fatores
     */
    updateMood(dt = 0) {
        // Ação temporária tem prioridade sobre mood
        if (this.expressionState.action && Date.now() < this.expressionState.actionTimer) {
            return;
        } else {
            this.expressionState.action = null;
        }
        
        // Calcula novo mood baseado nos stats
        const newMood = this.calculateMood();
        
        // Atualiza mood atual
        this.currentMood = newMood;
        
        // Mapeia para expressionState.mood legado (para compatibilidade)
        this.expressionState.mood = this.moodToLegacy(newMood);
    }
    
    /**
     * Calcula o humor baseado nas estatísticas e eventos recentes
     */
    calculateMood() {
        const h = this.hunger;
        const hp = this.happiness;
        const e = this.energy;
        const avg = (h + hp + e) / 3;
        
        // Prioridade 1: Estados críticos - baseado em vitalidade
        const vitality = this.vitalitySmoothed || this.vitality || this.calculateVitality();
        if (vitality <= 0.10) return MOOD_TYPES.DYING; // 10% ou menos = dying
        
        // Prioridade 1.5: Estados críticos por média
        if (avg < 20) return MOOD_TYPES.DYING;
        
        // Prioridade 2: Maltratado recentemente
        if (this.recentMistreatment >= 3) return MOOD_TYPES.ANGRY;
        
        // Prioridade 3: Estados de necessidade específica (ajustados para aparecer mais cedo)
        if (h < 35 && hp > 35) return MOOD_TYPES.HUNGRY;
        if (e < 35 && hp > 35) return MOOD_TYPES.TIRED;
        
        // Prioridade 4: Estados emocionais
        if (hp < 40) return MOOD_TYPES.SAD;
        
        // Prioridade 5: Estados positivos (thresholds ajustados)
        if (avg > 80) return MOOD_TYPES.ECSTATIC;
        if (avg > 65) return MOOD_TYPES.HAPPY;
        if (avg > 50) return MOOD_TYPES.CONTENT;
        
        // Prioridade 6: Estados especiais
        if (e > 60 && hp < 55) return MOOD_TYPES.THOUGHTFUL;
        if (e < 45 && hp > 45 && h > 45) return MOOD_TYPES.BORED;
        
        // Estados de confusão (stats muito desbalanceados)
        const variance = Math.abs(h - hp) + Math.abs(hp - e) + Math.abs(e - h);
        if (variance > 100) return MOOD_TYPES.CONFUSED;
        
        return MOOD_TYPES.NEUTRAL;
    }
    
    /**
     * Converte novo sistema de mood para o legado
     */
    moodToLegacy(mood) {
        const mapping = {
            [MOOD_TYPES.ECSTATIC]: 'happy',
            [MOOD_TYPES.HAPPY]: 'happy',
            [MOOD_TYPES.CONTENT]: 'happy',
            [MOOD_TYPES.NEUTRAL]: 'neutral',
            [MOOD_TYPES.BORED]: 'neutral',
            [MOOD_TYPES.CONFUSED]: 'neutral',
            [MOOD_TYPES.THOUGHTFUL]: 'neutral',
            [MOOD_TYPES.SAD]: 'sad',
            [MOOD_TYPES.HUNGRY]: 'sad',
            [MOOD_TYPES.TIRED]: 'sad',
            [MOOD_TYPES.ANGRY]: 'sad',
            [MOOD_TYPES.DYING]: 'dying'
        };
        return mapping[mood] || 'neutral';
    }
    
    /**
     * Retorna o label do humor atual para exibição na UI
     * Considera ações temporárias (shocked, frozen, etc) antes do humor base
     */
    getMoodLabel() {
        // Se há uma ação temporária ativa, mostra ela ao invés do humor base
        if (this.expressionState.action && Date.now() < this.expressionState.actionTimer) {
            const actionLabels = {
                'shocked': '⚡ Chocado!',
                'frozen': '❄️ Congelado',
                'mutating': '🔮 Mutando',
                'tickled': '😂 Risada',
                'eating': '😋 Comendo',
                'love': '💕 Amado',
                'surprised': '😮 Surpreso',
                'alert': '👀 Alerta',
                'healed': '💚 Curado'
            };
            return actionLabels[this.expressionState.action] || MOOD_LABELS[this.currentMood];
        }
        
        return MOOD_LABELS[this.currentMood] || '😐 Neutro';
    }
    
    /**
     * Registra mau trato (chamado por ações negativas)
     */
    registerMistreatment() {
        this.recentMistreatment++;
        this.mistreatmentDecay = 0;
    }
    
    updateExpression() {
        // Define alvos baseados no mood/action
        let target = { open: 1, curve: 0, brow: 0, pupil: 1, tremor: 0 };
        
        const currentMood = this.expressionState.action || this.expressionState.mood;
        
        switch (currentMood) {
            case 'happy':
                target = { open: 1, curve: 0.7, brow: -0.2, pupil: 1, tremor: 0 };
                break;
            case 'neutral':
                target = { open: 0.9, curve: 0.1, brow: 0, pupil: 1, tremor: 0 };
                break;
            case 'sad':
                target = { open: 0.7, curve: -0.5, brow: 0.4, pupil: 0.9, tremor: 0 };
                break;
            case 'dying':
                target = { open: 0.5, curve: -0.3, brow: 0.6, pupil: 0.7, tremor: 0.3 };
                break;
            case 'eating':
                // Boca animada durante alimentação
                const chewPhase = Math.sin(Date.now() * 0.015);
                target = { open: 0.9, curve: 0.3 + chewPhase * 0.3, brow: -0.2, pupil: 1.1, tremor: 0 };
                break;
            case 'love':
                target = { open: 0.8, curve: 0.9, brow: -0.3, pupil: 1.3, tremor: 0 };
                break;
            case 'surprised':
                target = { open: 1.3, curve: 0.1, brow: 0.5, pupil: 0.6, tremor: 0.2 };
                break;
            // ═══ NOVOS ESTADOS ═══
            case 'shocked':
                // Olhos arregalados, boca aberta de dor, tremendo muito
                const shockPulse = Math.sin(Date.now() * 0.02);
                target = { 
                    open: 1.4 + shockPulse * 0.2, 
                    curve: -0.8, 
                    brow: 0.8, 
                    pupil: 0.5 + shockPulse * 0.3, 
                    tremor: 1 
                };
                break;
            case 'frozen':
                // Olhos semi-fechados, boca tremendo, corpo encolhido
                const freezeTremble = Math.sin(Date.now() * 0.03);
                target = { 
                    open: 0.6, 
                    curve: freezeTremble * 0.2, 
                    brow: 0.3, 
                    pupil: 0.8, 
                    tremor: 0.8 
                };
                break;
            case 'mutating':
                // Olhos de confusão, expressão instável
                const glitchPhase = Date.now() * 0.025;
                target = { 
                    open: 0.8 + Math.sin(glitchPhase) * 0.4, 
                    curve: Math.sin(glitchPhase * 1.3) * 0.5, 
                    brow: Math.cos(glitchPhase) * 0.5, 
                    pupil: 0.7 + Math.sin(glitchPhase * 2) * 0.3, 
                    tremor: 0.5 
                };
                break;
            case 'tickled':
                // Olhos apertados de risada, sorriso máximo
                const laughPhase = Math.sin(Date.now() * 0.02);
                target = { 
                    open: 0.3 + Math.abs(laughPhase) * 0.3, 
                    curve: 0.9 + laughPhase * 0.1, 
                    brow: -0.4, 
                    pupil: 1.2, 
                    tremor: 0.3 
                };
                break;
            case 'alert':
                target = { open: 1.2, curve: 0.2, brow: -0.1, pupil: 0.9, tremor: 0 };
                break;
        }
        
        // Interpolação suave (Lerp)
        const lerp = 0.15;
        this.faceParams.eyeOpenness += (target.open - this.faceParams.eyeOpenness) * lerp;
        this.faceParams.mouthCurve += (target.curve - this.faceParams.mouthCurve) * lerp;
        this.faceParams.browAngle += (target.brow - this.faceParams.browAngle) * lerp;
        this.faceParams.pupilSize += (target.pupil - this.faceParams.pupilSize) * lerp;
        this.faceParams.tremor += (target.tremor - this.faceParams.tremor) * lerp;
    }
    
    updateAnimations(dt) {
        // Respiração
        this.breathPhase += 3 * dt;
        this.faceParams.breathY = Math.sin(this.breathPhase) * 2;
        
        // Piscar
        this.blinkTimer++;
        if (!this.isBlinking && this.blinkTimer > this.blinkInterval) {
            this.isBlinking = true;
            this.blinkDuration = 8;
            this.blinkTimer = 0;
            this.blinkInterval = 100 + Math.random() * 80;
        }
        if (this.isBlinking) {
            this.blinkDuration--;
            if (this.blinkDuration <= 0) {
                this.isBlinking = false;
            }
        }
        
        // Squash & Stretch decay
        this.squashX += (1 - this.squashX) * (1 - this.squashDecay);
        this.squashY += (1 - this.squashY) * (1 - this.squashDecay);
    }
    
    updateMovement(dt) {
        // Movimento para alvo
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 3) {
                // Aceleração em direção ao alvo
                const ax = (dx / dist) * this.speed * 0.5;
                const ay = (dy / dist) * this.speed * 0.5;
                
                this.vx += ax;
                this.vy += ay;
                
                // Limita velocidade máxima
                const maxSpeed = this.speed * 3;
                const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (currentSpeed > maxSpeed) {
                    this.vx = (this.vx / currentSpeed) * maxSpeed;
                    this.vy = (this.vy / currentSpeed) * maxSpeed;
                }
            } else {
                // Chegou no destino
                this.targetX = null;
                this.targetY = null;
            }
        }
        
        // Aplica velocidade
        this.x += this.vx;
        this.y += this.vy;
        
        // Fricção
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Para se velocidade muito baixa
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
        if (Math.abs(this.vy) < 0.01) this.vy = 0;
    }
    
    updateDialogue(deltaTime) {
        if (!this.currentDialogue) return;
        
        // Efeito typewriter - adiciona letra por letra
        if (this.dialogueIndex < this.currentDialogue.length) {
            this.typewriterTimer += deltaTime;
            
            while (this.typewriterTimer >= this.typewriterSpeed && 
                   this.dialogueIndex < this.currentDialogue.length) {
                const letter = this.currentDialogue[this.dialogueIndex];
                this.displayedDialogue += letter;
                this.dialogueIndex++;
                this.typewriterTimer -= this.typewriterSpeed;
                
                // Callback para som de digitação (apenas para letras visíveis)
                if (this.onTypeLetter && letter.trim()) {
                    this.onTypeLetter(letter);
                }
            }
        } else {
            // Texto completo - decrementa timer de exibição
            this.dialogueTimer -= deltaTime;
            if (this.dialogueTimer <= 0) {
                this.currentDialogue = null;
                this.displayedDialogue = '';
                this.dialogueIndex = 0;
            }
        }
    }
    
    /**
     * Faz o pet "falar" algo com efeito typewriter
     * @param {string} text - Texto da fala
     * @param {string} context - Contexto: 'idle', 'eating', 'petted', etc.
     */
    say(text, context = 'idle') {
        this.currentDialogue = text;
        this.displayedDialogue = '';
        this.dialogueIndex = 0;
        this.typewriterTimer = 0;
        this.dialogueTimer = this.dialogueDuration;
        
        // Notifica callback externo (para tocar som inicial)
        if (this.onSpeak) {
            this.onSpeak(text, this.expressionState.mood, context);
        }
    }
    
    /**
     * Retorna o diálogo visível atual (com typewriter)
     */
    getDialogue() {
        return this.displayedDialogue || null;
    }
    
    /**
     * Retorna se ainda está digitando
     */
    isTyping() {
        return this.currentDialogue && this.dialogueIndex < this.currentDialogue.length;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // RENDERING (usando apenas setPixel e algoritmos de CG)
    // ═══════════════════════════════════════════════════════════════════
    
    render(renderer, materializationSystem = null) {
        // Se morreu completamente, renderiza apenas partículas de dissolução
        if (this.isDead) {
            this.renderCollapseParticles(renderer);
            return;
        }
        
        // Obtém modificadores de renderização (Age + Vitality + Personality)
        const mods = this.getRenderModifiers();
        
        // ═══ EFEITOS DE GLITCH (Instabilidade/Colapso) ═══
        const glitchFactor = this.getGlitchFactor();
        
        // Piscar durante instabilidade alta ou colapso
        if (glitchFactor > 0.3) {
            const blinkIntensity = glitchFactor * 12;
            const blinkPhase = Math.sin(Date.now() * 0.001 * blinkIntensity);
            // Durante colapso, pisca mais (até 40% invisível)
            const threshold = this.isCollapsing ? -0.2 : -0.5;
            if (blinkPhase < threshold) {
                // Renderiza apenas partículas durante frames "invisíveis"
                if (this.isCollapsing) {
                    this.renderCollapseParticles(renderer);
                }
                return;
            }
        }
        
        // ═══ EFEITO DE PISCAR QUANDO DYING (vitalidade <= 10%) ═══
        const vitality = this.vitalitySmoothed || this.vitality || this.calculateVitality();
        if (vitality <= 0.10 && !this.isCollapsing) {
            // Piscar urgente - alterna entre visível/invisível
            const blinkSpeed = 8; // Rápido
            const blinkPhase = Math.sin(Date.now() * 0.001 * blinkSpeed);
            if (blinkPhase < 0) {
                return;
            }
        }
        
        const breathOffset = this.faceParams.breathY;
        // Aplica escala de idade ao scale base
        const ageScale = mods.scale;
        
        // ═══ JITTER DE VÉRTICES durante instabilidade ═══
        const jitter = this.getVertexJitter();
        const jitterX = jitter.x;
        const jitterY = jitter.y;
        
        // Durante colapso, o pet "encolhe" gradualmente
        const collapseScale = this.isCollapsing ? (1 - this.collapseProgress * 0.6) : 1;
        
        const scaleX = this.scale * this.squashX * ageScale * collapseScale;
        const scaleY = this.scale * this.squashY * ageScale * collapseScale * (1 + Math.sin(this.breathPhase) * 0.02);
        
        // Passa modificadores para o MaterialRenderer
        materialRenderer.setVitalityModifiers(mods);
        
        // Armazena glitch factor para uso nos métodos de desenho
        this._currentGlitchFactor = glitchFactor;
        this._currentJitter = { x: jitterX, y: jitterY };
        this._currentRenderer = renderer;
        
        // Se está materializando, usa renderização especial
        if (materializationSystem && materializationSystem.isActive) {
            this.renderWithMaterialization(renderer, materializationSystem, breathOffset, scaleX, scaleY);
            return;
        }
        
        // ═══ EFEITOS DE TELA DURANTE COLAPSO ═══
        if (this.isCollapsing) {
            this.renderCollapseEffects(renderer);
        }
        
        // NOTA: Glow/Auréola circular REMOVIDO - visual mais limpo!
        // O brilho agora vem apenas da borda neon do corpo
        
        // 2. Partículas de Ápice (se no estado máximo)
        if (mods.isApex && !this.isCollapsing) {
            this.drawApexParticles(renderer);
        }
        
        // 2. Corpo (com jitter aplicado)
        const offsetX = jitterX;
        const offsetY = jitterY + breathOffset;
        this.drawBodyWithGlitch(renderer, offsetX, offsetY, scaleX, scaleY, glitchFactor);
        
        // 3. Face (olhos, boca, sobrancelhas)
        this.drawFace(renderer, breathOffset + jitterY, scaleX, scaleY);
        
        // 4. Partículas de colapso (por cima de tudo)
        if (this.collapseParticles.length > 0) {
            this.renderCollapseParticles(renderer);
        }
        
        // Limpa referências temporárias
        this._currentGlitchFactor = 0;
        this._currentJitter = null;
        this._currentRenderer = null;
    }
    
    /**
     * Renderiza efeitos de tela durante colapso (scanlines, distorção)
     */
    renderCollapseEffects(renderer) {
        const progress = this.collapseProgress;
        const ctx = renderer.ctx;
        
        // Scanlines de erro
        if (progress > 0.2) {
            const numScanlines = Math.floor(progress * 20);
            for (let i = 0; i < numScanlines; i++) {
                const y = Math.random() * renderer.height;
                const width = 50 + Math.random() * 150;
                const x = this.x - width / 2 + (Math.random() - 0.5) * 100;
                
                // Cor de erro/estática
                const gray = Math.floor(100 + Math.random() * 100);
                const alpha = 0.1 + progress * 0.3;
                
                ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${alpha})`;
                ctx.fillRect(x, y, width, 2);
            }
        }
        
        // Blocos de corrupção
        if (progress > 0.4) {
            const numBlocks = Math.floor(progress * 10);
            for (let i = 0; i < numBlocks; i++) {
                const size = 5 + Math.random() * 15;
                const bx = this.x + (Math.random() - 0.5) * this.size * 3;
                const by = this.y + (Math.random() - 0.5) * this.size * 3;
                
                const r = Math.random() > 0.5 ? 255 : 0;
                const g = Math.random() > 0.7 ? 255 : 0;
                const b = Math.random() > 0.3 ? 255 : 100;
                const alpha = 0.2 + Math.random() * 0.3;
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(bx, by, size, size);
            }
        }
    }
    
    /**
     * Renderiza corpo com efeitos de glitch
     */
    drawBodyWithGlitch(renderer, offsetX, offsetY, scaleX, scaleY, glitchFactor) {
        const shape = SHAPES_MAP[this.shapeId];
        if (!shape) return;
        
        const params = shape.getParams(this.size * this.scale);
        const cx = this.x + offsetX;
        const cy = this.y + offsetY;
        
        // Atualiza o tempo do MaterialRenderer
        materialRenderer.update(16);
        
        if (params.type === 'circle') {
            const rx = params.radius * scaleX / this.scale;
            const ry = params.radius * scaleY / this.scale;
            
            // Gera pontos do círculo com jitter
            const circlePoints = this.generateCirclePointsWithGlitch(cx, cy, rx, ry, 32, glitchFactor);
            
            // Preenche com efeito de scanline skip
            this.fillWithGlitch(renderer, cx, cy, circlePoints, glitchFactor);
            
            // Borda com material
            if (this.borderColor) {
                this.drawCustomNeonBorder(renderer, circlePoints);
            } else {
                materialRenderer.stroke(renderer, circlePoints, this.materialId);
            }
            
        } else if (params.type === 'polygon') {
            // Transforma vértices com jitter
            const transformed = params.vertices.map(v => {
                const jitter = glitchFactor > 0.1 ? this.getVertexJitter() : { x: 0, y: 0 };
                return {
                    x: cx + v.x * scaleX / this.scale + jitter.x,
                    y: cy + v.y * scaleY / this.scale + jitter.y
                };
            });
            
            // Preenche com efeito de scanline skip
            this.fillWithGlitch(renderer, cx, cy, transformed, glitchFactor);
            
            // Borda com material
            if (this.borderColor) {
                this.drawCustomNeonBorder(renderer, transformed);
            } else {
                materialRenderer.stroke(renderer, transformed, this.materialId);
            }
        }
    }
    
    /**
     * Gera pontos de círculo com jitter de glitch
     */
    generateCirclePointsWithGlitch(cx, cy, rx, ry, segments, glitchFactor) {
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const jitter = glitchFactor > 0.1 ? this.getVertexJitter() : { x: 0, y: 0 };
            points.push({
                x: cx + Math.cos(angle) * rx + jitter.x,
                y: cy + Math.sin(angle) * ry + jitter.y
            });
        }
        return points;
    }
    
    /**
     * Preenche polígono com efeitos de glitch (scanline skip, corrupção de cor)
     */
    fillWithGlitch(renderer, cx, cy, points, glitchFactor) {
        if (glitchFactor < 0.1) {
            // Sem glitch, usa preenchimento normal
            materialRenderer.fill(renderer, cx, cy, points, this.materialId);
            return;
        }
        
        // Encontra bounds do polígono
        let minY = Infinity, maxY = -Infinity;
        points.forEach(p => {
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        
        minY = Math.ceil(minY);
        maxY = Math.floor(maxY);
        
        // Preenche scanline por scanline com efeitos
        const material = getMaterialById(this.materialId);
        const baseColor = material ? material.palette.core : this.secondaryColor;
        const glowColor = material ? material.palette.glow : this.primaryColor;
        
        for (let y = minY; y <= maxY; y++) {
            // ═══ FALHA DE SCANLINE ═══
            if (this.shouldSkipScanline(y)) {
                continue; // Pula esta linha = efeito de corpo fragmentado
            }
            
            // Encontra interseções
            const intersections = [];
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                
                if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                    const x = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                    intersections.push(x);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            // Preenche entre pares de interseções
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const xStart = Math.ceil(intersections[i]);
                const xEnd = Math.floor(intersections[i + 1]);
                
                for (let x = xStart; x <= xEnd; x++) {
                    // ═══ CORRUPÇÃO DE COR ═══
                    const t = (y - minY) / (maxY - minY);
                    const originalColor = t < 0.5 ? baseColor : glowColor;
                    const color = this.getCorruptedColor(originalColor, renderer);
                    const alpha = this.getCorruptedAlpha(220);
                    
                    const { r, g, b } = renderer.hexToRgb(color);
                    renderer.setPixel(x, y, r, g, b, alpha);
                }
            }
        }
    }
    
    /**
     * Renderiza partículas de dissolução (colapso)
     */
    renderCollapseParticles(renderer) {
        for (const p of this.collapseParticles) {
            const alpha = Math.floor(255 * p.life);
            
            if (p.isStatic) {
                // Partícula de estática (ruído cinza)
                const gray = Math.floor(100 + Math.random() * 155);
                renderer.setPixel(p.x, p.y, gray, gray, gray, alpha);
                if (p.size > 1) {
                    renderer.setPixel(p.x + 1, p.y, gray, gray, gray, alpha * 0.7);
                    renderer.setPixel(p.x, p.y + 1, gray, gray, gray, alpha * 0.7);
                }
            } else {
                // Partícula colorida (fragmento do pet)
                const { r, g, b } = renderer.hexToRgb(p.color);
                
                // Desenha partícula com glow
                for (let dx = -p.size; dx <= p.size; dx++) {
                    for (let dy = -p.size; dy <= p.size; dy++) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= p.size) {
                            const fade = 1 - dist / p.size;
                            renderer.setPixelBlend(
                                p.x + dx, 
                                p.y + dy, 
                                r, g, b, 
                                Math.floor(alpha * fade)
                            );
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Renderização com efeito de materialização (pixel a pixel)
     */
    renderWithMaterialization(renderer, matSystem, breathOffset, scaleX, scaleY) {
        const shape = SHAPES_MAP[this.shapeId];
        if (!shape) return;
        
        const params = shape.getParams(this.size * this.scale);
        const cy = this.y + breathOffset;
        
        // Glow removido para visual mais limpo
        // O brilho vem da borda neon durante materialização
        
        // Renderiza corpo pixel a pixel baseado na máscara
        if (params.type === 'circle') {
            const rx = params.radius * scaleX / this.scale;
            const ry = params.radius * scaleY / this.scale;
            this.fillEllipseWithMask(renderer, this.x, cy, rx, ry, matSystem);
            
            // Contorno apenas se progresso > 50%
            if (matSystem.progress > 0.5) {
                this.drawNeonEllipseWithMask(renderer, this.x, cy, rx, ry, matSystem);
            }
        } else if (params.type === 'polygon') {
            const transformed = params.vertices.map(v => ({
                x: this.x + v.x * scaleX / this.scale,
                y: cy + v.y * scaleY / this.scale
            }));
            this.fillPolygonWithMask(renderer, transformed, matSystem);
            
            if (matSystem.progress > 0.5) {
                this.drawNeonPolygonWithMask(renderer, transformed, matSystem);
            }
        }
        
        // Face aparece por último (progresso > 70%)
        if (matSystem.progress > 0.7) {
            const faceAlpha = (matSystem.progress - 0.7) / 0.3;
            this.drawFaceWithAlpha(renderer, breathOffset, scaleX, scaleY, faceAlpha);
        }
    }
    
    drawGlowWithAlpha(renderer, alpha) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const glowRadius = this.size * this.scale * 1.6;
        
        for (let layer = 4; layer >= 1; layer--) {
            const radius = glowRadius + layer * 6;
            const layerAlpha = Math.round(25 * (1 - layer / 5) * alpha);
            renderer.drawCircleRgba(this.x, this.y, radius, r, g, b, layerAlpha);
        }
    }
    
    fillEllipseWithMask(renderer, cx, cy, rx, ry, matSystem) {
        const inner = renderer.hexToRgb(this.secondaryColor);
        const outer = renderer.hexToRgb(this.primaryColor);
        
        for (let y = -ry; y <= ry; y++) {
            const halfWidth = rx * Math.sqrt(1 - (y * y) / (ry * ry));
            for (let x = -halfWidth; x <= halfWidth; x++) {
                const px = cx + x;
                const py = cy + y;
                
                // Verifica máscara de revelação
                const revealAlpha = matSystem.getRevealAlpha(px, py);
                if (revealAlpha === 0) continue;
                
                // Distância normalizada do centro
                const dx = x / rx;
                const dy = y / ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const t = Math.min(1, dist);
                
                // Interpola cores
                const r = Math.round(inner.r + (outer.r - inner.r) * t);
                const g = Math.round(inner.g + (outer.g - inner.g) * t);
                const b = Math.round(inner.b + (outer.b - inner.b) * t);
                
                // Aplica alpha da máscara
                const alpha = Math.round(200 * (revealAlpha / 255));
                
                // Adiciona "ruído de síntese" para pixels parcialmente revelados
                if (revealAlpha < 255 && revealAlpha > 0) {
                    const noise = (Math.random() - 0.5) * 40;
                    renderer.setPixel(px, py, 
                        Math.min(255, Math.max(0, r + noise)),
                        Math.min(255, Math.max(0, g + noise)),
                        Math.min(255, Math.max(0, b + noise)),
                        alpha
                    );
                } else {
                    renderer.setPixel(px, py, r, g, b, alpha);
                }
            }
        }
    }
    
    drawNeonEllipseWithMask(renderer, cx, cy, rx, ry, matSystem) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const alpha = Math.floor(255 * ((matSystem.progress - 0.5) / 0.5));
        
        for (let i = 2; i >= 0; i--) {
            const layerAlpha = i === 0 ? alpha : Math.round(alpha * 0.3 * (1 - i / 3));
            const offset = i * 1.5;
            this.drawEllipseRgba(renderer, cx, cy, rx + offset, ry + offset, r, g, b, layerAlpha);
        }
    }
    
    fillPolygonWithMask(renderer, vertices, matSystem) {
        const top = renderer.hexToRgb(this.secondaryColor);
        const bottom = renderer.hexToRgb(this.primaryColor);
        
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
                    const revealAlpha = matSystem.getRevealAlpha(x, y);
                    if (revealAlpha === 0) continue;
                    
                    const alpha = Math.round(255 * (revealAlpha / 255));
                    
                    if (revealAlpha < 255 && revealAlpha > 0) {
                        const noise = (Math.random() - 0.5) * 40;
                        renderer.setPixel(x, y,
                            Math.min(255, Math.max(0, r + noise)),
                            Math.min(255, Math.max(0, g + noise)),
                            Math.min(255, Math.max(0, b + noise)),
                            alpha
                        );
                    } else {
                        renderer.setPixel(x, y, r, g, b, alpha);
                    }
                }
            }
        }
    }
    
    drawNeonPolygonWithMask(renderer, vertices, matSystem) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const alpha = Math.floor(255 * ((matSystem.progress - 0.5) / 0.5));
        const n = vertices.length;
        
        for (let layer = 2; layer >= 0; layer--) {
            const layerAlpha = layer === 0 ? alpha : Math.round(alpha * 0.4 * (1 - layer / 3));
            
            for (let i = 0; i < n; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % n];
                
                if (layer > 0) {
                    this.drawThickLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, layerAlpha, layer);
                } else {
                    this.drawLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, layerAlpha);
                }
            }
        }
    }
    
    drawFaceWithAlpha(renderer, breathOffset, scaleX, scaleY, alpha) {
        const s = this.scale;
        const cx = this.x;
        const cy = this.y + breathOffset;
        
        // Renderiza face com alpha global
        this.tempFaceAlpha = alpha;
        this.drawEyes(renderer, cx, cy, s);
        this.drawMouth(renderer, cx, cy + 10 * s, s);
        this.drawBrows(renderer, cx, cy, s);
        this.tempFaceAlpha = 1;
    }
    
    drawGlow(renderer, mods = null) {
        // Usa a cor do material para o glow
        const material = getMaterialById(this.materialId);
        const glowColor = material ? material.palette.glow : this.primaryColor;
        let { r, g, b } = renderer.hexToRgb(glowColor);
        
        // Aplica escala de idade ao raio
        const ageScale = mods ? mods.scale : 1.0;
        const glowRadius = this.size * this.scale * ageScale * 1.6;
        
        // Intensidade do glow varia por material e vitalidade
        const baseIntensity = material ? material.render.glowIntensity : 0.5;
        const vitalityMod = mods ? mods.glowIntensity : 1.0;
        const intensity = baseIntensity * vitalityMod;
        
        // Aplica boost de saturação da personalidade
        if (mods && mods.saturationBoost !== 0) {
            const boost = mods.saturationBoost;
            r = Math.min(255, Math.max(0, r + r * boost));
            g = Math.min(255, Math.max(0, g + g * boost));
            b = Math.min(255, Math.max(0, b + b * boost));
        }
        
        // Flicker effect (instabilidade)
        let flickerMod = 1.0;
        if (mods && mods.flickerAmount > 0) {
            flickerMod = 1.0 + (Math.sin(Date.now() * 0.015) * mods.flickerAmount * 0.5);
        }
        
        // Múltiplas camadas de glow
        for (let layer = 4; layer >= 1; layer--) {
            const radius = glowRadius + layer * 6;
            const alpha = Math.round(25 * intensity * flickerMod * (1 - layer / 5));
            renderer.drawCircleRgba(this.x, this.y, radius, r, g, b, alpha);
        }
        
        // Ápice: camada extra de brilho dourado
        if (mods && mods.isApex) {
            const apexPulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
            renderer.drawCircleRgba(this.x, this.y, glowRadius * 1.3, 255, 223, 100, Math.round(30 * apexPulse));
        }
    }
    
    /**
     * Desenha partículas de Ápice (estado máximo)
     * Partículas douradas orbitando o pet
     */
    drawApexParticles(renderer) {
        const time = Date.now() * 0.002;
        const numParticles = 8;
        const orbitRadius = this.size * this.scale * 1.8;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = time + (i / numParticles) * Math.PI * 2;
            const wobble = Math.sin(time * 2 + i) * 5;
            
            const px = this.x + Math.cos(angle) * (orbitRadius + wobble);
            const py = this.y + Math.sin(angle) * (orbitRadius * 0.6 + wobble);
            
            // Tamanho varia com a posição
            const size = 2 + Math.sin(time * 3 + i * 0.5) * 1;
            
            // Cor dourada brilhante
            const brightness = 200 + Math.sin(time * 4 + i) * 55;
            renderer.fillCircle(px, py, size, `rgb(${brightness}, ${brightness * 0.85}, ${brightness * 0.3})`);
            
            // Glow da partícula
            renderer.drawCircleRgba(px, py, size + 2, 255, 220, 100, 60);
        }
    }
    
    drawBody(renderer, breathOffset, scaleX, scaleY) {
        const shape = SHAPES_MAP[this.shapeId];
        if (!shape) return;
        
        const params = shape.getParams(this.size * this.scale);
        const cy = this.y + breathOffset;
        
        // Atualiza o tempo do MaterialRenderer
        materialRenderer.update(16);
        
        if (params.type === 'circle') {
            const rx = params.radius * scaleX / this.scale;
            const ry = params.radius * scaleY / this.scale;
            
            // Gera pontos do círculo como polígono
            const circlePoints = this.generateCirclePoints(this.x, cy, rx, ry, 32);
            
            // Usa o MaterialRenderer para preencher
            materialRenderer.fill(renderer, this.x, cy, circlePoints, this.materialId);
            
            // Borda com material (ou cor customizada se definida)
            if (this.borderColor) {
                this.drawCustomNeonBorder(renderer, circlePoints);
            } else {
                materialRenderer.stroke(renderer, circlePoints, this.materialId);
            }
            
        } else if (params.type === 'polygon') {
            // Transforma vértices
            const transformed = params.vertices.map(v => ({
                x: this.x + v.x * scaleX / this.scale,
                y: cy + v.y * scaleY / this.scale
            }));
            
            // Usa o MaterialRenderer para preencher
            materialRenderer.fill(renderer, this.x, cy, transformed, this.materialId);
            
            // Borda com material (ou cor customizada se definida)
            if (this.borderColor) {
                this.drawCustomNeonBorder(renderer, transformed);
            } else {
                materialRenderer.stroke(renderer, transformed, this.materialId);
            }
        }
    }
    
    /**
     * Desenha borda neon customizada com a cor borderColor
     */
    drawCustomNeonBorder(renderer, points) {
        const { r, g, b } = renderer.hexToRgb(this.borderColor);
        const n = points.length;
        
        // Múltiplas camadas para efeito glow neon
        for (let layer = 4; layer >= 0; layer--) {
            const alpha = layer === 0 ? 255 : Math.floor(80 * (1 - layer / 5));
            
            for (let i = 0; i < n; i++) {
                const v1 = points[i];
                const v2 = points[(i + 1) % n];
                
                if (layer > 0) {
                    // Linhas com espessura para glow
                    this.drawThickLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha, layer);
                } else {
                    // Linha principal
                    this.drawLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha);
                }
            }
        }
    }
    
    /**
     * Gera pontos de um círculo/elipse como polígono
     */
    generateCirclePoints(cx, cy, rx, ry, segments = 32) {
        const points = [];
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
                x: cx + Math.cos(angle) * rx,
                y: cy + Math.sin(angle) * ry
            });
        }
        return points;
    }
    
    // Elipse com gradiente radial (usando setPixel)
    fillEllipseGradient(renderer, cx, cy, rx, ry) {
        const inner = renderer.hexToRgb(this.secondaryColor);
        const outer = renderer.hexToRgb(this.primaryColor);
        
        for (let y = -ry; y <= ry; y++) {
            const halfWidth = rx * Math.sqrt(1 - (y * y) / (ry * ry));
            for (let x = -halfWidth; x <= halfWidth; x++) {
                // Distância normalizada do centro
                const dx = x / rx;
                const dy = y / ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const t = Math.min(1, dist);
                
                // Interpola cores
                const r = Math.round(inner.r + (outer.r - inner.r) * t);
                const g = Math.round(inner.g + (outer.g - inner.g) * t);
                const b = Math.round(inner.b + (outer.b - inner.b) * t);
                
                renderer.setPixel(cx + x, cy + y, r, g, b, 200);
            }
        }
    }
    
    // Elipse com efeito neon (múltiplas camadas)
    drawNeonEllipse(renderer, cx, cy, rx, ry) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        
        // Camadas de glow
        for (let i = 3; i >= 0; i--) {
            const alpha = i === 0 ? 255 : Math.round(80 * (1 - i / 4));
            const offset = i * 1.5;
            this.drawEllipseRgba(renderer, cx, cy, rx + offset, ry + offset, r, g, b, alpha);
        }
    }
    
    // Desenha elipse com RGBA (Midpoint Algorithm)
    drawEllipseRgba(renderer, cx, cy, rx, ry, r, g, b, a) {
        let x = 0;
        let y = Math.round(ry);
        
        let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
        let dx = 2 * ry * ry * x;
        let dy = 2 * rx * rx * y;
        
        const plot = (px, py) => renderer.setPixelBlend(px, py, r, g, b, a);
        
        // Região 1
        while (dx < dy) {
            plot(cx + x, cy + y);
            plot(cx - x, cy + y);
            plot(cx + x, cy - y);
            plot(cx - x, cy - y);
            
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
            plot(cx + x, cy + y);
            plot(cx - x, cy + y);
            plot(cx + x, cy - y);
            plot(cx - x, cy - y);
            
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
    
    // Polígono com contorno neon
    drawNeonPolygon(renderer, vertices) {
        const { r, g, b } = renderer.hexToRgb(this.primaryColor);
        const n = vertices.length;
        
        // Múltiplas camadas para efeito glow
        for (let layer = 3; layer >= 0; layer--) {
            const alpha = layer === 0 ? 255 : Math.round(60 * (1 - layer / 4));
            
            for (let i = 0; i < n; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % n];
                
                // Linha com thickness para glow
                if (layer > 0) {
                    this.drawThickLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha, layer);
                } else {
                    this.drawLineRgba(renderer, v1.x, v1.y, v2.x, v2.y, r, g, b, alpha);
                }
            }
        }
    }
    
    // Linha com RGBA (Bresenham)
    drawLineRgba(renderer, x0, y0, x1, y1, r, g, b, a) {
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
            renderer.setPixelBlend(x0, y0, r, g, b, a);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
    
    // Linha com espessura
    drawThickLineRgba(renderer, x0, y0, x1, y1, r, g, b, a, thickness) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        
        for (let t = -thickness; t <= thickness; t++) {
            const ox = nx * t * 0.5;
            const oy = ny * t * 0.5;
            this.drawLineRgba(renderer, x0 + ox, y0 + oy, x1 + ox, y1 + oy, r, g, b, a);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // FACE RENDERING
    // ═══════════════════════════════════════════════════════════════════
    
    drawFace(renderer, breathOffset, scaleX, scaleY) {
        const s = this.scale;
        const cx = this.x;
        const cy = this.y + breathOffset;
        
        // Tremor (quando com medo/frio)
        const tremorX = (Math.random() - 0.5) * this.faceParams.tremor * 3;
        const tremorY = (Math.random() - 0.5) * this.faceParams.tremor * 3;
        
        // Olhos
        this.drawEyes(renderer, cx + tremorX, cy + tremorY, s);
        
        // Boca
        this.drawMouth(renderer, cx + tremorX, cy + tremorY + 10 * s, s);
        
        // Sobrancelhas
        this.drawBrows(renderer, cx + tremorX, cy + tremorY, s);
        
        // Extras (blush quando feliz)
        if (this.expressionState.mood === 'happy' || this.isBeingPetted) {
            this.drawBlush(renderer, cx, cy, s);
        }
    }
    
    drawEyes(renderer, cx, cy, s) {
        const eyeY = cy - 6 * s;
        const eyeSpacing = 10 * s;
        
        // Focus offset (para onde está olhando)
        const fox = this.faceParams.focusOffset.x;
        const foy = this.faceParams.focusOffset.y;
        
        // Usa cor customizada se definida, senão usa secondaryColor
        const eyeCol = this.eyeColor || this.secondaryColor;
        
        if (this.isBlinking) {
            // Olhos fechados - linhas horizontais
            const lineY = eyeY;
            renderer.drawLine(cx - eyeSpacing - 4 * s, lineY, cx - eyeSpacing + 4 * s, lineY, eyeCol);
            renderer.drawLine(cx + eyeSpacing - 4 * s, lineY, cx + eyeSpacing + 4 * s, lineY, eyeCol);
            return;
        }
        
        const openness = this.faceParams.eyeOpenness;
        const pupilSize = this.faceParams.pupilSize;
        
        // Fator de reação baseado no mood e ação atual
        const moodReaction = this.getMoodReactionFactor();
        
        switch (this.eyeType) {
            case 'circle':
                this.drawCircleEyes(renderer, cx, eyeY, eyeSpacing, s, openness, pupilSize, fox, foy, eyeCol);
                break;
            case 'dot':
                this.drawDotEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy, eyeCol);
                break;
            case 'pixel':
                this.drawPixelEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy, eyeCol);
                break;
            case 'slit':
                this.drawSlitEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy, eyeCol);
                break;
            // ═══ NOVOS TIPOS DE OLHOS ═══
            case 'cyber':
                this.drawCyberEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            case 'spiral':
                this.drawSpiralEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            case 'void':
                this.drawVoidEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy, eyeCol);
                break;
            case 'compound':
                this.drawCompoundEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            case 'cross':
                this.drawCrossEyes(renderer, cx, eyeY, eyeSpacing, s, openness, fox, foy, eyeCol);
                break;
            case 'star':
                this.drawStarEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            case 'glitch':
                this.drawGlitchEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            case 'heart':
                this.drawHeartEyes(renderer, cx, eyeY, eyeSpacing, s, openness, moodReaction, eyeCol);
                break;
            default:
                this.drawCircleEyes(renderer, cx, eyeY, eyeSpacing, s, openness, pupilSize, fox, foy, eyeCol);
        }
    }
    
    /**
     * Retorna um fator de reação baseado no mood e ação atual
     * Usado para fazer os olhos reagirem diferentemente em cada estado
     */
    getMoodReactionFactor() {
        const action = this.expressionState.action;
        const mood = this.currentMood;
        
        // Ação temporária tem prioridade
        if (action === 'shocked') return { speed: 3, intensity: 1.5, shake: 0.5 };
        if (action === 'frozen') return { speed: 0.2, intensity: 0.5, shake: 0.8 };
        if (action === 'tickled') return { speed: 2, intensity: 1.2, shake: 0.3 };
        if (action === 'mutating') return { speed: 4, intensity: 2, shake: 1 };
        
        // Baseado no mood
        switch (mood) {
            case MOOD_TYPES.ECSTATIC: return { speed: 1.5, intensity: 1.3, shake: 0 };
            case MOOD_TYPES.HAPPY: return { speed: 1.2, intensity: 1.1, shake: 0 };
            case MOOD_TYPES.SAD: return { speed: 0.5, intensity: 0.7, shake: 0 };
            case MOOD_TYPES.ANGRY: return { speed: 1.8, intensity: 1.4, shake: 0.2 };
            case MOOD_TYPES.TIRED: return { speed: 0.3, intensity: 0.6, shake: 0 };
            case MOOD_TYPES.DYING: return { speed: 0.2, intensity: 0.4, shake: 0.4 };
            default: return { speed: 1, intensity: 1, shake: 0 };
        }
    }
    
    drawCircleEyes(renderer, cx, cy, spacing, s, openness, pupilSize, fox, foy, eyeCol) {
        const eyeRadius = 5 * s * openness;
        const pupilR = 2 * s * pupilSize;
        const irisR = 3.5 * s;
        
        // Posições dos olhos
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Esclera (branco)
        renderer.fillCircle(leftX, cy, eyeRadius, '#ffffff');
        renderer.fillCircle(rightX, cy, eyeRadius, '#ffffff');
        
        // Contorno
        renderer.drawCircle(leftX, cy, eyeRadius, eyeCol);
        renderer.drawCircle(rightX, cy, eyeRadius, eyeCol);
        
        // Íris (segue o foco)
        const irisOffsetX = fox * 1.5;
        const irisOffsetY = foy * 1.5;
        renderer.fillCircle(leftX + irisOffsetX, cy + irisOffsetY, irisR, eyeCol);
        renderer.fillCircle(rightX + irisOffsetX, cy + irisOffsetY, irisR, eyeCol);
        
        // Pupila
        renderer.fillCircle(leftX + irisOffsetX, cy + irisOffsetY, pupilR, '#000000');
        renderer.fillCircle(rightX + irisOffsetX, cy + irisOffsetY, pupilR, '#000000');
        
        // Brilho
        const highlightR = pupilR * 0.5;
        renderer.fillCircle(leftX - 1.5 * s + irisOffsetX * 0.3, cy - 1.5 * s + irisOffsetY * 0.3, highlightR, '#ffffff');
        renderer.fillCircle(rightX - 1.5 * s + irisOffsetX * 0.3, cy - 1.5 * s + irisOffsetY * 0.3, highlightR, '#ffffff');
    }
    
    drawDotEyes(renderer, cx, cy, spacing, s, openness, fox, foy, eyeCol) {
        const dotRadius = 4 * s * openness;
        
        const leftX = cx - spacing + fox;
        const rightX = cx + spacing + fox;
        const eyeY = cy + foy;
        
        // Sombra
        renderer.fillCircle(leftX + 1, eyeY + 1, dotRadius, '#000000');
        renderer.fillCircle(rightX + 1, eyeY + 1, dotRadius, '#000000');
        
        // Ponto principal
        renderer.fillCircle(leftX, eyeY, dotRadius, eyeCol);
        renderer.fillCircle(rightX, eyeY, dotRadius, eyeCol);
        
        // Brilho
        renderer.fillCircle(leftX - 1.5 * s, eyeY - 1.5 * s, dotRadius * 0.35, '#ffffff');
        renderer.fillCircle(rightX - 1.5 * s, eyeY - 1.5 * s, dotRadius * 0.35, '#ffffff');
    }
    
    drawPixelEyes(renderer, cx, cy, spacing, s, openness, fox, foy, eyeCol) {
        const eyeW = 8 * s;
        const eyeH = 6 * s * openness;
        
        const leftX = cx - spacing - eyeW / 2;
        const rightX = cx + spacing - eyeW / 2;
        const eyeY = cy - eyeH / 2;
        
        // Fundo branco
        renderer.fillRect(leftX, eyeY, eyeW, eyeH, '#ffffff');
        renderer.fillRect(rightX, eyeY, eyeW, eyeH, '#ffffff');
        
        // Contorno
        renderer.drawRect(leftX, eyeY, eyeW, eyeH, eyeCol);
        renderer.drawRect(rightX, eyeY, eyeW, eyeH, eyeCol);
        
        // Pupila pixel
        const pixelSize = 3 * s;
        const pupilX = fox * 1.5;
        const pupilY = foy * 1.5;
        renderer.fillRect(leftX + eyeW / 2 - pixelSize / 2 + pupilX, cy - pixelSize / 2 + pupilY, pixelSize, pixelSize, eyeCol);
        renderer.fillRect(rightX + eyeW / 2 - pixelSize / 2 + pupilX, cy - pixelSize / 2 + pupilY, pixelSize, pixelSize, eyeCol);
        
        // Highlight
        renderer.fillRect(leftX + 1, eyeY + 1, 2 * s, 2 * s, '#ffffff');
        renderer.fillRect(rightX + 1, eyeY + 1, 2 * s, 2 * s, '#ffffff');
    }
    
    drawSlitEyes(renderer, cx, cy, spacing, s, openness, fox, foy, eyeCol) {
        const eyeW = 5 * s;
        const eyeH = 7 * s * openness;
        
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Fundo do olho (elipse colorida)
        renderer.fillEllipse(leftX, cy, eyeW, eyeH, eyeCol);
        renderer.fillEllipse(rightX, cy, eyeW, eyeH, eyeCol);
        
        // Fenda vertical (pupila)
        const slitW = 2;
        const slitH = eyeH * 0.9;
        renderer.fillRect(leftX - slitW / 2 + fox, cy - slitH / 2 + foy, slitW, slitH, '#000000');
        renderer.fillRect(rightX - slitW / 2 + fox, cy - slitH / 2 + foy, slitW, slitH, '#000000');
        
        // Brilho
        renderer.fillCircle(leftX - 2 * s, cy - 2 * s, 1.5 * s, '#ffffff');
        renderer.fillCircle(rightX - 2 * s, cy - 2 * s, 1.5 * s, '#ffffff');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // NOVOS TIPOS DE OLHOS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Olhos Cyber - Visor horizontal pulsante
     */
    drawCyberEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const visorW = 16 * s;
        const visorH = 4 * s * openness;
        
        // Pulso baseado no tempo e reação
        const pulse = Math.sin(Date.now() * 0.005 * reaction.speed) * 0.3 + 0.7;
        const { r, g, b } = renderer.hexToRgb(eyeCol);
        
        // Visor principal (uma barra horizontal)
        const visorX = cx - visorW / 2;
        const visorY = cy - visorH / 2;
        
        // Glow de fundo
        renderer.fillRect(visorX - 2, visorY - 2, visorW + 4, visorH + 4, '#000000');
        
        // Barra principal com alpha pulsante
        for (let x = 0; x < visorW; x++) {
            const scanline = Math.sin((x / visorW) * Math.PI * 4 + Date.now() * 0.01 * reaction.speed);
            const alpha = Math.floor(150 + 100 * pulse * (0.5 + scanline * 0.5));
            for (let y = 0; y < visorH; y++) {
                renderer.setPixelBlend(visorX + x, visorY + y, r, g, b, alpha);
            }
        }
        
        // Linhas de scan horizontais
        renderer.drawLine(visorX, visorY, visorX + visorW, visorY, eyeCol);
        renderer.drawLine(visorX, visorY + visorH, visorX + visorW, visorY + visorH, eyeCol);
    }
    
    /**
     * Olhos Espiral - Hipnose giratória (gira mais rápido em choque)
     */
    drawSpiralEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const radius = 5 * s * openness;
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Velocidade de rotação baseada no estado
        const rotation = Date.now() * 0.003 * reaction.speed;
        
        // Desenha espirais
        this.drawSpiral(renderer, leftX, cy, radius, rotation, eyeCol, reaction.intensity);
        this.drawSpiral(renderer, rightX, cy, radius, -rotation, eyeCol, reaction.intensity);
    }
    
    drawSpiral(renderer, cx, cy, radius, rotation, color, intensity) {
        const { r, g, b } = renderer.hexToRgb(color);
        const turns = 2.5 * intensity;
        
        for (let t = 0; t < turns * Math.PI * 2; t += 0.1) {
            const dist = (t / (turns * Math.PI * 2)) * radius;
            const x = cx + Math.cos(t + rotation) * dist;
            const y = cy + Math.sin(t + rotation) * dist;
            const alpha = Math.floor(200 * (1 - t / (turns * Math.PI * 2)));
            renderer.setPixelBlend(x, y, r, g, b, alpha);
        }
    }
    
    /**
     * Olhos Vazio - Órbitas vazias com ponto de luz central
     */
    drawVoidEyes(renderer, cx, cy, spacing, s, openness, fox, foy, eyeCol) {
        const radius = 6 * s * openness;
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Órbitas vazias (círculos escuros)
        renderer.fillCircle(leftX, cy, radius, '#0a0a0f');
        renderer.fillCircle(rightX, cy, radius, '#0a0a0f');
        
        // Contorno brilhante
        renderer.drawCircle(leftX, cy, radius, eyeCol);
        renderer.drawCircle(rightX, cy, radius, eyeCol);
        renderer.drawCircle(leftX, cy, radius - 1, eyeCol);
        renderer.drawCircle(rightX, cy, radius - 1, eyeCol);
        
        // Ponto de luz central flutuante
        const pulse = Math.sin(Date.now() * 0.003) * 1.5;
        const lightR = 1.5 * s;
        renderer.fillCircle(leftX + fox * 0.5 + pulse, cy + foy * 0.5, lightR, eyeCol);
        renderer.fillCircle(rightX + fox * 0.5 - pulse, cy + foy * 0.5, lightR, eyeCol);
        
        // Glow ao redor do ponto
        renderer.drawCircle(leftX + fox * 0.5 + pulse, cy + foy * 0.5, lightR + 2, eyeCol);
        renderer.drawCircle(rightX + fox * 0.5 - pulse, cy + foy * 0.5, lightR + 2, eyeCol);
    }
    
    /**
     * Olhos Compostos - Múltiplos pixels como olho de inseto
     */
    drawCompoundEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        const pixelSize = 2 * s;
        const gridSize = 3; // 3x3 grid
        
        const { r, g, b } = renderer.hexToRgb(eyeCol);
        
        // Desenha grid de hexágonos/pixels
        for (let eye of [leftX, rightX]) {
            for (let gx = -1; gx <= 1; gx++) {
                for (let gy = -1; gy <= 1; gy++) {
                    const px = eye + gx * pixelSize * 1.2;
                    const py = cy + gy * pixelSize * 1.2 * openness;
                    
                    // Cada célula pisca independentemente
                    const phase = (gx + 2) * (gy + 2) + Date.now() * 0.002 * reaction.speed;
                    const brightness = Math.sin(phase) * 0.3 + 0.7;
                    const alpha = Math.floor(255 * brightness * reaction.intensity);
                    
                    renderer.fillCircle(px, py, pixelSize * 0.6, '#000000');
                    this.drawHexagon(renderer, px, py, pixelSize * 0.5, r, g, b, alpha);
                }
            }
        }
    }
    
    drawHexagon(renderer, cx, cy, size, r, g, b, a) {
        for (let i = 0; i < 6; i++) {
            const angle1 = (i / 6) * Math.PI * 2;
            const angle2 = ((i + 1) / 6) * Math.PI * 2;
            const x1 = cx + Math.cos(angle1) * size;
            const y1 = cy + Math.sin(angle1) * size;
            const x2 = cx + Math.cos(angle2) * size;
            const y2 = cy + Math.sin(angle2) * size;
            this.drawLineRgba(renderer, x1, y1, x2, y2, r, g, b, a);
        }
    }
    
    /**
     * Olhos Cruz - Formato de mira/cruz
     */
    drawCrossEyes(renderer, cx, cy, spacing, s, openness, fox, foy, eyeCol) {
        const size = 5 * s * openness;
        const leftX = cx - spacing + fox * 0.5;
        const rightX = cx + spacing + fox * 0.5;
        const eyeY = cy + foy * 0.5;
        
        // Cruz esquerda
        renderer.drawLine(leftX - size, eyeY, leftX + size, eyeY, eyeCol);
        renderer.drawLine(leftX, eyeY - size, leftX, eyeY + size, eyeCol);
        renderer.drawCircle(leftX, eyeY, size * 0.6, eyeCol);
        
        // Cruz direita
        renderer.drawLine(rightX - size, eyeY, rightX + size, eyeY, eyeCol);
        renderer.drawLine(rightX, eyeY - size, rightX, eyeY + size, eyeCol);
        renderer.drawCircle(rightX, eyeY, size * 0.6, eyeCol);
        
        // Ponto central
        renderer.fillCircle(leftX, eyeY, 1.5 * s, eyeCol);
        renderer.fillCircle(rightX, eyeY, 1.5 * s, eyeCol);
    }
    
    /**
     * Olhos Estrela - Brilhantes estilo anime
     */
    drawStarEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const radius = 6 * s * openness;
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Rotação e escala baseadas na reação
        const rot = Date.now() * 0.001 * reaction.speed;
        const scale = 0.8 + Math.sin(Date.now() * 0.005 * reaction.speed) * 0.2 * reaction.intensity;
        
        // Desenha estrelas
        this.drawStar(renderer, leftX, cy, radius * scale, 5, rot, eyeCol);
        this.drawStar(renderer, rightX, cy, radius * scale, 5, -rot, eyeCol);
        
        // Centro brilhante
        renderer.fillCircle(leftX, cy, radius * 0.3, '#ffffff');
        renderer.fillCircle(rightX, cy, radius * 0.3, '#ffffff');
    }
    
    drawStar(renderer, cx, cy, radius, points, rotation, color) {
        const { r, g, b } = renderer.hexToRgb(color);
        const innerRadius = radius * 0.4;
        
        for (let i = 0; i < points * 2; i++) {
            const angle1 = (i / (points * 2)) * Math.PI * 2 + rotation;
            const angle2 = ((i + 1) / (points * 2)) * Math.PI * 2 + rotation;
            const r1 = i % 2 === 0 ? radius : innerRadius;
            const r2 = (i + 1) % 2 === 0 ? radius : innerRadius;
            
            const x1 = cx + Math.cos(angle1) * r1;
            const y1 = cy + Math.sin(angle1) * r1;
            const x2 = cx + Math.cos(angle2) * r2;
            const y2 = cy + Math.sin(angle2) * r2;
            
            this.drawLineRgba(renderer, x1, y1, x2, y2, r, g, b, 255);
        }
    }
    
    /**
     * Olhos Glitch - Efeito de interferência digital
     */
    drawGlitchEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const size = 5 * s * openness;
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        const { r, g, b } = renderer.hexToRgb(eyeCol);
        
        // Offset de glitch baseado na reação
        const glitchX = (Math.random() - 0.5) * 4 * reaction.shake;
        const glitchY = (Math.random() - 0.5) * 2 * reaction.shake;
        
        // Múltiplas camadas deslocadas (RGB split)
        // Canal vermelho
        renderer.fillRect(leftX - size + glitchX, cy - size * 0.6, size * 2, size * 1.2 * openness, '#ff000066');
        renderer.fillRect(rightX - size + glitchX, cy - size * 0.6, size * 2, size * 1.2 * openness, '#ff000066');
        
        // Canal verde
        renderer.fillRect(leftX - size - glitchX, cy - size * 0.6 + glitchY, size * 2, size * 1.2 * openness, '#00ff0066');
        renderer.fillRect(rightX - size - glitchX, cy - size * 0.6 + glitchY, size * 2, size * 1.2 * openness, '#00ff0066');
        
        // Canal azul / cor principal
        renderer.fillRect(leftX - size, cy - size * 0.6 - glitchY, size * 2, size * 1.2 * openness, eyeCol);
        renderer.fillRect(rightX - size, cy - size * 0.6 - glitchY, size * 2, size * 1.2 * openness, eyeCol);
        
        // Linhas de scan aleatórias
        if (Math.random() > 0.7) {
            const scanY = cy + (Math.random() - 0.5) * size * 2;
            renderer.drawLine(cx - 30 * s, scanY, cx + 30 * s, scanY, '#ffffff44');
        }
    }
    
    /**
     * Olhos Coração - Apaixonados
     */
    drawHeartEyes(renderer, cx, cy, spacing, s, openness, reaction, eyeCol) {
        const size = 5 * s * openness * reaction.intensity;
        const leftX = cx - spacing;
        const rightX = cx + spacing;
        
        // Pulso de amor
        const pulse = Math.sin(Date.now() * 0.008 * reaction.speed) * 0.15 + 1;
        
        this.drawHeart(renderer, leftX, cy, size * pulse, eyeCol);
        this.drawHeart(renderer, rightX, cy, size * pulse, eyeCol);
    }
    
    drawHeart(renderer, cx, cy, size, color) {
        const { r, g, b } = renderer.hexToRgb(color);
        
        // Desenha coração usando curvas paramétricas
        for (let t = 0; t < Math.PI * 2; t += 0.05) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            
            const px = cx + (x / 16) * size;
            const py = cy + (y / 16) * size;
            
            renderer.setPixelBlend(px, py, r, g, b, 255);
            renderer.setPixelBlend(px + 1, py, r, g, b, 200);
            renderer.setPixelBlend(px - 1, py, r, g, b, 200);
        }
        
        // Preenchimento simples
        renderer.fillCircle(cx - size * 0.3, cy - size * 0.1, size * 0.4, color);
        renderer.fillCircle(cx + size * 0.3, cy - size * 0.1, size * 0.4, color);
    }
    
    drawMouth(renderer, cx, cy, s) {
        const curve = this.faceParams.mouthCurve;
        
        // Usa cor customizada se definida, senão usa secondaryColor
        const mouthCol = this.mouthColor || this.secondaryColor;
        
        // Fator de reação para bocas animadas
        const reaction = this.getMoodReactionFactor();
        
        switch (this.mouthType) {
            case 'simple':
                this.drawSimpleMouth(renderer, cx, cy, s, curve, mouthCol);
                break;
            case 'cat':
                this.drawCatMouth(renderer, cx, cy, s, curve, mouthCol);
                break;
            case 'pixel':
                this.drawPixelMouth(renderer, cx, cy, s, curve, mouthCol);
                break;
            case 'kawaii':
                this.drawKawaiiMouth(renderer, cx, cy, s, curve, mouthCol);
                break;
            // ═══ NOVAS BOCAS ═══
            case 'saw':
                this.drawSawMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'joker':
                this.drawJokerMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'fangs':
                this.drawFangsMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'pulse':
                this.drawPulseMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'zipper':
                this.drawZipperMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'bubble':
                this.drawBubbleMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            case 'uwu':
                this.drawUwuMouth(renderer, cx, cy, s, curve, mouthCol);
                break;
            case 'robot':
                this.drawRobotMouth(renderer, cx, cy, s, curve, mouthCol, reaction);
                break;
            default:
                this.drawSimpleMouth(renderer, cx, cy, s, curve, mouthCol);
        }
    }
    
    drawSimpleMouth(renderer, cx, cy, s, curve, mouthCol) {
        const mouthWidth = 8 * s;
        const curveHeight = curve * 5 * s;
        
        // Desenha arco usando Bresenham para vários segmentos
        const segments = 10;
        let lastX = cx - mouthWidth / 2;
        let lastY = cy;
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = cx - mouthWidth / 2 + mouthWidth * t;
            // Parábola: y = 4 * curve * t * (1 - t)
            const y = cy + curveHeight * 4 * t * (1 - t);
            
            renderer.drawLine(lastX, lastY, x, y, mouthCol);
            lastX = x;
            lastY = y;
        }
    }
    
    drawCatMouth(renderer, cx, cy, s, curve, mouthCol) {
        const w = 6 * s;
        const h = 3 * s * Math.abs(curve);
        const dir = curve >= 0 ? 1 : -1;
        
        // Formato "w" ou "m"
        renderer.drawLine(cx - w, cy, cx - w * 0.3, cy + h * dir, mouthCol);
        renderer.drawLine(cx - w * 0.3, cy + h * dir, cx, cy - h * 0.5 * dir, mouthCol);
        renderer.drawLine(cx, cy - h * 0.5 * dir, cx + w * 0.3, cy + h * dir, mouthCol);
        renderer.drawLine(cx + w * 0.3, cy + h * dir, cx + w, cy, mouthCol);
    }
    
    drawPixelMouth(renderer, cx, cy, s, curve, mouthCol) {
        const mouthW = 10 * s;
        const mouthH = 3 * s;
        
        if (curve > 0.4) {
            // Boca aberta feliz
            renderer.fillRect(cx - mouthW / 2, cy - mouthH / 2, mouthW, mouthH, '#000000');
            renderer.drawRect(cx - mouthW / 2, cy - mouthH / 2, mouthW, mouthH, mouthCol);
        } else if (curve < -0.2) {
            // Boca triste
            renderer.drawLine(cx - mouthW / 2, cy + mouthH, cx + mouthW / 2, cy + mouthH, mouthCol);
        } else {
            // Neutro
            renderer.drawLine(cx - mouthW / 2, cy, cx + mouthW / 2, cy, mouthCol);
        }
    }
    
    drawKawaiiMouth(renderer, cx, cy, s, curve, mouthCol) {
        const radius = 3 * s * Math.abs(curve);
        
        if (curve > 0) {
            // Sorriso pequeno (semicírculo inferior)
            for (let angle = 0; angle <= Math.PI; angle += 0.1) {
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius * 0.5;
                renderer.setPixelHex(x, y, mouthCol);
            }
        } else if (curve < -0.1) {
            // Tristeza (semicírculo superior)
            for (let angle = Math.PI; angle <= Math.PI * 2; angle += 0.1) {
                const x = cx + Math.cos(angle) * radius;
                const y = cy + 2 * s + Math.sin(angle) * radius * 0.5;
                renderer.setPixelHex(x, y, mouthCol);
            }
        } else {
            // Boquinha fechada
            renderer.setPixelHex(cx - 1, cy, mouthCol);
            renderer.setPixelHex(cx, cy, mouthCol);
            renderer.setPixelHex(cx + 1, cy, mouthCol);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // NOVAS BOCAS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Boca Serra - Zigue-zague afiado
     */
    drawSawMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const width = 12 * s;
        const teeth = 5;
        const toothH = 4 * s * (0.5 + curve * 0.5) * reaction.intensity;
        
        let lastX = cx - width / 2;
        let lastY = cy;
        
        for (let i = 0; i <= teeth; i++) {
            const x = cx - width / 2 + (width / teeth) * i;
            const y = cy + (i % 2 === 0 ? 0 : toothH);
            
            renderer.drawLine(lastX, lastY, x, y, mouthCol);
            lastX = x;
            lastY = y;
        }
        
        // Linha de base quando triste
        if (curve < 0) {
            renderer.drawLine(cx - width / 2, cy + toothH, cx + width / 2, cy + toothH, mouthCol);
        }
    }
    
    /**
     * Boca Coringa - Sorriso maníaco
     */
    drawJokerMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const width = 14 * s * reaction.intensity;
        const height = 8 * s * Math.abs(curve);
        const dir = curve >= 0 ? 1 : -1;
        
        // Curva principal bem exagerada
        const segments = 15;
        let lastX = cx - width / 2;
        let lastY = cy - height * 0.3 * dir;
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = cx - width / 2 + width * t;
            // Curva exagerada que sobe além do rosto
            const curveVal = Math.sin(t * Math.PI) * height * dir;
            const y = cy + curveVal;
            
            renderer.drawLine(lastX, lastY, x, y, mouthCol);
            lastX = x;
            lastY = y;
        }
        
        // Cantos levantados (estilo Coringa)
        if (curve > 0.3) {
            renderer.drawLine(cx - width / 2, cy - height * 0.3, cx - width / 2 - 3 * s, cy - height * 0.6, mouthCol);
            renderer.drawLine(cx + width / 2, cy - height * 0.3, cx + width / 2 + 3 * s, cy - height * 0.6, mouthCol);
        }
    }
    
    /**
     * Boca Presas - Vampiro
     */
    drawFangsMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        // Escala das presas diminui quando triste
        const fangScale = curve > 0 ? 1 : 0.6;
        const fangH = 5 * s * fangScale * reaction.intensity;
        const mouthW = 8 * s;
        
        // Linha da boca
        const curveH = curve * 3 * s;
        renderer.drawLine(cx - mouthW / 2, cy, cx, cy + curveH, mouthCol);
        renderer.drawLine(cx, cy + curveH, cx + mouthW / 2, cy, mouthCol);
        
        // Presas
        const fangX = 3 * s;
        // Presa esquerda
        renderer.drawLine(cx - fangX, cy, cx - fangX - 1, cy + fangH, mouthCol);
        renderer.drawLine(cx - fangX - 1, cy + fangH, cx - fangX + 1, cy + fangH * 0.8, mouthCol);
        renderer.drawLine(cx - fangX + 1, cy + fangH * 0.8, cx - fangX, cy, mouthCol);
        
        // Presa direita
        renderer.drawLine(cx + fangX, cy, cx + fangX + 1, cy + fangH, mouthCol);
        renderer.drawLine(cx + fangX + 1, cy + fangH, cx + fangX - 1, cy + fangH * 0.8, mouthCol);
        renderer.drawLine(cx + fangX - 1, cy + fangH * 0.8, cx + fangX, cy, mouthCol);
    }
    
    /**
     * Boca Pulso - Linha de áudio
     */
    drawPulseMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const width = 16 * s;
        const { r, g, b } = renderer.hexToRgb(mouthCol);
        
        // Gera forma de onda baseada no tempo e reação
        const time = Date.now() * 0.01 * reaction.speed;
        const amplitude = 4 * s * reaction.intensity * (0.5 + curve * 0.5);
        
        let lastX = cx - width / 2;
        let lastY = cy;
        
        for (let i = 1; i <= 20; i++) {
            const t = i / 20;
            const x = cx - width / 2 + width * t;
            
            // Forma de onda composta
            const wave1 = Math.sin(t * Math.PI * 4 + time) * amplitude;
            const wave2 = Math.sin(t * Math.PI * 8 + time * 1.5) * amplitude * 0.3;
            const y = cy + wave1 + wave2;
            
            const alpha = Math.floor(180 + 75 * Math.sin(t * Math.PI));
            this.drawLineRgba(renderer, lastX, lastY, x, y, r, g, b, alpha);
            
            lastX = x;
            lastY = y;
        }
    }
    
    /**
     * Boca Zíper - Costurada
     */
    drawZipperMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const width = 10 * s;
        const stitches = 6;
        const stitchH = 3 * s;
        
        // Linha principal
        renderer.drawLine(cx - width / 2, cy, cx + width / 2, cy, mouthCol);
        
        // Costuras verticais
        for (let i = 0; i <= stitches; i++) {
            const x = cx - width / 2 + (width / stitches) * i;
            renderer.drawLine(x, cy - stitchH / 2, x, cy + stitchH / 2, mouthCol);
        }
        
        // Quando feliz, abre um pouco
        if (curve > 0.3) {
            const openAmount = curve * 3 * s;
            renderer.drawLine(cx - width / 4, cy + stitchH / 2, cx + width / 4, cy + stitchH / 2 + openAmount, mouthCol);
        }
    }
    
    /**
     * Boca Bolha - Soprando/O
     */
    drawBubbleMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const radius = (3 + curve * 2) * s * reaction.intensity;
        
        // Boca em O
        renderer.drawCircle(cx, cy, radius, mouthCol);
        renderer.fillCircle(cx, cy, radius - 1, '#000000');
        
        // Bolhas quando feliz
        if (curve > 0.2) {
            const time = Date.now() * 0.003;
            for (let i = 0; i < 3; i++) {
                const bubbleY = cy - (time * 10 + i * 15) % 30;
                const bubbleX = cx + Math.sin(time + i) * 5 * s;
                const bubbleR = (1 + i * 0.5) * s;
                
                if (bubbleY > cy - 25 * s) {
                    renderer.drawCircle(bubbleX, bubbleY, bubbleR, mouthCol);
                }
            }
        }
    }
    
    /**
     * Boca UwU - Super fofa
     */
    drawUwuMouth(renderer, cx, cy, s, curve, mouthCol) {
        const width = 6 * s;
        
        if (curve > 0) {
            // UwU feliz - formato de "w" pequeno e fofo
            const h = 2 * s * curve;
            renderer.drawLine(cx - width / 2, cy, cx - width / 4, cy + h, mouthCol);
            renderer.drawLine(cx - width / 4, cy + h, cx, cy, mouthCol);
            renderer.drawLine(cx, cy, cx + width / 4, cy + h, mouthCol);
            renderer.drawLine(cx + width / 4, cy + h, cx + width / 2, cy, mouthCol);
        } else {
            // Triste - linha ondulada
            const segments = 8;
            let lastX = cx - width / 2;
            let lastY = cy;
            
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = cx - width / 2 + width * t;
                const y = cy + Math.sin(t * Math.PI * 2) * s * 0.5 - curve * 2 * s;
                renderer.drawLine(lastX, lastY, x, y, mouthCol);
                lastX = x;
                lastY = y;
            }
        }
    }
    
    /**
     * Boca Robô - Segmentada digital
     */
    drawRobotMouth(renderer, cx, cy, s, curve, mouthCol, reaction) {
        const width = 12 * s;
        const height = 4 * s;
        const segments = 5;
        const segmentW = width / segments;
        
        const { r, g, b } = renderer.hexToRgb(mouthCol);
        
        // Cada segmento acende baseado no mood
        const activeSegments = Math.floor((curve + 1) / 2 * segments) + 1;
        const time = Date.now() * 0.01 * reaction.speed;
        
        for (let i = 0; i < segments; i++) {
            const x = cx - width / 2 + segmentW * i + segmentW * 0.1;
            const segW = segmentW * 0.8;
            
            // Determina brilho do segmento
            let brightness = 0.3;
            if (i < activeSegments) {
                brightness = 0.7 + Math.sin(time + i * 0.5) * 0.3;
            }
            
            const alpha = Math.floor(255 * brightness * reaction.intensity);
            
            // Desenha segmento
            for (let py = 0; py < height; py++) {
                for (let px = 0; px < segW; px++) {
                    renderer.setPixelBlend(x + px, cy - height / 2 + py, r, g, b, alpha);
                }
            }
        }
        
        // Contorno
        renderer.drawRect(cx - width / 2, cy - height / 2, width, height, mouthCol);
    }
    
    drawBrows(renderer, cx, cy, s) {
        const browY = cy - 14 * s;
        const browAngle = this.faceParams.browAngle;
        const spacing = 10 * s;
        const browLen = 6 * s;
        // Cor da sobrancelha: sempre igual à cor do contorno se definida,
        // senão usa `primaryColor` (cor de glow/material)
        const browColor = this.borderColor || this.primaryColor;

        // Sobrancelha esquerda
        const leftStartY = browY - browAngle * 3 * s;
        const leftEndY = browY + browAngle * 3 * s;
        renderer.drawLine(
            cx - spacing - browLen / 2, leftStartY,
            cx - spacing + browLen / 2, leftEndY,
            browColor
        );

        // Sobrancelha direita (espelhada)
        const rightStartY = browY + browAngle * 3 * s;
        const rightEndY = browY - browAngle * 3 * s;
        renderer.drawLine(
            cx + spacing - browLen / 2, rightStartY,
            cx + spacing + browLen / 2, rightEndY,
            browColor
        );
    }
    
    drawBlush(renderer, cx, cy, s) {
        // Bochechas rosadas quando feliz
        const blushY = cy + 2 * s;
        const blushSpacing = 14 * s;
        const { r, g, b } = renderer.hexToRgb('#ff6b6b');
        
        // Elipses semi-transparentes
        for (let y = -2; y <= 2; y++) {
            for (let x = -4; x <= 4; x++) {
                const dist = Math.sqrt(x * x / 16 + y * y / 4);
                if (dist <= 1) {
                    const alpha = Math.round(40 * (1 - dist));
                    renderer.setPixelBlend(cx - blushSpacing + x * s, blushY + y * s, r, g, b, alpha);
                    renderer.setPixelBlend(cx + blushSpacing + x * s, blushY + y * s, r, g, b, alpha);
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERAÇÕES DO TAMAGOTCHI
    // ═══════════════════════════════════════════════════════════════════
    
    feed(amount = 25) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.happiness = Math.min(100, this.happiness + 5);
        
        // Feedback visual
        this.expressionState.action = 'eating';
        this.expressionState.actionTimer = Date.now() + 1500;
        
        // Cooldown para não decair imediatamente
        this.feedCooldown = 2000;
        
        // Squash de alegria
        this.squash(1.2, 0.8);
    }
    
    pet() {
        this.happiness = Math.min(100, this.happiness + 10);
        this.isBeingPetted = true;
        this.lastPetTime = Date.now();
        
        this.expressionState.action = 'love';
        this.expressionState.actionTimer = Date.now() + 1000;
        
        this.squash(0.9, 1.1);
        
        setTimeout(() => {
            this.isBeingPetted = false;
        }, 500);
    }
    
    play() {
        this.happiness = Math.min(100, this.happiness + 15);
        this.energy = Math.max(0, this.energy - 10);
        
        this.expressionState.action = 'happy';
        this.expressionState.actionTimer = Date.now() + 2000;
    }
    
    sleep() {
        this.energy = Math.min(100, this.energy + 30);
        this.expressionState.action = null;
        this.expressionState.mood = 'neutral';
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // NOVAS INTERAÇÕES
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Aplica choque elétrico no pet
     * Reduz felicidade e energia, expressão de dor/choque
     */
    shock() {
        this.happiness = Math.max(0, this.happiness - 20);
        this.energy = Math.max(0, this.energy - 15);
        
        this.expressionState.action = 'shocked';
        this.expressionState.actionTimer = Date.now() + 2000;
        
        // Squash de choque
        this.squash(1.3, 0.7);
        
        // Faz tremer
        this.faceTargets.tremor = 1;
        
        return 'shocked';
    }
    
    /**
     * Congela o pet
     * Reduz energia drasticamente, pet fica parado tremendo
     */
    freeze() {
        this.energy = Math.max(0, this.energy - 25);
        this.happiness = Math.max(0, this.happiness - 10);
        
        this.expressionState.action = 'frozen';
        this.expressionState.actionTimer = Date.now() + 4000;
        
        // Face de frio
        this.faceTargets.tremor = 0.8;
        
        // Squash de encolher de frio
        this.squash(0.9, 0.9);
        
        return 'frozen';
    }
    
    /**
     * Muta o pet para outra forma geométrica
     * Retorna a forma original após um tempo
     * @param {string} newShape - Nova forma (ou null para aleatório)
     * @param {number} duration - Duração da mutação em ms
     */
    mutate(newShape = null, duration = 3000) {
        this.originalShapeId = this.originalShapeId || this.shapeId;
        
        // Se não especificou, escolhe aleatoriamente
        const shapes = ['triangulo', 'quadrado', 'hexagono', 'losango', 'estrela', 'circulo'];
        const availableShapes = shapes.filter(s => s !== this.shapeId);
        const targetShape = newShape || availableShapes[Math.floor(Math.random() * availableShapes.length)];
        
        this.shapeId = targetShape;
        
        this.happiness = Math.max(0, this.happiness - 15);
        
        this.expressionState.action = 'mutating';
        this.expressionState.actionTimer = Date.now() + duration;
        
        // Squash de transformação
        this.squash(0.5, 1.5);
        
        // Agenda reversão
        this.mutationTimeout = setTimeout(() => {
            this.revertMutation();
        }, duration);
        
        return { original: this.originalShapeId, mutated: targetShape };
    }
    
    /**
     * Reverte a mutação para forma original
     */
    revertMutation() {
        if (this.originalShapeId) {
            this.shapeId = this.originalShapeId;
            this.originalShapeId = null;
            
            this.expressionState.action = 'surprised';
            this.expressionState.actionTimer = Date.now() + 1000;
            
            this.squash(1.2, 0.8);
        }
        
        if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
            this.mutationTimeout = null;
        }
    }
    
    /**
     * Faz cócegas no pet
     * Aumenta felicidade, pet ri e se mexe muito
     */
    tickle() {
        this.happiness = Math.min(100, this.happiness + 15);
        this.energy = Math.max(0, this.energy - 5); // Cansa um pouco
        
        this.expressionState.action = 'tickled';
        this.expressionState.actionTimer = Date.now() + 2000;
        
        // Squash de risada
        this.squash(1.15, 0.85);
        
        // Movimentos aleatórios de risada
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        
        return 'tickled';
    }
    
    /**
     * Cura/restaura o pet
     * Aumenta todos os stats
     */
    heal(amount = 30) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.happiness = Math.min(100, this.happiness + amount * 0.5);
        this.energy = Math.min(100, this.energy + amount);
        
        this.expressionState.action = 'love';
        this.expressionState.actionTimer = Date.now() + 1500;
        
        // Squash de alegria
        this.squash(0.85, 1.15);
        
        return 'healed';
    }
    
    squash(sx, sy) {
        this.squashX = sx;
        this.squashY = sy;
    }
    
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    lookAt(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Limita o quanto os olhos podem se mover
        const maxMove = 3;
        this.faceParams.focusOffset.x = (dx / dist) * Math.min(maxMove, dist / 30);
        this.faceParams.focusOffset.y = (dy / dist) * Math.min(maxMove, dist / 30);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // GESTOS MOBILE
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Verifica se um ponto está dentro do pet (hit test)
     */
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const radius = this.size * this.scale;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    /**
     * Aplica rotação por gesto de arrastar
     * @param {number} deltaAngle - Mudança de ângulo em radianos
     */
    applyRotation(deltaAngle) {
        this.rotation += deltaAngle;
        
        // Normaliza para 0-2PI
        while (this.rotation < 0) this.rotation += Math.PI * 2;
        while (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
    }
    
    /**
     * Calcula ângulo de rotação baseado em posição de arrasto
     */
    getRotationFromDrag(startX, startY, currentX, currentY) {
        const startAngle = Math.atan2(startY - this.y, startX - this.x);
        const currentAngle = Math.atan2(currentY - this.y, currentX - this.x);
        return currentAngle - startAngle;
    }
    
    /**
     * Petting por scrubbing (movimento rápido repetido)
     * @param {number} intensity - Intensidade do scrub (0-1)
     */
    onScrub(intensity) {
        // Quanto maior a intensidade, mais feliz
        const happinessGain = Math.floor(5 + intensity * 15);
        this.happiness = Math.min(100, this.happiness + happinessGain);
        
        this.isBeingPetted = true;
        this.lastPetTime = Date.now();
        
        // Expressão de alegria
        this.expressionState.action = 'love';
        this.expressionState.actionTimer = Date.now() + 500;
        
        // Squash proporcional à intensidade
        const squashAmount = 0.85 + intensity * 0.1;
        this.squash(squashAmount, 2 - squashAmount);
        
        // Reset após um tempo
        setTimeout(() => {
            this.isBeingPetted = false;
        }, 300);
    }
    
    /**
     * Reação a tap/toque único
     */
    onTap() {
        // Pequena reação de atenção
        this.faceTargets.eyeOpenness = 1.3;
        this.squash(0.95, 1.05);
        
        // Vira para "olhar" o toque
        this.expressionState.action = 'alert';
        this.expressionState.actionTimer = Date.now() + 500;
    }
    
    /**
     * Reação a double tap
     */
    onDoubleTap() {
        // Pulo de alegria
        this.squash(0.7, 1.4);
        this.vy = -3;
        
        this.happiness = Math.min(100, this.happiness + 5);
        this.expressionState.action = 'happy';
        this.expressionState.actionTimer = Date.now() + 800;
    }
    
    /**
     * Reação a long press
     */
    onLongPress() {
        // Pet fica sonolento/relaxado
        this.faceTargets.eyeOpenness = 0.5;
        this.expressionState.mood = 'neutral';
        this.squash(1.1, 0.9);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SERIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════
    
    toJSON() {
        return {
            shapeId: this.shapeId,
            eyeType: this.eyeType,
            mouthType: this.mouthType,
            materialId: this.materialId,
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            eyeColor: this.eyeColor,
            mouthColor: this.mouthColor,
            borderColor: this.borderColor,
            hunger: this.hunger,
            happiness: this.happiness,
            energy: this.energy,
            // Sistema de Maturação
            age: this.age,
            ageAccumulator: this.ageAccumulator,
            hasReachedAdulthood: this.hasReachedAdulthood,
            // Sistema de Personalidade
            personality: this.personality
        };
    }
    
    static fromJSON(data) {
        return new GeoPet(data);
    }
}
