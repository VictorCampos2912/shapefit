# Research: Criar e Selecionar Perfil Local

**Feature**: 001-perfil-local | **Date**: 2026-09-14

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — todas as
decisões técnicas já foram fornecidas explicitamente pelo usuário no comando `/speckit-plan`
ou eram inferíveis do estado atual do repositório. Este documento registra as decisões e
alternativas consideradas para as escolhas técnicas envolvidas.

## Decisão 1: Mecanismo de navegação — Expo Router (não React Navigation manual)

- **Decision**: Usar o Expo Router (`expo-router` ~57.0.21) já configurado no projeto como
  `main` (`expo-router/entry`), com roteamento file-based em `src/app/`. A tela de perfil é
  implementada como novas rotas (`src/app/perfil/criar.tsx`, `src/app/perfil/selecionar.tsx`)
  e o redirecionamento inicial acontece no `_layout.tsx` raiz.
- **Rationale**: O projeto já está construído sobre Expo Router — `package.json` declara
  `"main": "expo-router/entry"`, o plugin `expo-router` está registrado em `app.json`, e
  `src/app/_layout.tsx`, `index.tsx`, `explore.tsx` já existem como rotas. Expo Router usa
  React Navigation internamente, então a instrução do usuário ("seguir a estrutura de
  navegação com react-navigation") é satisfeita pela infraestrutura já presente, sem
  necessidade de configurar `NavigationContainer`/`Stack.Navigator` manualmente. Introduzir
  uma segunda forma de navegação em paralelo violaria o Princípio II (Simplicidade) e
  criaria conflito com a estrutura já funcional.
- **Alternatives considered**: Configurar React Navigation manualmente (`@react-navigation/
  native` + `@react-navigation/native-stack`) substituindo o Expo Router — rejeitado por
  exigir remover a infraestrutura já configurada e por não ser necessário, já que o Expo
  Router entrega a mesma capacidade de navegação em pilha exigida pelo fluxo (perfil →
  tabs). Confirmado com o usuário via pergunta de esclarecimento.

## Decisão 2: Persistência local — AsyncStorage com chaves prefixadas por `perfil_id`

- **Decision**: Usar `@react-native-async-storage/async-storage` para persistir (a) a lista
  de perfis e o identificador do perfil ativo sob uma chave global (`perfis`), e (b) todo
  dado futuro dependente de perfil sob chaves no formato `<dominio>:<perfil_id>` (ex.:
  `treinos:<perfil_id>`, `sessoes:<perfil_id>`), centralizado em uma camada de serviço
  (`src/services/perfil-storage.ts`).
- **Rationale**: Instrução explícita do usuário e alinhado ao PRD (seção 9: "Armazenamento
  local: AsyncStorage no MVP"). O prefixo por `perfil_id` implementa diretamente o Princípio
  V da Constituição (Isolamento de Dados por Perfil, NON-NEGOTIABLE), estabelecendo o padrão
  que RF01, RF02, RF07 e RF08 deverão seguir.
- **Alternatives considered**: `expo-sqlite` — mencionado no PRD apenas como migração
  futura ("migrar para expo-sqlite quando o volume de dados justificar"), fora de escopo do
  MVP; rejeitado por antecipar complexidade não solicitada (Princípio II). Um banco de dados
  único com um campo `perfil_id` por registro (em vez de chaves prefixadas) — rejeitado por
  não ser o padrão natural do AsyncStorage (que é key-value, não relacional) e por não
  refletir a instrução explícita do usuário sobre o formato das chaves.

## Decisão 3: Identificação do perfil (chave primária)

- **Decision**: Cada perfil recebe um `id` gerado localmente no momento da criação via
  `Crypto.randomUUID()` do pacote `expo-crypto`, independente do campo `nome`.
- **Rationale**: FR-014 do spec exige que dois perfis possam ter o mesmo nome sem conflito;
  a identidade MUST ser um identificador próprio. Isso também é o valor usado como
  `perfil_id` nas chaves prefixadas do AsyncStorage. `expo-crypto` é usado em vez do
  `crypto.randomUUID()` global do JavaScript porque este não é garantido disponível no motor
  Hermes (runtime padrão do React Native/Expo) sem polyfill adicional; `expo-crypto` é a
  implementação nativa suportada oficialmente pelo Expo SDK gerenciado.
- **Alternatives considered**: Usar o `nome` como chave — rejeitado por violar FR-014
  diretamente. Usar `crypto.randomUUID()` global — rejeitado por risco de indisponibilidade
  em Hermes sem polyfill, o que quebraria a criação de perfil silenciosamente em produção.

## Decisão 4: Opções fixas dos campos "sexo" e "objetivo de treino"

- **Decision**: Definidas como constantes tipadas (`Sexo` e `ObjetivoTreino`) em
  `src/constants/perfil.ts`: `sexo` ∈ {Masculino, Feminino}; `objetivo` ∈ {Hipertrofia,
  Emagrecimento, Condicionamento, Manutenção}, já refletindo a atualização do spec.
- **Rationale**: Já resolvido na spec (seção Requirements, FR-002a/FR-002b), não é mais uma
  incerteza — apenas replicado aqui para rastreabilidade na modelagem de dados (Fase 1).
- **Alternatives considered**: N/A — decisão já tomada no nível de produto.

## Decisão 5: Estratégia de teste

- **Decision**: Validação manual em dispositivo físico (Redmi Note 12 / Android e iPhone 16
  Plus / iOS) via Expo Go, sem suíte de testes automatizados nesta feature.
- **Rationale**: O projeto não possui framework de testes configurado atualmente
  (`package.json` não lista `jest` nem equivalente), e o Princípio III da Constituição exige
  validação manual em dois dispositivos como gate mínimo, não teste automatizado
  obrigatório. Introduzir uma suíte de testes agora seria escopo adicional não solicitado
  (Princípio II).
- **Alternatives considered**: Adicionar Jest + React Native Testing Library — rejeitado
  por ampliar o escopo desta feature além do que foi pedido; pode ser proposto como
  iniciativa própria no futuro.

## Resumo

Todas as decisões técnicas estão resolvidas. Nenhum item permanece como
`NEEDS CLARIFICATION`. Pronto para Fase 1 (Design & Contracts).
