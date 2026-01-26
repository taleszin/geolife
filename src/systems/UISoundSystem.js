// ═══════════════════════════════════════════════════════════════════
// UI SOUND SYSTEM - Sons de Interface Procedurais
// Web Audio API - Estilo Retro/Sci-Fi
// ═══════════════════════════════════════════════════════════════════

class UISoundSystemClass {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.5;
        
        // Cooldown para evitar spam
        this.lastHoverTime = 0;
        this.hoverCooldown = 50;
    }
    
    /**
     * Inicializa o AudioContext (após interação do usuário)
     */
    init() {
        if (this.audioContext) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('[UISoundSystem] ✓ Inicializado');
        } catch (e) {
            console.warn('[UISoundSystem] Web Audio não disponível:', e);
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
     * Define volume master
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // SONS DE INTERFACE
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Som de HOVER - Bip digital sutil
     */
    playHover() {
        if (!this.ensureContext()) return;
        
        const now = performance.now();
        if (now - this.lastHoverTime < this.hoverCooldown) return;
        this.lastHoverTime = now;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // Sine suave com sweep
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.06);
    }
    
    /**
     * Som de CLICK - Confirmação percussiva
     */
    playClick(type = 'confirm') {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const configs = {
            confirm: { freq: 480, end: 300, dur: 0.08, vol: 0.12 },
            cancel: { freq: 300, end: 180, dur: 0.1, vol: 0.10 },
            special: { freq: 600, end: 400, dur: 0.12, vol: 0.15 }
        };
        
        const cfg = configs[type] || configs.confirm;
        
        // Onda square percussiva
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(cfg.freq, t);
        osc.frequency.exponentialRampToValueAtTime(cfg.end, t + cfg.dur * 0.7);
        
        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(cfg.vol, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur);
        
        // Transiente de punch
        const noise = ctx.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(cfg.freq * 1.5, t);
        noise.frequency.exponentialRampToValueAtTime(50, t + 0.02);
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(cfg.vol * 0.25, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        
        // Filtro lowpass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(500, t + cfg.dur);
        
        osc.connect(filter);
        filter.connect(gain);
        noise.connect(noiseGain);
        gain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);
        
        osc.start(t);
        noise.start(t);
        osc.stop(t + cfg.dur + 0.01);
        noise.stop(t + 0.03);
    }
    
    /**
     * Som de SELECT - Dois tons confirmação
     */
    playSelect() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // Tom 1 (C5)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 523;
        
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.10, t + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        
        // Tom 2 (E5)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 659;
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, t + 0.04);
        gain2.gain.linearRampToValueAtTime(0.10, t + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc1.start(t);
        osc2.start(t + 0.04);
        osc1.stop(t + 0.08);
        osc2.stop(t + 0.15);
    }
    
    /**
     * Som de OPEN - Abertura de painel
     */
    playOpen() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.12);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.2);
    }
    
    /**
     * Som de CLOSE - Fechamento
     */
    playClose() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.15);
    }
    
    /**
     * Som de ERROR
     */
    playError() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // Dois tons dissonantes
        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 200;
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 283; // Tritone
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
        gain.gain.setValueAtTime(0.06, t + 0.05);
        gain.gain.linearRampToValueAtTime(0, t + 0.06);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.18);
        osc2.stop(t + 0.18);
    }
    
    /**
     * Som de FEED - Alimentar pet
     */
    playFeed() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // "Nhom nhom" - sequência de 3 tons
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 300 + i * 50;
            
            const gain = ctx.createGain();
            const start = t + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(start);
            osc.stop(start + 0.12);
        }
    }
    
    /**
     * Som de SUCCESS - Ação bem sucedida
     */
    playSuccess() {
        if (!this.ensureContext()) return;
        
        const ctx = this.audioContext;
        const t = ctx.currentTime;
        
        // Arpejo ascendente C-E-G
        const notes = [523, 659, 784];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }
}

// Singleton export
export const UISoundSystem = new UISoundSystemClass();
export default UISoundSystem;
