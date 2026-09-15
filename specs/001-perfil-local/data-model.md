# Data Model: Criar e Selecionar Perfil Local

**Feature**: 001-perfil-local | **Date**: 2026-09-14

## Entidades

### Perfil

Representa uma pessoa que usa o app localmente no aparelho (ver spec, seção Key Entities).

| Campo | Tipo | Obrigatório | Regras de validação |
|-------|------|-------------|----------------------|
| `id` | `string` | sim (gerado pelo sistema) | Único; gerado na criação; nunca editável; não derivado do `nome` (FR-014) |
| `nome` | `string` | sim | Não vazio após `trim()` (FR-003, Edge Case: espaços em branco) |
| `pesoKg` | `number` | sim | Numérico positivo |
| `alturaCm` | `number` | sim | Numérico positivo |
| `idade` | `number` | sim | Inteiro positivo |
| `sexo` | `Sexo` (enum) | sim | Um de: `Masculino`, `Feminino` (FR-002a) |
| `objetivo` | `ObjetivoTreino` (enum) | sim | Um de: `Hipertrofia`, `Emagrecimento`, `Condicionamento`, `Manutenção` (FR-002b) |
| `criadoEm` | `string` (ISO 8601) | sim (gerado pelo sistema) | Timestamp de criação, usado apenas para ordenação/exibição, não é a chave de identidade |

**Enums**:

```text
Sexo = "Masculino" | "Feminino"
ObjetivoTreino = "Hipertrofia" | "Emagrecimento" | "Condicionamento" | "Manutenção"
```

**Invariantes**:
- Todos os campos exceto `id` e `criadoEm` MUST ser preenchidos antes que um `Perfil` possa
  ser persistido (FR-002, FR-003).
- Múltiplos perfis podem compartilhar o mesmo `nome` (FR-014).

### PerfisState (registro raiz persistido)

Estrutura raiz armazenada sob a chave global `perfis` no AsyncStorage — não é uma entidade
de negócio por si, mas o formato de persistência da coleção de perfis e de qual está ativo.

| Campo | Tipo | Descrição |
|-------|------|------------|
| `perfis` | `Perfil[]` | Lista de todos os perfis criados no aparelho |
| `perfilAtivoId` | `string \| null` | `id` do perfil atualmente ativo; `null` apenas antes do primeiro perfil ser criado |

**Regras de transição de estado**:
- Estado inicial (nenhum perfil): `{ perfis: [], perfilAtivoId: null }` → dispara a tela de
  criação (FR-001).
- Após criar o primeiro (ou qualquer) perfil: perfil é adicionado a `perfis` e
  `perfilAtivoId` passa a ser o `id` do perfil recém-criado (FR-004).
- Ao selecionar um perfil existente na lista: `perfilAtivoId` é atualizado para o `id`
  escolhido — **somente permitido se não houver sessão em andamento para o perfil ativo
  atual** (FR-009, FR-010; ver `SessaoEmAndamento` abaixo).

### SessaoEmAndamento (referenciada, não persistida por esta feature)

Não é uma entidade criada por esta feature (RF10), mas é uma dependência de leitura: a
lógica de bloqueio de troca de perfil (FR-010) precisa consultar se existe uma sessão de
treino não finalizada vinculada ao `perfilAtivoId` atual. Esta feature define o **contrato
de leitura** que RF07 (Salvar sessão de treino) MUST implementar; a escrita da sessão em si
é escopo do RF07.

| Campo (esperado de RF07) | Tipo | Descrição |
|---------------------------|------|------------|
| `perfilId` | `string` | Perfil ao qual a sessão pertence |
| `finalizadaEm` | `string \| null` | `null` enquanto a sessão está em andamento |

**Regra de consulta (usada por esta feature)**: existe sessão em andamento para o perfil
ativo ⟺ existe ao menos um registro de sessão com `perfilId === perfilAtivoId` e
`finalizadaEm === null`, sob a chave `sessoes:<perfilAtivoId>` (convenção de chave definida
nesta feature, para uso futuro por RF07).

## Convenção de chaves AsyncStorage (estabelecida por esta feature)

| Chave | Escopo | Conteúdo |
|-------|--------|----------|
| `perfis` | Global (todos os perfis) | `PerfisState` serializado em JSON |
| `treinos:<perfil_id>` | Por perfil | Lista de treinos importados/salvos daquele perfil (RF01/RF02 — implementação futura) |
| `sessoes:<perfil_id>` | Por perfil | Lista de sessões de treino (em andamento e finalizadas) daquele perfil (RF07 — implementação futura) |

Toda chave nova introduzida por features futuras que armazene dado dependente de perfil
MUST seguir o padrão `<dominio>:<perfil_id>`, conforme Princípio V da Constituição.

## Relações

```text
PerfisState 1 ── N Perfil
Perfil (id) 1 ── N SessaoEmAndamento (perfilId)   [leitura apenas, escrita é RF07]
Perfil (id) 1 ── N chaves "treinos:<id>" / "sessoes:<id>"  [namespacing, não FK real]
```
