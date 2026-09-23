# Phase 0 Research: Importar Múltiplos Treinos de um Único Arquivo

**Feature**: `012-importar-multiplos-treinos` | **Date**: 2026-09-22

A spec não deixou nenhum `[NEEDS CLARIFICATION]` pendente (FR-003 e FR-006 já
resolvidos com o usuário). As decisões abaixo cobrem os pontos técnicos que a spec
não especifica por não ser seu papel (spec descreve comportamento observável, não
implementação) — orientadas pela instrução explícita do usuário ao rodar `/speckit.plan`.

## Decisão 1: Reaproveitar `validarEstruturaTreino`/`validarExercicio` sem duplicar lógica

**Decision**: A validação por treino (`validarEstruturaTreino`) e por exercício
(`validarExercicio`), já existentes em `src/services/treino-storage.ts` desde o RF01,
são reaproveitadas sem alteração de assinatura. É extraída uma nova função pura
`montarTreinoValido(bruto: unknown): TreinoValidoOuIgnorado` que encapsula a sequência
já usada hoje dentro de `processarConteudo` — chamar `validarEstruturaTreino`, depois
`validarExercicio` para cada item de `exerciciosBrutos`, e montar o objeto `Treino`
final (com `id`/`perfilId`/`importadoEm`) — mas **sem** ler/escrever `AsyncStorage`
(responsabilidade de persistência sai da função de validação/montagem).

**Rationale**: hoje `processarConteudo` mistura três responsabilidades — parse de
JSON, validação/montagem de um treino, e persistência. Extrair só a parte de
validação/montagem em uma função pura permite chamá-la N vezes (uma por elemento do
array) ou 1 vez (objeto único) sem duplicar a lógica de validação, exatamente como
pedido pelo usuário.

**Alternatives considered**: duplicar a lógica de validação dentro de um novo branch
"array" — rejeitado explicitamente pelo usuário (risco de divergência entre os dois
caminhos ao longo do tempo, viola Princípio II da constituição — simplicidade).

## Decisão 2: Detecção do formato pela raiz do JSON parseado

**Decision**: Em `processarConteudo`, logo após `JSON.parse`, um `Array.isArray(bruto)`
decide o caminho: array → itera cada elemento chamando `montarTreinoValido`; não-array
→ trata como hoje (um único treino, via `montarTreinoValido` chamado uma vez). Nenhuma
outra heurística de detecção é usada (ex.: não se tenta inferir "múltiplos treinos" por
uma chave `treinos` dentro de um objeto — fora do escopo da spec, que define
explicitamente "array na raiz" como o único formato múltiplo suportado).

**Rationale**: é exatamente o contrato descrito na spec (FR-001/FR-002) e a instrução
do usuário — a raiz do JSON já carrega toda a informação necessária para decidir o
caminho, sem precisar de nenhum parâmetro novo ou escolha do usuário (Assumption
"Detecção automática pela mesma ação já existente").

**Alternatives considered**: aceitar também `{ "treinos": [...] }` como formato
alternativo — rejeitado; fora do escopo desta spec (o fixture de teste e a descrição
do usuário usam array na raiz, não um objeto com chave `treinos`).

## Decisão 3: Novo tipo de resultado para o caminho de múltiplos treinos

**Decision**: É criado um novo tipo `ResultadoImportacaoMultipla` (`src/types/treino.ts`),
usado apenas quando a raiz do JSON é um array. O tipo `ResultadoImportacao` existente
(usado no caminho de objeto único) não é alterado — preserva 100% o contrato hoje
consumido pela UI (FR-002/FR-008: nenhuma mudança perceptível para arquivos de treino
único). `importarTreino`/`importarTreinoExemplo` passam a retornar
`ResultadoImportacao | ResultadoImportacaoMultipla | null`, e o call site
(`src/app/(tabs)/index.tsx`, `exibirResultadoImportacao`) usa um type guard (`'treinos'
in resultado`) para escolher a mensagem correta.

**Rationale**: a spec exige que o caminho de treino único continue com comportamento
**idêntico** (FR-002) — reaproveitar o mesmo tipo para os dois casos forçaria excesso
de campos opcionais (`treino?`, `treinos?`) e checagens condicionais espalhadas pela UI
já existente, além de arriscar uma mudança sutil no shape que a UI atual (RF01/RF02) já
consome. Um tipo novo, dedicado ao caminho novo, é mais simples de raciocinar e isola o
risco de regressão (Princípio II).

**Alternatives considered**: estender `ResultadoImportacao` com um campo opcional
`treinos?: Treino[]` — rejeitado, obrigaria a UI existente a saber lidar com um shape
"maybe-batch" mesmo no caminho que deveria permanecer inalterado.

## Decisão 4: Persistência em uma única leitura/escrita do `AsyncStorage`

**Decision**: Ao importar um array com múltiplos treinos válidos, a leitura do estado
atual (`getTreinosState`) e a escrita do novo estado (`setTreinosState`) ocorrem **uma
única vez**, após validar todos os elementos do array — não uma leitura/escrita por
treino do array.

**Rationale**: evita condição de corrida entre escritas concorrentes no mesmo
`AsyncStorage` (que não é transacional) e é mais eficiente — sem essa decisão, N
treinos no array gerariam N ciclos de leitura+escrita sequenciais no mesmo storage.

**Alternatives considered**: reaproveitar `processarConteudo` do caminho single
chamando-o em loop, uma vez por elemento do array — rejeitado, geraria N
leitura/escritas separadas do `AsyncStorage` e dificultaria a mensagem resumida única
exigida pelo FR-006 (cada chamada teria seu próprio resultado isolado).

## Resumo das entidades técnicas afetadas

- `src/services/treino-storage.ts`: refatorado internamente (nova função pura
  `montarTreinoValido`); `processarConteudo` ganha o branch de array;
  `importarTreino`/`importarTreinoExemplo` passam a poder retornar o novo tipo.
- `src/types/treino.ts`: novo tipo `ResultadoImportacaoMultipla` (e `TreinoIgnorado`,
  ver `data-model.md`).
- `src/app/(tabs)/index.tsx`: `exibirResultadoImportacao` ganha um branch para o novo
  tipo de resultado.
