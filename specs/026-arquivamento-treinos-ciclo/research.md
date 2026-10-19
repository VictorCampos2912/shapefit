# Research: Arquivamento Lógico de Treinos, "Encerrar Ciclo" e Tratamento de Sessões Abandonadas

**Feature**: `026-arquivamento-treinos-ciclo` | **Date**: 2026-10-16

Investigação pedida explicitamente antes do plano (itens 1-9 do `/speckit.plan`).

## Decisão 1 (item 1) — Consumidores e onde filtrar, sem `where`/`getDoc`/`limit`

- **Decision**: toda filtragem de treinos arquivados e ciclos encerrados
  acontece **em memória**, sobre o resultado de `getDocs(collection)` sem
  filtro — nunca `where`, nunca `getDoc` de documento único, nunca `limit`
  (lição da spec 025: esses formatos travaram indefinidamente offline neste
  SDK/aparelho; só `getDocs` da coleção inteira funcionou — ver
  `specs/025-migracao-sessoes-historico-ciclo/research.md`, "Validação em
  aparelho"). Mapeamento completo por `grep` real de todo `src/`:

  **`listarTreinos(uid)`** (`treino-storage.ts`) — consumidores:
  | Consumidor | Hoje usa para | Depois desta spec |
  |---|---|---|
  | `src/app/(tabs)/index.tsx` (2 chamadas: `useEffect` inicial e `recarregarTreinos`) | popular "Meus treinos" | filtra com a nova `filtrarTreinosAtivos` antes de `setTreinos` |
  | `src/app/treino/[treinoId].tsx` (1 chamada, no `useEffect` de carregamento) | achar o treino pelo id | **não filtra** — precisa do treino mesmo que arquivado, para distinguir "arquivado" de "não existe" (FR-003) |
  | `src/services/historico-evolucao.ts` (`obterHistoricoPorPerfil`, via `Promise.all`) | semear o "universo de exercícios nunca registrados" (RF08) | filtra com `filtrarTreinosAtivos` antes de semear (FR-005) — `obterHistoricoPorData` não chama `listarTreinos` (spec 025), continua sem chamar |

  **Decisão de assinatura**: `listarTreinos(uid)` **não muda** — continua
  retornando todos os treinos (ativos + arquivados), exatamente como hoje.
  Duas novas funções puras e exportadas em `treino-storage.ts`,
  `filtrarTreinosAtivos(treinos: Treino[]): Treino[]` e
  `filtrarTreinosArquivados(treinos: Treino[]): Treino[]` (mesmo padrão das
  funções puras `encontrarSessaoEmAndamento`/
  `encontrarUltimaSessaoConcluidaNaoRevisada` da spec 025), aplicadas pelo
  chamador que precisa de uma visão filtrada. `[treinoId].tsx`
  deliberadamente **não filtra** — é o único consumidor que precisa ver um
  treino arquivado para poder mostrar a mensagem certa (FR-003), em vez de
  "Treino não encontrado" (mensagem hoje usada só para id inexistente).

  **`obterCicloAtual(uid)`** (`ciclo-treino-storage.ts`) — consumidores:
  | Consumidor | Hoje usa para | Depois desta spec |
  |---|---|---|
  | `src/services/treino-storage.ts` (`processarConteudoArray`, bloqueio de importação, RF15) | checar se há ciclo bloqueando | **nenhuma mudança de código** — `obterCicloAtual` passa a filtrar ciclos encerrados internamente (ver Decisão 7); o chamador continua recebendo `null` quando não há ciclo "atual" bloqueando, só que agora "atual" também exclui encerrados |
  | `src/app/(tabs)/index.tsx` (`carregarCicloAtual`) | exibir anel/aviso de 40 sessões | idem — nenhuma mudança de código, o anel some sozinho quando o ciclo é encerrado porque `obterCicloAtual` passa a retornar `null` |
  | `src/app/acoes.tsx` (**novo** nesta spec) | decidir se mostra/habilita "Encerrar ciclo" (FR-007) | nova chamada, mesma função, zero mudança de contrato |

  **`calcularProgressoCiclo(uid, ciclo)`** — consumidores: `treino-storage.ts`
  (bloqueio) e `index.tsx` (anel). **Nenhuma mudança** — continua somando
  por `ciclo.treinoIds`, independente de algum desses treinos estar
  arquivado (Edge Case do `spec.md`: sessões de treino arquivado continuam
  contando no total de 40, sem redistribuição de cota).

  **`criarCiclo(uid, treinoIds)`** — consumidor único: `treino-storage.ts`
  (`processarConteudoArray`). **Nenhuma mudança de assinatura** — só passa
  a escrever `encerradoEm: null` explicitamente (Decisão 2).

- **Rationale**: zero mudança de assinatura pública em `listarTreinos`,
  `obterCicloAtual`, `calcularProgressoCiclo`, `criarCiclo` — a filtragem
  entra como uma função pura nova (treinos) ou como uma mudança **interna**
  de `obterCicloAtual` (ciclos), nunca como parâmetro novo. Isso atende
  diretamente "manter assinaturas públicas estáveis quando possível" e
  evita qualquer leitura nova em `index.tsx` (item 8) — a mesma chamada
  `listarTreinos(uid)`/`obterCicloAtual(uid)` que já existia continua
  sendo exatamente 1 leitura, só o pós-processamento em memória muda.
- **Alternatives considered**: adicionar um parâmetro
  `incluirArquivados?: boolean` a `listarTreinos` — rejeitada; cada
  chamador já sabe exatamente o que precisa (todos / só ativos), e duas
  funções puras pequenas são mais simples de ler no call site do que um
  booleano cujo significado exige abrir a implementação; mudar
  `obterCicloAtual` para aceitar um parâmetro — rejeitada pelo mesmo
  motivo, e porque nenhum consumidor jamais precisa do "último ciclo
  mesmo que encerrado" (não existe caso de uso para isso).

## Decisão 2 (item 2) — Modelo de dados: `null` sempre presente, nunca omissão

- **Decision**: `Treino.arquivadoEm: string | null` e
  `CicloTreino.encerradoEm: string | null` — campo **sempre presente**
  nos tipos TypeScript (não opcional, sem `?:`), igual ao padrão já usado
  por `SessaoTreino.finalizadaEm`/`SerieRealizada.registradaEm` (specs
  009/025), não ao padrão de omissão condicional usado por
  `ExercicioPlanejado.observacao` (spec 023 — esse é opcional de verdade,
  um exercício pode legitimamente nunca ter observação; arquivamento
  sempre tem um estado, ativo ou arquivado).

  **Escrita**: todo documento novo escreve o campo explicitamente —
  `arquivadoEm: null` em `montarTreinoValido` (treino-storage.ts, tanto
  importação única quanto em lote) e `encerradoEm: null` em `criarCiclo`
  (ciclo-treino-storage.ts). `setDoc` nativo (`@react-native-firebase/
  firestore`) rejeita `undefined` em qualquer campo — nunca gravar o campo
  ausente ou como `undefined`, só `null` (valor concreto) ou uma string
  ISO 8601 (quando arquivado/encerrado).

  **Leitura/normalização**: treinos e ciclos **já existentes** no Firestore
  (criados antes desta spec) não têm o campo — `documento.data() as Treino`
  traria `arquivadoEm: undefined` em runtime, apesar do tipo dizer
  `string | null`. `listarTreinos`/`listarCiclos` (a única leitura de
  coleção de cada um) normalizam com `?? null` no mesmo mapeamento que já
  normaliza dados antigos hoje — **precedente direto já existente no
  código**: `listarTreinos` já faz exatamente isso para
  `categoria: exercicio.categoria ?? 'peso'` (treinos importados antes da
  RF17/spec 017 não tinham `categoria` persistida). Mesmo padrão, mesmo
  lugar, reaproveitado:

  ```ts
  // listarTreinos, dentro do mesmo .map() que já normaliza categoria:
  return {
    ...treino,
    arquivadoEm: treino.arquivadoEm ?? null,
    exercicios: treino.exercicios.map((exercicio) => ({ ...exercicio, categoria: exercicio.categoria ?? 'peso' })),
  };

  // listarCiclos, mesmo .map():
  return { ...ciclo, encerradoEm: ciclo.encerradoEm ?? null };
  ```

  Um documento sem o campo normaliza para `null` (ativo) — exatamente a
  semântica desejada ("ausente = ativo", pedido explícito do usuário).

- **Rationale**: reaproveita um padrão de normalização já comprovado no
  mesmo arquivo (`categoria ?? 'peso'`), em vez de inventar um segundo
  jeito de lidar com dado legado incompleto. Tipar como sempre-presente
  (`string | null`, não opcional) obriga todo código novo a lidar com os
  dois estados explicitamente (TypeScript não deixa esquecer), diferente
  de um campo opcional `?:` que pode ser silenciosamente ignorado em algum
  lugar.
- **Alternatives considered**: campo opcional (`arquivadoEm?: string`,
  ausência = ativo, presença = arquivado) — rejeitada: exigiria checar
  `!treino.arquivadoEm` em vez de `treino.arquivadoEm === null` em todo
  lugar, misturando "ausente" e "string vazia" como a mesma coisa de forma
  implícita, e quebra a consistência com `finalizadaEm`/`registradaEm`
  (já `string | null`) sem nenhum ganho — a migração de dados antigos já
  precisa de normalização na leitura de qualquer forma, então usar `null`
  explícito não custa nada a mais.

## Decisão 3 (item 3) — Regras do Firestore: proibir `delete` em `sessoes`, `treinos` e `ciclos`

- **Decision**: `grep -rn "deleteDoc" src/` retorna **zero ocorrências** —
  o app nunca chama `deleteDoc` em nenhuma coleção, hoje. Com isso
  confirmado, as 3 subcoleções (`sessoes`, `treinos`, `ciclos`) trocam
  `allow read, write` por `allow read, create, update` (sem `delete`) —
  não só `sessoes` (exigido por FR-013), mas também `treinos` e `ciclos`,
  por consistência direta com a filosofia desta spec ("exclusão lógica,
  nunca remoção") e porque nada no app jamais precisou de `delete` em
  nenhuma das três. O documento de conta (`users/{uid}`, dados físicos)
  **não muda** — fora do escopo desta spec, continua com `allow read,
  write`.

  ```
  match /treinos/{treinoId} {
    allow read, create, update: if request.auth != null && request.auth.uid == uid;
  }
  match /sessoes/{sessaoId} {
    allow read, create, update: if request.auth != null && request.auth.uid == uid;
  }
  match /ciclos/{cicloId} {
    allow read, create, update: if request.auth != null && request.auth.uid == uid;
  }
  ```

  Contrato completo, com o caso de teste novo (delete negado, replicado
  para as 3 coleções) somado aos 4 já existentes (replicados também),
  total 7 casos × 3 coleções = 21 verificações, em
  `contracts/firestore-rules.md`.
- **Rationale**: FR-013 exige a garantia no servidor especificamente para
  `sessoes` (histórico nunca apagável); estender a mesma proibição a
  `treinos`/`ciclos` é a aplicação mais simples e consistente do mesmo
  princípio ("exclusão lógica em todo lugar que esta spec introduz um
  campo de arquivamento/encerramento"), sem custo — nenhum código legítimo
  do app depende de `delete` em nenhuma das três coleções, confirmado por
  grep antes de decidir, não presumido.
- **Alternatives considered**: proibir `delete` só em `sessoes` (mínimo
  exigido pela spec) — rejeitada; deixar `treinos`/`ciclos` com `delete`
  permitido pela regra, mesmo sem nenhum código que o use, é uma
  superfície de risco desnecessária (um bug futuro, ou uso direto do
  Console/SDK fora do app, poderia apagar um treino arquivado que deveria
  ser só logicamente excluído) — proibir nos três custa a mesma linha de
  regra e fecha essa superfície por completo.

## Decisão 4 (item 4) — Arquivar + sessão em andamento: `writeBatch` atômico, SEM leitura prévia

- **Decision (revisada)**: as funções de escrita desta spec
  (`arquivarTreino`, `restaurarTreino`, `encerrarCiclo` e a finalização de
  sessão que elas reaproveitam) **não leem nada antes de gravar** — o
  chamador já tem, no próprio estado local da tela, tudo que é preciso
  (`treinoId`, `cicloId`, e o id da sessão em andamento quando houver).
  Cada escrita passa a ser um `updateDoc`/`batch.update` de **um único
  campo**, montada e enfileirada **de forma síncrona** (nem a função
  precisa ser `async`), com `.catch` só para log — mesmo princípio
  fire-and-forget já usado em todo o app, levado um passo adiante (nem a
  leitura prévia que `arquivarTreino` tinha no desenho original
  permanece).

  **Novo helper em `sessao-treino-storage.ts`, sem leitura** —
  `finalizarSessao` (spec 025, já existente) lê a sessão inteira via
  `listarSessoes` só para mutar e regravar um único campo
  (`sessao.finalizadaEm = ...; setDocSessao(uid, sessao)`) — confirmado
  por inspeção do código, nenhum outro campo é tocado. Isso permite um
  helper paralelo, sem leitura, que grava só esse campo — reaproveitado
  tanto pelo `writeBatch` de `arquivarTreino` quanto pela ação de
  "finalizar sessão em andamento" (`index.tsx`, FR-011), que também já
  sabe o id da sessão sem precisar relê-la (`sessaoEmAndamentoIdPorTreino`,
  `contracts/lista-treinos-e-historico.md`):

  ```ts
  // sessao-treino-storage.ts — NOVO, sem leitura
  export function finalizarSessaoPorId(uid: string, sessaoId: string, lote?: WriteBatch): void {
    const dados = { finalizadaEm: new Date().toISOString() };
    const referencia = doc(sessoesCollection(uid), sessaoId); // sessoesCollection continua módulo-privada
    if (lote) {
      lote.update(referencia, dados);
      return;
    }
    updateDoc(referencia, dados).catch((erro) => {
      console.error('[sessao-treino-storage] Falha ao confirmar finalização no servidor (já salva no cache local):', erro);
    });
  }
  ```

  ```ts
  // treino-storage.ts — arquivarTreino, NOVA assinatura, sem leitura
  export function arquivarTreino(uid: string, treinoId: string, sessaoEmAndamentoId: string | null): void {
    const lote = writeBatch(getFirestore());
    lote.update(doc(treinosCollection(uid), treinoId), { arquivadoEm: new Date().toISOString() });
    if (sessaoEmAndamentoId) {
      finalizarSessaoPorId(uid, sessaoEmAndamentoId, lote); // mesmo lote — commit atômico
    }
    lote.commit().catch((erro) => {
      console.error('[treino-storage] Falha ao confirmar arquivamento no servidor (já salvo no cache local):', erro);
    });
  }
  ```

  - **`sessaoEmAndamentoId: string | null` substitui a leitura**: o
    chamador (`[treinoId].tsx` já tem `sessaoAtualId`; `index.tsx` passa
    a ter `sessaoEmAndamentoIdPorTreino[treino.id] ?? null`, ver adendo
    da Decisão 5 abaixo) decide, com o que já está em memória, se há
    sessão em andamento — `arquivarTreino` nunca mais precisa descobrir
    isso sozinho.
  - **Retorno `{ sessaoFinalizada }` removido** — deixa de fazer sentido:
    o chamador já sabia, **antes** de chamar `arquivarTreino` (para
    montar o texto do `Alert.alert` de confirmação), se havia sessão em
    andamento; não há mais nada que só o resultado da escrita revelaria.
  - **`finalizarSessaoPorId` sem guarda de idempotência** (não checa se a
    sessão já estava finalizada) — aceitável porque só é chamada quando o
    chamador já sabe, pelo próprio estado local, que a sessão está em
    andamento (nunca "talvez"); não é um ponto de entrada livre que
    qualquer código possa invocar sem essa garantia.
  - **`sessoesCollection` NÃO precisa mais ser exportada** (correção em
    relação ao desenho anterior deste documento) — fica encapsulada
    dentro de `sessao-treino-storage.ts`, usada só por
    `finalizarSessaoPorId`; `treino-storage.ts` nunca monta a referência
    do documento de sessão diretamente.

  ```ts
  // treino-storage.ts — restaurarTreino, NOVA assinatura, sem leitura
  export function restaurarTreino(uid: string, treinoId: string): void {
    updateDoc(doc(treinosCollection(uid), treinoId), { arquivadoEm: null }).catch((erro) => {
      console.error('[treino-storage] Falha ao confirmar restauração no servidor (já salva no cache local):', erro);
    });
  }
  ```

  ```ts
  // ciclo-treino-storage.ts — encerrarCiclo, NOVA assinatura, sem leitura
  export function encerrarCiclo(uid: string, cicloId: string): void {
    updateDoc(doc(ciclosCollection(uid), cicloId), { encerradoEm: new Date().toISOString() }).catch((erro) => {
      console.error('[ciclo-treino-storage] Falha ao confirmar encerramento no servidor (já salvo no cache local):', erro);
    });
  }
  ```

  **`updateDoc`/`WriteBatch.update` confirmados na versão instalada do
  SDK** (`node_modules/@react-native-firebase/firestore/dist/typescript/
  lib/modular.d.ts` e `.../lib/FirestoreWriteBatch.d.ts`) — gravam só os
  campos passados, sem exigir nem fazer leitura do documento antes.

  **Chamadores deixam de precisar de `.catch` próprio** — como as quatro
  funções acima nunca mais rejeitam para o chamador (o `.catch` já está
  dentro de cada uma, mesmo padrão de `setDocTreino`/`setDocSessao`/
  `setDocCiclo`), `handleArquivarTreino`/`handleRestaurarTreino`/
  `handleEncerrarCiclo`/`handleFinalizarSessaoAbandonada` chamam essas
  funções e seguem em frente, sem precisar encadear `.catch` no call site
  (simplificação em relação ao desenho anterior deste documento, que
  ainda previa `.catch` nos quatro call sites).

- **Por que nunca sobra um treino arquivado com sessão aberta**: a
  persistência offline nativa do Firestore aplica um `writeBatch` ao
  cache local **inteiro, de uma vez** (mesma unidade atômica local que no
  servidor) — não existe um estado intermediário observável, nem offline,
  em que o treino já apareça arquivado no cache mas a sessão ainda não
  tenha sido finalizada (ou vice-versa).
- **Rationale**: eliminar a leitura prévia remove a única fonte de
  latência perceptível que restava nessas quatro ações (a leitura, mesmo
  rápida, ainda era um `await` antes de qualquer escrita começar) — agora
  a escrita é enfileirada no mesmo tick da confirmação do usuário, sem
  nenhuma Promise no caminho crítico. `writeBatch` continua sendo o
  mecanismo certo para a atomicidade entre arquivar e finalizar a sessão
  — não muda, só para de precisar ler os documentos inteiros para montá-
  lo.
- **Alternatives considered**: manter a leitura prévia só para preencher
  o retorno `{ sessaoFinalizada }` (conveniência para a UI) — rejeitada;
  o chamador sempre tem essa informação de forma mais barata, no próprio
  estado que já usa para decidir o texto da confirmação, antes mesmo de
  chamar a função de escrita; duas chamadas separadas em sequência (em
  vez de `writeBatch`) — rejeitada pelo mesmo motivo já registrado
  (nenhuma garantia real de atomicidade).

**Achados durante a implementação da US1 (T013-T024, 2026-10-16), não
antecipados no desenho original acima — registrados aqui a posteriori**:

1. **Corrida entre uma série ainda em voo e arquivar/finalizar**:
   `registrarSerieConcluida` (spec 025) faz `await listarSessoes(uid)`
   (pode demorar offline) e só depois `setDocSessao` — um `setDoc` do
   **documento inteiro**, com o `finalizadaEm` que estava no objeto lido.
   Se o usuário tocar "Concluir série" (inicia essa leitura), navegar para
   o cabeçalho antes dela terminar (não há nada que bloqueie isso) e então
   arquivar/finalizar o treino, o `writeBatch`/`setDoc` do arquivamento é
   enfileirado primeiro, mas o `setDoc` tardio de `registrarSerieConcluida`
   (enfileirado depois, já que só dispara quando sua leitura resolve) seria
   a última escrita — e regravaria a sessão inteira com `finalizadaEm:
   null` (o valor que estava no objeto lido antes do arquivamento),
   **desfazendo silenciosamente a finalização** que o `writeBatch` existe
   para garantir. Não é um bug introduzido por esta spec (a mesma categoria
   de corrida já existe entre "Concluir série" em voo e "Finalizar treino"
   manual, raiz do bug "série 6 de 4" da spec 025) — mas "Arquivar treino"
   é a primeira vez que o app promete uma garantia forte (nunca sobra
   sessão em andamento presa a um treino arquivado) que essa corrida pode
   quebrar. **Corrigido** (decisão do usuário, 2026-10-16): `[treinoId].tsx`
   ganhou `temSerieEmVoo = Object.values(exerciciosEnviandoSerie).some(Boolean)`
   (reaproveita o state já existente da trava de duplo-toque, spec 025) e
   bloqueia tanto `handleArquivarTreino` quanto `handleFinalizarTreino`
   enquanto houver qualquer série em voo — fecha a janela usando estado
   que já existia, sem leitura nem dependência nova.
2. **`sessaoAtualId` pode apontar para uma sessão já finalizada**, não em
   andamento — dois casos reais: (a) no carregamento inicial, quando
   `encontrarUltimaSessaoConcluidaNaoRevisada` encontra uma sessão
   concluída ainda não "revisada" pelo usuário; (b) depois de concluir o
   último exercício, o `useEffect` que chama `finalizarSessao` **não zera**
   `sessaoAtualId` — só marca `sessaoFinalizadaAutomaticamente`. Esse
   último state já é, coincidentemente, exatamente o sinalizador dos dois
   casos (é setado `true` nos dois lugares). **Corrigido**:
   `handleArquivarTreino` deriva
   `sessaoEmAndamentoId = sessaoAtualId !== null && !sessaoFinalizadaAutomaticamente ? sessaoAtualId : null`
   e só passa esse valor para `arquivarTreino` — nunca o `sessaoAtualId`
   bruto — evitando que `finalizarSessaoPorId` sobrescreva `finalizadaEm`
   de uma sessão que já estava finalizada (efeito prático pequeno — só um
   timestamp redundante — mas incorreto e evitável).

## Decisão 5 (item 5) — Pontos de entrada de UI: reaproveitar `Alert.alert`, `Button`, ícones SVG existentes

- **Decision**: nenhum componente de modal/menu novo — todo o app já usa
  `Alert.alert` nativo (`react-native`) tanto para escolhas com múltiplas
  opções (ex.: `handleSalvarEdicaoSerie` em `exercicio-execucao.tsx`, hoje
  com "Cancelar"/"Salvar") quanto para confirmações simples. Pontos de
  entrada desta spec, todos reaproveitando esse padrão:

  - **Arquivar a partir de "Meus treinos"** (`index.tsx`): cada
    `TreinoListItem` ganha um pequeno botão de "mais opções" (reaproveita
    o mesmo `AcoesIcon` já usado no cabeçalho das abas, em tamanho menor) —
    toque nele abre um `Alert.alert` com os botões "Arquivar" e,
    condicionalmente, "Finalizar sessão em andamento" (só quando
    `emAndamentoPorTreino[treino.id]` for `true`, FR-011). Tocar
    "Arquivar" abre um **segundo** `Alert.alert` de confirmação (o "+1
    toque de confirmação" do SC-001) — se a sessão em andamento existir,
    o texto do segundo alerta avisa que ela também será finalizada
    (FR-010). Total: 1 toque (abrir o menu) + 1 toque ("Arquivar") + 1
    toque de confirmação = dentro do limite de SC-001 (2 toques + 1
    confirmação).
  - **Arquivar a partir da tela do treino** (`[treinoId].tsx`): um link
    "Arquivar treino" ao lado de "Voltar para a lista" (mesmo padrão
    visual de `Pressable` + ícone + `ThemedText type="link"` já usado por
    "Voltar"), abrindo diretamente o `Alert.alert` de confirmação (1
    toque + 1 confirmação, ainda dentro do limite).
  - **"Treinos arquivados" e "Encerrar ciclo"**: duas novas linhas em
    `src/app/acoes.tsx`, mesmo padrão visual das linhas existentes
    ("Importar treino", "Sair da conta") — `Pressable` com ícone (dois
    ícones SVG novos, mesmo padrão de `icons.tsx`: traço 2px, sem
    preenchimento) + `ThemedText type="link"`. "Encerrar ciclo" só
    aparece/fica habilitado quando `obterCicloAtual(uid)` retorna não-nulo
    (FR-007) — a tela já busca essa informação ao montar, mesma forma que
    `index.tsx` já faz. "Treinos arquivados" navega para uma nova rota
    `src/app/treinos-arquivados.tsx` (mesmo padrão de rota top-level fora
    das tabs que `/acoes` já é).
  - **"Finalizar sessão em andamento" sem arquivar** (FR-011, fora do
    fluxo de arquivamento): mesmo menu "mais opções" do primeiro item
    acima, mas chamando só `finalizarSessao` (já existente, spec 025),
    sem tocar no treino.

  Nenhuma dependência nova — `Alert.alert` é parte do React Native, os
  dois ícones novos seguem o padrão `react-native-svg` já em uso.

- **Rationale**: atende "reaproveitar tokens de tema e o componente
  `Button`" e "nenhuma dependência nova" da forma mais direta — usa
  exatamente os mesmos primitivos (`Alert.alert`, `Pressable`,
  `ThemedText type="link"`, ícones SVG) já usados em pontos equivalentes
  do app (menu de Ações, edição de série, "Voltar"), sem introduzir um
  padrão de interação novo que o usuário precisaria aprender.
- **Alternatives considered**: menu de ações customizado (bottom sheet)
  por item da lista — rejeitado por Princípio II (complexidade nova para
  um conjunto pequeno de ações, quando `Alert.alert` já resolve o mesmo
  problema em todo o resto do app); gesto de deslizar (swipe-to-archive)
  — rejeitado pela mesma razão, mais a necessidade de uma biblioteca de
  gestos que o projeto não usa hoje (risco de precisar de dependência
  nova, Princípio IV).

**Adendo — atualização otimista em arquivar/restaurar/encerrar ciclo/
finalizar sessão abandonada**: mesmo as quatro funções de escrita agora
sendo síncronas e sem leitura (Decisão 4 revisada), o **estado local da
UI** (`treinos` em `index.tsx`, `arquivados` em `treinos-arquivados.tsx`,
`cicloAtual` em `acoes.tsx`, `emAndamentoPorTreino` em `index.tsx`) não
muda sozinho só porque a escrita foi enfileirada — precisa de um
`setState` explícito no mesmo handler, antes ou junto da chamada de
escrita, para o item desaparecer/mudar na tela no mesmo tick do toque de
confirmação (SC-002, "desaparece imediatamente"). Os quatro handlers
seguem o mesmo formato: mudam o estado local primeiro (síncrono), chamam
a função de escrita (também síncrona, sem `await`, sem precisar de
`.catch` no call site — Decisão 4) e só então disparam uma reconciliação
em segundo plano quando aplicável (`recarregarTreinos()` depois de
arquivar/finalizar sessão abandonada, para refletir efeitos colaterais
como contadores/ciclo) — ver `contracts/lista-treinos-e-historico.md` e
`contracts/acoes-e-sessao-abandonada.md` para o código de cada um.

**Onde vive `sessaoEmAndamentoIdPorTreino`**: como `arquivarTreino` agora
exige o id da sessão em andamento como argumento (Decisão 4), `index.tsx`
precisa rastrear esse id por treino **já na User Story 1** (não só na
User Story 4, como no desenho original) — `carregarDadosDeSessao` ganha
esse `Record<string, string>` no mesmo laço que já popula
`emAndamentoPorTreino`, sobre o `sessoes` já lido (zero leitura nova). A
User Story 4 só acrescenta a ação de UI que consome esse mesmo estado
(`handleFinalizarSessaoAbandonada`), já existente desde a US1.

## Decisão 6 (item 6) — Bloqueio de execução de treino arquivado, incluindo o caminho da notificação

- **Decision**: investigação do código de notificação
  (`src/services/notificacao-descanso.ts`) confirma que **não existe
  hoje nenhum listener de resposta a notificação**
  (`addNotificationResponseReceivedListener`/
  `getLastNotificationResponse` — zero ocorrências por `grep`) nem
  payload de `data` vinculando a notificação a um treino/tela específica.
  Tocar na notificação de fim de descanso (RF06) não navega para lugar
  nenhum programaticamente — só traz o app de volta ao primeiro plano,
  para **a mesma tela que já estava montada** (o cronômetro de descanso
  só roda enquanto `[treinoId].tsx` está aberto). O "caminho" real que a
  emenda do usuário (FR-003) cobre é: a tela de execução já estava
  montada quando o app foi para segundo plano, e volta ao primeiro plano
  sem recarregar nada — hoje confirmado por código
  (`AppState.addEventListener('change', ...)` em `[treinoId].tsx` só
  incrementa um `tick` e marca `voltouDeSegundoPlanoRef`, nunca
  re-busca o treino).

  **Dois pontos de checagem**, cobrindo os dois jeitos de chegar numa tela
  de execução potencialmente desatualizada:
  1. **Carregamento inicial** (já existe): o `useEffect` que busca
     `listarTreinos(uid)` e localiza o treino passa a checar
     `encontrado.arquivadoEm !== null` — se arquivado, não busca sessões
     nem monta o estado de execução; só marca um novo state
     `treinoArquivado: boolean` e renderiza a mensagem de bloqueio.
  2. **Retorno do segundo plano** (novo): o `useEffect` existente do
     `AppState` ganha uma chamada extra, só quando `novoEstado === 'active'`
     **e** já existe um `treino` carregado — busca `listarTreinos(uid)`
     de novo (checagem leve, sem buscar sessões) e, se o treino agora
     estiver arquivado, troca para a mesma tela de bloqueio do ponto 1.
     Isso cobre o cenário real (arquivado por outro aparelho/sessão da
     mesma conta enquanto esta tela ficou aberta em segundo plano) sem
     exigir nenhum payload de notificação novo.

  **Tela de bloqueio**: mesmo padrão visual já usado para "Treino não
  encontrado" (`ThemedText type="smallBold"` dentro do `SafeAreaView`),
  com o texto "Este treino foi arquivado" e um link para voltar.

- **Rationale**: resolve a emenda (c) sem inventar um mecanismo de
  deep-link/payload de notificação que não existe hoje e que seria, na
  prática, uma feature nova fora do escopo pedido (navegação programática
  por notificação) — o ponto de checagem 2 cobre exatamente o cenário real
  (tela já aberta, dado mudou em outro lugar, usuário volta ao app) com
  uma única leitura adicional, só no momento em que o app volta ao
  primeiro plano (não contínuo, não polling).
- **Alternatives considered**: adicionar `data: { treinoId }` à
  notificação e um listener de resposta para navegar explicitamente —
  rejeitado, resolveria um problema que não existe hoje (a tela já está
  aberta na prática) e introduziria uma superfície nova de navegação por
  notificação, fora do pedido original; não checar nada no retorno do
  segundo plano (só no mount inicial) — rejeitado, deixaria exatamente o
  cenário que a emenda (c) pediu para cobrir sem tratamento.

## Decisão 7 (item 7) — "Ciclo atual" redefinido dentro de `obterCicloAtual`, sem tocar no bloqueio de importação

- **Decision**: `obterCicloAtual(uid)` muda de "o último ciclo criado"
  para "o último ciclo criado — e só esse — se ele mesmo não estiver
  encerrado":

  ```ts
  export async function obterCicloAtual(uid: string): Promise<CicloTreino | null> {
    const ciclos = await listarCiclos(uid);
    if (ciclos.length === 0) {
      return null;
    }
    const ultimo = ciclos[ciclos.length - 1];
    return ultimo.encerradoEm === null ? ultimo : null;
  }
  ```

  **Correção de um bug no desenho original desta decisão** (encontrado
  antes de implementar a US3, 2026-10-18): a primeira versão filtrava
  **todos** os ciclos com `encerradoEm === null` e pegava o último
  **desses** (`ciclos.filter(c => c.encerradoEm === null); ativos[length-1]`)
  — isso reabriria como "atual" um ciclo **antigo**, que já tinha chegado
  a 40 sessões mas nunca foi marcado como encerrado (não existe
  encerramento automático ao bater 40 — "Encerrar ciclo" é sempre manual,
  FR-007), no momento em que o ciclo **mais novo** fosse encerrado
  manualmente. A versão corrigida olha só o último criado — nunca "pula"
  para um anterior; se ele estiver encerrado, não há ciclo atual.

  **Zero mudança** em `src/services/treino-storage.ts`
  (`processarConteudoArray`) — o bloqueio de importação já é
  `if (cicloAtual) { ... bloqueia ... }`; como `obterCicloAtual` passa a
  retornar `null` depois de "Encerrar ciclo", o bloqueio simplesmente para
  de disparar, sem precisar mudar a condição em si. Mesma coisa em
  `index.tsx` — `cicloAtual === null` já significa "não mostra anel nem
  aviso" hoje (`{cicloAtual && progressoCiclo && ...}`).
- **Rationale**: a mudança de semântica concentrada num único lugar
  (`obterCicloAtual`) propaga automaticamente para os dois únicos
  consumidores sem exigir que cada um saiba sobre "encerrado" — exatamente
  o comportamento descrito no `spec.md` (Edge Cases: "essa mudança de
  definição é o que faz o bloqueio de importação parar de disparar... sem
  precisar mudar a lógica de bloqueio em si").
- **Alternatives considered**: expor uma função nova
  `obterCicloBloqueandoImportacao` separada de `obterCicloAtual` (para
  "deixar explícito" o uso) — rejeitada, duplicaria a mesma lógica de
  filtro em dois lugares (Princípio II) sem nenhum ganho — os dois usos
  (bloqueio de importação, exibição do anel) querem exatamente a mesma
  definição de "ciclo atual".

## Decisão 8 (item 8) — Leituras por tela: `index.tsx` não ganha nenhuma leitura nova

- **Decision**: confirmado por desenho das Decisões 1 e 7 — `index.tsx`
  continua com exatamente as mesmas chamadas de hoje
  (`listarTreinos(uid)`, `listarSessoes(uid)` dentro de
  `carregarDadosDeSessao`, `listarCiclos(uid)` dentro de
  `obterCicloAtual`, `listarSessoes(uid)` de novo dentro de
  `calcularProgressoCiclo`) — a única mudança é **pós-processar** o
  resultado já obtido (`filtrarTreinosAtivos` sobre o array já buscado;
  `obterCicloAtual` já filtra internamente sem leitura extra). A nova
  ação "Finalizar sessão em andamento" (FR-011) reaproveita o
  `sessoes` já lido dentro de `carregarDadosDeSessao` para também popular
  um novo `Record<string, string>` (`sessaoEmAndamentoIdPorTreino`,
  mesmo laço que já popula `emAndamentoPorTreino`) — zero leitura nova
  mesmo para essa ação.
- **Rationale**: atende diretamente o pedido explícito do item 8; a
  filtragem em memória (Decisão 1) e a redefinição interna de "ciclo
  atual" (Decisão 7) já eliminam qualquer necessidade de leitura extra
  por construção, não como um ajuste adicional.

## Decisão 9 (item 9) — Cenários do `quickstart.md`

- **Decision**: `quickstart.md` cobre, cada um em modo avião (offline)
  **e** com rede, quando a diferença importa:
  1. Arquivar um treino sem sessão em andamento — some da lista, histórico
     preservado.
  2. Arquivar um treino **com** sessão em andamento — sessão finalizada
     automaticamente (confirmar texto do alerta e o resultado no
     histórico), treino some da lista.
  3. Tentar abrir a tela de execução de um treino arquivado (navegação
     direta residual + retorno do segundo plano com a tela já aberta) —
     mensagem de bloqueio nos dois casos.
  4. Restaurar um treino arquivado — volta a aparecer em "Meus treinos",
     histórico/contadores/anel intactos.
  5. Histórico "Por exercício" depois de arquivar um treino sem nenhuma
     sessão — não aparece mais no universo de "nunca registrado"; um
     treino arquivado **com** sessões continua aparecendo pelos
     registros.
  6. Encerrar ciclo com menos de 40 sessões — anel/aviso somem, importação
     de novo lote volta a funcionar, histórico/contadores preservados.
  7. "Encerrar ciclo" não aparece/fica desabilitado sem ciclo ativo.
  8. Finalizar sessão abandonada direto de "Meus treinos" — destaque "Em
     andamento" some, sessão conta no histórico e no total do ciclo igual
     a "Finalizar treino" manual.
  9. Isolamento entre contas para os campos/ações novos (trocar de conta
     de verdade).
  10. Rules Playground: os 4 casos já existentes + o caso novo de `delete`
      negado, replicados para as 3 coleções (`treinos`, `sessoes`,
      `ciclos`) — 21 verificações.
  11. Tudo (arquivar, restaurar, encerrar ciclo, finalizar sessão
      abandonada) em modo avião — sem travar, sincronizando ao reconectar
      (mesmo rigor da spec 025: modo avião **e** Wi-Fi desligado
      explicitamente, lição registrada na memória do projeto).
- **Rationale**: cobre as 4 User Stories do `spec.md` mais os 2 edge
  cases mais arriscados (treino arquivado com sessão em andamento;
  universo de histórico depois do arquivamento) e o contrato de regras
  atualizado, no mesmo nível de detalhe que o `quickstart.md` da spec 025.
