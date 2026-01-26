// ═══════════════════════════════════════════════════════════════════
// PET VOICE SYSTEM - Voz Procedural do GeoPet
// Gera vocalizações únicas baseadas na forma e emoção do pet
// Inspirado em: Animal Crossing, Undertale, Okami
// ═══════════════════════════════════════════════════════════════════

class PetVoiceSystemClass {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.4;
        
        // Cooldown para não spammar falas
        this.lastSpeakTime = 0;
        this.speakCooldown = 800;
        
        // Perfis de voz por forma
        this.voiceProfiles = {
            circulo: { 
                baseFreq: 280, 
                freqRange: 120, 
                waveform: 'sine',
                speed: 1.0,
                wobble: 0.15 
            },
            quadrado: { 
                baseFreq: 220, 
                freqRange: 80, 
                waveform: 'square',
                speed: 0.9,
                wobble: 0.05 
            },
            triangulo: { 
                baseFreq: 350, 
                freqRange: 150, 
                waveform: 'sawtooth',
                speed: 1.2,
                wobble: 0.1 
            },
            hexagono: { 
                baseFreq: 260, 
                freqRange: 100, 
                waveform: 'triangle',
                speed: 1.0,
                wobble: 0.12 
            },
            losango: { 
                baseFreq: 300, 
                freqRange: 130, 
                waveform: 'sine',
                speed: 1.1,
                wobble: 0.2 
            },
            estrela: { 
                baseFreq: 400, 
                freqRange: 180, 
                waveform: 'sine',
                speed: 1.3,
                wobble: 0.25 
            }
        };
        
        // Modificadores por emoção
        this.emotionModifiers = {
            happy: { freqMult: 1.2, speedMult: 1.2, volume: 1.0 },
            neutral: { freqMult: 1.0, speedMult: 1.0, volume: 0.8 },
            sad: { freqMult: 0.8, speedMult: 0.7, volume: 0.6 },
            dying: { freqMult: 0.6, speedMult: 0.5, volume: 0.4 },
            eating: { freqMult: 1.1, speedMult: 1.4, volume: 0.9 },
            love: { freqMult: 1.3, speedMult: 1.1, volume: 1.0 },
            surprised: { freqMult: 1.5, speedMult: 1.5, volume: 1.0 }
        };
    }
    
    /**
     * Inicializa o AudioContext
     */
    init() {
        if (this.audioContext) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('[PetVoiceSystem] ✓ Inicializado');
        } catch (e) {
            console.warn('[PetVoiceSystem] Web Audio não disponível:', e);
            this.enabled = false;
        }
    }
    
    /**
     * Garante contexto ativo
     */
    ensureContext() {
        if (!this.audioContext) this.init();
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext && this.enabled;
    }
    
    /**
     * Define volume
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
    
    /**
     * Gera uma sílaba procedural
     * @param {number} freq - Frequência base
     * @param {string} waveform - Tipo de onda
     * @param {number} duration - Duração em segundos
     * @param {number} startTime - Tempo de início
     * @param {number} volume - Volume (0-1)
     * @param {number} wobble - Intensidade de vibrato
     */
    _generateSyllable(freq, waveform, duration, startTime, volume, wobble) {
        const ctx = this.audioContext;
        
        // Oscilador principal
        const osc = ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Vibrato (LFO para modulação de frequência)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 6 + Math.random() * 4; // 6-10 Hz
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = freq * wobble;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        // Pitch slide (dá naturalidade)
        const pitchVariation = (Math.random() - 0.5) * 0.3;
        osc.frequency.exponentialRampToValueAtTime(
            freq * (1 + pitchVariation), 
            startTime + duration * 0.8
        );
        
        // Envelope ADSR simplificado
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(volume, startTime + 0.015); // Attack
        envelope.gain.setValueAtTime(volume * 0.8, startTime + duration * 0.3); // Decay
        envelope.gain.linearRampToValueAtTime(volume * 0.6, startTime + duration * 0.7); // Sustain
        envelope.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release
        
        // Filtro formante (simula vogais)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.random() * 1200; // Formante variável
        filter.Q.value = 2 + Math.random() * 3;
        
        // Conexões
        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.masterGain);
        
        // Play
        osc.start(startTime);
        lfo.start(startTime);
        osc.stop(startTime + duration + 0.01);
        lfo.stop(startTime + duration + 0.01);
    }
    
    /**
     * Faz o pet "falar" uma frase
     * @param {string} text - Texto a ser "falado" (define ritmo/duração)
     * @param {string} shapeId - Forma do pet (define timbre)
     * @param {string} emotion - Emoção atual (modifica tom)
     */
    speak(text, shapeId = 'circulo', emotion = 'neutral') {
        if (!this.ensureContext()) return;
        
        // Cooldown
        const now = performance.now();
        if (now - this.lastSpeakTime < this.speakCooldown) return;
        this.lastSpeakTime = now;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // Obtém perfil de voz
        const profile = this.voiceProfiles[shapeId] || this.voiceProfiles.circulo;
        const emotionMod = this.emotionModifiers[emotion] || this.emotionModifiers.neutral;
        
        // Calcula parâmetros finais
        const baseFreq = profile.baseFreq * emotionMod.freqMult;
        const freqRange = profile.freqRange;
        const speed = profile.speed * emotionMod.speedMult;
        const vol = 0.15 * emotionMod.volume;
        
        // Gera sílabas baseadas no texto
        // Cada palavra vira ~2-4 sílabas
        const words = text.split(' ');
        let currentTime = t;
        
        words.forEach((word, wordIndex) => {
            // Número de sílabas proporcional ao tamanho da palavra
            const syllableCount = Math.min(4, Math.max(1, Math.ceil(word.length / 3)));
            
            for (let i = 0; i < syllableCount; i++) {
                // Variação de frequência por sílaba
                const freqVariation = (Math.random() - 0.5) * freqRange;
                const syllableFreq = baseFreq + freqVariation;
                
                // Duração variável (mais curta no meio das palavras)
                const baseDuration = 0.08 / speed;
                const durationVariation = (Math.random() * 0.04) / speed;
                const duration = baseDuration + durationVariation;
                
                // Gera a sílaba
                this._generateSyllable(
                    syllableFreq,
                    profile.waveform,
                    duration,
                    currentTime,
                    vol * (1 - i * 0.1), // Sílabas posteriores mais suaves
                    profile.wobble
                );
                
                currentTime += duration + 0.02 / speed; // Gap entre sílabas
            }
            
            // Pausa maior entre palavras
            currentTime += 0.05 / speed;
        });
    }
    
    /**
     * Emite um som curto de reação
     * @param {string} type - Tipo: 'happy', 'sad', 'surprise', 'eat', 'love'
     * @param {string} shapeId - Forma do pet
     */
    emote(type, shapeId = 'circulo') {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const profile = this.voiceProfiles[shapeId] || this.voiceProfiles.circulo;
        const baseFreq = profile.baseFreq;
        
        switch (type) {
            case 'happy':
                // "Pi-pi!" ascendente
                this._generateSyllable(baseFreq * 1.2, profile.waveform, 0.08, t, 0.12, 0.1);
                this._generateSyllable(baseFreq * 1.5, profile.waveform, 0.1, t + 0.12, 0.15, 0.15);
                break;
                
            case 'sad':
                // "Aww..." descendente
                this._generateSyllable(baseFreq * 0.9, profile.waveform, 0.15, t, 0.08, 0.05);
                this._generateSyllable(baseFreq * 0.6, profile.waveform, 0.2, t + 0.18, 0.06, 0.08);
                break;
                
            case 'surprise':
                // "Oh!" agudo
                this._generateSyllable(baseFreq * 1.8, profile.waveform, 0.06, t, 0.15, 0.2);
                break;
                
            case 'eat':
                // "Nom nom nom"
                for (let i = 0; i < 3; i++) {
                    this._generateSyllable(
                        baseFreq * (0.9 + Math.random() * 0.2), 
                        profile.waveform, 
                        0.06, 
                        t + i * 0.1, 
                        0.1, 
                        0.05
                    );
                }
                break;
                
            case 'love':
                // "Oooh~" com vibrato
                this._generateSyllable(baseFreq * 1.3, 'sine', 0.25, t, 0.12, 0.3);
                break;
                
            case 'sleep':
                // "Zzz..." suave
                this._generateSyllable(baseFreq * 0.5, 'sine', 0.3, t, 0.04, 0.02);
                this._generateSyllable(baseFreq * 0.4, 'sine', 0.4, t + 0.5, 0.03, 0.02);
                break;
                
            default:
                // Som genérico
                this._generateSyllable(baseFreq, profile.waveform, 0.1, t, 0.1, profile.wobble);
        }
    }
    
    /**
     * Som de nascimento/criação do pet
     */
    playBirth(shapeId = 'circulo') {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const profile = this.voiceProfiles[shapeId] || this.voiceProfiles.circulo;
        const baseFreq = profile.baseFreq;
        
        // Sequência ascendente "da-da-DA!"
        const notes = [0.7, 0.85, 1.0, 1.3];
        notes.forEach((mult, i) => {
            this._generateSyllable(
                baseFreq * mult,
                profile.waveform,
                0.1 + i * 0.02,
                t + i * 0.12,
                0.08 + i * 0.03,
                profile.wobble
            );
        });
    }
    
    /**
     * Som de digitação - um "blip" curto por letra
     * Simula o pet "falando" cada letra
     * @param {string} shapeId - Forma do pet
     * @param {string} letter - Letra sendo digitada
     */
    playTypeLetter(shapeId = 'circulo', letter = '') {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const profile = this.voiceProfiles[shapeId] || this.voiceProfiles.circulo;
        
        // Frequência varia um pouco baseada na letra (dá variação natural)
        const charCode = letter.charCodeAt(0) || 65;
        const freqVariation = ((charCode % 20) - 10) * 8;
        const freq = profile.baseFreq * 1.2 + freqVariation;
        
        // Oscilador muito curto
        const osc = ctx.createOscillator();
        osc.type = profile.waveform;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.03);
        
        // Envelope ultra-curto
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        // Filtro para suavizar
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.05);
    }
}

// Singleton export
export const PetVoiceSystem = new PetVoiceSystemClass();
export default PetVoiceSystem;