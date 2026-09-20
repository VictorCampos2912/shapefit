# Contract: `historico-evolucao.ts` (novo), `sessao-treino-storage.ts` (extensão) e `explore.tsx` (reescrita)

**Feature**: 010-historico-evolucao-carga | **Date**: 2026-09-20

Não altera nenhum contrato já documentado por features anteriores
([../../005-avancar-series-exercicios/contracts/sessao-treino-storage.md](../../005-avancar-series-exercicios/contracts/sessao-treino-storage.md),
[../../009-salvar-sessao-treino/contracts/sessao-treino-storage.md](../../009-salvar-sessao-treino/contracts/sessao-treino-storage.md)) —
apenas adiciona uma função de leitura a `sessao-treino-storage.ts` e introduz um
serviço/utilitário/tipos inteiramente novos.

## Nova função em `sessao-treino-storage.ts`

```ts
export async function listarSessoesFinalizadas(perfilId: string): Promise<SessaoTreino[]>
```

| Entrada | Resultado |
|---|---|
| Perfil com uma ou mais sessões com `finalizadaEm !== null` (de quaisquer treinos) | Array com todas essas sessões, em nenhuma ordem específica garantida (a ordenação por data é responsabilidade de quem consome, ver `historico-evolucao.ts`) |
| Perfil sem nenhuma sessão, ou apenas sessões com `finalizadaEm === null` | `[]` |

Não lança erro em nenhum caso. Não modifica `sessoes:${perfilId}` (somente leitura).

## Novo utilitário `src/utils/normalizar-nome-exercicio.ts`

```ts
export function normalizarNomeExercicio(nome: string): string
```

| Entrada | Saída |
|---|---|
| `"Supino Reto"` | `"supino reto"` |
| `"  supino   reto  "` | `"supino reto"` |
| `"SUPINO RETO"` | `"supino reto"` |
| `"Tríceps"` | `"tríceps"` (acentuação preservada — nunca normalizada, spec.md FR-006) |

Função pura: mesma entrada sempre produz a mesma saída; nenhum efeito colateral,
nenhuma chamada assíncrona.

## Novo serviço `src/services/historico-evolucao.ts`

```ts
export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil>
```

Ver [../data-model.md](../data-model.md) para o algoritmo completo (passos 1-7) e para
a definição de `HistoricoPerfil`/`EvolucaoExercicio`/`RegistroHistorico`
(`src/types/historico.ts`).

| Cenário de entrada | Resultado |
|---|---|
| Perfil sem nenhuma sessão finalizada (com ou sem treinos importados) | `{ temSessoesFinalizadas: false }` | FR-010 |
| Perfil com sessões finalizadas, mas um exercício de algum treino nunca aparece em nenhuma delas | `{ temSessoesFinalizadas: true, evolucoes }`, com um item cujo `registros` é `[]` para esse exercício | FR-009 |
| Duas sessões (de treinos diferentes) têm exercícios cujo nome normalizado coincide | Registros de ambas aparecem no mesmo item de `evolucoes` (mesmo `nomeExibido`, `registros` combinados e ordenados) | FR-005, FR-006 |
| Uma sessão finalizada referencia um `treinoId` que não existe em `listarTreinos(perfilId)`, ou um `exercicioId` que não existe nos exercícios desse treino | Essa série específica é omitida de `evolucoes`; `console.warn` é emitido identificando `perfilId`, `treinoId`, `exercicioId` e `sessaoId` envolvidos | FR-013, FR-014 |

Não exporta nenhuma função de escrita. Não lança erro em nenhum caso previsto — os
únicos `throw` possíveis viriam de `listarTreinos`/`listarSessoesFinalizadas`
propagando falhas de `AsyncStorage` (já existentes, fora do escopo desta feature).

## Novos tipos `src/types/historico.ts`

```ts
export type RegistroHistorico = {
  data: string;    // ISO 8601 — finalizadaEm da sessão de origem
  cargaKg: number;
  reps: number;
};

export type EvolucaoExercicio = {
  nomeExibido: string;
  registros: RegistroHistorico[]; // mais recente -> mais antigo
};

export type HistoricoPerfil =
  | { temSessoesFinalizadas: false }
  | { temSessoesFinalizadas: true; evolucoes: EvolucaoExercicio[] };
```

## Reescrita de `src/app/(tabs)/explore.tsx`

Substitui integralmente o conteúdo boilerplate do template Expo (mesmo padrão do RF02
na aba "Home" — nenhuma mudança em `app-tabs.tsx`/`app-tabs.web.tsx`, aba continua
"Explore"). Reaproveita o componente `Collapsible` já importado pelo boilerplate
original (research.md, Decisão 10).

```ts
const { perfilAtivo } = usePerfilAtivo();
const [historico, setHistorico] = useState<HistoricoPerfil | null>(null); // null = carregando

async function recarregarHistorico() {
  if (!perfilAtivo) return;
  setHistorico(await obterHistoricoPorPerfil(perfilAtivo.id));
}

useEffect(() => {
  recarregarHistorico();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mesmo padrão do RF02 (index.tsx): recarrega só por id do perfil ativo
}, [perfilAtivo?.id]);

useFocusEffect(
  useCallback(() => {
    recarregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilAtivo?.id]),
);
```

| Estado de `historico` | Renderização |
|---|---|
| `null` (carregando) | Mesmo padrão de "Carregando..." já usado por `[treinoId].tsx` |
| `{ temSessoesFinalizadas: false }` | Bloco de estado vazio geral (mesmo padrão visual de `ThemedView type="backgroundElement"` + `ThemedText` já usado em `(tabs)/index.tsx` para "Nenhum treino importado ainda") — FR-010 |
| `{ temSessoesFinalizadas: true, evolucoes }` | `FlatList`/`.map` sobre `evolucoes`, um `Collapsible` por item, título = `nomeExibido`; dentro de cada um: se `registros.length === 0`, mensagem "Nenhum registro para este exercício ainda" (FR-009); caso contrário, uma linha por registro exibindo data formatada, carga (kg) e reps |

## Fora de escopo desta feature (reforçando o já documentado na spec)

- Qualquer representação gráfica dos dados: decisão já registrada (sem gráfico no
  MVP).
- Edição de um registro a partir desta tela: RF09b (requisito separado, depende deste
  RF08 já existir).
- Qualquer alteração em `app-tabs.tsx`/`app-tabs.web.tsx` (rótulo/ícone da aba
  "Explore" permanecem inalterados).
- Qualquer nova rota de navegação (`/historico/...` ou similar) — tudo cabe na própria
  aba "Explore" (research.md, Decisão 10).
