# Prompts para Identidade Visual — shapefit

Guia de referência para gerar ícones, logo e imagens do app usando ferramentas de IA de
imagem (Microsoft Designer, Gemini, Adobe Firefly, Ideogram). Cada prompt já inclui
paleta, formato e dimensão exigidos pelo Expo.

**Símbolo validado (2026-09-16):** haltere visto de perfil, reto na horizontal (não
diagonal), traço simples e grosso — testado e aprovado como o `icon.png` base. Todos os
prompts abaixo derivam desse mesmo símbolo, variando só cor de preenchimento e fundo.

## Paleta de cores (base)

| Uso | Cor | Hex |
|---|---|---|
| Primária (energia) | Laranja vibrante | `#FF6B35` |
| Secundária | Vermelho profundo | `#D62828` |
| Destaque/CTA | Âmbar | `#FFB703` |
| Fundo modo escuro | Grafite quase preto | `#121212` |
| Fundo modo claro | Branco levemente off-white | `#FAFAFA` |
| Texto modo escuro | Branco suave | `#F5F5F5` |
| Texto modo claro | Preto suave | `#1A1A1A` |

## Bloco de restrições (cole em TODO prompt — é o que corrigiu os problemas das primeiras tentativas)

Escrito em inglês de propósito: instruções negativas de formato funcionam de forma mais
confiável em inglês na maioria dos modelos.

```
flat vector icon design, solid color fill only, no gradient, no texture, no shadow,
no watermark, no ghosting artifacts, no text, no letters, no words.
NO rounded corners, NO white background, NO frame, NO border, NO mockup, NO phone/app
screen preview — the artwork must fill 100% of the canvas edge to edge.
```

## Bloco do símbolo (cole em todo prompt que precisar do haltere)

```
Symbol: a single barbell/dumbbell icon, viewed straight from the side, oriented perfectly
HORIZONTAL (not diagonal, not tilted) — two solid weight plates at each end connected by
a straight bar through the center, like a simple gym pictogram. Extremely simple, bold,
legible even at very small sizes (40px). Symbol centered, occupying approximately 65-70%
of the canvas width.
```

---

## 1. Ícone do app (✅ já validado — use como referência de todos os outros)

- **Arquivo:** `icon.png`
- **Dimensão:** 1024×1024 px
- **Fundo:** OPACO
- **Formato:** PNG

**Prompt:**
```
[bloco de restrições] + [bloco do símbolo], symbol in solid white #FFFFFF, background
solid vibrant orange #FF6B35 (flat, no gradient), square canvas 1024x1024px
```

---

## 2. Ícone adaptativo — camada de frente (Android)

- **Arquivo:** `adaptive-icon.png`
- **Dimensão:** 1024×1024 px
- **Fundo:** TRANSPARENTE
- **Zona segura:** símbolo dentro dos 66% centrais (~672×672 px) — reduza a ocupação do
  símbolo para ~50% do canvas em vez dos 65-70% padrão, já que o Android recorta as bordas
- **Formato:** PNG com canal alfa

**Prompt:**
```
[bloco de restrições] + [bloco do símbolo, mas com "occupying approximately 50% of the
canvas width" em vez de 65-70%], symbol in solid white #FFFFFF, transparent background,
PNG with alpha channel, 1024x1024px
```

*(A cor de fundo do ícone adaptativo não precisa de imagem — defina como cor sólida
`#FF6B35` ou `#121212` diretamente no `app.json`.)*

---

## 3. Splash screen (tela de abertura)

- **Arquivo:** `splash-icon-dark.png` e `splash-icon-light.png`
- **Dimensão:** 400×400 px
- **Fundo:** TRANSPARENTE
- **Formato:** PNG com canal alfa

**Prompt (versão para fundo escuro `#121212`):**
```
[bloco de restrições] + [bloco do símbolo], symbol in solid vibrant orange #FF6B35,
transparent background, PNG with alpha channel, 400x400px
```

**Prompt (versão para fundo claro `#FAFAFA`):**
```
[bloco de restrições] + [bloco do símbolo], symbol in solid deep red #D62828, transparent
background, PNG with alpha channel, 400x400px
```

---

## 4. Favicon (versão web, se necessário)

- **Arquivo:** `favicon.png`
- **Dimensão:** gerar em 512×512, redimensionar para 48×48 depois
- **Fundo:** OPACO
- **Formato:** PNG

**Prompt:**
```
[bloco de restrições] + [bloco do símbolo], symbol in solid white #FFFFFF, background
solid vibrant orange #FF6B35, square canvas 512x512px
```

*(É literalmente o mesmo prompt do `icon.png` — pode reaproveitar o mesmo arquivo direto,
sem gerar de novo.)*

---

## 5. Ícone de notificação (Android — monocromático, regra rígida do sistema)

- **Arquivo:** `notification-icon.png`
- **Dimensão:** 96×96 px
- **Fundo:** TRANSPARENTE
- **Cor:** OBRIGATORIAMENTE branco puro (o Android aplica a cor do sistema por cima —
  qualquer outra cor aqui é ignorada ou renderizada errado)
- **Formato:** PNG com canal alfa

**Prompt:**
```
[bloco de restrições] + [bloco do símbolo], symbol in pure solid white #FFFFFF only, no
other color, transparent background, PNG with alpha channel, 96x96px
```

---

## 6. Logo/wordmark (para uso futuro em telas internas, onboarding, cabeçalhos)

- **Arquivo:** `logo-mark.png`
- **Dimensão:** 512×512 px
- **Fundo:** TRANSPARENTE
- **Formato:** PNG com canal alfa

**Prompt:**
```
[bloco de restrições] + [bloco do símbolo], but drawn as a clean vector logotype (thinner
stroke, more refined than an app icon), symbol in solid vibrant orange #FF6B35,
transparent background, PNG with alpha channel, 512x512px
```

> Nota: o texto "shapefit" em si (tipografia) fica melhor resolvido depois, direto em
> código (fonte do sistema + `ThemedText`), não gerado por IA de imagem — texto gerado por
> IA de imagem costuma sair com letras deformadas/ilegíveis. Use o símbolo isolado acima e
> componha o texto ao lado dele na hora de implementar.

---

## Resumo de entregáveis

| Arquivo | Dimensão | Fundo | Cor do símbolo | Formato | Status |
|---|---|---|---|---|---|
| `icon.png` | 1024×1024 | Laranja sólido | Branco | PNG | ✅ Validado |
| `adaptive-icon.png` | 1024×1024 | Transparente | Branco | PNG (alfa) | Pendente |
| `splash-icon-dark.png` | 400×400 | Transparente | Laranja | PNG (alfa) | Pendente |
| `splash-icon-light.png` | 400×400 | Transparente | Vermelho | PNG (alfa) | Pendente |
| `favicon.png` | 512×512 | Laranja sólido | Branco | PNG | Reaproveita `icon.png` |
| `notification-icon.png` | 96×96 | Transparente | Branco puro | PNG (alfa) | Pendente |
| `logo-mark.png` | 512×512 | Transparente | Laranja | PNG (alfa) | Pendente |

## Próximo passo depois de gerar as imagens

Colocar os arquivos em `assets/images/` no projeto e atualizar as referências em
`app.json` (`icon`, `android.adaptiveIcon`, `splash`, `web.favicon`, `notification.icon`),
conforme a documentação do Expo — isso é trabalho de código, não de geração de imagem, e
pode ser pedido ao Claude Code quando as imagens estiverem prontas.
