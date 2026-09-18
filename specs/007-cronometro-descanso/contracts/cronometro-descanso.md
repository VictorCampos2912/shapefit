# Contract: Cronômetro de Descanso (`src/app/treino/[treinoId].tsx` e novos módulos)

**Feature**: 007-cronometro-descanso | **Date**: 2026-09-17

Estende o contrato já existente em
[../../005-avancar-series-exercicios/contracts/tela-execucao-conclusao.md](../../005-avancar-series-exercicios/contracts/tela-execucao-conclusao.md)
(RF04), que documenta a chamada de `onIniciarDescanso` "sem UI própria". Não repete
o que já está lá (fluxo de conclusão de série/exercício, persistência de sessão) —
documenta apenas o que muda ou é adicionado por esta feature.

## Alteração de assinatura do ponto de extensão (`onIniciarDescanso`)

```ts
// src/components/treino/exercicio-execucao.tsx
// Antes (RF04): onIniciarDescanso?: () => void;
// Depois (RF05):
onIniciarDescanso?: (info: { exercicioId: string; descansoSeg: number }) => void;

// Dentro de handleConcluirSerie (mesmo local, mesmo momento de disparo já
// estabelecido pelo RF04 — depois de registrar a série). Fecha o teclado
// virtual antes de prosseguir (FR-013, ajuste pós-validação manual) e só
// chama onIniciarDescanso se a série concluída NÃO era a última planejada do
// exercício (FR-012, ajuste pós-validação manual — na última série não há
// descanso, o fluxo segue direto para "Concluir exercício"):
Keyboard.dismiss();
const eraUltimaSerie = estado.serieAtual >= exercicio.series;
if (!eraUltimaSerie) {
  onIniciarDescanso?.({ exercicioId: exercicio.id, descansoSeg: exercicio.descansoSeg });
}
```

## Novo ponto de extensão exposto pela rota (consumo futuro do RF06)

```ts
// src/app/treino/[treinoId].tsx — conceitual; chamado internamente por
// handleDescansoConcluido, sem nenhuma UI/efeito colateral implementado nesta
// feature além de zerar o estado do cronômetro.
onDescansoConcluido?: () => void;
```

## Nova prop em `ExercicioExecucao` (`emDescanso`, ajuste pós-validação manual)

```ts
// src/components/treino/exercicio-execucao.tsx
emDescanso?: boolean; // default false — calculado pela rota:
// emDescanso={descansoAtivo?.exercicioId === exercicioSelecionado.id}
```

Enquanto `emDescanso === true`, `ExercicioExecucao` oculta a área de
carga/repetições da próxima série e o botão "Concluir série", exibindo em seu
lugar apenas um indicativo textual ("Próxima: série X de Y — aguarde o fim do
descanso") e a lista de séries já concluídas. Isso impede que o usuário
preencha e conclua a próxima série antes do fim do descanso (FR-014). Não
introduz um botão de "pular descanso" — o ajuste "-15s" já existente continua
sendo o único caminho para encerrar o descanso antes do tempo previsto.

## Novas funções puras (`src/utils/cronometro-descanso.ts`)

```ts
calcularSegundosRestantes(fimEm: number, agora?: number): number
ajustarFimEm(fimEm: number, deltaSegundos: number): number
formatarTempo(segundos: number): string
```

## Novo componente de UI (`src/components/treino/cronometro-descanso.tsx`)

Componente controlado, sem estado próprio — segue o mesmo padrão já usado por
`ExercicioExecucao` (RF04) e `ExercicioListItem` (RF03).

```ts
type CronometroDescansoProps = {
  segundosRestantes: number;
  onMais15: () => void;
  onMenos15: () => void;
};
```

| Entrada | Estado exibido |
|---|---|
| `segundosRestantes > 0` | Tempo formatado (mm:ss) em contagem regressiva; controles "+15s"/"-15s" habilitados |
| `segundosRestantes === 0` | Não deve ocorrer como prop persistente — a rota remove o componente da árvore assim que detecta zero (ver Estado interno da rota) |

## Estado interno da rota (novo, em adição ao já descrito no RF04)

| Estado | Transição | FR relacionado |
|---|---|---|
| `descansoAtivo` é `null` | Nenhum cronômetro exibido | — |
| `onIniciarDescanso` recebido com `descansoSeg > 0` | `descansoAtivo = { exercicioId, fimEm: Date.now() + descansoSeg * 1000 }`; `<CronometroDescanso>` passa a ser renderizado | FR-001, FR-002 |
| `onIniciarDescanso` recebido com `descansoSeg` ausente/zero/não numérico | `descansoAtivo` permanece/volta a `null`; `onDescansoConcluido` é chamado imediatamente | FR-010 |
| `onIniciarDescanso` recebido enquanto `descansoAtivo` já não é `null` | `descansoAtivo` é substituído integralmente pelo novo (não acumula) | FR-011 |
| Usuário toca "+15s" | `descansoAtivo.fimEm += 15000` | FR-004 |
| Usuário toca "-15s" | `descansoAtivo.fimEm -= 15000`; se resultado `<= 0`, tratado como zero (ver linha de conclusão) | FR-005 |
| Tick de 1s (app em primeiro plano) OU evento `AppState` para `active` | `segundosRestantes` recalculado via `calcularSegundosRestantes(descansoAtivo.fimEm)`; força re-render | FR-003, FR-006, FR-007, FR-008 |
| `segundosRestantes` calculado chega a `0` | `descansoAtivo = null`; `<CronometroDescanso>` deixa de ser renderizado; `onDescansoConcluido?.()` chamado exatamente uma vez | FR-009 |
| `descansoAtivo?.exercicioId === exercicioSelecionado.id` (dentro de `ExercicioExecucao`) | `emDescanso = true` passado para `ExercicioExecucao`; área de carga/repetições e "Concluir série" ocultas | FR-014 |

## Comportamento observável (novo, em relação ao RF04)

| Entrada | Estado exibido | FR relacionado |
|---------|------------------|------------------|
| Concluir série com `descansoSeg` válido (não é a última série do exercício) | Teclado fecha; cronômetro aparece contando a partir de `descansoSeg`, sem ação extra | FR-001, FR-002, FR-013 |
| Tocar "+15s"/"-15s" repetidamente | Tempo exibido aumenta/diminui 15s por toque, refletido imediatamente | FR-004, FR-005 |
| Navegar para a lista de exercícios do mesmo treino (dentro da rota `[treinoId]`) e voltar | Tempo exibido reflete o tempo real decorrido, não o valor de antes de sair | FR-007 |
| Minimizar o app e reabrir | Tempo exibido reflete o tempo real decorrido em segundo plano; se já teria zerado, exibe zero e dispara conclusão | FR-008, FR-009 |
| Concluir nova série com cronômetro anterior ainda ativo | Cronômetro reinicia com o `descansoSeg` do novo exercício, substituindo o anterior | FR-011 |
| Exercício sem `descansoSeg` (ou zero) | Nenhum cronômetro é exibido; conclusão é considerada imediata | FR-010 |
| Concluir a última série planejada do exercício | Teclado fecha; nenhum cronômetro é exibido — fluxo segue direto para "Concluir exercício" | FR-012 |
| Enquanto o cronômetro está ativo e o exercício em descanso está selecionado na tela | Área de carga/repetições e botão "Concluir série" ficam ocultos; indicativo "Próxima: série X de Y — aguarde o fim do descanso" e séries já concluídas continuam visíveis | FR-014 |
| Cronômetro chega a zero enquanto o exercício em descanso está selecionado | Área de carga/repetições e botão "Concluir série" reaparecem normalmente | FR-014 |

## Fora de escopo desta feature (reforçando o já documentado na spec)

- Som/vibração ao concluir o descanso: RF06 — esta feature apenas dispara
  `onDescansoConcluido`.
- Persistência do cronômetro em `AsyncStorage`: fora de escopo (Assumptions da
  spec) — o descanso não sobrevive ao fechamento completo do app.
- Múltiplos cronômetros simultâneos (ex.: entre treinos diferentes em andamento):
  não suportado — o cronômetro é sempre relativo à rota/execução ativa no
  momento.
- Sobrevivência a troca de aba do app (ex.: navegar para um futuro histórico do
  RF08): `[treinoId].tsx` é empilhada por cima do navegador de tabs, não
  aninhada nele — sair para outra aba hoje exigiria um "voltar" que desmonta a
  rota e, com ela, o estado do cronômetro. Ver research.md (Decisão 2) e
  quickstart.md (Cenário 3b) para o registro dessa limitação e o que precisaria
  mudar para superá-la.
