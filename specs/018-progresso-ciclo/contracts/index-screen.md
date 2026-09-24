# Contract: `src/app/(tabs)/index.tsx` (Meus Treinos — alterado)

**Feature**: `018-progresso-ciclo`

Contrato interno (props/estado de tela — não há API HTTP nesta feature).

## Novo estado carregado

```ts
const [cicloAtual, setCicloAtual] = useState<CicloTreino | null>(null);
const [progressoCiclo, setProgressoCiclo] = useState<{
  totalFinalizado: number;
  porTreino: Record<string, number>;
} | null>(null);
```

Carregado em paralelo a `carregarContagens` já existente (mesmo `useEffect`/
`recarregarTreinos`): `obterCicloAtual(perfilId)` e, se não for `null`,
`calcularProgressoCiclo(perfilId, ciclo)` (`ciclo-treino-storage.md`).

## `TreinoListItem` — indicador por treino (FR-006)

Para cada `item` renderizado da lista, quando `cicloAtual?.treinoIds.includes(item.id)`:

```tsx
<ProgressRing
  progress={cotaComoFracao(
    progressoCiclo.porTreino[item.id] ?? 0,
    cicloAtual.cotaPorTreinoId[item.id],
  )}
  size={24}
  strokeWidth={3}
/>
```

- Exibido ao lado do contador de sessões já existente (`qtdSessoesFinalizadas`),
  não no lugar dele.
- Treinos que **não** pertencem a `cicloAtual.treinoIds` (fora de um lote, ou
  pertencentes a um ciclo já superado por um mais novo) **não** exibem nenhum anel —
  mesmo comportamento visual de hoje, antes desta feature.

## Banner de aviso (FR-008)

```tsx
{cicloAtual && progressoCiclo && progressoCiclo.totalFinalizado >= 40 && (
  <ThemedView type="warningBackground" style={styles.avisoTrocarTreino}>
    <ThemedText type="smallBold" themeColor="warning">
      Hora de trocar o treino — {progressoCiclo.totalFinalizado} sessões já realizadas
    </ThemedText>
  </ThemedView>
)}
```

- Posição: topo da tela "Meus Treinos", acima da `FlatList` de treinos — mesmo
  padrão visual já usado por outros banners de estado no app (ex.: mensagem de
  "Parabéns" em `[treinoId].tsx`, adaptado ao tipo `warningBackground` já existente
  no tema).
- Continua visível em toda visita à tela enquanto `cicloAtual` for o mesmo e
  `totalFinalizado >= 40` — desaparece somente quando um novo ciclo é criado
  (FR-009), passando a exibir o novo `cicloAtual` com `totalFinalizado` reiniciado
  a partir de 0 para o novo lote.

## Sem mudança de assinatura pública

Nenhum prop novo em componentes consumidos por outras telas; `TreinoListItem` ganha
o `ProgressRing` condicional internamente (ou recebe um prop opcional
`progressoCiclo?: number | null` — decisão de implementação livre para
`/speckit.tasks`, desde que preserve o contrato de props já definido pela spec 016
(`dataFinalizacao`, `nomeDuplicado`) sem conflito.
