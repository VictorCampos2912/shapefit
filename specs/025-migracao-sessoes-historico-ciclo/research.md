# Research: Migração de Sessões, Histórico e Ciclo de Progresso para o Firestore

**Feature**: `025-migracao-sessoes-historico-ciclo` | **Date**: 2026-10-15

Investigação pedida explicitamente antes do plano (itens 1-7 do `/speckit.plan`).

## Decisão 1 (item 1) — Mapa completo de consumidores e estabilidade de assinatura

- **Decision**: levantamento exaustivo por `grep` de todo `src/` confirma
  exatamente estes consumidores das funções hoje em AsyncStorage:

  **`sessao-treino-storage.ts`** (11 funções exportadas):
  | Função | Consumidor(es) | Muda a assinatura? |
  |---|---|---|
  | `obterSessao(perfilId, treinoId)` | `index.tsx` (spec 024), `[treinoId].tsx` | Não (só renomeia `perfilId`→`uid`, Decisão 6) |
  | `obterUltimaSessaoConcluidaNaoRevisada(perfilId, treinoId, totalExercicios)` | `[treinoId].tsx` | Não |
  | `marcarSessaoRevisada(perfilId, sessaoId)` | `[treinoId].tsx` | Não |
  | `registrarSerieConcluida(params)` | `[treinoId].tsx` | **Sim** — `params` ganha `treinoSnapshot` (só usado na criação, spec 025 FR-003) |
  | `marcarExercicioConcluido(params)` | `[treinoId].tsx` | Não |
  | `atualizarSerieRealizada(params)` | `[treinoId].tsx` | Não |
  | `contarSessoesFinalizadas(perfilId, treinoId)` | `index.tsx`, `ciclo-treino-storage.ts` | Não (implementação interna muda, Decisão 7) |
  | `obterDataUltimaSessaoFinalizada(perfilId, treinoId)` | `index.tsx` | Não (idem) |
  | `listarSessoesFinalizadas(perfilId)` | `historico-evolucao.ts` | Não (idem) |
  | `atualizarSerieDeSessaoFinalizada(params)` | `explore.tsx` (RF09b) | Não |
  | `finalizarSessao(perfilId, sessaoId)` | `[treinoId].tsx` | Não |

  **Nova função exportada**: `listarSessoes(uid): Promise<SessaoTreino[]>` —
  não existe hoje; ponto de leitura da coleção inteira, reaproveitado por
  `contarSessoesFinalizadas`, `obterDataUltimaSessaoFinalizada`,
  `listarSessoesFinalizadas`, `obterUltimaSessaoConcluidaNaoRevisada`,
  `atualizarSerieRealizada` e por `ciclo-treino-storage.ts` (Decisão 7).
  **Ajuste pedido pelo usuário sobre o plano original**: `obterSessao` e
  `registrarSerieConcluida` **não** usam `listarSessoes` — usam uma query
  filtrada por `treinoId`+`finalizadaEm` (`contracts/sessao-treino-storage.md`),
  por serem as duas chamadas mais frequentes (abertura de tela e cada
  "Concluir série", RNF03).

  **Correção pós-validação (2026-10-16)**: essa query filtrada travou
  indefinidamente offline em teste real (1º bug da validação — ver Decisão
  7, seção "Validação em aparelho"). `obterSessao` e `registrarSerieConcluida`
  foram revertidas para usar `listarSessoes` como todas as demais funções
  do arquivo — a otimização de leitura descrita aqui **não está no código
  final**; ver `contracts/sessao-treino-storage.md` para o estado atual.

  **`ciclo-treino-storage.ts`** (4 funções exportadas):
  | Função | Consumidor(es) | Muda a assinatura? |
  |---|---|---|
  | `criarCiclo(perfilId, treinoIds)` | `treino-storage.ts` | Não |
  | `obterCicloAtual(perfilId)` | `treino-storage.ts`, `index.tsx` | Não |
  | `calcularProgressoCiclo(perfilId, ciclo)` | `treino-storage.ts`, `index.tsx` | Não (implementação interna muda, Decisão 7) |
  | `cotaComoFracao(sessoesFinalizadas, cota)` | `index.tsx` | Não (função pura, sem storage, não é tocada) |

  **`historico-evolucao.ts`** (2 funções exportadas, consumidas só por
  `explore.tsx`): `obterHistoricoPorPerfil`/`obterHistoricoPorData` não
  mudam de assinatura — só a fonte interna dos dados (lê sessões do
  Firestore via `listarSessoesFinalizadas`, que não muda de assinatura) e a
  origem de nome/categoria dentro de `construirRegistrosBrutos` (Decisão 2,
  usa o snapshot da sessão em vez de cruzar com `Treino`).

- **Rationale**: das 15 funções exportadas nos dois serviços, só **uma**
  (`registrarSerieConcluida`) precisa de uma assinatura nova (um campo
  adicional no objeto de parâmetros, usado só na criação da sessão) — e
  mesmo essa mudança não exige nenhum ajuste em `[treinoId].tsx` além de
  passar esse campo extra na única chamada existente, já dentro do mesmo
  arquivo que já tem `treino` carregado. Nenhuma tela precisa de import novo
  além do já existente; `index.tsx` e `ciclo-treino-storage.ts` trocam a
  *implementação interna* das funções que já chamam (Decisão 7), sem trocar
  nomes, parâmetros ou tipos de retorno. Isso atende diretamente o pedido do
  usuário de não espalhar a mudança pelas telas.
- **Alternatives considered**: expor `listarSessoes` só como função privada
  duplicada em cada lugar que precisa — rejeitada por duplicar a lógica de
  leitura+ordenação (Princípio II); melhor um único ponto exportado,
  reaproveitado internamente.

## Decisão 2 (item 2) — Modelo de dados no Firestore e ordenação no cliente

- **Decision**:
  - `users/{uid}/sessoes/{sessaoId}` — **um documento por sessão** (não um
    array único, diferente do AsyncStorage de hoje), mesmo padrão já usado
    por `users/{uid}/treinos/{treinoId}` (spec 022). Campos: os já
    existentes de `SessaoTreino` (`id`, `treinoId`, `iniciadaEm`,
    `finalizadaEm`, `execucoes`, `revisadaPeloUsuario`) mais os dois novos
    campos desta spec (FR-003/FR-004, `data-model.md` tem o detalhe
    completo): `treinoNomeSnapshot: string` e `exerciciosSnapshot: {id,
    nome, categoria}[]` no nível da sessão; `registradaEm: string` em cada
    `SerieRealizada` dentro de `execucoes[].seriesRealizadas[]`.
  - `users/{uid}/ciclos/{cicloId}` — um documento por ciclo (já é assim
    conceitualmente hoje, só migra de um array em AsyncStorage para
    documentos individuais). Campos de `CicloTreino` inalterados.
  - **Ordenação no cliente** (Firestore `getDocs()` não garante ordem sem
    `orderBy` explícito — mesmo raciocínio já usado por `listarTreinos`,
    spec 022): `listarSessoes(uid)` ordena por `iniciadaEm` crescente, com
    `id` como desempate determinístico (mesmo padrão de
    `listarTreinos`/`importadoEm`). `listarCiclos(uid)` (nova função
    interna/exportada em `ciclo-treino-storage.ts`) ordena por `criadoEm`
    crescente, com `id` como desempate — preserva o significado de
    `obterCicloAtual` = último elemento da lista (hoje já é
    `ciclos[ciclos.length - 1]`, sem mudança de semântica).
- **Rationale**: um documento por sessão/ciclo é a modelagem Firestore
  natural (mesma já usada para treinos), permite escrever só o documento que
  mudou (Decisão 7) em vez de reescrever um array inteiro a cada série
  registrada — mais eficiente e mais simples de raciocinar sobre
  concorrência entre aparelhos (Edge Cases do `spec.md`: cada `setDoc`
  afeta um documento, nunca corrompe os demais). A ordenação por
  `iniciadaEm`/`criadoEm` + id replica exatamente a disciplina já aplicada
  a `listarTreinos`, sem inventar um critério novo.
- **Alternatives considered**: manter um único documento
  `users/{uid}/sessoes/dados` com um array grande (réplica 1:1 do
  AsyncStorage) — rejeitada: exigiria reescrever o array inteiro a cada
  série registrada (uma escrita cada vez maior conforme o histórico cresce),
  contra a prática já estabelecida pela spec 022 para treinos, e pior para
  concorrência entre aparelhos (duas escritas simultâneas no mesmo
  documento-array se sobrescrevem por completo, não só o item que cada uma
  queria mudar).

## Decisão 3 (item 3) — Contrato de regras do Firestore

- **Decision**: estender `firestore.rules` com dois novos `match` dentro de
  `users/{uid}`, replicando literalmente o padrão já usado por `treinos`:

  ```
  match /sessoes/{sessaoId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  match /ciclos/{cicloId} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
  ```

  Contrato completo, com os 4 casos de teste (replicados para `sessoes` e
  `ciclos`), em `contracts/firestore-rules.md`.
- **Rationale**: é literalmente a mesma regra já validada pela spec 022 para
  `treinos`, só repetida para os dois caminhos novos — nenhuma lógica nova,
  nenhum campo do corpo do documento é lido pela regra (só o segmento `{uid}`
  do caminho), preservando a mesma garantia de isolamento (FR-016/FR-017 do
  `spec.md`) sem introduzir nenhuma condição nova para auditar.
- **Alternatives considered**: nenhuma — réplica direta de uma regra já
  validada é a opção mais simples e com menor risco (Princípio II); uma
  regra diferente para `sessoes`/`ciclos` exigiria justificar por que o
  isolamento por conta seria diferente daquele já usado para `treinos`, o
  que não é o caso.

## Decisão 4 (item 4) — Offline e cold start: leitura com cache, escrita fire-and-forget

- **Decision**: todo `setDoc` novo (sessão ou ciclo) segue o mesmo padrão já
  usado por `treino-storage.ts`/`conta-storage.ts`: chamado **sem** `await`,
  com `.catch(erro => console.error(...))` para só registrar falha de
  confirmação do servidor (o dado já está no cache local offline
  imediatamente). Toda leitura (`getDocs`/`getDoc`) usa o comportamento
  padrão do SDK nativo (`@react-native-firebase/firestore`), que já resolve
  do cache local quando offline, sem código adicional.

  **Correção pós-validação (2026-10-16)**: a frase acima — "toda leitura
  resolve do cache local quando offline, sem código adicional" — **não se
  confirmou para todo formato de leitura**. Em teste real (modo avião +
  Wi-Fi desligado), `getDoc(doc(...))` de um documento único por id e uma
  query composta (`where`+`where`+`limit`) **travaram indefinidamente**
  (sem erro, sem resolver nem rejeitar a Promise) neste aparelho/SDK — ver
  "Validação em aparelho" na Decisão 7 para os 4 bugs encontrados e a
  observação completa. Só `getDocs(collection)` sem filtro (a coleção
  inteira, sem `where`/`limit`) mostrou-se confiável offline em todos os
  casos testados.
- **Mudança de comportamento interna necessária**: hoje, `registrarSerieConcluida`
  e as demais funções de escrita fazem `await setSessoes(...)` (reescrita
  do array inteiro, local, síncrono o suficiente para ser inofensivo) antes
  de retornar. Migrando para Firestore, a chamada de escrita
  (`setDoc(doc(sessoesCollection(uid), sessao.id), sessao)`) passa a ser
  **sem** `await` — a função ainda retorna a `SessaoTreino` já atualizada em
  memória imediatamente (igual hoje), só não espera mais a confirmação do
  servidor para isso. Nenhum chamador (`[treinoId].tsx`) precisa de ajuste:
  ele já só usa o valor de retorno, nunca esperou por "confirmação de
  servidor" nenhuma vez.
- **Cold start em modo avião**: mesmo teste mais rigoroso já aplicado pela
  spec 022 (abertura a frio, app removido dos recentes, modo avião desde
  antes de abrir) — a leitura de `users/{uid}/sessoes/*` e
  `users/{uid}/ciclos/*` via cache local deve funcionar pelo mesmo
  mecanismo nativo já confirmado para `users/{uid}/treinos/*` naquela spec;
  nenhum código específico de "modo offline" precisa ser escrito, só
  confirmado em teste (`quickstart.md`).
- **Alternatives considered**: `await` nas escritas (mais simples de
  raciocinar) — rejeitada explicitamente pelo FR-021 do `spec.md` e pela
  "lição da spec 022" citada pelo próprio usuário: travaria a UI esperando o
  servidor, quebrando o uso offline.

## Decisão 5 (item 5) — Dados fictícios para teste: sem script novo, só uso real do app

- **Decision**: nenhum script de seed, nenhuma tela ou botão de depuração
  temporário é criado para popular dados fictícios. A validação usa o
  próprio app, normalmente: importar um ou mais arquivos de
  `docs/exemplos/` (já existentes, reaproveitados sem mudança — RF01/RF11),
  treinar algumas sessões de verdade (registrar séries, finalizar
  manualmente ou concluindo todos os exercícios, editar algumas séries), e
  importar um arquivo com múltiplos treinos para exercitar o ciclo de
  progresso (RF15).
- **Rationale**: este projeto não tem suíte de testes automatizados nem
  infraestrutura de seed — toda validação de toda spec anterior já é manual,
  pelo próprio app (`quickstart.md` de cada spec). Criar um script ou tela
  só para popular dados fictícios seria exatamente o tipo de "scaffolding
  só-de-teste" que o usuário já pediu para evitar em conversas anteriores
  deste projeto (preferir usar o fluxo real do produto a criar código
  temporário só para facilitar um teste pontual). Como os dados antigos são
  descartáveis por decisão do próprio usuário (`spec.md`, Assumptions), não
  há necessidade de preservar nem replicar nenhum dado específico — qualquer
  sessão/ciclo criado pelo uso normal do app já serve.
- **Alternatives considered**: script Node com `firebase-admin` para
  inserir documentos diretamente no Firestore — rejeitado por exigir uma
  dependência nova (`firebase-admin`, Constitution Princípio IV, sem
  aprovação/menção na spec) só para um script de uso único, quando o
  próprio app já escreve exatamente os mesmos documentos através do fluxo
  normal, sob as mesmas regras de segurança que serão validadas de
  qualquer forma.

## Decisão 6 (item 6, mais nomenclatura) — AsyncStorage antigo: ignorado, não limpo

- **Decision**: nenhum código de limpeza (`AsyncStorage.removeItem`) é
  adicionado para as chaves antigas `sessoes:<uid>`/`ciclos:<uid>`. Depois
  desta migração, simplesmente nenhum serviço do app lê mais essas chaves
  (FR-023 do `spec.md`) — elas ficam orfãs no dispositivo, sem efeito.
- **Rationale**: adicionar um passo de "limpeza" só para apagar dados já
  descartáveis (decisão do usuário, `spec.md`) é código extra que não
  resolve nenhum problema funcional — o espaço ocupado é desprezível (alguns
  KB de JSON de teste) e o risco de um bug num passo de limpeza (ex.: apagar
  a chave errada) é maior que o benefício de liberar esse espaço
  (Princípio II). Nenhuma tela do app expõe ou depende dessas chaves depois
  desta spec.
- **Nomenclatura (`perfilId` → `uid`)**: os parâmetros hoje chamados
  `perfilId` em `sessao-treino-storage.ts`/`ciclo-treino-storage.ts` (que já
  recebem, na prática, o `uid` da conta desde a spec 022 — só o nome do
  parâmetro ficou desatualizado) são renomeados para `uid`, igualando a
  convenção já usada por `treino-storage.ts`/`conta-storage.ts`. É uma
  troca de nome de parâmetro posicional, sem efeito em nenhum chamador (que
  já passam a variável `uid`, nunca por nome). Os tipos `CicloTreino.perfilId`
  e `SessaoRegistro.perfilId` também são renomeados para `uid` pelo mesmo
  motivo — nenhum dado migrado depende do nome do campo, só do valor.
- **Alternatives considered**: manter o nome `perfilId` por menor
  diff — rejeitada; o ganho de clareza (alinhar com o resto do código já
  migrado) supera o custo de um rename mecânico sem risco funcional.

## Decisão 7 (item 7) — Reduzir leituras: 1 leitura por tela, não 1 por treino

- **Decision**:
  - `src/app/(tabs)/index.tsx`: as três funções que hoje chamam uma função
    de sessão **por treino** em `Promise.all(lista.map(...))`
    (`carregarContagens`, `carregarDatasFinalizacao`, e
    `carregarSessoesEmAndamento` da spec 024) são substituídas por **uma**
    função só, `carregarDadosDeSessao(uid, lista)`, que chama
    `listarSessoes(uid)` **uma única vez** e deriva os três `Record`s
    (`contagensPorTreino`, `dataFinalizacaoPorTreino`,
    `emAndamentoPorTreino`) com três passagens em memória sobre o array já
    obtido — nenhuma chamada de rede/cache adicional por treino. O estado
    resultante (os três `Record`s, usados exatamente como hoje pelo
    `renderItem`) não muda de formato.
  - `ciclo-treino-storage.ts`: `calcularProgressoCiclo(uid, ciclo)` troca o
    laço que chama `contarSessoesFinalizadas` uma vez por treino do ciclo
    por **uma** chamada a `listarSessoes(uid)`, seguida de uma contagem em
    memória por `treinoId` — mesma assinatura e mesmo retorno de hoje.
  - **Leituras restantes por carregamento de tela**: `index.tsx` continua
    fazendo 2 chamadas a `listarSessoes(uid)` por carregamento — uma dentro
    de `carregarDadosDeSessao` e outra, independente, dentro de
    `calcularProgressoCiclo` (chamada por `carregarCicloAtual`). Não são
    unificadas nesta spec.
- **Rationale**: resolve diretamente o pedido do usuário ("evitar uma
  leitura por treino") sem quebrar nenhuma assinatura pública fora de
  `index.tsx` — o laço "1 leitura por treino" vira "1 leitura total" nos
  dois únicos lugares onde existia (lista de treinos e progresso de ciclo).
  As funções exportadas que continuam sendo chamadas individualmente por
  treino fora de um laço (ex.: `obterSessao` dentro de
  `[treinoId].tsx`, chamada uma vez por abertura de tela, não em laço) não
  precisam da mesma otimização — já são 1 leitura por uso, não 1 por treino.
- **Por que não unificar as 2 leituras restantes em `index.tsx`**: exigiria
  mudar a assinatura de `calcularProgressoCiclo` para aceitar uma lista de
  sessões já carregada (em vez de buscar a própria), o que vazaria a decisão
  de "como ler sessões" para dentro de `treino-storage.ts` (outro chamador
  de `calcularProgressoCiclo`, logo depois de criar um ciclo novo, onde não
  há nenhuma lista de sessões pré-carregada à mão) — manter
  `calcularProgressoCiclo` autossuficiente (busca as próprias sessões)
  preserva a independência entre os dois módulos (mesma fronteira já
  respeitada desde a spec 002) por um custo fixo pequeno (uma 2ª leitura da
  mesma coleção). **Correção em relação a uma justificativa anterior deste
  documento**: isso é de fato uma 2ª consulta real ao servidor quando há
  rede (o `getDocs` do Firestore consulta o servidor por padrão, não o
  cache local — só cai para o cache automaticamente quando o aparelho está
  offline); não é "quase grátis" com internet disponível, é um custo fixo
  de +1 leitura por carregamento de tela, aceito conscientemente por
  simplicidade, não por já estar "praticamente em cache".
- **Alternatives considered**: passar as sessões já carregadas como
  parâmetro para `calcularProgressoCiclo` — rejeitada pelo motivo acima
  (vazaria a composição entre os dois serviços para o chamador em
  `treino-storage.ts`, que não tem motivo para se preocupar com isso);
  introduzir uma camada de cache/memoização compartilhada entre serviços
  para a mesma leitura dentro do mesmo ciclo de render — rejeitada por
  Princípio II (complexidade nova para economizar uma 2ª leitura de custo
  conhecido e aceito, não um problema de performance real observado).

## Validação em aparelho (2026-10-15/16) — 4 bugs reais encontrados

Durante a validação manual em Android (modo avião + Wi-Fi desligado,
cenário offline/abertura a frio do `quickstart.md`), 4 bugs reais foram
encontrados e corrigidos, revisando algumas das decisões acima:

1. **Query composta travando offline**: `obterSessao`/
   `registrarSerieConcluida` usavam `where('treinoId','==',...)` +
   `where('finalizadaEm','==',null)` + `limit(1)` (Decisão 1, otimização
   pedida originalmente). Travou indefinidamente offline — revertida para
   `listarSessoes(uid)` + filtro em memória.
2. **`getDoc` de documento único travando offline**: `finalizarSessao`,
   `marcarSessaoRevisada`, `marcarExercicioConcluido` e
   `atualizarSerieDeSessaoFinalizada` usavam `getDoc(doc(sessoesCollection(uid), sessaoId))`.
   Mesmo sintoma do bug 1 — revertida para `listarSessoes(uid)` + busca em
   memória por id.
3. **Leituras sequenciais redundantes** em `[treinoId].tsx` (até 2-3x
   `listarSessoes` na mesma abertura de tela) — consolidadas numa leitura
   só, via as funções puras `encontrarSessaoEmAndamento`/
   `encontrarUltimaSessaoConcluidaNaoRevisada` (ver
   `contracts/sessao-treino-storage.md`).
4. **Corrida de toques duplicados em "Concluir série"**: offline, a
   escrita ficava lenta o suficiente para o usuário tocar de novo sem ver
   nada mudar, disparando chamadas concorrentes que se sobrescreviam —
   corrigida com uma trava de envio por `exercicioId` em `[treinoId].tsx`
   (não faz parte deste serviço — ver `contracts/sessao-treino-storage.md`).

**Observação sobre o SDK offline** (não uma regra geral — só o que foi
observado neste aparelho/SDK/versão, durante esta validação): em modo
avião, `getDoc` e queries filtradas (`where`/`limit`) travaram; `getDocs`
da coleção inteira, sem filtro, funcionou — porém mais devagar que com
rede (lentidão aceita pelo usuário como está, sem correção adicional;
`docs/criterios-aceite.md`, RF24, "Cross-cutting"). **Hipótese ainda não
testada, para uma spec futura**: uma leitura explicitamente cache-first
(`getDocsFromCache`/`onSnapshot`) pode evitar a tentativa de rede que
parece causar o travamento nos formatos de leitura mais específicos, sem
abrir mão do filtro no servidor — não investigado nesta spec.

**Dívida técnica registrada**: como consequência do bug 1 e 2, toda
operação de sessão neste arquivo lê a coleção inteira
(`listarSessoes(uid)`), não só o documento relevante — o custo cresce com
o tamanho do histórico do usuário, não com o tamanho da operação. Aceito
conscientemente em favor de confiabilidade offline; ver
`contracts/sessao-treino-storage.md`, "Dívida técnica aceita".
