# Contract: Serviço de Persistência de Perfil (`perfil-storage`)

**Feature**: 001-perfil-local | **Date**: 2026-09-14

Este app não expõe API externa; o "contrato" relevante é a interface interna que a camada
de serviço (`src/services/perfil-storage.ts`) expõe para as telas e hooks consumirem, e que
as features futuras (RF01, RF02, RF07, RF08) MUST respeitar ao ler/escrever dados por
perfil. Ver [data-model.md](../data-model.md) para os tipos referenciados.

## Interface

```ts
listarPerfis(): Promise<Perfil[]>

criarPerfil(dados: Omit<Perfil, 'id' | 'criadoEm'>): Promise<Perfil>
// Lança erro de validação se algum campo obrigatório estiver vazio/em branco (FR-003).
// Ao suceder: adiciona o perfil à lista e define como perfil ativo (FR-004).

obterPerfilAtivoId(): Promise<string | null>

definirPerfilAtivo(perfilId: string): Promise<
  { ok: true } | { ok: false; motivo: 'sessao_em_andamento' }
>
// Deve consultar existeSessaoEmAndamento(perfilAtivoAtualId) antes de trocar (FR-009, FR-010).
// Se motivo === 'sessao_em_andamento', a UI exibe aviso e não troca o perfil ativo.

existeSessaoEmAndamento(perfilId: string): Promise<boolean>
// Lê a chave `sessoes:<perfilId>` e verifica se há alguma sessão com finalizadaEm === null.
// Implementação plena depende de RF07; nesta feature, na ausência da chave, retorna false.
```

## Pré-condições e pós-condições

| Operação | Pré-condição | Pós-condição |
|----------|--------------|----------------|
| `criarPerfil` | Todos os campos obrigatórios preenchidos e não vazios (após trim) | Novo `Perfil` persistido em `perfis`; `perfilAtivoId` aponta para ele |
| `definirPerfilAtivo` | Perfil de destino existe em `perfis` | Se não há sessão em andamento para o perfil ativo atual: `perfilAtivoId` atualizado. Caso contrário: nenhum estado é alterado |
| `existeSessaoEmAndamento` | — | Não possui efeitos colaterais (somente leitura) |

## Consumidores esperados (fora do escopo desta feature, mas que MUST aderir ao contrato)

- RF01/RF02: leem `obterPerfilAtivoId()` para montar a chave `treinos:<perfilAtivoId>` antes
  de ler/gravar treinos.
- RF07: é responsável por gravar em `sessoes:<perfil_id>` no formato que
  `existeSessaoEmAndamento` espera (`finalizadaEm: string | null`).
- RF08: lê `obterPerfilAtivoId()` para montar a chave `sessoes:<perfilAtivoId>` (ou uma
  chave de histórico derivada) antes de exibir o histórico.

## Erros

- `criarPerfil` com campo obrigatório ausente/vazio: rejeita a promise com um erro
  identificando o(s) campo(s) faltante(s), para a UI mapear em mensagens por campo (FR-003).
- Nenhuma outra condição de erro é esperada em uso normal (sem rede, sem autenticação).
