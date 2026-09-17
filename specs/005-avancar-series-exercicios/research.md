# Research: Avançar Entre Séries e Exercícios

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION`. As decisões
abaixo documentam escolhas de integração específicas desta feature, com destaque para a
descoberta de que a chave de storage já existe e já é consumida pelo RF10.

## Decisão 1: Compatibilidade obrigatória com `existeSessaoEmAndamento` (RF10)

**Decision**: O novo serviço `sessao-treino-storage.ts` escreve na mesma chave
`sessoes:${perfilId}` que `src/services/perfil-storage.ts` já lê (função
`existeSessaoEmAndamento`, usada por `definirPerfilAtivo` para bloquear troca de perfil).
A estrutura persistida por esta feature é um **superset** do tipo `SessaoRegistro` já
esperado por essa leitura (`{ perfilId: string; finalizadaEm: string | null }`), estendida
com `treinoId`, `iniciadaEm` e `execucoes`. A chave sempre guarda um **array** de sessões
(uma por `treinoId` iniciado por aquele perfil), nunca um objeto único.

**Rationale**: `perfil-storage.ts` (RF10) já foi implementado esperando exatamente esse
formato (`JSON.parse(raw) as SessaoRegistro[]`, depois `.some(s => s.finalizadaEm === null)`).
Se esta feature usasse uma chave diferente, ou gravasse um objeto único em vez de um array,
o bloqueio de troca de perfil do RF10 (já implementado e validado em produção) pararia de
funcionar silenciosamente — nenhum erro apareceria, apenas o bloqueio nunca dispararia.
Reaproveitar exatamente essa chave e esse formato de array atende ao pedido explícito do
usuário ("seguindo a convenção já estabelecida no RF10") e ao Princípio II da Constituição
(não introduzir uma segunda fonte de verdade para o mesmo conceito).

**Alternatives considered**:
- Introduzir uma nova chave (ex.: `sessoes-em-andamento:<perfilId>`) e migrar
  `perfil-storage.ts` para lê-la: rejeitado — RF10 já está implementado, validado em
  Android e iOS, e não há necessidade funcional de mudar seu contrato; alteraria um arquivo
  que o usuário pediu explicitamente para reaproveitar sem modificação.
- Gravar um objeto único por perfil (a "sessão ativa") em vez de um array: rejeitado,
  pois contradiz tanto a decisão já confirmada de múltiplas sessões simultâneas quanto o
  formato de array já lido por `existeSessaoEmAndamento`.

## Decisão 2: Onde mora a lógica de conclusão de série/exercício

**Decision**: A lógica de "concluir série" (validar campos, registrar no array
`seriesRealizadas`, avançar `serieAtual` ou marcar o exercício como concluído) e "concluir
exercício" (voltar à lista) fica no componente `ExercicioExecucao`
(`src/components/treino/exercicio-execucao.tsx`), que já recebe o estado do exercício via
props e devolve atualizações via `onAtualizarEstado` (padrão já estabelecido no RF03). A
chamada ao serviço de persistência (`sessao-treino-storage.ts`) é feita pelo componente pai,
`src/app/treino/[treinoId].tsx`, dentro do mesmo callback que já atualiza
`estadosPorExercicio` — ou seja, cada atualização de estado local é acompanhada de uma
escrita em `AsyncStorage`.

**Rationale**: Mantém o padrão de "componente controlado" já estabelecido pelo RF03
(`ExercicioExecucao` não mantém estado próprio de progresso) e evita duplicar em dois
lugares a decisão de quando persistir — a rota já é o único lugar que conhece tanto o
`perfilAtivo.id` (via `usePerfilAtivo`) quanto o `treino.id`, os dois dados necessários para
montar a chave e o conteúdo da sessão.

**Alternatives considered**:
- Persistir diretamente dentro de `ExercicioExecucao`: rejeitado — o componente não tem
  acesso a `perfilAtivo` nem a `treino.id` sem que sejam passados via props, o que
  duplicaria a responsabilidade de "quem sabe o contexto da sessão" entre dois componentes;
  mais simples manter essa responsabilidade só na rota.
- Introduzir um Context/Provider dedicado a sessão: rejeitado por ser complexidade
  antecipada (Princípio II) — o estado de sessão só é relevante dentro da rota de execução
  de um treino específico, não precisa ser compartilhado entre rotas.

## Decisão 3: Momento de criar a sessão em `AsyncStorage`

**Decision**: A sessão para um `treinoId` só é criada em `AsyncStorage` na primeira vez que
uma série é de fato concluída (primeiro "Concluir série" tocado) — não ao simplesmente
abrir a tela de execução ou tocar em "Iniciar exercício". Ao carregar a tela, o serviço
`sessao-treino-storage.ts` busca uma sessão existente para aquele `treinoId`; se não houver,
os estados de todos os exercícios partem como "não iniciado"/"pausado" em memória (como já
ocorre hoje), sem nenhuma escrita em storage.

**Rationale**: Evita gravar sessões "vazias" (sem nenhuma série concluída) que nunca
precisariam existir — reduz o número de escritas em `AsyncStorage` e mantém a leitura de
`existeSessaoEmAndamento` (RF10) significativa (uma sessão só aparece na lista quando o
usuário de fato começou a registrar algo, não apenas visitou a tela).

**Alternatives considered**:
- Criar a sessão ao tocar em "Iniciar exercício" (antes de qualquer série concluída):
  rejeitado — geraria sessões "em andamento" sem nenhum dado de série, poluindo a lista
  para o RF10 e potencialmente bloqueando troca de perfil por uma ação que não gravou
  progresso real algum.

## Decisão 4: Carga sugerida ao avançar de série

**Decision**: Ao avançar de uma série concluída para a próxima do mesmo exercício, o campo
de carga é pré-preenchido com o valor usado na série recém-concluída (não o
`cargaSugeridaKg` original do JSON) — conforme já assumido na spec (FR-004, Assumptions).

**Rationale**: Reflete o padrão comum de manter a mesma carga entre séries de um exercício;
implementação trivial (copiar `estado.cargaKg` atual para o próximo, em vez de reler
`exercicio.cargaSugeridaKg`), sem necessidade de nenhuma lógica adicional.

**Alternatives considered**: Nenhuma — já decidido na spec, incluído aqui apenas para
registro de rastreabilidade entre spec e implementação.
