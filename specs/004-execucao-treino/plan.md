# Implementation Plan: Tela de Execução do Treino

**Branch**: `004-execucao-treino` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-execucao-treino/spec.md`

## Summary

Implementar a tela de execução do treino (RF03): ao tocar em um treino na lista (RF02),
navegar para uma nova rota que exibe a lista de exercícios planejados do treino
selecionado (séries, reps_alvo, carga_sugerida_kg, descanso_seg). O usuário pode abrir
qualquer exercício da lista, em qualquer ordem, ver o botão "Iniciar exercício" e, ao
iniciar, registrar carga (kg, decimal) e repetições feitas da série atual, com a carga
pré-preenchida por `carga_sugerida_kg` e um indicador "Série X de Y". Abordagem técnica:
reaproveitar `treino-storage.ts` (leitura, sem alterações) e `usePerfilAtivo()` (sem
modificação) para obter dados já existentes; criar uma nova rota Expo Router em `src/app/`
para a tela; conectar a navegação real a partir do toque no item da lista do RF02 (hoje
apenas um `Alert` provisório); manter o estado de série atual (carga, reps, série em
andamento) em estado local de componente, sem qualquer persistência nesta feature — isso é
escopo do RF04/RF07.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme Constituição
Princípio I

**Primary Dependencies**: Expo SDK 57 (gerenciado), Expo Router (roteamento baseado em
arquivos), React 19 / React Native 0.86 — todas já presentes no projeto; nenhuma nova
dependência é necessária para esta feature

**Storage**: `AsyncStorage` via `treino-storage.ts` (já existente, RF01) — reaproveitado
apenas para leitura (`listarTreinos`/dados já carregados na tela de lista); nenhuma nova
chave de armazenamento é criada por esta feature, pois não há persistência de série nesta
etapa

**Testing**: Validação manual em dispositivo real via Expo Go (Android e iOS), conforme
Constituição Princípio III — não há framework de testes automatizados configurado no
projeto até o momento

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus), via Expo Go

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Navegação da lista de treinos para a tela de execução perceptível
como instantânea (< 2s, conforme SC-001 da spec); sem metas de performance adicionais além
dos padrões usuais de app mobile

**Constraints**: Deve funcionar offline (RNF02 do PRD); interações principais em poucos
toques (RNF03); nenhuma persistência de dados de série nesta feature (assunção explícita
da spec, escopo do RF04/RF07)

**Scale/Scope**: Uma nova tela/rota, reaproveitando componentes visuais já existentes
(`ThemedText`, `ThemedView`, `Spacing`, `Colors`) e o serviço de leitura de treinos já
implementado; sem novos serviços de storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — toda a implementação (rota, componentes, tipos de
  estado da série) será em TypeScript, reaproveitando os tipos já definidos em
  `src/types/treino.ts` (`Treino`, `ExercicioPlanejado`).
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — nenhuma abstração
  nova é introduzida além do necessário (uma rota + estado local); persistência,
  cronômetro e navegação sequencial entre séries ficam explicitamente fora de escopo
  (RF04/RF05/RF07), evitando antecipar funcionalidade não solicitada nesta etapa.
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual
  Android + iOS via Expo Go antes de considerar a feature concluída (ver quickstart.md).
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova é introduzida; toda a
  stack usada (Expo Router, React Native core, AsyncStorage indireto via
  `treino-storage.ts`) já está aprovada e em uso desde o RF01/RF02.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — esta feature não introduz
  nenhuma nova leitura/escrita de storage; o treino exibido já foi carregado/filtrado por
  `perfil_id` na tela de lista (RF02) antes da navegação, e é passado adiante (por
  parâmetro de rota ou nova leitura já filtrada por `perfilAtivo.id`) sem expor dados de
  outro perfil. Nenhum estado de série é persistido nesta feature, portanto não há nova
  superfície de vazamento entre perfis a proteger aqui.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/004-execucao-treino/
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
│   ├── (tabs)/
│   │   └── index.tsx                  # RF02 — lista de treinos; MODIFICADO: onPress do
│   │                                     item passa a navegar de fato (router.push) para
│   │                                     a nova rota, em vez do Alert provisório
│   └── treino/
│       └── [treinoId].tsx             # NOVO — rota da tela de execução (RF03): recebe
│                                         treinoId via parâmetro de rota, carrega o treino
│                                         via treino-storage.ts (leitura), exibe lista de
│                                         exercícios e, ao selecionar um, a área de
│                                         execução do exercício (botão "Iniciar exercício",
│                                         campos de carga/reps, indicador de série)
├── components/
│   └── treino/
│       ├── treino-list-item.tsx       # RF02 — reaproveitado sem alterações
│       ├── exercicio-list-item.tsx    # NOVO — item da lista de exercícios planejados
│                                         (dados planejados + estado visual: não
│                                         iniciado/em andamento/concluído)
│       └── exercicio-execucao.tsx     # NOVO — área de execução de um exercício
│                                         selecionado: botão "Iniciar exercício",
│                                         indicador "Série X de Y", campos de carga e reps
├── hooks/
│   └── use-perfil-ativo.tsx           # RF10 — reaproveitado sem modificação
├── services/
│   └── treino-storage.ts              # RF01 — reaproveitado sem modificação (apenas
│                                         listarTreinos para obter o treino selecionado)
└── types/
    └── treino.ts                      # RF01 — reaproveitado; nenhum novo campo
                                          persistido é introduzido por esta feature
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida pelo RF01/RF02
(`src/app` para rotas via Expo Router, `src/components/treino` para componentes de UI
específicos de treino, `src/services` para acesso a dados, `src/types` para tipos de
domínio compartilhados). Nenhuma nova pasta de nível superior é criada; apenas uma nova
rota (`src/app/treino/[treinoId].tsx`) e dois novos componentes de apresentação dentro da
pasta já existente `src/components/treino/`.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
