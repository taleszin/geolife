GEOLIFE — Tamagotchi Geométrico

[![Status](https://img.shields.io/badge/status-WIP-yellow)](https://github.com)
[![Node](https://img.shields.io/badge/node-14%2B-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)](#17-créditos-e-licença)

Autor: dev taleszin  ·  Data: 2026

Breve: Experiência Tamagotchi geométrica — arte procedural e render a nível de pixel.

Índice (clique para navegar)
-----------------------------

- [1. Visão geral](#1-visão-geral)
- [2. Objetivos do projeto](#2-objetivos-do-projeto)
- [3. Recursos do jogo](#3-recursos-do-jogo)
- [4. Estrutura do repositório](#4-estrutura-do-repositório)
- [5. Pré-requisitos e execução](#5-pré-requisitos-e-execução)
- [6. Arquitetura técnica](#6-arquitetura-técnica)
- [7. Modelo de dados e ativos](#7-modelo-de-dados-e-ativos)
- [8. Entidade principal: `GeoPet` (atributos e comportamento)](#8-entidade-principal-geopet-atributos-e-comportamento)
- [9. Sistemas e responsabilidades](#9-sistemas-e-responsabilidades)
- [10. Interações: UX e mapeamento para código](#10-interações-ux-e-mapeamento-para-código)
- [11. Ciclo de vida, balanceamento e tempos (valores exatos)](#11-ciclo-de-vida-balanceamento-e-tempos-valores-exatos)
- [12. Pipeline de renderização e integração de algoritmos](#12-pipeline-de-renderização-e-integração-de-algoritmos)
- [13. Testes, debugging e recomendações de desenvolvimento](#13-testes-debugging-e-recomendações-de-desenvolvimento)
- [14. Guia de contribuição (resumo)](#14-guia-de-contribuição-resumo)
- [15. Roadmap e melhorias propostas](#15-roadmap-e-melhorias-propostas)
- [16. FAQ e resolução de problemas](#16-faq-e-resolução-de-problemas)
- [17. Créditos e licença](#17-créditos-e-licença)
- [18. Anexo técnico: algoritmos de computação gráfica (detalhado)](#18-anexo-técnico-algoritmos-de-computação-gráfica)
- [19. Apêndice: comandos úteis](#19-apêndice-comandos-úteis)


1. Visão geral
2. Objetivos do projeto
3. Recursos do jogo
4. Estrutura do repositório
5. Pré-requisitos e execução
6. Arquitetura técnica
7. Modelo de dados e ativos
8. Entidade principal: `GeoPet` (atributos e comportamento)
9. Sistemas e responsabilidades
10. Interações: UX e mapeamento para código
11. Ciclo de vida, balanceamento e tempos (valores exatos)
12. Pipeline de renderização e integração de algoritmos
13. Testes, debugging e recomendações de desenvolvimento
14. Guia de contribuição (resumo)
15. Roadmap e melhorias propostas
16. FAQ e resolução de problemas
17. Créditos e licença
18. Anexo técnico: algoritmos de computação gráfica (detalhado)
19. Apêndice: comandos úteis

1. Visão geral
---------------

GEOLIFE é uma experiência que combina arte procedural, algoritmos clássicos de computação gráfica e interações táteis para criar um Tamagotchi geométrico. Cada GeoPet é gerado por composição de forma, material, face e cores. O sistema prioriza clareza no código, modularidade para experimentação e fidelidade ao desenho a nível de pixel.

2. Objetivos do projeto
----------------------

- Fornecer um exemplo prático de renderização a nível de pixel utilizando `Canvas` e algoritmos de rasterização.
- Criar uma experiência interativa baseada em cuidados, emoções e evolução do personagem.
- Manter o código modular para suportar experimentação em sistemas de comportamento, materiais e efeitos visuais.
- Documentar os componentes principais e os fluxos de dados para facilitar contribuição e extensão.

3. Recursos do jogo
-------------------

O jogo oferece os recursos abaixo principais, arquitetados para serem observáveis e extensíveis:

- Composição visual: formas, olhos, bocas, materiais e cores.
- Sistema de personalidade que influencia render e comportamento.
- Entrada multi-modal: mouse, touch (tap, double tap, long press, pan, pinch, scrub).
- Interações de cuidado: alimentar, acariciar, brincar, curar, limpeza.
- Eventos e efeitos: fragmentação, fogo, banho, corte, mutação, arremesso.
- Ciclo de vida e evolução com estágios e crescimento visual.
- Banco de diálogos procedimental para feedback emocional.
- Implementação de algoritmos de computação gráfica clássicos em `src/algorithms`.

4. Estrutura do repositório
---------------------------

Raiz do projeto contém os arquivos de configuração e o README.

`index.html`  — página principal de carregamento da aplicação.
`package.json` — scripts e dependências do projeto.
`vite.config.js` — configuração do bundler (Vite).

Pasta `src` contém o código-fonte principal:

- `geolife-main.js` — ponto de entrada que inicializa a cena e os sistemas.
- `geolife-style.css` — estilos básicos e layout da UI.
- `core/Renderer.js` — motor de renderização responsável pelo buffer de pixels e primitivas.
- `entities/GeoPet.js` — implementação completa da entidade GeoPet.
- `scenes/` — telas e controladores (`HomeScene.js`, `EditorScene.js`, `SplashScene.js`, `IrisScene.js`).
- `systems/` — subsistemas independentes (entrada, som, diálogo, materialização, efeitos, histórico).
- `data/` — catálogos: `faces.js`, `materials.js`, `shapes.js`.
- `algorithms/` — implementações de Elipse, FloodFill, Cohen–Sutherland e utilitários.
- `ui/` — componentes de interface, ex.: `SmartDialogueSystem.js`, carrosséis.

5. Pré-requisitos e execução
---------------------------

Requisitos mínimos:

- Node.js 14+ (recomendado 16+)
- NPM ou Yarn
- Navegador moderno (Chrome, Edge, Firefox, Safari)

Instalação e execução (desenvolvimento):

```bash
npm install
npm run dev
```

Build para produção e preview:

```bash
npm run build
npm run preview
```

Dica (Windows): caso processos Node fiquem presos use `taskkill /F /IM node.exe` para liberar portas.

6. Arquitetura técnica
----------------------

A arquitetura do projeto favorece responsabilidades claras e componentes desacoplados.

Camadas principais:

- Render (baixo nível): `Renderer` gerencia buffer, viewports e chamadas a `setPixel`.
- Algoritmos: funções puras que implementam elipses, flood fills, clipping, etc.
- Entidades: `GeoPet` encapsula estado, lógica e animações.
- Sistemas: cuidam de entrada, som, diálogo, efeitos, materialização e histórico.
- Scenes: orquestram render, entradas e transições.

Fluxo por frame (simplificado):

1. `Scene.update()` — atualiza lógica de alto nível.
2. `GeoPet.update(deltaTime)` — atualiza estados e animações do pet.
3. `Renderer` limpa buffer e processa draw calls para entidades e efeitos.
4. `MaterialRenderer` aplica preenchimentos e pós-processamento por material.
5. `PetEffectsSystem` desenha partículas por cima.

7. Modelo de dados e ativos
---------------------------

`src/data` contém catálogos e mapeamentos usados no runtime.

- `shapes.js` — define 6 formas com funções que retornam vértices/params para render.
- `faces.js` — define tipos de olhos, bocas e paleta de cores neon; também exporta mapas para lookup rápido.
- `materials.js` — define 8 materiais, cada um com `palette` e `render` settings (ex.: `fillType`, `borderType`, `density`, `noiseScale`, `glowIntensity`) e uma lista de traços de personalidade associados.

Os dados são estruturados para permitir lookup por `id` e para uso direto por `GeoPet` e pelo `MaterialRenderer`.

8. Entidade principal: `GeoPet` (atributos e comportamento)
---------------------------------------------------------

`GeoPet` é a unidade comportamental central. Abaixo os aspectos-chave organizados de forma concisa.

8.1 Identidade visual

- `shapeId` — identifica a forma base (ex.: `circulo`, `quadrado`).
- `eyeType`, `mouthType` — strings que referenciam entradas em `faces.js`.
- `materialId` — refere-se a `materials.js` (define paleta e comportamento de render).
- `primaryColor`, `secondaryColor`, `eyeColor`, `mouthColor`, `borderColor` — cores usadas para render; `null` permite herdar do material.

8.2 Estado físico e transformações

- `x`, `y`, `vx`, `vy` — posição e velocidade.
- `size`, `scale`, `rotation` — transformações aplicadas pela cena e pelo aging.

8.3 Stats vitais

- `hunger`, `happiness`, `energy` — valores em 0–100 que determinam vitalidade.
- `decayRates` — objeto que define perda por segundo: `hunger: 1.2`, `happiness: 0.5`, `energy: 0.3`.

8.4 Expressões e animações

- `faceParams` e `faceTargets` — parâmetros animáveis (eyeOpenness, mouthCurve, browAngle, pupilSize, tremor, breathY).
- `squashX`, `squashY` — usado para squash and stretch nas animações de reação.
- `blinkTimer`, `breathPhase` — timers para microanimações.

8.5 Interações e flags

- `isBeingPetted`, `isHeld`, `isThrown`, `isFragmented`, `isOnFire`, `isWet`, `isSliced` — flags que controlam estados transitórios.
- `throwVelocityX/Y`, `gravity`, `bounciness`, `airFriction` — parâmetros de física simplificada para arremessos.

8.6 Aging e vitalidade

- `age` (0.0–1.0) — determina estágio de vida.
- `ageStage` — `infant`, `young`, `adult` (baseado em thresholds 0.3, 0.7).
- `maxGrowthScale` — fator máximo de crescimento individual (1.8–2.5 típico).
- `vitality` e `vitalitySmoothed` — métricas derivadas dos stats; usadas para efeitos visuais e para cálculo de `ageMultiplier`.

8.7 Colapso e morte

- `instability`, `isCollapsing`, `collapseProgress`, `collapseStage`, `isDead` — controle do processo de colapso quando vitalidade cai abaixo de thresholds.
- `startCollapse()` inicia o processo e gera partículas; `updateCollapse(dt)` gerencia progressão e eventos de diálogo.

8.8 Personalidade

- `personality`: um dos tipos `['radiant','melancholic','unstable','protective']`.
- `personalityModifiers`: objecto com multiplicadores e biases visuais (glowMultiplier, saturationBoost, flickerAmount, stabilityFactor).
- `updatePersonalityModifiers(dt)`: função que atualiza modificadores com base na personalidade e no tempo.

8.9 Métodos principais

- `update(deltaTime)`: atualização central que chama submódulos (stats, aging, vitality, animations, efeitos especiais).
- `feed(amount)`: incrementa `hunger` e `happiness` e aplica `feedCooldown` (2000 ms).
- `pet()` / `onScrub(intensity)`: aumentam `happiness`, aplicam `squash` e disparam expressões de carinho.
- `moveTo(x,y)`: define comportamento de movimento até um alvo.
- `fragment()`: ativa modo fragmentado com penalidades.
- `startCollapse()`: inicia rotina de colapso.
- `say(text, context)`: aciona sistema de diálogo com efeitos de typewriter.

9. Sistemas e responsabilidades
------------------------------

Resumo objetivo dos sistemas contidos em `src/systems`.

9.1 `TouchInputSystem`

- Responsável por mapear inputs de touch e mouse para eventos de alto nível: `tap`, `doubleTap`, `longPress`, `panStart/pan/panEnd`, `pinch`, `rotate`, `scrub`.
- Principais thresholds (valores do código): `tapMaxDuration: 200 ms`, `tapMaxDistance: 15 px`, `doubleTapMaxDelay: 300 ms`, `scrubMinChanges: 3`, `scrubTimeWindow: 500 ms`.
- Em mobile, previne comportamentos nativos e trata pinch/rotate/pan.

9.2 `DialogueSystem`

- Banco de frases categorizadas por contexto (`idle`, `eating`, `birth`, `shocked`, `collapse_stage*`, etc.).
- API principal: `speak(context, emotion, shapeId)` que retorna uma frase apropriada; é consumida por `GeoPet.say()`.

9.3 `MaterializationSystem` / `MaterialRenderer`

- `MaterializationSystem` cuida da animação de aparição/nascimento do pet.
- `MaterialRenderer` aplica o estilo de preenchimento e borda conforme `materials.js` (bordas facetadas, glow, noise modulation).

9.4 `PetEffectsSystem`

- Gera partículas para fogo, água, fragmentos e efeitos de corte.
- Separado para permitir desenho fora da lógica da entidade e possibilitar caching de partículas.

9.5 `InteractionHistorySystem`

- Registra eventos de interação com metadados (tipo, tempo, estado do pet) usado para analytics e decisões de balanceamento.

9.6 `UISoundSystem` e `PetVoiceSystem`

- Abstraem a reprodução de áudio por evento. `PetVoiceSystem.playBirth(shapeId)` e `UISoundSystem.playFeed()` são exemplos de uso no código.

10. Interações: UX e mapeamento para código (detalhado)
----------------------------------------------------

A seguir, mapeamos ações do usuário para as funções e arquivos onde são tratadas.

10.1 Alimentar (Feed)

- UX: o jogador clica em um botão de UI ‘Alimentar’. Um objeto `food` é spawnado na cena e o pet se move até ele.
- Arquivos/funções: `HomeScene.feedPet()` cria `this.food` e chama `pet.moveTo(food.x, food.y)`; o eventual `pet.feed(amount)` é implementado em `src/entities/GeoPet.js`.
- Efeito: `hunger` aumenta até `100`, `happiness` recebe incremento adicional; `feedCooldown` impede decaimento por 2000 ms.

10.2 Carinho / Petting (Scrub)

- UX: movimento repetido com o dedo no pet gera sensação de carinho.
- Arquivos/funções: `src/systems/TouchInputSystem.js` detecta `scrub` (mudanças de direção dentro de janela de tempo) e emite evento com `intensity`; `GeoPet.onScrub(intensity)` aplica ganho em `happiness`, ativa `isBeingPetted` e animações de `squash`.

10.3 Tap / DoubleTap / LongPress

- UX: toques rápidos e prolongados com diferentes respostas (atenção, pulo, relax).
- Arquivos: eventos emitidos por `TouchInputSystem` → handlers em `GeoPet.onTap()`, `onDoubleTap()`, `onLongPress()`.

10.4 Segurar / Arremessar (Grab & Throw)

- UX: arrastar o pet para agarrar; ao soltar, a velocidade do movimento determina a velocidade de lançamento.
- Arquivos: `HomeScene` trata eventos mousedown/touchstart/mousemove/touchmove e calcula `throwVelocity`; `GeoPet` aplica física ao ser solto (`isThrown`, `gravity`, `bounciness`).

10.5 Choque (Shock)

- UX: ação negativa que reduz stats e afeta o humor.
- Arquivos: `HomeScene.shockPet()` chama `pet.shock()` e `pet.registerMistreatment()`; também registra com `InteractionHistorySystem.record(INTERACTION_TYPES.SHOCK, {...})`.

10.6 Brincar, Curar, Limpar

- UX: ações que restauram stats ou removem efeitos negativos.
- Arquivos: mapeadas para métodos em `GeoPet` (ex.: `play()`, `heal()`) e invocadas por handlers de cena/UI.

10.7 Eventos especiais (fragmentação, fogo, slice, wet)

- UX: efeitos visuais marcantes com penalidades/benefícios.
- Arquivos: `GeoPet.fragment()`, flags `isOnFire`, `isWet`, `isSliced`; efeitos desenhados por `PetEffectsSystem`.

11. Ciclo de vida, balanceamento e tempos (valores exatos)
--------------------------------------------------------

Esta seção documenta os valores exatos observados no código e explica como eles afetam jogo.

11.1 Decaimento de stats

- Valores em `GeoPet.decayRates`:
  - `hunger: 1.2` (unidade: por segundo)
  - `happiness: 0.5` (por segundo)
  - `energy: 0.3` (por segundo)

- Implementação: aplicados em `GeoPet.updateStats(dt)` onde `dt` é tempo em segundos obtido convertendo `deltaTime / 1000`.

11.2 Feed cooldown

- `feedCooldown` é 2000 ms. Quando maior que zero, `updateStats` retorna cedo e impede decaimento de stats.
- Objetivo: evitar que o jogador precise alimentar repetidamente em curtos intervalos para manter o pet vivo.

11.3 Envelhecimento (Aging)

- `baseAgeRate = 1 / 120` (taxa base para incrementos de `age` por segundo; resultado: 120s para evoluir `age` de 0.0 → 1.0 na taxa base).
- `ageMultiplier = 0.8 + careQuality * 0.6`, onde `careQuality` é `vitality` (0–1).
- Tempo efetivo ≈ `120s / ageMultiplier`.

Exemplos práticos:
- Melhor cuidado (vitality ≈ 1.0) → `ageMultiplier ≈ 1.4` → tempo ≈ 85.7 s.
- Pior cuidado (vitality ≈ 0.0) → `ageMultiplier ≈ 0.8` → tempo ≈ 150 s.

11.4 Vitalidade e Instabilidade

- `vitality` é média ponderada: `hunger * 0.4 + happiness * 0.35 + energy * 0.25`, dividida por 100 para obter valor entre 0 e 1.
- Quando `vitality < 0.15`, `instability` cresce com velocidade dependente da severidade: `growthRate = 0.05 + severityFactor * 0.15` (resultando em 0.05–0.20 por segundo aproximadamente).
- Se `vitality <= 0.01`, `startCollapse()` é acionado e o processo de colapso tem duração aproximada de 5 segundos até morte completa se não houver recuperação.

12. Pipeline de renderização e integração de algoritmos
------------------------------------------------------

Detalhamento técnico de como o jogo desenha cada frame e onde os algoritmos são usados.

12.1 Ordem de renderização por frame

1. Limpeza do buffer pelo `Renderer`.
2. Desenho do background.
3. Para cada entidade: calcular render modifiers (`GeoPet.getRenderModifiers()`), chamar `MaterialRenderer` para aplicar regras visuais, desenhar contornos e preenchimentos usando primitives.
4. Desenho de olhos e boca, aplicando máscaras, elipses e detalhes.
5. Desenho de partículas e pós-processamento por `PetEffectsSystem`.
6. Composite final e push para canvas.

12.2 Integração dos algoritmos de CG

- `Ellipse.js`: usado para desenhar íris, máscaras e operações de preenchimento elíptico, disponível como `drawEllipse` e `drawFilledEllipse`.
- `FloodFill.js`: variantes `floodFill`, `floodFillScanline` e `floodFillGradient` para preenchimentos e efeitos de gradiente; a versão scanline é preferida em áreas extensas por eficiência.
- `CohenSutherland.js`: clipping de linhas e polígonos para evitar chamadas de desenho fora da viewport e reduzir custo computacional.

12.3 Otimizações recomendadas

- Priorizar operações em `ImageData.data` em blocos ao invés de chamadas repetidas a `setPixel`.
- Executar clipping antes de chamadas a algoritmos pesados.
- Usar `requestAnimationFrame` e variáveis de delta controladas para modular o carregamento nos frames.

13. Testes, debugging e recomendações de desenvolvimento
------------------------------------------------------

13.1 Debugging

- Use DevTools do navegador para inspeção de variáveis e breakpoints em `src/entities/GeoPet.js` e `src/scenes/HomeScene.js`.
- Logs específicos já presentes: `startCollapse()` faz `console.log` para indicar início do colapso.
- Para reproduzir problemas de física, grave posições e velocidades durante arremessos.

13.2 Testes automatizados (recomendação)

- Escrever testes unitários para funções puras em `src/algorithms` (ex.: `clipLine`, `drawEllipse`).
- Testar helpers de `GeoPet` como `getAgeScale()` e `calculateVitality()` com entradas e saídas determinísticas.
- Utilizar `vitest` ou `jest` e scripts de CI para rodar testes automaticamente em PRs.

13.3 Performance profiling

- Utilize DevTools -> Performance para capturar frames e identificar hotspots.
- Instrumente `Renderer` para medir tempo gasto em `drawCalls` e em escrita para `ImageData`.

14. Guia de contribuição (sumário)
---------------------------------

Fluxo recomendado:

1. Abrir uma issue descrevendo problema/feature.
2. Fork do repositório e branch com padrão `feat/` ou `fix/`.
3. Mantenha commits pequenos e atômicos.
4. Adicionar testes quando aplicável.
5. Abrir PR com descrição de mudanças, impacto e screenshots/GIFs.

Estilo de código e ferramentas

- Recomenda-se adicionar `eslint` e `prettier` para padronização.
- Adicione scripts no `package.json` para lint e testes antes do PR.

15. Roadmap e melhorias propostas
--------------------------------

Prioridades de médio prazo:

- Persistência local do estado do pet (IndexedDB/localStorage).
- Painel de estatísticas históricas baseado em `InteractionHistorySystem`.
- Sistema de skins e microtransações (se aplicável) com separação clara de assets.
- Implementação de testes automatizados e CI.
- Otimizações adicionais para dispositivos móveis.

16. FAQ e resolução de problemas
--------------------------------

Perguntas frequentes e respostas objetivas:

Q: O jogo congela ou trava em `npm run dev`.
A: Verifique instâncias de Node em background. Em Windows, use `taskkill /F /IM node.exe` para encerrar processos órfãos.

Q: As cores não batem entre editor e runtime.
A: Verifique se `eyeColor`/`mouthColor`/`borderColor` estão `null`, o que aciona herança de `material.palette`.

Q: Meu pet morre muito rápido.
A: Reveja os valores de `decayRates` e confirme se não há manipulação externa definindo `feedCooldown` para zero.

17. Créditos e licença
---------------------

Desenvolvedor: dev taleszin

O projeto e ativos pertencem ao autor. Para usos além de experimentação pessoal ou acadêmica, contate o autor para licenciamento.

18. Anexo técnico: algoritmos de computação gráfica
-------------------------------------------------

Implementações principais:

- `src/algorithms/Ellipse.js`: algoritmo de elipse (Midpoint/Bresenham) com funções de plot e preenchimento scanline.
- `src/algorithms/FloodFill.js`: implementação stack-based e scanline para preenchimentos e variantes com gradiente.
- `src/algorithms/CohenSutherland.js`: clipping de linhas e polígonos com utilitários de interseção.

Uso: essas funções são ferramentas de baixo nível para o `Renderer` e são invocadas diretamente por `GeoPet` quando necessário.

Apêndice: combinações e contagem
--------------------------------

Visual (resumo)

| Item | Quantidade |
|---|---:|
| Shapes | 6 |
| Eye types | 12 |
| Mouth types | 12 |
| Materials | 8 |
| Neon color options (por slot) | 13 |
| Personalities | 4 |
| Combinações visuais (produto dos catálogos) | 15.185.664 |
| Combinações totais (incluindo personalidade) | 60.742.656 |

Observação: `primaryColor` e `secondaryColor` aceitam hex livres; personalização adicional expande as combinações para um espaço praticamente ilimitado.

Detalhes do cálculo (expandir se necessário):

<details>
<summary>Mostrar cálculo</summary>

Valores base observados nos catálogos:

- Shapes: 6
- Eye types: 12
- Mouth types: 12
- Materials: 8
- Neon color options: 12 + `null` = 13 opções por slot (eye/mouth/border)

Cálculo de combinações visuais:

6 × 12 × 12 × 8 × 13 × 13 × 13 = 15.185.664 combinações visuais possíveis.

Incluindo 4 personalidades (`radiant`, `melancholic`, `unstable`, `protective`):

15.185.664 × 4 = 60.742.656 combinações comportamentais + visuais.

</details>

19. Comandos úteis
------------------

Instalação e execução:

```bash
npm install
npm run dev
```

Build e preview:

```bash
npm run build
npm run preview
```

Final
-----

Este documento pretende servir como referência técnica e guia para desenvolvedores que queiram compreender, usar e contribuir para o projeto GEOLIFE. Se desejar, posso:

- Gerar `CONTRIBUTING.md` com templates e checks de estilo.
- Criar documentação adicional em `docs/` com diagramas mermaid do fluxo de chamadas.
- Implementar uma suíte de testes para `src/algorithms`.

Indique qual desses itens prefere que eu produza em seguida.
