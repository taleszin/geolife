# 🔷 GEOLIFE — Tamagotchi Geométrico (README Atualizado)

> **Desenvolvido por: dev taleszin**  
> **© 2026 Todos os direitos reservados**

---

## ✨ Sumário Rápido
- **Combinações visuais possíveis:** **15.185.664** (detalhes abaixo) ✅
- **Combinações incluindo personalidade:** **60.742.656** (visuais × 4 personalidades) ✅
- **Principais arquivos:** `src/entities/GeoPet.js`, `src/data/*.js`, `src/systems/DialogueSystem.js`, `src/core/Renderer.js`

---

## 📖 Visão Geral do Jogo
**GEOLIFE** é um Tamagotchi geométrico construído com Canvas puro, renderizado pixel-a-pixel com algoritmos clássicos de computação gráfica. O jogador cria, cuida e interage com um **GeoPet** — uma entidade formada por forma + material + face + cores + personalidade — e acompanha seu ciclo de vida, humores e eventos especiais.

---

## 🎨 Identidade Visual — Combinações
- **Shapes:** 6 (`src/data/shapes.js`)
- **Eye types:** 12 (`src/data/faces.js`)
- **Mouth types:** 12 (`src/data/faces.js`)
- **Materials (texturas):** 8 (`src/data/materials.js`)
- **Cores neon:** 12 (`src/data/faces.js`) + **opção `null`** (usa cor padrão do material) ⇒ **13 escolhas por slot (olho/boca/borda)**

Cálculo: 6 × 12 × 12 × 8 × 13 × 13 × 13 = **15.185.664** combinações visuais.
- Se contar as **4 personalidades** (`radiant`, `melancholic`, `unstable`, `protective`), o total vira **15.185.664 × 4 = 60.742.656** combinações comportamentais+visuais.

Observação: `primaryColor` / `secondaryColor` aceitam HEX livres no `GeoPet`, o que permite variações praticamente infinitas se o jogador usar cores customizadas.

---

## 🔬 Ciclo de Vida do GeoPet (Aging & Vitality)
- **Estágios definidos em `GeoPet`:**
  - `infant`: age < 0.3
  - `young`: 0.3 ≤ age < 0.7
  - `adult`: age ≥ 0.7
- **Taxa base de envelhecimento:** `baseAgeRate = 1 / 120` → **120 segundos (2 minutos)** para progredir de 0.0 → 1.0 na taxa base.
  - O crescimento real varia com a **qualidade dos cuidados** (vitality): multiplicador `0.8x` (negligência) a `1.4x` (cuidado perfeito).
  - Na prática, o tempo total para maturidade fica aproximadamente entre **~86s (melhor cuidado)** e **~150s (pior cuidado)**.
- **Escala visual por estágio:** o pet nasce muito pequeno (0.15x) e cresce suavemente até um `maxGrowthScale` único (1.8x–2.5x típico).
- **Colapso & Morte:** quando a vitalidade média cai abaixo de thresholds baixos, `instability` cresce (0.05–0.20 por segundo) e se vitalidade ≲ 0.01, o processo de colapso inicia; o colapso conduz a morte ao longo de ~5s (progressão de colapso definida em `GeoPet.updateCollapse`).

---

## 🎮 Interações — UX e Mapeamento no Código
Abaixo resumo de como cada interação se apresenta ao jogador (UX) e onde é tratada no código (arquivos/funções).

1. **Alimentar (Feed)** 🍎
   - UX: botão `Alimentar` gera comida na sala; o pet caminha até a comida e come com animação e fala.
   - Código: `HomeScene.feedPet()` cria `this.food` e chama `pet.moveTo(...)`. Quando `pet.feed(amount)` é chamado (`GeoPet.feed`): aumenta `hunger`, ajusta `happiness`, dispara `expressionState.action = 'eating'` e aplica `feedCooldown = 2000` ms (durante esse cooldown os stats não decaem).

2. **Carinho / Petting (Scrub)** 🤗
   - UX: movimento repetido (scrub) faz o pet ronronar, exibir animação e sons.
   - Código: `TouchInputSystem` detecta `scrub` e emite `{ intensity }`; `GeoPet.onScrub(intensity)` aumenta `happiness`, aplica `isBeingPetted` e animações faciais.

3. **Tap / DoubleTap / LongPress** ✋
   - UX: toque simples chama atenção; double tap ⇒ pulo; long press ⇒ relax/sono.
   - Código: `TouchInputSystem` emite `tap`, `doubleTap`, `longPress`. Reações: `GeoPet.onTap()`, `GeoPet.onDoubleTap()` (pula, `vy = -3`), `GeoPet.onLongPress()` (relax).

4. **Segurar / Arremessar (Grab & Throw)** 🫳
   - UX: arrastar pega o pet; soltar com velocity o arremessa e ele rebate.
   - Código: comportamento implementado em `HomeScene` (`onGrabStart/onGrabEnd`) e `GeoPet` mantém `isHeld`, `throwVelocityX/Y`, `isThrown`, `bounciness`, `gravity` e lógica de colisões.

5. **Choque (Shock)** ⚡
   - UX: ação agressiva que reduz stats e causa falas de dor.
   - Código: `HomeScene.shockPet()` chama `pet.shock()` e `pet.registerMistreatment()`, registra no `InteractionHistorySystem` e dispara `DialogueSystem.speak('shocked', ...)`.

6. **Brincar / Curar / Limpar**
   - UX: diferentes botões/ações que aumentam `happiness`, restauram `energy`/`hunger` ou removem side effects.
   - Código: `GeoPet.play()`, `GeoPet.heal()`, `HomeScene` invoca efeitos e registra no `InteractionHistorySystem`.

7. **Eventos Especiais** (Fragmentação, Fogo, Água, Slice)
   - UX: efeitos visuais fortes e penalidades temporárias.
   - Código: `GeoPet.fragment()`, `isOnFire`, `isWet`, `isSliced` → atualizações em `update()` e handlers específicos (particles, damage over time, duração).

---

## 💬 Sistema de Diálogos
- Banco de frases em `src/systems/DialogueSystem.js` (`DIALOGUES`), categorizado por contexto (idle, eating, birth, shocked, collapse_stage*, etc.).
- API: `DialogueSystem.speak(context, emotion, shapeId)` retorna uma phrase; a entidade chama `pet.say(text, context)` para exibir com efeito typewriter (`dialogueTypewriter`), `typewriterSpeed`, e callbacks (`onTypeLetter`, `onSpeak`).
- Uso prático: quase todas as interações (feed, pet, shock, mutation, colapso) disparam falas automaticamente para feedback emocional.

---

## 🧭 Arquivos-chave (Mapa rápido) 🔧
- `src/entities/GeoPet.js` — Lógica do pet, stats, envelhecimento, interações, animação e render modifiers.
- `src/data/shapes.js` — Formas e parâmetros de vértices.
- `src/data/faces.js` — Olhos, bocas, cores neon.
- `src/data/materials.js` — Materiais (paletas, comportamento de render e personalidade ligada).
- `src/scenes/HomeScene.js` — Gameplay, spawn de comida, grab/throw e loop principal.
- `src/systems/TouchInputSystem.js` — Detecção de gestos: tap, doubleTap, longPress, scrub, pinch, pan.
- `src/systems/DialogueSystem.js` — Banco de frases e helpers de seleção procedural.
- `src/core/Renderer.js` — `setPixel` e primitives drawing interface usada por `algorithms/`.

---

## 🚀 Como Executar (rápido)
```bash
npm install
npm run dev
# build
npm run build
npm run preview
```

---

## 🧪 Notas de Balanceamento / Tempos (correções)
- **Decaimento de stats (por segundo):** `hunger: 1.2/s`, `happiness: 0.5/s`, `energy: 0.3/s` (implementado em `GeoPet.decayRates` e aplicado com `dt` em segundos).
- **Feed cooldown:** `2000` ms — durante esse tempo os stats não decaem.
- **Envelhecimento base:** `1 / 120` → **120s** para 0 → 1 (2 minutos), ajustado por `ageMultiplier` (0.8–1.4) conforme `vitality`.
- Observação: comentários antigos que mencionavam "3 minutos" foram corrigidos — o código usa 120s como base.

---

## 🧾 Licença, Créditos e Contato
**Desenvolvido por dev taleszin** — código fonte e assets pertencem ao autor.

---

## 🔚 Algoritmos de Computação Gráfica (detalhes técnicos — seção final)
- `src/algorithms/Ellipse.js` — Elipse (Bresenham / Midpoint) usada para desenhar íris, olhos e formas arredondadas e máscaras (funções `drawEllipse`, `drawFilledEllipse`, `drawEllipseWithHole`).
- `src/algorithms/FloodFill.js` — Flood fill (stack-based e scanline) usado para efeitos e preenchimentos com tolerância/gradiente.
- `src/algorithms/CohenSutherland.js` — Clipping de linhas e polígonos (uso no `Renderer`/viewport para não desenhar fora da janela).

Esses algoritmos trabalham em conjunto com `src/core/Renderer.js` (setPixel / drawLine / drawPolygon) para produzir o estilo pixel-level do jogo.


