# Data Model: Autenticação Google + Firestore para Treinos

**Feature**: `022-autenticacao-google-firestore-treinos` | **Date**: 2026-09-29

## Visão geral do que muda

| Dado | Antes (RF10/RF01/RF02) | Depois (esta feature) |
|------|-------------------------|------------------------|
| Identidade | `Perfil` local, `perfilId` gerado por `expo-crypto`, guardado em `AsyncStorage` (`perfis`) | Conta Google, `uid` do Firebase Auth |
| Dados físicos (nome/peso/altura/idade/sexo/objetivo) | `AsyncStorage`, dentro do objeto `Perfil` | Firestore, documento `users/{uid}` |
| Treinos importados (RF01) e lista (RF02) | `AsyncStorage`, chave `treinos:<perfilId>` | Firestore, coleção `users/{uid}/treinos` |
| Execução em andamento, histórico de sessões, ciclo de progresso (RF03-09a/RF08/RF09b/RF15/RF18) | `AsyncStorage`, chaveado por `perfilId` | **Sem mudança de tecnologia** — mesma chave, mas o valor passa a ser o `uid` (FR-012) |

## Entidades no Firestore (novo)

### `users/{uid}` (documento) — Dados físicos da conta

Substitui a parte de dados físicos do antigo `Perfil` (RF10). Um documento por
conta autenticada, chave = `uid` do Firebase Auth.

| Campo | Tipo | Obrigatório | Regras |
|-------|------|--------------|--------|
| `nome` | `string` | sim | Não pode ser vazio/só espaços (mesma regra do RF10 original, `PerfilForm`) |
| `pesoKg` | `number` | sim | > 0 |
| `alturaCm` | `number` | sim | > 0 |
| `idade` | `number` | sim | > 0, inteiro |
| `sexo` | `'Masculino' \| 'Feminino'` | sim | Mesma união fixa do RF10 (`src/types/perfil.ts`, `Sexo`) |
| `objetivo` | `'Hipertrofia' \| 'Emagrecimento' \| 'Condicionamento' \| 'Manutenção'` | sim | Mesma união fixa do RF10 (`ObjetivoTreino`) |
| `criadoEm` | `string` (ISO 8601) | sim | Preenchido no momento do primeiro salvamento, nunca alterado depois |

**Invariantes**:
- Um documento por `uid` — a própria chave do documento garante isso (não existe
  "múltiplos perfis por conta" nesta feature; ver FR-013/FR-014, trocar de usuário
  agora é logout + login, não mais múltiplos perfis no mesmo login).
- Existência deste documento é o sinal usado por FR-005 ("é o primeiro login dessa
  conta?") — documento inexistente ⇒ primeiro login ⇒ exibir `PerfilForm`.
- Nunca lido/gravado sem uma sessão autenticada cujo `request.auth.uid` seja
  exatamente igual ao `{uid}` do caminho (regra de segurança, ver `contracts/`).

### `users/{uid}/treinos/{treinoId}` (subcoleção) — Treinos importados

Substitui a chave `AsyncStorage` `treinos:<perfilId>` (RF01/RF02). Mesma forma de
dados do `Treino` já existente (`src/types/treino.ts`), sem mudança de campos —
só de onde/como é persistido.

| Campo | Tipo | Obrigatório | Regras |
|-------|------|--------------|--------|
| `id` | `string` | sim | Igual ao `treinoId` do documento (redundante por conveniência de leitura, já é o padrão do projeto — ver `Treino.id` atual) |
| `nome` | `string` | sim | Do JSON importado (RF01, sem mudança de validação) |
| `exercicios` | `ExercicioPlanejado[]` | sim | Mesma estrutura já validada por RF01/RF17 (`id`, `nome`, `series`, `repsAlvo`, `cargaSugeridaKg`, `descansoSeg`, `categoria`) — sem mudança de schema |
| `importadoEm` | `string` (ISO 8601) | sim | Sem mudança de regra |

**Removido nesta feature**: o campo `perfilId` que hoje existe dentro do próprio
objeto `Treino` (`src/types/treino.ts`) deixa de ser necessário como dado — a
segregação por conta passa a ser o próprio caminho do documento
(`users/{uid}/treinos/*`), não mais um campo interno filtrado no cliente
(Constitution v2.0.0, Princípio V: isolamento via caminho + regra de segurança, não
só filtro).

**Invariantes**:
- Todo documento desta subcoleção só existe dentro de um `users/{uid}` — não há
  cenário de um treino "sem conta dona", a própria estrutura de caminho do
  Firestore impede isso.
- Mensagens de sucesso/erro/importação parcial (RF01) e ordenação da lista (RF02)
  não mudam — ver FR-010.

## Entidades que NÃO mudam (continuam em AsyncStorage, FR-012)

Sem alteração de schema ou de tecnologia — só o valor usado como identificador
passa a ser o `uid` em vez do `perfilId` local:

- Sessão de execução em andamento (RF03/RF04/RF05/RF06/RF07/RF09a).
- Histórico de sessões finalizadas (RF08/RF09b/RF18, `specs/019-historico-por-data/`).
- Progresso de ciclo de treinos (RF15, `specs/018-progresso-ciclo/`).

## Entidade removida

- **`Perfil`** (`src/types/perfil.ts`, RF10) e o conceito de múltiplos perfis por
  aparelho (`PerfisState`, `perfilAtivoId`) deixam de existir como modelo de
  identidade. Os campos físicos que ele carregava migram para `users/{uid}`
  (acima); a identidade (antigo `Perfil.id`) é substituída pelo `uid` do Firebase
  Auth. `src/services/perfil-storage.ts` e `src/hooks/use-perfil-ativo.tsx` ficam
  sem uso depois que a migração desta feature for concluída.

## Nova entidade: Conta autenticada (em memória/contexto, não persistida por esta feature)

- **Conta autenticada**: `{ uid: string, email: string | null, nomeExibicao: string | null }` —
  vem diretamente do Firebase Auth (`@react-native-firebase/auth`), não é escrita
  pelo app; usada pelo novo hook `useContaAutenticada()` (`research.md`, Decisão 6)
  para decidir qual tela mostrar e para exibir "Sair da conta ({email})" na tela de
  Ações (FR-013).
