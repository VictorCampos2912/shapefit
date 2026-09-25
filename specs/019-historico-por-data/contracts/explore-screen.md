# Contract: `src/app/(tabs)/explore.tsx` (alternância de visão — alterado)

**Feature**: `019-historico-por-data`

Contrato interno (estado/UI de tela — não há API HTTP nesta feature).

## Novo estado

```ts
const [visao, setVisao] = useState<'exercicio' | 'data'>('exercicio');
const [historicoPorData, setHistoricoPorData] = useState<HistoricoPorData | null>(null);
```

`recarregarHistorico` (já existente) passa a carregar as duas visões em paralelo:

```ts
async function recarregarHistorico() {
  if (!perfilAtivo) return;
  const [porExercicio, porData] = await Promise.all([
    obterHistoricoPorPerfil(perfilAtivo.id),
    obterHistoricoPorData(perfilAtivo.id),
  ]);
  setHistorico(porExercicio);
  setHistoricoPorData(porData);
}
```

- **Sem mudança** nos dois `useEffect`/`useFocusEffect` que já chamam
  `recarregarHistorico` — mesmos gatilhos (mudança de perfil, foco da tela).

## Controle de alternância (FR-001)

Logo abaixo de `<ThemedText type="subtitle">Histórico de evolução</ThemedText>`:

```tsx
<View style={styles.linhaAlternanciaVisao}>
  <Pressable onPress={() => setVisao('exercicio')}>
    <ThemedText type={visao === 'exercicio' ? 'linkPrimary' : 'link'}>Por exercício</ThemedText>
  </Pressable>
  <Pressable onPress={() => setVisao('data')}>
    <ThemedText type={visao === 'data' ? 'linkPrimary' : 'link'}>Por data</ThemedText>
  </Pressable>
</View>
```

(Estilo exato — cores, espaçamento — fica a cargo de `/speckit.tasks`/implementação;
o contrato aqui é o comportamento: dois controles, um sempre "ativo", nunca os dois
ao mesmo tempo, nunca nenhum.)

## Renderização condicional

```tsx
{visao === 'exercicio' && historico !== null && (/* FlatList já existente, RF08 — sem mudança */)}
{visao === 'data' && historicoPorData !== null && (
  <FlatList
    data={historicoPorData.temSessoesFinalizadas ? historicoPorData.dias : []}
    keyExtractor={(dia) => dia.chaveDia}
    renderItem={({ item }) => <SecaoDia dia={item} />}
  />
)}
{visao === 'data' && historicoPorData !== null && !historicoPorData.temSessoesFinalizadas && (
  /* mesma mensagem de "sem registros" já usada pela visão por exercício, FR-006 */
)}
```

## `SecaoDia` (novo, inline — `research.md`, Decisão 5)

```tsx
import { ROTULO_CAMPO_PRINCIPAL, SUFIXO_VALOR, exibeCampoPrincipal } from '@/utils/categoria-exercicio';

function SecaoDia({ dia }: { dia: DiaHistorico }) {
  return (
    <ThemedView style={styles.diaHistorico}>
      <ThemedText type="smallBold">{formatarData(dia.dataReferencia)}</ThemedText>
      {dia.blocos.map((bloco) => (
        <ThemedView key={bloco.sessaoId} style={styles.blocoSessao}>
          <ThemedText type="default">{bloco.treinoNome}</ThemedText>
          {bloco.exercicios.map((exercicio) => (
            <ThemedText key={exercicio.exercicioNome} type="small" themeColor="textSecondary">
              {exercicio.exercicioNome}:{' '}
              {exercicio.registros
                .map((r) =>
                  exibeCampoPrincipal(exercicio.categoria)
                    ? `${r.cargaKg}${SUFIXO_VALOR[exercicio.categoria]}×${r.reps}`
                    : `${r.reps} reps`,
                )
                .join(', ')}
            </ThemedText>
          ))}
        </ThemedView>
      ))}
    </ThemedView>
  );
}
```

- **Somente leitura** (spec, Assumptions) — nenhum `Pressable`/`TextInput`/edição;
  reaproveita `formatarData` já existente no arquivo (`new Date(iso).toLocaleString()`).
- **`dia.dataReferencia`** (nunca `dia.chaveDia`) é o que é passado para
  `formatarData` — evita o problema de fuso horário descrito em `research.md`,
  Decisão 2.
- **Unidade por categoria (RF17, `specs/017-categorias-exercicio/`, já
  implementada)**: `exercicio.categoria` (mesmo valor para todas as séries daquele
  exercício naquela sessão) decide o sufixo via `SUFIXO_VALOR` e se o valor
  principal aparece via `exibeCampoPrincipal` — mesmo utilitário
  (`src/utils/categoria-exercicio.ts`) já reaproveitado pela visão "Por exercício"
  (RF08) e pelas telas de execução/edição (RF03/04, RF09a, RF09b) pela RF17; esta
  visão ("Por data") **não** tinha essa integração no escopo original da spec 019 —
  adicionada agora porque a RF17 já está implementada. Para `categoria ===
  'repeticoes'`, a linha mostra só `"{reps} reps"`, sem nenhum valor de
  carga/tempo/distância — mesmo comportamento das outras telas.
- **Formato de cada linha de exercício**: um valor por série, sem agregar (FR-005)
  — o exemplo acima junta várias séries numa linha só por compacidade visual
  (`"40kg×10, 40kg×10, 35kg×8"` para peso, ou `"12 reps, 10 reps"` para
  repetições), mas cada valor individual continua visível, não resumido/calculado
  (média, por exemplo).

## Sem mudança de assinatura pública

`SecaoExercicio` (RF08/RF09b) e `handleEditarRegistro` não mudam — a visão "Por
data" não introduz nenhum fluxo de edição.
