# Contract: Menu de Ações — remoção de "Importar treino de exemplo"

**Feature**: `024-indicador-andamento-e-menu-acoes`

Contrato interno (tela + serviço — não há API HTTP nesta feature). Altera
`src/app/acoes.tsx` e `src/services/treino-storage.ts`; apaga
`assets/exemplos/treino-exemplo.json`; **não** altera `processarConteudo`,
`importarTreino`, nenhum ícone (`ImportarIcon` continua em uso pelo Pressable
"Importar treino" que permanece) nem qualquer arquivo em `docs/exemplos/`.

## `src/app/acoes.tsx` (alterado) — FR-008/FR-009

Removidos, sem substituição:

- A função `handleImportarTreinoExemplo` (linhas 114-123).
- O `Pressable` "Importar treino de exemplo" (linhas 146-149).
- `importarTreinoExemplo` da lista de imports de `@/services/treino-storage`
  (linha 12) — `importarTreino` permanece importada e usada.

**Sem alteração**: `handleSairDaConta`, `handleImportarTreino`,
`handleAbrirCreditos` e os três `Pressable`s correspondentes (sair da conta,
importar treino, créditos) — nenhuma linha dentro deles é tocada (FR-009).

## `src/services/treino-storage.ts` (alterado) — FR-008/FR-010

Removidos:

- A função exportada `importarTreinoExemplo` (linhas 310-315).
- O import do asset, `import treinoExemplo from '@/assets/exemplos/treino-exemplo.json';`
  (linha 5).

**Sem alteração**: `processarConteudo` (chamada tanto por `importarTreino` quanto,
hoje, por `importarTreinoExemplo`) permanece exatamente como está — é a função
reaproveitada por `importarTreino`, que continua existindo sem modificação.

## Asset apagado — FR-010/FR-011

- `assets/exemplos/treino-exemplo.json` — apagado. Confirmado (research.md,
  Decisão 4) que, depois das duas remoções de código acima, nenhum arquivo em
  `src/**` importa esse caminho.
- **Não apagar** (FR-011, restrição explícita do usuário): nenhum arquivo em
  `docs/exemplos/` (`treino-exemplo.json`, `treino-exemplo-com-erro.json`,
  `treino-exemplo-duplicado.json`, `treino-exemplo pernas.json`) — são fixtures de
  teste manual, usadas via o seletor de arquivo do sistema (RF01/RF11), sem nenhuma
  referência de código; permanecem intactas, mesmo tendo conteúdo originalmente
  idêntico ao do asset apagado.

## `docs/criterios-aceite.md` (alterado) — FR-012

Nota de emenda (sem apagar o texto original), seguindo o mesmo padrão já usado no
documento (ex.: a nota de "trocar perfil" → "sair da conta" na entrada do RF14):

- **Entrada do RF01**: junto à decisão "App inclui um arquivo de exemplo
  pré-carregado para testes" e ao critério "[X] O arquivo de exemplo pré-carregado
  no app importa sem erros, servindo como referência de teste" — nota indicando que
  a funcionalidade foi removida por esta feature (RF23/spec 024), mantendo o texto
  histórico como registro da validação original.
- **Entrada do RF14**: junto ao critério "As três ações, a partir dessa tela, se
  comportam exatamente como antes" — nota indicando que uma dessas três ações
  ("Importar treino de exemplo") foi removida por esta feature (RF23/spec 024), e
  que a tela de Ações passou a ter só duas ações de ponto de entrada mais os
  créditos (sair da conta, importar treino, créditos — ver RF20 para a entrada dos
  créditos).
