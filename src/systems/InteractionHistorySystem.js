// ═══════════════════════════════════════════════════════════════════
// INTERACTION HISTORY SYSTEM - Histórico de Ações do Jogador
// Armazena localmente para futura integração com LLM
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'geolife_interaction_history';

/**
 * Tipos de interação disponíveis
 */
export const INTERACTION_TYPES = {
    FEED: 'feed',
    SHOCK: 'shock',
    FREEZE: 'freeze',
    MUTATE: 'mutate',
    PET: 'pet',
    PLAY: 'play',
    HEAL: 'heal',
    TICKLE: 'tickle'
};

/**
 * Sentimentos associados a cada interação (para análise de personalidade)
 */
export const INTERACTION_SENTIMENT = {
    [INTERACTION_TYPES.FEED]: { positive: true, care: 1, harm: 0 },
    [INTERACTION_TYPES.SHOCK]: { positive: false, care: 0, harm: 0.7 },
    [INTERACTION_TYPES.FREEZE]: { positive: false, care: 0, harm: 0.5 },
    [INTERACTION_TYPES.MUTATE]: { positive: false, care: 0, harm: 0.3 },
    [INTERACTION_TYPES.PET]: { positive: true, care: 1, harm: 0 },
    [INTERACTION_TYPES.PLAY]: { positive: true, care: 0.8, harm: 0 },
    [INTERACTION_TYPES.HEAL]: { positive: true, care: 1, harm: 0 },
    [INTERACTION_TYPES.TICKLE]: { positive: true, care: 0.5, harm: 0 }
};

class InteractionHistorySystemClass {
    constructor() {
        this.history = [];
        this.stats = {
            totalInteractions: 0,
            positiveCount: 0,
            negativeCount: 0,
            careScore: 0,
            harmScore: 0,
            lastInteraction: null,
            interactionCounts: {}
        };
        
        // Inicializa contadores
        Object.values(INTERACTION_TYPES).forEach(type => {
            this.stats.interactionCounts[type] = 0;
        });
        
        this.maxHistorySize = 1000; // Limita histórico
        this.load();
    }
    
    /**
     * Registra uma nova interação
     * @param {string} type - Tipo da interação (INTERACTION_TYPES)
     * @param {Object} context - Contexto adicional (mood do pet, stats, etc)
     */
    record(type, context = {}) {
        const timestamp = Date.now();
        const sentiment = INTERACTION_SENTIMENT[type] || { positive: false, care: 0, harm: 0 };
        
        const entry = {
            type,
            timestamp,
            date: new Date(timestamp).toISOString(),
            context: {
                petMood: context.mood || 'neutral',
                petHunger: context.hunger || 0,
                petHappiness: context.happiness || 0,
                petEnergy: context.energy || 0,
                ...context
            },
            sentiment
        };
        
        // Adiciona ao histórico
        this.history.push(entry);
        
        // Limita tamanho do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
        
        // Atualiza estatísticas
        this.updateStats(entry);
        
        // Salva no localStorage
        this.save();
        
        console.log(`[InteractionHistory] Registrado: ${type}`, entry);
        
        return entry;
    }
    
    /**
     * Atualiza estatísticas baseadas na nova entrada
     */
    updateStats(entry) {
        this.stats.totalInteractions++;
        this.stats.lastInteraction = entry.timestamp;
        
        if (entry.sentiment.positive) {
            this.stats.positiveCount++;
        } else {
            this.stats.negativeCount++;
        }
        
        this.stats.careScore += entry.sentiment.care;
        this.stats.harmScore += entry.sentiment.harm;
        
        if (this.stats.interactionCounts[entry.type] !== undefined) {
            this.stats.interactionCounts[entry.type]++;
        }
    }
    
    /**
     * Retorna análise de personalidade do jogador baseada no histórico
     */
    getPlayerProfile() {
        const total = this.stats.totalInteractions || 1;
        
        return {
            // Ratio de ações positivas vs negativas
            kindnessRatio: this.stats.positiveCount / total,
            
            // Score normalizado de cuidado (0-1)
            careLevel: Math.min(1, this.stats.careScore / total),
            
            // Score normalizado de dano (0-1) 
            harmLevel: Math.min(1, this.stats.harmScore / total),
            
            // Tipo de jogador dominante
            dominantBehavior: this.getDominantBehavior(),
            
            // Ações mais frequentes
            favoriteActions: this.getFavoriteActions(),
            
            // Tendência recente (últimas 20 ações)
            recentTendency: this.getRecentTendency()
        };
    }
    
    getDominantBehavior() {
        const ratio = this.stats.positiveCount / (this.stats.totalInteractions || 1);
        
        if (ratio >= 0.8) return 'caretaker'; // Muito cuidadoso
        if (ratio >= 0.6) return 'balanced'; // Equilibrado
        if (ratio >= 0.4) return 'curious'; // Curioso (testa tudo)
        if (ratio >= 0.2) return 'mischievous'; // Travesso
        return 'chaotic'; // Caótico
    }
    
    getFavoriteActions() {
        const counts = this.stats.interactionCounts;
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));
    }
    
    getRecentTendency() {
        const recent = this.history.slice(-20);
        if (recent.length === 0) return 'neutral';
        
        const positiveRecent = recent.filter(e => e.sentiment.positive).length;
        const ratio = positiveRecent / recent.length;
        
        if (ratio >= 0.7) return 'caring';
        if (ratio >= 0.4) return 'mixed';
        return 'aggressive';
    }
    
    /**
     * Retorna histórico para contexto da LLM
     * @param {number} limit - Número máximo de entradas
     */
    getContextForLLM(limit = 50) {
        const recent = this.history.slice(-limit);
        const profile = this.getPlayerProfile();
        
        return {
            profile,
            recentActions: recent.map(e => ({
                action: e.type,
                when: e.date,
                petState: e.context.petMood
            })),
            summary: this.generateSummary()
        };
    }
    
    generateSummary() {
        const profile = this.getPlayerProfile();
        const counts = this.stats.interactionCounts;
        
        let summary = `Jogador interagiu ${this.stats.totalInteractions} vezes. `;
        
        // Menciona ações positivas
        const positiveActions = [counts.feed, counts.pet, counts.play, counts.heal].reduce((a, b) => a + b, 0);
        const negativeActions = [counts.shock, counts.freeze, counts.mutate].reduce((a, b) => a + b, 0);
        
        if (positiveActions > negativeActions * 2) {
            summary += 'É um dono muito carinhoso. ';
        } else if (negativeActions > positiveActions) {
            summary += 'Gosta de testar os limites do pet. ';
        } else {
            summary += 'Tem comportamento equilibrado. ';
        }
        
        // Menciona ação favorita
        const favorite = this.getFavoriteActions()[0];
        if (favorite) {
            const actionNames = {
                feed: 'alimentar',
                shock: 'dar choque',
                freeze: 'congelar',
                mutate: 'mutar',
                pet: 'fazer carinho',
                play: 'brincar',
                tickle: 'fazer cócegas'
            };
            summary += `Ação favorita: ${actionNames[favorite.type] || favorite.type}.`;
        }
        
        return summary;
    }
    
    /**
     * Salva no localStorage
     */
    save() {
        try {
            const data = {
                history: this.history,
                stats: this.stats,
                version: 1
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[InteractionHistory] Erro ao salvar:', e);
        }
    }
    
    /**
     * Carrega do localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.history = data.history || [];
                this.stats = { ...this.stats, ...data.stats };
                console.log('[InteractionHistory] Carregado:', this.stats.totalInteractions, 'interações');
            }
        } catch (e) {
            console.warn('[InteractionHistory] Erro ao carregar:', e);
        }
    }
    
    /**
     * Limpa todo o histórico
     */
    clear() {
        this.history = [];
        this.stats = {
            totalInteractions: 0,
            positiveCount: 0,
            negativeCount: 0,
            careScore: 0,
            harmScore: 0,
            lastInteraction: null,
            interactionCounts: {}
        };
        Object.values(INTERACTION_TYPES).forEach(type => {
            this.stats.interactionCounts[type] = 0;
        });
        localStorage.removeItem(STORAGE_KEY);
        console.log('[InteractionHistory] Histórico limpo');
    }
}

// Singleton export
export const InteractionHistorySystem = new InteractionHistorySystemClass();
export default InteractionHistorySystem;
