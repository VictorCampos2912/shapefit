# Research: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Feature**: `024-indicador-andamento-e-menu-acoes` | **Date**: 2026-10-14

Investigação pedida explicitamente antes do plano (itens a-e do `/speckit.plan`).
Nenhum `NEEDS CLARIFICATION` estava pendente do `spec.md` em si — as decisões abaixo
resolvem **como** implementar dentro do comportamento já definido pela spec, e
confirmam (ou corrigem) as suposições registradas em "Assumptions".

## Decisão 1 (item a) — Reaproveitar o padrão visual de `exercicio-list-item.tsx`

- **Decision**: `TreinoListItem` (`src/components/treino/treino-list-item.tsx`) ganha
  uma prop booleana nova (ex.: `emAndamento?: boolean`) e replica exatamente o mesmo
  par de decisões já usado por `ExercicioListItem` para o estado `'pausado'`
  (`src/components/treino/exercicio-list-item.tsx:20-21,29`): `ThemedView`
  com `type="warningBackground"` e `borderWidth: 2, borderColor: theme.warning`
  quando `emAndamento` é `true`. Nenhum componente ou estilo novo é criado — é o
  mesmo par cor de fundo/borda, só aplicado a um componente diferente.
- **Rationale**: inspeção direta de `exercicio-list-item.tsx` confirma que o "destaque
  de exercício em andamento" não é um componente compartilhado nem uma constante de
  estilo exportada — é só a combinação `ThemedView type="warningBackground"` +
  `borderWidth`/`borderColor: theme.warning`, montada inline dentro do componente.
  Reaproveitar isso em `TreinoListItem` é uma cópia direta do mesmo padrão (os dois
  componentes já têm `styles.container` quase idênticos: `borderRadius: Spacing.two`,
  `paddingHorizontal/Vertical: Spacing.three`), sem precisar extrair um componente
  compartilhado para satisfazer o requisito de "mesma linguagem visual, sem padrão
  novo" (FR-001).
- **Alternatives considered**: extrair um componente `DestaqueEmAndamento` ou uma
  constante de estilo compartilhada entre `ExercicioListItem` e `TreinoListItem` —
  rejeitada por introduzir uma abstração nova para dois usos simples e já
  praticamente idênticos (Princípio II); nada na spec exige que o código seja
  compartilhado, só que o resultado visual seja o mesmo.

## Decisão 2 (item b) — Derivar "tem sessão em andamento" sem nova forma de leitura

- **Decision**: `src/app/(tabs)/index.tsx` passa a chamar, por treino, a função já
  existente e já exportada `obterSessao(uid, treino.id)`
  (`src/services/sessao-treino-storage.ts:22-25` — já retorna a sessão com
  `finalizadaEm === null` do treino, ou `null`), no mesmo padrão `Promise.all` já
  usado por `carregarContagens`/`carregarDatasFinalizacao`
  (`index.tsx:70-84`, chamando `contarSessoesFinalizadas`/
  `obterDataUltimaSessaoFinalizada`). Uma terceira função irmã (ex.:
  `carregarSessoesEmAndamento`) popula um `Record<string, boolean>` (treino.id →
  tem sessão em andamento), do mesmo jeito que as outras duas populam seus próprios
  `Record`s — chamada dentro do mesmo `Promise.all` já existente em
  `recarregarTreinos`/`useEffect`/`useFocusEffect`, sem adicionar uma nova rodada de
  carregamento.
- **Rationale**: `obterSessao` já existe, já é exportada, e já faz exatamente a
  leitura necessária (usada hoje por `treino/[treinoId].tsx` para saber se há uma
  sessão em andamento ao abrir a tela de execução) — não é preciso escrever nenhuma
  consulta nova a `AsyncStorage`. Ela internamente chama a mesma função privada
  `getSessoes(perfilId)` já chamada por `contarSessoesFinalizadas` e
  `obterDataUltimaSessaoFinalizada` — ou seja, o "tipo" de leitura (um
  `AsyncStorage.getItem` da chave `sessoes:<uid>`, seguido de filtro em memória) já é
  exatamente o mesmo que a lista faz hoje duas vezes por treino; esta feature
  simplesmente adiciona uma terceira chamada do mesmo tipo, no mesmo lugar, chamada em
  paralelo com as outras duas via `Promise.all` já existente — sem novo mecanismo de
  leitura, sem nova chave de storage, sem alterar `sessao-treino-storage.ts`.
- **Alternatives considered**: ler todas as sessões do perfil uma única vez
  (`getSessoes` tornada exportada) e derivar contagens, data de finalização e sessão
  em andamento de uma só leitura, eliminando as leituras repetidas já existentes —
  rejeitada por ser uma refatoração de código que já funciona e já está validado em
  produção (RF02/RF16), fora do pedido desta feature ("não alterar nada fora do
  necessário"); o ganho de performance é irrelevante neste volume de dados (poucos
  treinos por conta) e o risco de regressão em código já validado não se justifica
  para esta feature.

## Decisão 3 (item c) — A lista já recebe foco de volta hoje; nenhuma mudança de navegação é necessária

- **Decision**: nenhuma alteração de navegação/roteamento é necessária. O
  `useFocusEffect` já existente em `index.tsx:124-129` (chama `recarregarTreinos()`
  sempre que a tab "Meus treinos" volta a ficar em foco) já é o mecanismo que o
  FR-004 precisa, e ele já dispara de forma confiável quando o usuário volta da tela
  de execução (`src/app/treino/[treinoId].tsx`) para a lista.
- **Rationale**: inspeção de `treino/[treinoId].tsx` mostra que a tela **não** chama
  `router.back()`/`router.push()` em nenhum momento — nem `handleFinalizarTreino`
  (linhas 334-347, só reseta estado local e permanece na mesma tela) nem
  `handleVoltarParaLista` (linha 201-203, um toggle interno entre a lista de
  exercícios e o exercício selecionado, dentro da própria tela). O arquivo nem importa
  `router` de `expo-router` (só `useLocalSearchParams`). A única forma de sair dessa
  tela de volta para a tab "Meus treinos" é o gesto/botão de voltar nativo do sistema
  (gesto do iOS, botão/gesto físico do Android) sobre a pilha de navegação criada por
  `router.push({ pathname: '/treino/[treinoId]', ... })` em `index.tsx:132`. Esse é
  exatamente o mesmo caminho de retorno que a RF02/RF16 já usa hoje, em produção
  validada (`docs/criterios-aceite.md`, RF16: "A data exibida sempre acompanha a
  sessão finalizada mais recente — atualiza ao finalizar uma nova sessão do mesmo
  treino"), para atualizar contagens e "Finalizado em" ao voltar — ou seja, o próprio
  FR-004 desta feature já está, na prática, coberto por um mecanismo já em produção e
  já validado em Android e iOS para o cenário equivalente. Isso resolve o item
  registrado em "Assumptions" do `spec.md` ("Mecanismo de foco ao voltar da execução
  precisa ser confirmado no plano") — confirmado: nenhum ajuste de roteamento é
  necessário.
- **Alternatives considered**: assinar um listener de foco dedicado dentro de
  `treino/[treinoId].tsx` para forçar uma atualização explícita antes de voltar —
  rejeitada porque não existe nenhum caminho de saída programático nessa tela hoje
  (a saída é só pelo gesto nativo), e o próprio React Navigation/Expo Router já
  dispara o evento de foco na tela anterior quando a pilha é desempilhada por
  qualquer meio (gesto, botão físico, ou código) — não há necessidade de nenhum
  código adicional.

## Decisão 4 (item d) — Levantamento exaustivo de referências a "treino de exemplo"

- **Decision**: a remoção toca exatamente estes 4 arquivos/artefatos:
  1. `src/app/acoes.tsx` — remove o `Pressable` "Importar treino de exemplo"
     (linhas 146-149) e a função `handleImportarTreinoExemplo` (linhas 114-123); a
     importação de `importarTreinoExemplo` (linha 12) é removida da lista de imports.
  2. `src/services/treino-storage.ts` — remove a função exportada
     `importarTreinoExemplo` (linhas 310-315) e a importação do asset
     `import treinoExemplo from '@/assets/exemplos/treino-exemplo.json'` (linha 5);
     a função compartilhada `processarConteudo` (usada também por `importarTreino`)
     **permanece**, sem alteração.
  3. `assets/exemplos/treino-exemplo.json` — arquivo apagado (fica sem nenhuma
     referência no código depois dos dois pontos acima).
  4. `docs/criterios-aceite.md` — nota de emenda nas entradas do RF01 e do RF14
     (FR-012 do `spec.md`), sem apagar o texto histórico.
  Nenhum outro arquivo de código-fonte do app (`src/**`) referencia
  `importarTreinoExemplo`, `treinoExemplo` ou `assets/exemplos` — confirmado por busca
  textual em todo `src/`.
- **Rationale**: busca por `importarTreinoExemplo`/`treino-exemplo.json`/
  `assets/exemplos`/`"Importar treino de exemplo"` em todo o repositório (excluindo
  `node_modules`) encontra, fora dos 2 arquivos de código acima, **só** especificações
  já fechadas e históricas: `specs/002-importar-treino-json/`,
  `specs/003-listar-treinos/`, `specs/012-importar-multiplos-treinos/`,
  `specs/015-menu-de-acoes/`, `specs/017-categorias-exercicio/`,
  `specs/020-catalogo-exercicios/` e `specs/022-autenticacao-google-firestore-treinos/`
  — todas já implementadas e validadas, descrevendo código como ele era (ou é) no
  momento de cada uma. Seguindo o mesmo princípio já aplicado nesta base de specs
  (RF14 manteve seu texto histórico com uma nota de emenda ao lado quando "trocar
  perfil" virou "sair da conta", spec 022; `021-imagens-exercicios/spec.md` recebeu uma
  nota de emenda em vez de reescrita quando a 023 estendeu seu FR-003), **nenhuma**
  dessas specs antigas é editada por esta feature — são registro histórico, não
  código vivo. Confirmado também, por inspeção de `src/components/ui/icons.tsx`, que
  `ImportarIcon` (usado pelo Pressable removido) continua em uso pelo Pressable
  "Importar treino" que permanece em `acoes.tsx` — não é removido.
  `docs/exemplos/treino-exemplo.json` (e os outros 3 arquivos de
  `docs/exemplos/`) têm o mesmo tamanho em bytes que `assets/exemplos/treino-exemplo.json`
  (1011 bytes, cópia original feita pela tarefa T003 da spec 002), mas são arquivos
  distintos em caminhos distintos — nenhum deles é importado por nenhum código em
  `src/`; são usados só manualmente, selecionados pelo seletor de arquivo do sistema
  durante testes de importação (RF01/RF11), confirmando FR-011 e a restrição explícita
  do usuário de não tocar em `docs/exemplos/`.
- **Alternatives considered**: também emendar as specs históricas que mencionam
  `importarTreinoExemplo` (002, 003, 012, 015, 017, 020, 022) — rejeitada; alterar
  registros históricos de specs já fechadas e validadas não é prática deste
  repositório (precedente: RF14/RF21 usam nota de emenda só no documento vivo mais
  próximo — `criterios-aceite.md`/a spec estendida —, não em cada spec antiga que
  menciona o código de passagem).

## Decisão 5 (item e) — Acrescentar um rótulo de texto curto, não só cor

- **Decision**: sim — `TreinoListItem` exibe um texto curto (sugestão: "Em
  andamento", em negrito pequeno, cor `warning`) junto do destaque de cor/borda
  quando `emAndamento` é `true`, no mesmo espírito de
  `ExercicioListItem` (`exercicio-list-item.tsx:37-41`, texto "⏸ Em andamento
  (pausado)" ao lado do destaque de cor). O texto exato (ex.: incluir ou não um
  ícone/símbolo) é um detalhe de implementação a resolver em `tasks.md`; a decisão
  desta fase é que **deve existir texto**, não só cor.
- **Rationale**: busca por todo uso de `warningBackground`/`theme.warning` como
  indicador de estado no app encontra exatamente dois precedentes —
  `exercicio-list-item.tsx` (estado `'pausado'`) e o banner "Hora de trocar o treino"
  em `index.tsx:160-166` — e **os dois** sempre combinam a cor com um texto
  explicativo ao lado; não existe, hoje, nenhum precedente de destaque só por cor
  neste app. Introduzir o primeiro destaque só-por-cor neste ponto quebraria essa
  consistência e criaria um sinal mais fraco (mais fácil de não notar, pior para
  usuários com baixa percepção de contraste de cor) exatamente no requisito que
  motivou toda a feature (o usuário "esquecer" qual treino estava em andamento).
  Resolve o ponto deixado aberto em "Assumptions" do `spec.md` ("Destaque só por cor
  pode passar despercebido... decisão que fica para o `/speckit.plan`") — decidido:
  acrescentar o texto.
- **Alternatives considered**: manter só o destaque de cor/borda, sem texto, por
  minimalismo — rejeitada pela falta de precedente no próprio app (os dois usos
  existentes de `warning` sempre têm texto) e pelo risco de passar despercebido, que
  é precisamente o problema que a US1 da spec existe para resolver.

## Decisão 7 (item b do `/speckit-tasks`) — `SessaoTreino` só existe a partir da primeira série concluída

- **Decision**: confirmado por inspeção direta do código que uma `SessaoTreino` só é
  criada dentro de `registrarSerieConcluida`
  (`src/services/sessao-treino-storage.ts:64-98`) — função chamada exclusivamente
  por `handleConcluirSerie` em `src/app/treino/[treinoId].tsx:205-220`, ou seja, só
  quando o usuário conclui a **primeira série** de algum exercício do treino. Abrir
  um exercício e tocar em "Iniciar exercício" (`iniciado: true`, linha 85) é só
  estado local de UI (`EstadoExecucaoExercicio`), nunca grava nada em
  `AsyncStorage`. Não existe nenhum outro ponto no código que crie uma
  `SessaoTreino`. Corrigido o edge case do `spec.md` que, antes desta verificação,
  afirmava (incorretamente) que uma sessão com `finalizadaEm === null` e zero
  séries registradas era um caso possível/aceito — esse caso é, na verdade,
  impossível no código atual, porque o próprio ato de criar o registro de sessão
  já inclui a primeira série.
- **Rationale**: o pedido explícito do `/speckit-tasks` era verificar essa premissa
  antes de gerar as tarefas, exatamente porque o `spec.md` original (fase de
  `/speckit.specify`) tinha escrito esse edge case por suposição, sem checar o
  código — um erro que, se não corrigido, levaria a uma tarefa de implementação
  tentando cobrir um cenário que nunca ocorre (ou, peor, a um teste manual no
  `quickstart.md` esperando um resultado que o código nunca produz). Não há impacto
  nos FRs (FR-001 já falava apenas em "sessão com `finalizadaEm === null`", sem
  nunca mencionar contagem de séries) nem nos Acceptance Scenarios de US1 (já
  exigiam "completar ao menos uma série" no Independent Test) — só o edge case
  precisou de correção.
- **Alternatives considered**: nenhuma — esta decisão é a constatação de um fato do
  código já existente, não uma escolha de design com alternativas.
