# 🔷 GEOLIFE - Tamagotchi Geométrico

> **Desenvolvido por: dev taleszin**  
> **© 2026 Todos os direitos reservados**

---

## 📖 Sobre o Projeto

**GEOLIFE** é um Tamagotchi geométrico desenvolvido com **Canvas HTML5 puro**, sem uso de bibliotecas gráficas externas. Todo o sistema de renderização é construído pixel a pixel usando algoritmos clássicos de Computação Gráfica.

---

## 🎮 Como Jogar

1. Abra o jogo no navegador
2. Assista à animação de abertura (efeito íris com elipse)
3. Na tela de splash, veja os créditos e toque para continuar
4. No editor, personalize seu GeoPet:
   - Escolha a forma (triângulo, quadrado, hexágono, etc.)
   - Selecione olhos e boca
   - Escolha o material/textura
5. Clique em "CRIAR PET" para começar
6. Cuide do seu pet: alimente, brinque, mantenha limpo!

---

## 🔧 Algoritmos Implementados

### Rasterização de Primitivas
- **Bresenham (Linha)**: Desenho de linhas pixel a pixel
- **Midpoint (Círculo)**: Algoritmo de ponto médio para círculos
- **Bresenham (Elipse)**: Algoritmo de elipse com duas regiões
- **Scanline Fill**: Preenchimento de polígonos por varredura

### Preenchimento
- **Flood Fill**: Algoritmo de preenchimento por inundação (stack-based)
- **Flood Fill Scanline**: Versão otimizada com varredura de linhas

### Recorte (Clipping)
- **Cohen-Sutherland**: Recorte de linhas contra janela retangular
- **Sutherland-Hodgman**: Recorte de polígonos

### Transformações 2D
- **Translação**: Movimento do pet
- **Rotação**: Rotação de partículas e efeitos
- **Escala**: Crescimento do pet (bebê → adolescente → adulto)
- **Shear**: Efeito de inclinação em animações

### Sistema de Janelas
- **Window/Viewport**: Transformação de coordenadas mundo → tela
- **DPR (Device Pixel Ratio)**: Suporte a displays de alta densidade

---

## 🏗️ Estrutura do Projeto

```
geolife/
├── index.html              # Página principal
├── package.json            # Dependências
├── vite.config.js          # Configuração do Vite
├── README.md               # Este arquivo
│
├── public/                 # Assets estáticos
│
└── src/
    ├── geolife-main.js     # Entry point
    ├── geolife-style.css   # Estilos
    │
    ├── algorithms/         # Algoritmos de CG
    │   ├── Ellipse.js      # Bresenham para elipse
    │   ├── FloodFill.js    # Flood fill stack-based
    │   └── CohenSutherland.js # Clipping de linhas
    │
    ├── core/
    │   └── Renderer.js     # Motor de renderização
    │
    ├── data/
    │   ├── faces.js        # Definições de olhos/bocas
    │   ├── materials.js    # Materiais/texturas
    │   └── shapes.js       # Formas geométricas
    │
    ├── entities/
    │   └── GeoPet.js       # Classe principal do pet
    │
    ├── scenes/
    │   ├── IrisScene.js    # Animação de abertura
    │   ├── SplashScene.js  # Tela de splash
    │   ├── EditorScene.js  # Editor de pet
    │   └── HomeScene.js    # Gameplay principal
    │
    ├── systems/
    │   ├── DialogueSystem.js
    │   ├── InteractionHistorySystem.js
    │   ├── MaterializationSystem.js
    │   ├── MaterialRenderer.js
    │   ├── PetEffectsSystem.js
    │   ├── PetVoiceSystem.js
    │   ├── TouchInputSystem.js
    │   ├── UISoundSystem.js
    │   └── ViewportClipSystem.js
    │
    └── ui/
        ├── MobileCarousel.js
        └── SmartDialogueSystem.js
```

---

## 🚀 Como Executar

### Desenvolvimento
```bash
npm install
npm run dev
```

### Build para Produção
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

---

## 🎨 Funcionalidades

### Sistema de Cuidados
- 🍎 **Alimentar**: Dê comida ao pet
- 🧹 **Limpar**: Mantenha o pet higienizado
- 💊 **Curar**: Trate quando estiver doente
- 🎮 **Brincar**: Interaja e divirta-se

### Interações Especiais
- 🫳 **Grab & Throw**: Arraste e jogue o pet
- 🔥 **Fogo**: Efeito de chamas
- 💧 **Banho**: Sistema de água
- ✂️ **Cortar**: Efeito de divisão
- 🧬 **Fragmentar**: Mitose do pet

### Sistema de Evolução
- **Bebê** (0-5 min): Tamanho pequeno
- **Adolescente** (5-15 min): Tamanho médio
- **Adulto** (15+ min): Tamanho completo

---

## 📊 Requisitos Atendidos

| Requisito | Status | Arquivo |
|-----------|--------|---------|
| setPixel como base | ✅ | Renderer.js |
| Bresenham (linha) | ✅ | Renderer.js |
| Bresenham (círculo) | ✅ | Renderer.js |
| Bresenham (elipse) | ✅ | Ellipse.js |
| Flood Fill | ✅ | FloodFill.js |
| Scanline Fill | ✅ | Renderer.js |
| Cohen-Sutherland | ✅ | CohenSutherland.js |
| Transformações 2D | ✅ | GeoPet.js |
| Window/Viewport | ✅ | Renderer.js |

---

## 🎬 Cenas do Jogo

1. **IrisScene**: Animação de abertura com elipse crescente (demonstra algoritmo de Elipse)
2. **SplashScene**: Logo do jogo com efeito Flood Fill + créditos
3. **EditorScene**: Personalização do pet com preview em tempo real
4. **HomeScene**: Gameplay principal com todas as interações

---

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablets
- ✅ Displays de alta densidade (Retina)

---

## 🙏 Créditos

**Desenvolvido com 💜 por dev taleszin**

© 2026 Todos os direitos reservados.

---

## 📄 Licença

Este projeto foi desenvolvido como trabalho acadêmico.
Todos os direitos reservados ao autor.
