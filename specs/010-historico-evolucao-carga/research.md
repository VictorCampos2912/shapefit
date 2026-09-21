# Research: Histórico de Evolução de Carga por Exercício

O usuário já especificou explicitamente boa parte da abordagem técnica (novo serviço
dedicado ou nova função em `treino-storage.ts`; normalização como função pura
testável separada da agregação; reescrita da aba "Explore" no mesmo padrão do RF02;
FR-014 como `console.warn` simples). As decisões abaixo escolhem entre as opções que o
usuário deixou em aberto e resolvem os detalhes que a instrução não cobriu
explicitamente.

## Decisão 1: Novo serviço dedicado `historico-evolucao.ts`, não uma função em `treino-storage.ts`

**Decision**: A lógica de cruzamento/agregação vive em um serviço novo,
`src/services/historico-evolucao.ts`, que importa e compõe `listarTreinos`
(`treino-storage.ts`) e a nova `listarSessoesFinalizadas`
(`sessao-treino-storage.ts`), em vez de ser adicionada dentro de um dos dois serviços
existentes.

**Rationale**: O usuário deixou as duas opções em aberto ("Criar uma nova função em
treino-storage.ts **ou** um novo serviço dedicado"). Um serviço dedicado é a opção mais
consistente com a separação de responsabilidades já estabelecida no projeto: o RF07 já
enfrentou uma decisão equivalente (onde colocar `contarSessoesFinalizadas`, que também
"pertenceria" a mais de um domínio) e resolveu mantendo cada serviço de storage restrito
ao seu próprio domínio de dados (specs/009-salvar-sessao-treino/research.md, Decisão 10:
"mantém a separação já estabelecida entre treino-storage.ts e
sessao-treino-storage.ts"). Este caso é ainda mais claro: a lógica de histórico depende
dos **dois** serviços simultaneamente (treinos **e** sessões), então colocá-la dentro de
qualquer um dos dois criaria uma dependência cruzada entre módulos de storage
irmãos — um novo serviço que depende de ambos, sem que nenhum dos dois dependa dele, é
a estrutura mais simples (Princípio II) que evita esse acoplamento.

**Alternatives considered**:
- Adicionar a lógica de cruzamento dentro de `treino-storage.ts`: rejeitado —
  `treino-storage.ts` não tem (e não deveria precisar ter) nenhuma noção de sessões;
  importar `sessao-treino-storage.ts` de dentro dele inverteria a direção natural de
  dependência (sessões já fazem referência a treinos via `treinoId`, não o contrário).
- Adicionar a lógica dentro de `sessao-treino-storage.ts`: rejeitado pelo mesmo
  motivo simétrico — misturaria a responsabilidade de "persistir sessões" com a de
  "resolver nomes de exercícios a partir de treinos".
- Implementar a lógica diretamente dentro da tela (`explore.tsx`), sem nenhum serviço
  dedicado: rejeitado — todas as outras telas do app (RF02, RF03/RF04) delegam leitura e
  agregação de dados a um serviço em `src/services/`, nunca fazem isso inline na rota;
  manter esse padrão facilita reaproveitar a lógica se uma segunda tela precisar dela
  no futuro (ex.: RF09b, que edita a partir da tela de histórico).

## Decisão 2: `listarSessoesFinalizadas` vive em `sessao-treino-storage.ts`, não no novo serviço

**Decision**: A nova função `listarSessoesFinalizadas(perfilId: string):
Promise<SessaoTreino[]>` (retornando todas as sessões do perfil com `finalizadaEm !==
null`, de todos os treinos) é adicionada a `sessao-treino-storage.ts` — o módulo que já
possui acesso direto à chave de storage `sessoes:${perfilId}` e às funções internas
`getSessoes`/`setSessoes` — em vez de o novo `historico-evolucao.ts` ler
`AsyncStorage` diretamente.

**Rationale**: Mantém a regra já implícita no projeto de que apenas o módulo "dono" de
uma chave de `AsyncStorage` lê/escreve nela diretamente (`treino-storage.ts` para
`treinos:${perfilId}`, `sessao-treino-storage.ts` para `sessoes:${perfilId}`,
`perfil-storage.ts` para as chaves de perfil). `historico-evolucao.ts` consome ambos os
serviços através de suas funções públicas, nunca acessando `AsyncStorage` diretamente —
o mesmo padrão de composição que o RF07 já usa entre `[treinoId].tsx` e os serviços que
ele orquestra.

**Alternatives considered**:
- Reaproveitar `obterSessao`/`contarSessoesFinalizadas` (que exigem `treinoId`),
  chamando-as uma vez por treino do perfil: rejeitado — exigiria que
  `historico-evolucao.ts` primeiro listasse os treinos só para descobrir quais
  `treinoId` existem e então fizesse N chamadas separadas, quando uma única função que
  já devolve todas as sessões finalizadas do perfil de uma vez é mais direta e mais
  simples de compor.

## Decisão 3: Normalização como função pura isolada em `src/utils/`

**Decision**: `normalizarNomeExercicio(nome: string): string` vive em
`src/utils/normalizar-nome-exercicio.ts`, sem nenhuma dependência de storage, tipos de
domínio ou React — recebe uma string, devolve uma string.

**Rationale**: Pedido explícito do usuário. Segue exatamente o precedente já
estabelecido por `src/utils/cronometro-descanso.ts` (RF05/RF06), que isola cálculo puro
(`calcularSegundosRestantes`, `ajustarFimEm`) fora dos serviços de storage e das telas,
tornando essas funções triviais de testar isoladamente caso o projeto venha a adotar um
framework de testes automatizados.

**Alternatives considered**:
- Definir a normalização como uma função interna (não exportada) dentro de
  `historico-evolucao.ts`: rejeitado — o próprio usuário pediu explicitamente que fosse
  "separada da lógica de agregação"; mantê-la como função utilitária exportada também
  permite reaproveitá-la em outro lugar no futuro (ex.: RF09b, se precisar comparar
  nomes de exercícios na edição de um registro histórico).

## Decisão 4: Regra de normalização — apenas espaços e caixa (implementação)

**Decision**:

```ts
export function normalizarNomeExercicio(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ').toLowerCase();
}
```

**Rationale**: Implementação direta da regra já definida em spec.md (FR-006):
remove espaços nas pontas, colapsa espaços internos múltiplos em um único espaço, e
ignora diferença de maiúsculas/minúsculas — sem tocar em acentuação, pontuação ou
qualquer outra transformação. `String.prototype.trim`/`replace`/`toLowerCase` são
suficientes; nenhuma dependência externa (ex.: biblioteca de "slugify" ou
normalização Unicode) é necessária para essa regra deliberadamente restrita.

**Alternatives considered**:
- Usar `String.prototype.normalize('NFD')` para também ignorar diferenças de
  acentuação: rejeitado — spec.md (FR-006, Assumptions) decide explicitamente que
  acentuação **não** é normalizada, para não arriscar unificar exercícios só
  parecidos; usar `normalize('NFD')` violaria diretamente essa decisão da spec.

## Decisão 5: Universo de exercícios = união dos exercícios de todos os treinos do perfil

**Decision**: A lista de exercícios exibida na tela (cada um virando uma seção
`Collapsible`) é construída a partir de **todos** os exercícios de **todos** os treinos
do perfil ativo (via `listarTreinos`), normalizados e deduplicados por
`normalizarNomeExercicio` — não apenas os exercícios que aparecem em alguma sessão
finalizada. Os registros (séries) de cada grupo são então anexados a partir das sessões
finalizadas, quando existirem; um grupo pode legitimamente ter zero registros.

**Rationale**: Necessário para satisfazer FR-009 e a User Story 3, Acceptance Scenario
2 da spec: "o perfil ativo tem sessões finalizadas, mas nenhuma delas contém séries de
um exercício específico... o app indica claramente que esse exercício ainda não tem
registros". Isso só é possível se a tela souber que aquele exercício existe (porque faz
parte de um treino importado) mesmo sem nenhum registro — se o universo de exercícios
viesse apenas das sessões, um exercício nunca executado simplesmente não apareceria em
lugar nenhum, e a spec exige que ele apareça com uma mensagem explícita, não que fique
invisível.

**Alternatives considered**:
- Construir o universo de exercícios apenas a partir das sessões finalizadas (um
  exercício só aparece se já tiver pelo menos um registro): rejeitado — não satisfaz
  FR-009/User Story 3 Acceptance Scenario 2, que exige poder "consultar o histórico
  desse exercício" mesmo quando ele nunca foi registrado.

## Decisão 6: Dois níveis de estado vazio — tela inteira (FR-010) vs. por exercício (FR-009)

**Decision**: `obterHistoricoPorPerfil` retorna um tipo discriminado:

```ts
export type HistoricoPerfil =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] };
```

Quando `listarSessoesFinalizadas(perfilId)` devolve um array vazio (nenhuma sessão
finalizada em nenhum treino do perfil), a função retorna `{ temSessoesFinalizadas:
false }` e a tela exibe uma única mensagem de estado vazio geral (FR-010), sem tentar
enumerar exercícios. Caso contrário, retorna `{ temSessoesFinalizadas: true, evolucoes
}`, e cada item de `evolucoes` com `registros.length === 0` é renderizado como uma
seção que existe, mas mostra sua própria mensagem "sem registros ainda" (FR-009).

**Rationale**: FR-009 e FR-010 são duas coisas diferentes na spec — o primeiro é sobre
um exercício específico sem histórico (dentre outros que podem ter), o segundo é sobre
o perfil inteiro não ter absolutamente nenhum dado ainda. Tratar os dois com o mesmo
mecanismo (por exemplo, sempre listar exercícios e deixar cada um mostrar "sem
registros") funcionaria tecnicamente, mas geraria uma tela cheia de mensagens
repetidas de "sem registros" quando na verdade o problema é mais simples ("você ainda
não finalizou nenhum treino") — pior experiência do que uma única mensagem clara no
nível da tela.

**Alternatives considered**:
- Sempre retornar `evolucoes` (possivelmente vazio) e deixar a tela decidir, contando
  quantos itens existem: rejeitado — obrigaria a tela a reimplementar a mesma
  distinção que o serviço já pode fazer de forma mais direta e testável; o tipo
  discriminado deixa o contrato explícito no nível de dados, não de apresentação.

## Decisão 7: Data de cada registro = `finalizadaEm` da sessão, não `iniciadaEm`

**Decision**: `RegistroHistorico.data` é preenchido com `SessaoTreino.finalizadaEm` da
sessão de origem (garantidamente não-nulo, já que apenas sessões finalizadas entram no
histórico) — não com `iniciadaEm`. A ordenação "mais recente para mais antiga"
(FR-007) também usa `finalizadaEm` como critério de comparação.

**Rationale**: A spec fala em "data da sessão" sem especificar qual campo, entre os
dois já existentes em `SessaoTreino` (`iniciadaEm`, `finalizadaEm`). `finalizadaEm` é a
escolha mais correta semanticamente para um histórico: representa quando aquele
conjunto de séries foi de fato concluído, é o campo que a própria spec usa para
definir o que conta como histórico ("apenas sessões finalizadas"), e evita distorção em
sessões que ficaram muito tempo "em andamento" antes de finalizar (`iniciadaEm` nesse
caso mostraria uma data bem anterior ao momento real do treino).

**Alternatives considered**:
- Usar `iniciadaEm`: rejeitado pelo motivo acima — representaria pior "quando esse
  treino foi feito" em sessões que não foram finalizadas no mesmo dia em que
  começaram.
- Exibir ambas as datas: avaliado e descartado por simplicidade (Princípio II) — a
  spec pede apenas "data" no singular (FR-008); nada na spec sugere que a duração ou o
  início da sessão sejam relevantes para acompanhar evolução de carga.

## Decisão 8: `nomeExibido` do grupo sem registros usa a grafia do treino, não fica em branco

**Decision**: Quando um grupo tem `registros.length > 0`, `nomeExibido` é a grafia
original do exercício na sessão mais recente daquele grupo (já decidido em spec.md,
Assumptions). Quando um grupo tem `registros.length === 0` (exercício nunca
registrado — Decisão 5/6), `nomeExibido` usa a grafia do exercício no primeiro treino
do perfil que o contém, na ordem devolvida por `listarTreinos`.

**Rationale**: A spec já decide o caso "com registros" (Assumptions), mas não cobre
explicitamente o caso "sem nenhum registro ainda", que só passou a existir como
possibilidade a partir da Decisão 5 desta sessão de planejamento (universo de
exercícios vindo dos treinos, não das sessões). Usar a grafia do treino de origem é a
extensão mais direta da mesma regra já decidida — mostrar sempre alguma grafia real
que já existe nos dados, nunca inventar uma nova.

**Alternatives considered**:
- Deixar `nomeExibido` vazio/genérico ("Exercício sem nome") quando não há registros:
  rejeitado — o nome do exercício está disponível no treino mesmo sem nenhum registro;
  não usá-lo pioraria a experiência sem necessidade.

## Decisão 9: Ordenação da lista de exercícios (nível superior) — alfabética por `nomeExibido`

**Decision**: `EvolucaoExercicio[]` é ordenado alfabeticamente (ordem local
`pt-BR`, case-insensitive) por `nomeExibido`, independentemente de ter ou não
registros.

**Rationale**: A spec define explicitamente a ordenação **dentro** de cada exercício
(registros do mais recente para o mais antigo, FR-007), mas não diz nada sobre a ordem
dos próprios exercícios na lista. Ordem alfabética é o padrão mais previsível e fácil
de localizar visualmente para uma lista que pode crescer (todo exercício de todo
treino do perfil), evitando que a posição de um exercício "pule" na tela conforme
sessões são finalizadas (o que aconteceria, por exemplo, se a ordem fosse por data do
registro mais recente).

**Alternatives considered**:
- Ordenar pela data do registro mais recente de cada grupo (exercícios "mais ativos"
  primeiro): rejeitado — não é uma expectativa que a spec estabelece, e tornaria a
  posição de cada exercício instável entre uma visita e outra à tela, dificultando
  encontrar um exercício específico de cabeça.
- Manter a ordem "como aparece nos treinos" (ordem de `listarTreinos` e, dentro de
  cada um, ordem de `exercicios`): rejeitado — não define uma ordem clara para
  exercícios que aparecem em mais de um treino, e não é mais previsível do que ordem
  alfabética para o usuário.

## Decisão 10: Reaproveitar `Collapsible` já existente, sem rota nova por exercício

**Decision**: Cada `EvolucaoExercicio` é renderizado como uma seção `Collapsible`
(`src/components/ui/collapsible.tsx`, já usado pelo boilerplate que esta feature
substitui) dentro de uma única tela (`explore.tsx`), em vez de uma lista de exercícios
que navega para uma rota separada por exercício.

**Rationale**: Consistente com Constituição Princípio II (simplicidade): evita criar
uma rota nova (ex.: `/historico/[exercicio]`) e um componente de lista-mestre
dedicado só para navegar até ela, quando o componente `Collapsible` já resolve
"mostrar um título e revelar conteúdo ao tocar" sem nenhum código adicional. Há também
uma continuidade temática deliberada: o próprio arquivo sendo reescrito já usava
`Collapsible` no boilerplate do Expo — reaproveitá-lo, em vez de excluí-lo, é a opção
mais simples disponível.

**Alternatives considered**:
- Nova rota `/historico/[exercicio].tsx`, com a aba "Explore" listando apenas nomes
  (like `TreinoListItem`) e navegando via `router.push`: rejeitado — funcionalmente
  equivalente, mas adiciona uma rota, um parâmetro de rota (nome do exercício
  normalizado, exigindo encode/decode na URL) e uma tela a mais só para exibir uma
  lista simples que cabe perfeitamente em uma seção expansível na mesma tela.
- `FlatList` simples sem agrupamento visual (todos os registros de todos os exercícios
  em uma única lista longa, com o nome do exercício repetido em cada linha):
  rejeitado — contraria diretamente FR-005 (agrupar por exercício) e prejudicaria a
  leitura da evolução de um exercício específico em meio a dezenas de registros de
  outros exercícios intercalados.

## Decisão 11: Recarregamento via `useFocusEffect` + efeito em `perfilAtivo?.id`

**Decision**: `explore.tsx` recarrega o histórico tanto na montagem (via `useEffect`
dependente de `perfilAtivo?.id`) quanto sempre que a aba ganha foco (via
`useFocusEffect`, exportado por `expo-router`) — exatamente o mesmo par de hooks já
usado por `src/app/(tabs)/index.tsx` (RF02/RF07) para a lista de treinos e a contagem
de sessões finalizadas.

**Rationale**: O histórico depende de dados que mudam em outra tela (finalizar um
treino em `[treinoId].tsx`) e de uma troca de perfil (RF10). Sem recarregar ao ganhar
foco, o usuário veria um histórico desatualizado ao voltar de finalizar um treino sem
fechar e reabrir o app — mesmo argumento já registrado em
specs/009-salvar-sessao-treino/research.md, Decisão 10, para o contador de sessões.
Reaproveitar o padrão exato já validado evita introduzir uma segunda forma de resolver
o mesmo problema.

**Alternatives considered**:
- Recarregar apenas na montagem da tela: rejeitado — mesma razão já registrada no
  RF07, o histórico ficaria visivelmente desatualizado ao voltar de uma sessão recém
  finalizada sem fechar/reabrir o app, contrariando a expectativa razoável de
  atualização estabelecida pelo restante do app.

## Decisão 12: FR-014 como `console.warn` dentro de `historico-evolucao.ts`, no ponto da omissão

**Decision**: O diagnóstico de desenvolvimento pedido pelo usuário é um `console.warn`
simples, chamado dentro de `obterHistoricoPorPerfil` (ou de uma função auxiliar interna
não exportada que ele chama), exatamente no ponto em que um registro é descartado por
não ser possível resolver seu treino ou exercício de origem — incluindo, na mensagem,
os identificadores (`treinoId`, `exercicioId`, `sessaoId`) que causaram a omissão, para
que o diagnóstico seja útil o suficiente para localizar a causa durante testes
manuais, sem precisar de nenhuma investigação adicional.

**Rationale**: Pedido explícito do usuário: "FR-014 (log de diagnóstico) implementado
como console.warn simples, sem UI nem persistência". Colocar a chamada no próprio
`historico-evolucao.ts` (não em `sessao-treino-storage.ts` nem na tela) mantém o
diagnóstico no mesmo lugar onde a decisão de omitir é tomada — o serviço que já sabe
exatamente qual registro está descartando e por quê.

**Alternatives considered**:
- Lançar essa informação como parte do valor de retorno (ex.: um array
  `registrosOmitidos` adicional no `HistoricoPerfil`), deixando a tela decidir se loga:
  rejeitado — contraria "sem UI" da instrução do usuário; adicionar um campo ao
  contrato de retorno só para um diagnóstico de desenvolvimento aumenta a superfície
  do tipo sem necessidade (Princípio II), quando `console.warn` direto já resolve o
  pedido.

## Decisão 13 (correção pós-validação manual): rótulos das abas "Treinos"/"Histórico", não mais "Home"/"Explore"

**Achado durante a validação manual em dispositivo real**: ao testar o RF08 já
implementado e funcionando corretamente no Android (T009/T012/T014, todas
confirmadas), o usuário questionou por que a aba do histórico continuava rotulada
"Explore" — nome do boilerplate original do template Expo, sem relação nenhuma com
"histórico de evolução".

**Decisão original (pré-correção, registrada em spec.md, Assumptions)**: manter o
rótulo "Explore" inalterado, citando como precedente o fato de o RF02
(`003-listar-treinos`) não ter renomeado a aba "Home" ao substituir seu conteúdo
boilerplate pela lista de treinos.

**Por que essa decisão original estava malfundamentada**: revisando
`specs/003-listar-treinos/spec.md` e `research.md` a pedido do usuário, nenhum dos
dois documentos menciona rótulo de aba em nenhum momento — o RF02 nunca decidiu
manter "Home"; simplesmente nunca revisitou esse rótulo especificamente. Não havia,
portanto, um "padrão já estabelecido" a seguir — apenas um valor nunca alterado desde
o `create-expo-app` inicial. Citar isso como precedente deliberado foi um erro de
raciocínio desta sessão de planejamento, não uma decisão de produto real herdada de
uma feature anterior.

**Decision (revisada)**: `src/components/app-tabs.tsx` (`NativeTabs.Trigger.Label`) e
`src/components/app-tabs.web.tsx` (texto dentro de `TabButton`) passam a usar
"Treinos" para a primeira aba (`index`/`home`, RF02) e "Histórico" para a segunda
(`explore`, este RF08) — refletindo o conteúdo real de cada uma. Nenhuma outra
referência a "Home"/"Explore" foi encontrada em `src/` (confirmado por busca em todo
o diretório).

**Rationale**: os rótulos de navegação são a forma mais direta de o usuário entender
o que cada aba faz antes mesmo de tocar nela — mantê-los como texto de boilerplate
genérico, quando o conteúdo real já é específico e funcional (desde o RF02 e agora o
RF08), é uma inconsistência de UX sem justificativa de produto, distinta da decisão
registrada no PRD (seção 14) de postergar *identidade visual* (cores, tipografia)
enquanto o foco está em funcionalidade — nomear corretamente uma aba não é
"identidade visual", é comunicação básica da navegação.

**Alternatives considered**:
- Manter "Explore" e resolver isso em uma passada de identidade visual futura,
  separada: rejeitado — a mudança é trivial (duas strings, dois arquivos, sem lógica
  nova), o risco de regressão é essencialmente zero, e adiar uma correção tão barata
  só para "não misturar escopos" não se justifica quando o próprio usuário já
  identificou o problema testando esta feature.
- Renomear apenas "Explore" para "Histórico", deixando "Home" como estava: avaliado,
  mas rejeitado a pedido explícito do usuário — se a aba de treinos vai ganhar um
  nome correto, faz sentido corrigir as duas de uma vez, já que o mesmo raciocínio
  (rótulo genérico de boilerplate vs. conteúdo real específico) se aplica igualmente
  a ambas.
