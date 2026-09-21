# Research: Editar Registro de Série de uma Sessão Já Finalizada

O usuário já especificou explicitamente a abordagem técnica (estender
`RegistroHistorico` com `sessaoId`/`exercicioId`/`serie`; nova função de gravação em
`sessao-treino-storage.ts`, localizando por `id` como `finalizarSessao`; validação
defensiva de `finalizadaEm !== null`; reaproveitar o padrão de UI do RF09a). As
decisões abaixo escolhem entre as opções que o usuário deixou em aberto (estender o
tipo existente vs. criar um tipo derivado) e resolvem os detalhes que a instrução não
cobriu explicitamente (nome exato da função, onde vive o estado de edição na UI, como
a tela reflete a edição imediatamente).

## Decisão 1: Estender `RegistroHistorico` diretamente, não criar um tipo derivado

**Decision**: Os três campos novos (`sessaoId`, `exercicioId`, `serie`) são adicionados
diretamente ao tipo público `RegistroHistorico` (`src/types/historico.ts`), em vez de
introduzir um tipo derivado (ex.: `RegistroHistoricoEditavel`) usado só pela tela.

**Rationale**: O usuário deixou as duas opções em aberto ("Estender RegistroHistorico
(ou um tipo derivado usado só na tela de histórico)"). Não existe, hoje, nenhum
consumidor de `RegistroHistorico` que precise da versão "sem origem" — o único
consumidor é a própria tela de histórico (`explore.tsx`), que passa a precisar da
origem para oferecer edição. Introduzir um segundo tipo só para diferenciar "com
origem" de "sem origem" criaria uma dualidade sem propósito real (Princípio II) — todo
lugar que hoje lê `RegistroHistorico` pode simplesmente ignorar os três campos novos se
não precisar deles, sem nenhum custo. Além disso, `historico-evolucao.ts` já calcula
os três valores internamente durante a montagem de cada registro (`sessao.id`,
`execucao.exercicioId`, `serie.serie`) — expô-los é apenas incluí-los na projeção
final, não uma mudança de algoritmo.

**Alternatives considered**:
- Tipo derivado `RegistroHistoricoEditavel extends RegistroHistorico`, construído só
  dentro de `explore.tsx` a partir dos dados brutos: rejeitado — exigiria que a tela
  (ou um novo serviço intermediário) refizesse parte do trabalho que
  `historico-evolucao.ts` já faz internamente para calcular esses três valores, só
  para depois descartá-los na exportação. Mais complexo sem nenhum benefício de
  encapsulamento real, já que não há hoje nenhum consumidor que precise da versão sem
  os campos de origem.

## Decisão 2: Nova função `atualizarSerieDeSessaoFinalizada`, localizando por `sessaoId`

**Decision**: `sessao-treino-storage.ts` ganha uma nova função:

```ts
export async function atualizarSerieDeSessaoFinalizada(params: {
  perfilId: string;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
```

Localiza a sessão por `sessoes.find((item) => item.id === sessaoId)` — não por
`treinoId`, que voltaria a ser ambíguo assim que múltiplas sessões finalizadas do
mesmo treino existem (RF07).

**Rationale**: Pedido explícito do usuário, resolvendo diretamente o "Ajuste
arquitetural 2" da spec: a função irmã do RF09a (`atualizarSerieRealizada`) localiza
por `treinoId` + `finalizadaEm === null`, que é exatamente o oposto do que esta
feature precisa (sessões **finalizadas**, e potencialmente mais de uma por treino).
Reaproveitar `finalizarSessao` como precedente de "localizar por `id`" mantém
consistência com a única outra função do serviço que já precisou resolver o mesmo
problema de ambiguidade.

**Alternatives considered**:
- Adicionar um parâmetro/flag a `atualizarSerieRealizada` existente para alternar entre
  buscar por `treinoId`+`em andamento` ou por `sessaoId`+`finalizada`: rejeitado —
  misturaria duas responsabilidades semânticas distintas (editar uma sessão em
  andamento vs. uma já finalizada) em uma única função com comportamento condicional,
  tornando a assinatura mais confusa e o corpo da função mais difícil de raciocinar;
  duas funções pequenas e específicas são mais simples de entender e testar
  isoladamente (Princípio II) do que uma função genérica com um parâmetro que muda seu
  comportamento de busca inteiro.

## Decisão 3: Validação defensiva de `finalizadaEm !== null` (sugestão de robustez do usuário)

**Decision**: Após localizar a sessão por `id`, `atualizarSerieDeSessaoFinalizada`
verifica `sessao.finalizadaEm === null` e, se verdadeiro, lança erro imediatamente,
sem gravar nada — mesmo padrão de mensagem de erro já usado por
`marcarExercicioConcluido`/`atualizarSerieRealizada` para "sessão/execução não
encontrada" (uma frase descritiva, sem código de erro estruturado, consistente com o
resto do arquivo).

**Rationale**: Pedido explícito do usuário, como proteção contra um bug futuro na UI
que chamasse esta função sobre uma sessão em andamento por engano (cenário que não
deveria ocorrer no fluxo normal, já que a tela de histórico só exibe sessões já
finalizadas — RF08 — mas a função não deveria confiar silenciosamente nisso). Falhar
alto e cedo (lançar erro) é mais seguro do que gravar silenciosamente em uma sessão
que ainda está em andamento, o que poderia corromper dados que o RF04/RF09a esperam
gerenciar através de suas próprias funções.

**Alternatives considered**:
- Não validar, confiando que a UI nunca chamará a função incorretamente: rejeitado —
  contraria explicitamente o pedido de robustez do usuário; o custo de uma verificação
  a mais é desprezível comparado ao risco de uma sessão em andamento ser
  silenciosamente tratada como finalizada por um bug futuro.
- Validar na UI (`explore.tsx`) em vez de na função de serviço: rejeitado — a
  validação pertence à função que efetivamente grava o dado, não a quem a chama;
  colocá-la no serviço protege contra **qualquer** chamador futuro (não só a tela
  atual), consistente com onde as demais validações de invariante já vivem neste
  mesmo arquivo (ex.: "sessão não encontrada" em `marcarExercicioConcluido`).

## Decisão 4: `RegistroHistorico` ganha os 3 campos na mesma passagem que já monta cada registro

**Decision**: Em `historico-evolucao.ts`, a estrutura de trabalho interna
`ItemDeTrabalho` (hoje `RegistroHistorico & { nomeOriginal: string }`) passa a também
carregar `sessaoId`, `exercicioId` e `serie` desde o momento em que cada item é
empurrado durante a iteração das sessões — nenhum desses três valores exige uma nova
consulta; todos já estão disponíveis nesse ponto do algoritmo (`sessao.id`,
`execucao.exercicioId`, `serie.serie`, na mesma iteração que já lê `serie.cargaKg` e
`serie.reps`). Ao converter `itens` ordenados para `RegistroHistorico[]` (o mapeamento
final que hoje descarta `nomeOriginal`), os três novos campos passam a ser mantidos em
vez de descartados.

**Rationale**: Extensão mínima e localizada — o algoritmo de agrupamento, resolução de
nome e ordenação (RF08, todas as Decisões já registradas em
`specs/010-historico-evolucao-carga/research.md`) permanece inteiramente inalterado;
apenas o formato de saída de cada registro individual ganha mais dados, sem nenhuma
mudança de comportamento observável na lista já validada pelo RF08.

**Alternatives considered**:
- Buscar `sessaoId`/`exercicioId`/`serie` separadamente na UI, a partir de
  `sessaoId`/`exercicioId` implícitos em outra estrutura: rejeitado — não existe hoje
  nenhuma estrutura que a UI possa consultar para descobrir isso sem re-percorrer as
  sessões; o dado já existe na mesma iteração de `historico-evolucao.ts`, buscar de
  novo em outro lugar seria trabalho duplicado.

## Decisão 5: Estado de edição vive dentro do componente `SecaoExercicio` (não elevado ao topo da tela)

**Decision**: Cada seção `Collapsible` (renderizada pelo componente `SecaoExercicio`,
introduzido pelo RF08 dentro de `explore.tsx`) ganha seu próprio estado local
(`useState`) para a edição em andamento — `{ sessaoId, exercicioId, serie, cargaKg,
reps } | null` — em vez de um estado único elevado ao componente de tela
`HistoricoScreen`.

**Rationale**: Mesmo padrão já usado pelo RF09a: em `exercicio-execucao.tsx`, o estado
de edição (`edicaoSerie`) vive dentro do componente que renderiza a lista de séries,
não na tela pai (`[treinoId].tsx`). Como a edição só pode ocorrer dentro de uma seção
por vez (o usuário toca em um registro específico, dentro de uma seção específica),
manter o estado local a essa seção evita que a tela inteira precise saber "qual seção
está editando o quê", mantendo a mesma localidade de estado já validada pelo RF09a.

**Alternatives considered**:
- Estado único de edição elevado a `HistoricoScreen`, identificando a seção/registro
  ativo por uma chave composta: rejeitado — não muda o comportamento observável, só
  desloca o estado para um componente que não precisa dele, contrariando o padrão já
  estabelecido pelo RF09a sem nenhum ganho.

## Decisão 6: Confirmação persistida reflete-se via patch local do estado `historico`, não recarregamento completo

**Decision**: Ao confirmar uma edição, `HistoricoScreen` chama o novo handler
`handleEditarRegistro`, que invoca `atualizarSerieDeSessaoFinalizada` e, a partir da
`SessaoTreino` retornada, localiza a `SerieRealizada` correspondente
(`exercicioId`+`serie`) e atualiza apenas esse registro específico dentro do estado
`historico` já carregado em memória (`historico.evolucoes[...].registros[...]`) —sem
chamar `obterHistoricoPorPerfil` novamente.

**Rationale**: Mesmo padrão já usado pelo RF07/RF09a: `handleEditarSerie` em
`[treinoId].tsx` atualiza `estadosPorExercicio` diretamente a partir do retorno da
função de escrita, em vez de re-buscar tudo. Como a edição nunca afeta agrupamento,
ordenação ou `nomeExibido` (RF08 — a data e o nome do exercício não mudam), um patch
pontual do registro editado é suficiente e mais direto do que refazer todo o algoritmo
de `obterHistoricoPorPerfil` só para refletir uma mudança de dois campos.

**Alternatives considered**:
- Chamar `recarregarHistorico()` (já existente, RF08) novamente após a edição:
  avaliado — funcionalmente equivalente e mais simples de implementar, mas descartado
  em favor do patch pontual porque é o padrão já estabelecido pelo restante do app
  (RF07/RF09a) para "refletir uma escrita que acabou de ocorrer, sem re-buscar tudo do
  zero"; manter consistência de padrão entre features facilita a manutenção futura.
  **Nota para o `/speckit.tasks`**: esta é uma diferença de custo de implementação
  pequena, não uma escolha crítica — se o patch pontual se mostrar mais complexo que o
  esperado durante a implementação, recarregar via `recarregarHistorico()` é uma
  alternativa aceitável que ainda satisfaz FR-010 integralmente.

## Decisão 7: Extrair `sanitizarCarga`/`sanitizarReps` para um utilitário compartilhado

**Decision**: As duas funções puras `sanitizarCarga`/`sanitizarReps`, hoje declaradas
como funções privadas (não exportadas) dentro de `exercicio-execucao.tsx`, são
movidas para um novo arquivo `src/utils/sanitizar-serie.ts`, exportadas, e importadas
de volta tanto por `exercicio-execucao.tsx` (RF04/RF09a, sem mudança de comportamento)
quanto pela nova UI de edição em `explore.tsx` (RF09b).

**Rationale**: Esta feature reaproveita exatamente as mesmas regras de validação de
entrada já usadas pelo RF03/RF09a (FR-003 da spec) — duplicar essas duas funções
dentro de `explore.tsx` violaria o Princípio II (simplicidade/DRY) e criaria risco de
as duas cópias divergirem no futuro (ex.: um ajuste de regra de validação feito em um
arquivo e esquecido no outro). Extrair para um utilitário compartilhado, seguindo o
mesmo padrão já estabelecido por `src/utils/cronometro-descanso.ts` e
`src/utils/normalizar-nome-exercicio.ts` (RF05/RF08), é a opção mais simples que evita
a duplicação.

**Alternatives considered**:
- Duplicar `sanitizarCarga`/`sanitizarReps` dentro de `explore.tsx`: rejeitado —
  duplicação direta de lógica de validação, contrariando Princípio II.
- Importar as funções diretamente de `exercicio-execucao.tsx` (exportando-as sem
  movê-las): avaliado, mas rejeitado — criaria uma dependência de um componente de
  tela (`exercicio-execucao.tsx`) para outro (`explore.tsx`), estruturalmente estranha
  (componentes de tela não deveriam depender uns dos outros); mover para
  `src/utils/`, onde já vivem outras funções puras reaproveitadas entre telas, é mais
  consistente com a organização já estabelecida do projeto.
