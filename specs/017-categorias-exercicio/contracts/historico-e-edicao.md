# Contract: `historico-evolucao.ts` + `explore.tsx` (RF08, RF09b — alterados)

**Feature**: `017-categorias-exercicio`

Contrato interno (serviço + tela — não há API HTTP nesta feature). Usa
`src/utils/categoria-exercicio.ts` (`categoria-exercicio-util.md`).

## `src/services/historico-evolucao.ts` — `obterHistoricoPorPerfil`

```ts
type ItemDeTrabalho = RegistroHistorico & { nomeOriginal: string };
// ...
grupo.itens.push({
  data: sessao.finalizadaEm as string,
  cargaKg: serie.cargaKg,
  reps: serie.reps,
  sessaoId: sessao.id,
  exercicioId: execucao.exercicioId,
  serie: serie.serie,
  categoria: exercicio.categoria, // NOVO — mesmo `exercicio` já resolvido acima
  nomeOriginal: exercicio.nome,
});
// ...
const registros: RegistroHistorico[] = itensOrdenados.map(
  ({ data, cargaKg, reps, sessaoId, exercicioId, serie, categoria }) => ({
    data,
    cargaKg,
    reps,
    sessaoId,
    exercicioId,
    serie,
    categoria, // NOVO
  }),
);
```

- **Pós-condição**: todo `RegistroHistorico` retornado tem `categoria` igual à do
  `ExercicioPlanejado` de origem daquela série — sem cálculo novo, só propagação de
  um campo que já existe em `exercicio` (resolvido pelo cruzamento já existente,
  linhas 42-53 do arquivo atual).
- **Sem mudança na lógica de agrupamento/normalização de nome** (RF08, FR-006 da
  spec 010) — `categoria` é copiada por registro individual, nunca usada como parte
  da chave de agrupamento (ver `research.md`, Decisão 5, sobre grupos com categorias
  mistas).

## `src/app/(tabs)/explore.tsx` — `SecaoExercicio` (histórico, RF08)

- **Exibição de cada registro** (hoje `"{data} · {cargaKg}kg · {reps} reps"`): passa
  a usar `SUFIXO_VALOR[registro.categoria]` no lugar de `"kg"` fixo; quando
  `!exibeCampoPrincipal(registro.categoria)`, o trecho `"{cargaKg}{sufixo} · "` é
  omitido — mostra só `"{data} · {reps} reps"`.

## `src/app/(tabs)/explore.tsx` — edição de registro finalizado (RF09b)

- **Formulário de edição** (dentro de `SecaoExercicio`, campos "Carga (kg)" e
  "Repetições"): mesmo tratamento do RF09a (`execucao-treino-screen.md`) —
  `ROTULO_CAMPO_PRINCIPAL[registro.categoria]` no lugar do texto fixo;
  `exibeCampoPrincipal(registro.categoria)` controla a visibilidade do campo;
  `podeSalvarEdicao` ajustado para não exigir `cargaKg` quando a categoria for
  `'repeticoes'`.
- **`handleSalvarEdicao`/`onEditarRegistro`**: para categoria `'repeticoes'`, envia
  `cargaKg: registro.cargaKg` (valor já existente, não editado) para
  `atualizarSerieDeSessaoFinalizada` — mesma decisão do RF09a (`research.md`,
  Decisão 6), sem mudança de assinatura da função de serviço.
- **Patch local do estado** (`setHistorico` dentro de `handleEditarRegistro`, já
  existente): sem mudança — `categoria` de um registro nunca muda por uma edição de
  série (só `cargaKg`/`reps` são atualizáveis), então o patch continua atualizando
  apenas esses dois campos.

## Sem mudança de assinatura pública

`HistoricoPerfil`, `EvolucaoExercicio` e as funções exportadas de
`sessao-treino-storage.ts` não mudam — só `RegistroHistorico` ganha o campo
`categoria` (`data-model.md`).
