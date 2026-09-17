# Implementation Plan: Avançar Entre Séries e Exercícios

**Branch**: `005-avancar-series-exercicios` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-avancar-series-exercicios/spec.md`

## Summary

Implementar o avanço entre séries e exercícios do RF04: concluir uma série (validando
carga/reps preenchidos), avançar automaticamente para a próxima série do mesmo exercício
(ou habilitar "Concluir exercício" na última), voltar para a lista de exercícios marcando o
exercício concluído, e permitir seguir livremente para qualquer outro exercício. Tudo isso
persistido em uma sessão de treino em andamento sob a chave `sessoes:<perfilId>` em
`AsyncStorage` — chave que **já existe e já é lida** pelo RF10 (`existeSessaoEmAndamento`
em `perfil-storage.ts`), que espera um array de sessões, cada uma com pelo menos
`{ perfilId, finalizadaEm }`. Esta feature passa a ser quem **escreve** nessa chave (RF10
só lê), estendendo cada sessão com `treinoId`, `iniciadaEm` e `execucoes` (séries
concluídas por exercício), mantendo `finalizadaEm: null` durante toda a sua execução.
Múltiplas sessões em andamento por perfil são permitidas sem bloqueio — a chave guarda uma
lista, uma entrada por `treinoId` iniciado. Reaproveita `treino-storage.ts` (RF01) e
`use-perfil-ativo.tsx` (RF10) sem modificação, e os componentes/tela do RF03
(`exercicio-execucao.tsx`, `exercicio-list-item.tsx`, `[treinoId].tsx`), estendendo-os para
o novo fluxo de conclusão de série/exercício. Uma modificação mínima e aditiva também é
feita no RF10: o tipo `SessaoRegistro` (hoje um `type` privado dentro de
`perfil-storage.ts`) é movido para `src/types/perfil.ts` e exportado, sem alterar campos,
nomes ou comportamento — isso permite que `SessaoTreino` (novo tipo desta feature) use
`extends SessaoRegistro`, garantindo em tempo de compilação que a estrutura persistida
nunca diverge do contrato que `existeSessaoEmAndamento` (RF10) já lê.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme Constituição
Princípio I

**Primary Dependencies**: Expo SDK 57 (gerenciado), Expo Router, React 19 / React Native
0.86, `@react-native-async-storage/async-storage`, `expo-crypto` (já em uso pelo RF01 para
gerar ids) — todas já presentes no projeto; nenhuma nova dependência é necessária

**Storage**: `AsyncStorage`, sob a chave `sessoes:<perfilId>` — chave já existente,
introduzida e **lida** pelo RF10 (`perfil-storage.ts`, função `existeSessaoEmAndamento`).
Esta feature introduz um novo serviço (`sessao-treino-storage.ts`) responsável por
**escrever** nessa mesma chave, com uma estrutura de sessão estendida (superset da já
esperada por `SessaoRegistro` em `perfil-storage.ts`) — ver research.md Decisão 1 e
data-model.md para o schema exato e a garantia de compatibilidade

**Testing**: Validação manual em dispositivo real via Expo Go (Android e iOS), conforme
Constituição Princípio III — sem framework de testes automatizados configurado no projeto

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via Expo Go

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Concluir série/exercício e refletir na tela em menos de 3 toques
(SC-001), sem percepção de atraso; leitura/escrita em `AsyncStorage` local, sem chamadas de
rede

**Constraints**: Deve funcionar offline (RNF02 do PRD); persistência automática sem ação
manual do usuário (FR-013); nenhuma edição de séries já concluídas nesta feature (FR-015,
escopo do RF09); nenhuma indicação de sessão em andamento na lista de treinos do RF02
(decisão adiada); sem limite de sessões simultâneas em andamento por perfil

**Scale/Scope**: Um novo serviço de storage (`sessao-treino-storage.ts`), extensão dos
tipos e componentes já existentes do RF03 (`execucao-treino.ts`,
`exercicio-execucao.tsx`, `exercicio-list-item.tsx`, `[treinoId].tsx`); nenhuma nova rota

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — todo o código novo (serviço de sessão, tipos,
  extensões de componentes) será TypeScript estrito, com os tipos de sessão explicitamente
  definidos em `src/types/`.
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — a persistência usa o
  mesmo padrão já estabelecido por `treino-storage.ts`/`perfil-storage.ts` (uma chave por
  perfil em `AsyncStorage`, JSON serializado); nenhuma abstração nova (ORM, biblioteca de
  state management, etc.) é introduzida. A decisão de permitir múltiplas sessões
  simultâneas sem bloqueio é a mais simples possível (não introduz lógica de
  detecção/resolução de conflito entre sessões).
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual
  Android + iOS via Expo Go antes de considerar a feature concluída (ver quickstart.md),
  reforçada pelo fato de o RF04 introduzir persistência real pela primeira vez desde a tela
  de execução (RF03 era só memória), o que tende a expor divergências de runtime mais
  facilmente (como já ocorreu no RF01 com `expo-file-system`).
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova; reaproveita
  `@react-native-async-storage/async-storage` e `expo-crypto`, já aprovadas e em uso desde
  RF01/RF10.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — a chave de storage
  `sessoes:<perfilId>` já inclui o `perfilId` como parte da chave de identidade, seguindo
  exatamente o mesmo padrão de `treinos:<perfilId>` (RF01). Toda leitura/escrita de sessão
  nesta feature MUST passar pelo novo serviço `sessao-treino-storage.ts`, usando
  `perfilAtivo.id` (via `usePerfilAtivo()`, sem modificação) — nenhuma sessão de um perfil é
  lida ou escrita a partir de outro.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/005-avancar-series-exercicios/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── treino/
│       └── [treinoId].tsx             # RF03 — MODIFICADO: passa a carregar/atualizar a
│                                         sessão em andamento via sessao-treino-storage.ts,
│                                         calcular o estado "concluído" de cada exercício
│                                         (além de "pausado"/"não iniciado"), e reagir aos
│                                         callbacks de "Concluir série"/"Concluir exercício"
├── components/
│   └── treino/
│       ├── exercicio-list-item.tsx    # RF03 — MODIFICADO: novo estado visual 'concluido'
│       │                                 volta a ser alcançável (era removido no RF03 por
│       │                                 não haver conclusão ainda; RF04 reintroduz o uso)
│       └── exercicio-execucao.tsx     # RF03 — MODIFICADO: adiciona os botões "Concluir
│                                         série" (habilitado com carga+reps preenchidos) e
│                                         "Concluir exercício" (habilitado na última série),
│                                         e o avanço de série (pré-preenche carga da série
│                                         anterior, limpa reps)
├── services/
│   ├── treino-storage.ts              # RF01 — reaproveitado sem modificação
│   ├── perfil-storage.ts              # RF10 — MODIFICAÇÃO MÍNIMA: o tipo `SessaoRegistro`
│   │                                     (antes um `type` privado neste arquivo) passa a ser
│   │                                     importado de `src/types/perfil.ts` (ver abaixo);
│   │                                     nenhuma mudança de campos, nomes ou comportamento —
│   │                                     `existeSessaoEmAndamento` continua idêntica. Esta
│   │                                     feature passa a ser quem ESCREVE na chave
│   │                                     sessoes:<perfilId>, que o RF10 já lê
│   └── sessao-treino-storage.ts       # NOVO — cria/atualiza a sessão em andamento de um
│                                         treino sob a chave sessoes:<perfilId>, compatível
│                                         com a leitura já feita por perfil-storage.ts
└── types/
    ├── treino.ts                       # RF01 — reaproveitado sem modificação
    ├── perfil.ts                       # RF10 — MODIFICAÇÃO MÍNIMA: recebe o tipo
    │                                     `SessaoRegistro` (exportado), movido de dentro de
    │                                     perfil-storage.ts para seguir o padrão de tipos de
    │                                     domínio compartilhados (Constituição, Princípio I)
    └── execucao-treino.ts              # RF03 — MODIFICADO: `EstadoExecucaoExercicio` passa
                                          a incluir `seriesConcluidas` e `concluido`; novo
                                          tipo `SessaoTreino extends SessaoRegistro`
                                          (data-model.md) — garante em tempo de compilação
                                          que a sessão persistida por esta feature nunca
                                          diverge do contrato já lido pelo RF10
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida (RF01/RF02/RF03)
— `src/app` para rotas, `src/components/treino` para UI, `src/services` para acesso a
dados, `src/types` para tipos de domínio compartilhados. Nenhuma nova pasta de nível
superior; um novo arquivo de serviço (`sessao-treino-storage.ts`) ao lado dos já existentes,
e extensão dos arquivos de tela/componentes/tipos já criados pelo RF03, em vez de novos
arquivos paralelos — a tela de execução continua sendo uma única rota, e o novo
comportamento de conclusão de série/exercício é uma extensão natural do fluxo já existente.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
