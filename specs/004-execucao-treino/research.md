# Research: Tela de Execução do Treino

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — o projeto já
tem stack, storage e padrões de teste definidos desde RF01/RF02/RF10. As decisões abaixo
documentam escolhas de integração específicas desta feature, levantadas pelo usuário no
pedido de plano.

## Decisão 1: Como obter os dados do treino selecionado na nova rota

**Decision**: A rota `src/app/treino/[treinoId].tsx` recebe `treinoId` como parâmetro de
rota Expo Router (`useLocalSearchParams`). Ao montar, ela chama
`listarTreinos(perfilAtivo.id)` (já existente em `treino-storage.ts`) e localiza o treino
pelo `id` recebido, em vez de introduzir uma nova função `obterTreinoPorId`.

**Rationale**: `treino-storage.ts` já expõe `listarTreinos(perfilId)`, que retorna a lista
completa já filtrada por perfil — reaproveitá-la sem modificação atende ao pedido explícito
do usuário ("reaproveitar treino-storage.ts... sem modificação") e ao Princípio II da
Constituição (simplicidade: não criar uma nova função de storage só para buscar um item por
id quando a lista completa já está disponível e é pequena, uso pessoal). Passar apenas o
`treinoId` pela rota (em vez de todo o objeto `Treino` serializado na URL) mantém a
navegação simples e evita problemas de serialização de objetos grandes em parâmetros de
rota do Expo Router.

**Alternatives considered**:
- Serializar o `Treino` inteiro como parâmetro de rota (JSON stringificado): rejeitado por
  ser frágil (limites de tamanho de parâmetros de navegação, necessidade de
  parse/stringify manual) e por duplicar o dado já disponível via storage.
  Reintroduziria complexidade não solicitada.
- Criar uma nova função `obterTreinoPorId(perfilId, treinoId)` em `treino-storage.ts`:
  rejeitado porque o usuário pediu explicitamente reaproveitar o arquivo sem modificação;
  além disso, seria uma otimização prematura para uma lista de tamanho pessoal (dezenas de
  itens, conforme assunção já registrada no RF02).

## Decisão 2: Navegação real a partir do item da lista (RF02)

**Decision**: Em `src/app/(tabs)/index.tsx`, a função `handleSelecionarTreino` (hoje um
`Alert.alert` provisório, ver linha 107-109 do arquivo atual) é substituída por
`router.push(`/treino/${treino.id}`)`, usando o `router` do `expo-router` já importado
nesse arquivo.

**Rationale**: Fecha a lacuna deixada intencionalmente pela User Story 5 do RF02 ("nenhuma
navegação efetiva de tela precisa ocorrer" naquele momento, pois o RF03 não existia ainda).
Agora que a tela de destino existe, a navegação real é parte do escopo desta feature,
conforme instrução explícita do usuário no pedido de plano.

**Alternatives considered**:
- Manter o `Alert` e adicionar a navegação em uma função separada chamada condicionalmente:
  rejeitado por adicionar indireção sem benefício — a troca direta do corpo da função é
  mais simples e não quebra nenhum contrato externo (a função já era privada à tela).

## Decisão 3: Onde e como manter o estado da série atual

**Decision**: O estado de execução (exercício atualmente selecionado, série em andamento,
valores digitados de carga e reps por série) é mantido via `useState`/`useReducer` local no
componente da rota `src/app/treino/[treinoId].tsx` (ou em um componente filho dedicado,
`exercicio-execucao.tsx`, recebendo o exercício via props). Nenhum dado é persistido em
`AsyncStorage` nesta feature.

**Rationale**: Atende à instrução explícita do usuário e à Assumption já registrada na spec
("persistência... é escopo do RF04/RF07"). Manter o estado em memória local, sem introduzir
um novo serviço ou contexto global, é a solução mais simples que atende ao requisito atual
(Princípio II da Constituição) — não há necessidade de compartilhar esse estado entre
telas nesta etapa, pois a navegação entre exercícios acontece dentro da mesma rota
(lista de exercícios ↔ execução do exercício selecionado, ambos na mesma tela/rota).

**Alternatives considered**:
- Um Context/Provider dedicado (`ExecucaoTreinoProvider`), similar a `usePerfilAtivo`:
  rejeitado por enquanto — o padrão de Context faz sentido para estado que precisa ser
  acessado por múltiplas rotas/telas simultaneamente (como o perfil ativo), o que não é o
  caso aqui: o estado de série vive inteiramente dentro da tela de execução de um único
  treino. Introduzir um Context agora seria complexidade antecipada não solicitada pelo
  requisito (violaria o Princípio II).
- Persistir o estado da série a cada tecla digitada (rascunho local): fora de escopo desta
  feature por decisão explícita do usuário; deixado para RF04/RF07, que já preveem a
  persistência de sessão em andamento.

## Decisão 4: Estrutura de rota (arquivo único vs. sub-rotas por exercício)

**Decision**: Uma única rota dinâmica `src/app/treino/[treinoId].tsx` cobre tanto a lista de
exercícios planejados quanto a área de execução do exercício selecionado, alternando a
exibição via estado local (qual exercício está "aberto"), em vez de criar uma segunda rota
aninhada (ex: `src/app/treino/[treinoId]/exercicio/[exercicioId].tsx`).

**Rationale**: A spec (User Stories 2 e 3) descreve uma navegação leve entre "ver a lista"
e "abrir um exercício e iniciar", sem exigir deep-linking direto para um exercício
específico nem estado compartilhado entre rotas separadas. Uma única rota com estado local
é mais simples (Princípio II) e evita re-fetch do treino ao alternar entre exercícios
dentro da mesma tela.

**Alternatives considered**:
- Sub-rota por exercício (`.../exercicio/[exercicioId].tsx`): rejeitada nesta etapa por
  adicionar complexidade de roteamento (nova pasta, novo parâmetro, re-busca do treino a
  cada troca de exercício) sem benefício claro para os requisitos desta feature; pode ser
  reconsiderada em RF04 se a navegação precisar de deep-linking ou histórico de navegação
  mais rico entre exercícios.
