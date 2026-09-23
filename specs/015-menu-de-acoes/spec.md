# Feature Specification: Tela Separada para Ações de Perfil e Importação

**Feature Branch**: `015-menu-de-acoes`

**Created**: 2026-09-22

**Status**: Implemented (código pronto, validado via web; pendente validação real em Android/iOS)

**Requisito**: RF14 (PRD, seção 6 — pós-MVP)

**Nota**: Melhoria pós-desenvolvimento — não fazia parte do escopo original do MVP.
Solicitada pelo usuário após testar o app em uso real, para simplificar a tela
principal.

**Input**: User description: "A parte de perfil (trocar perfil), importar treino e
importar treino de exemplo podem ir para uma tela separada, até um menu lateral. Opção
escolhida pelo usuário entre as alternativas apresentadas: tela separada, acessada por
um ícone no topo — mais simples que um menu lateral deslizante, sem exigir dependência
de navegação nova (drawer). Contexto investigado no código: hoje esses três atalhos
('Perfil ativo: ... (trocar)', 'Importar treino', 'Importar treino de exemplo') ficam
no topo da tela 'Treinos' (src/app/(tabs)/index.tsx), acima da lista de treinos
propriamente dita."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tela "Treinos" focada só nos treinos (Priority: P1)

O usuário abre a aba "Treinos" e vê, no topo, direto a lista dos seus treinos — sem os
três atalhos de perfil/importação ocupando espaço antes da lista, que hoje empurram o
conteúdo relevante para baixo.

**Why this priority**: É o problema relatado — a tela principal está poluída com ações
que não são o uso do dia a dia (o usuário troca de perfil e importa treino raramente;
ele confere e executa treinos todo dia).

**Independent Test**: Abrir a aba "Treinos" e confirmar que os textos "Perfil ativo:
... (trocar)", "Importar treino" e "Importar treino de exemplo" não aparecem mais
nessa tela — só o título e a lista de treinos (e o estado vazio, quando aplicável).

**Acceptance Scenarios**:

1. **Given** o usuário abre a aba "Treinos", **When** a tela carrega, **Then** os
   atalhos de trocar perfil, importar treino e importar treino de exemplo não estão
   mais visíveis nessa tela.
2. **Given** a lista de treinos de um perfil está vazia, **When** o usuário abre a aba
   "Treinos", **Then** a mensagem de estado vazio ainda orienta como importar um
   treino, indicando onde encontrar essa ação (a nova tela/ícone), sem deixar o usuário
   sem saída.

---

### User Story 2 - Acessar as ações de perfil/importação a partir de um ícone (Priority: P1)

O usuário precisa trocar de perfil, ou importar um treino novo, e sabe que pode fazer
isso a qualquer momento apertando um ícone visível no topo do app — que o leva para
uma tela dedicada com as três ações: trocar perfil, importar treino, importar treino
de exemplo.

**Why this priority**: É a contrapartida obrigatória da User Story 1 — sem um jeito
claro de acessar essas ações, o app perderia funcionalidade essencial (trocar de
perfil, importar treino são ações RF01/RF07 já existentes e não podem ficar
inacessíveis).

**Independent Test**: A partir de qualquer aba do app, apertar o ícone de ações no
topo e confirmar que a tela aberta mostra as três ações (trocar perfil, importar
treino, importar treino de exemplo), cada uma funcionando exatamente como funciona
hoje.

**Acceptance Scenarios**:

1. **Given** o usuário está em qualquer aba do app (Treinos ou Histórico), **When** ele
   aperta o ícone de ações no topo, **Then** uma tela dedicada é aberta, mostrando as
   três ações.
2. **Given** o usuário está na tela de ações, **When** ele aperta "Trocar perfil",
   **Then** o comportamento é idêntico ao existente hoje (leva para a tela de
   selecionar perfil).
3. **Given** o usuário está na tela de ações, **When** ele aperta "Importar treino" ou
   "Importar treino de exemplo", **Then** o comportamento (seletor de arquivo,
   mensagens de sucesso/erro/parcial) é idêntico ao já existente hoje — só o local de
   onde a ação é disparada muda.
4. **Given** o usuário importou um treino a partir da nova tela de ações, **When** ele
   volta para a aba "Treinos", **Then** o treino recém-importado aparece na lista,
   exatamente como acontece hoje.

---

### Edge Cases

- O usuário importa um treino a partir da tela de ações e permanece nela (não volta
  imediatamente para "Treinos") → a mensagem de confirmação (sucesso/erro/parcial)
  aparece normalmente ali mesmo, igual já acontece hoje na tela "Treinos"; a lista de
  treinos é atualizada assim que o usuário voltar para a aba "Treinos" (mesmo
  mecanismo de recarregamento ao focar a tela já existente hoje).
- Não existe nenhum perfil ativo ainda (fluxo de primeiro uso) → o app continua
  redirecionando automaticamente para a criação/seleção de perfil antes de chegar em
  qualquer tela com abas, sem alteração desta feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE remover os atalhos de trocar perfil, importar treino e
  importar treino de exemplo da tela "Treinos", mantendo nela apenas o título e a
  lista de treinos (e o estado vazio).
- **FR-002**: O sistema DEVE exibir um ícone de acesso às ações de perfil/importação,
  visível e no mesmo lugar a partir de qualquer aba do app.
- **FR-003**: Ao apertar esse ícone, o sistema DEVE abrir uma tela dedicada contendo
  as três ações: trocar perfil, importar treino, importar treino de exemplo.
- **FR-004**: Cada uma das três ações, na nova tela, DEVE se comportar exatamente como
  hoje (mesmo fluxo de seleção de arquivo, mesmas mensagens de sucesso/erro/importação
  parcial, mesma navegação para a tela de seleção de perfil) — esta feature apenas
  muda onde essas ações ficam localizadas, não como elas funcionam.
- **FR-005**: A mensagem de estado vazio da lista de treinos (quando o perfil ativo
  ainda não tem nenhum treino importado) DEVE continuar orientando o usuário sobre como
  importar um treino, ajustada para indicar a nova localização dessa ação.

### Key Entities

Não aplicável — esta feature reorganiza a navegação entre telas já existentes, sem
introduzir ou alterar entidades de dados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tela "Treinos" mostra a lista de treinos imediatamente abaixo do
  título, sem nenhum atalho de perfil/importação antes dela.
- **SC-002**: 100% das três ações (trocar perfil, importar treino, importar treino de
  exemplo) continuam acessíveis e funcionando sem nenhuma mudança de comportamento
  perceptível, apenas em uma nova localização.
- **SC-003**: O ícone de acesso a essas ações está visível e no mesmo lugar
  independente de qual aba do app o usuário está usando.

## Assumptions

- **Sem dependência nova**: a tela dedicada é uma tela adicional dentro do Expo Router
  já usado no projeto (`src/app/`), não um menu lateral (drawer) — decisão explícita do
  usuário para evitar adicionar uma dependência de navegação nova
  (`@react-navigation/drawer`) e o build nativo que isso provavelmente exigiria.
- **Ícone no cabeçalho compartilhado**: como as três ações não são específicas da aba
  "Treinos" (trocar perfil é relevante em qualquer contexto), o ícone de acesso fica no
  cabeçalho compartilhado entre as abas (`app-tabs`), não duplicado em cada tela — a
  posição exata (ao lado do nome do app, ou em outro canto do cabeçalho) fica a critério
  da fase de planejamento/implementação, respeitando o layout já validado pelo usuário.
- **Sem mudança de fluxo de dados**: os handlers de importação continuam usando os
  mesmos serviços já existentes (`treino-storage`); a lista de treinos na aba "Treinos"
  continua se atualizando via o mesmo mecanismo de recarregamento ao focar a tela já
  existente hoje, sem necessidade de comunicação nova entre as duas telas.
