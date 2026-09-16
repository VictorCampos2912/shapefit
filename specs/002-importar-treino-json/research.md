# Research: Importar Treino via Arquivo JSON

**Feature**: 002-importar-treino-json | **Date**: 2026-09-15

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — todas as
decisões técnicas já foram fornecidas explicitamente pelo usuário no comando `/speckit-plan`,
já resolvidas nos critérios de aceite do RF01, ou herdadas diretamente dos padrões
estabelecidos pelo RF10. Este documento registra as decisões e alternativas consideradas.

## Decisão 1: Seletor de arquivos — `expo-document-picker`

- **Decision**: Usar `expo-document-picker` para abrir o seletor de arquivos nativo do
  sistema operacional, restrito a arquivos com MIME type de JSON (`application/json`) quando
  suportado pela plataforma, com fallback para aceitar qualquer arquivo e validar a extensão/
  conteúdo depois.
- **Rationale**: Instrução explícita do usuário e já registrado como decisão nos critérios de
  aceite do RF01 (`docs/criterios-aceite.md`). É a biblioteca padrão do Expo SDK gerenciado
  para este propósito, evitando código nativo customizado.
- **Alternatives considered**: Implementar um seletor de arquivos customizado com módulos
  nativos — rejeitado por sair do Expo SDK gerenciado (Princípio II e stack do PRD).

## Decisão 2: Leitura do conteúdo do arquivo selecionado

- **Decision**: Após o `expo-document-picker` retornar o URI do arquivo (copiado para o cache
  do app via `copyToCacheDirectory: true`), ler o conteúdo com `fetch(uri).then(r => r.text())`
  (API padrão de rede do React Native, não uma função do `expo-file-system`), e então fazer
  `JSON.parse` sobre o texto lido.
- **Rationale**: `expo-document-picker` retorna metadados e um URI local do arquivo copiado
  para a sandbox do app, mas não lê o conteúdo diretamente. **Três tentativas foram feitas
  durante a validação manual (T020) até chegar à solução estável**:
  1. `FileSystem.readAsStringAsync` (import de `'expo-file-system'`, export principal do SDK
     57 ~57.0.7): passou no type-check, mas falhava em runtime — o SDK 57 substituiu a API
     funcional legada por uma API orientada a classes (`File`, `Directory`) nesse export; as
     funções antigas ali são apenas stubs que **lançam erro de propósito**
     (`@deprecated ... This method will throw in runtime.`).
  2. `new File(uri).text()` (API nova de classes): falhou em runtime no dispositivo físico
     (Expo Go, Android) com `this.validatePath is not a function` — o binding nativo da API
     nova não está disponível/funcional nesse ambiente de teste.
  3. `FileSystem.readAsStringAsync` importado explicitamente de `expo-file-system/legacy`:
     falhou com `IOException: Location '.../DocumentPicker/<uuid>.json' isn't readable` — um
     problema conhecido e recorrente do ecossistema Expo (ex.: expo/expo#21792, #17810, #23288):
     em determinadas condições no Android, o arquivo copiado para o cache pelo
     `expo-document-picker` não fica imediatamente legível pela ponte nativa de sistema de
     arquivos usada por `readAsStringAsync`, mesmo com `copyToCacheDirectory: true`.
  4. **Solução estável**: usar `fetch(uri)` (a API de rede padrão do React Native, disponível
     globalmente, sem import de `expo-file-system`) sobre o mesmo URI e ler `.text()` da
     resposta. Esse caminho passa pela camada de rede/blob do React Native em vez da ponte
     nativa de sistema de arquivos que apresenta a limitação acima, e é a alternativa
     recomendada pela própria comunidade Expo para este cenário específico.
- **Alternatives considered**: `expo-file-system` em qualquer uma de suas três formas de uso
  (API nova por classes, export principal, ou `/legacy`) — todas rejeitadas após falhas
  reprodutíveis em runtime no dispositivo físico de teste (Redmi Note 12, Expo Go), documentadas
  nas tentativas 1–3 acima. Como resultado, `expo-file-system` deixou de ser uma dependência
  necessária desta feature — apenas `expo-document-picker` permanece como dependência nova (ver
  Complexity Tracking em plan.md, que deve ser atualizado para remover a menção a
  `expo-file-system`).

## Decisão 3: Estrutura e local da validação do JSON

- **Decision**: A validação ocorre em duas camadas dentro de `src/services/treino-storage.ts`:
  (1) validação estrutural mínima do treino (campo `nome` presente e não vazio; campo
  `exercicios` presente e é uma lista não vazia) — se falhar, a importação inteira é rejeitada
  (FR-007, FR-008); (2) validação por exercício (campos `id`, `nome`, `series`, `reps_alvo`,
  `carga_sugerida_kg`, `descanso_seg` presentes e com o tipo esperado) — exercícios que falham
  nesta camada são descartados individualmente, sem interromper os demais (FR-005).
- **Rationale**: Reflete diretamente a estrutura de requisitos da spec (FR-005 vs. FR-007/
  FR-008), que distingue explicitamente entre erro estrutural do arquivo (rejeição total) e
  erro pontual de um exercício (descarte parcial). Implementação com funções de validação
  simples (sem biblioteca de schema como `zod` ou `yup`) é suficiente dado o schema pequeno e
  fixo definido no PRD (seção 8), alinhado ao Princípio II (Simplicidade).
- **Alternatives considered**: Usar uma biblioteca de validação de schema (ex.: `zod`) —
  rejeitado por introduzir uma nova dependência não solicitada para resolver um problema já
  simples o suficiente para validação manual (5-6 campos fixos por exercício), contrariando o
  Princípio II e o Princípio IV (controle de dependências).

## Decisão 4: Ponto de entrada da ação de importar (RF02 ainda não implementado)

- **Decision**: Adicionar temporariamente um botão/ação "Importar treino" na tela inicial
  (`src/app/(tabs)/index.tsx`), que aciona o fluxo de importação descrito nesta feature. Este
  ponto de entrada é considerado provisório e deve ser revisitado/movido quando o RF02 (lista
  de treinos) for implementado.
- **Rationale**: A spec do RF01 não depende da existência da tela de lista de treinos (RF02)
  para ser validável — os critérios de aceite do RF01 pedem apenas que "o treino aparece na
  lista de treinos salvos" como resultado observável, não que a lista em si seja construída
  nesta feature. Adiar a criação da tela de lista para o RF02 evita antecipar escopo alheio
  (Princípio II), mas exige um ponto de entrada mínimo e visível para tornar a ação
  testável manualmente nesta feature.
- **Alternatives considered**: Implementar já a tela de lista de treinos (RF02) como parte
  desta feature — rejeitado por expandir o escopo desta feature além do que foi pedido, e por
  já existir uma especificação própria e ainda não planejada para o RF02.

## Decisão 5: Persistência — chave `treinos:<perfil_id>`

- **Decision**: Usar a chave AsyncStorage `treinos:<perfil_id>`, já definida em
  `specs/001-perfil-local/data-model.md` (seção "Convenção de chaves AsyncStorage"), para
  armazenar a lista de treinos importados por perfil, obtendo o `perfil_id` do perfil ativo no
  momento da importação via `usePerfilAtivo()`.
- **Rationale**: Instrução explícita do usuário; é exatamente o padrão que o RF10 já
  estabeleceu como obrigatório (Princípio V, NON-NEGOTIABLE) para qualquer dado dependente de
  perfil. Reaproveitar a convenção evita duplicar decisões de arquitetura já tomadas.
- **Alternatives considered**: Nenhuma — a convenção já está definida e é vinculante.

## Decisão 6: Estratégia de teste

- **Decision**: Validação manual em dispositivo físico (Redmi Note 12 / Android e iPhone 16
  Plus / iOS) via Expo Go, usando os arquivos já existentes em `docs/exemplos/`
  (`treino-exemplo.json` para o caminho feliz e importação do arquivo de exemplo pré-carregado
  — FR-009; `treino-exemplo-com-erro.json` para o cenário de erro parcial — FR-005/FR-006).
- **Rationale**: Mesma abordagem adotada pelo RF10, exigida pelo Princípio III da
  Constituição; o projeto já possui fixtures adequadas preparadas nos critérios de aceite,
  eliminando a necessidade de criar novos arquivos de teste.
- **Alternatives considered**: Adicionar testes automatizados de parsing/validação — rejeitado
  pelos mesmos motivos já registrados na Decisão 5 do research.md do RF10 (ausência de
  framework de testes configurado no projeto; fora de escopo desta feature introduzir um).

## Resumo

Todas as decisões técnicas estão resolvidas. Nenhum item permanece como
`NEEDS CLARIFICATION`. Pronto para Fase 1 (Design & Contracts).
