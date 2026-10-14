# Quickstart: Observação por Exercício e Imagem para Exercício Composto (Bi-set)

**Feature**: `023-observacao-e-imagens-bi-set`

Validação manual em Android e iOS (Princípio III) — iOS pendente por falta de
conta Apple Developer (mesma situação herdada da spec 022).

## Pré-requisitos

- Conta autenticada (spec 022) com acesso à lista de treinos.
- Um arquivo JSON de importação (RF01/RF11) com pelo menos um exercício com
  `observacao` preenchida, um sem o campo, e um exercício de nome composto no
  padrão bi-set cujas partes existem no catálogo (specs 020/021). Este arquivo
  vive em `docs/exemplos/treino-observacao-bi-set.json` (criado como parte da
  implementação desta spec — ver `tasks.md`), reproduzido abaixo por
  referência — `descanso_seg` está presente porque é obrigatório no schema
  (RF01); `categoria` foi omitido de propósito em todo exercício, para
  confirmar que o campo é opcional (RF17 aplica o default `"peso"` quando
  ausente):

```json
{
  "nome": "Treino de teste — observação e bi-set",
  "exercicios": [
    {
      "id": "supino-reto",
      "nome": "Supino reto (barra)",
      "series": 3,
      "reps_alvo": "8-10",
      "carga_sugerida_kg": 40,
      "descanso_seg": 90,
      "observacao": "Pausa de 2s no fundo do movimento."
    },
    {
      "id": "rosca-direta",
      "nome": "Rosca direta com barra",
      "series": 3,
      "reps_alvo": "10-12",
      "carga_sugerida_kg": 20,
      "descanso_seg": 60
    },
    {
      "id": "biset-peito",
      "nome": "Supino reto (barra) + Crucifixo no cabo (Bi-set)",
      "series": 3,
      "reps_alvo": "10",
      "carga_sugerida_kg": 30,
      "descanso_seg": 60,
      "observacao": "Registrar carga/reps do supino; no crucifixo, reduzir carga e ir até a falha."
    },
    {
      "id": "biset-repetido",
      "nome": "Rosca direta com barra + Rosca direta com barra (Bi-set)",
      "series": 3,
      "reps_alvo": "10",
      "carga_sugerida_kg": 20,
      "descanso_seg": 60
    }
  ]
}
```

- **Nomes do catálogo usados nos Cenários 5 e 6 — confirmar antes de rodar**:
  os nomes `"Supino reto (barra)"`, `"Crucifixo no cabo"` e `"Rosca direta com
  barra"` usados no JSON acima precisam corresponder exatamente (campo
  `nome`, igualdade literal, antes mesmo de qualquer normalização) a itens de
  `assets/catalogo/exercicios.json` — confirmado em 2026-10-08 que os três
  existem exatamente com esses nomes no catálogo atual. Se o catálogo mudar
  antes de rodar este quickstart (curadoria de novos itens é trabalho futuro,
  fora de escopo desta spec — ver Assumptions), reconferir os três nomes e
  ajustar o JSON de teste acima antes de executar os Cenários 5 e 6 — um nome
  que não bater mais faria esses cenários cair no caminho de "sem
  correspondência" (FR-013) em vez de validar o caminho de "partes
  encontradas" (FR-011) que eles pretendem cobrir.
- Fixtures adicionais, todos em `docs/exemplos/` (sem nenhum nome de pessoa,
  mesmo cuidado já tomado para o arquivo principal), um treino por arquivo,
  cada um com um campo `nome` de treino distinto para ser identificável na
  lista depois de importado — para o Cenário 3: `treino-observacao-invalida.json`
  (`"observacao": 123`, nome do treino terminando em "— observação 123"),
  `treino-observacao-null.json` (`"observacao": null`, "— observação null"),
  `treino-observacao-vazia.json` (`"observacao": ""`, "— observação vazia"),
  `treino-observacao-espacos.json` (`"observacao": "   "`, "— observação
  espaços"); para o Cenário 4: `treino-observacao-longa.json`, com uma
  `observacao` de ~600 caracteres.
- Capturas de tela de referência de **antes** desta feature (Cenário 7),
  feitas em Android antes de qualquer mudança de código (`tasks.md`, T000),
  guardadas fora do repositório.

## Cenário 1 — Observação aparece na execução (US1)

1. Importar o arquivo de teste. Abrir o exercício `supino-reto` (tem
   `observacao`) na execução, antes de tocar em "Iniciar exercício".
2. **Esperado**: o texto da observação aparece em destaque secundário, acima
   do botão "Iniciar exercício" (FR-004).
3. Tocar em "Iniciar exercício" e começar o registro da primeira série.
4. **Esperado**: o texto da observação continua visível (FR-004, "durante as
   séries").
5. Abrir o mesmo exercício na lista de exercícios do treino (antes de entrar
   na execução) e, depois, no histórico de evolução (RF08) de uma sessão já
   finalizada que o inclua.
6. **Esperado**: a observação NÃO aparece em nenhuma das duas telas (FR-006).

## Cenário 2 — Sem observação, nenhuma mudança (US2)

1. Abrir, na execução, o exercício `rosca-direta` (sem o campo `observacao`).
2. **Esperado**: nenhum espaço reservado, nenhum placeholder — tela idêntica à
   versão anterior a esta feature (FR-005).
3. Fechar o app completamente (não só minimizar) e reabrir.
4. **Esperado**: o treino de teste continua aparecendo na lista de treinos,
   com a observação preservada em `supino-reto`/`biset-peito` e ausente em
   `rosca-direta` (FR-008/FR-009, SC-004) — cobre o risco de a gravação
   assíncrona no Firestore (`setDocTreino`, fire-and-forget) ter falhado
   silenciosamente.
5. **Importante — o passo 4 não é suficiente por si só**: reabrir o app lê o
   treino do cache local offline do Firestore, que já existe antes mesmo de o
   `setDoc` confirmar no servidor (é exatamente esse fire-and-forget que
   motiva o FR-009) — ou seja, o passo 4 prova que o dado sobrevive a um
   reinício do app, mas não prova que o servidor de fato aceitou a
   gravação. Para confirmar isso, abrir o Firebase Console → Firestore
   Database → `users/{uid}/treinos/{id-do-treino-de-teste}` e inspecionar o
   array `exercicios` diretamente no servidor:
   - o exercício `rosca-direta` **não tem** a chave `observacao` no documento
     (nem `observacao: null`, nem `observacao: ""` — a chave inteira ausente,
     FR-008);
   - os exercícios `supino-reto` e `biset-peito` **têm** a chave `observacao`
     com a string exata que foi importada.

## Cenário 3 — Campo `observacao` inválido é descartado, e os casos tratados como "sem observação" não (US2, FR-002/FR-003)

1. Importar `docs/exemplos/treino-observacao-invalida.json`
   (`"observacao": 123`, número, não string).
2. **Esperado**: o alerta de importação lista esse exercício como ignorado,
   com motivo `Exercício {indice}: campo "observacao" inválido`; os demais
   exercícios do mesmo treino são importados normalmente.
3. Importar, separadamente, cada um destes três arquivos:
   `treino-observacao-null.json` (`"observacao": null`),
   `treino-observacao-vazia.json` (`"observacao": ""`),
   `treino-observacao-espacos.json` (`"observacao": "   "` — só espaços).
4. **Esperado**, nos três casos do passo 3: a importação NÃO descarta o
   exercício e NÃO aparece nenhum motivo de erro para ele no alerta — cada
   treino importa normalmente e o exercício se comporta como sem observação
   na execução (FR-002, mesmo resultado do Cenário 2), nunca pelo caminho de
   erro do passo 2.

## Cenário 4 — Observação longa não esconde o registro da série (US3, FR-007)

1. Antes de importar, aumentar a fonte do sistema do aparelho para o maior
   tamanho de acessibilidade disponível (Configurações → Acessibilidade/
   Exibição → Tamanho da fonte/Fonte grande, em Android; Ajustes →
   Acessibilidade → Texto Grande, em iOS) — necessário para forçar o estouro
   de forma confiável: com o tamanho de fonte padrão, mesmo ~600 caracteres
   de observação podem não ser suficientes para exceder a altura de telas
   maiores, escondendo o próprio bug que este cenário existe para pegar.
2. Importar `docs/exemplos/treino-observacao-longa.json` (observação de
   ~600 caracteres). Abrir esse exercício em um aparelho/emulador de tela
   pequena, com a fonte do sistema já aumentada, e iniciá-lo.
3. **Esperado**: mesmo com o texto longo ocupando bastante espaço vertical, os
   campos de registro (carga/reps) e o botão "Concluir série" continuam
   alcançáveis — por rolagem (`contracts/execucao-treino-screen.md`, item 3).
4. Concluir uma série e confirmar que o cronômetro de descanso (RF05/RF06)
   aparece normalmente, sem a observação sobrepor ou escondê-lo.
5. Com o mesmo exercício (observação longa, teclado de reps aberto), digitar
   um valor no campo de repetições e, **sem fechar o teclado antes**, tocar
   diretamente no botão "Concluir série".
6. **Esperado**: um único toque já conclui a série (o teclado some e a série é
   registrada na mesma interação) — o `ScrollView` introduzido para resolver
   o FR-007 não pode exigir um segundo toque "só para fechar o teclado"
   antes do botão responder (`contracts/execucao-treino-screen.md`, item 3,
   `keyboardShouldPersistTaps="handled"`). Repetir em um exercício sem
   observação, como controle, para confirmar que o comportamento de toque
   único já existia e não regrediu.

## Cenário 5 — Imagens de um exercício composto (bi-set) (US4/US5, FR-010-014)

1. Abrir, na execução, o exercício `biset-peito` ("Supino reto (barra) +
   Crucifixo no cabo (Bi-set)").
2. **Esperado**: como o nome inteiro não corresponde a nenhum item do
   catálogo, mas "Supino reto (barra)" e "Crucifixo no cabo" (depois de
   remover o sufixo e separar por `" + "`) correspondem cada um a um item do
   catálogo (spec 020), as duas imagens aparecem lado a lado, cada uma
   legendada com o nome do item do catálogo correspondente (FR-011).
3. Repetir com o mesmo exercício, mas usando "Supino reto (barra) + Crucifixo
   no cabo" (sem o sufixo "(Bi-set)") — **esperado**: mesmo resultado (FR-010,
   sufixo opcional para a separação).
4. Editar o exercício para que só uma das duas partes exista no catálogo (ex.:
   trocar "Crucifixo no cabo" por um nome inventado) — **esperado**: só a
   imagem da parte encontrada aparece, sem nada no lugar da outra (FR-012).
5. Editar o exercício para que nenhuma das partes exista no catálogo —
   **esperado**: nenhuma imagem aparece, tela idêntica à de um exercício sem
   correspondência (FR-013, mesmo comportamento da spec 021).
6. Abrir um exercício cujo nome não contém `" + "` — **esperado**: nenhuma
   tentativa de separação em partes, comportamento inalterado em relação à
   spec 021.

## Cenário 6 — Nome composto com as duas partes repetidas (edge case, FR-011)

1. Abrir, na execução, o exercício `biset-repetido` ("Rosca direta com barra +
   Rosca direta com barra (Bi-set)") — as duas partes, depois de normalizadas,
   são idênticas e correspondem ao mesmo item do catálogo.
2. **Esperado**: a mesma imagem aparece duas vezes, lado a lado, cada uma com
   sua própria legenda igual ("Rosca direta com barra") — sem deduplicação
   (`spec.md`, Edge Cases) e sem nenhum erro/aviso de chave duplicada na
   lista renderizada (`contracts/execucao-treino-screen.md`, item 2, key
   `` `${item.id}-${indice}` ``).

## Cenário 7 — Paridade visual sem observação (regressão, FR-005/FR-007, SC-002)

Cenário dedicado a confirmar que a introdução do `ScrollView` (Decisão 3) e
das demais mudanças desta feature não alteram **em nada** a aparência ou o
comportamento de um exercício sem observação e sem nome composto — já
coberto implicitamente pelo Cenário 2, mas aqui como um comparativo visual
explícito, tela a tela. Executar em **Android** (iOS permanece pendente de
validação por falta de conta Apple Developer, mesma situação da spec 022 —
Princípio III).

1. Usar as capturas de tela de referência feitas **antes de qualquer mudança
   de código** desta feature (`tasks.md`, T000) — exercício comum na
   execução (antes de iniciar e durante uma série), lista de exercícios do
   treino e histórico de evolução.
2. Com o app já atualizado com esta feature, abrir exatamente a mesma tela
   (mesmo exercício, mesmo treino), no mesmo aparelho — usando um treino que
   já estava importado **antes** desta feature existir, cujo documento no
   Firestore não tem (e nunca teve) a chave `observacao` (precondição
   importante: comparar contra um treino antigo, não um recém-importado por
   esta spec, para isolar o efeito da mudança de tela das mudanças de dados).
3. **Esperado**: nenhuma diferença visual perceptível entre a captura de
   referência (T000) e a tela atual
   — mesmo espaçamento entre o link "Voltar para exercícios" e o conteúdo do
   exercício (confirma que o `gap` movido para `contentContainerStyle`
   reproduziu exatamente o espaçamento antigo de `safeArea`), nenhuma barra
   de rolagem visível (o conteúdo não excede a tela), nenhum efeito de
   "elástico" ao arrastar verticalmente quando não há nada para rolar
   (`alwaysBounceVertical={false}`), e o fluxo de registrar uma série e
   tocar em "Concluir série" funcionando com o mesmo número de toques de
   antes (RNF03).
4. Repetir o mesmo comparativo para a tela de histórico de evolução (RF08) e
   para a lista de exercícios do treino (branch sem exercício selecionado,
   que não foi alterada) — **esperado**: nenhuma diferença em nenhuma das
   duas.

## Referências

- Contratos: [`contracts/treino-storage.md`](./contracts/treino-storage.md),
  [`contracts/catalogo-exercicios.md`](./contracts/catalogo-exercicios.md),
  [`contracts/execucao-treino-screen.md`](./contracts/execucao-treino-screen.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User
  Story)
- Emenda registrada: `specs/021-imagens-exercicios/spec.md`, FR-003 (nota de
  emenda já aplicada, ver `spec.md` desta feature, Assumptions)
