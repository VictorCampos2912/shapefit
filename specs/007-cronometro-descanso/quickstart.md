# Quickstart: Validação do "Cronômetro de Descanso" (RF05)

**Feature**: 007-cronometro-descanso | **Date**: 2026-09-17

Guia para validar manualmente o comportamento descrito na spec, nos dois
aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme
Princípio III da Constituição. Mesma abordagem usada nas features anteriores.

## Pré-requisitos

- RF10, RF01, RF02, RF03 e RF04 implementados e funcionando — esta feature
  depende do fluxo de "Concluir série" já disparando `onIniciarDescanso` (RF04)
- Dependências instaladas: `npm install` (nenhuma dependência nova é introduzida —
  ver research.md)
- Expo Go instalado no aparelho de teste
- Um treino de teste com pelo menos 1 exercício com `descanso_seg` configurado
  (ex.: 30s, para acelerar os testes) e, se possível, um exercício com
  `descanso_seg` ausente/zero para validar o edge case

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

## Cenários de validação (mapeados às User Stories da spec)

### 1. Cronômetro inicia automaticamente e conta corretamente (User Story 1)

1. Iniciar um exercício e concluir a primeira série, não sendo a última planejada
   (carga + reps preenchidos, tocar "Concluir série").
   **Esperado**: o teclado fecha imediatamente (sem exigir toque adicional fora do
   campo ou botão de voltar); o cronômetro aparece contando a partir do
   `descanso_seg` daquele exercício, sem nenhuma ação extra, e fica totalmente
   visível (não coberto pelo teclado) em Android e iOS. Os campos de carga/reps
   e o botão "Concluir série" da próxima série NÃO ficam visíveis enquanto o
   cronômetro conta — apenas um indicativo textual da próxima série e as séries
   já concluídas.
2. Deixar o cronômetro contar até zero.
   **Esperado**: a contagem para em zero (não fica negativa); os campos de
   carga/reps e o botão "Concluir série" da próxima série reaparecem
   normalmente.
3. Concluir uma série de um exercício diferente, com `descanso_seg` diferente.
   **Esperado**: o cronômetro reinicia a partir do novo valor, não do anterior.
4. Concluir a **última** série planejada de um exercício (ex.: a série 3 de 3).
   **Esperado**: nenhum cronômetro é exibido — o teclado fecha normalmente e o
   fluxo segue direto para a exibição de "Concluir exercício" (RF04), sem
   período de descanso. *(Ajustado após validação manual em Android/iOS — ver
   spec.md, Edge Cases, FR-012.)*

### 2. Ajuste manual do tempo restante (User Story 2)

1. Com o cronômetro contando, tocar em "+15s" uma vez.
   **Esperado**: o tempo exibido aumenta 15 segundos imediatamente.
2. Tocar em "+15s" mais 2-3 vezes seguidas.
   **Esperado**: cada toque soma 15s ao valor atual.
3. Tocar em "-15s" até o tempo restante ficar abaixo de 15 segundos (ex.: 8s) e
   tocar em "-15s" novamente.
   **Esperado**: o tempo vai a zero (não fica negativo); cronômetro tratado como
   concluído.

### 3. Cronômetro sobrevive a navegação dentro da própria rota (User Story 3, parcial)

`src/app/treino/[treinoId].tsx` é uma rota de nível raiz, empilhada por cima do
navegador de tabs (não aninhada em `(tabs)/` — ver `src/app/(tabs)/index.tsx`,
que chama `router.push('/treino/[treinoId]')`). Enquanto essa rota está na tela,
as tabs ficam cobertas; a única navegação possível "para fora" é um "voltar"
(pop), que desmonta a rota inteira — não uma troca de aba. Este cenário valida
o que é de fato possível hoje: sair da tela de um exercício específico para a
lista de exercícios do mesmo treino (sem sair da rota `[treinoId]`) e voltar.

1. Concluir uma série com descanso de pelo menos 60s.
2. Tocar em "← Voltar para exercícios" (retorna à lista de exercícios do mesmo
   treino, ainda dentro da rota `[treinoId]` — não desmonta a rota) e permanecer
   lá por um intervalo conhecido (ex.: 15 segundos, cronometrado à parte).
3. Selecionar o exercício novamente (ou qualquer outro), voltando à tela de
   execução.
   **Esperado**: o tempo restante exibido é aproximadamente o valor inicial menos
   os 15 segundos decorridos (tolerância de 1-2s) — não o valor congelado de
   quando o usuário saiu da tela do exercício.

### 3b. Cronômetro sobrevive a troca de aba do app (User Story 3, Acceptance Scenario 1 — bloqueado por decisão de arquitetura pendente)

**Status**: não testável, e **não fica testável automaticamente com a simples
existência do RF08**. O RF08 (histórico) — a tela mencionada na spec como
exemplo de "outra tela do app" — ainda não existe; mas mesmo depois de existir,
se ela viver dentro do grupo de tabs `(tabs)/` (como as demais telas principais
do app hoje), o problema persiste, porque `[treinoId].tsx` é empilhada por cima
de todo o navegador de tabs, não aninhada nele (ver Cenário 3 acima). Não há
hoje nenhuma forma de "trocar de aba" sem antes dar "voltar" e desmontar
`[treinoId].tsx` por completo — o que já está fora do que esta feature garante
(ver research.md, Decisão 2, e a Assumption correspondente em spec.md).
Este cenário só passa a ser satisfazível quando uma decisão explícita de
arquitetura de navegação for tomada (por exemplo, aninhar `[treinoId]` dentro
de `(tabs)/`, ou introduzir um mecanismo de estado — como um Context global —
que sobreviva à desmontagem da rota atual) — decisão essa que MUST ser tomada
de forma deliberada em uma feature futura (RF08 ou dedicada), não presumida
como consequência natural de implementar o histórico.

### 4. Cronômetro sobrevive a segundo plano (User Story 3)

1. Concluir uma série com descanso de pelo menos 60s.
2. Minimizar o app (botão home / trocar de app) e aguardar um intervalo
   conhecido (ex.: 15 segundos).
3. Reabrir o app.
   **Esperado**: o tempo restante exibido reflete o tempo real decorrido em
   segundo plano (tolerância de 1-2s), sem ter ficado pausado.
4. Repetir com um descanso curto (ex.: 10s) e manter o app minimizado por mais
   tempo do que o restante (ex.: 20s).
   **Esperado**: ao reabrir, o cronômetro é exibido já em zero/concluído (não
   negativo).

### 5. Exercício sem tempo de descanso configurado (Edge Case)

1. Concluir uma série de um exercício cujo `descanso_seg` é ausente ou zero (se
   disponível no treino de teste; caso contrário, simular editando o JSON de
   importação para este teste específico).
   **Esperado**: nenhum cronômetro é exibido — o descanso é tratado como já
   concluído imediatamente.

### 6. Nova série conclui com cronômetro anterior ainda ativo (Edge Case)

1. Concluir uma série (cronômetro inicia, ex.: 90s).
2. Antes do cronômetro zerar, voltar e concluir outra série (do mesmo exercício
   ou de outro, dependendo do fluxo de navegação livre já validado no RF04).
   **Esperado**: o cronômetro reinicia com o `descanso_seg` da nova série
   concluída, sem somar ao tempo restante do cronômetro anterior.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF05 —
Cronômetro de descanso", para a lista completa de checkboxes originais usados
como base desta spec.
