# Implementation Plan: Salvar Sessão de Treino (Completa ou Finalizada Manualmente)

**Branch**: `009-salvar-sessao-treino` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-salvar-sessao-treino/spec.md`

## Summary

Implementar o RF07 reaproveitando integralmente `src/services/sessao-treino-storage.ts`
(RF04), sem introduzir nenhum novo mecanismo de storage. Duas mudanças estruturais no
serviço existente: (1) a busca de "a sessão de um treino" (`obterSessao`,
`registrarSerieConcluida`, `marcarExercicioConcluido`, `atualizarSerieRealizada`) passa
a filtrar explicitamente por `finalizadaEm === null`, em vez de casar apenas por
`treinoId` — sem isso, reabrir um treino cuja única sessão já foi finalizada
reescreveria essa sessão encerrada em vez de criar uma nova (violando FR-007/FR-008 da
spec); e (2) toda nova sessão criada passa a receber um campo `id` próprio
(`Crypto.randomUUID()`, mesmo padrão já usado por `Treino.id` e `Perfil.id`), necessário
porque `treinoId` deixa de identificar uma sessão de forma única assim que múltiplas
sessões do mesmo treino coexistem (uma em andamento, várias finalizadas).

Uma nova função `finalizarSessao(perfilId, sessaoId)` é adicionada ao mesmo serviço,
localizando a sessão pelo novo `id` (não pelo `treinoId, que voltaria a ser ambíguo) e
gravando `finalizadaEm` com o timestamp atual — idempotente se a sessão já estiver
finalizada (nenhuma escrita adicional, nenhum erro). Essa função é chamada em dois
pontos da rota `src/app/treino/[treinoId].tsx`: automaticamente, quando a conclusão do
último exercício pendente faz `treino.exercicios.every(concluido)` passar a ser
verdadeiro (checagem que já existe na rota, hoje usada só para exibir a mensagem de
parabéns); e manualmente, a partir de um novo botão "Finalizar treino", renderizado uma
única vez no nível da rota (fora do `if (exercicioSelecionado)`), de forma que fique
visível tanto na lista de exercícios quanto na tela de um exercício específico em
execução.

Como parte do mesmo fluxo de finalização (ambos os pontos de entrada), a rota cancela o
cronômetro de descanso ativo (RF05, estado `descansoAtivo`) e a notificação já agendada
no sistema operacional (RF06, estado `notificacaoAgendada`) — reaproveitando
`cancelarNotificacaoDescanso` já existente, sem nenhuma mudança em
`src/services/notificacao-descanso.ts`. Nenhuma nova dependência de terceiros é
introduzida.

## Technical Context

**Language/Version**: TypeScript (strict, sem `any` implícito), conforme
Constituição Princípio I

**Primary Dependencies**: Nenhuma nova. Reaproveita `expo-crypto` (`Crypto.randomUUID`,
já em uso por `treino-storage.ts`/`perfil-storage.ts`) e `@react-native-async-storage/
async-storage` (já em uso por `sessao-treino-storage.ts`).

**Storage**: `AsyncStorage`, mesma chave já existente (`sessoes:${perfilId}`,
introduzida pelo RF04, lida pelo RF10). Esta feature altera a *forma* de localizar uma
sessão dentro do array já persistido (passa a exigir `finalizadaEm === null` para
"a sessão em andamento" de um treino) e adiciona um novo campo (`id`) a cada objeto do
array — não introduz nenhuma nova chave de storage.

**Testing**: Validação manual em dispositivo real via **development build** (Android e
iOS) — **não Expo Go**, mesmo esta feature não tocando em nenhuma API de notificação.
Motivo: `src/app/_layout.tsx` já importa `expo-notifications` no topo do arquivo desde
o RF06 (`import { configurarNotificacoesDescanso } from '@/services/notificacao-descanso'`),
e esse import por si só quebra o app inteiro no Expo Go/Android (crash de módulo, não
condicionado a nenhuma função ser chamada — ver
specs/008-notificacao-fim-descanso/research.md, "Decisão 0 (correção pós-implementação)").
Essa migração já foi decidida, aprovada e executada pelo usuário durante a
implementação real do RF06 (não é uma suposição desta sessão de planejamento): o
development build já está instalado nos dois aparelhos-alvo, validado nos testes
manuais do RF06. Consequência prática: **qualquer feature a partir daqui** (incluindo
esta) precisa ser validada no mesmo development build, não porque o RF07 precise dele
por si, mas porque o app como um todo já não abre mais no Expo Go puro. O projeto não
tem framework de testes automatizados configurado; nenhum teste automatizado é
adicionado por esta feature, consistente com as features anteriores.

**Target Platform**: Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus)

**Project Type**: Mobile app (Expo Router, projeto único em `src/`)

**Performance Goals**: Finalizar uma sessão (automática ou manual) deve refletir na UI
em um único ciclo de renderização, sem percepção de espera pelo usuário — mesma
expectativa já aplicada às demais escritas de `sessao-treino-storage.ts` (RF04).

**Constraints**: A busca de sessão em andamento MUST considerar apenas `finalizadaEm
=== null` (FR-007, FR-008). `finalizarSessao` MUST ser idempotente (FR-006) — chamar
mais de uma vez sobre a mesma sessão já finalizada não MUST gerar erro nem reescrever
`finalizadaEm`. O identificador `id` da sessão MUST ser gerado no momento da criação da
sessão (primeira série concluída daquela execução), nunca derivado de `treinoId` ou de
timestamp (FR-012). Cancelar o cronômetro/notificação ativos (FR-011) MUST ocorrer
como parte do mesmo fluxo de finalização, sem exigir uma ação separada do usuário.
Nenhuma alteração ao formato de `SessaoRegistro` (`perfilId`, `finalizadaEm`) já lido
por `existeSessaoEmAndamento` (RF10) — a extensão via `id` ocorre apenas em
`SessaoTreino`, que já `extends SessaoRegistro` (garantia em tempo de compilação já
estabelecida pelo RF04).

**Scale/Scope**: Modificações em `src/services/sessao-treino-storage.ts` (busca
filtrada por `finalizadaEm`, novo campo `id`, nova função `finalizarSessao`), em
`src/types/execucao-treino.ts` (campo `id` em `SessaoTreino`), e em
`src/app/treino/[treinoId].tsx` (novo botão "Finalizar treino", chamada automática ao
detectar todos os exercícios concluídos, cancelamento de cronômetro/notificação
integrado). Nenhuma nova rota, nenhum novo serviço, nenhuma nova dependência.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. TypeScript Obrigatório**: PASS — todo o código novo/modificado é TypeScript
  estrito; o novo campo `id` em `SessaoTreino` é tipado explicitamente
  (`src/types/execucao-treino.ts`).
- **II. Simplicidade sobre Funcionalidades Avançadas no MVP**: PASS — nenhuma
  abstração nova é introduzida; a solução estende diretamente o serviço já existente
  (`sessao-treino-storage.ts`) com uma função adicional e um filtro adicional na busca,
  seguindo exatamente o mesmo padrão já usado pelas funções irmãs. Não é adicionada
  nenhuma tela de confirmação obrigatória para "Finalizar treino" (a spec deixa essa
  decisão de UX específica em aberto, ver Assumptions) além do padrão já usado no app
  (`Alert.alert`, RF09a) quando aplicável.
- **III. Validação em Dois Dispositivos-Alvo**: PASS — plano prevê validação manual
  Android + iOS (ver quickstart.md), incluindo o cenário de cancelamento de
  notificação agendada ao finalizar, que já se mostrou sensível a comportamento de
  fabricante (ver RF06, Decisão 9) e merece reconfirmação aqui.
- **IV. Controle de Dependências**: PASS — nenhuma dependência nova introduzida.
- **V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)**: PASS — todas as operações
  desta feature (`finalizarSessao` incluída) continuam operando exclusivamente sobre
  `sessoes:${perfilId}`, com `perfilId` explícito em todos os parâmetros, seguindo o
  mesmo padrão já estabelecido pelo RF04. Nenhuma nova chave de storage é criada;
  nenhuma consulta cruza `perfilId` diferentes.

Nenhuma violação identificada. Seção "Complexity Tracking" não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/009-salvar-sessao-treino/
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
│       └── [treinoId].tsx             # RF04/RF05/RF06 — MODIFICADO: novo estado
│                                         `sessaoAtualId` (id da sessão em andamento,
│                                         necessário para chamar `finalizarSessao`);
│                                         novo handler `handleFinalizarTreino`
│                                         (cancela cronômetro/notificação ativos via
│                                         `handleDescansoConcluido`, chama
│                                         `finalizarSessao`, reseta estado local para
│                                         refletir treino sem sessão em andamento);
│                                         chamada automática a `handleFinalizarTreino`
│                                         quando `treino.exercicios.every(concluido)`
│                                         passa a ser verdadeiro; novo botão
│                                         "Finalizar treino" renderizado no nível da
│                                         rota (visível tanto na lista de exercícios
│                                         quanto na tela de execução de um exercício)
├── services/
│   └── sessao-treino-storage.ts       # RF04 — MODIFICADO: `obterSessao`,
│                                         `registrarSerieConcluida`,
│                                         `marcarExercicioConcluido` e
│                                         `atualizarSerieRealizada` passam a localizar
│                                         a sessão por `treinoId` **e**
│                                         `finalizadaEm === null`; toda sessão nova
│                                         criada recebe `id: Crypto.randomUUID()`;
│                                         nova função `finalizarSessao(perfilId,
│                                         sessaoId): Promise<SessaoTreino>`
└── types/
    └── execucao-treino.ts             # RF04 — MODIFICADO: `SessaoTreino` ganha o
                                          campo `id: string`
```

**Structure Decision**: Mantém a estrutura de projeto único já estabelecida
(RF01-RF06). Nenhum novo arquivo é criado — todas as mudanças estendem módulos já
existentes, seguindo o padrão já usado pelo RF05/RF06 de estender
`sessao-treino-storage.ts`/`[treinoId].tsx` em vez de introduzir camadas novas.

## Complexity Tracking

*Não se aplica — nenhuma violação da Constitution Check foi identificada.*
