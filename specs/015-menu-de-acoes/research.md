# Phase 0 Research: Tela Separada para Ações de Perfil e Importação

**Feature**: `015-menu-de-acoes` | **Date**: 2026-09-22

Sem `[NEEDS CLARIFICATION]` pendente. O formato (tela separada, não drawer) já foi
decidido com o usuário. A decisão abaixo ajusta um ponto técnico descoberto durante o
planejamento — a posição exata do ícone, que a spec deixou em aberto de propósito
(Assumption "a critério da fase de planejamento").

## Decisão 1: Ícone em cada tela de aba, não num "cabeçalho compartilhado" de verdade

**Decision**: O ícone de acesso à tela de ações fica na própria linha de título de
cada tela de aba (`(tabs)/index.tsx` e `(tabs)/explore.tsx`), via um componente
pequeno reaproveitado (`BotaoAcoes`) — não dentro do componente de tab bar
(`app-tabs.tsx`/`app-tabs.web.tsx`).

**Rationale**: a versão nativa da tab bar usa `NativeTabs` (do
`expo-router/unstable-native-tabs`), cuja API só aceita `NativeTabs.Trigger` como
filhos — não existe um slot de cabeçalho/ação customizável exposto por esse
componente para Android/iOS. As alternativas para conseguir um cabeçalho nativo de
verdade (habilitar `headerShown: true` no `Stack` raiz, ou trocar `NativeTabs` por uma
tab bar totalmente customizada) alterariam a casca visual do app inteiro — risco real
sobre um layout que o usuário já validou e pediu para manter ("gostei muito do
layout, bote manter este nível"). Colocar o botão na linha de título de cada tela
(mesmo padrão visual, mesma posição relativa) atinge o mesmo resultado percebido pelo
usuário — "visível e no mesmo lugar a partir de qualquer aba" (FR-002) — sem mexer na
casca de navegação.

**Alternatives considered**:
- Habilitar header nativo (`Stack.Screen options={{ headerShown: true, headerRight:
  ... }}`) — rejeitado, mudança de escopo maior (afeta todas as telas do app, some
  com o padrão atual sem cabeçalho) para um pedido que é sobre reorganizar 3 ações,
  não redesenhar a navegação.
- Ícone só na web (`app-tabs.web.tsx`, que já tem um slot de cabeçalho livre ao lado
  do link "Docs") e nenhum equivalente no nativo — rejeitado, quebraria FR-002/FR-003
  no Android/iOS, que são as plataformas-alvo reais do projeto (Princípio III).

## Decisão 2: Nova tela como rota fora do grupo `(tabs)`, com "Voltar" próprio

**Decision**: Nova tela em `src/app/acoes.tsx`, fora do grupo `(tabs)/` — mesmo
padrão de `src/app/treino/[treinoId].tsx` (tela "empilhada", não uma aba). Como o
`Stack` raiz usa `headerShown: false` (decisão já existente do projeto, não alterada
por esta feature), a tela de ações inclui seu próprio link "Voltar" com `VoltarIcon` —
mesmo padrão visual já usado em `treino/[treinoId].tsx` ("Voltar para exercícios").

**Rationale**: consistente com o único outro precedente de tela empilhada já existente
no projeto; não exige nenhuma mudança na configuração de navegação raiz.

## Decisão 3: Handlers de importação migram sem alteração de comportamento

**Decision**: As funções `ehResultadoMultiplo`, `exibirResultadoImportacaoMultipla`,
`exibirResultadoImportacao`, `handleImportarTreino` e `handleImportarTreinoExemplo`
(hoje em `(tabs)/index.tsx`) movem para `src/app/acoes.tsx` **sem alteração de
lógica** — mesmas mensagens, mesmo uso de `importarTreino`/`importarTreinoExemplo`
(RF01/spec 012). A única mudança é que, após uma importação bem-sucedida, a tela de
ações **não** chama `recarregarTreinos()` diretamente (ela não tem essa função) — a
lista de treinos na aba "Treinos" já se atualiza sozinha ao ganhar foco
(`useFocusEffect` já existente em `index.tsx`), que é exatamente o momento em que o
usuário volta para lá depois de importar (FR-004, Edge Case da spec).

**Rationale**: é literalmente o que FR-004 pede — comportamento idêntico, só
localização diferente. Reaproveitar o mecanismo de recarregamento por foco já
existente evita introduzir uma forma nova de comunicação entre as duas telas (ex.:
callback, evento, contexto global) só para isso.

## Decisão 4: Novo ícone `AcoesIcon`

**Decision**: Novo ícone (três pontos horizontais — "kebab menu", convenção comum
para "mais ações") em `src/components/ui/icons.tsx`, mesmo padrão dos demais ícones
já existentes (`Svg`/`Circle`, props `size`/`color`/`strokeWidth`).

**Rationale**: nenhum ícone existente no conjunto representa "mais ações/menu"; segue
exatamente o padrão já estabelecido pelos outros 9 ícones da identidade visual.

## Decisão 5: barra de abas flutuante da web escondia o conteúdo do topo (achado durante a implementação)

**Decision**: `TabSlot` (`src/components/app-tabs.web.tsx`) ganha
`paddingTop: TAB_BAR_HEIGHT_WEB` (72px) — reserva espaço para a barra de abas
flutuante (`position: absolute`) não cobrir o início do conteúdo de cada tela.

**Rationale**: bug real encontrado ao testar esta feature via web — a barra de abas
flutuante sempre cobriu o topo do conteúdo de cada tela (`position: 'absolute'`,
sem nenhum espaço reservado por quem a usa). Antes desta feature isso era
inofensivo: o que ficava escondido era só o título da tela (`ThemedText
type="subtitle"`, texto decorativo). Com o `BotaoAcoes` agora vivendo na mesma linha
do título (Decisão 1), o botão — elemento interativo, não decorativo — passou a
ficar inacessível por trás da barra de abas na web, falhando FR-002 ("visível e
clicável") nesse ambiente. Corrigido no único lugar compartilhado por ambas as abas
(`TabSlot`), em vez de duplicar um `paddingTop` em cada tela.

**Efeito colateral positivo**: o título de cada aba ("Meus treinos", "Histórico de
evolução"), que nunca tinha aparecido de fato na versão web do app, passa a ficar
visível pela primeira vez.

**Alternatives considered**: adicionar `paddingTop` individualmente em
`(tabs)/index.tsx` e `(tabs)/explore.tsx` — rejeitado, duplica a mesma constante em
dois arquivos por um problema que é da barra de abas, não de cada tela
individualmente.

**Nota de escopo**: esta correção é específica da variante web
(`app-tabs.web.tsx`); a variante nativa (`app-tabs.tsx`, `NativeTabs`) não tem esse
problema — a tab bar nativa não sobrepõe o conteúdo, então nada precisa mudar lá.

## Resumo das entidades técnicas afetadas

- `src/components/ui/icons.tsx`: novo `AcoesIcon`.
- `src/components/ui/botao-acoes.tsx` (novo): botão pequeno e reutilizável
  (`AcoesIcon` + navegação para `/acoes`), usado pelas duas telas de aba.
- `src/app/acoes.tsx` (novo): tela com as três ações, handlers migrados de
  `index.tsx`.
- `src/app/(tabs)/index.tsx`: remove o bloco de atalhos (perfil/importar); adiciona
  `BotaoAcoes` na linha de título; ajusta a mensagem de estado vazio (FR-005).
- `src/app/(tabs)/explore.tsx`: adiciona `BotaoAcoes` na linha de título (mesma
  posição relativa de `index.tsx`).
