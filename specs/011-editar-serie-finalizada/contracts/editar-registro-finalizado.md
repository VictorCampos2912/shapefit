# Contract: `sessao-treino-storage.ts` (extensão), `historico-evolucao.ts` (extensão), `explore.tsx` (UI) e `sanitizar-serie.ts` (novo utilitário)

**Feature**: 011-editar-serie-finalizada | **Date**: 2026-09-20

Estende os contratos já existentes em
[../../009-salvar-sessao-treino/contracts/sessao-treino-storage.md](../../009-salvar-sessao-treino/contracts/sessao-treino-storage.md)
(RF07) e
[../../010-historico-evolucao-carga/contracts/historico-evolucao.md](../../010-historico-evolucao-carga/contracts/historico-evolucao.md)
(RF08). Não repete o que já está documentado lá — apenas o que esta feature altera ou
adiciona.

## Novo utilitário `src/utils/sanitizar-serie.ts`

```ts
export function sanitizarCarga(valor: string): string
export function sanitizarReps(valor: string): string
```

Movidas de `src/components/treino/exercicio-execucao.tsx` (RF04/RF09a), sem nenhuma
alteração de comportamento — mesmo corpo de função, apenas exportadas e re-importadas
de volta por `exercicio-execucao.tsx`.

## Nova função em `sessao-treino-storage.ts`

```ts
export async function atualizarSerieDeSessaoFinalizada(params: {
  perfilId: string;
  sessaoId: string;
  exercicioId: string;
  serie: number;
  novaCargaKg: number;
  novosReps: number;
}): Promise<SessaoTreino>
```

| Entrada | Resultado | FR relacionado |
|---|---|---|
| Sessão com `id === sessaoId` não existe | Lança erro (`Nenhuma sessão encontrada com id ${sessaoId} para o perfil ${perfilId}`) | — |
| Sessão existe, mas `finalizadaEm === null` (ainda em andamento) | Lança erro, nenhuma escrita ocorre | Sugestão de robustez do usuário; research.md Decisão 3 |
| Sessão existe e está finalizada, mas nenhuma `ExecucaoExercicio` com esse `exercicioId` | Lança erro (mesmo padrão de `atualizarSerieRealizada`) | — |
| Execução existe, mas nenhuma `SerieRealizada` com esse número | Lança erro (mesmo padrão de `atualizarSerieRealizada`) | — |
| Sessão finalizada, execução e série encontradas | Grava `cargaKg`/`reps` da série; `finalizadaEm` e todo o restante da sessão permanecem inalterados; retorna a sessão atualizada | FR-006, FR-007 |

## Extensão de `RegistroHistorico` (`src/types/historico.ts`)

```ts
export type RegistroHistorico = {
  data: string;
  cargaKg: number;
  reps: number;
  sessaoId: string;     // NOVO
  exercicioId: string;  // NOVO
  serie: number;         // NOVO
};
```

`historico-evolucao.ts` passa a incluir esses três campos ao projetar cada registro —
ver [../data-model.md](../data-model.md) para o algoritmo completo. Nenhuma mudança de
assinatura em `obterHistoricoPorPerfil`.

## Extensão de UI em `src/app/(tabs)/explore.tsx`

```ts
// Dentro do componente SecaoExercicio (já existente, RF08):
const [edicaoAtiva, setEdicaoAtiva] = useState<{
  sessaoId: string;
  exercicioId: string;
  serie: number;
  cargaKg: string;
  reps: string;
} | null>(null);
```

| Evento | Efeito |
|---|---|
| Usuário toca em um `registro` da lista | `setEdicaoAtiva({ sessaoId: registro.sessaoId, exercicioId: registro.exercicioId, serie: registro.serie, cargaKg: String(registro.cargaKg), reps: String(registro.reps) })` |
| Usuário digita nos campos de carga/reps | `onChangeText` aplica `sanitizarCarga`/`sanitizarReps` (novo utilitário) sobre o valor digitado, atualizando `edicaoAtiva` |
| Botão "Salvar edição" | Desabilitado enquanto `cargaKg`/`reps` de `edicaoAtiva` estiverem vazios ou inválidos — mesma regra `podeSalvarEdicao` já usada pelo RF09a |
| Usuário toca em "Salvar edição" com valores válidos | Dispara `Alert.alert('Confirmar alteração', ...)` com "Cancelar" e "Salvar" — mesmo padrão do RF09a |
| Usuário cancela no `Alert.alert` | `edicaoAtiva` volta a `null`; nenhuma chamada de escrita |
| Usuário confirma no `Alert.alert` | Chama `onEditarRegistro({ sessaoId, exercicioId, serie, cargaKg: Number(...), reps: Number(...) })` (prop recebida da tela pai); após resolver, `edicaoAtiva` volta a `null` |

```ts
// Em HistoricoScreen (tela pai, já existente, RF08):
async function handleEditarRegistro(params: {
  sessaoId: string;
  exercicioId: string;
  serie: number;
  cargaKg: number;
  reps: number;
}) {
  if (!perfilAtivo) return;
  const sessao = await atualizarSerieDeSessaoFinalizada({
    perfilId: perfilAtivo.id,
    sessaoId: params.sessaoId,
    exercicioId: params.exercicioId,
    serie: params.serie,
    novaCargaKg: params.cargaKg,
    novosReps: params.reps,
  });
  const execucao = sessao.execucoes.find((item) => item.exercicioId === params.exercicioId);
  const serieAtualizada = execucao?.seriesRealizadas.find((item) => item.serie === params.serie);
  if (!serieAtualizada) return;

  // Patch pontual do registro editado dentro de `historico` — research.md, Decisão 6.
  setHistorico((atual) => {
    if (!atual || !atual.temSessoesFinalizadas) return atual;
    return {
      ...atual,
      evolucoes: atual.evolucoes.map((evolucao) => ({
        ...evolucao,
        registros: evolucao.registros.map((registro) =>
          registro.sessaoId === params.sessaoId &&
          registro.exercicioId === params.exercicioId &&
          registro.serie === params.serie
            ? { ...registro, cargaKg: serieAtualizada.cargaKg, reps: serieAtualizada.reps }
            : registro,
        ),
      })),
    };
  });
}
```

## Comportamento observável (novo, em relação ao RF08/RF09a)

| Ação do usuário | Resultado | FR relacionado |
|---|---|---|
| Toca em um registro do histórico de uma sessão finalizada | Campos de carga/reps daquele registro tornam-se editáveis, pré-preenchidos com os valores atuais | FR-001 |
| Confirma valores inválidos (campo vazio/inválido) | Botão "Salvar edição" permanece desabilitado; nenhum `Alert.alert` é exibido | FR-004 |
| Toca em "Salvar edição" com valores válidos | `Alert.alert` de confirmação aparece | FR-005 |
| Confirma no `Alert.alert` | Valor é persistido (`atualizarSerieDeSessaoFinalizada`) e refletido imediatamente na tela, sem recarregar manualmente | FR-006, FR-010 |
| Cancela no `Alert.alert` | Nenhuma alteração persistida; valor original continua exibido | FR-009 |
| Edita um registro de uma sessão finalizada | `finalizadaEm` dessa sessão permanece exatamente o mesmo; a sessão continua contando como finalizada em qualquer lugar do app que dependa disso (RF02/RF07/RF10) | FR-007, FR-008 |
| Duas sessões finalizadas distintas do mesmo treino, cada uma com um registro do mesmo exercício | Editar o registro de uma não afeta a outra; a ordenação dos dois registros no grupo do histórico não muda (data de cada um permanece a mesma) | Edge Case da spec |

## Fora de escopo desta feature (reforçando o já documentado na spec)

- Exclusão de um registro, ou criação de um registro extra além dos já existentes.
- Qualquer efeito sobre o agrupamento, a ordenação ou o `nomeExibido` calculados pelo
  RF08 — nenhum dos dois campos que essas decisões usam (`data`, nome do exercício) é
  alterado por esta feature.
- Edição de registros de sessões ainda em andamento — esse caminho continua sendo
  exclusivamente o do RF09a, a partir da tela de execução.
