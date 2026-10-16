# Contract: Lista de treinos (`index.tsx`) e histórico (`historico-evolucao.ts`) — alterados

**Feature**: `025-migracao-sessoes-historico-ciclo`

Cobre as duas mudanças de leitura que não afetam a assinatura de nenhuma
função pública consumida fora destes dois arquivos (research.md, Decisões 1
e 7).

## `src/app/(tabs)/index.tsx` (alterado) — FR-012/FR-013, `contracts/` da spec 024 revisado

Substitui as três funções que hoje chamam uma função de sessão **por
treino** (`carregarContagens`, `carregarDatasFinalizacao`,
`carregarSessoesEmAndamento` — esta última introduzida pela spec 024) por
uma única função:

```ts
async function carregarDadosDeSessao(uid: string, lista: Treino[]) {
  try {
    const sessoes = await listarSessoes(uid); // 1 leitura, não 1 por treino

    const contagens: Record<string, number> = {};
    const datas: Record<string, string | null> = {};
    const emAndamento: Record<string, boolean> = {};

    for (const treino of lista) {
      const doTreino = sessoes.filter((s) => s.treinoId === treino.id);
      const finalizadas = doTreino.filter((s) => s.finalizadaEm !== null);
      contagens[treino.id] = finalizadas.length;
      datas[treino.id] = finalizadas.length > 0
        ? finalizadas.reduce((maisRecente, atual) => (atual.finalizadaEm! > maisRecente.finalizadaEm! ? atual : maisRecente)).finalizadaEm
        : null;
      emAndamento[treino.id] = doTreino.some((s) => s.finalizadaEm === null);
    }

    setContagensPorTreino(contagens);
    setDataFinalizacaoPorTreino(datas);
    setEmAndamentoPorTreino(emAndamento);
  } catch (erro) {
    // Não deixa a leitura de sessão derrubar a tela nem a lista de treinos
    // (que já foi definida separadamente por recarregarTreinos, antes desta
    // chamada) — ex.: regras do Firestore ainda não publicadas no Console
    // (contracts/firestore-rules.md) resultam em permission-denied aqui.
    // Loga e cai para valores padrão (plan.md, Technical Context).
    console.error('[index] Falha ao carregar dados de sessão (contagens/datas/indicador):', erro);
    setContagensPorTreino({});
    setDataFinalizacaoPorTreino({});
    setEmAndamentoPorTreino({});
  }
}
```

- **Import alterado**: `@/services/sessao-treino-storage` passa a importar
  só `listarSessoes` (em vez de `contarSessoesFinalizadas`,
  `obterDataUltimaSessaoFinalizada`, `obterSessao`).
- **Chamadas em `recarregarTreinos`/`useEffect` inicial**: as três entradas
  do `Promise.all` (`carregarContagens(...)`, `carregarDatasFinalizacao(...)`,
  `carregarSessoesEmAndamento(...)`) viram **uma** entrada,
  `carregarDadosDeSessao(uid, lista)` — `carregarCicloAtual(uid)` continua
  como uma chamada separada no mesmo `Promise.all` (research.md, Decisão 7,
  "por que não unificar as 2 leituras"), e ganha a mesma resiliência:

  ```ts
  async function carregarCicloAtual(uid: string) {
    try {
      const ciclo = await obterCicloAtual(uid);
      setCicloAtual(ciclo);
      setProgressoCiclo(ciclo ? await calcularProgressoCiclo(uid, ciclo) : null);
    } catch (erro) {
      console.error('[index] Falha ao carregar ciclo de progresso:', erro);
      setCicloAtual(null);
      setProgressoCiclo(null);
    }
  }
  ```

  Como as duas entradas do `Promise.all` são funções independentes (cada
  uma com seu próprio `try/catch` agora), uma rejeitar não impede a outra
  de concluir normalmente, e nenhuma delas propaga rejeição para
  `recarregarTreinos`/o `useEffect` inicial — a lista de treinos em si
  (`treinos`, definida antes deste `Promise.all`) nunca é afetada por uma
  falha de leitura de sessão ou de ciclo.
- **Sem mudança nenhuma** no `renderItem`/`TreinoListItem` — os três
  `Record`s resultantes (`contagensPorTreino`, `dataFinalizacaoPorTreino`,
  `emAndamentoPorTreino`) têm exatamente o mesmo formato de antes, só a
  forma de populá-los mudou.
- **`useFocusEffect`** (linha 124-129 hoje): continua chamando só
  `recarregarTreinos()`, sem alteração — mesmo mecanismo de atualização por
  foco já usado pela spec 024.

## `src/services/historico-evolucao.ts` (alterado) — FR-009/FR-010/FR-011

`construirRegistrosBrutos` (função privada, compartilhada por
`obterHistoricoPorPerfil` e `obterHistoricoPorData`) deixa de resolver
`treino.nome`/`exercicio.nome`/`exercicio.categoria` cruzando com o `Treino`
de origem (`treinosPorId.get(sessao.treinoId)` +
`treino.exercicios.find(...)`) e passa a ler diretamente do snapshot da
própria sessão:

```ts
function construirRegistrosBrutos(sessoesFinalizadas: SessaoTreino[]): RegistroBruto[] {
  const registros: RegistroBruto[] = [];

  for (const sessao of sessoesFinalizadas) {
    for (const execucao of sessao.execucoes) {
      const exercicio = sessao.exerciciosSnapshot.find((item) => item.id === execucao.exercicioId);
      if (!exercicio) {
        console.warn(/* mesmo warning de hoje, adaptado */);
        continue;
      }
      for (const serie of execucao.seriesRealizadas) {
        registros.push({
          data: sessao.finalizadaEm as string,
          sessaoId: sessao.id,
          treinoId: sessao.treinoId,
          treinoNome: sessao.treinoNomeSnapshot,
          exercicioId: execucao.exercicioId,
          exercicioNome: exercicio.nome,
          serie: serie.serie,
          cargaKg: serie.cargaKg,
          reps: serie.reps,
          categoria: exercicio.categoria,
        });
      }
    }
  }

  return registros;
}
```

- **Parâmetro removido**: `construirRegistrosBrutos` não recebe mais
  `treinos: Treino[]` — só `sessoesFinalizadas`. Isso é **interno** a
  `historico-evolucao.ts` (função não exportada), não afeta
  `obterHistoricoPorPerfil`/`obterHistoricoPorData` (ainda exportadas com a
  mesma assinatura) nem `explore.tsx` (único consumidor externo).
- **`listarTreinos` continua sendo chamado** por
  `obterHistoricoPorPerfil`/`obterHistoricoPorData` — só não é mais
  repassado para `construirRegistrosBrutos`. Continua necessário para
  semear o "universo de exercícios nunca registrados" (FR-011, RF08 FR-009
  original), que é resolvido separadamente, como hoje (`gruposPorChave`
  semeado a partir de `treinos` antes de cruzar com os registros).
- **`obterHistoricoPorData`**: mesma mudança — `construirRegistrosBrutos`
  chamado sem `treinos`; resto da função (agrupamento por sessão/dia)
  inalterado, já que não dependia de `Treino` para mais nada além do que
  `construirRegistrosBrutos` já resolvia.

## `src/app/(tabs)/explore.tsx` (sem mudança)

Único consumidor de `obterHistoricoPorPerfil`/`obterHistoricoPorData`/
`atualizarSerieDeSessaoFinalizada` — nenhuma das três muda de assinatura;
nenhuma linha deste arquivo precisa mudar.
