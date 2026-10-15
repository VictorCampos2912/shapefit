# Implementation Plan: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Branch**: `024-indicador-andamento-e-menu-acoes` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-indicador-andamento-e-menu-acoes/spec.md`

## Summary

Dois ajustes pequenos e independentes entre si (RF23, PRD seção 6 — nova entrada,
ver `spec.md`): (1) a lista de treinos passa a destacar visualmente qualquer treino
com sessão em andamento (`finalizadaEm === null`), reaproveitando o mesmo par de
cor/borda de aviso já usado para "exercício em andamento" (`exercicio-list-item.tsx`)
mais um texto curto ("Em andamento"), derivado da função já existente `obterSessao`
sem nenhuma leitura nova de storage e atualizado pelo mesmo `useFocusEffect` já
existente na lista; (2) a ação "Importar treino de exemplo" sai do menu de Ações,
levando consigo a função `importarTreinoExemplo` e o asset
`assets/exemplos/treino-exemplo.json`, sem tocar em `docs/exemplos/` nem nas outras
três ações do menu. Nenhuma dependência nova, nenhuma mudança em Firestore ou
regras de segurança — tudo reaproveita infraestrutura já existente
(`sessao-treino-storage.ts`, `treino-list-item.tsx`, `exercicio-list-item.tsx`,
`treino-storage.ts`).

## Technical Context

**Language/Version**: TypeScript (strict), React Native + Expo SDK 57 (ver
`AGENTS.md` — consultar a documentação versionada antes de qualquer alteração de
código, ainda que esta feature não introduza API nova do Expo)

**Primary Dependencies**: nenhuma dependência nova — `AsyncStorage`
(`@react-native-async-storage/async-storage`) e `expo-router` já presentes e
usados sem alteração de versão

**Storage**: AsyncStorage, chave `sessoes:<uid>` (já existente desde RF04,
migrada de `perfilId` para `uid` pela spec 022) — somente leitura nesta feature,
via a função já exportada `obterSessao`; nenhuma coleção nova, nenhuma mudança de
schema, nenhuma escrita nova

**Testing**: validação manual em Android (Constitution v2.0.0, Princípio III) —
sem framework de testes automatizados neste projeto; roteiro em `quickstart.md`;
iOS pendente por falta de conta Apple Developer paga (mesma situação herdada das
specs 022/023)

**Target Platform**: Android 12+ (Redmi Note 12), via development build
(`expo-dev-client`, já exigido desde a spec 022)

**Project Type**: mobile-app (Expo Router, `src/app/`)

**Performance Goals**: N/A — uma chamada adicional por treino a uma função já
existente (`obterSessao`), do mesmo tipo e ordem de grandeza das duas chamadas já
feitas hoje por treino na mesma tela (`contarSessoesFinalizadas`,
`obterDataUltimaSessaoFinalizada`)

**Constraints**:

- FR-005 exige que esta feature não altere onde/como a sessão em andamento é
  persistida — resolvido não tocando em `sessao-treino-storage.ts` (só consome
  `obterSessao`, já existente, sem assinatura nova).
- FR-010/FR-011 exigem remover só código/asset órfãos, sem apagar nada em
  `docs/exemplos/` — resolvido pelo levantamento exaustivo de referências
  (`research.md`, Decisão 4).
- FR-012 exige emendar `docs/criterios-aceite.md` (RF01/RF14) sem apagar
  histórico — resolvido com nota de emenda, mesmo padrão já usado no documento
  (`contracts/menu-acoes.md`).

**Scale/Scope**: 1 prop nova em 1 componente já existente, 1 função nova
(client-side, dentro de `index.tsx`, espelhando duas já existentes), 2 remoções
de função/import em 2 arquivos já existentes, 1 asset apagado, 1 documento de
critérios de aceite emendado — ver Project Structure.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra `.specify/memory/constitution.md` v2.0.0:

- **Princípio I (TypeScript Obrigatório)**: PASS — `emAndamento?: boolean` é
  adicionado a `TreinoListItemProps` (tipo já existente, sem `any`); a função nova
  em `index.tsx` é tipada com o mesmo padrão `Promise.all`/`Record<string,
  boolean>` já usado pelas duas funções irmãs existentes.
- **Princípio II (Simplicidade sobre Funcionalidades Avançadas)**: PASS —
  reaproveita `obterSessao` (já existente) em vez de criar uma nova consulta de
  storage; reaproveita o par de estilo cor/borda já usado por
  `exercicio-list-item.tsx` em vez de extrair um componente/estilo compartilhado
  novo (`research.md`, Decisão 1); nenhuma abstração nova para a remoção da ação
  de exemplo — só exclusão direta de código órfão.
- **Princípio III (Validação em Dois Dispositivos-Alvo)**: PASS, com a mesma
  ressalva já registrada nas specs 022/023 — `quickstart.md` cobre as 4 User
  Stories em Android; iOS permanece pendente só pela falta de conta Apple
  Developer paga, não introduzida por esta feature.
- **Princípio IV (Controle de Dependências)**: PASS — nenhuma dependência nova.
- **Princípio V (Autenticação Obrigatória e Isolamento por Conta, NON-NEGOTIABLE)**:
  PASS — a leitura de sessão em andamento usa `obterSessao(uid, treino.id)`, já
  segregada por `uid` (mesma chave `sessoes:<uid>` já usada por todo o RF04); a
  remoção da ação de exemplo não introduz nem remove nenhuma segregação por
  conta — `importarTreino` (que permanece) já recebe `uid` exatamente como hoje.

Nenhuma violação — Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/024-indicador-andamento-e-menu-acoes/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões a-e pedidas pelo usuário
├── data-model.md         # Fase 1 — dado derivado (não persistido) + prop nova
├── quickstart.md         # Fase 1 — roteiro de validação manual (6 cenários)
├── contracts/
│   ├── lista-treinos.md   # Fase 1 — index.tsx + treino-list-item.tsx
│   └── menu-acoes.md      # Fase 1 — acoes.tsx + treino-storage.ts + asset + docs
└── tasks.md               # Fase 2 (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx                 # ALTERADO: + carregarSessoesEmAndamento,
│   │                                    #   + emAndamentoPorTreino, passa
│   │                                    #   emAndamento ao TreinoListItem
│   └── acoes.tsx                      # ALTERADO: remove handleImportarTreinoExemplo
│                                         #   e o Pressable correspondente
├── components/
│   └── treino/
│       └── treino-list-item.tsx       # ALTERADO: + prop emAndamento, destaque
│                                         #   de cor/borda + texto "Em andamento"
└── services/
    └── treino-storage.ts              # ALTERADO: remove importarTreinoExemplo
                                          #   e o import do asset

assets/exemplos/treino-exemplo.json    # APAGADO (órfão após as alterações acima)

docs/criterios-aceite.md               # ALTERADO: nota de emenda nas entradas do
                                          #   RF01 e do RF14 (FR-012)
```

**Structure Decision**: nenhum arquivo novo de código-fonte — uma prop nova em um
componente já existente, uma função nova dentro de um arquivo já existente
(espelhando duas funções irmãs já lá), e duas remoções pontuais em arquivos já
existentes. Nenhuma mudança em `src/services/sessao-treino-storage.ts` (a função
de leitura necessária, `obterSessao`, já existe e não precisa de alteração).

## Complexity Tracking

*Não aplicável — nenhuma violação da Constitution Check acima.*
